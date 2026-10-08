import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, FONT_DISPLAY, shadow} from "../theme";
import type {Align, Effect, Position} from "../types";

export const usePop = (delay = 0, config = {damping: 11, stiffness: 140, mass: 0.7}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config});
};

// Fade-out over the last `n` frames of the effect.
export const useFadeOut = (durationInFrames: number, n = 8) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [durationInFrames - n, durationInFrames], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
};

export const accentOf = (e: Effect) => e.accent ?? COLORS.accent;
export const colorOf = (e: Effect) => e.color ?? COLORS.text;

export const justify = (p: Position | undefined): React.CSSProperties => ({
  justifyContent: p === "top" ? "flex-start" : p === "bottom" ? "flex-end" : "center",
  padding: p === "top" ? "110px 140px 0" : p === "bottom" ? "0 140px 130px" : "0 140px",
});

export const displayText = (size: number, color: string = COLORS.text): React.CSSProperties => ({
  fontFamily: FONT_DISPLAY,
  fontSize: size,
  color,
  textShadow: shadow,
  lineHeight: 1.08,
  textTransform: "uppercase",
  letterSpacing: 1,
});

// Font size that keeps a headline readable for its length.
export const sizeFor = (text: string, max = 130, min = 64) => {
  const len = text.length;
  if (len <= 14) return max;
  if (len >= 80) return min;
  return Math.round(max - ((max - min) * (len - 14)) / 66);
};

export const wordsOf = (text: string) => text.split(/\s+/).filter(Boolean);

export const normalizeWord = (w: string) => w.toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}%]/gu, "");

// Horizontal placement inside a column flex container (AbsoluteFill).
export const alignStyle = (a?: Align): React.CSSProperties => ({
  alignItems: a === "left" ? "flex-start" : a === "right" ? "flex-end" : "center",
  textAlign: a ?? "center",
});

export const flexAlign = (a?: Align): "flex-start" | "center" | "flex-end" => (a === "left" ? "flex-start" : a === "right" ? "flex-end" : "center");

// Side margin so left/right content does not touch the screen edge.
export const sidePad = (a?: Align): React.CSSProperties => (a === "left" ? {paddingLeft: 90} : a === "right" ? {paddingRight: 90} : {});

export const Fill: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
  <AbsoluteFill style={{display: "flex", alignItems: "center", ...style}}>{children}</AbsoluteFill>
);

// Alpha-aware rotating rays (fades toward the edges so the video underneath stays visible).
export const Rays: React.FC<{color: string; angle: number; opacity?: number}> = ({color, angle, opacity = 1}) => (
  <div style={{position: "absolute", inset: "-50%", opacity, background: `repeating-conic-gradient(from ${angle}deg, ${color}66 0deg 9deg, transparent 9deg 18deg)`, WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 38%)", maskImage: "radial-gradient(circle, #000 0%, transparent 38%)"}} />
);
