import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CircleCheck, Globe2, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MarketsRefreshButton } from "@/components/markets/markets-refresh-button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { healthTone } from "@/lib/status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const marketFlagImages: Record<string, string> = {
  france: "/flags/france.svg", germany: "/flags/germany.svg", austria: "/flags/austria.svg", poland: "/flags/poland.svg", norway: "/flags/norway.svg",
  "czech republic": "/flags/czech-republic.svg", czechia: "/flags/czech-republic.svg", netherlands: "/flags/netherlands.svg", uk: "/flags/uk.svg", "united kingdom": "/flags/uk.svg",
  ireland: "/flags/ireland.png.png", italy: "/flags/italy.png.png", sweden: "/flags/sweden.png.png", slovakia: "/flags/slovakia.png.png", belgium: "/flags/belgium.png.png",
};

export default async function MarketsPage() {
  const markets = await prisma.market.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { initiatives: true } } } });
  const onTrack = markets.filter((m) => m.status === "ON_TRACK").length;
  const atRisk = markets.filter((m) => m.status === "AT_RISK").length;
  const critical = markets.filter((m) => m.status === "CRITICAL").length;

  return <div>
    <PageHeader title="Market Steering" description="Steer RISE rollout health and implementation progress across markets." actions={<MarketsRefreshButton />} />
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="RISE markets" value={markets.length} icon={Globe2} hint="markets in steering" />
      <KpiCard label="On track" value={onTrack} icon={CircleCheck} hint="markets progressing as planned" />
      <KpiCard label="At risk" value={atRisk} icon={AlertTriangle} tone={atRisk > 0 ? "warning" : "default"} hint="markets needing attention" />
      <KpiCard label="Critical" value={critical} icon={ShieldAlert} tone={critical > 0 ? "critical" : "default"} hint="markets requiring intervention" />
    </div>
    <div className="max-h-[calc(100vh-18rem)] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {markets.map((market) => {
          const { label, tone } = healthTone(market.status);
          const flagSrc = marketFlagImages[market.name.trim().toLowerCase()];
          return <Link key={market.id} href={`/markets/${market.id}`} className="group block h-full">
            <Card className="pih-entity-card h-full transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-3"><div className="pih-flag-icon relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-secondary" aria-label={`${market.name} flag`}>{flagSrc ? <Image src={flagSrc} alt={`${market.name} flag`} fill sizes="40px" className="object-cover" /> : <span className="flex h-full w-full items-center justify-center text-xs font-semibold">{market.code}</span>}</div><div><p className="text-xs font-medium text-muted-foreground">{market.code}</p><p className="text-base font-semibold text-foreground">{market.name}</p></div></div>
                <StatusBadge label={label} tone={tone} />
              </CardHeader>
              <CardContent className="space-y-2 text-sm"><div className="flex justify-between text-muted-foreground"><span>Region</span><span className="text-foreground">{market.region}</span></div><div className="flex justify-between text-muted-foreground"><span>Market Lead</span><span className="text-foreground">{market.lead}</span></div><div className="flex justify-between text-muted-foreground"><span>Linked Initiatives</span><span className="text-foreground">{market._count.initiatives}</span></div></CardContent>
            </Card>
          </Link>;
        })}
      </div>
    </div>
  </div>;
}
