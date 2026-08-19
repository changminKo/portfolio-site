import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyLayout } from "@/components/work/CaseStudyLayout";
import { getAdjacentWorks, getWork, loadWork, workItems } from "@/content/work.registry";
import { isWorkSlug } from "@/content/work.schema";

type PageProps = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return workItems.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isWorkSlug(slug)) return {};
  const work = getWork(slug);
  return { title: work.title, description: work.summary, openGraph: { title: work.title, description: work.summary, locale: "ko_KR" } };
}

export default async function WorkPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isWorkSlug(slug)) notFound();
  const work = getWork(slug);
  const adjacent = getAdjacentWorks(slug);
  const { default: Content } = await loadWork(slug);
  return <CaseStudyLayout work={work} {...adjacent}><Content /></CaseStudyLayout>;
}
