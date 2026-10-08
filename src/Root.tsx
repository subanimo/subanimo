import React from "react";
import {Composition} from "remotion";
import {EffectClip, MainVideo} from "./MainVideo";
import {defaultVideoData, EffectClipProps, VideoData} from "./types";

export const COMPOSITION_ID = "MainVideo";
export const CLIP_COMPOSITION_ID = "EffectClip";

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id={COMPOSITION_ID}
      component={MainVideo}
      width={1920}
      height={1080}
      fps={defaultVideoData.fps}
      durationInFrames={defaultVideoData.durationInFrames}
      defaultProps={defaultVideoData}
      // Duration and fps come from the JSON passed via inputProps.
      calculateMetadata={({props}: {props: VideoData}) => ({
        durationInFrames: props.durationInFrames,
        fps: props.fps,
      })}
    />
    <Composition
      id={CLIP_COMPOSITION_ID}
      component={EffectClip}
      width={1920}
      height={1080}
      fps={defaultVideoData.fps}
      durationInFrames={defaultVideoData.effects[0].durationInFrames}
      defaultProps={{effect: defaultVideoData.effects[0], fps: defaultVideoData.fps} as EffectClipProps}
      calculateMetadata={({props}: {props: EffectClipProps}) => ({
        durationInFrames: Math.max(1, props.effect.durationInFrames),
        fps: props.fps,
      })}
    />
    </>
  );
};
