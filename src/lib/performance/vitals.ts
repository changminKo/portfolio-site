export type VitalName = "LCP" | "CLS" | "INP";
export type VitalSupport = Record<VitalName, boolean>;

export function detectVitalSupport(): VitalSupport {
  const entries = typeof PerformanceObserver === "undefined" ? [] : PerformanceObserver.supportedEntryTypes;
  return {
    LCP: entries.includes("largest-contentful-paint"),
    CLS: entries.includes("layout-shift"),
    INP: typeof PerformanceEventTiming !== "undefined" && entries.includes("event"),
  };
}

export function formatVital(name: VitalName, value: number): string {
  return name === "CLS" ? value.toFixed(3) : `${Math.round(value).toLocaleString("ko-KR")}ms`;
}
