import Image from "next/image";
import Link from "next/link";
import { Target, AlertTriangle, CircleDashed, Globe2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { UpcomingMeetings } from "@/components/dashboard/upcoming-meetings";
import { MarketsRefreshButton } from "@/components/markets/markets-refresh-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const marketFlagFiles: Record<string, string> = {
  france: "/flags/france.svg",
  germany: "/flags/germany.svg",
  austria: "/flags/austria.svg",
  poland: "/flags/poland.svg",
  norway: "/flags/norway.svg",
  "czech republic": "/flags/czech-republic.svg",
  czechia: "/flags/czech-republic.svg",
  netherlands: "/flags/netherlands.svg",
  uk: "/flags/uk.svg",
  "united kingdom": "/flags/uk.svg",
  ireland: "/flags/ireland.png.png",
  italy: "/flags/italy.png.png",
  sweden: "/flags/sweden.png.png",
  slovakia: "/flags/slovakia.png.png",
  belgium: "/flags/belgium.png.png",
};

function statusDot(status?: string) {
  const tone = status === "CRITICAL" ? "bg-red-500" : status === "AT_RISK" ? "bg-amber-400" : status === "ON_TRACK" ? "bg-emerald-500" : "bg-muted-foreground/20";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${tone}`} aria-label={status ?? "Not linked"} title={status?.replaceAll("_", " ") ?? "Not linked"} />;
}

export default async function DashboardPage() {
  const [markets, initiatives, activities, upcomingMeetings] = await Promise.all([
    prisma.market.findMany({ orderBy: { name: "asc" } }),
    prisma.initiative.findMany({ orderBy: { code: "asc" }, include: { markets: true } }),
    prisma.activity.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.meeting.findMany({ where: { date: { gte: new Date() } }, orderBy: { date: "asc" }, take: 5, include: { market: true, initiative: true } }),
  ]);

  const activatedMarketsCount = markets.length;
  const activeInitiativesCount = initiatives.length;
  const atRiskCount = initiatives.reduce(
    (count, initiative) => count + initiative.markets.filter((link) => link.localStatus === "AT_RISK" || link.localStatus === "CRITICAL").length,
    0,
  );
  const notYetStartedCount = initiatives.filter((initiative) => {
    const linkedMarketIds = new Set(initiative.markets.map((link) => link.marketId));
    return markets.some((market) => !linkedMarketIds.has(market.id));
  }).length;

  return <div className="pih-dashboard">
    <div className="mb-3 flex justify-end"><MarketsRefreshButton /></div>
    <div className="pih-kpi-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="RISE-activated markets" value={activatedMarketsCount} icon={Globe2} hint="markets live" />
      <KpiCard label="Active initiatives" value={activeInitiativesCount} icon={Target} hint="across all markets" />
      <KpiCard label="At risk" value={atRiskCount} icon={AlertTriangle} tone={atRiskCount > 0 ? "warning" : "default"} hint="not on track" />
      <KpiCard label="Not yet started" value={notYetStartedCount} icon={CircleDashed} hint="initiatives not started in at least one market" />
    </div>

    <Card className="pih-module-card mt-6 flex h-[430px] flex-col">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Initiatives</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-auto pr-3 [scrollbar-gutter:stable]">
        <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-30 bg-card">
            <tr>
              <th className="sticky left-0 z-40 w-24 min-w-24 border-b border-border bg-card px-3 py-3 text-left text-xs font-medium text-muted-foreground">ID</th>
              <th className="sticky left-24 z-40 w-80 min-w-80 border-b border-r border-border bg-card px-3 py-3 text-left text-xs font-medium text-muted-foreground shadow-[8px_0_10px_-10px_rgba(0,0,0,0.35)]">Name</th>
              {markets.map((market) => {
                const flagSrc = marketFlagFiles[market.name.trim().toLowerCase()];
                return <th key={market.id} className="w-16 border-b border-border px-3 py-2 text-center">
                  {flagSrc ? <span className="relative mx-auto block h-7 w-7 overflow-hidden rounded-full border border-border bg-secondary"><Image src={flagSrc} alt={`${market.name} flag`} fill unoptimized sizes="28px" className="object-cover" /></span> : <span className="text-xs text-muted-foreground">{market.code}</span>}
                </th>;
              })}
            </tr>
          </thead>
          <tbody>
            {initiatives.map((initiative) => {
              const marketStatuses = new Map(initiative.markets.map((link) => [link.marketId, link.localStatus]));
              return <tr key={initiative.id} className="group">
                <td className="sticky left-0 z-20 w-24 min-w-24 border-b border-border/60 bg-card px-3 py-3 font-medium text-muted-foreground group-hover:bg-secondary"><Link href={`/initiatives/${initiative.id}`}>{initiative.code}</Link></td>
                <td className="sticky left-24 z-20 w-80 min-w-80 border-b border-r border-border/60 bg-card px-3 py-3 font-medium text-foreground shadow-[8px_0_10px_-10px_rgba(0,0,0,0.35)] group-hover:bg-secondary"><Link href={`/initiatives/${initiative.id}`}>{initiative.name}</Link></td>
                {markets.map((market) => <td key={market.id} className="border-b border-border/60 px-3 py-3 text-center group-hover:bg-secondary/40">{statusDot(marketStatuses.get(market.id))}</td>)}
              </tr>;
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>

    <div className="pih-bento-secondary mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2"><ActivityTimeline items={activities} /><UpcomingMeetings items={upcomingMeetings.map((m) => ({ id:m.id,title:m.title,type:m.type,date:m.date,scopeLabel:m.scope === "MARKET" ? (m.market?.name ?? "Market") : (m.initiative?.name ?? "Initiative") }))} /></div>
  </div>;
}
