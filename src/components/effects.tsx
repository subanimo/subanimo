import React from "react";
import {AbsoluteFill, interpolate, Easing, random, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Highlight, Underline, Circle as RoughCircle, Box as RoughBox, Bracket, StrikeThrough, CrossedOff} from "@remotion/rough-notation";
import {Circle, Star, Heart, Triangle, Polygon, Spark, Pie, Rect, Callout} from "@remotion/shapes";
import {evolvePath} from "@remotion/paths";
import {noise2D} from "@remotion/noise";
import {CameraMotionBlur} from "@remotion/motion-blur";
import {LightLeak} from "@remotion/light-leaks";
import {getAvailableEmojis} from "@remotion/animated-emoji";
import {createTikTokStyleCaptions} from "@remotion/captions";
import {Lottie, type LottieAnimationData} from "@remotion/lottie";
import {Gif} from "@remotion/gif";
import {continueRender, delayRender, staticFile} from "remotion";
import {COLORS, FONT_BODY, FONT_DISPLAY, shadow} from "../theme";
import {Fill, Rays, accentOf, alignStyle, colorOf, displayText, flexAlign, justify, normalizeWord, sidePad, sizeFor, useFadeOut, usePop, wordsOf} from "./common";
import type {Annotation, Effect} from "../types";

type P = {effect: Effect};

const Annot: React.FC<{kind: Annotation; progress: number; color: string; children: React.ReactNode}> = ({kind, progress, color, children}) => {
  const common = {progress, color};
  switch (kind) {
    case "underline": return <Underline {...common} strokeWidth={8}>{children}</Underline>;
    case "circle": return <RoughCircle {...common} strokeWidth={6} padding={{left: 18, right: 18, top: 10, bottom: 10}}>{children}</RoughCircle>;
    case "box": return <RoughBox {...common} strokeWidth={6} padding={{left: 14, right: 14, top: 8, bottom: 8}}>{children}</RoughBox>;
    case "bracket": return <Bracket {...common} strokeWidth={6}>{children}</Bracket>;
    case "strike": return <StrikeThrough {...common} strokeWidth={8}>{children}</StrikeThrough>;
    case "crossed": return <CrossedOff {...common} strokeWidth={8}>{children}</CrossedOff>;
    default: return <Highlight {...common} color={color + "cc"}>{children}</Highlight>;
  }
};

/* ---------- text ---------- */

export const KineticText: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const words = wordsOf(e.text);
  const hl = new Set((e.highlight ?? []).map(normalizeWord));
  const size = sizeFor(e.text, 120, 66);
  return (
    <Fill style={{...justify(e.position), ...alignStyle(e.align), ...sidePad(e.align), opacity: out}}>
      <div style={{display: "flex", flexWrap: "wrap", justifyContent: flexAlign(e.align), gap: `0 ${size * 0.28}px`, maxWidth: e.align && e.align !== "center" ? 900 : 1650}}>
        {words.map((w, i) => (
          <KineticWord key={i} i={i} word={w} size={size} color={colorOf(e)} accent={accentOf(e)} annotated={hl.has(normalizeWord(w))} kind={e.annotation ?? "highlight"} frame={frame} />
        ))}
      </div>
    </Fill>
  );
};

const KineticWord: React.FC<{i: number; word: string; size: number; color: string; accent: string; annotated: boolean; kind: Annotation; frame: number}> = ({i, word, size, color, accent, annotated, kind}) => {
  const pop = usePop(i * 3);
  const mark = usePop(i * 3 + 14, {damping: 20, stiffness: 80, mass: 1});
  const content = (
    <span style={{...displayText(size, annotated && kind === "highlight" ? "#111" : color), display: "inline-block", transform: `translateY(${interpolate(pop, [0, 1], [50, 0])}px) scale(${interpolate(pop, [0, 1], [0.5, 1])})`, opacity: Math.min(1, pop * 2)}}>{word}</span>
  );
  return annotated ? <Annot kind={kind} progress={Math.min(1, mark)} color={accent}>{content}</Annot> : content;
};

export const CaptionHighlight: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = useFadeOut(e.durationInFrames);
  const words = wordsOf(e.text);
  const totalMs = (e.durationInFrames / fps) * 1000;
  const slice = totalMs / Math.max(words.length, 1);
  const captions = words.map((w, i) => ({text: (i ? " " : "") + w, startMs: i * slice, endMs: (i + 1) * slice, timestampMs: (i + 0.5) * slice, confidence: 1}));
  const {pages} = createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds: 1400});
  const nowMs = (frame / fps) * 1000;
  const page = pages.find((p) => nowMs >= p.startMs && nowMs < p.startMs + p.durationMs) ?? pages[pages.length - 1];
  const pop = usePop(0);
  return (
    <Fill style={{...justify(e.position ?? "bottom"), opacity: out}}>
      <div style={{...displayText(84), maxWidth: 1600, textAlign: "center", background: COLORS.card, padding: "22px 44px", borderRadius: 24, transform: `scale(${interpolate(pop, [0, 1], [0.8, 1])})`}}>
        {page?.tokens.map((t, i) => {
          const active = nowMs >= t.fromMs && nowMs < t.toMs;
          return <span key={i} style={{color: active ? accentOf(e) : colorOf(e), display: "inline-block", margin: "0 0.2em", transform: active ? "scale(1.12)" : "none"}}>{t.text.trim()}</span>;
        })}
      </div>
    </Fill>
  );
};

const QuoteBig: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0);
  const words = wordsOf(e.text);
  const hl = new Set((e.highlight ?? []).map(normalizeWord));
  const mark = usePop(18, {damping: 20, stiffness: 80, mass: 1});
  return (
    <Fill style={{...justify(e.position), opacity: out}}>
      <div style={{maxWidth: 1500, textAlign: "center", transform: `scale(${interpolate(pop, [0, 1], [0.85, 1])})`, opacity: pop}}>
        <div style={{fontFamily: FONT_DISPLAY, fontSize: 260, lineHeight: 0.6, color: accentOf(e), textShadow: shadow}}>“</div>
        <div style={{...displayText(sizeFor(e.text, 96, 60)), textTransform: "none"}}>
          {words.map((w, i) => (
            <span key={i} style={{display: "inline-block", margin: "0 0.14em"}}>
              {hl.has(normalizeWord(w)) ? <Highlight progress={Math.min(1, mark)} color={accentOf(e) + "cc"}><span style={{color: "#111"}}>{w}</span></Highlight> : w}
            </span>
          ))}
        </div>
        {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 40, color: accentOf(e), marginTop: 24}}>— {e.subtext}</div>}
      </div>
    </Fill>
  );
};

const HighlightedWords: React.FC<{e: Effect; size: number; mark: number; color?: string}> = ({e, size, mark, color}) => {
  const hl = new Set((e.highlight ?? []).map(normalizeWord));
  return (
    <div style={{...displayText(size, color), textTransform: "none"}}>
      {wordsOf(e.text).map((w, i) => (
        <span key={i} style={{display: "inline-block", margin: "0 0.14em"}}>
          {hl.has(normalizeWord(w)) ? <Highlight progress={Math.min(1, mark)} color={accentOf(e) + "cc"}><span style={{color: "#111"}}>{w}</span></Highlight> : w}
        </span>
      ))}
    </div>
  );
};

const QuoteCard: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0, {damping: 14, stiffness: 110, mass: 0.8});
  const mark = usePop(16, {damping: 20, stiffness: 80, mass: 1});
  const align = e.align ?? "left";
  const dir = align === "right" ? 1 : -1;
  return (
    <Fill style={{...justify(e.position), ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{maxWidth: 820, background: COLORS.card, borderLeft: `12px solid ${accentOf(e)}`, borderRadius: 24, padding: "36px 48px", transform: `translateX(${interpolate(pop, [0, 1], [dir * 700, 0])}px)`, textAlign: "left"}}>
        <div style={{fontFamily: FONT_DISPLAY, fontSize: 110, lineHeight: 0.5, color: accentOf(e), height: 50}}>“</div>
        <HighlightedWords e={e} size={sizeFor(e.text, 70, 48)} mark={mark} color={colorOf(e)} />
        {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 34, color: accentOf(e), marginTop: 18}}>— {e.subtext}</div>}
      </div>
    </Fill>
  );
};

const QuoteMinimal: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0);
  const mark = usePop(14, {damping: 20, stiffness: 80, mass: 1});
  const align = e.align ?? "left";
  return (
    <Fill style={{...justify(e.position ?? "bottom"), ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{maxWidth: 1100, display: "flex", gap: 24, transform: `translateY(${interpolate(pop, [0, 1], [40, 0])}px)`, opacity: pop, textAlign: "left"}}>
        <div style={{width: 10, background: accentOf(e), borderRadius: 5, flex: "none", transform: `scaleY(${pop})`, transformOrigin: "top"}} />
        <div>
          <HighlightedWords e={e} size={sizeFor(e.text, 64, 44)} mark={mark} color={colorOf(e)} />
          {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 32, color: accentOf(e), marginTop: 10}}>{e.subtext}</div>}
        </div>
      </div>
    </Fill>
  );
};

export const Quote: React.FC<P> = (props) => {
  switch (props.effect.style ?? "big") {
    case "card": return <QuoteCard {...props} />;
    case "minimal": return <QuoteMinimal {...props} />;
    default: return <QuoteBig {...props} />;
  }
};

const BigPunch: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = useFadeOut(e.durationInFrames);
  const punch = spring({frame, fps, config: {damping: 8, stiffness: 200, mass: 0.6}});
  const shake = Math.max(0, 1 - frame / 14) * 14;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Rays color={accentOf(e)} angle={frame * 0.6} opacity={Math.min(1, frame / 6)} />
      <CameraMotionBlur shutterAngle={140} samples={5}>
        <Fill style={justify(e.position)}>
          <div style={{...displayText(sizeFor(e.text, 170, 80), colorOf(e)), textAlign: "center", maxWidth: 1650, transform: `translate(${noise2D("x", frame * 0.9, 0) * shake}px, ${noise2D("y", 0, frame * 0.9) * shake}px) scale(${interpolate(punch, [0, 1], [2.2, 1])})`}}>{e.text}</div>
        </Fill>
      </CameraMotionBlur>
    </AbsoluteFill>
  );
};

const BigSlam: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = useFadeOut(e.durationInFrames);
  const band = spring({frame, fps, config: {damping: 18, stiffness: 160, mass: 0.7}});
  const text = spring({frame: frame - 5, fps, config: {damping: 9, stiffness: 190, mass: 0.6}});
  const shake = Math.max(0, 1 - (frame - 5) / 10) * 12;
  const dir = e.align === "right" ? -1 : 1;
  return (
    <Fill style={{...justify(e.position), opacity: out}}>
      <div style={{position: "relative", width: "100%"}}>
        <div style={{position: "absolute", left: 0, right: 0, top: -30, bottom: -30, background: accentOf(e), transform: `scaleX(${band})`, transformOrigin: e.align === "right" ? "right" : "left"}} />
        <div style={{...displayText(sizeFor(e.text, 150, 76), "#111"), textShadow: "none", position: "relative", textAlign: e.align ?? "center", padding: "0 140px", transform: `translate(${interpolate(text, [0, 1], [dir * -900, 0]) + noise2D("s", frame, 0) * shake}px, ${noise2D("t", 0, frame) * shake}px)`}}>{e.text}</div>
      </div>
    </Fill>
  );
};

const BigOutline: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0);
  const fill = interpolate(frame, [10, Math.min(e.durationInFrames * 0.6, 50)], [0, 100], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic)});
  const size = sizeFor(e.text, 190, 90);
  return (
    <Fill style={{...justify(e.position), ...alignStyle(e.align), ...sidePad(e.align), opacity: out}}>
      <div style={{...displayText(size), textShadow: "none", maxWidth: 1650, transform: `scale(${interpolate(pop, [0, 1], [0.85, 1])})`, WebkitTextStroke: `5px ${colorOf(e)}`, backgroundImage: `linear-gradient(to top, ${accentOf(e)} ${fill}%, transparent ${fill}%)`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent"}}>{e.text}</div>
    </Fill>
  );
};

const BigSplit: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const a = usePop(0, {damping: 13, stiffness: 120, mass: 0.8});
  const b = usePop(5, {damping: 13, stiffness: 120, mass: 0.8});
  const words = wordsOf(e.text);
  const cut = Math.ceil(words.length / 2);
  const size = sizeFor(e.text, 170, 90);
  return (
    <Fill style={{...justify(e.position), opacity: out}}>
      <div style={{...displayText(size, colorOf(e)), textAlign: "center", maxWidth: 1650}}>
        <div style={{transform: `translateX(${interpolate(a, [0, 1], [-1400, 0])}px)`}}>{words.slice(0, cut).join(" ")}</div>
        <div style={{color: accentOf(e), transform: `translateX(${interpolate(b, [0, 1], [1400, 0])}px)`}}>{words.slice(cut).join(" ")}</div>
      </div>
    </Fill>
  );
};

const BigStamp: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = useFadeOut(e.durationInFrames);
  const hit = spring({frame, fps, config: {damping: 6, stiffness: 220, mass: 0.7}});
  const flash = Math.max(0, 1 - frame / 6);
  return (
    <Fill style={{...justify(e.position), opacity: out}}>
      <div style={{...displayText(sizeFor(e.text, 140, 76), accentOf(e)), textShadow: "none", border: `12px solid ${accentOf(e)}`, borderRadius: 24, padding: "20px 56px", background: `rgba(10,12,28,${0.35 + flash * 0.4})`, maxWidth: 1500, textAlign: "center", transform: `rotate(-5deg) scale(${interpolate(hit, [0, 1], [3, 1])})`, opacity: Math.min(1, frame / 3)}}>{e.text}</div>
    </Fill>
  );
};

export const BigStatement: React.FC<P> = (props) => {
  switch (props.effect.style ?? "punch") {
    case "slam": return <BigSlam {...props} />;
    case "outline": return <BigOutline {...props} />;
    case "split": return <BigSplit {...props} />;
    case "stamp": return <BigStamp {...props} />;
    default: return <BigPunch {...props} />;
  }
};

export const Glitch: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames, 6);
  const burst = random(`g${Math.floor(frame / 3)}`) > 0.55;
  const jx = burst ? (random(`x${frame}`) - 0.5) * 20 : 0;
  const slice = burst ? `inset(${random(`a${frame}`) * 60}% 0 ${random(`b${frame}`) * 30}% 0)` : "none";
  const text = <div style={{...displayText(sizeFor(e.text, 150, 76), colorOf(e)), textAlign: "center", maxWidth: 1650}}>{e.text}</div>;
  return (
    <Fill style={{...justify(e.position), opacity: out}}>
      <div style={{position: "relative", transform: `translateX(${jx}px)`}}>
        <div style={{position: "absolute", inset: 0, color: COLORS.hot, mixBlendMode: "screen", opacity: 0.85, transform: "translateX(-4px)", clipPath: slice}}>{text}</div>
        <div style={{position: "absolute", inset: 0, color: COLORS.cool, mixBlendMode: "screen", opacity: 0.85, transform: "translateX(4px)", clipPath: slice}}>{text}</div>
        {text}
      </div>
    </Fill>
  );
};

/* ---------- data ---------- */

export const Counter: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0);
  const from = e.from ?? 0;
  const to = e.to ?? 100;
  const count = Math.min(e.durationInFrames * 0.6, 60);
  const t = interpolate(frame, [4, 4 + count], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const value = Math.round(from + (to - from) * t);
  const R = 230;
  const progress = Math.abs(to - from) === 0 ? 1 : Math.min(1, Math.abs(value - from) / Math.abs(to - from));
  return (
    <Fill style={{justifyContent: "center", opacity: out}}>
      <div style={{position: "relative", width: R * 2 + 40, height: R * 2 + 40, transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])})`}}>
        <svg width={R * 2 + 40} height={R * 2 + 40} style={{position: "absolute"}}>
          <circle cx={R + 20} cy={R + 20} r={R} fill={COLORS.card} stroke="#ffffff22" strokeWidth={22} />
          <g transform={`translate(20 20)`}>
            <Pie radius={R} progress={progress} closePath={false} fill="none" stroke={accentOf(e)} strokeWidth={22} strokeLinecap="round" rotation={-Math.PI / 2} />
          </g>
        </svg>
        <div style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
          <div style={displayText(150, colorOf(e))}>{(e.prefix ?? "") + value + (e.suffix ?? "")}</div>
          {(e.label || e.text) && <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 40, color: accentOf(e), textAlign: "center", maxWidth: 380}}>{e.label ?? e.text}</div>}
        </div>
      </div>
    </Fill>
  );
};

const ARC = "M 120 380 A 260 260 0 0 1 640 380";

export const Gauge: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = useFadeOut(e.durationInFrames);
  const draw = interpolate(frame, [0, 24], [0, 1], {extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const needle = spring({frame: frame - 14, fps, config: {damping: 7, stiffness: 70, mass: 1}});
  const value = Math.max(0, Math.min(100, e.value ?? 50));
  const angle = -90 + 180 * (value / 100) * needle;
  const evolved = evolvePath(draw, ARC);
  const pt = (v: number, r: number) => {
    const a = Math.PI * (1 - v / 100);
    return {x: 380 + Math.cos(a) * r, y: 380 - Math.sin(a) * r};
  };
  return (
    <Fill style={{justifyContent: "center", opacity: out}}>
      <div style={{background: COLORS.card, borderRadius: 40, padding: "40px 60px 30px", textAlign: "center"}}>
        <div style={{...displayText(64), marginBottom: 6}}>{e.text}</div>
        <svg width={760} height={430} viewBox="0 0 760 430">
          <path d={ARC} fill="none" stroke="#ffffff22" strokeWidth={34} strokeLinecap="round" />
          <path d={ARC} fill="none" stroke={accentOf(e)} strokeWidth={34} strokeLinecap="round" {...evolved} />
          {(e.marks ?? []).map((m, i) => {
            const p = pt(m.value, 320);
            return <text key={i} x={p.x} y={p.y} fill="#fff" fontFamily={FONT_BODY} fontWeight={800} fontSize={34} textAnchor="middle" opacity={draw}>{m.label}</text>;
          })}
          <g transform={`rotate(${angle} 380 380)`}>
            <polygon points="372,380 388,380 380,150" fill={COLORS.hot} />
          </g>
          <circle cx={380} cy={380} r={20} fill="#fff" />
        </svg>
        {e.label && <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 38, color: accentOf(e)}}>{e.label}</div>}
      </div>
    </Fill>
  );
};

export const ProgressBar: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0);
  const value = Math.max(0, Math.min(100, e.value ?? 50));
  const fill = interpolate(frame, [6, Math.min(e.durationInFrames * 0.7, 54)], [0, value], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  return (
    <Fill style={{...justify(e.position), opacity: out}}>
      <div style={{width: 1500, background: COLORS.card, borderRadius: 36, padding: "36px 54px 44px", transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`, opacity: pop}}>
        <div style={{...displayText(64), textTransform: "none", marginBottom: 26}}>{e.text}</div>
        <div style={{position: "relative", height: 44, borderRadius: 22, background: "#ffffff22"}}>
          <div style={{width: `${fill}%`, height: "100%", borderRadius: 22, background: `linear-gradient(90deg, ${COLORS.cool}, ${accentOf(e)})`}} />
          {(e.marks ?? []).map((m, i) => (
            <div key={i} style={{position: "absolute", left: `${m.value}%`, top: -6, transform: "translateX(-50%)"}}>
              <div style={{width: 4, height: 56, background: "#fff", margin: "0 auto"}} />
              <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 32, color: "#fff", marginTop: 8, whiteSpace: "nowrap"}}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{height: 44}} />
      </div>
    </Fill>
  );
};

/* ---------- structure ---------- */

export const Versus: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const l = usePop(0);
  const r = usePop(6);
  const vs = usePop(14, {damping: 8, stiffness: 160, mass: 0.6});
  const panel = (text: string, color: string, p: number, dir: number): React.ReactNode => (
    <div style={{width: 700, minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 36, borderRadius: 40, background: COLORS.card, border: `6px solid ${color}`, transform: `translateX(${interpolate(p, [0, 1], [dir * 900, 0])}px)`}}>
      <div style={displayText(sizeFor(text, 80, 52), "#fff")}>{text}</div>
    </div>
  );
  return (
    <Fill style={{justifyContent: "center", opacity: out}}>
      {e.text && <div style={{position: "absolute", top: 90, width: "100%", textAlign: "center", ...displayText(60, accentOf(e))}}>{e.text}</div>}
      <div style={{display: "flex", alignItems: "center", gap: 150, position: "relative"}}>
        {panel(e.left ?? "", COLORS.cool, l, -1)}
        {panel(e.right ?? "", COLORS.hot, r, 1)}
        <div style={{position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) scale(${vs}) rotate(${frame * 1.5}deg)`}}>
          <Star points={8} innerRadius={70} outerRadius={120} fill={accentOf(e)} />
        </div>
        <div style={{position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) scale(${vs})`, ...displayText(64, "#111")}}>VS</div>
      </div>
    </Fill>
  );
};

export const Checklist: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const items = e.items ?? [];
  const mode = e.mode ?? "check";
  const step = Math.max(8, Math.min(20, Math.floor((e.durationInFrames * 0.6) / Math.max(items.length, 1))));
  return (
    <Fill style={{justifyContent: "center", opacity: out}}>
      <div style={{background: COLORS.card, borderRadius: 40, padding: "44px 70px", minWidth: 1100}}>
        {e.text && <div style={{...displayText(60, accentOf(e)), marginBottom: 28}}>{e.text}</div>}
        {items.map((it, i) => <ChecklistRow key={i} text={it} delay={i * step} mode={mode} accent={accentOf(e)} />)}
      </div>
    </Fill>
  );
};

const ChecklistRow: React.FC<{text: string; delay: number; mode: "check" | "cross" | "warning"; accent: string}> = ({text, delay, mode, accent}) => {
  const pop = usePop(delay);
  const mark = usePop(delay + 8, {damping: 20, stiffness: 90, mass: 1});
  const icon = mode === "cross" ? "✕" : mode === "warning" ? "!" : "✓";
  const iconColor = mode === "cross" ? COLORS.hot : mode === "warning" ? accent : "#5be37d";
  return (
    <div style={{display: "flex", alignItems: "center", gap: 28, margin: "16px 0", opacity: pop, transform: `translateX(${interpolate(pop, [0, 1], [-120, 0])}px)`}}>
      <div style={{width: 74, height: 74, borderRadius: 37, background: iconColor, color: "#111", fontFamily: FONT_DISPLAY, fontSize: 52, display: "flex", alignItems: "center", justifyContent: "center", flex: "none"}}>{icon}</div>
      {mode === "cross" ? <CrossedOff progress={Math.min(1, mark)} color={COLORS.hot} strokeWidth={7}><span style={{...displayText(64), textTransform: "none"}}>{text}</span></CrossedOff> : <span style={{...displayText(64), textTransform: "none"}}>{text}</span>}
    </div>
  );
};

export const Timeline: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const steps = e.steps ?? [];
  const W = 1500;
  const line = interpolate(frame, [0, Math.min(e.durationInFrames * 0.6, 50)], [0, 1], {extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic)});
  const path = `M 0 40 L ${W} 40`;
  const evolved = evolvePath(line, path);
  const n = Math.max(steps.length, 1);
  return (
    <Fill style={{justifyContent: "center", opacity: out}}>
      <div style={{background: COLORS.card, borderRadius: 40, padding: "40px 80px 50px"}}>
        {e.text && <div style={{...displayText(60, accentOf(e)), textAlign: "center", marginBottom: 30}}>{e.text}</div>}
        <div style={{position: "relative", width: W, height: 200}}>
          <svg width={W} height={80} style={{position: "absolute", top: 0, left: 0, overflow: "visible"}}>
            <path d={path} stroke="#ffffff22" strokeWidth={10} strokeLinecap="round" />
            <path d={path} stroke={accentOf(e)} strokeWidth={10} strokeLinecap="round" {...evolved} />
          </svg>
          {steps.map((s, i) => <TimelineNode key={i} label={s} x={n === 1 ? W / 2 : 150 + ((W - 300) * i) / (n - 1)} reveal={(i / Math.max(n - 1, 1)) * Math.min(e.durationInFrames * 0.45, 40)} accent={accentOf(e)} />)}
        </div>
      </div>
    </Fill>
  );
};

const TimelineNode: React.FC<{label: string; x: number; reveal: number; accent: string}> = ({label, x, reveal, accent}) => {
  const pop = usePop(reveal);
  return (
    <div style={{position: "absolute", left: x, top: 0, transform: `translateX(-50%) scale(${pop})`, textAlign: "center", width: 260}}>
      <div style={{width: 80, height: 80, margin: "0 auto"}}><Circle radius={40} fill={accent} stroke="#fff" strokeWidth={6} /></div>
      <div style={{...displayText(46), textTransform: "none", marginTop: 20, lineHeight: 1.15}}>{label}</div>
    </div>
  );
};

export const QuestionHook: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0, {damping: 7, stiffness: 150, mass: 0.7});
  const wob = noise2D("q", frame * 0.04, 0) * 4;
  return (
    <Fill style={{justifyContent: "center", opacity: out}}>
      {[0, 1, 2].map((i) => {
        const t = ((frame + i * 14) % 42) / 42;
        return <div key={i} style={{position: "absolute", width: 360, height: 360, left: "50%", top: "50%", marginLeft: -180, marginTop: -330, opacity: (1 - t) * 0.6, transform: `scale(${1 + t * 1.6})`}}><Circle radius={180} fill="none" stroke={accentOf(e)} strokeWidth={8} /></div>;
      })}
      <div style={{textAlign: "center", transform: `scale(${pop}) rotate(${wob}deg)`}}>
        <div style={{...displayText(400, accentOf(e)), lineHeight: 0.9}}>?</div>
        <div style={{...displayText(sizeFor(e.text, 100, 60)), maxWidth: 1500}}>{e.text}</div>
      </div>
    </Fill>
  );
};

export const Chapter: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0);
  const num = usePop(8, {damping: 9, stiffness: 120, mass: 0.8});
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Rays color={accentOf(e)} angle={frame * 0.5} opacity={pop} />
      <Fill style={{justifyContent: "center"}}>
        <div style={{textAlign: "center"}}>
          {e.number && <div style={{...displayText(300, "transparent"), WebkitTextStroke: `6px ${accentOf(e)}`, textShadow: "none", transform: `scale(${num})`, lineHeight: 1}}>{e.number}</div>}
          <div style={{...displayText(sizeFor(e.text, 130, 70)), maxWidth: 1600, transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`, opacity: pop}}>{e.text}</div>
          {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 46, color: accentOf(e), marginTop: 18}}>{e.subtext}</div>}
        </div>
      </Fill>
    </AbsoluteFill>
  );
};

export const LowerThird: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0, {damping: 14, stiffness: 120, mass: 0.7});
  return (
    <Fill style={{justifyContent: "flex-end", alignItems: "flex-start", padding: "0 0 120px 100px", opacity: out}}>
      <div style={{display: "flex", transform: `translateX(${interpolate(pop, [0, 1], [-700, 0])}px)`}}>
        <div style={{width: 16, background: accentOf(e), borderRadius: 8}} />
        <div style={{background: COLORS.card, padding: "22px 44px", borderRadius: "0 24px 24px 0"}}>
          <div style={{...displayText(64), textTransform: "none"}}>{e.text}</div>
          {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 36, color: accentOf(e)}}>{e.subtext}</div>}
        </div>
      </div>
    </Fill>
  );
};

export const TransitionCard: React.FC<P> = ({effect: e}) => {
  const pop = usePop(6);
  return (
    <AbsoluteFill style={{background: `linear-gradient(135deg, ${accentOf(e)}, ${COLORS.hot})`, justifyContent: "center", alignItems: "center"}}>
      <div style={{textAlign: "center", transform: `scale(${interpolate(pop, [0, 1], [0.8, 1])})`, opacity: pop}}>
        <div style={{...displayText(sizeFor(e.text, 160, 80), "#111"), textShadow: "none", maxWidth: 1600}}>{e.text}</div>
        {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 52, color: "#111", marginTop: 20}}>{e.subtext}</div>}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- side layouts ---------- */

export const SideCard: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0, {damping: 14, stiffness: 110, mass: 0.8});
  const align = e.align ?? "right";
  const dir = align === "left" ? -1 : 1;
  const items = e.items ?? [];
  return (
    <Fill style={{...justify(e.position), ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{width: 560, background: COLORS.card, borderRadius: 28, borderTop: `10px solid ${accentOf(e)}`, padding: "34px 40px 38px", textAlign: "left", transform: `translateX(${interpolate(pop, [0, 1], [dir * 700, 0])}px)`}}>
        <div style={{...displayText(54, colorOf(e)), textTransform: "none", lineHeight: 1.15}}>{e.text}</div>
        {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 32, color: accentOf(e), marginTop: 12}}>{e.subtext}</div>}
        {items.map((it, i) => <SideItem key={i} text={it} delay={10 + i * 8} accent={accentOf(e)} />)}
      </div>
    </Fill>
  );
};

const SideItem: React.FC<{text: string; delay: number; accent: string}> = ({text, delay, accent}) => {
  const pop = usePop(delay);
  return (
    <div style={{display: "flex", alignItems: "center", gap: 18, marginTop: 18, opacity: pop, transform: `translateX(${interpolate(pop, [0, 1], [40, 0])}px)`}}>
      <div style={{width: 18, height: 18, borderRadius: 9, background: accent, flex: "none"}} />
      <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 36, color: "#fff", lineHeight: 1.2}}>{text}</div>
    </div>
  );
};

export const StatBadge: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0, {damping: 8, stiffness: 150, mass: 0.7});
  const align = e.align ?? "right";
  return (
    <Fill style={{...justify(e.position ?? "top"), ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{position: "relative", width: 360, height: 360, transform: `scale(${pop}) rotate(${interpolate(pop, [0, 1], [-25, 0])}deg)`}}>
        <div style={{position: "absolute", inset: 0, transform: `rotate(${frame * 0.8}deg)`}}>
          <Star points={14} innerRadius={150} outerRadius={180} fill={accentOf(e)} />
        </div>
        <div style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}>
          <div style={{...displayText(Math.max(56, Math.min(130, Math.round(520 / Math.max(e.text.length, 3)))), "#111"), textShadow: "none", lineHeight: 1}}>{e.text}</div>
          {e.label && <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 30, color: "#111", marginTop: 8, maxWidth: 240, lineHeight: 1.1}}>{e.label}</div>}
        </div>
      </div>
    </Fill>
  );
};

export const CalloutNote: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0, {damping: 10, stiffness: 130, mass: 0.7});
  const align = e.align ?? "left";
  // The bubble sits at the side and its pointer aims at the middle of the screen.
  const pointerDirection = align === "right" ? "left" : "right";
  const body = {width: 600, height: e.subtext ? 250 : 190};
  const pointer = 70;
  const shapeW = body.width + pointer;
  const float = noise2D("c", frame * 0.03, 0) * 8;
  return (
    <Fill style={{...justify(e.position), ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{position: "relative", width: shapeW, height: body.height, transform: `translateY(${float}px) scale(${pop})`, transformOrigin: align === "right" ? "right center" : "left center"}}>
        <Callout width={body.width} height={body.height} pointerLength={pointer} pointerBaseWidth={70} pointerDirection={pointerDirection} cornerRadius={28} fill={accentOf(e)} />
        <div style={{position: "absolute", top: 0, bottom: 0, left: pointerDirection === "left" ? pointer : 0, width: body.width, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 36px", textAlign: "left"}}>
          <div style={{...displayText(sizeFor(e.text, 56, 38), "#111"), textShadow: "none", textTransform: "none", lineHeight: 1.15}}>{e.text}</div>
          {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 28, color: "#222", marginTop: 8}}>{e.subtext}</div>}
        </div>
      </div>
    </Fill>
  );
};

/* ---------- decoration ---------- */

const SHAPES = ["star", "circle", "triangle", "heart", "polygon", "spark"] as const;

export const ShapePiece: React.FC<{kind: string; size: number; fill: string}> = ({kind, size, fill}) => {
  switch (kind) {
    case "circle": return <Circle radius={size / 2} fill={fill} />;
    case "triangle": return <Triangle length={size} direction="up" fill={fill} />;
    case "heart": return <Heart height={size} fill={fill} />;
    case "polygon": return <Polygon points={6} radius={size / 2} fill={fill} />;
    case "spark": return <Spark width={size} height={size} fill={fill} />;
    case "rect": return <Rect width={size} height={size} fill={fill} cornerRadius={8} />;
    default: return <Star points={5} innerRadius={size * 0.22} outerRadius={size / 2} fill={fill} />;
  }
};

export const ShapesBurst: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const kinds = e.shapes && e.shapes.length ? e.shapes : [...SHAPES];
  const palette = [accentOf(e), COLORS.hot, COLORS.cool, "#5be37d", "#fff"];
  const pieces = Array.from({length: 28}, (_, i) => i);
  return (
    <AbsoluteFill style={{opacity: out}}>
      {pieces.map((i) => {
        const angle = random(`a${i}`) * Math.PI * 2;
        const speed = 500 + random(`s${i}`) * 900;
        const t = Math.min(1, frame / 40);
        const ease = 1 - Math.pow(1 - t, 3);
        const x = 960 + Math.cos(angle) * speed * ease + noise2D("nx" + i, frame * 0.03, 0) * 30;
        const y = 540 + Math.sin(angle) * speed * 0.7 * ease + noise2D("ny" + i, 0, frame * 0.03) * 30 + frame * 2;
        const size = 40 + random(`z${i}`) * 70;
        return (
          <div key={i} style={{position: "absolute", left: x - size / 2, top: y - size / 2, transform: `rotate(${frame * (random(`r${i}`) * 8 - 4)}deg)`, opacity: Math.min(1, frame / 4)}}>
            <ShapePiece kind={kinds[i % kinds.length]} size={size} fill={palette[i % palette.length]} />
          </div>
        );
      })}
      {e.text && <Fill style={{justifyContent: "center"}}><div style={{...displayText(sizeFor(e.text, 140, 70)), textAlign: "center", maxWidth: 1600}}>{e.text}</div></Fill>}
    </AbsoluteFill>
  );
};

// Plays a Lottie animation; tries each source in order (local copy first, then the internet).
export const LottieFromUrl: React.FC<{src: string | string[]; style?: React.CSSProperties}> = ({src, style}) => {
  const sources = Array.isArray(src) ? src : [src];
  const key = sources.join("|");
  const [data, setData] = React.useState<LottieAnimationData | null>(null);
  const [handle] = React.useState(() => delayRender(`lottie ${key}`));
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const url of sources) {
        try {
          const r = await fetch(url);
          if (!r.ok) continue;
          const j = await r.json();
          if (!cancelled) setData(j);
          break;
        } catch {
          // try the next source
        }
      }
      continueRender(handle);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, handle]);
  return data ? <Lottie animationData={data} style={style} /> : null;
};

// Local copy (downloaded during setup) first, Google's CDN as a fallback.
export const emojiUrl = (e: Effect): string[] => {
  const found = getAvailableEmojis().find((m) => m.name === e.emoji);
  if (!found) throw new Error(`Unknown emoji "${e.emoji}" in effect "${e.id}". See getAvailableEmojis() of @remotion/animated-emoji.`);
  return [staticFile(`emoji/${found.name}.json`), `https://fonts.gstatic.com/s/e/notoemoji/latest/${found.codepoint}/lottie.json`];
};

// Animated Noto emoji (Google), delivered as Lottie JSON from the Google Fonts CDN.
export const EmojiBurst: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0, {damping: 8, stiffness: 140, mass: 0.7});
  return (
    <Fill style={{justifyContent: "center", opacity: out}}>
      <div style={{textAlign: "center", transform: `scale(${pop})`}}>
        <LottieFromUrl src={emojiUrl(e)} style={{width: 420, height: 420, margin: "0 auto"}} />
        {e.text && <div style={{...displayText(sizeFor(e.text, 110, 64)), maxWidth: 1500}}>{e.text}</div>}
      </div>
    </Fill>
  );
};

const Caption: React.FC<{effect: Effect}> = ({effect: e}) =>
  e.text ? <Fill style={{...justify(e.position), pointerEvents: "none"}}><div style={{...displayText(sizeFor(e.text, 120, 64)), textAlign: "center", maxWidth: 1600}}>{e.text}</div></Fill> : null;

export const LightLeakFx: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: "absolute", inset: 0, opacity: 0.75, mixBlendMode: "screen"}}><LightLeak seed={e.seed ?? 3} hueShift={0} /></div>
      <Caption effect={e} />
    </AbsoluteFill>
  );
};

export const StarburstFx: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Rays color={accentOf(e)} angle={frame * 0.7} />
      <Caption effect={e} />
    </AbsoluteFill>
  );
};

export const LottieFx: React.FC<P> = ({effect: e}) => (
  <AbsoluteFill><LottieFromUrl src={e.src!} style={{width: "100%", height: "100%"}} /><Caption effect={e} /></AbsoluteFill>
);

export const GifFx: React.FC<P> = ({effect: e}) => (
  <AbsoluteFill><Fill style={{justifyContent: "center"}}><Gif src={e.src!} width={900} height={600} fit="contain" /></Fill><Caption effect={e} /></AbsoluteFill>
);
