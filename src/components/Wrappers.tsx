import React from "react";
import {AbsoluteFill, HtmlInCanvas, useVideoConfig} from "remotion";
import {linearTiming, TransitionSeries} from "@remotion/transitions";
import {EFFECTS} from "../fx/registry";
import {getPresentation} from "../fx/presentations";
import type {Effect} from "../types";

// Applies @remotion/effects (canvas shaders) to the children.
export const FxWrap: React.FC<{fx?: Effect["fx"]; children: React.ReactNode}> = ({fx, children}) => {
  const {width, height} = useVideoConfig();
  if (!fx || fx.length === 0) return <>{children}</>;
  const effects = fx.map(({name, ...params}) => {
    const factory = EFFECTS[name];
    if (!factory) throw new Error(`Unknown effect "${name}". Known: ${Object.keys(EFFECTS).join(", ")}`);
    return factory(params);
  });
  return (
    <HtmlInCanvas width={width} height={height} effects={effects}>
      <AbsoluteFill>{children}</AbsoluteFill>
    </HtmlInCanvas>
  );
};

const Empty: React.FC = () => <AbsoluteFill />;

// Brings the content in/out with a @remotion/transitions presentation.
export const Presented: React.FC<{effect: Effect; children: React.ReactNode}> = ({effect, children}) => {
  const {width, height} = useVideoConfig();
  const {enter, exit, enterDirection, durationInFrames} = effect;
  const hasEnter = !!enter && enter !== "none";
  const hasExit = !!exit && exit !== "none";
  if (!hasEnter && !hasExit) return <>{children}</>;

  const t = Math.max(2, Math.min(effect.transitionFrames ?? 12, Math.floor(durationInFrames / 4)));
  const pad = t + 1;
  const body = durationInFrames - (hasEnter ? 1 : 0) - (hasExit ? 1 : 0);

  return (
    <TransitionSeries>
      {hasEnter && (
        <>
          <TransitionSeries.Sequence durationInFrames={pad}><Empty /></TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={getPresentation(enter!, width, height, enterDirection)} timing={linearTiming({durationInFrames: t})} />
        </>
      )}
      <TransitionSeries.Sequence durationInFrames={body}>{children}</TransitionSeries.Sequence>
      {hasExit && (
        <>
          <TransitionSeries.Transition presentation={getPresentation(exit!, width, height)} timing={linearTiming({durationInFrames: t})} />
          <TransitionSeries.Sequence durationInFrames={pad}><Empty /></TransitionSeries.Sequence>
        </>
      )}
    </TransitionSeries>
  );
};
