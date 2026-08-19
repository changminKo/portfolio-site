"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import styles from "./theme-toggle.module.css";

const themes = [
  ["system", "시스템"],
  ["light", "라이트"],
  ["dark", "다크"],
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className={styles.group} role="group" aria-label="색상 테마" data-mounted={mounted}>
      {themes.map(([value, label]) => (
        <button
          key={value}
          className={styles.option}
          type="button"
          aria-pressed={mounted && theme === value}
          onClick={() => setTheme(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
