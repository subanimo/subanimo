// Rendering core shared by the CLI (render.ts) and the local web app (server.ts).
import fs from "node:fs";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {ensureBrowser, renderMedia, renderStill, selectComposition, type CancelSignal} from "@remotion/renderer";
import {assignLanes, buildEdl, buildFcpxml, type EdlClip} from "./edl";
import type {EffectClipProps, VideoData} from "./types";

export const ROOT = path.resolve(__dirname, "..");
const MAIN_COMPOSITION = "MainVideo";
const CLIP_COMPOSITION = "EffectClip";
const CHROME = {gl: "angle" as const};

export const toFile = (id: string) => `${id.replace(/[^a-zA-Z0-9_-]/g, "_")}.mov`;

export const makeBundle = (onProgress?: (percent: number) => void) =>
  bundle({
    entryPoint: path.join(ROOT, "src/index.ts"),
    publicDir: path.join(ROOT, "public"),
    onProgress: onProgress ?? (() => undefined),
  });

/** Downloads Remotion's headless Chrome on first use (about 170 MB). */
export const ensureChrome = (onProgress?: (percent: number) => void) =>
  ensureBrowser({
    onBrowserDownload: () => ({
      version: null,
      onProgress: ({percent}) => onProgress?.(percent),
    }),
  });

const asProps = (v: unknown) => v as Record<string, unknown>;

export type PreviewOptions = {serveUrl: string; data: VideoData; dir: string; frame?: number; onEach?: (file: string, index: number, total: number) => void};

/** One PNG per effect (at 60% of its duration, or `frame`) to check the look quickly. */
export async function renderPreviews({serveUrl, data, dir, frame, onEach}: PreviewOptions): Promise<string[]> {
  fs.mkdirSync(dir, {recursive: true});
  const out: string[] = [];
  for (const [i, effect] of data.effects.entries()) {
    const props = asProps({effect, fps: data.fps} satisfies EffectClipProps);
    const composition = await selectComposition({serveUrl, id: CLIP_COMPOSITION, inputProps: props});
    const output = path.join(dir, toFile(effect.id).replace(/\.mov$/, ".png"));
    const at = Math.min(effect.durationInFrames - 1, frame ?? Math.floor(effect.durationInFrames * 0.6));
    await renderStill({composition, serveUrl, inputProps: props, frame: at, imageFormat: "png", output, chromiumOptions: CHROME});
    out.push(output);
    onEach?.(output, i, data.effects.length);
  }
  return out;
}

export async function renderFullVideo(serveUrl: string, data: VideoData, outputLocation: string, onProgress?: (p: number) => void, cancelSignal?: CancelSignal) {
  const composition = await selectComposition({serveUrl, id: MAIN_COMPOSITION, inputProps: asProps(data)});
  await renderMedia({composition, serveUrl, codec: "h264", outputLocation, inputProps: asProps(data), chromiumOptions: CHROME, cancelSignal, onProgress: ({progress}) => onProgress?.(progress)});
}

export type ClipEvent =
  | {type: "start" | "skip" | "done"; index: number; total: number; id: string; file: string}
  | {type: "progress"; index: number; total: number; id: string; file: string; progress: number}
  | {type: "retry"; index: number; total: number; id: string; file: string; attempt: number; reason: string};

export type ClipOptions = {serveUrl: string; data: VideoData; dir: string; resume?: boolean; onEvent?: (e: ClipEvent) => void; cancelSignal?: CancelSignal};

const MAX_ATTEMPTS = 5;

/** One transparent ProRes 4444 clip per effect, for overlaying in DaVinci Resolve. */
export async function renderClips({serveUrl, data, dir, resume, onEvent, cancelSignal}: ClipOptions): Promise<EdlClip[]> {
  fs.mkdirSync(dir, {recursive: true});
  const clips: EdlClip[] = [];
  const total = data.effects.length;
  for (const [index, effect] of data.effects.entries()) {
    const file = toFile(effect.id);
    const base = {index, total, id: effect.id, file};
    const target = path.join(dir, file);
    if (resume && fs.existsSync(target) && fs.statSync(target).size > 0) {
      onEvent?.({type: "skip", ...base});
      clips.push({effect, file});
      continue;
    }
    onEvent?.({type: "start", ...base});
    const props = asProps({effect, fps: data.fps} satisfies EffectClipProps);
    const composition = await selectComposition({serveUrl, id: CLIP_COMPOSITION, inputProps: props});
    // WebGL-based effects occasionally crash the headless page; retry with less parallelism.
    for (let attempt = 1; ; attempt++) {
      try {
        await renderMedia({
          composition,
          serveUrl,
          codec: "prores",
          proResProfile: "4444",
          pixelFormat: "yuva444p10le",
          imageFormat: "png",
          outputLocation: target,
          inputProps: props,
          concurrency: attempt === 1 ? 2 : 1,
          chromiumOptions: CHROME,
          cancelSignal,
          onProgress: ({progress}) => onEvent?.({type: "progress", ...base, progress}),
        });
        break;
      } catch (e) {
        const reason = e instanceof Error ? e.message.split("\n")[0] : String(e);
        if (/cancel/i.test(reason) || attempt >= MAX_ATTEMPTS) throw new Error(`Rendering "${effect.id}" failed: ${reason}`);
        onEvent?.({type: "retry", ...base, attempt, reason});
      }
    }
    onEvent?.({type: "done", ...base});
    clips.push({effect, file});
  }
  return clips;
}

export const clipsFromExisting = (data: VideoData): EdlClip[] => data.effects.map((effect) => ({effect, file: toFile(effect.id)}));

/** Writes one EDL per track plus a single FCPXML with absolute paths. */
export function writeTimelines(dir: string, clips: EdlClip[], data: VideoData, startTc = "01:00:00:00"): {edls: string[]; fcpxml: string} {
  const lanes = assignLanes(clips);
  const edls = lanes.map((lane, i) => {
    const file = path.join(dir, `timeline-V${i + 1}.edl`);
    fs.writeFileSync(file, buildEdl(`Subanimo V${i + 1}`, lane, data.fps, startTc));
    return file;
  });
  const fcpxml = path.join(dir, "timeline.fcpxml");
  fs.writeFileSync(fcpxml, buildFcpxml("Subanimo", lanes, data.fps, startTc, dir, data.durationInFrames));
  return {edls, fcpxml};
}
