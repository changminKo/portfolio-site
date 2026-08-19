import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import TrafficSpikeDemo from "@/features/demos/traffic/TrafficSpikeDemo";

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock("framer-motion", () => ({ useReducedMotion: () => motion.reduced }));

class FakeWorker {
  static instance: FakeWorker;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { FakeWorker.instance = this; }
}

beforeEach(() => {
  motion.reduced = false;
  vi.stubGlobal("Worker", FakeWorker);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
    strokeStyle: "", lineWidth: 1,
  } as unknown as CanvasRenderingContext2D);
});

it("사용자와 모델을 Worker에 보내고 표로 표본을 표시한다", () => {
  render(<TrafficSpikeDemo />);
  fireEvent.change(screen.getByLabelText("동시 사용자"), { target: { value: "1500" } });
  fireEvent.click(screen.getByRole("radio", { name: "최적화 후" }));
  expect(FakeWorker.instance.postMessage).toHaveBeenLastCalledWith({ type: "configure", config: { concurrentUsers: 1500, model: "after", seed: 20260819 } });
  act(() => FakeWorker.instance.onmessage?.({ data: { type: "sample", sample: { timeMs: 1000, p95Ms: 450, throughput: 432, queueDepth: 12, rejectedCount: 0 }, series: [] } } as MessageEvent));
  expect(screen.getByRole("cell", { name: "450ms" })).toBeInTheDocument();
  expect(screen.getByText("원리 설명용 가상 모델")).toBeInTheDocument();
});

it("reduced-motion에서는 1Hz 갱신 모드를 표시한다", () => {
  motion.reduced = true;
  render(<TrafficSpikeDemo />);
  expect(screen.getByTestId("traffic-demo")).toHaveAttribute("data-reduced-motion", "true");
});
