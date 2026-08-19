import { expect, it, vi } from "vitest";
import { createFreezeSession, runReparseBurst } from "@/features/demos/freeze/freeze-session";

it("재파싱 burst를 목표 80ms까지만 실행한다", () => {
  let time = 0;
  const parser = vi.fn(() => ({}));
  runReparseBurst("a=1", 80, () => { time += 10; return time; }, parser);
  expect(parser).toHaveBeenCalledTimes(7);
});

it("세션은 250ms 주기로 실행되고 6초에 한 번 완료된다", () => {
  vi.useFakeTimers();
  const onComplete = vi.fn();
  const onTick = vi.fn();
  const session = createFreezeSession({ source: "a=1", mode: "cached", onTick, onComplete });
  session.start();
  vi.advanceTimersByTime(6000);
  expect(onTick).toHaveBeenCalled();
  expect(onComplete).toHaveBeenCalledTimes(1);
  vi.useRealTimers();
});
