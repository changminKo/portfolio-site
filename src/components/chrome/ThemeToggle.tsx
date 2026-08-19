"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

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
    <div role="group" aria-label="색상 테마" data-mounted={mounted}>
      {themes.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={mounted && theme === value}
          onClick={() => setTheme(value)}
          style={{ minWidth: 44, minHeight: 44 }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
