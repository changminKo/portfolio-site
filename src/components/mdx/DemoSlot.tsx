"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentType } from "react";
import type { DemoKind as WorkDemoKind } from "@/content/work.schema";
import { DemoErrorBoundary } from "./DemoErrorBoundary";
import styles from "./demo-slot.module.css";

export type DemoKind = Exclude<WorkDemoKind, "none">;
export type DemoObserver = (node: Element, onEnter: () => void) => () => void;
export type DemoComponents = Record<DemoKind, ComponentType>;

const dynamicDemos: DemoComponents = {
  freeze: dynamic(() => import("@/features/demos/freeze/FreezeDemo"), { ssr: false, loading: () => <p>freeze 데모 로딩 중</p> }),
  traffic: dynamic(() => import("@/features/demos/traffic/TrafficSpikeDemo"), { ssr: false, loading: () => <p>traffic 데모 로딩 중</p> }),
  stackflow: dynamic(() => import("@/features/demos/stackflow/StackflowDemo"), { ssr: false, loading: () => <p>Stackflow 데모 로딩 중</p> }),
} as const;

export function createDemoObserver(): DemoObserver {
  return (node, onEnter) => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { onEnter(); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  };
}

const defaultObserver = createDemoObserver();

export function DemoSlot({
  kind,
  observe = defaultObserver,
  components = dynamicDemos,
}: {
  kind: DemoKind;
  observe?: DemoObserver;
  components?: DemoComponents;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [requested, setRequested] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const Demo = components[kind];
  useEffect(() => rootRef.current ? observe(rootRef.current, () => setRequested(true)) : undefined, [observe]);
  return (
    <section ref={rootRef} className={styles.slot} data-wide aria-labelledby={`${kind}-demo-title`}>
      <h3 id={`${kind}-demo-title`}>{kind} 원리 재현 데모</h3>
      {!requested && <button type="button" onClick={() => setRequested(true)}>{kind} 데모 불러오기</button>}
      {requested && <DemoErrorBoundary key={retryKey} onRetry={() => setRetryKey((key) => key + 1)}><Demo /></DemoErrorBoundary>}
      <p>이 데모는 실제 회사 코드나 트래픽이 아닌 원리 재현용 시뮬레이션입니다.</p>
    </section>
  );
}
