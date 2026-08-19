import type { LongTaskRecord } from "./freeze-engine";
import styles from "./freeze-demo.module.css";

export function LongTaskTimeline({ entries }: { entries: readonly LongTaskRecord[] }) {
  return (
    <div>
      <h4>Long Task 타임라인</h4>
      <ol className={styles.timeline} aria-label="Long Task 시작 시점과 지속 시간">
        {entries.map((entry, index) => (
          <li key={`${entry.startTime}-${index}`} style={{ width: `${Math.min(100, Math.max(4, entry.duration / 2))}%` }}>
            {Math.round(entry.startTime)}ms · {Math.round(entry.duration)}ms
          </li>
        ))}
      </ol>
    </div>
  );
}
