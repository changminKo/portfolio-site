"use client";

import { createContext, useContext, type PropsWithChildren } from "react";

type StatusContext = { animate: boolean };
const Context = createContext<StatusContext | null>(null);

export function StackflowStatusProvider({ children, animate }: PropsWithChildren<{ animate: boolean }>) {
  return <Context.Provider value={{ animate }}>{children}</Context.Provider>;
}

export function useStackflowStatus(): StatusContext {
  const value = useContext(Context);
  if (!value) throw new Error("StackflowStatusProvider 안에서 사용해야 합니다");
  return value;
}
