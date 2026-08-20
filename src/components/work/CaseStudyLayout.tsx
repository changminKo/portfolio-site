import Link from "next/link";
import type { ReactNode } from "react";
import type { WorkMeta } from "@/content/work.schema";
import { EvidenceMetric } from "./EvidenceMetric";
import styles from "./work.module.css";

type Props = { work: WorkMeta; previous: WorkMeta | null; next: WorkMeta | null; children: ReactNode };

export function CaseStudyLayout({ work, previous, next, children }: Props) {
  return (
    <article className={styles.article}>
      <header className={styles.header}>
        {/* 화살표는 CSS ::before 가 그린다 */}
        <Link href="/#work">모든 작업</Link>
        <p className={styles.meta}>{work.role} · {work.period}</p>
        <h1>{work.title}</h1>
        <p className={styles.summary}>{work.summary}</p>
        <p className={styles.stack}>{work.stack.join(" · ")}</p>
        <p className={styles.evidenceCaption} id="evidence-caption">실제 사례 결과</p>
        <ul className={styles.evidenceList} aria-labelledby="evidence-caption">
          {work.evidence.map((evidence) => <EvidenceMetric key={evidence.label} evidence={evidence} />)}
        </ul>
      </header>
      <div className={styles.prose}>{children}</div>
      <nav className={styles.adjacent} aria-label="케이스스터디 이동">
        {previous ? <Link href={`/work/${previous.slug}`}>이전 · {previous.title}</Link> : <span />}
        {next ? <Link href={`/work/${next.slug}`}>다음 · {next.title}</Link> : <span />}
        <Link href="/#work">6개 작업 모두 보기</Link>
      </nav>
    </article>
  );
}
