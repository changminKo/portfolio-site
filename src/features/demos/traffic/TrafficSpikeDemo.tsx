"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useReducer, useRef, useState } from "react";
import type { ServerModel, TrafficSample } from "./traffic-engine";
import type { TrafficWorkerOut } from "./traffic-protocol";
import { MetricCanvas } from "./MetricCanvas";
import styles from "./traffic-demo.module.css";

type State = { users: number; model: ServerModel; sample: TrafficSample; series: readonly TrafficSample[] };
type Action = { type: "users"; value: number } | { type: "model"; value: ServerModel } | { type: "sample"; sample: TrafficSample; series: readonly TrafficSample[] };
const emptySample = { timeMs: 0, p95Ms: 0, throughput: 0, queueDepth: 0, rejectedCount: 0 };
function reducer(state: State, action: Action): State {
  if (action.type === "users") return { ...state, users: action.value };
  if (action.type === "model") return { ...state, model: action.value };
  return { ...state, sample: action.sample, series: action.series };
}

export default function TrafficSpikeDemo() {
  const [state, dispatch] = useReducer(reducer, { users: 100, model: "before", sample: emptySample, series: [] });
  const [error, setError] = useState("");
  const [workerKey, setWorkerKey] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const messageCount = useRef(0);

  useEffect(() => {
    try {
      const worker = new Worker(new URL("./traffic.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      worker.onmessage = ({ data }: MessageEvent<TrafficWorkerOut>) => {
        if (data.type === "error") { setError(data.message); return; }
        messageCount.current += 1;
        if (!reducedMotion || messageCount.current % 4 === 0) dispatch({ type: "sample", sample: data.sample, series: data.series });
      };
      worker.onerror = () => setError("이 환경에서는 시뮬레이터를 실행할 수 없습니다.");
      worker.postMessage({ type: "start", config: { concurrentUsers: 100, model: "before", seed: 20260819 } });
      return () => { worker.postMessage({ type: "stop" }); worker.terminate(); };
    } catch { setError("이 환경에서는 시뮬레이터를 실행할 수 없습니다."); }
  }, [reducedMotion, workerKey]);

  const configure = (users: number, model: ServerModel) => {
    workerRef.current?.postMessage({ type: "configure", config: { concurrentUsers: users, model, seed: 20260819 } });
  };
  return (
    <div className={styles.demo} data-testid="traffic-demo" data-demo-chunk="demo-chunk:traffic" data-reduced-motion={reducedMotion}>
      <div className={styles.actual}><strong>실제 사례 결과</strong><span>P95 15,000ms → 450ms</span><span>처리량 2.7배</span></div>
      <p className={styles.simLabel}>원리 설명용 가상 모델</p>
      <div className={styles.controls}>
        {/* label 로 감싸면 <output> 도 labelable 이라 접근 가능 이름이 중복 매칭된다 */}
        <div className={styles.sliderRow}>
          <span>동시 사용자 <output>{state.users}</output></span>
          <input aria-label="동시 사용자" type="range" min="100" max="3000" step="100" value={state.users} onChange={(event) => { const users = Number(event.target.value); dispatch({ type: "users", value: users }); configure(users, state.model); }} />
        </div>
        <fieldset><legend>서버 모델</legend>{(["before", "after"] as const).map((model) => <label key={model}><input type="radio" name="server-model" checked={state.model === model} onChange={() => { dispatch({ type: "model", value: model }); configure(state.users, model); }} />{model === "before" ? "최적화 전" : "최적화 후"}</label>)}</fieldset>
      </div>
      {error ? <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); setWorkerKey((key) => key + 1); }}>다시 불러오기</button></div> : <>
        <div className={styles.graphs}>
          <div className={styles.graph}>
            <div className={styles.graphHead}><b>P95 응답</b><span>{state.sample.p95Ms}ms</span></div>
            <MetricCanvas series={state.series} metric="p95Ms" label="최근 60초 P95 그래프" />
            <div className={styles.axis}><span>-60초</span><span>지금</span></div>
          </div>
          <div className={styles.graph}>
            <div className={styles.graphHead}><b>처리량</b><span>{state.sample.throughput} req/s</span></div>
            <MetricCanvas series={state.series} metric="throughput" label="최근 60초 처리량 그래프" />
            <div className={styles.axis}><span>-60초</span><span>지금</span></div>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table><caption>현재 가상 요청 큐 수치</caption><thead><tr><th>P95</th><th>처리량</th><th>큐 깊이</th><th>거부</th></tr></thead><tbody><tr><td>{state.sample.p95Ms}ms</td><td>{state.sample.throughput} req/s</td><td>{state.sample.queueDepth}</td><td>{state.sample.rejectedCount}</td></tr></tbody></table>
        </div>
      </>}
    </div>
  );
}
