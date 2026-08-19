import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/chrome/ThemeToggle";

const setTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme }),
}));

beforeEach(() => setTheme.mockClear());

it("시스템·라이트·다크 선택을 제공하고 다크 선택을 저장한다", () => {
  render(<ThemeToggle />);

  expect(screen.getByRole("group", { name: "색상 테마" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "다크" }));
  expect(setTheme).toHaveBeenCalledWith("dark");
});
