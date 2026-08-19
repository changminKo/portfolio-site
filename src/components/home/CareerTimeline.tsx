import Link from "next/link";
import styles from "./home.module.css";

const careers = [
  {
    company: "밀리의서재",
    period: "2023.06–현재",
    summary: "웹·웹뷰 성능과 Next.js 전환, 콘텐츠 뷰어, 팀 AI 워크플로우를 설계하고 구현했습니다.",
    href: "/work/webview-freeze",
  },
  {
    company: "디케이테크인(kakao 프로젝트)",
    period: "2018.10–2023.06",
    summary: "Vue/Nuxt 기반 제품과 운영 프론트엔드의 구조를 만들고 안정적으로 확장했습니다.",
    href: "/work/vue-next-migration",
  },
] as const;

export function CareerTimeline() {
  return (
    <section id="career" className={styles.section} aria-labelledby="career-title">
      <p className={styles.eyebrow}>CAREER</p>
      <h2 id="career-title">7년 11개월, 경계를 따라간 기록</h2>
      <ol className={styles.timeline}>
        {careers.map((career) => (
          <li key={career.company}>
            <time>{career.period}</time>
            <h3>{career.company} · 프론트엔드 엔지니어</h3>
            <p>{career.summary}</p>
            <Link href={career.href}>연결된 사례 보기</Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
