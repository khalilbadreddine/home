import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { DirectorCut } from "./DirectorCut";
import type { VisualPlan } from "./types";
import { planDuration } from "./lib/timeline";
import { SAMPLE_PLAN } from "./sample-plan";

const calculateMetadata: CalculateMetadataFunction<Record<string, unknown>> = ({ props: raw }) => {
  const props = raw as unknown as VisualPlan;
  const fps = props.meta?.fps ?? 30;
  return {
    fps,
    width: props.meta?.width ?? 1920,
    height: props.meta?.height ?? 1080,
    durationInFrames: Math.max(1, Math.ceil(planDuration(props) * fps)),
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="DirectorCut"
    component={DirectorCut as unknown as React.FC<Record<string, unknown>>}
    defaultProps={SAMPLE_PLAN as unknown as Record<string, unknown>}
    calculateMetadata={calculateMetadata}
    fps={30}
    width={1920}
    height={1080}
    durationInFrames={300}
  />
);
