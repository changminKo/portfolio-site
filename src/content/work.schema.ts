import { z } from "zod";

export const WORK_SLUGS = [
  "webview-freeze",
  "traffic-spike",
  "vue-next-migration",
  "epub-comic-viewer",
  "ai-workflow",
  "isr-redis-cachehandler-poc",
] as const;

export type WorkSlug = (typeof WORK_SLUGS)[number];
export type DemoKind = "freeze" | "traffic" | "stackflow" | "none";

const EvidenceSchema = z.object({
  label: z.string().min(1),
  before: z.string().min(1).optional(),
  after: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
}).superRefine((evidence, context) => {
  const hasPair = evidence.before !== undefined && evidence.after !== undefined;
  const hasValue = evidence.value !== undefined;
  if (hasPair === hasValue) {
    context.addIssue({ code: "custom", message: "evidence는 before/after 쌍 또는 value 하나를 가져야 합니다" });
  }
});

export const WorkMetaSchema = z.object({
  slug: z.enum(WORK_SLUGS),
  order: z.number().int().min(1).max(6),
  title: z.string().min(1),
  summary: z.string().min(1),
  role: z.string().min(1),
  period: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  evidence: z.array(EvidenceSchema).min(1),
  demo: z.enum(["freeze", "traffic", "stackflow", "none"]),
  cardSize: z.enum(["large", "standard"]),
}).superRefine((work, context) => {
  const expected = work.demo === "none" ? "standard" : "large";
  if (work.cardSize !== expected) {
    context.addIssue({ code: "custom", path: ["cardSize"], message: work.demo === "none"
      ? "데모 없는 사례의 cardSize는 standard여야 합니다"
      : "데모 사례의 cardSize는 large여야 합니다" });
  }
});

export type Evidence = z.infer<typeof EvidenceSchema>;
export type WorkMeta = z.infer<typeof WorkMetaSchema>;

export function isWorkSlug(value: string): value is WorkSlug {
  return (WORK_SLUGS as readonly string[]).includes(value);
}

export function validateWorkCollection(records: readonly unknown[]): readonly WorkMeta[] {
  const parsed = records.map((record) => WorkMetaSchema.parse(record));
  if (parsed.length !== WORK_SLUGS.length || new Set(parsed.map(({ slug }) => slug)).size !== WORK_SLUGS.length) {
    throw new Error("6개 허용 slug가 각각 한 번씩 존재해야 합니다");
  }
  const orders = [...parsed].map(({ order }) => order).sort((a, b) => a - b);
  if (orders.join(",") !== "1,2,3,4,5,6") {
    throw new Error("order는 1부터 6까지 중복 없이 존재해야 합니다");
  }
  return [...parsed].sort((a, b) => a.order - b.order);
}
