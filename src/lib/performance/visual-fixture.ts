import type { FrameSnapshot } from "./frame-meter";
import type { VitalName } from "./vitals";

export type VisualMetricFixture = { values: Record<VitalName, number>; frame: FrameSnapshot };
export const VISUAL_METRIC_FIXTURE: VisualMetricFixture = {
  values: { LCP: 1180, CLS: 0.012, INP: 86 },
  frame: { medianMs: 16.7, fps: 60 },
};
