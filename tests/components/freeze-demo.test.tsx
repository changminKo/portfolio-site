import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import FreezeDemo from "@/features/demos/freeze/FreezeDemo";

vi.mock("@/features/demos/freeze/freeze-session", async (loadOriginal) => {
  const original = await loadOriginal<typeof import("@/features/demos/freeze/freeze-session")>();
  return { ...original, createFreezeSession: ({ onComplete }: { onComplete: () => void }) => ({ start: onComplete, stop: onComplete, dispose: vi.fn() }) };
});

it("경고·두 모드·실행·결과를 키보드 가능한 control로 제공한다", () => {
  render(<FreezeDemo />);
  expect(screen.getByText(/최대 6초 동안 의도적으로/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: "매번 재파싱" }));
  fireEvent.click(screen.getByRole("button", { name: "6초 실행" }));
  expect(screen.getByText("실행 완료")).toBeInTheDocument();
  expect(screen.getAllByText(/Long Task/).length).toBeGreaterThan(0);
});
