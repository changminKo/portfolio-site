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

/*
 * `useReportWebVitals`는 LCP·CLS를 페이지가 숨겨지는 시점에 확정 보고한다.
 * 방문자가 화면을 보고 있는 동안에는 값이 오지 않아 계기판이 "측정 중"에 머문다.
 * buffered observer로 이미 기록된 엔트리를 즉시 받아 잠정값을 채우고,
 * 최종 확정값은 그대로 `useReportWebVitals`가 덮어쓴다.
 */
export function observeBufferedVitals(
  onValue: (name: VitalName, value: number) => void,
): () => void {
  if (typeof PerformanceObserver === "undefined") return () => {};

  const observers: PerformanceObserver[] = [];

  const observe = (type: string, handle: (entries: PerformanceEntryList) => void) => {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) return;
    try {
      const observer = new PerformanceObserver((list) => handle(list.getEntries()));
      observer.observe({ type, buffered: true } as PerformanceObserverInit);
      observers.push(observer);
    } catch {
      // 브라우저가 이 엔트리 타입을 거부하면 해당 지표만 비운다.
    }
  };

  observe("largest-contentful-paint", (entries) => {
    const last = entries.at(-1);
    if (last) onValue("LCP", last.startTime);
  });

  let clsTotal = 0;
  observe("layout-shift", (entries) => {
    for (const entry of entries) {
      const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
      if (!shift.hadRecentInput && typeof shift.value === "number") clsTotal += shift.value;
    }
    onValue("CLS", clsTotal);
  });

  return () => {
    for (const observer of observers) observer.disconnect();
  };
}
