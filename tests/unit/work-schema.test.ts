import { describe, expect, it } from "vitest";
import { validateWorkCollection, type WorkMeta } from "@/content/work.schema";

const base: WorkMeta[] = [
  ["webview-freeze", 1, "freeze", "large"],
  ["traffic-spike", 2, "traffic", "large"],
  ["vue-next-migration", 3, "none", "standard"],
  ["epub-comic-viewer", 4, "none", "standard"],
  ["ai-workflow", 5, "none", "standard"],
  ["isr-redis-cachehandler-poc", 6, "none", "standard"],
  ["moi-paper-trading", 7, "none", "standard"],
].map(([slug, order, demo, cardSize]) => ({
  slug,
  order,
  demo,
  cardSize,
  title: String(slug),
  summary: "문제와 결과를 요약한 문장",
  role: "프론트엔드 엔지니어",
  period: "밀리의서재 · 2023–현재",
  stack: ["TypeScript"],
  evidence: [{ label: "결과", value: "검증됨" }],
})) as WorkMeta[];

describe("validateWorkCollection", () => {
  it("정확한 7개 사례를 order 순으로 반환한다", () => {
    expect(validateWorkCollection([...base].reverse()).map((item) => item.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("liveUrl이 URL 형식이 아니면 거부한다", () => {
    const invalid = base.map((item) => item.slug === "moi-paper-trading" ? { ...item, liveUrl: "moi-app.duckdns.org" } : item);
    expect(() => validateWorkCollection(invalid)).toThrow();
  });

  it("데모 카드가 standard이면 거부한다", () => {
    const invalid = base.map((item) => item.slug === "webview-freeze" ? { ...item, cardSize: "standard" } : item);
    expect(() => validateWorkCollection(invalid)).toThrow("데모 사례의 cardSize는 large여야 합니다");
  });

  it("중복 order를 거부한다", () => {
    const invalid = base.map((item) => item.slug === "traffic-spike" ? { ...item, order: 1 } : item);
    expect(() => validateWorkCollection(invalid)).toThrow("order는 1부터 7까지 중복 없이 존재해야 합니다");
  });
});
