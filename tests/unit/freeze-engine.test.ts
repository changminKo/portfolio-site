import { describe, expect, it, vi } from "vitest";
import {
  createCachedCookieParser,
  createSyntheticCookieSource,
  parseCookieString,
  summarizeLongTasks,
} from "@/features/demos/freeze/freeze-engine";

describe("freeze engine", () => {
  it("64KB 이상의 합성 cookie 문자열을 만들고 실제 document.cookie를 읽지 않는다", () => {
    const getter = vi.spyOn(document, "cookie", "get").mockImplementation(() => { throw new Error("실제 쿠키 접근 금지"); });
    const source = createSyntheticCookieSource(64 * 1024);
    expect(new TextEncoder().encode(source).byteLength).toBeGreaterThanOrEqual(64 * 1024);
    expect(Object.keys(parseCookieString(source)).length).toBeGreaterThan(100);
    expect(getter).not.toHaveBeenCalled();
  });

  it("캐시 parser는 같은 문자열을 한 번만 파싱한다", () => {
    const parser = vi.fn(parseCookieString);
    const read = createCachedCookieParser("theme=dark; locale=ko", parser);
    expect(read()).toEqual({ theme: "dark", locale: "ko" });
    expect(read()).toEqual({ theme: "dark", locale: "ko" });
    expect(parser).toHaveBeenCalledTimes(1);
  });

  it("Long Task를 100개로 제한하고 총 지속 시간을 계산한다", () => {
    const tasks = Array.from({ length: 105 }, (_, index) => ({ startTime: index * 100, duration: 60 }));
    expect(summarizeLongTasks(tasks)).toMatchObject({ count: 100, totalBlockingMs: 6000 });
  });
});
