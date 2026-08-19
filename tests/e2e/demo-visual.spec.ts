import { expect, test, type Page } from "@playwright/test";

async function loadDemo(page: Page, name: "freeze" | "traffic" | "stackflow") {
  const loader = page.getByRole("button", { name: `${name} 데모 불러오기` });
  if (await loader.isVisible().catch(() => false)) await loader.click({ timeout: 2000 }).catch(() => {});
  await expect(page.getByTestId(`${name}-demo`)).toBeVisible();
}

const freezeStates = [
  { name: "idle", supported: true, tasks: [], mode: "cached", run: false },
  { name: "reparse", supported: true, tasks: [{ startTime: 100, duration: 82 }, { startTime: 350, duration: 87 }], mode: "reparse", run: true },
  { name: "cached", supported: true, tasks: [], mode: "cached", run: true },
  { name: "unsupported", supported: false, tasks: [], mode: "cached", run: false },
] as const;

for (const fixture of freezeStates) {
  test(`freeze ${fixture.name} 상태`, async ({ page }) => {
    await page.addInitScript(({ supported, tasks }) => {
      class MockPerformanceObserver {
        static supportedEntryTypes = supported ? ["longtask"] : [];
        constructor(private callback: (list: { getEntries(): typeof tasks }) => void) {}
        observe() { this.callback({ getEntries: () => tasks }); }
        disconnect() {}
      }
      Object.defineProperty(window, "PerformanceObserver", { configurable: true, value: MockPerformanceObserver });
    }, fixture);
    await page.goto("/work/webview-freeze");
    await loadDemo(page, "freeze");
    if (fixture.mode === "reparse") await page.getByRole("radio", { name: "매번 재파싱" }).check();
    if (fixture.run) {
      await page.getByRole("button", { name: "6초 실행" }).click();
      await page.getByRole("button", { name: "중지" }).click();
    }
    await expect(page.getByTestId("freeze-demo")).toHaveScreenshot(`freeze-${fixture.name}.png`, { animations: "disabled" });
  });
}

for (const model of ["before", "after"] as const) {
  test(`traffic ${model} 상태`, async ({ page }) => {
    await page.addInitScript(() => {
      class MockWorker {
        onmessage: ((event: { data: unknown }) => void) | null = null;
        onerror: (() => void) | null = null;
        postMessage(message: { type: string; config?: { model: "before" | "after" } }) {
          if (message.type === "stop") return;
          const after = message.config?.model === "after";
          const sample = { timeMs: 1000, p95Ms: after ? 450 : 15000, throughput: after ? 432 : 160, queueDepth: after ? 12 : 1200, rejectedCount: 0 };
          queueMicrotask(() => this.onmessage?.({ data: { type: "sample", sample, series: [sample] } }));
        }
        terminate() {}
      }
      Object.defineProperty(window, "Worker", { configurable: true, value: MockWorker });
    });
    await page.goto("/work/traffic-spike");
    await loadDemo(page, "traffic");
    await page.getByLabel("동시 사용자").evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = "1500";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    if (model === "after") await page.getByRole("radio", { name: "최적화 후" }).check();
    await expect(page.getByRole("cell", { name: model === "after" ? "450ms" : "15000ms" })).toBeVisible();
    await expect(page.getByTestId("traffic-demo")).toHaveScreenshot(`traffic-${model}.png`, { animations: "disabled" });
  });
}

test("Stackflow 서재·상세·리더·reduced-motion 상태", async ({ page }) => {
  await page.goto("/work/epub-comic-viewer");
  await loadDemo(page, "stackflow");
  const demo = page.getByTestId("stackflow-demo");
  await expect(demo).toHaveScreenshot("stackflow-shelf.png", { animations: "disabled" });
  await page.getByRole("button", { name: "브라우저 성능 읽기" }).click();
  await expect(demo).toHaveScreenshot("stackflow-book.png", { animations: "disabled" });
  await page.getByRole("button", { name: "읽기 시작" }).click();
  await expect(demo).toHaveScreenshot("stackflow-reader.png", { animations: "disabled" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(demo).toHaveAttribute("data-reduced-motion", "true");
  await expect(demo).toHaveScreenshot("stackflow-reduced-motion.png", { animations: "disabled" });
});
