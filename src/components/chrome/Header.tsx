import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="page-shell">
      <nav aria-label="주요 탐색">
        <Link href="/">고창민</Link>
        <Link href="/#work">작업</Link>
        <Link href="/#career">경력</Link>
        <Link href="/#contact">연락</Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
