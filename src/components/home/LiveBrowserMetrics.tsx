"use client";

import { useReportWebVitals } from "next/web-vitals";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createFrameMeter, type FrameMeter, type FrameSnapshot } from "@/lib/performance/frame-meter";
import type { VisualMetricFixture } from "@/lib/performance/visual-fixture";
import { detectVitalSupport, formatVital, observeBufferedVitals, type VitalName, type VitalSupport } from "@/lib/performance/vitals";
import styles from "./live-metrics.module.css";

type Values = Partial<Record<VitalName, number>>;

export function LiveBrowserMetrics({
  frameMeter,
  support,
  fixture,
}: {
  frameMeter?: FrameMeter;
  support?: VitalSupport;
  fixture?: VisualMetricFixture;
}) {
  const meter = useMemo(() => frameMeter ?? createFrameMeter(), [frameMeter]);
  const supported = useMemo(
    () => fixture ? { LCP: true, CLS: true, INP: true } : support ?? detectVitalSupport(),
    [fixture, support],
  );
  const [values, setValues] = useState<Values>(fixture?.values ?? {});
  const [frame, setFrame] = useState<FrameSnapshot | null>(fixture?.frame ?? null);
  const [announcement, setAnnouncement] = useState("");
  const onVital = useCallback((metric: { name: string; value: number }) => {
    if (fixture || (metric.name !== "LCP" && metric.name !== "CLS" && metric.name !== "INP")) return;
    setValues((current) => ({ ...current, [metric.name]: metric.value }));
    setAnnouncement(`${metric.name} 측정 완료`);
  }, [fixture]);
  useReportWebVitals(onVital);
  useEffect(() => {
    if (fixture) return;
    return observeBufferedVitals((name, value) => {
      setValues((current) => ({ ...current, [name]: value }));
    });
  }, [fixture]);
  useEffect(() => {
    if (fixture || document.hidden) return;
    let stop = meter.start(setFrame);
    const onVisibility = () => { stop(); if (!document.hidden) stop = meter.start(setFrame); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [fixture, meter]);

  const text = (name: VitalName) => !supported[name]
    ? "이 브라우저에서 미지원"
    : values[name] === undefined
      ? name === "INP" ? "입력 전" : "측정 중"
      : formatVital(name, values[name]);

  return (
    <section className={styles.panel} aria-label="현재 브라우저 실측 성능">
      {(["LCP", "CLS", "INP"] as const).map((name) => (
        <div key={name}>
          <span>{name}</span>
          <strong data-state={supported[name] && values[name] !== undefined ? "value" : "pending"}>{text(name)}</strong>
        </div>
      ))}
      <div>
        <span>렌더 프레임</span>
        <strong data-state={frame ? "value" : "pending"}>{frame ? `${frame.medianMs}ms · ${frame.fps} FPS` : "측정 중"}</strong>
      </div>
      <span className={styles.srOnly} aria-live="polite">{announcement}</span>
    </section>
  );
}
