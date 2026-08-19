export type FrameSnapshot = { medianMs: number; fps: number };
export type FrameMeter = { start(onSample: (sample: FrameSnapshot) => void): () => void };

export function summarizeFrameGaps(gaps: readonly number[]): FrameSnapshot {
  const sorted = [...gaps].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const medianMs = sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
  return { medianMs: Number(medianMs.toFixed(1)), fps: Math.round(1000 / medianMs) };
}

export function createFrameMeter(): FrameMeter {
  return {
    start(onSample) {
      let frameId = 0;
      let lastFrame = performance.now();
      let lastEmit = lastFrame;
      const gaps: number[] = [];
      const tick = (now: number) => {
        gaps.push(now - lastFrame);
        if (gaps.length > 120) gaps.shift();
        lastFrame = now;
        if (now - lastEmit >= 250 && gaps.length > 0) {
          onSample(summarizeFrameGaps(gaps));
          lastEmit = now;
        }
        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frameId);
    },
  };
}
