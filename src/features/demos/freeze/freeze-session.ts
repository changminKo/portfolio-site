import { createCachedCookieParser, parseCookieString } from "./freeze-engine";

export type FreezeMode = "reparse" | "cached";
export type FreezeClock = {
  now: () => number;
  setInterval: (handler: () => void, timeoutMs: number) => number;
  clearInterval: (id: number) => void;
  setTimeout: (handler: () => void, timeoutMs: number) => number;
  clearTimeout: (id: number) => void;
};
export type FreezeSession = { start(): void; stop(): void; dispose(): void };

const browserClock: FreezeClock = {
  now: () => performance.now(),
  setInterval: (handler, timeoutMs) => window.setInterval(handler, timeoutMs),
  clearInterval: (id) => window.clearInterval(id),
  setTimeout: (handler, timeoutMs) => window.setTimeout(handler, timeoutMs),
  clearTimeout: (id) => window.clearTimeout(id),
};

export function runReparseBurst(
  source: string,
  targetMs: number,
  now: () => number = () => performance.now(),
  parser: typeof parseCookieString = parseCookieString,
): void {
  const startedAt = now();
  while (now() - startedAt < targetMs) parser(source);
}

export function createFreezeSession({
  source,
  mode,
  onTick,
  onComplete,
  clock = browserClock,
}: {
  source: string;
  mode: FreezeMode;
  onTick: (elapsedMs: number) => void;
  onComplete: () => void;
  clock?: FreezeClock;
}): FreezeSession {
  let intervalId: number | undefined;
  let timeoutId: number | undefined;
  let startedAt = 0;
  let completed = false;
  const readCache = createCachedCookieParser(source);
  const finish = (notify: boolean) => {
    if (intervalId !== undefined) clock.clearInterval(intervalId);
    if (timeoutId !== undefined) clock.clearTimeout(timeoutId);
    intervalId = undefined;
    timeoutId = undefined;
    if (notify && !completed) { completed = true; onComplete(); }
  };
  return {
    start() {
      completed = false;
      startedAt = clock.now();
      intervalId = clock.setInterval(() => {
        if (mode === "reparse") runReparseBurst(source, 80, clock.now);
        else readCache();
        onTick(Math.min(6000, clock.now() - startedAt));
      }, 250);
      timeoutId = clock.setTimeout(() => finish(true), 6000);
    },
    stop() { finish(true); },
    dispose() { finish(false); },
  };
}
