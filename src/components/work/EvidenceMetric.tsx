import type { Evidence } from "@/content/work.schema";
import styles from "./work.module.css";

export function EvidenceMetric({ evidence }: { evidence: Evidence }) {
  const result = evidence.value ?? `${evidence.before}${evidence.unit ?? ""} → ${evidence.after}${evidence.unit ?? ""}`;
  return <li className={styles.evidence}><span>실제 사례 결과 · {evidence.label}</span><strong>{result}</strong></li>;
}
