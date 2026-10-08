import React from "react";
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Underline} from "@remotion/rough-notation";
import {noise2D} from "@remotion/noise";
import {evolvePath} from "@remotion/paths";
import {Arrow, Circle} from "@remotion/shapes";
import {createTikTokStyleCaptions} from "@remotion/captions";
import {COLORS, FONT_BODY, FONT_DISPLAY, shadow} from "../theme";
import {Fill, accentOf, alignStyle, colorOf, displayText, flexAlign, justify, normalizeWord, sidePad, sizeFor, useFadeOut, usePop, wordsOf} from "./common";
import {LottieFromUrl, ShapePiece, emojiUrl} from "./effects";
import type {Effect} from "../types";

type P = {effect: Effect};

/* ---------- kineticText ---------- */

export const KineticTypewriter: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const hl = new Set((e.highlight ?? []).map(normalizeWord));
  const total = e.text.length;
  const shown = Math.floor(interpolate(frame, [4, Math.min(e.durationInFrames * 0.6, 4 + total * 1.6)], [0, total], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  const size = sizeFor(e.text, 100, 60);
  let used = 0;
  const parts = e.text.split(/(\s+)/).map((tok, i) => {
    const visible = Math.max(0, Math.min(tok.length, shown - used));
    used += tok.length;
    const on = hl.has(normalizeWord(tok));
    return <span key={i} style={{color: on ? accentOf(e) : colorOf(e)}}>{tok.slice(0, visible)}</span>;
  });
  return (
    <Fill style={{...justify(e.position), ...alignStyle(e.align), ...sidePad(e.align), opacity: out}}>
      <div style={{...displayText(size), maxWidth: e.align && e.align !== "center" ? 900 : 1650, textTransform: "none", whiteSpace: "pre-wrap"}}>
        {parts}
        <span style={{color: accentOf(e), opacity: frame % 16 < 9 ? 1 : 0}}>|</span>
      </div>
    </Fill>
  );
};

export const KineticBounce: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const hl = new Set((e.highlight ?? []).map(normalizeWord));
  const size = sizeFor(e.text, 110, 64);
  let k = 0;
  return (
    <Fill style={{...justify(e.position), ...alignStyle(e.align), ...sidePad(e.align), opacity: out}}>
      <div style={{display: "flex", flexWrap: "wrap", justifyContent: flexAlign(e.align), gap: `0 ${size * 0.3}px`, maxWidth: e.align && e.align !== "center" ? 900 : 1650}}>
        {wordsOf(e.text).map((w, wi) => (
          <span key={wi} style={{display: "inline-block", whiteSpace: "nowrap"}}>
            {[...w].map((ch, ci) => {
              const idx = k++;
              return <BounceChar key={ci} ch={ch} idx={idx} frame={frame} size={size} color={hl.has(normalizeWord(w)) ? accentOf(e) : colorOf(e)} />;
            })}
          </span>
        ))}
      </div>
    </Fill>
  );
};

const BounceChar: React.FC<{ch: string; idx: number; frame: number; size: number; color: string}> = ({ch, idx, frame, size, color}) => {
  const pop = usePop(idx * 1.3, {damping: 7, stiffness: 180, mass: 0.6});
  const wave = Math.sin((frame - idx * 2) * 0.18) * 7;
  return <span style={{...displayText(size, color), display: "inline-block", transform: `translateY(${interpolate(pop, [0, 1], [-120, 0]) + wave}px) scale(${pop})`, opacity: Math.min(1, pop * 3)}}>{ch}</span>;
};

export const KineticReveal: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const hl = new Set((e.highlight ?? []).map(normalizeWord));
  const size = sizeFor(e.text, 120, 66);
  return (
    <Fill style={{...justify(e.position), ...alignStyle(e.align), ...sidePad(e.align), opacity: out}}>
      <div style={{display: "flex", flexWrap: "wrap", justifyContent: flexAlign(e.align), gap: `0 ${size * 0.28}px`, maxWidth: e.align && e.align !== "center" ? 900 : 1650}}>
        {wordsOf(e.text).map((w, i) => <RevealWord key={i} i={i} w={w} size={size} on={hl.has(normalizeWord(w))} e={e} />)}
      </div>
    </Fill>
  );
};

const RevealWord: React.FC<{i: number; w: string; size: number; on: boolean; e: Effect}> = ({i, w, size, on, e}) => {
  const rise = usePop(i * 3, {damping: 16, stiffness: 140, mass: 0.7});
  const line = usePop(i * 3 + 12, {damping: 20, stiffness: 80, mass: 1});
  const word = <span style={{...displayText(size, on ? accentOf(e) : colorOf(e)), display: "inline-block", transform: `translateY(${interpolate(rise, [0, 1], [110, 0])}%)`}}>{w}</span>;
  return (
    <span style={{display: "inline-block", overflow: "hidden", padding: "0.08em 0.1em"}}>
      {on ? <Underline progress={Math.min(1, line)} color={accentOf(e)} strokeWidth={8}>{word}</Underline> : word}
    </span>
  );
};

/* ---------- captionHighlight ---------- */

export const CaptionPlain: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = useFadeOut(e.durationInFrames);
  const words = wordsOf(e.text);
  const slice = ((e.durationInFrames / fps) * 1000) / Math.max(words.length, 1);
  const captions = words.map((w, i) => ({text: (i ? " " : "") + w, startMs: i * slice, endMs: (i + 1) * slice, timestampMs: (i + 0.5) * slice, confidence: 1}));
  const {pages} = createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds: 1400});
  const nowMs = (frame / fps) * 1000;
  const page = pages.find((p) => nowMs >= p.startMs && nowMs < p.startMs + p.durationMs) ?? pages[pages.length - 1];
  return (
    <Fill style={{...justify(e.position ?? "bottom"), ...alignStyle(e.align), ...sidePad(e.align), opacity: out}}>
      <div style={{...displayText(96), maxWidth: 1600, WebkitTextStroke: "6px #000", paintOrder: "stroke fill"}}>
        {page?.tokens.map((t, i) => {
          const active = nowMs >= t.fromMs && nowMs < t.toMs;
          return <span key={i} style={{color: active ? accentOf(e) : colorOf(e), display: "inline-block", margin: "0 0.2em", transform: active ? "scale(1.15) rotate(-2deg)" : "none"}}>{t.text.trim()}</span>;
        })}
      </div>
    </Fill>
  );
};

/* ---------- counter ---------- */

export const CounterPlain: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0);
  const from = e.from ?? 0;
  const to = e.to ?? 100;
  const t = interpolate(frame, [4, Math.min(e.durationInFrames * 0.6, 60)], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const value = Math.round(from + (to - from) * t);
  return (
    <Fill style={{...justify(e.position), ...alignStyle(e.align), ...sidePad(e.align), opacity: out}}>
      <div style={{transform: `scale(${interpolate(pop, [0, 1], [0.7, 1])})`}}>
        <div style={{...displayText(320, colorOf(e)), lineHeight: 1}}>{(e.prefix ?? "") + value + (e.suffix ?? "")}</div>
        <div style={{height: 14, borderRadius: 7, background: accentOf(e), width: `${interpolate(t, [0, 1], [10, 100])}%`}} />
        {(e.label || e.text) && <div style={{...displayText(54, accentOf(e)), textTransform: "none", marginTop: 12}}>{e.label ?? e.text}</div>}
      </div>
    </Fill>
  );
};

/* ---------- versus ---------- */

export const VersusSplit: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const l = usePop(0, {damping: 14, stiffness: 110, mass: 0.8});
  const r = usePop(6, {damping: 14, stiffness: 110, mass: 0.8});
  const vs = usePop(14, {damping: 8, stiffness: 160, mass: 0.6});
  const box = (text: string, color: string, p: number, dir: number): React.ReactNode => (
    <div style={{width: 560, padding: "30px 36px", borderRadius: 28, background: COLORS.card, borderBottom: `12px solid ${color}`, textAlign: "center", transform: `translateX(${interpolate(p, [0, 1], [dir * 800, 0])}px)`}}>
      <div style={displayText(sizeFor(text, 70, 44))}>{text}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: "absolute", left: 80, top: "50%", marginTop: -90}}>{box(e.left ?? "", COLORS.cool, l, -1)}</div>
      <div style={{position: "absolute", right: 80, top: "50%", marginTop: -90}}>{box(e.right ?? "", COLORS.hot, r, 1)}</div>
      <div style={{position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) scale(${vs}) rotate(${Math.sin(frame * 0.2) * 6}deg)`, ...displayText(120, accentOf(e))}}>VS</div>
      {e.text && <div style={{position: "absolute", top: 90, width: "100%", textAlign: "center", ...displayText(56, accentOf(e))}}>{e.text}</div>}
    </AbsoluteFill>
  );
};

/* ---------- checklist ---------- */

export const ChecklistFloating: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const items = e.items ?? [];
  const mode = e.mode ?? "check";
  const align = e.align ?? "left";
  const step = Math.max(8, Math.min(20, Math.floor((e.durationInFrames * 0.6) / Math.max(items.length, 1))));
  return (
    <Fill style={{justifyContent: "center", ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{maxWidth: 900}}>
        {e.text && <div style={{...displayText(64, accentOf(e)), marginBottom: 18, textAlign: align === "right" ? "right" : "left"}}>{e.text}</div>}
        {items.map((it, i) => <FloatRow key={i} text={it} delay={i * step} mode={mode} accent={accentOf(e)} />)}
      </div>
    </Fill>
  );
};

const FloatRow: React.FC<{text: string; delay: number; mode: string; accent: string}> = ({text, delay, mode, accent}) => {
  const pop = usePop(delay, {damping: 10, stiffness: 150, mass: 0.7});
  const icon = mode === "cross" ? "✕" : mode === "warning" ? "!" : "✓";
  const color = mode === "cross" ? COLORS.hot : mode === "warning" ? accent : "#5be37d";
  return (
    <div style={{display: "flex", alignItems: "center", gap: 22, margin: "14px 0", opacity: pop, transform: `translateX(${interpolate(pop, [0, 1], [-140, 0])}px) scale(${interpolate(pop, [0, 1], [0.8, 1])})`}}>
      <div style={{fontFamily: FONT_DISPLAY, fontSize: 74, color, textShadow: shadow, width: 70, textAlign: "center"}}>{icon}</div>
      <div style={{...displayText(68), textTransform: "none"}}>{text}</div>
    </div>
  );
};

/* ---------- timeline ---------- */

export const TimelineVertical: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const steps = e.steps ?? [];
  const align = e.align ?? "left";
  const H = Math.max(1, steps.length - 1) * 150;
  const line = interpolate(frame, [0, Math.min(e.durationInFrames * 0.6, 50)], [0, 1], {extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic)});
  const path = `M 20 0 L 20 ${H}`;
  const evolved = evolvePath(line, path);
  return (
    <Fill style={{justifyContent: "center", ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{background: COLORS.card, borderRadius: 28, padding: "30px 44px", textAlign: "left"}}>
        {e.text && <div style={{...displayText(46, accentOf(e)), marginBottom: 22}}>{e.text}</div>}
        <div style={{position: "relative", width: 480, height: H + 40}}>
          <svg width={40} height={H + 40} style={{position: "absolute", left: 0, top: 20, overflow: "visible"}}>
            <path d={path} stroke="#ffffff22" strokeWidth={8} strokeLinecap="round" />
            <path d={path} stroke={accentOf(e)} strokeWidth={8} strokeLinecap="round" {...evolved} />
          </svg>
          {steps.map((s, i) => <VNode key={i} label={s} y={20 + (H * i) / Math.max(steps.length - 1, 1)} reveal={(i / Math.max(steps.length - 1, 1)) * Math.min(e.durationInFrames * 0.45, 40)} accent={accentOf(e)} />)}
        </div>
      </div>
    </Fill>
  );
};

const VNode: React.FC<{label: string; y: number; reveal: number; accent: string}> = ({label, y, reveal, accent}) => {
  const pop = usePop(reveal);
  return (
    <div style={{position: "absolute", left: 0, top: y, transform: `translateY(-50%) scale(${pop})`, transformOrigin: "left center", display: "flex", alignItems: "center", gap: 24}}>
      <div style={{width: 40, height: 40}}><Circle radius={20} fill={accent} stroke="#fff" strokeWidth={4} /></div>
      <div style={{...displayText(44), textTransform: "none"}}>{label}</div>
    </div>
  );
};

/* ---------- questionHook ---------- */

export const QuestionMarks: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0);
  const spots = Array.from({length: 9}, (_, i) => i);
  return (
    <AbsoluteFill style={{opacity: out}}>
      {spots.map((i) => {
        const x = 8 + random(`qx${i}`) * 84;
        const y = 8 + random(`qy${i}`) * 84;
        const d = i * 4;
        const p = spring({frame: frame - d, fps: 30, config: {damping: 8, stiffness: 140, mass: 0.6}});
        return <div key={i} style={{position: "absolute", left: `${x}%`, top: `${y}%`, ...displayText(120 + random(`qs${i}`) * 140, i % 2 ? accentOf(e) : COLORS.cool), opacity: 0.8 * p, transform: `scale(${p}) rotate(${noise2D(`qr${i}`, frame * 0.03, 0) * 25}deg) translateY(${noise2D(`qt${i}`, 0, frame * 0.03) * 30}px)`}}>?</div>;
      })}
      <Fill style={{justifyContent: "center"}}>
        <div style={{...displayText(sizeFor(e.text, 120, 64)), textAlign: "center", maxWidth: 1500, background: COLORS.card, padding: "24px 48px", borderRadius: 28, transform: `scale(${pop})`}}>{e.text}</div>
      </Fill>
    </AbsoluteFill>
  );
};

/* ---------- chapter ---------- */

export const ChapterBanner: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const band = usePop(0, {damping: 16, stiffness: 120, mass: 0.8});
  const txt = usePop(6);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: "absolute", left: 0, right: 0, top: "50%", marginTop: -130, height: 260, background: accentOf(e), transform: `scaleX(${band})`, transformOrigin: "left"}} />
      <Fill style={{justifyContent: "center"}}>
        <div style={{display: "flex", alignItems: "center", gap: 50, width: "100%", padding: "0 120px", opacity: txt, transform: `translateX(${interpolate(txt, [0, 1], [-200, 0])}px)`}}>
          {e.number && <div style={{...displayText(220, "#111"), textShadow: "none", lineHeight: 1}}>{e.number}</div>}
          <div>
            <div style={{...displayText(sizeFor(e.text, 110, 60), "#111"), textShadow: "none"}}>{e.text}</div>
            {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 44, color: "#222"}}>{e.subtext}</div>}
          </div>
        </div>
      </Fill>
    </AbsoluteFill>
  );
};

export const ChapterMinimal: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0);
  const align = e.align ?? "left";
  return (
    <Fill style={{...justify(e.position ?? "bottom"), ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{textAlign: align === "right" ? "right" : "left", transform: `translateY(${interpolate(pop, [0, 1], [50, 0])}px)`, opacity: pop}}>
        <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 40, color: accentOf(e), letterSpacing: 6}}>{[e.subtext, e.number].filter(Boolean).join("  ·  ")}</div>
        <div style={{height: 8, width: `${pop * 100}%`, maxWidth: 360, background: accentOf(e), margin: "12px 0", borderRadius: 4, marginLeft: align === "right" ? "auto" : 0}} />
        <div style={{...displayText(sizeFor(e.text, 100, 60))}}>{e.text}</div>
      </div>
    </Fill>
  );
};

/* ---------- glitch ---------- */

export const GlitchVhs: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames, 6);
  const bar = ((frame * 14) % 1300) - 100;
  const jitter = random(`j${Math.floor(frame / 2)}`) > 0.8 ? (random(`jx${frame}`) - 0.5) * 30 : 0;
  const text = <div style={{...displayText(sizeFor(e.text, 150, 76), colorOf(e)), textAlign: "center", maxWidth: 1650}}>{e.text}</div>;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Fill style={{...justify(e.position)}}>
        <div style={{position: "relative", transform: `translateX(${jitter}px)`}}>
          <div style={{position: "absolute", inset: 0, transform: "translate(-5px, 2px)", color: COLORS.hot, mixBlendMode: "screen", opacity: 0.8}}>{text}</div>
          <div style={{position: "absolute", inset: 0, transform: "translate(5px, -2px)", color: COLORS.cool, mixBlendMode: "screen", opacity: 0.8}}>{text}</div>
          {text}
        </div>
      </Fill>
      <div style={{position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, transparent 2px, transparent 5px)"}} />
      <div style={{position: "absolute", left: 0, right: 0, top: bar, height: 90, background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)"}} />
    </AbsoluteFill>
  );
};

export const GlitchShake: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames, 6);
  const dx = noise2D("gx", frame * 1.7, 0) * 22;
  const dy = noise2D("gy", 0, frame * 1.7) * 14;
  const flash = random(`f${Math.floor(frame / 2)}`) > 0.9;
  const text = <div style={{...displayText(sizeFor(e.text, 160, 80), flash ? COLORS.hot : colorOf(e)), textAlign: "center", maxWidth: 1650}}>{e.text}</div>;
  return (
    <Fill style={{...justify(e.position), opacity: out}}>
      <div style={{position: "relative", transform: `translate(${dx}px, ${dy}px) rotate(${dx * 0.12}deg) scale(${1 + (flash ? 0.06 : 0)})`}}>
        <div style={{position: "absolute", inset: 0, transform: `translate(${-dx * 0.8}px, 0)`, color: COLORS.cool, opacity: 0.7}}>{text}</div>
        {text}
      </div>
    </Fill>
  );
};

/* ---------- emojiBurst ---------- */

export const EmojiTrio: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const url = emojiUrl(e);
  const sizes = [300, 440, 300];
  return (
    <Fill style={{justifyContent: "center", opacity: out}}>
      <div style={{display: "flex", alignItems: "center", gap: 10}}>
        {sizes.map((s, i) => <TrioPiece key={i} size={s} delay={i === 1 ? 0 : 6} url={url} flip={i === 0} />)}
      </div>
      {e.text && <div style={{...displayText(sizeFor(e.text, 110, 64)), textAlign: "center", maxWidth: 1500}}>{e.text}</div>}
    </Fill>
  );
};

const TrioPiece: React.FC<{size: number; delay: number; url: string[]; flip: boolean}> = ({size, delay, url, flip}) => {
  const pop = usePop(delay, {damping: 8, stiffness: 150, mass: 0.7});
  return <div style={{width: size, height: size, transform: `scale(${pop}) rotate(${flip ? -12 : size < 400 ? 12 : 0}deg)`}}><LottieFromUrl src={url} style={{width: size, height: size}} /></div>;
};

/* ---------- shapesBurst ---------- */

const PAL = (e: Effect) => [accentOf(e), COLORS.hot, COLORS.cool, "#5be37d", "#fff"];
const KINDS = ["star", "circle", "triangle", "heart", "polygon", "spark"];
const Label: React.FC<P> = ({effect: e}) => (e.text ? <Fill style={{justifyContent: "center"}}><div style={{...displayText(sizeFor(e.text, 140, 70)), textAlign: "center", maxWidth: 1600}}>{e.text}</div></Fill> : null);

export const ShapesRain: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const kinds = e.shapes?.length ? e.shapes : KINDS;
  return (
    <AbsoluteFill style={{opacity: out}}>
      {Array.from({length: 26}, (_, i) => {
        const speed = 9 + random(`v${i}`) * 9;
        const x = random(`x${i}`) * 1920 + noise2D(`n${i}`, frame * 0.02, 0) * 60;
        const y = ((frame * speed + random(`y${i}`) * 1400) % 1400) - 160;
        const size = 40 + random(`z${i}`) * 60;
        return <div key={i} style={{position: "absolute", left: x, top: y, transform: `rotate(${frame * (random(`r${i}`) * 6 - 3)}deg)`}}><ShapePiece kind={kinds[i % kinds.length]} size={size} fill={PAL(e)[i % 5]} /></div>;
      })}
      <Label effect={e} />
    </AbsoluteFill>
  );
};

export const ShapesRing: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const kinds = e.shapes?.length ? e.shapes : KINDS;
  const grow = Math.min(1, frame / 24);
  const R = 220 + 330 * (1 - Math.pow(1 - grow, 3));
  return (
    <AbsoluteFill style={{opacity: out}}>
      {Array.from({length: 18}, (_, i) => {
        const a = (i / 18) * Math.PI * 2 + frame * 0.02;
        const size = 60 + (i % 3) * 20;
        return <div key={i} style={{position: "absolute", left: 960 + Math.cos(a) * R * 1.3 - size / 2, top: 540 + Math.sin(a) * R * 0.75 - size / 2, transform: `rotate(${frame * 3 + i * 20}deg) scale(${grow})`}}><ShapePiece kind={kinds[i % kinds.length]} size={size} fill={PAL(e)[i % 5]} /></div>;
      })}
      <Label effect={e} />
    </AbsoluteFill>
  );
};

/* ---------- lowerThird ---------- */

export const LowerPill: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0, {damping: 12, stiffness: 120, mass: 0.7});
  const align = e.align ?? "left";
  return (
    <Fill style={{...justify(e.position ?? "bottom"), ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{background: accentOf(e), borderRadius: 999, padding: "20px 56px", textAlign: "center", transform: `scale(${pop}) translateY(${interpolate(pop, [0, 1], [40, 0])}px)`}}>
        <div style={{...displayText(58, "#111"), textShadow: "none", textTransform: "none"}}>{e.text}</div>
        {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 30, color: "#222"}}>{e.subtext}</div>}
      </div>
    </Fill>
  );
};

export const LowerTag: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const a = usePop(0, {damping: 14, stiffness: 120, mass: 0.7});
  const b = usePop(6, {damping: 14, stiffness: 120, mass: 0.7});
  const align = e.align ?? "left";
  const dir = align === "right" ? 1 : -1;
  return (
    <Fill style={{...justify(e.position ?? "bottom"), ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{textAlign: "left"}}>
        <div style={{display: "inline-block", background: accentOf(e), padding: "10px 36px", transform: `translateX(${interpolate(a, [0, 1], [dir * 600, 0])}px) skewX(-8deg)`}}>
          <div style={{...displayText(60, "#111"), textShadow: "none", transform: "skewX(8deg)"}}>{e.text}</div>
        </div>
        {e.subtext && <div><div style={{display: "inline-block", background: COLORS.card, padding: "8px 30px", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 32, color: "#fff", transform: `translateX(${interpolate(b, [0, 1], [dir * 600, 0])}px)`}}>{e.subtext}</div></div>}
      </div>
    </Fill>
  );
};

/* ---------- progressBar ---------- */

export const ProgressSegments: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0);
  const value = Math.max(0, Math.min(100, e.value ?? 50));
  const N = 20;
  const filled = interpolate(frame, [6, Math.min(e.durationInFrames * 0.7, 54)], [0, (value / 100) * N], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <Fill style={{...justify(e.position), opacity: out}}>
      <div style={{width: 1500, background: COLORS.card, borderRadius: 36, padding: "34px 54px 44px", opacity: pop, transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`}}>
        <div style={{...displayText(62), textTransform: "none", marginBottom: 24}}>{e.text}</div>
        <div style={{display: "flex", gap: 8, height: 54}}>
          {Array.from({length: N}, (_, i) => <div key={i} style={{flex: 1, borderRadius: 8, background: i < Math.floor(filled) ? (i / N > 0.7 ? COLORS.hot : i / N > 0.4 ? accentOf(e) : COLORS.cool) : "#ffffff22", transform: i === Math.floor(filled) ? `scale(${1 + (filled % 1) * 0.2})` : "none"}} />)}
        </div>
        <div style={{position: "relative", height: 50, marginTop: 10}}>
          {(e.marks ?? []).map((m, i) => <div key={i} style={{position: "absolute", left: `${m.value}%`, transform: "translateX(-50%)", fontFamily: FONT_BODY, fontWeight: 800, fontSize: 32, color: "#fff", whiteSpace: "nowrap"}}>{m.label}</div>)}
        </div>
      </div>
    </Fill>
  );
};

/* ---------- transitionCard ---------- */

export const CardDark: React.FC<P> = ({effect: e}) => {
  const line = usePop(4, {damping: 18, stiffness: 100, mass: 0.9});
  const txt = usePop(8);
  return (
    <AbsoluteFill style={{background: "#0b0d1a", justifyContent: "center", alignItems: "center"}}>
      <div style={{textAlign: "center", opacity: txt, transform: `translateY(${interpolate(txt, [0, 1], [40, 0])}px)`}}>
        <div style={{...displayText(sizeFor(e.text, 150, 80)), maxWidth: 1600}}>{e.text}</div>
        <div style={{height: 10, width: 520 * line, background: accentOf(e), margin: "30px auto", borderRadius: 5}} />
        {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 52, color: accentOf(e)}}>{e.subtext}</div>}
      </div>
    </AbsoluteFill>
  );
};

export const CardSplit: React.FC<P> = ({effect: e}) => {
  const a = usePop(0, {damping: 16, stiffness: 110, mass: 0.9});
  const txt = usePop(8);
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: "50%", background: accentOf(e), transform: `translateX(${interpolate(a, [0, 1], [-100, 0])}%)`}} />
      <div style={{position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", background: COLORS.hot, transform: `translateX(${interpolate(a, [0, 1], [100, 0])}%)`}} />
      <Fill style={{justifyContent: "center"}}>
        <div style={{textAlign: "center", opacity: txt, transform: `scale(${interpolate(txt, [0, 1], [0.8, 1])})`}}>
          <div style={{...displayText(sizeFor(e.text, 150, 80), "#fff"), maxWidth: 1600}}>{e.text}</div>
          {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 52, color: "#111"}}>{e.subtext}</div>}
        </div>
      </Fill>
    </AbsoluteFill>
  );
};

/* ---------- statBadge ---------- */

const BadgeText: React.FC<{e: Effect; ink?: string}> = ({e, ink = "#111"}) => (
  <div style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}>
    <div style={{...displayText(Math.max(56, Math.min(130, Math.round(520 / Math.max(e.text.length, 3)))), ink), textShadow: "none", lineHeight: 1}}>{e.text}</div>
    {e.label && <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 30, color: ink, marginTop: 8, maxWidth: 240, lineHeight: 1.1}}>{e.label}</div>}
  </div>
);

export const BadgeCircle: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0, {damping: 9, stiffness: 150, mass: 0.7});
  const align = e.align ?? "right";
  return (
    <Fill style={{...justify(e.position ?? "top"), ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{position: "relative", width: 330, height: 330, transform: `scale(${pop})`}}>
        <div style={{position: "absolute", inset: 0, borderRadius: "50%", background: accentOf(e), border: "14px solid #fff", boxShadow: "0 10px 40px rgba(0,0,0,0.5)"}} />
        <BadgeText e={e} />
      </div>
    </Fill>
  );
};

export const BadgeRibbon: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0, {damping: 10, stiffness: 140, mass: 0.7});
  const align = e.align ?? "right";
  const dir = align === "left" ? -1 : 1;
  return (
    <Fill style={{...justify(e.position ?? "top"), ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{background: accentOf(e), borderRadius: 18, padding: "18px 44px", textAlign: "center", transform: `translateX(${interpolate(pop, [0, 1], [dir * 600, 0])}px) rotate(${dir * 6}deg)`, boxShadow: "0 10px 40px rgba(0,0,0,0.5)"}}>
        <div style={{...displayText(110, "#111"), textShadow: "none", lineHeight: 1}}>{e.text}</div>
        {e.label && <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 32, color: "#111"}}>{e.label}</div>}
      </div>
    </Fill>
  );
};

/* ---------- sideCard ---------- */

export const SidePlain: React.FC<P> = ({effect: e}) => {
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0, {damping: 14, stiffness: 110, mass: 0.8});
  const align = e.align ?? "right";
  const dir = align === "left" ? -1 : 1;
  return (
    <Fill style={{...justify(e.position), ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{width: 640, textAlign: align === "right" ? "right" : "left", transform: `translateX(${interpolate(pop, [0, 1], [dir * 700, 0])}px)`}}>
        <div style={{...displayText(72), textTransform: "none", lineHeight: 1.1}}>{e.text}</div>
        <div style={{height: 10, width: 220 * pop, background: accentOf(e), margin: align === "right" ? "16px 0 16px auto" : "16px 0", borderRadius: 5}} />
        {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 38, color: accentOf(e), textShadow: shadow}}>{e.subtext}</div>}
        {(e.items ?? []).map((it, i) => <PlainItem key={i} text={it} delay={10 + i * 8} />)}
      </div>
    </Fill>
  );
};

const PlainItem: React.FC<{text: string; delay: number}> = ({text, delay}) => {
  const pop = usePop(delay);
  return <div style={{...displayText(46), textTransform: "none", marginTop: 12, opacity: pop, transform: `translateX(${interpolate(pop, [0, 1], [40, 0])}px)`}}>— {text}</div>;
};

/* ---------- callout ---------- */

export const CalloutArrow: React.FC<P> = ({effect: e}) => {
  const frame = useCurrentFrame();
  const out = useFadeOut(e.durationInFrames);
  const pop = usePop(0, {damping: 10, stiffness: 130, mass: 0.7});
  const align = e.align ?? "left";
  const bob = Math.sin(frame * 0.2) * 14 * (align === "right" ? -1 : 1);
  const arrow = <div style={{width: 200, height: 110, transform: `translateX(${bob}px)`}}><Arrow length={200} headWidth={110} headLength={80} shaftWidth={46} direction={align === "right" ? "left" : "right"} fill={accentOf(e)} cornerRadius={8} /></div>;
  const box = (
    <div style={{background: COLORS.card, border: `8px solid ${accentOf(e)}`, borderRadius: 24, padding: "24px 36px", maxWidth: 560, textAlign: "left"}}>
      <div style={{...displayText(sizeFor(e.text, 54, 38)), textTransform: "none", lineHeight: 1.15}}>{e.text}</div>
      {e.subtext && <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 28, color: accentOf(e), marginTop: 8}}>{e.subtext}</div>}
    </div>
  );
  return (
    <Fill style={{...justify(e.position), ...alignStyle(align), ...sidePad(align), opacity: out}}>
      <div style={{display: "flex", alignItems: "center", gap: 20, transform: `scale(${pop})`, transformOrigin: align === "right" ? "right center" : "left center"}}>
        {align === "right" ? <>{arrow}{box}</> : <>{box}{arrow}</>}
      </div>
    </Fill>
  );
};
