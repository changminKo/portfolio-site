import { defineConfig, devices } from "@playwright/test";

const productionBudget = process.env.PLAYWRIGHT_PRODUCTION === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  snapshotPathTemplate: "{testDir}/__snapshots__/{testFilePath}/{arg}{ext}",
  fullyParallel: true,
  /*
   * freeze 데모는 의도적으로 메인스레드를 최대 6초 막는다. 기본 워커 수(코어의 절반)로
   * 병렬 실행하면 여러 워커가 동시에 CPU를 점유해 데모 청크 로드가 기본 5초 대기를 넘긴다.
   * 워커를 줄이고 expect 대기를 현실화한다 — 판정 기준은 그대로다.
   */
  workers: process.env.CI ? 2 : 3,
  expect: { timeout: 15000 },
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["github"]] : "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: {
    command: productionBudget ? "pnpm build && pnpm start" : "pnpm build:visual && pnpm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
