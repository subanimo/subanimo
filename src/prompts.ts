import fs from "node:fs";
import path from "node:path";
import {CATALOG, EffectType, STYLES} from "./types";

export type Model = "claude" | "chatgpt" | "gemini" | "generic";
export const MODELS: Model[] = ["claude", "chatgpt", "gemini", "generic"];

const pkgDir = (name: string) => path.dirname(require.resolve(`${name}/package.json`));

export const listFxNames = (): string[] => {
  const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir("@remotion/effects"), "package.json"), "utf-8"));
  return Object.keys(pkg.exports).filter((k) => k.startsWith("./") && k !== "./package.json").map((k) => k.slice(2));
};

// Shared with scripts/fetch-assets.js, which downloads these for offline rendering.
const FAVORITE_EMOJIS: string[] = JSON.parse(fs.readFileSync(path.join(__dirname, "../scripts/emoji-list.json"), "utf-8"));

// Only names that really exist in @remotion/animated-emoji are offered to the model.
export const listEmojiNames = (): string[] =>
  require(path.join(pkgDir("@remotion/animated-emoji"), "dist/cjs/emoji-data.js")).emojis.map((e: {name: string}) => e.name);

export const listEmojis = (): string[] => {
  const file = path.join(pkgDir("@remotion/animated-emoji"), "dist/cjs/emoji-data.js");
  const all: string[] = require(file).emojis.map((e: {name: string}) => e.name);
  return FAVORITE_EMOJIS.filter((n) => all.includes(n));
};


// One valid, minimal example per type (extra fields only; id/startFrame/durationInFrames are added when rendering the prompt).
export const EXAMPLES: Record<EffectType, Record<string, unknown>> = {
  kineticText: {text: "Önlemler almak zorundayız", highlight: ["Önlemler"], annotation: "box"},
  captionHighlight: {text: "Eğer bir bilgi buradaysa o sizin gücünüz", position: "bottom"},
  counter: {text: "Doğru kabul etmeyin", from: 0, to: 100, suffix: "%"},
  gauge: {text: "İbre nerede duracak?", value: 65, marks: [{value: 30, label: "30"}, {value: 70, label: "70"}]},
  versus: {text: "Fark ne?", left: "Manuel kodlama", right: "Yapay zeka destekli"},
  checklist: {text: "Cihaz yarı yolda bırakır", items: ["Pil biter", "İnternet gider"], mode: "cross"},
  timeline: {text: "Her derde deva denilenler", steps: ["VR", "Blockchain", "NFT"]},
  questionHook: {text: "Elimizden ne gelir?"},
  chapter: {text: "Öğrenmeyi bırakma", number: "1", subtext: "Birinci konu"},
  quote: {text: "Bilgi burada olursa işinizi görürsünüz", highlight: ["Bilgi"], subtext: "Konuşmacı"},
  bigStatement: {text: "HER ŞEYİ OTOMATİK YAPTIM!"},
  glitch: {text: "BU GERÇEK DEĞİL!"},
  emojiBurst: {text: "Çözüm aklıma geldi!", emoji: "light-bulb"},
  shapesBurst: {text: "Başarı!", shapes: ["star", "heart"]},
  lowerThird: {text: "İspanya", subtext: "Konuşmacının bulunduğu yer"},
  progressBar: {text: "Otomasyon seviyesi", value: 50, marks: [{value: 0, label: "0%"}, {value: 100, label: "100%"}]},
  transitionCard: {text: "Sonraki bölüm", subtext: "İş görüşmeleri", enter: "clockWipe", exit: "iris"},
  lightLeak: {text: "Çayınızı alın"},
  starburst: {text: "Başlıyoruz"},
  sideCard: {text: "Neden önemli?", subtext: "Üç sebep", items: ["Hız", "Maliyet", "Güvenlik"], align: "right"},
  statBadge: {text: "%90", label: "şirket kullanıyor", align: "right", position: "top"},
  callout: {text: "Dikkat: bu kısım önemli", subtext: "Not al", align: "left"},
  lottie: {src: "https://example.com/anim.json", text: ""},
  gif: {src: "https://example.com/anim.gif", text: ""},
};

// Types that need an external URL are left out of the prompt: the model cannot know a valid URL.
const PROMPT_TYPES = (Object.keys(CATALOG) as EffectType[]).filter((t) => t !== "lottie" && t !== "gif");

const catalogText = () =>
  PROMPT_TYPES.map((type) => {
    const c = CATALOG[type];
    const required = c.required.length ? ` Required: ${c.required.join(", ")}.` : "";
    const styles = STYLES[type];
    const styleLine = styles ? ` Styles: ${styles.join(" | ")} (first = default).` : "";
    const sample = styles ? {effectType: type, style: styles[styles.length > 1 ? 1 : 0], ...EXAMPLES[type]} : {effectType: type, ...EXAMPLES[type]};
    return `- ${type}: ${c.use}.${styleLine}${required}\n  e.g. ${JSON.stringify(sample)}`;
  }).join("\n");

const body = (target: number) => `Plan on-screen graphics for a talking-head video from the attached SRT subtitle file.

## Output
Reply with ONE valid JSON object inside a single \`\`\`json code block, and nothing else (no text before or after it, no comments). The code block matters: chat apps copy plain text from it without adding backslashes.
{"effects": [ <effect>, <effect>, ... ]}

Every effect is a FLAT object (no nested wrapper objects) with these base fields, always present:
- "id": string "NN-effectType", NN = running number starting at 01, unique (e.g. "07-gauge")
- "effectType": one of the types below
- "text": string ("" if the type has no text)
- "cue": integer, the SRT cue NUMBER (the number on the line above the timestamp) of the line where the effect appears
- "endCue": integer, optional, the cue number where it should end (use it when the moment spans several short lines)
...plus the extra fields of its type.

## Timing: you do NOT compute any time or frame
Never write seconds, timecodes or frame numbers. Only copy cue numbers exactly as they appear in the SRT. The program converts them to frames.
- Effects should last about 2-9 seconds: if one cue is shorter than 2 seconds, set "endCue" to include the following cue(s).
- NO OVERLAP: sort effects by "cue", and every effect's "cue" must be greater than the previous effect's "endCue" (or its "cue" if it has no "endCue").
- Pick the cue where the thing is actually SAID. Check that the cue number really belongs to that sentence.

## effectType catalog (use ONLY these types and ONLY the fields shown in their examples)
${catalogText()}

## Strict value rules (a wrong type makes the render fail)
- "highlight", "items", "steps", "shapes" are ARRAYS of strings, never a single string. "highlight" holds single words copied exactly from "text".
- "annotation" is ONLY one of: "highlight", "underline", "circle", "box", "bracket", "strike", "crossed". Never free text.
- "mode" is ONLY "check", "cross" or "warning". "position" is ONLY "top", "center" or "bottom". "align" is ONLY "left", "center" or "right".
- "style" must be one of the styles listed for that type in the catalog (omit it for the default look). Types without a "Styles:" list have no "style".
- "cue", "endCue", "from", "to", "value" are numbers, not strings. "value" is 0-100. "marks" is an array of {"value": number 0-100, "label": string}.
- "number" (chapter), "prefix", "suffix", "label", "subtext", "left", "right" are strings.
- "items" and "steps" have 2-6 entries, each under 30 characters. "emoji" is ONLY one of: ${listEmojis().join(", ")}.
- "enter" / "exit" are ONLY: fade, slide, wipe, flip, clockWipe, iris, blurSlide. Optional "enterDirection": from-left, from-right, from-top, from-bottom (slide/wipe/flip only). Do NOT use "zoomInOut".
- Optional "fx": [{"name": "glow"}] where name is ONLY one of: glow, chromatic-aberration, scanlines, wave, vignette, shine. Use rarely. Do not add any other field.

## Editing rules
1. About ${target} effects in total, spread over the WHOLE video from start to end (the last effect near the closing cues), only for important moments: hook (in the first cues), thesis, numbers, comparisons, lists, turning points, warnings, jokes, chapter changes, closing.
2. Be varied: at least 12 different effectTypes, never the same effectType twice in a row. When you reuse a type, change its "style" each time.
2b. Use the side layouts (sideCard, statBadge, callout, or "align": "left"/"right" on text types) for about a quarter of the effects so the speaker stays visible in the middle; alternate left and right.
3. Text on screen is short (max ~60 characters), in the video's language, rewritten for the screen, with obvious subtitle typos fixed. Never invent facts.
4. Fill every required field with real content from the speech.

## Before answering, silently check
- JSON parses; every effect has id, effectType, text, cue.
- every cue/endCue number exists in the SRT; ids unique; cues strictly increasing; no overlap; no identical types back to back.
- arrays are arrays, enums use only the allowed values, numbers are numbers.
- the effects cover the whole video, not just the first part.`;

export function buildPrompt(model: Model, target = 40): string {
  const core = body(target);
  switch (model) {
    case "claude":
      return `<!-- Claude: paste this and attach altyazi.srt. API: prompt in "system", SRT text in the user turn, prefill the reply with "{". -->\nYou are a senior video editor.\n\n${core}\n`;
    case "chatgpt":
      return `<!-- ChatGPT: paste this and attach altyazi.srt, then copy only the JSON. API: response_format {"type":"json_object"}. -->\nYou are a senior video editor.\n\n${core}\n\nDo not ask questions. If the JSON is cut off, continue from where it stopped.\n`;
    case "gemini":
      return `<!-- Gemini: paste this and upload altyazi.srt. API: responseMimeType "application/json". -->\nYou are a senior video editor.\n\n${core}\n\nGo through the whole file in order before answering.\n`;
    default:
      return `<!-- Grok / DeepSeek / Mistral / Llama / Qwen: paste this and attach or paste the SRT. -->\nYou are a senior video editor. Answer with the JSON only, inside a single \`\`\`json code block, no explanation. Use only the listed effectType and transition names.\n\n${core}\n`;
  }
}
