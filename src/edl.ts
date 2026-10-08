import type {Effect} from "./types";

export type EdlClip = {effect: Effect; file: string};

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

export const toTimecode = (frames: number, fps: number): string => {
  const base = Math.round(fps);
  const f = frames % base;
  const totalSec = Math.floor(frames / base);
  return `${pad(Math.floor(totalSec / 3600))}:${pad(Math.floor(totalSec / 60) % 60)}:${pad(totalSec % 60)}:${pad(f)}`;
};

export const timecodeToFrames = (tc: string, fps: number): number => {
  const m = /^(\d+):(\d{2}):(\d{2})[:;](\d{2})$/.exec(tc);
  if (!m) throw new Error(`Invalid timecode "${tc}" (expected HH:MM:SS:FF)`);
  const base = Math.round(fps);
  return ((Number(m[1]) * 60 + Number(m[2])) * 60 + Number(m[3])) * base + Number(m[4]);
};

// CMX3600 has a single video track, so overlapping effects are split into lanes (one EDL per lane).
export const assignLanes = (clips: EdlClip[]): EdlClip[][] => {
  const lanes: {end: number; items: EdlClip[]}[] = [];
  const sorted = [...clips].sort((a, b) => a.effect.startFrame - b.effect.startFrame);
  for (const clip of sorted) {
    const lane = lanes.find((l) => l.end <= clip.effect.startFrame);
    const end = clip.effect.startFrame + clip.effect.durationInFrames;
    if (lane) {
      lane.items.push(clip);
      lane.end = end;
    } else {
      lanes.push({end, items: [clip]});
    }
  }
  return lanes.map((l) => l.items);
};

export const buildEdl = (title: string, clips: EdlClip[], fps: number, startTc: string): string => {
  const offset = timecodeToFrames(startTc, fps);
  const lines = [`TITLE: ${title}`, "FCM: NON-DROP FRAME", ""];
  clips.forEach(({effect, file}, i) => {
    const recIn = offset + effect.startFrame;
    const recOut = recIn + effect.durationInFrames;
    // Resolve links EDL events to media by reel name, so the reel is the clip's file name (unique per clip).
    const reel = file.replace(/\.[^.]+$/, "");
    lines.push(
      `${pad(i + 1, 3)}  ${reel.padEnd(8)}  V     C        ` +
        `${toTimecode(0, fps)} ${toTimecode(effect.durationInFrames, fps)} ` +
        `${toTimecode(recIn, fps)} ${toTimecode(recOut, fps)}`,
      `* FROM CLIP NAME: ${file}`,
      `* COMMENT: ${effect.id} (${effect.effectType})`,
      "",
    );
  });
  return lines.join("\n");
};

const rational = (frames: number, fps: number) => (frames === 0 ? "0s" : `${frames}/${Math.round(fps)}s`);
const xmlEscape = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// FCPXML carries absolute media paths and all tracks in one file, so Resolve links the clips without a media-pool match.
export const buildFcpxml = (
  title: string,
  lanes: EdlClip[][],
  fps: number,
  startTc: string,
  dir: string,
  totalFrames: number,
): string => {
  const offset = timecodeToFrames(startTc, fps);
  const base = Math.round(fps);
  const all = lanes.flat();
  const assets = all
    .map(
      ({effect, file}, i) =>
        `    <asset id="a${i + 1}" name="${xmlEscape(file)}" start="0s" duration="${rational(effect.durationInFrames, fps)}" hasVideo="1" format="r1" src="${xmlEscape(
          "file://" + encodeURI(`${dir}/${file}`),
        )}"/>`,
    )
    .join("\n");
  let n = 0;
  const clips = lanes
    .map((lane, li) =>
      lane
        .map(({effect, file}) => {
          n++;
          return `        <asset-clip ref="a${n}" lane="${li + 1}" name="${xmlEscape(file)}" offset="${rational(offset + effect.startFrame, fps)}" start="0s" duration="${rational(effect.durationInFrames, fps)}"/>`;
        })
        .join("\n"),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<fcpxml version="1.8">
  <resources>
    <format id="r1" name="FFVideoFormat1080p${base}" frameDuration="1/${base}s" width="1920" height="1080"/>
${assets}
  </resources>
  <library>
    <event name="${xmlEscape(title)}">
      <project name="${xmlEscape(title)}">
        <sequence format="r1" duration="${rational(totalFrames, fps)}" tcStart="${rational(offset, fps)}" tcFormat="NDF">
          <spine>
            <gap name="Gap" offset="${rational(offset, fps)}" start="${rational(offset, fps)}" duration="${rational(totalFrames, fps)}">
${clips}
            </gap>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
`;
};
