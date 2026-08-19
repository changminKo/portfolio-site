"use client";

import "@stackflow/plugin-basic-ui/index.css";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Stack } from "./stackflow.instance";
import { StackflowStatusProvider, useStackflowStatus } from "./StackflowStatus";
import styles from "./stackflow-demo.module.css";

function Phone() {
  const { status } = useStackflowStatus();
  return <><div className={styles.phone} aria-label="웹뷰 스택 탐색 데모"><Stack /></div><p aria-live="polite">stack depth {status.depth} · {status.last}</p></>;
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
