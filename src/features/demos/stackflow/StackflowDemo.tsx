"use client";

import "@stackflow/plugin-basic-ui/index.css";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getStackflowStatus, resetStackflowStatus, subscribeStackflowStatus } from "./stackflow-status-store";
import { Stack } from "./stackflow.instance";
import { StackflowStatusProvider } from "./StackflowStatus";
import styles from "./stackflow-demo.module.css";

function hideDecorativeButtons(container: HTMLElement) {
  container.querySelectorAll("button").forEach((button) => {
    if (button.textContent?.trim() || button.getAttribute("aria-label")) return;
    button.setAttribute("aria-hidden", "true");
    button.setAttribute("tabindex", "-1");
  });
}

function Phone() {
  const status = useSyncExternalStore(subscribeStackflowStatus, getStackflowStatus, getStackflowStatus);
  const phoneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    resetStackflowStatus();
    const container = phoneRef.current;
    if (!container) return;
    hideDecorativeButtons(container);
    const observer = new MutationObserver(() => hideDecorativeButtons(container));
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return <><div ref={phoneRef} className={styles.phone} aria-label="웹뷰 스택 탐색 데모"><Stack /></div><p aria-live="polite">stack depth {status.depth} · {status.last}</p></>;
}

export default function StackflowDemo() {
  const { resolvedTheme } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return <div className={styles.demo} data-testid="stackflow-demo" data-demo-chunk="demo-chunk:stackflow" data-theme={resolvedTheme} data-reduced-motion={reduceMotion}><StackflowStatusProvider animate={!reduceMotion}><Phone /></StackflowStatusProvider></div>;
}
