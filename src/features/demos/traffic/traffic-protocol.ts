import type { TrafficConfig, TrafficSample } from "./traffic-engine";

export type TrafficWorkerIn =
  | { type: "start" | "configure"; config: TrafficConfig }
  | { type: "stop" };
export type TrafficWorkerOut =
  | { type: "sample"; sample: TrafficSample; series: readonly TrafficSample[] }
  | { type: "error"; message: string };

export function isTrafficWorkerIn(value: unknown): value is TrafficWorkerIn {
  if (typeof value !== "object" || value === null || !("type" in value)) return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.type === "stop") return true;
  if ((candidate.type !== "start" && candidate.type !== "configure") || typeof candidate.config !== "object" || candidate.config === null) return false;
  const config = candidate.config as Record<string, unknown>;
  return typeof config.concurrentUsers === "number"
    && config.concurrentUsers >= 100
    && config.concurrentUsers <= 3000
    && config.concurrentUsers % 100 === 0
    && (config.model === "before" || config.model === "after")
    && typeof config.seed === "number";
}
