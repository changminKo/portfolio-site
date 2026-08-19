import { render, screen } from "@testing-library/react";
import { CaseStudyLayout } from "@/components/work/CaseStudyLayout";
import { getAdjacentWorks, getWork } from "@/content/work.registry";

it("실측 지표와 문제→행동→성과 본문, 이전·다음 링크를 표시한다", () => {
  const work = getWork("traffic-spike");
  const adjacent = getAdjacentWorks(work.slug);
  render(
    <CaseStudyLayout work={work} {...adjacent}>
      <h2>문제</h2><h2>행동</h2><h2>성과</h2>
    </CaseStudyLayout>,
  );
  expect(screen.getByRole("article")).toBeInTheDocument();
  expect(screen.getByText("15000ms → 450ms")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /다음.*무중단 Vue/ })).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent)).toEqual(["문제", "행동", "성과"]);
});
