import { CareerTimeline } from "@/components/home/CareerTimeline";
import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { LiveBrowserMetrics } from "@/components/home/LiveBrowserMetrics";
import { WorkBento } from "@/components/home/WorkBento";
import { workItems } from "@/content/work.registry";
import { VISUAL_METRIC_FIXTURE } from "@/lib/performance/visual-fixture";

const fixture = process.env.NEXT_PUBLIC_VISUAL_TEST === "1" ? VISUAL_METRIC_FIXTURE : undefined;

export default function HomePage() {
  return <><Hero metrics={<LiveBrowserMetrics fixture={fixture} />} /><WorkBento items={workItems} /><CareerTimeline /><Contact /></>;
}
