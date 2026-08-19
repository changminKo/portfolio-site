"use client";

import { useEffect, useReducer, useRef } from "react";
import { createSyntheticCookieSource, summarizeLongTasks, type LongTaskRecord } from "./freeze-engine";
import { createFreezeSession, type FreezeMode, type FreezeSession } from "./freeze-session";
import { LongTaskTimeline } from "./LongTaskTimeline";
import styles from "./freeze-demo.module.css";

type State = { mode: FreezeMode; status: "idle" | "running" | "complete"; elapsedMs: number; tasks: LongTaskRecord[]; maxFrameGapMs: number };
type Action = { type: "mode"; mode: FreezeMode } | { type: "start" } | { type: "tick"; elapsedMs: number } | { type: "complete"; tasks: LongTaskRecord[]; maxFrameGapMs: number };
const initial: State = { mode: "cached", status: "idle", elapsedMs: 0, tasks: [], maxFrameGapMs: 0 };
function reducer(state: State, action: Action): State {
  if (action.type === "mode") return { ...state, mode: action.mode };
  if (action.type === "start") return { ...state, status: "running", elapsedMs: 0, tasks: [], maxFrameGapMs: 0 };
  if (action.type === "tick") return { ...state, elapsedMs: action.elapsedMs };
  return { ...state, status: "complete", tasks: action.tasks, maxFrameGapMs: action.maxFrameGapMs };
}

export default function FreezeDemo() {
  const [state, dispatch] = useReducer(reducer, initial);
  const sessionRef = useRef<FreezeSession | null>(null);
  const observerRef = useRef<PerformanceObserver | null>(null);
  const frameRef = useRef(0);
  const tasksRef = useRef<LongTaskRecord[]>([]);
  const maxGapRef = useRef(0);

  const finish = () => {
    observerRef.current?.disconnect();
    cancelAnimationFrame(frameRef.current);
    dispatch({ type: "complete", tasks: tasksRef.current.slice(0, 100), maxFrameGapMs: maxGapRef.current });
  };
  const start = () => {
    sessionRef.current?.dispose();
    tasksRef.current = [];
    maxGapRef.current = 0;
    dispatch({ type: "start" });
    if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes.includes("longtask")) {
      observerRef.current = new PerformanceObserver((list) => {
        tasksRef.current.push(...list.getEntries().map(({ startTime, duration }) => ({ startTime, duration })));
      });
      observerRef.current.observe({ entryTypes: ["longtask"] });
    }
    let previous = performance.now();
    const frame = (now: number) => { maxGapRef.current = Math.max(maxGapRef.current, now - previous); previous = now; frameRef.current = requestAnimationFrame(frame); };
    frameRef.current = requestAnimationFrame(frame);
    sessionRef.current = createFreezeSession({
      source: createSyntheticCookieSource(), mode: state.mode,
      onTick: (elapsedMs) => dispatch({ type: "tick", elapsedMs }), onComplete: finish,
    });
    sessionRef.current.start();
  };

  useEffect(() => {
    const stopWhenHidden = () => { if (document.hidden) sessionRef.current?.stop(); };
    const stopOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") sessionRef.current?.stop(); };
    document.addEventListener("visibilitychange", stopWhenHidden);
    document.addEventListener("keydown", stopOnEscape);
    return () => { document.removeEventListener("visibilitychange", stopWhenHidden); document.removeEventListener("keydown", stopOnEscape); sessionRef.current?.dispose(); observerRef.current?.disconnect(); cancelAnimationFrame(frameRef.current); };
  }, []);

  const summary = summarizeLongTasks(state.tasks);
  const supported = typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes.includes("longtask");
  return (
    <div className={styles.demo} data-testid="freeze-demo" data-demo-chunk="demo-chunk:freeze">
      <p className={styles.warning}>재파싱 모드는 최대 6초 동안 의도적으로 화면 반응을 늦춥니다.</p>
      <fieldset disabled={state.status === "running"}><legend>쿠키 접근 방식</legend>
        <label><input type="radio" name="mode" checked={state.mode === "reparse"} onChange={() => dispatch({ type: "mode", mode: "reparse" })} />매번 재파싱</label>
        <label><input type="radio" name="mode" checked={state.mode === "cached"} onChange={() => dispatch({ type: "mode", mode: "cached" })} />한 번 파싱 후 캐시</label>
      </fieldset>
      {state.status !== "running" ? <button type="button" onClick={start}>6초 실행</button> : <button type="button" onClick={() => sessionRef.current?.stop()}>중지</button>}
      <div className={state.status === "running" ? styles.runningIndicator : styles.indicator} data-testid="freeze-indicator" aria-hidden="true" />
      <p aria-live="polite">{state.status === "complete" ? "실행 완료" : state.status === "running" ? `${Math.round(state.elapsedMs)}ms 실행 중` : "실행 대기"}</p>
      <dl className={styles.summary}><div><dt>Long Task</dt><dd>{supported ? `${summary.count}개` : "미지원"}</dd></div><div><dt>총 차단 시간</dt><dd>{supported ? `${Math.round(summary.totalBlockingMs)}ms` : "미지원"}</dd></div><div><dt>최대 프레임 간격</dt><dd>{Math.round(state.maxFrameGapMs)}ms</dd></div></dl>
      {supported ? <LongTaskTimeline entries={summary.entries} /> : <p>50ms 초과 프레임 간격을 프레임 지연 추정으로 확인하세요.</p>}
    </div>
  );
}
