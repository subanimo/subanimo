// Local web app: a small HTTP server on 127.0.0.1 that serves ui/ and runs the engine.
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import {spawn} from "node:child_process";
import {makeCancelSignal} from "@remotion/renderer";
import {ensureChrome, makeBundle, renderClips, renderPreviews, ROOT, writeTimelines} from "./engine";
import {buildPrompt, MODELS, type Model} from "./prompts";
import {parseSrt} from "./srt";
import {extractJson, type Msg, validateVideoData, ValidationError} from "./validate";
import type {VideoData} from "./types";

const PORT = Number(process.env.SUBANIMO_PORT ?? 3210);
const HOST = "127.0.0.1";
// Kept under an "out" subfolder so outputs never mix with the app files, even if the app itself was unzipped to ~/Subanimo.
const OUTPUT_ROOT = path.join(os.homedir(), "Subanimo", "out");
const UI_DIR = path.join(ROOT, "ui");
const FPS = 30;
const MB_PER_FRAME = 0.35; // ProRes 4444 1080p: real renders measured 0.28-0.47 MB per frame
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
// Changes on every start, so the page can tell a fresh start from a reload of the same session.
const BOOT_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const m = (en: string, tr: string): Msg => ({en, tr});

/* ---------- state ---------- */

type Setup = {status: "pending" | "downloading" | "ready" | "error"; percent: number; message?: Msg};
type Job = {
  kind: "preview" | "render";
  name: string;
  status: "running" | "done" | "error" | "cancelled";
  step: Msg;
  index: number;
  total: number;
  progress: number;
  previews: string[];
  outputs?: {dir: string; edls: string[]; fcpxml: string};
  message?: Msg;
};

const setup: Setup = {status: "pending", percent: 0};
let job: Job | undefined;
let cancel: (() => void) | undefined;
let serveUrl: Promise<string> | undefined;
const listeners = new Set<http.ServerResponse>();

const broadcast = () => {
  const payload = `data: ${JSON.stringify({setup, job})}\n\n`;
  for (const res of listeners) res.write(payload);
};

const getServeUrl = () => (serveUrl ??= makeBundle().catch((e) => {
  serveUrl = undefined;
  throw e;
}));

/* ---------- helpers ---------- */

const safeName = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N} _-]/gu, "").trim().slice(0, 80) || "video";

const freeBytes = (dir: string) => {
  try {
    fs.mkdirSync(dir, {recursive: true});
    const s = fs.statfsSync(dir);
    return s.bavail * s.bsize;
  } catch {
    return undefined;
  }
};

type Parsed = {data?: VideoData; errors: Msg[]; warnings: Msg[]; cues: number};

function parseInput(srt: string, json: string): Parsed {
  const cues = parseSrt(srt ?? "", FPS);
  if (!cues.length) return {errors: [m("The subtitle file has no readable lines. Is it an .srt file?", "Altyazı dosyasında okunabilir satır yok. Dosya .srt mi?")], warnings: [], cues: 0};
  let raw: unknown;
  try {
    raw = extractJson(json ?? "");
  } catch (e) {
    return {errors: [m(`The AI answer is not valid JSON: ${(e as Error).message}`, `Yapay zekanın cevabı geçerli JSON değil: ${(e as Error).message}`)], warnings: [], cues: cues.length};
  }
  if (raw === undefined) return {errors: [m("No JSON found. Paste the whole answer of the AI.", "JSON bulunamadı. Yapay zekanın cevabının tamamını yapıştırın.")], warnings: [], cues: cues.length};
  try {
    const {data, warnings} = validateVideoData(raw, {cues, fps: FPS});
    return {data, errors: [], warnings, cues: cues.length};
  } catch (e) {
    if (e instanceof ValidationError) return {errors: e.issues, warnings: [], cues: cues.length};
    return {errors: [m((e as Error).message, (e as Error).message)], warnings: [], cues: cues.length};
  }
}

const summary = (p: Parsed) => {
  const frames = p.data?.effects.reduce((a, e) => a + e.durationInFrames, 0) ?? 0;
  const needed = frames * MB_PER_FRAME * 1024 * 1024;
  const free = freeBytes(OUTPUT_ROOT);
  return {
    effects: p.data?.effects.map((e) => ({id: e.id, effectType: e.effectType, style: e.style, text: e.text, startFrame: e.startFrame, durationInFrames: e.durationInFrames})) ?? [],
    cues: p.cues,
    neededBytes: needed,
    freeBytes: free,
    diskOk: free === undefined || free > needed * 1.2,
  };
};

const openPath = (p: string) => {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer" : "xdg-open";
  spawn(cmd, [p], {detached: true, stdio: "ignore"}).unref();
};

/* ---------- jobs ---------- */

async function runJob(kind: Job["kind"], name: string, data: VideoData, srt: string) {
  const dir = path.join(OUTPUT_ROOT, name);
  fs.mkdirSync(dir, {recursive: true});
  // Keep the inputs next to the outputs so the job can be redone from the CLI.
  fs.writeFileSync(path.join(dir, "video-data.json"), JSON.stringify(data, null, 1));
  fs.writeFileSync(path.join(dir, "subtitles.srt"), srt);

  const signal = makeCancelSignal();
  let cancelled = false;
  cancel = () => {
    cancelled = true;
    signal.cancel();
  };
  job = {kind, name, status: "running", step: m("Preparing…", "Hazırlanıyor…"), index: 0, total: data.effects.length, progress: 0, previews: []};
  broadcast();
  try {
    if (setup.status !== "ready") await prepare();
    job.step = m("Preparing the renderer…", "Render motoru hazırlanıyor…");
    broadcast();
    const url = await getServeUrl();

    if (kind === "preview") {
      const previewDir = path.join(dir, "preview");
      fs.rmSync(previewDir, {recursive: true, force: true});
      for (const [i, effect] of data.effects.entries()) {
        if (cancelled) throw new Error("cancelled");
        job.step = m(`Preview ${i + 1}/${data.effects.length}`, `Önizleme ${i + 1}/${data.effects.length}`);
        job.index = i;
        job.progress = i / data.effects.length;
        broadcast();
        const [png] = await renderPreviews({serveUrl: url, data: {...data, effects: [effect]}, dir: previewDir});
        job.previews.push(`/out/${encodeURIComponent(name)}/preview/${encodeURIComponent(path.basename(png))}?t=${Date.now()}`);
      }
    } else {
      const clips = await renderClips({
        serveUrl: url,
        data,
        dir,
        resume: true,
        cancelSignal: signal.cancelSignal,
        onEvent: (e) => {
          if (!job) return;
          job.index = e.index;
          if (e.type === "progress") job.progress = (e.index + e.progress) / e.total;
          job.step = e.type === "retry"
            ? m(`${e.file}: retrying (${e.attempt}/4)`, `${e.file}: yeniden deneniyor (${e.attempt}/4)`)
            : m(`Clip ${e.index + 1}/${e.total}: ${e.id}`, `Klip ${e.index + 1}/${e.total}: ${e.id}`);
          broadcast();
        },
      });
      job.outputs = {dir, ...writeTimelines(dir, clips, data)};
    }
    job.status = "done";
    job.progress = 1;
    job.step = kind === "preview" ? m("Previews are ready", "Önizlemeler hazır") : m("All clips are ready", "Tüm klipler hazır");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (cancelled || /cancel/i.test(msg)) {
      job.status = "cancelled";
      job.step = m("Stopped. Finished clips are kept; starting again continues where it stopped.", "Durduruldu. Biten klipler duruyor; yeniden başlatınca kaldığı yerden devam eder.");
    } else {
      job.status = "error";
      job.message = /ENOSPC|no space/i.test(msg) ? m("The disk is full. Free up space and start again; finished clips are kept.", "Disk dolu. Yer açıp yeniden başlatın; biten klipler korunur.") : m(msg, msg);
      job.step = m("Something went wrong", "Bir sorun oluştu");
    }
  } finally {
    cancel = undefined;
    broadcast();
  }
}

/** Downloads Chrome (first run only) and bundles the video project. */
async function prepare() {
  if (setup.status === "ready") return;
  try {
    setup.status = "downloading";
    broadcast();
    await ensureChrome((p) => {
      setup.percent = p;
      broadcast();
    });
    await getServeUrl();
    setup.status = "ready";
    setup.percent = 1;
  } catch (e) {
    setup.status = "error";
    setup.message = m(`Setup failed: ${(e as Error).message}. Check the internet connection and restart.`, `Kurulum tamamlanamadı: ${(e as Error).message}. İnternet bağlantısını kontrol edip yeniden başlatın.`);
    throw e;
  } finally {
    broadcast();
  }
}

/* ---------- http ---------- */

const MIME: Record<string, string> = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json"};

const send = (res: http.ServerResponse, status: number, body: unknown, type = "application/json") => {
  res.writeHead(status, {"Content-Type": type, "Cache-Control": "no-store"});
  res.end(type === "application/json" ? JSON.stringify(body) : (body as string | Buffer));
};

const serveFile = (res: http.ServerResponse, base: string, rel: string) => {
  const file = path.resolve(base, rel);
  if (!file.startsWith(path.resolve(base) + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, {error: "not found"});
  send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] ?? "application/octet-stream");
};

const readBody = (req: http.IncomingMessage): Promise<Record<string, string>> =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > 30 * 1024 * 1024) {
        reject(new Error("too large"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}"));
      } catch (e) {
        reject(e);
      }
    });
  });

async function handle(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? "/", `http://${HOST}`);
  const p = url.pathname;

  if (req.method === "GET") {
    if (p === "/") return serveFile(res, UI_DIR, "index.html");
    if (p.startsWith("/ui/")) return serveFile(res, UI_DIR, decodeURIComponent(p.slice(4)));
    if (p.startsWith("/out/")) return serveFile(res, OUTPUT_ROOT, decodeURIComponent(p.slice(5)));
    if (p === "/api/info") return send(res, 200, {app: "Subanimo", version: pkg.version, outputRoot: OUTPUT_ROOT, sep: path.sep, bootId: BOOT_ID, models: MODELS, setup, job});
    if (p === "/api/prompt") {
      const model = (url.searchParams.get("model") ?? "chatgpt") as Model;
      const count = Math.max(5, Math.min(80, Number(url.searchParams.get("count") ?? 30) || 30));
      return send(res, 200, buildPrompt(MODELS.includes(model) ? model : "generic", count), "text/plain; charset=utf-8");
    }
    if (p === "/api/events") {
      res.writeHead(200, {"Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive"});
      res.write(`data: ${JSON.stringify({setup, job})}\n\n`);
      listeners.add(res);
      req.on("close", () => listeners.delete(res));
      return;
    }
    return send(res, 404, {error: "not found"});
  }

  // A custom header forces a CORS preflight, so other websites cannot trigger actions on this machine.
  if (req.method !== "POST" || req.headers["x-subanimo"] !== "1") return send(res, 403, {error: "forbidden"});
  const body = await readBody(req);

  if (p === "/api/check") {
    const parsed = parseInput(body.srt, body.json);
    return send(res, 200, {ok: parsed.errors.length === 0, errors: parsed.errors, warnings: parsed.warnings, ...summary(parsed)});
  }
  if (p === "/api/preview" || p === "/api/render") {
    if (job?.status === "running") return send(res, 409, {error: m("Another job is running.", "Başka bir iş çalışıyor.")});
    const parsed = parseInput(body.srt, body.json);
    if (!parsed.data) return send(res, 400, {errors: parsed.errors});
    void runJob(p === "/api/preview" ? "preview" : "render", safeName(body.name ?? "video"), parsed.data, body.srt);
    return send(res, 202, {started: true});
  }
  if (p === "/api/cancel") {
    cancel?.();
    return send(res, 200, {ok: true});
  }
  if (p === "/api/open") {
    // Open the project's folder when it exists, otherwise the output root (never create empty project folders).
    const project = body.name ? path.join(OUTPUT_ROOT, safeName(body.name)) : undefined;
    const target = project && fs.existsSync(project) ? project : OUTPUT_ROOT;
    fs.mkdirSync(target, {recursive: true});
    openPath(target);
    return send(res, 200, {ok: true});
  }
  return send(res, 404, {error: "not found"});
}

const openBrowser = (url: string) => {
  if (process.env.SUBANIMO_NO_BROWSER) return;
  if (process.platform === "win32") spawn("cmd", ["/c", "start", "", url], {detached: true, stdio: "ignore"}).unref();
  else openPath(url);
};

function start(port: number, attemptsLeft = 10) {
  const server = http.createServer((req, res) => {
    handle(req, res).catch((e) => send(res, 500, {error: m(String(e?.message ?? e), String(e?.message ?? e))}));
  });
  server.on("error", async (err: NodeJS.ErrnoException) => {
    if (err.code !== "EADDRINUSE") throw err;
    // Already running? Then just open it instead of starting a second copy.
    try {
      const r = await fetch(`http://${HOST}:${port}/api/info`);
      if (r.ok && (await r.json()).app === "Subanimo") {
        console.log(`Subanimo is already running: http://${HOST}:${port}`);
        openBrowser(`http://${HOST}:${port}`);
        process.exit(0);
      }
    } catch {
      // not ours
    }
    if (attemptsLeft > 0) start(port + 1, attemptsLeft - 1);
    else throw err;
  });
  server.listen(port, HOST, () => {
    const url = `http://${HOST}:${port}`;
    console.log("");
    console.log(`  Subanimo ${pkg.version} is running: ${url}`);
    console.log(`  Subanimo çalışıyor: ${url}`);
    console.log("");
    console.log("  Keep this window open while you use the app. / Uygulamayı kullanırken bu pencereyi açık tutun.");
    console.log(`  Output folder / Çıktı klasörü: ${OUTPUT_ROOT}`);
    openBrowser(url);
    prepare().catch(() => undefined);
  });
}

start(PORT);
