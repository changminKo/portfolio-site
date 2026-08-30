import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { WORK_SLUGS } from "@/content/work.schema";
import styles from "./home.module.css";

export function Hero({ metrics }: { metrics?: ReactNode }) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Reveal>
        <p className={styles.eyebrow}>KO CHANGMIN · FRONTEND ENGINEER</p>
        <h1 id="hero-title">느낌 대신, 측정으로 증명합니다.</h1>
        <p className={styles.positioning}>측정으로 증명하는 성능 엔지니어 — 웹과 웹뷰의 병목을 숫자로 찾고 결과로 바꿉니다.</p>
        <p>TypeScript·React·Next.js·Vue/Nuxt로 제품을 만들고 Docker·Redis까지 병목의 경계를 따라갑니다.</p>
        <a className={styles.primaryLink} href="#work">{WORK_SLUGS.length}개 사례 모두 보기</a>
      </Reveal>
      {metrics}
    </section>
  );
}
