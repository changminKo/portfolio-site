import { CareerTimeline } from "@/components/home/CareerTimeline";
import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { LiveBrowserMetrics } from "@/components/home/LiveBrowserMetrics";
import { WorkBento } from "@/components/home/WorkBento";
import { workItems } from "@/content/work.registry";

export default function HomePage() {
  return <><Hero metrics={<LiveBrowserMetrics />} /><WorkBento items={workItems} /><CareerTimeline /><Contact /></>;
}
