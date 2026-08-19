"use client";

import { useStack } from "@stackflow/react";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

type Status = { depth: number; last: "대기" | "push" | "pop" };
type StatusContext = { animate: boolean; status: Status; report: (depth: number, last: Status["last"]) => void };
const Context = createContext<StatusContext | null>(null);

export function StackflowStatusProvider({ children, animate }: PropsWithChildren<{ animate: boolean }>) {
  const [status, setStatus] = useState<Status>({ depth: 1, last: "대기" });
  const value = useMemo(() => ({ animate, status, report: (depth: number, last: Status["last"]) => setStatus({ depth, last }) }), [animate, status]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useStackflowStatus(): StatusContext {
  const value = useContext(Context);
  if (!value) throw new Error("StackflowStatusProvider 안에서 사용해야 합니다");
  return value;
}

export function useSyncStackflowStatus(): void {
  const stack = useStack();
  const { status, report } = useStackflowStatus();
  const depth = stack.activities.length;
  useEffect(() => {
    if (depth !== status.depth) report(depth, depth > status.depth ? "push" : "pop");
  }, [depth, report, status.depth]);
}
