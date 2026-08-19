import styles from "./home.module.css";

export function Contact() {
  return (
    <section id="contact" className={`${styles.section} ${styles.contact}`} aria-labelledby="contact-title">
      <p className={styles.eyebrow}>CONTACT</p>
      <h2 id="contact-title">성능과 구조를 함께 해결할 프론트엔드 엔지니어를 찾고 있다면 이야기해 주세요.</h2>
      <div>
        <a href="mailto:rhckdals123@gmail.com">메일 보내기</a>
        <a href="https://github.com/changminKo" rel="noreferrer">GitHub 보기</a>
      </div>
    </section>
  );
}
