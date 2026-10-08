import {CATALOG, OPAQUE_PRESENTATIONS, PRESENTATIONS, STYLES, type Effect, type EffectType, type VideoData} from "./types";
import {listEmojiNames, listFxNames} from "./prompts";
import type {Cue} from "./srt";

const ANNOTATIONS = ["highlight", "underline", "circle", "box", "bracket", "strike", "crossed"];
const MODES = ["check", "cross", "warning"];
const POSITIONS = ["top", "center", "bottom"];
const DIRECTIONS = ["from-left", "from-right", "from-top", "from-bottom"];
const SHAPES = ["star", "circle", "triangle", "heart", "polygon", "spark", "rect"];

type Kind = "string" | "number" | "stringArray" | "marks" | "fx";
type Field = {kind: Kind; enum?: string[]; min?: number; max?: number; minItems?: number; maxItems?: number};

const FIELDS: Record<string, Field> = {
  enter: {kind: "string", enum: [...PRESENTATIONS]},
  exit: {kind: "string", enum: [...PRESENTATIONS]},
  enterDirection: {kind: "string", enum: DIRECTIONS},
  transitionFrames: {kind: "number", min: 2, max: 60},
  fx: {kind: "fx"},
  color: {kind: "string"},
  accent: {kind: "string"},
  position: {kind: "string", enum: POSITIONS},
  align: {kind: "string", enum: ["left", "center", "right"]},
  style: {kind: "string"},
  highlight: {kind: "stringArray"},
  annotation: {kind: "string", enum: ANNOTATIONS},
  from: {kind: "number"},
  to: {kind: "number"},
  prefix: {kind: "string"},
  suffix: {kind: "string"},
  label: {kind: "string"},
  value: {kind: "number", min: 0, max: 100},
  marks: {kind: "marks"},
  left: {kind: "string"},
  right: {kind: "string"},
  items: {kind: "stringArray", minItems: 1, maxItems: 8},
  steps: {kind: "stringArray", minItems: 1, maxItems: 8},
  mode: {kind: "string", enum: MODES},
  number: {kind: "string"},
  subtext: {kind: "string"},
  emoji: {kind: "string"},
  shapes: {kind: "stringArray"},
  src: {kind: "string"},
  seed: {kind: "number"},
  cue: {kind: "number", min: 1},
  endCue: {kind: "number", min: 1},
};
const BASE_KEYS = new Set(["id", "effectType", "text", "startFrame", "durationInFrames"]);

/** A user-facing message in both UI languages. */
export type Msg = {en: string; tr: string};
const m = (en: string, tr: string): Msg => ({en, tr});

export class ValidationError extends Error {
  constructor(public issues: Msg[]) {
    super(`Invalid video data (${issues.length} problem${issues.length > 1 ? "s" : ""}, nothing was rendered):\n  - ${issues.map((i) => i.en).join("\n  - ")}`);
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const show = (v: unknown) => {
  const t = JSON.stringify(v);
  return t && t.length > 60 ? t.slice(0, 57) + "..." : String(t);
};
const kindName = (v: unknown) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
const KIND_TR: Record<string, string> = {array: "liste", null: "boş", string: "metin", number: "sayı", object: "nesne", boolean: "doğru/yanlış", undefined: "hiçbir şey"};
const got = (v: unknown) => m(`got ${kindName(v)} ${show(v)}`, `gelen: ${KIND_TR[kindName(v)] ?? kindName(v)} ${show(v)}`);

export type ValidationResult = {data: VideoData; warnings: Msg[]};

export type SrtContext = {cues: Cue[]; fps: number};

const MIN_FRAMES = 60;
const MAX_FRAMES = 270;

const where = (i: number, e: Record<string, unknown>) => {
  const id = typeof e.id === "string" && e.id ? e.id : `#${i}`;
  return m(`effects[${i}] (${id})`, `${i + 1}. efekt (${id})`);
};
const join = (a: Msg, b: Msg, sep = ": "): Msg => m(a.en + sep + b.en, a.tr + sep + b.tr);

// With an SRT, effects can say {"cue": 12, "endCue": 13} instead of frames; this fills in startFrame/durationInFrames.
function resolveCues(input: Record<string, unknown>, ctx: SrtContext | undefined, errors: Msg[], warnings: Msg[]) {
  if (!Array.isArray(input.effects)) return;
  const byIndex = new Map(ctx?.cues.map((c) => [c.index, c]));
  const derived = new Set<Record<string, unknown>>();
  const lastCue = ctx?.cues[ctx.cues.length - 1]?.index;
  input.effects.forEach((e: unknown, i: number) => {
    if (!isObj(e) || e.cue === undefined) return;
    const at = where(i, e);
    if (!ctx) return void errors.push(join(at, m(`uses "cue" numbers, so the SRT file is needed (CLI: --srt <file.srt>)`, `"cue" numaraları kullanıyor, bu yüzden altyazı (SRT) dosyası gerekli (CLI: --srt <dosya.srt>)`)));
    if (typeof e.cue !== "number" || !byIndex.has(e.cue)) {
      return void errors.push(join(at, m(`cue ${show(e.cue)} is not in the SRT (1..${lastCue})`, `cue ${show(e.cue)} altyazıda yok (1..${lastCue})`)));
    }
    const first = byIndex.get(e.cue)!;
    let last = first;
    if (e.endCue !== undefined) {
      const end = typeof e.endCue === "number" ? byIndex.get(e.endCue) : undefined;
      if (!end) return void errors.push(join(at, m(`endCue ${show(e.endCue)} is not in the SRT (1..${lastCue})`, `endCue ${show(e.endCue)} altyazıda yok (1..${lastCue})`)));
      if (end.index < first.index) return void errors.push(join(at, m(`endCue ${end.index} comes before cue ${first.index}`, `endCue ${end.index}, cue ${first.index}'den önce geliyor`)));
      last = end;
    }
    e.startFrame = first.startFrame;
    if (e.durationInFrames === undefined) {
      e.durationInFrames = Math.min(MAX_FRAMES, Math.max(MIN_FRAMES, last.endFrame - first.startFrame));
      derived.add(e);
    }
  });
  // Auto-derived durations must not run into the next effect.
  const list = input.effects.filter(isObj).filter((e) => typeof e.startFrame === "number").sort((a, b) => (a.startFrame as number) - (b.startFrame as number));
  list.forEach((a, k) => {
    const b = list[k + 1];
    if (b && derived.has(a) && (a.startFrame as number) + (a.durationInFrames as number) > (b.startFrame as number)) {
      const room = (b.startFrame as number) - (a.startFrame as number);
      if (room >= 30) a.durationInFrames = room;
      else warnings.push(m(`${String(a.id)} and ${String(b.id)} start only ${room} frames apart`, `${String(a.id)} ile ${String(b.id)} arasında yalnızca ${room} kare var`));
    }
  });
  if (input.fps === undefined) input.fps = ctx?.fps;
  if (input.durationInFrames === undefined && ctx) {
    const lastEnd = Math.max(0, ...list.map((e) => (e.startFrame as number) + (e.durationInFrames as number)), ...ctx.cues.map((c) => c.endFrame));
    input.durationInFrames = lastEnd + 30;
  }
}

// Collects every problem (not just the first) so the whole file can be fixed in one go.
export function validateVideoData(input: unknown, ctx?: SrtContext): ValidationResult {
  const errors: Msg[] = [];
  const warnings: Msg[] = [];

  if (!isObj(input)) {
    throw new ValidationError([m(`the root must be an object like {"effects": [...]}, not ${kindName(input)}`, `en dış yapı {"effects": [...]} gibi bir nesne olmalı, ${KIND_TR[kindName(input)] ?? kindName(input)} değil`)]);
  }
  resolveCues(input, ctx, errors, warnings);
  const num = (v: unknown, at: Msg, min: number, integer = false) => {
    if (typeof v !== "number" || !Number.isFinite(v)) errors.push(join(at, join(m("expected a number", "sayı olmalı"), got(v), ", ")));
    else if (v < min) errors.push(join(at, m(`must be >= ${min}, got ${v}`, `en az ${min} olmalı, gelen: ${v}`)));
    else if (integer && !Number.isInteger(v)) errors.push(join(at, m(`must be a whole number, got ${v}`, `tam sayı olmalı, gelen: ${v}`)));
    else return v;
    return 0;
  };

  if (!Array.isArray(input.effects)) {
    throw new ValidationError([m(`"effects" must be a list, got ${kindName(input.effects)}`, `"effects" bir liste olmalı, gelen: ${KIND_TR[kindName(input.effects)] ?? kindName(input.effects)}`)]);
  }
  const usesCues = input.effects.some((e) => isObj(e) && e.cue !== undefined);
  const skipTop = usesCues && !ctx; // the missing-SRT error already explains this
  const durationInFrames = skipTop ? 0 : num(input.durationInFrames, m("durationInFrames", "durationInFrames"), 1, true);
  const fps = skipTop ? 0 : num(input.fps, m("fps", "fps"), 1);

  const fxNames = new Set(listFxNames());
  const emojis = new Set(listEmojiNames());
  const seen = new Set<string>();

  input.effects.forEach((e: unknown, i: number) => {
    if (!isObj(e)) return void errors.push(m(`effects[${i}]: expected an object, got ${kindName(e)}`, `${i + 1}. efekt: nesne olmalı, gelen: ${KIND_TR[kindName(e)] ?? kindName(e)}`));
    const at = where(i, e);
    const field = (k: string) => m(`${at.en}.${k}`, `${at.tr} › ${k}`);

    if (typeof e.id !== "string" || !e.id) errors.push(join(field("id"), m("must be a non-empty text", "boş olmayan bir metin olmalı")));
    else if (seen.has(e.id)) errors.push(join(field("id"), m(`duplicate id "${e.id}"`, `"${e.id}" kimliği iki kez kullanılmış`)));
    else seen.add(e.id);
    const cueFailed = e.cue !== undefined && typeof e.startFrame !== "number"; // already reported by the cue check
    if (!cueFailed) {
      num(e.startFrame, field("startFrame"), 0, true);
      num(e.durationInFrames, field("durationInFrames"), 1, true);
    }
    if (e.text === undefined) e.text = "";
    else if (typeof e.text !== "string") errors.push(join(field("text"), join(m("must be text", "metin olmalı"), got(e.text), ", ")));

    const type = e.effectType as EffectType;
    const entry = typeof type === "string" ? CATALOG[type] : undefined;
    if (!entry) {
      const known = Object.keys(CATALOG).join(", ");
      return void errors.push(join(field("effectType"), m(`"${String(e.effectType)}" is unknown. Known: ${known}`, `"${String(e.effectType)}" tanınmıyor. Geçerli olanlar: ${known}`)));
    }

    for (const [key, value] of Object.entries(e)) {
      if (BASE_KEYS.has(key)) continue;
      const f = FIELDS[key];
      if (!f) {
        warnings.push(join(field(key), m("unknown field, ignored", "bilinmeyen alan, yok sayıldı")));
        continue;
      }
      checkField(field(key), key, value, f);
    }
    for (const key of entry.required) {
      const v = e[key];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) errors.push(join(at, m(`${type} needs "${key}"`, `${type} için "${key}" gerekli`)));
    }
    if (typeof e.style === "string") {
      const allowed = STYLES[type];
      if (!allowed) errors.push(join(field("style"), m(`${type} has no styles, remove "style"`, `${type} için stil yok, "style" alanını kaldırın`)));
      else if (!allowed.includes(e.style)) errors.push(join(field("style"), m(`"${e.style}" is not allowed for ${type}. Use one of: ${allowed.join(", ")}`, `"${e.style}" ${type} için geçerli değil. Şunlardan biri olmalı: ${allowed.join(", ")}`)));
    }
    if (typeof e.emoji === "string" && !emojis.has(e.emoji)) {
      const ex = [...emojis].slice(0, 12).join(", ");
      errors.push(join(field("emoji"), m(`"${e.emoji}" is not an animated emoji. Examples: ${ex}`, `"${e.emoji}" geçerli bir hareketli emoji değil. Örnekler: ${ex}`)));
    }
    if (type === "emojiBurst" && e.emoji === undefined) errors.push(join(at, m(`emojiBurst needs "emoji"`, `emojiBurst için "emoji" gerekli`)));
    if (Array.isArray(e.highlight) && typeof e.text === "string") {
      const lower = e.text.toLocaleLowerCase("tr");
      for (const w of e.highlight) {
        if (typeof w === "string" && !lower.includes(w.toLocaleLowerCase("tr"))) warnings.push(join(field("highlight"), m(`"${w}" does not appear in the text, nothing will be highlighted`, `"${w}" metinde geçmiyor, vurgulanmayacak`)));
      }
    }
    for (const k of ["enter", "exit"] as const) {
      if ((OPAQUE_PRESENTATIONS as readonly string[]).includes(e[k] as string) && type !== "transitionCard") {
        warnings.push(join(field(k), m(`"${String(e[k])}" paints an opaque backdrop; it is meant for transitionCard only`, `"${String(e[k])}" opak bir arka plan çizer; yalnızca transitionCard için uygundur`)));
      }
    }
    if (Array.isArray(e.fx)) {
      e.fx.forEach((f, j) => {
        if (isObj(f) && typeof f.name === "string" && !fxNames.has(f.name)) {
          errors.push(join(field(`fx[${j}].name`), m(`"${f.name}" is not an effect. Examples: glow, chromatic-aberration, scanlines, wave, vignette`, `"${f.name}" geçerli bir efekt değil. Örnekler: glow, chromatic-aberration, scanlines, wave, vignette`)));
        }
      });
    }
  });

  function checkField(at: Msg, key: string, v: unknown, f: Field) {
    const bad = (en: string, tr: string, withValue = true) => errors.push(join(at, withValue ? join(m(en, tr), got(v), ", ") : m(en, tr)));
    switch (f.kind) {
      case "string":
        if (typeof v !== "string") return void bad("must be text", "metin olmalı");
        if (f.enum && !f.enum.includes(v)) bad(`"${v}" is not allowed. Use one of: ${f.enum.join(", ")}`, `"${v}" geçerli değil. Şunlardan biri olmalı: ${f.enum.join(", ")}`, false);
        return;
      case "number":
        if (typeof v !== "number" || !Number.isFinite(v)) return void bad("must be a number", "sayı olmalı");
        if (f.min !== undefined && v < f.min) bad(`must be >= ${f.min}, got ${v}`, `en az ${f.min} olmalı, gelen: ${v}`, false);
        if (f.max !== undefined && v > f.max) bad(`must be <= ${f.max}, got ${v}`, `en fazla ${f.max} olmalı, gelen: ${v}`, false);
        return;
      case "stringArray":
        if (!Array.isArray(v)) return void bad(`must be a list of texts like ["a", "b"]`, `["a", "b"] gibi bir metin listesi olmalı`);
        v.forEach((x, k) => typeof x !== "string" && errors.push(join(m(`${at.en}[${k}]`, `${at.tr} [${k + 1}]`), join(m("must be text", "metin olmalı"), got(x), ", "))));
        if (f.minItems !== undefined && v.length < f.minItems) bad(`needs at least ${f.minItems} item(s)`, `en az ${f.minItems} öğe olmalı`, false);
        if (f.maxItems !== undefined && v.length > f.maxItems) bad(`at most ${f.maxItems} items, got ${v.length}`, `en fazla ${f.maxItems} öğe olmalı, gelen: ${v.length}`, false);
        if (key === "shapes") {
          v.forEach((x) => typeof x === "string" && !SHAPES.includes(x) && bad(`"${x}" is not a shape. Use: ${SHAPES.join(", ")}`, `"${x}" geçerli bir şekil değil. Şunlar olabilir: ${SHAPES.join(", ")}`, false));
        }
        return;
      case "marks":
        if (!Array.isArray(v)) return void bad(`must be a list of {"value": 0-100, "label": "..."}`, `{"value": 0-100, "label": "..."} öğelerinden oluşan bir liste olmalı`);
        v.forEach((mk, k) => {
          if (!isObj(mk) || typeof mk.value !== "number" || typeof mk.label !== "string") {
            errors.push(join(m(`${at.en}[${k}]`, `${at.tr} [${k + 1}]`), m(`must be {"value": number, "label": text}, got ${show(mk)}`, `{"value": sayı, "label": metin} olmalı, gelen: ${show(mk)}`)));
          }
        });
        return;
      case "fx":
        if (!Array.isArray(v)) return void bad(`must be a list of {"name": "<effect>", ...}`, `{"name": "<efekt>", ...} öğelerinden oluşan bir liste olmalı`);
        v.forEach((x, k) => {
          if (!isObj(x) || typeof x.name !== "string") errors.push(join(m(`${at.en}[${k}]`, `${at.tr} [${k + 1}]`), m(`must be {"name": "<effect>", ...}, got ${show(x)}`, `{"name": "<efekt>", ...} olmalı, gelen: ${show(x)}`)));
        });
    }
  }

  // Overlap is allowed (layers), but usually a planning mistake.
  const sorted = (input.effects.filter(isObj) as unknown as Effect[]).sort((a, b) => a.startFrame - b.startFrame);
  sorted.forEach((a, i) => {
    const b = sorted[i + 1];
    if (typeof a.startFrame !== "number" || typeof a.durationInFrames !== "number") return;
    const end = a.startFrame + a.durationInFrames;
    if (b && end > b.startFrame) warnings.push(m(`${a.id} overlaps ${b.id} by ${end - b.startFrame} frames`, `${a.id} ile ${b.id} ${end - b.startFrame} kare üst üste biniyor`));
    if (durationInFrames && end > durationInFrames) warnings.push(m(`${a.id} ends after the video (${end} > ${durationInFrames})`, `${a.id} videonun sonundan sonra bitiyor (${end} > ${durationInFrames})`));
  });

  if (errors.length) throw new ValidationError(errors);
  return {data: {durationInFrames, fps, effects: input.effects as Effect[]}, warnings};
}

/**
 * Chat apps often wrap the JSON in a ```json fence or add a sentence around it; keep only the object.
 * Returns undefined if no JSON object can be found.
 */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  return JSON.parse(body.slice(start, end + 1));
}
