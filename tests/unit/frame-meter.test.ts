import { expect, it } from "vitest";
import { summarizeFrameGaps } from "@/lib/performance/frame-meter";

it("최근 프레임 간격의 중앙값과 FPS를 계산한다", () => {
  expect(summarizeFrameGaps([16, 18, 17, 40])).toEqual({ medianMs: 17.5, fps: 57 });
});
