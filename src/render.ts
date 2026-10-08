#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {parseSrt} from "./srt";
import {buildPrompt, MODELS, Model} from "./prompts";
import {CATALOG, PRESENTATIONS, STYLES, VideoData} from "./types";
import {clipsFromExisting, ensureChrome, makeBundle, renderClips, renderFullVideo, renderPreviews, writeTimelines} from "./engine";
import {extractJson, Msg, SrtContext, validateVideoData, ValidationError} from "./validate";

// Messages follow the system language (Turkish if LANG starts with "tr", otherwise English).
const LANG: keyof Msg = /^tr/i.test(process.env.LANG ?? process.env.LC_ALL ?? "") ? "tr" : "en";

const die = (msg: string): never => {
  console.error(`Error: ${msg}`);
  process.exit(1);
};

const loadData = (arg: string | undefined, srtFile?: string, fpsOverride?: number): VideoData => {
  if (!arg) die("Usage: subanimo <video-data.json>");
  const file = path.resolve(process.cwd(), arg as string);
  if (!fs.existsSync(file)) die(`File not found: ${file}`);
  let raw: unknown;
  try {
    // Tolerates a ```json fence or a sentence around the object (typical chat output).
    raw = extractJson(fs.readFileSync(file, "utf-8"));
    if (raw === undefined) die(`No JSON object found in ${file}`);
  } catch (e) {
    return die(`Could not parse JSON in ${file}: ${(e as Error).message}`);
  }
  try {
    let ctx: SrtContext | undefined;
    if (srtFile) {
      const srtPath = path.resolve(process.cwd(), srtFile);
      if (!fs.existsSync(srtPath)) die(`SRT file not found: ${srtPath}`);
      const fps = fpsOverride ?? ((raw as {fps?: number}).fps || 30);
      const cues = parseSrt(fs.readFileSync(srtPath, "utf-8"), fps);
      if (!cues.length) die(`No cues found in ${srtPath}`);
      ctx = {cues, fps};
    }
    const {data, warnings} = validateVideoData(raw, ctx);
    for (const w of warnings) console.warn(`Warning: ${w[LANG]}`);
    return data;
  } catch (e) {
    if (e instanceof ValidationError) {
      return die(`${e.issues.length} problem(s), nothing was rendered:\n  - ${e.issues.map((i) => i[LANG]).join("\n  - ")}`);
    }
    return die((e as Error).message);
  }
};

const parseArgs = (argv: string[]) => {
  const opts = {input: undefined as string | undefined, skipFull: false, edlOnly: false, preview: false, resume: false, srt: undefined as string | undefined, frame: undefined as number | undefined, startTc: "01:00:00:00", effectsDir: "effects"};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--skip-full") opts.skipFull = true;
    else if (a === "--edl-only") opts.edlOnly = true;
    else if (a === "--preview") opts.preview = true;
    else if (a === "--resume") opts.resume = true;
    else if (a === "--srt") opts.srt = argv[++i] ?? die("--srt needs a file");
    else if (a === "--frame") opts.frame = Number(argv[++i]);
    else if (a === "--start-tc") opts.startTc = argv[++i] ?? die("--start-tc needs a value");
    else if (a === "--effects-dir") opts.effectsDir = argv[++i] ?? die("--effects-dir needs a value");
    else if (a.startsWith("--")) die(`Unknown option ${a}`);
    else opts.input = a;
  }
  return opts;
};

const progressLogger = (label: string) => {
  let last = -1;
  return (progress: number) => {
    const pct = Math.floor(progress * 100);
    if (pct !== last) {
      last = pct;
      process.stdout.write(`\r${label}: ${pct}%`);
    }
  };
};

const HELP = `Usage:
  subanimo <video-data.json> [--srt altyazi.srt] [--skip-full] [--preview [--frame N]] [--edl-only] [--resume] [--start-tc HH:MM:SS:FF] [--effects-dir dir]
  subanimo check <video-data.json> [--srt altyazi.srt]   validate only, nothing is rendered
  subanimo app                           start the local web app (same as the launchers)
  subanimo srt <file.srt> [--fps 30]     write <file>.cues.json (cues converted to frames)
  subanimo prompt --model claude|chatgpt|gemini|generic [--count 40]   print the prompt that plans effects
  subanimo prompts [dir]                 write one prompt file per model (default ./prompts)
  subanimo catalog                       print the effect catalog as JSON`;

const runSubcommand = (argv: string[]): boolean => {
  const [cmd, ...rest] = argv;
  if (cmd === "app") {
    require("./server");
    return true;
  }
  if (cmd === "srt") {
    const file = rest[0] ?? die("Usage: subanimo srt <file.srt> [--fps 30]");
    const fpsIdx = rest.indexOf("--fps");
    const fps = fpsIdx >= 0 ? Number(rest[fpsIdx + 1]) : 30;
    if (!fs.existsSync(file)) die(`File not found: ${file}`);
    const cues = parseSrt(fs.readFileSync(file, "utf-8"), fps);
    const out = file.replace(/\.srt$/i, "") + ".cues.json";
    fs.writeFileSync(out, JSON.stringify({fps, durationInFrames: cues.length ? cues[cues.length - 1].endFrame : 0, cues}, null, 1));
    console.log(`${cues.length} cues -> ${out}`);
    return true;
  }
  if (cmd === "check") {
    const si = rest.indexOf("--srt");
    const data = loadData(rest[0], si >= 0 ? rest[si + 1] : undefined);
    console.log(`OK: ${data.effects.length} effects, ${data.durationInFrames} frames at ${data.fps} fps`);
    return true;
  }
  if (cmd === "catalog") {
    console.log(JSON.stringify({presentations: PRESENTATIONS, styles: STYLES, effects: CATALOG}, null, 2));
    return true;
  }
  if (cmd === "prompt") {
    const mi = rest.indexOf("--model");
    const model = (mi >= 0 ? rest[mi + 1] : "generic") as Model;
    if (!MODELS.includes(model)) die(`--model must be one of: ${MODELS.join(", ")}`);
    const ci = rest.indexOf("--count");
    console.log(buildPrompt(model, ci >= 0 ? Number(rest[ci + 1]) : 40));
    return true;
  }
  if (cmd === "prompts") {
    const outDir = path.resolve(process.cwd(), rest[0] ?? "prompts");
    fs.mkdirSync(outDir, {recursive: true});
    for (const m of MODELS) {
      const file = path.join(outDir, `${m}.md`);
      fs.writeFileSync(file, buildPrompt(m, 40));
      console.log(`Prompt: ${file}`);
    }
    return true;
  }
  if (cmd === "--help" || cmd === "-h" || cmd === undefined) {
    console.log(HELP);
    return true;
  }
  return false;
};

const main = async () => {
  if (runSubcommand(process.argv.slice(2))) return;
  const opts = parseArgs(process.argv.slice(2));
  const data = loadData(opts.input, opts.srt);
  const dir = path.resolve(process.cwd(), opts.effectsDir);
  fs.mkdirSync(dir, {recursive: true});

  const printTimelines = (t: {edls: string[]; fcpxml: string}) => {
    for (const e of t.edls) console.log(`EDL: ${e}`);
    console.log(`FCPXML: ${t.fcpxml}`);
  };

  if (opts.edlOnly) {
    // Rewrite EDL/FCPXML for clips that are already rendered.
    printTimelines(writeTimelines(dir, clipsFromExisting(data), data, opts.startTc));
    return;
  }

  await ensureChrome(progressLogger("Downloading Chrome"));
  console.log("Bundling...");
  const serveUrl = await makeBundle();

  if (opts.preview) {
    await renderPreviews({serveUrl, data, dir: path.join(dir, "preview"), frame: opts.frame, onEach: (f) => console.log(`Preview: ${f}`)});
    return;
  }

  if (!opts.skipFull) {
    const out = path.resolve(process.cwd(), "out.mp4");
    await renderFullVideo(serveUrl, data, out, progressLogger("out.mp4"));
    console.log(`\nDone: ${out}`);
  }

  const loggers = new Map<string, (p: number) => void>();
  const clips = await renderClips({
    serveUrl,
    data,
    dir,
    resume: opts.resume,
    onEvent: (e) => {
      if (e.type === "skip") console.log(`Skip (exists): ${path.join(dir, e.file)}`);
      else if (e.type === "progress") {
        if (!loggers.has(e.file)) loggers.set(e.file, progressLogger(e.file));
        loggers.get(e.file)!(e.progress);
      } else if (e.type === "retry") console.warn(`\n${e.file} failed (${e.reason}), retrying (${e.attempt}/4)...`);
      else if (e.type === "done") console.log(`\nDone: ${path.join(dir, e.file)}`);
    },
  });
  printTimelines(writeTimelines(dir, clips, data, opts.startTc));
};

main().catch((e) => die(e instanceof Error ? e.message : String(e)));
