export type EffectType =
  | "kineticText"
  | "captionHighlight"
  | "counter"
  | "gauge"
  | "versus"
  | "checklist"
  | "timeline"
  | "questionHook"
  | "chapter"
  | "quote"
  | "bigStatement"
  | "glitch"
  | "emojiBurst"
  | "shapesBurst"
  | "lowerThird"
  | "progressBar"
  | "transitionCard"
  | "lightLeak"
  | "starburst"
  | "sideCard"
  | "statBadge"
  | "callout"
  | "lottie"
  | "gif";

export type Position = "top" | "center" | "bottom";
export type Align = "left" | "center" | "right";

// Visual variants. A type without an entry here has a single look. The first entry is the default.
export const STYLES: Partial<Record<EffectType, readonly string[]>> = {
  kineticText: ["pop", "typewriter", "bounce", "reveal"],
  captionHighlight: ["box", "plain"],
  counter: ["ring", "plain"],
  versus: ["cards", "split"],
  checklist: ["card", "floating"],
  timeline: ["horizontal", "vertical"],
  questionHook: ["rings", "marks"],
  chapter: ["rays", "banner", "minimal"],
  quote: ["big", "card", "minimal"],
  bigStatement: ["punch", "slam", "outline", "split", "stamp"],
  glitch: ["rgb", "vhs", "shake"],
  emojiBurst: ["single", "trio"],
  shapesBurst: ["burst", "rain", "ring"],
  lowerThird: ["bar", "pill", "tag"],
  progressBar: ["bar", "segments"],
  transitionCard: ["gradient", "dark", "split"],
  statBadge: ["star", "circle", "ribbon"],
  sideCard: ["card", "plain"],
  callout: ["bubble", "arrow"],
};
export type Annotation = "highlight" | "underline" | "circle" | "box" | "bracket" | "strike" | "crossed";

// One canvas effect from @remotion/effects, e.g. {"name": "glow", "radius": 30, "color": "#ff0"}.
export type FxSpec = {name: string; [param: string]: unknown};

export type Mark = {value: number; label: string};

export type Effect = {
  id: string;
  effectType: EffectType;
  text: string;
  startFrame: number;
  durationInFrames: number;

  // Alternative to startFrame/durationInFrames: SRT cue numbers (resolved by the CLI when --srt is given).
  cue?: number;
  endCue?: number;

  // Common optional fields (any effect type).
  enter?: string; // @remotion/transitions presentation used to bring the effect in
  exit?: string; // presentation used to take it out
  enterDirection?: string;
  transitionFrames?: number;
  fx?: FxSpec[]; // @remotion/effects applied to the whole effect
  color?: string;
  accent?: string;
  position?: Position;
  align?: Align; // horizontal placement (left/right keeps the speaker visible)
  style?: string; // variant, see STYLES

  // Type-specific optional fields.
  highlight?: string[];
  annotation?: Annotation;
  from?: number;
  to?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  value?: number;
  marks?: Mark[];
  left?: string;
  right?: string;
  items?: string[];
  steps?: string[];
  mode?: "check" | "cross" | "warning";
  number?: string;
  subtext?: string;
  emoji?: string;
  shapes?: string[];
  src?: string;
  seed?: number;
};

export type VideoData = {
  durationInFrames: number;
  fps: number;
  effects: Effect[];
};

export type EffectClipProps = {
  effect: Effect;
  fps: number;
};

export const PRESENTATIONS = [
  "fade", "slide", "wipe", "flip", "clockWipe", "iris", "none",
  "blurSlide", "bookFlip", "crosswarp", "crossZoom", "dissolve", "dreamyZoom", "filmBurn",
  "linearBlur", "pushCut", "ripple", "swap", "zoomBlur", "zoomInOut",
] as const;

// These paint an opaque backdrop while transitioning, so on a transparent overlay they cover the video.
// They look right only on full-screen "transitionCard" effects.
export const OPAQUE_PRESENTATIONS = ["dreamyZoom", "pushCut", "swap"] as const;

export type CatalogEntry = {
  use: string;
  required: string[];
  optional: string[];
};

// Source of truth for validation and for the prompt that asks an LLM to plan effects.
export const CATALOG: Record<EffectType, CatalogEntry> = {
  kineticText: {use: "A key sentence appears word by word; chosen words get a hand-drawn annotation", required: ["text"], optional: ["highlight", "annotation", "position", "align", "style"]},
  captionHighlight: {use: "Karaoke-style caption where the spoken word lights up", required: ["text"], optional: ["position", "style", "align"]},
  counter: {use: "A number counting up/down, e.g. 0 -> 100%", required: ["text", "from", "to"], optional: ["prefix", "suffix", "label", "style", "align", "position"]},
  gauge: {use: "A dial/needle showing a value on a 0-100 scale with labelled marks", required: ["text", "value"], optional: ["marks", "label"]},
  versus: {use: "Two things compared head to head", required: ["left", "right"], optional: ["text", "style"]},
  checklist: {use: "A list whose items appear one by one (check, cross or warning marks)", required: ["items"], optional: ["text", "mode", "style", "align", "position"]},
  timeline: {use: "A sequence of 2-6 steps connected by a drawn line", required: ["steps"], optional: ["text", "style", "align", "position"]},
  questionHook: {use: "A big question that hooks the viewer", required: ["text"], optional: ["style"]},
  chapter: {use: "Section title card with a number and rays behind it", required: ["text"], optional: ["number", "subtext", "style", "align", "position"]},
  quote: {use: "Highlighted quotation or memorable line", required: ["text"], optional: ["style", "highlight", "subtext", "align", "position"]},
  bigStatement: {use: "A shouted statement", required: ["text"], optional: ["style", "position", "align"]},
  glitch: {use: "Aggressive RGB-split / glitch text for shock or warning moments", required: ["text"], optional: ["position", "style"]},
  emojiBurst: {use: "A large animated emoji with a short caption", required: ["emoji"], optional: ["text", "style"]},
  shapesBurst: {use: "Confetti-like burst of geometric shapes with a short caption", required: [], optional: ["text", "shapes", "style"]},
  lowerThird: {use: "Small banner at the bottom: a name, a place, a source", required: ["text"], optional: ["subtext", "style", "align", "position"]},
  progressBar: {use: "A horizontal bar filling to a value with labelled marks", required: ["text", "value"], optional: ["marks", "style"]},
  transitionCard: {use: "Full-screen colored card used as a scene break (give it enter/exit)", required: ["text"], optional: ["subtext", "style"]},
  lightLeak: {use: "Warm light flash accent, optionally with a short text", required: [], optional: ["text", "seed"]},
  starburst: {use: "Rotating rays behind a short text", required: [], optional: ["text"]},
  sideCard: {use: "Info box on the left or right side of the screen with a title and optional bullet points (the speaker stays visible)", required: ["text"], optional: ["subtext", "items", "align", "position", "style"]},
  statBadge: {use: "Compact badge in a corner with a big figure and a caption", required: ["text"], optional: ["label", "align", "position", "style"]},
  callout: {use: "Speech-bubble note at the side that points toward the middle of the screen", required: ["text"], optional: ["subtext", "align", "position", "style"]},
  lottie: {use: "A Lottie animation from a URL", required: ["src"], optional: ["text"]},
  gif: {use: "A GIF from a URL", required: ["src"], optional: ["text"]},
};

export const defaultVideoData: VideoData = {
  durationInFrames: 150,
  fps: 30,
  effects: [{id: "default", effectType: "kineticText", text: "Subanimo", startFrame: 10, durationInFrames: 120}],
};
