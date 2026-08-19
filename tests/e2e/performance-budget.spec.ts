import { expect, test } from "@playwright/test";

test("홈 초기 gzip JavaScript가 160KB 미만이고 데모 marker가 없다", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const result = await page.evaluate(async () => {
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const scripts = resources.filter(({ initiatorType, name }) => initiatorType === "script" && name.includes("/_next/static/"));
    const sources = await Promise.all(scripts.map(({ name }) => fetch(name).then((response) => response.text())));
    return { encodedBodySize: scripts.reduce((sum, item) => sum + item.encodedBodySize, 0), source: sources.join("\n") };
  });
  console.log(`[performance-budget] 홈 초기 스크립트 encodedBodySize 합계 = ${result.encodedBodySize}B (${(result.encodedBodySize / 1024).toFixed(2)}KB)`);
  expect(result.encodedBodySize).toBeLessThan(160 * 1024);
  expect(result.source).not.toContain("demo-chunk:freeze");
  expect(result.source).not.toContain("demo-chunk:traffic");
  expect(result.source).not.toContain("features/demos");
  expect(result.source).not.toContain("traffic.worker");
});
