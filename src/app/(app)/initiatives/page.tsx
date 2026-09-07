import Link from "next/link";
import { format } from "date-fns";
import { FolderOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { InitiativeInput } from "@/components/initiatives/initiative-input";
import { DocumentsList } from "@/components/shared/documents-list";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
import { healthTone } from "@/lib/status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InitiativesPage() {
  const [initiatives, generalDocuments] = await Promise.all([
    prisma.initiative.findMany({ orderBy: { code: "asc" }, include: { markets: { include: { market: true } } } }),
    prisma.document.findMany({ where: { category: "GENERAL" }, orderBy: { createdAt: "desc" } }),
  ]);
  const initiativeOptions = initiatives.map(({ id, code, name }) => ({ id, code, name }));

  return <div>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><PageHeader title="Initiatives" description="Workstreams driving the global sales transformation program." /><InitiativeInput initiatives={initiativeOptions} /></div>

    <Card className="mb-6 border-[#78FAAE] bg-[#78FAAE]/5">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#78FAAE] p-2 text-[#0D3B32]"><FolderOpen className="h-5 w-5" /></div>
          <div><p className="text-base font-semibold">General</p><p className="text-sm text-muted-foreground">Project-wide inputs and source files that are not assigned to a specific initiative.</p></div>
        </div>
        <span className="shrink-0 rounded-full border border-[#78FAAE] bg-background px-2.5 py-1 text-xs font-medium text-[#0D3B32]">{generalDocuments.length} {generalDocuments.length === 1 ? "document" : "documents"}</span>
      </CardHeader>
      <CardContent>
        {generalDocuments.length > 0 ? <DocumentsList documents={generalDocuments} /> : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No General inputs yet. Use the Input button above and select General to add project-wide information.</p>}
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{initiatives.map((initiative)=>{const {label,tone}=healthTone(initiative.status);return <Link key={initiative.id} href={`/initiatives/${initiative.id}`} className="group block h-full"><Card className="pih-entity-card h-full transition-shadow hover:shadow-md"><CardHeader className="flex flex-row items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">{initiative.code} · Owner: {initiative.owner}</p><p className="text-base font-semibold text-foreground">{initiative.name}</p></div><StatusBadge label={label} tone={tone}/></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{initiative.description}</p><div><div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground"><span>Progress</span><span className="font-medium text-foreground">{initiative.progress}%</span></div><Progress value={initiative.progress}/></div><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>Target: {format(initiative.targetDate,"MMM yyyy")}</span><div className="flex flex-wrap gap-1.5">{initiative.markets.map((mi)=><span key={mi.id} className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{mi.market.code}</span>)}</div></div></CardContent></Card></Link>})}</div>
  </div>;
}
