import Link from "next/link";
import { WORK_SLUGS } from "@/content/work.schema";

export default function NotFound() {
  return <section className="page-shell"><p>404</p><h1>요청한 작업을 찾을 수 없습니다.</h1><Link href="/#work">{WORK_SLUGS.length}개 작업 보기</Link></section>;
}
