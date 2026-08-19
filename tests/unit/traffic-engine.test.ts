import { describe, expect, it } from "vitest";
import { capacityFor, createTrafficState, stepTraffic } from "@/features/demos/traffic/traffic-engine";

function run(users: number, ticks: number) {
  let state = createTrafficState({ concurrentUsers: users, model: "before", seed: 20260819 });
  for (let index = 0; index < ticks; index += 1) state = stepTraffic(state);
  return state;
}

describe("traffic engine", () => {
  it("두 모델의 이론상 처리량을 160과 432 req/s로 계산한다", () => {
    expect(capacityFor("before")).toBe(160);
    expect(capacityFor("after")).toBe(432);
  });

  it("같은 seed와 설정은 같은 60초 series를 만든다", () => {
    expect(run(1500, 240).series).toEqual(run(1500, 240).series);
  });

  it("동시 사용자가 늘면 P95와 큐 깊이가 감소하지 않는다", () => {
    const low = run(500, 240).sample;
    const high = run(3000, 240).sample;
    expect(high.p95Ms).toBeGreaterThanOrEqual(low.p95Ms);
    expect(high.queueDepth).toBeGreaterThanOrEqual(low.queueDepth);
  });

  it("큐를 30000개로 제한하고 초과 요청을 거부한다", () => {
    const overloaded = run(3000, 500);
    expect(overloaded.queue.length).toBeLessThanOrEqual(30000);
    expect(overloaded.rejectedCount).toBeGreaterThan(0);
  });
});
