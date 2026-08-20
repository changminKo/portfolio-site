import type { Evidence } from "@/content/work.schema";
import styles from "./work.module.css";

export function EvidenceMetric({ evidence }: { evidence: Evidence }) {
  const result = evidence.value ?? `${evidence.before}${evidence.unit ?? ""} → ${evidence.after}${evidence.unit ?? ""}`;
  /* "실제 사례 결과" 표시는 리스트 캡션이 한 번만 담당한다 (CaseStudyLayout) */
  return <li className={styles.evidence}><span>{evidence.label}</span><strong>{result}</strong></li>;
}
