import { expect, test } from "@playwright/test";

const routes = [
  ["home", "/"], ["webview-freeze", "/work/webview-freeze"], ["traffic-spike", "/work/traffic-spike"],
  ["vue-next-migration", "/work/vue-next-migration"], ["epub-comic-viewer", "/work/epub-comic-viewer"],
  ["ai-workflow", "/work/ai-workflow"], ["isr-redis", "/work/isr-redis-cachehandler-poc"], ["moi-paper-trading", "/work/moi-paper-trading"],
] as const;
const viewports = [["mobile", 320, 800], ["tablet", 768, 1024], ["desktop", 1440, 1000]] as const;
const themes = ["light", "dark"] as const;

for (const [routeName, route] of routes) for (const [viewportName, width, height] of viewports) for (const theme of themes) {
  test(`${routeName} ${viewportName} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await page.addInitScript(() => {
      Object.defineProperty(window, "IntersectionObserver", {
        configurable: true,
        value: class {
          observe() {}
          unobserve() {}
          disconnect() {}
          takeRecords() { return []; }
        },
      });
    });
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${routeName}-${viewportName}-${theme}.png`, { fullPage: true, animations: "disabled" });
  });
}
