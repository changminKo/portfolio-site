export type ServerModel = "before" | "after";
export type TrafficConfig = { concurrentUsers: number; model: ServerModel; seed: number };
export type TrafficSample = { timeMs: number; p95Ms: number; throughput: number; queueDepth: number; rejectedCount: number };
type Request = { id: number; createdAt: number };
type ActiveRequest = Request & { completesAt: number };
type CompletedRequest = { completedAt: number; latencyMs: number };
export type TrafficState = {
  config: TrafficConfig;
  nowMs: number;
  randomState: number;
  arrivalRemainder: number;
  nextId: number;
  queue: readonly Request[];
  active: readonly ActiveRequest[];
  completed: readonly CompletedRequest[];
  rejectedCount: number;
  sample: TrafficSample;
  series: readonly TrafficSample[];
};

const models = { before: { slots: 40, meanMs: 250 }, after: { slots: 54, meanMs: 125 } } as const;
const TICK_MS = 250;
const MAX_QUEUE = 30000;

export function capacityFor(model: ServerModel): number {
  const config = models[model];
  return config.slots * (1000 / config.meanMs);
}

function random(state: number): { value: number; state: number } {
  const next = (state + 0x6d2b79f5) | 0;
  let value = next;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return { value: ((value ^ (value >>> 14)) >>> 0) / 4294967296, state: next };
}

function percentile95(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

export function createTrafficState(config: TrafficConfig): TrafficState {
  if (config.concurrentUsers < 100 || config.concurrentUsers > 3000 || config.concurrentUsers % 100 !== 0) {
    throw new Error("concurrentUsers는 100부터 3000까지 100 단위여야 합니다");
  }
  const sample = { timeMs: 0, p95Ms: 0, throughput: 0, queueDepth: 0, rejectedCount: 0 };
  return { config, nowMs: 0, randomState: config.seed, arrivalRemainder: 0, nextId: 1, queue: [], active: [], completed: [], rejectedCount: 0, sample, series: [] };
}

export function stepTraffic(state: TrafficState): TrafficState {
  const tickStartedAt = state.nowMs;
  const nowMs = tickStartedAt + TICK_MS;
  const rawArrivals = state.config.concurrentUsers * 0.2 * (TICK_MS / 1000) + state.arrivalRemainder;
  const arrivalCount = Math.floor(rawArrivals);
  const arrivals = Array.from({ length: arrivalCount }, (_, index) => ({ id: state.nextId + index, createdAt: tickStartedAt }));
  const available = Math.max(0, MAX_QUEUE - state.queue.length);
  const accepted = arrivals.slice(0, available);
  const rejectedCount = state.rejectedCount + arrivals.length - accepted.length;
  const queue = [...state.queue, ...accepted];
  const model = models[state.config.model];
  let randomState = state.randomState;
  let active = [...state.active];
  const completedThisTick: CompletedRequest[] = [];
  const fillSlots = (at: number) => {
    while (active.length < model.slots && queue.length > 0) {
      const request = queue.shift();
      if (!request) break;
      const randomSample = random(randomState);
      randomState = randomSample.state;
      active.push({ ...request, completesAt: at + model.meanMs * (0.8 + randomSample.value * 0.4) });
    }
  };
  fillSlots(tickStartedAt);
  while (active.length > 0) {
    const nextCompletion = Math.min(...active.map(({ completesAt }) => completesAt));
    if (nextCompletion > nowMs) break;
    const finished = active.filter(({ completesAt }) => completesAt <= nextCompletion);
    active = active.filter(({ completesAt }) => completesAt > nextCompletion);
    completedThisTick.push(...finished.map((request) => ({
      completedAt: nextCompletion,
      latencyMs: nextCompletion - request.createdAt,
    })));
    fillSlots(nextCompletion);
  }
  const completed = [...state.completed, ...completedThisTick].filter((request) => request.completedAt > nowMs - 60000);
  const recentSecond = completed.filter((request) => request.completedAt > nowMs - 1000);
  const sample: TrafficSample = {
    timeMs: nowMs,
    p95Ms: Math.round(percentile95(completed.map((request) => request.latencyMs))),
    throughput: recentSecond.length,
    queueDepth: queue.length,
    rejectedCount,
  };
  const series = nowMs % 1000 === 0 ? [...state.series, sample].slice(-60) : state.series;
  return {
    ...state,
    nowMs,
    randomState,
    arrivalRemainder: rawArrivals - arrivalCount,
    nextId: state.nextId + arrivalCount,
    queue,
    active,
    completed,
    rejectedCount,
    sample,
    series,
  };
}
