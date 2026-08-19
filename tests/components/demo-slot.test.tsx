import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { DemoSlot, type DemoComponents, type DemoObserver } from "@/components/mdx/DemoSlot";

const neverEnter: DemoObserver = () => () => undefined;
const components: DemoComponents = {
  freeze: () => <div data-testid="freeze-demo">freeze</div>,
  traffic: () => <div data-testid="traffic-demo">traffic</div>,
};

it("초기 셸을 렌더하고 버튼 입력 뒤 해당 데모만 표시한다", async () => {
  render(<DemoSlot kind="freeze" observe={neverEnter} components={components} />);
  expect(screen.queryByTestId("freeze-demo")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "freeze 데모 불러오기" }));
  expect(await screen.findByTestId("freeze-demo")).toBeInTheDocument();
  expect(screen.queryByTestId("traffic-demo")).not.toBeInTheDocument();
  expect(screen.getByText("이 데모는 실제 회사 코드나 트래픽이 아닌 원리 재현용 시뮬레이션입니다.")).toBeInTheDocument();
});

it("뷰포트 200px observer 진입으로도 데모를 표시한다", async () => {
  let enter: () => void = () => undefined;
  const observe: DemoObserver = (_node, onEnter) => { enter = onEnter; return () => undefined; };
  render(<DemoSlot kind="traffic" observe={observe} components={components} />);
  act(() => enter());
  expect(await screen.findByTestId("traffic-demo")).toBeInTheDocument();
});

it("데모 오류를 본문에서 격리하고 재시도 control을 제공한다", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const broken: DemoComponents = { ...components, freeze: () => { throw new Error("load failed"); } };
  render(<DemoSlot kind="freeze" observe={neverEnter} components={broken} />);
  fireEvent.click(screen.getByRole("button", { name: "freeze 데모 불러오기" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("데모를 불러오지 못했습니다.");
  expect(screen.getByRole("button", { name: "다시 불러오기" })).toBeInTheDocument();
});
