import { act, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { LiveBrowserMetrics } from "@/components/home/LiveBrowserMetrics";
import type { FrameMeter } from "@/lib/performance/frame-meter";

let report: (metric: { name: string; value: number }) => void = () => undefined;
vi.mock("next/web-vitals", () => ({ useReportWebVitals: (callback: typeof report) => { report = callback; } }));

it("측정 전 상태에서 실제 지표와 프레임 값으로 전환한다", () => {
  const frameMeter: FrameMeter = { start: (onSample) => { onSample({ medianMs: 16.7, fps: 60 }); return () => undefined; } };
  render(<LiveBrowserMetrics frameMeter={frameMeter} support={{ LCP: true, CLS: true, INP: true }} />);
  expect(screen.getByText("입력 전")).toBeInTheDocument();
  act(() => report({ name: "LCP", value: 1234.4 }));
  act(() => report({ name: "CLS", value: 0.0123 }));
  act(() => report({ name: "INP", value: 88.4 }));
  expect(screen.getByText("1,234ms")).toBeInTheDocument();
  expect(screen.getByText("0.012")).toBeInTheDocument();
  expect(screen.getByText("88ms")).toBeInTheDocument();
  expect(screen.getByText("16.7ms · 60 FPS")).toBeInTheDocument();
});
