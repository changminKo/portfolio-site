"use client";

import { useEffect, useRef } from "react";
import type { TrafficSample } from "./traffic-engine";

export function MetricCanvas({ series, metric, label }: { series: readonly TrafficSample[]; metric: "p95Ms" | "throughput"; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const values = series.map((sample) => sample[metric]);
    const maximum = Math.max(1, ...values);
    context.strokeStyle = getComputedStyle(canvas).getPropertyValue("--accent");
    context.lineWidth = 2;
    context.beginPath();
    values.forEach((value, index) => {
      const x = values.length <= 1 ? 0 : index * canvas.width / (values.length - 1);
      const y = canvas.height - value / maximum * (canvas.height - 8) - 4;
      if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.stroke();
  }, [metric, series]);
  return <canvas ref={ref} width={560} height={180} role="img" aria-label={label} />;
}
