import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { WORK_SLUGS, validateWorkCollection, type WorkMeta, type WorkSlug } from "./work.schema";

const contentRoot = join(process.cwd(), "content", "work");
export const workItems = validateWorkCollection(WORK_SLUGS.map((slug) => {
  const source = readFileSync(join(contentRoot, `${slug}.mdx`), "utf8");
  return matter(source).data;
}));

export function getWork(slug: WorkSlug): WorkMeta {
  const work = workItems.find((item) => item.slug === slug);
  if (!work) throw new Error(`등록되지 않은 work slug: ${slug}`);
  return work;
}

export function getAdjacentWorks(slug: WorkSlug): { previous: WorkMeta | null; next: WorkMeta | null } {
  const index = workItems.findIndex((item) => item.slug === slug);
  return { previous: workItems[index - 1] ?? null, next: workItems[index + 1] ?? null };
}

export async function loadWork(slug: WorkSlug) {
  const { loadWorkModule } = await import("./work.loaders");
  return loadWorkModule(slug);
}
