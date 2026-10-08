import React from "react";
import {AbsoluteFill, Sequence, useCurrentFrame} from "remotion";
import * as E from "./components/effects";
import * as V from "./components/variants";
import {FxWrap, Presented} from "./components/Wrappers";
import type {Effect, EffectType, VideoData} from "./types";

type Comp = React.FC<{effect: Effect}>;

// The base component is the default look; "variants" maps other style names to their component.
const withStyles = (Base: Comp, variants: Record<string, Comp>): Comp => (props) => {
  const Variant = variants[props.effect.style ?? ""];
  return Variant ? <Variant {...props} /> : <Base {...props} />;
};

const COMPONENTS: Record<EffectType, Comp> = {
  kineticText: withStyles(E.KineticText, {typewriter: V.KineticTypewriter, bounce: V.KineticBounce, reveal: V.KineticReveal}),
  captionHighlight: withStyles(E.CaptionHighlight, {plain: V.CaptionPlain}),
  counter: withStyles(E.Counter, {plain: V.CounterPlain}),
  gauge: E.Gauge,
  versus: withStyles(E.Versus, {split: V.VersusSplit}),
  checklist: withStyles(E.Checklist, {floating: V.ChecklistFloating}),
  timeline: withStyles(E.Timeline, {vertical: V.TimelineVertical}),
  questionHook: withStyles(E.QuestionHook, {marks: V.QuestionMarks}),
  chapter: withStyles(E.Chapter, {banner: V.ChapterBanner, minimal: V.ChapterMinimal}),
  quote: E.Quote,
  bigStatement: E.BigStatement,
  glitch: withStyles(E.Glitch, {vhs: V.GlitchVhs, shake: V.GlitchShake}),
  emojiBurst: withStyles(E.EmojiBurst, {trio: V.EmojiTrio}),
  shapesBurst: withStyles(E.ShapesBurst, {rain: V.ShapesRain, ring: V.ShapesRing}),
  lowerThird: withStyles(E.LowerThird, {pill: V.LowerPill, tag: V.LowerTag}),
  progressBar: withStyles(E.ProgressBar, {segments: V.ProgressSegments}),
  transitionCard: withStyles(E.TransitionCard, {dark: V.CardDark, split: V.CardSplit}),
  lightLeak: E.LightLeakFx,
  starburst: E.StarburstFx,
  sideCard: withStyles(E.SideCard, {plain: V.SidePlain}),
  statBadge: withStyles(E.StatBadge, {circle: V.BadgeCircle, ribbon: V.BadgeRibbon}),
  callout: withStyles(E.CalloutNote, {arrow: V.CalloutArrow}),
  lottie: E.LottieFx,
  gif: E.GifFx,
};

// Glitch gets its RGB split shader by default.
const withDefaults = (e: Effect): Effect =>
  e.effectType === "glitch" && !e.fx ? {...e, fx: [{name: "chromatic-aberration", amount: 5}]} : e;

// Renders one effect from local frame 0 (the caller positions it in time).
export const EffectLayer: React.FC<{effect: Effect}> = ({effect}) => {
  const e = withDefaults(effect);
  const Component = COMPONENTS[e.effectType];
  if (!Component) throw new Error(`Unknown effectType "${e.effectType}"`);
  return (
    <AbsoluteFill lang="tr">
      <Presented effect={e}>
        <FxWrap fx={e.fx}>
          <Component effect={e} />
        </FxWrap>
      </Presented>
    </AbsoluteFill>
  );
};

export const MainVideo: React.FC<VideoData> = ({effects}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: "linear-gradient(135deg, #1b1f3b, #0b0d1a)"}}>
      {effects.map((effect) => {
        const local = frame - effect.startFrame;
        if (local < 0 || local >= effect.durationInFrames) return null;
        return <EffectAt key={effect.id} effect={effect} />;
      })}
    </AbsoluteFill>
  );
};

const EffectAt: React.FC<{effect: Effect}> = ({effect}) => (
  <Sequence from={effect.startFrame} durationInFrames={effect.durationInFrames} layout="none">
    <EffectLayer effect={effect} />
  </Sequence>
);

// Renders one effect alone on a transparent background, starting at frame 0.
export const EffectClip: React.FC<{effect: Effect; fps: number}> = ({effect}) => (
  <AbsoluteFill>
    <EffectLayer effect={effect} />
  </AbsoluteFill>
);
