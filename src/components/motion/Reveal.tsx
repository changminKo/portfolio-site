"use client";

import { domAnimation, LazyMotion, m, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduceMotion ? 0 : 0.24, delay }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
