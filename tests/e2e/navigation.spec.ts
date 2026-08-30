import { expect, test } from "@playwright/test";

test("홈에서 일곱 사례와 앵커를 탐색한다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /케이스스터디 보기/ })).toHaveCount(7);
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

test("두 데모를 조작해도 App Router URL은 바뀌지 않는다", async ({ page }) => {
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
});
