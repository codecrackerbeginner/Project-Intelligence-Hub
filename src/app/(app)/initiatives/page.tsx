import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { InitiativeInput } from "@/components/initiatives/initiative-input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
import { healthTone } from "@/lib/status";

export default async function InitiativesPage() {
  const initiatives = await prisma.initiative.findMany({ orderBy: { code: "asc" }, include: { markets: { include: { market: true } } } });
  const initiativeOptions = initiatives.map(({ id, code, name }) => ({ id, code, name }));
  return <div>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><PageHeader title="Initiatives" description="Workstreams driving the global sales transformation program." /><InitiativeInput initiatives={initiativeOptions} /></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{initiatives.map((initiative)=>{const {label,tone}=healthTone(initiative.status);const inputInitiative={id:initiative.id,code:initiative.code,name:initiative.name};return <div key={initiative.id} className="relative h-full"><Link href={`/initiatives/${initiative.id}`} className="group block h-full"><Card className="pih-entity-card h-full transition-shadow hover:shadow-md"><CardHeader className="flex flex-row items-start justify-between gap-3"><div className="pr-32"><p className="text-xs font-medium text-muted-foreground">{initiative.code} · Owner: {initiative.owner}</p><p className="text-base font-semibold text-foreground">{initiative.name}</p></div><StatusBadge label={label} tone={tone}/></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{initiative.description}</p><div><div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground"><span>Progress</span><span className="font-medium text-foreground">{initiative.progress}%</span></div><Progress value={initiative.progress}/></div><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>Target: {format(initiative.targetDate,"MMM yyyy")}</span><div className="flex flex-wrap gap-1.5">{initiative.markets.map((mi)=><span key={mi.id} className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{mi.market.code}</span>)}</div></div></CardContent></Card></Link><div className="absolute right-4 top-12 z-20"><InitiativeInput initiatives={[]} fixedInitiative={inputInitiative} compact /></div></div>})}</div>
  </div>;
}
