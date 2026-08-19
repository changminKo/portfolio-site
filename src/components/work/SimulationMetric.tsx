import styles from "./work.module.css";

export function SimulationMetric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return <div className={styles.simulation}><span>원리 설명용 가상 모델 · {label}</span><strong>{value.toLocaleString("ko-KR")}{unit}</strong></div>;
}
