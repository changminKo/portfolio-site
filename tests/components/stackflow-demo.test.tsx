import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import StackflowDemo from "@/features/demos/stackflow/StackflowDemo";

vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "dark" }) }));
vi.mock("@/features/demos/stackflow/stackflow.instance", () => ({ Stack: () => <div>서재 Activity</div> }));

it("폰 프레임 안에 Stack과 텍스트 상태를 렌더한다", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  render(<StackflowDemo />);
  expect(screen.getByTestId("stackflow-demo")).toHaveAttribute("data-demo-chunk", "demo-chunk:stackflow");
  expect(screen.getByText("서재 Activity")).toBeInTheDocument();
  expect(screen.getByText("stack depth 1 · 대기")).toBeInTheDocument();
  expect(screen.getByLabelText("웹뷰 스택 탐색 데모")).toBeInTheDocument();
  expect(screen.getByTestId("stackflow-demo")).toHaveAttribute("data-reduced-motion", "true");
});
