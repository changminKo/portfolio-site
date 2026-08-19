import { expect, test } from "@playwright/test";

test("홈에서 여섯 사례와 앵커를 탐색한다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /케이스스터디 보기/ })).toHaveCount(6);
  await page.getByRole("link", { name: "경력" }).click();
  await expect(page.locator("#career")).toBeInViewport();
  await page.getByRole("link", { name: /안드로이드 웹뷰.*케이스스터디 보기/ }).click();
  await expect(page).toHaveURL(/\/work\/webview-freeze$/);
  expect(await page.getByRole("heading", { level: 2 }).allTextContents()).toEqual(["문제", "행동", "성과"]);
});

test("허용되지 않은 slug는 404다", async ({ page }) => {
  const response = await page.goto("/work/not-registered");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "요청한 작업을 찾을 수 없습니다." })).toBeVisible();
});

test("세 데모를 조작해도 App Router URL은 바뀌지 않는다", async ({ page }) => {
  await page.goto("/work/webview-freeze");
  const freezeLoader = page.getByRole("button", { name: "freeze 데모 불러오기" });
  if (await freezeLoader.isVisible().catch(() => false)) await freezeLoader.click({ timeout: 2000 }).catch(() => {});
  await page.getByRole("button", { name: "6초 실행" }).click();
  await page.getByRole("button", { name: "중지" }).click();
  await expect(page.getByText("실행 완료")).toBeVisible();

  await page.goto("/work/traffic-spike");
  const trafficLoader = page.getByRole("button", { name: "traffic 데모 불러오기" });
  if (await trafficLoader.isVisible().catch(() => false)) await trafficLoader.click({ timeout: 2000 }).catch(() => {});
  await page.getByLabel("동시 사용자").evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "1500";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.getByRole("radio", { name: "최적화 후" }).check();
  await expect(page.getByText("원리 설명용 가상 모델").first()).toBeVisible();

  await page.goto("/work/epub-comic-viewer");
  const stackflowLoader = page.getByRole("button", { name: "stackflow 데모 불러오기" });
  if (await stackflowLoader.isVisible().catch(() => false)) await stackflowLoader.click({ timeout: 2000 }).catch(() => {});
  const url = page.url();
  await page.getByRole("button", { name: "브라우저 성능 읽기" }).click();
  await page.getByRole("button", { name: "읽기 시작" }).click();
  await expect(page.getByText("stack depth 3 · push")).toBeVisible();
  await page.waitForTimeout(400); // stackflowConfig.transitionDuration(350ms) 전환이 끝난 뒤 edge 영역 좌표를 안정적으로 계산하기 위한 대기
  const swiped = await page.evaluate(() => {
    const edge = Array.from(document.querySelectorAll('[data-part="edge"]')).find(
      (element) => element.getBoundingClientRect().width > 0,
    );
    if (!edge) return false;
    const rect = edge.getBoundingClientRect();
    const startX = rect.x + rect.width / 2;
    const endX = startX + 180;
    const y = rect.y + rect.height / 2;
    const makeTouch = (x: number) => new Touch({ identifier: 1, target: edge, clientX: x, clientY: y, pageX: x, pageY: y });
    edge.dispatchEvent(new TouchEvent("touchstart", { touches: [makeTouch(startX)], targetTouches: [makeTouch(startX)], changedTouches: [makeTouch(startX)], bubbles: true, cancelable: true }));
    for (let step = 1; step <= 10; step += 1) {
      const x = startX + ((endX - startX) * step) / 10;
      edge.dispatchEvent(new TouchEvent("touchmove", { touches: [makeTouch(x)], targetTouches: [makeTouch(x)], changedTouches: [makeTouch(x)], bubbles: true, cancelable: true }));
    }
    edge.dispatchEvent(new TouchEvent("touchend", { touches: [], targetTouches: [], changedTouches: [makeTouch(endX)], bubbles: true, cancelable: true }));
    return true;
  });
  if (!swiped) throw new Error("Stackflow 스와이프 뒤로가기 edge 영역을 찾을 수 없습니다.");
  await expect(page.getByText("stack depth 2 · pop")).toBeVisible();
  expect(page.url()).toBe(url);
});
