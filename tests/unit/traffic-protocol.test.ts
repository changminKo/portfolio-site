import { expect, it } from "vitest";
import { isTrafficWorkerIn } from "@/features/demos/traffic/traffic-protocol";

it("유효한 start와 stop만 Worker 입력으로 허용한다", () => {
  expect(isTrafficWorkerIn({ type: "start", config: { concurrentUsers: 1500, model: "before", seed: 20260819 } })).toBe(true);
  expect(isTrafficWorkerIn({ type: "stop" })).toBe(true);
  expect(isTrafficWorkerIn({ type: "start", config: { concurrentUsers: 1550, model: "before", seed: 1 } })).toBe(false);
  expect(isTrafficWorkerIn({ type: "unknown" })).toBe(false);
});
