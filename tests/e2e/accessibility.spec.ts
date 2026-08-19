import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/work/webview-freeze", "/work/traffic-spike", "/work/vue-next-migration", "/work/epub-comic-viewer", "/work/ai-workflow", "/work/isr-redis-cachehandler-poc"];
for (const route of routes) for (const theme of ["light", "dark"] as const) {
  test(`axe ${theme} ${route}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(result.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  });
}

test("세 데모 대표 상태에 serious·critical axe 위반이 없다", async ({ page }) => {
  const demos = [
    ["/work/webview-freeze", "freeze"],
    ["/work/traffic-spike", "traffic"],
    ["/work/epub-comic-viewer", "stackflow"],
  ] as const;
  for (const [route, name] of demos) {
    await page.goto(route);
    const loader = page.getByRole("button", { name: `${name} 데모 불러오기` });
    if (await loader.isVisible().catch(() => false)) await loader.click({ timeout: 2000 }).catch(() => {});
    await expect(page.getByTestId(`${name}-demo`)).toBeVisible();
    const result = await new AxeBuilder({ page }).include(`[data-testid="${name}-demo"]`).analyze();
    expect(result.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  }
});

test("320px와 200% 확대에서 페이지 수평 overflow가 없다", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.locator(".skip-link").focus();
  await expect(page.locator(".skip-link")).toBeFocused();
});

test("Tab으로 skip link에 도달하고 Escape로 freeze를 중지한다", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.goto("/work/webview-freeze");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const loader = page.getByRole("button", { name: "freeze 데모 불러오기" });
  if (await loader.isVisible().catch(() => false)) await loader.click({ timeout: 2000 }).catch(() => {});
  await page.getByRole("button", { name: "6초 실행" }).click();
  expect(await page.getByTestId("freeze-indicator").evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
  await page.keyboard.press("Escape");
  await expect(page.getByText("실행 완료")).toBeVisible();
});
