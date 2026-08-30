import Link from "next/link";
import type { WorkMeta } from "@/content/work.schema";
import styles from "./home.module.css";

function evidenceText(work: WorkMeta): string {
  const item = work.evidence[0];
  return item.value ?? `${item.before}${item.unit ?? ""} → ${item.after}${item.unit ?? ""}`;
}

export function WorkBento({ items }: { items: readonly WorkMeta[] }) {
  return (
    <section id="work" className={styles.section} aria-labelledby="work-title">
      <p className={styles.eyebrow}>SELECTED WORK</p>
      <h2 id="work-title">문제를 결과로 바꾼 일곱 장면</h2>
      <div className={styles.bento}>
        {items.map((work) => (
          <Link
            key={work.slug}
            href={`/work/${work.slug}`}
            className={styles.card}
            data-size={work.cardSize}
            data-slug={work.slug}
            aria-label={`${work.title} 케이스스터디 보기`}
          >
            <span className={styles.cardOrder}>{String(work.order).padStart(2, "0")}</span>
            {work.demo !== "none" && <span className={styles.demoBadge}>직접 체험</span>}
            {work.liveUrl && <span className={styles.liveBadge}>라이브 운영 중</span>}
            <h3>{work.title}</h3>
            <p>{work.summary}</p>
            <strong>{evidenceText(work)}</strong>
            <span>{work.stack.join(" · ")}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
