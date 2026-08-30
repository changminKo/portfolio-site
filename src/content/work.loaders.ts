import type { ComponentType } from "react";
import type { WorkSlug } from "./work.schema";

type WorkModule = { default: ComponentType };
const loaders: Record<WorkSlug, () => Promise<WorkModule>> = {
  "webview-freeze": () => import("../../content/work/webview-freeze.mdx"),
  "traffic-spike": () => import("../../content/work/traffic-spike.mdx"),
  "vue-next-migration": () => import("../../content/work/vue-next-migration.mdx"),
  "epub-comic-viewer": () => import("../../content/work/epub-comic-viewer.mdx"),
  "ai-workflow": () => import("../../content/work/ai-workflow.mdx"),
  "isr-redis-cachehandler-poc": () => import("../../content/work/isr-redis-cachehandler-poc.mdx"),
  "moi-paper-trading": () => import("../../content/work/moi-paper-trading.mdx"),
};

export function loadWorkModule(slug: WorkSlug): Promise<WorkModule> {
  return loaders[slug]();
}
