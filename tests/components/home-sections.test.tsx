import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

it("히어로 다음에 작업·경력·연락처를 렌더한다", () => {
  const { container } = render(<HomePage />);
  expect(screen.getByText("측정으로 증명하는 성능 엔지니어 — 웹과 웹뷰의 병목을 숫자로 찾고 결과로 바꿉니다.")).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /케이스스터디 보기/ })).toHaveLength(6);
  expect([...container.querySelectorAll("section")].map((section) => section.id)).toEqual(["", "", "work", "career", "contact"]);
});
