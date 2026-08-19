import { describe, expect, it } from "vitest";
import { getAdjacentWorks, getWork, workItems } from "@/content/work.registry";

describe("work registry", () => {
  it("6개 MDX 메타데이터를 순서대로 노출한다", () => {
    expect(workItems).toHaveLength(6);
    expect(workItems.map(({ slug }) => slug)).toEqual([
      "webview-freeze", "traffic-spike", "vue-next-migration",
      "epub-comic-viewer", "ai-workflow", "isr-redis-cachehandler-poc",
    ]);
  });

  it("경계 사례의 이전·다음 링크를 계산한다", () => {
    expect(getAdjacentWorks("webview-freeze")).toMatchObject({ previous: null, next: { slug: "traffic-spike" } });
    expect(getAdjacentWorks("isr-redis-cachehandler-poc")).toMatchObject({ previous: { slug: "ai-workflow" }, next: null });
    expect(getWork("traffic-spike").evidence[0]).toMatchObject({ label: "P95", before: "15000", after: "450", unit: "ms" });
  });
});
