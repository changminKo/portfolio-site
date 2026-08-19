import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

it("핵심 포지셔닝을 하나의 H1으로 렌더한다", () => {
  render(<HomePage />);

  expect(
    screen.getByRole("heading", { level: 1, name: "느낌 대신, 측정으로 증명합니다." }),
  ).toBeInTheDocument();
});
