import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentsList } from "@/components/shared/documents-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { MilestoneJourney } from "@/components/markets/milestone-journey";
import { NotesCard } from "@/components/markets/notes-card";
import { TasksClient } from "@/components/tasks/tasks-client";
import { MarketInput } from "@/components/markets/market-input";
import { MarketInitiativeStatus } from "@/components/markets/market-initiative-status";
import { MarketMeetingButton } from "@/components/meetings/market-meeting-button";
import { healthTone, meetingTypeLabel } from "@/lib/status";

function detectedMarketMilestones(meetings: { title: string; notes: string; date: Date }[]) {
  const relevant = meetings.filter((m) => m.date <= new Date());
  const onboarding = relevant.some((m) => /onboard|kick.?off/.test(`${m.title} ${m.notes}`.toLowerCase()));
  const followup = relevant.some((m) => /1:1|1-1|follow.?up|follow up/.test(`${m.title} ${m.notes}`.toLowerCase()));
  return followup ? 2 : onboarding ? 1 : 0;
}

export default async function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [market, allInitiatives] = await Promise.all([
    prisma.market.findUnique({
      where: { id },
      include: {
        initiatives: { include: { initiative: true }, orderBy: { initiative: { code: "asc" } } },
        meetings: { orderBy: { date: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        notes: { orderBy: { createdAt: "desc" }, include: { initiative: true } },
        tasks: { orderBy: { dueDate: "asc" }, include: { initiative: { select: { id: true, code: true, name: true } }, market: { select: { id: true, code: true, name: true } } } },
      },
    }),
    prisma.initiative.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
  ]);
  if (!market) notFound();

  const { label, tone } = healthTone(market.status);
  const notes = market.notes.map((n) => ({ id: n.id, content: n.content, createdAt: n.createdAt, initiative: n.initiative ? { id: n.initiative.id, code: n.initiative.code, name: n.initiative.name } : null }));
  const activeLocal = market.initiatives.length;
  const localOnTrack = market.initiatives.filter((mi) => mi.localStatus === "ON_TRACK").length;
  const localAtRisk = market.initiatives.filter((mi) => mi.localStatus === "AT_RISK").length;
  const localCritical = market.initiatives.filter((mi) => mi.localStatus === "CRITICAL").length;
  const upcomingMeetings = market.meetings.filter((m) => m.date >= new Date()).sort((a, b) => a.date.getTime() - b.date.getTime());

  return <div>
    <PageHeader
      title={market.name}
      description={`${market.region} · Market Lead: ${market.lead}`}
      actions={<div className="flex flex-wrap items-center gap-2"><MarketMeetingButton market={{ id: market.id, code: market.code, name: market.name }} /><MarketInput market={{ id: market.id, code: market.code, name: market.name }} /><StatusBadge label={label} tone={tone} /></div>}
    />

    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Linked initiatives</p><p className="mt-1 text-2xl font-semibold">{activeLocal}</p><p className="text-[11px] text-muted-foreground">in local implementation</p></CardContent></Card>
      <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">On track</p><p className="mt-1 text-2xl font-semibold">{localOnTrack}</p><p className="text-[11px] text-muted-foreground">local rollouts progressing</p></CardContent></Card>
      <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">At risk</p><p className="mt-1 text-2xl font-semibold">{localAtRisk}</p><p className="text-[11px] text-muted-foreground">local rollouts need attention</p></CardContent></Card>
      <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Critical</p><p className="mt-1 text-2xl font-semibold">{localCritical}</p><p className="text-[11px] text-muted-foreground">local rollouts blocked / critical</p></CardContent></Card>
    </div>

    <Card className="mb-4"><CardHeader><CardTitle className="text-base">Implementation Milestones</CardTitle></CardHeader><CardContent><MilestoneJourney marketId={market.id} marketName={market.name} autoCompleted={detectedMarketMilestones(market.meetings)} savedCompleted={market.milestoneCompleted} /></CardContent></Card>

    <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <Card><CardHeader><CardTitle className="text-base">Linked Initiatives · Local Rollout Steering</CardTitle></CardHeader><CardContent className="space-y-3">
        {market.initiatives.length === 0 ? <p className="text-sm text-muted-foreground">No initiatives linked to this market yet.</p> : null}
        {market.initiatives.map((mi) => <div key={mi.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href={`/initiatives/${mi.initiativeId}`} className="min-w-0"><p className="text-sm font-medium">{mi.initiative.code} · {mi.initiative.name}</p><p className="text-xs text-muted-foreground">Local lead: {mi.localLead} · HQ status: {healthTone(mi.initiative.status).label}</p></Link>
          <div className="shrink-0"><MarketInitiativeStatus linkId={mi.id} value={mi.localStatus} /></div>
        </div>)}
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Meetings</CardTitle></CardHeader><CardContent className="space-y-3">
        {upcomingMeetings.length === 0 ? <p className="text-sm text-muted-foreground">No upcoming meeting scheduled.</p> : upcomingMeetings.slice(0, 4).map((m) => <div key={m.id} className="rounded-lg border p-3"><p className="text-sm font-medium">{m.title}</p><p className="text-xs text-muted-foreground">{format(m.date, "EEE, MMM d yyyy · HH:mm")} · {meetingTypeLabel(m.type)}</p></div>)}
        {market.meetings.length > upcomingMeetings.length ? <p className="pt-1 text-xs text-muted-foreground">{market.meetings.length - upcomingMeetings.length} past meeting(s) stored for this market.</p> : null}
      </CardContent></Card>
    </div>

    <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <NotesCard marketId={market.id} initiatives={allInitiatives} notes={notes} />
      <Card><CardHeader><CardTitle className="text-base">Documents ({market.documents.length})</CardTitle></CardHeader><CardContent><DocumentsList documents={market.documents} /></CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle className="text-base">Tasks & Actions</CardTitle></CardHeader><CardContent><TasksClient tasks={market.tasks} initiatives={allInitiatives} markets={[{ id: market.id, code: market.code, name: market.name }]} /></CardContent></Card>
  </div>;
}
