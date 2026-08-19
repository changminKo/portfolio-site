/// <reference lib="webworker" />
import { createTrafficState, stepTraffic, type TrafficState } from "./traffic-engine";
import { isTrafficWorkerIn, type TrafficWorkerOut } from "./traffic-protocol";

const scope: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;
let state: TrafficState | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const stop = () => { if (timer !== null) clearInterval(timer); timer = null; };
const post = (message: TrafficWorkerOut) => scope.postMessage(message);

scope.onmessage = ({ data }: MessageEvent<unknown>) => {
  if (!isTrafficWorkerIn(data)) { post({ type: "error", message: "잘못된 Worker 메시지입니다." }); return; }
  if (data.type === "stop") { stop(); return; }
  stop();
  try {
    state = createTrafficState(data.config);
    timer = setInterval(() => {
      if (!state) return;
      state = stepTraffic(state);
      post({ type: "sample", sample: state.sample, series: state.series });
    }, 250);
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : "시뮬레이터를 시작할 수 없습니다." });
  }
};

export {};
