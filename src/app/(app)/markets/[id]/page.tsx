import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentsList } from "@/components/shared/documents-list";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { MilestoneJourney } from "@/components/markets/milestone-journey";
import { NotesCard } from "@/components/markets/notes-card";
import { MarketOwnerCard } from "@/components/markets/market-owner-card";
import { TasksClient } from "@/components/tasks/tasks-client";
import { healthTone,meetingTypeLabel } from "@/lib/status";

function detectedMarketMilestones(meetings:{title:string;notes:string;date:Date}[]){
  const relevant=meetings.filter(m=>m.date<=new Date());
  const onboarding=relevant.some(m=>/onboard|kick.?off/.test(`${m.title} ${m.notes}`.toLowerCase()));
  const followup=relevant.some(m=>/1:1|1-1|follow.?up|follow up/.test(`${m.title} ${m.notes}`.toLowerCase()));
  return followup?2:onboarding?1:0;
}

export default async function MarketDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const [market, allInitiatives]=await Promise.all([
    prisma.market.findUnique({where:{id},include:{initiatives:{include:{initiative:true}},meetings:{orderBy:{date:"desc"}},documents:{orderBy:{createdAt:"desc"}},notes:{orderBy:{createdAt:"desc"},include:{initiative:true}},tasks:{orderBy:{dueDate:"asc"},include:{initiative:{select:{id:true,code:true,name:true}},market:{select:{id:true,code:true,name:true}}}}}}),
    prisma.initiative.findMany({orderBy:{code:"asc"},select:{id:true,code:true,name:true}}),
  ]);
  if(!market)notFound();
  const {label,tone}=healthTone(market.status);
  const notes=market.notes.map(n=>({id:n.id,content:n.content,createdAt:n.createdAt,initiative:n.initiative?{id:n.initiative.id,code:n.initiative.code,name:n.initiative.name}:null}));

  if(market.code==="DE"){
    const activityDates=[market.updatedAt,...market.notes.map(n=>n.updatedAt),...market.meetings.map(m=>m.updatedAt),...market.documents.map(d=>d.createdAt),...market.tasks.map(t=>t.updatedAt)];
    const lastUpdate=new Date(Math.max(...activityDates.map(d=>new Date(d).getTime())));
    const nextTask=market.tasks.find(t=>t.status!=="DONE"&&new Date(t.dueDate)>=new Date());
    return <div>
      <PageHeader title={market.name} description={`${market.region} · Market Lead: ${market.lead}`} actions={<><Link href={`/reports/management?marketId=${market.id}`} className="inline-flex h-9 items-center justify-center rounded-md bg-[#78FAAE] px-4 text-sm font-semibold text-[#0D3B32] transition-colors hover:bg-[#78FAAE]/90">Report</Link><StatusBadge label={label} tone={tone}/></>}/>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Card className="h-full"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Overall Status</p><div className="mt-1.5"><StatusBadge label={label} tone={tone}/></div><p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">Manual · AI recommendation planned</p></CardContent></Card><MarketOwnerCard marketId={market.id} owner={market.lead}/><Card className="h-full"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Last Update</p><p className="mt-1.5 text-sm font-semibold">{format(lastUpdate,"MMM d, yyyy · HH:mm")}</p><p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">Updated automatically from market activity</p></CardContent></Card><Card className="h-full"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Next Key Date</p><p className="mt-1.5 text-sm font-semibold">{nextTask?format(nextTask.dueDate,"MMM d, yyyy"):"Not set"}</p><p className="mt-1.5 truncate text-[11px] leading-4 text-muted-foreground">{nextTask?.title??"Reserved for key market deadline"}</p></CardContent></Card></div>
      <Card className="mb-4 border-dashed"><CardHeader><CardTitle className="text-base">Current Market Status</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Reserved for Chatty: consolidated market summary from Notes, Tasks, Meetings, Data Intake, Documents and linked Initiatives.</p><div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-lg border p-3"><p className="text-xs font-semibold">Progress</p><p className="mt-1 text-xs text-muted-foreground">AI-generated progress summary</p></div><div className="rounded-lg border p-3"><p className="text-xs font-semibold">Attention Required</p><p className="mt-1 text-xs text-muted-foreground">AI-generated open points and risks</p></div><div className="rounded-lg border p-3"><p className="text-xs font-semibold">Next Steps</p><p className="mt-1 text-xs text-muted-foreground">AI-generated recommended next actions</p></div></div></CardContent></Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="text-base">Linked Initiatives</CardTitle></CardHeader><CardContent><div className="h-40 space-y-3 overflow-y-scroll pr-2 [scrollbar-gutter:stable]">{market.initiatives.map(mi=><Link key={mi.id} href={`/initiatives/${mi.initiativeId}`} className="block rounded-lg border p-3"><p className="text-sm font-medium">{mi.initiative.code} · {mi.initiative.name}</p><p className="text-xs text-muted-foreground">Local lead: {mi.localLead}</p></Link>)}</div></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Documents ({market.documents.length})</CardTitle></CardHeader><CardContent><div className="h-40 overflow-y-scroll pr-2 [scrollbar-gutter:stable]"><DocumentsList documents={market.documents}/></div></CardContent></Card></div>
      <Card className="my-4"><CardHeader><CardTitle className="text-base">Tasks & Actions</CardTitle></CardHeader><CardContent><TasksClient tasks={market.tasks} initiatives={allInitiatives} markets={[{id:market.id,code:market.code,name:market.name}]}/></CardContent></Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><NotesCard marketId={market.id} initiatives={allInitiatives} notes={notes}/><Card><CardHeader><CardTitle className="text-base">Latest Meetings</CardTitle></CardHeader><CardContent className="space-y-3">{market.meetings.length===0&&<p className="text-sm text-muted-foreground">No meetings linked to Germany yet.</p>}{market.meetings.map(m=><div key={m.id} className="rounded-lg border p-3"><p className="text-sm font-medium">{m.title}</p><p className="text-xs text-muted-foreground">{format(m.date,"EEE, MMM d yyyy")} · {meetingTypeLabel(m.type)}</p>{m.notes&&<p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{m.notes}</p>}</div>)}</CardContent></Card></div>
      <Card className="mt-4 border-dashed"><CardHeader><CardTitle className="text-base">RISE Master Milestones</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Placeholder until the overarching RISE milestone plan is confirmed.</p></CardContent></Card>
    </div>;
  }

  return <div>
    <PageHeader title={market.name} description={`${market.region} · Market Lead: ${market.lead}`} actions={<StatusBadge label={label} tone={tone}/>}/>
    <Card className="mb-4"><CardHeader><CardTitle className="text-base">Implementation Milestones</CardTitle></CardHeader><CardContent><MilestoneJourney marketId={market.id} marketName={market.name} autoCompleted={detectedMarketMilestones(market.meetings)} savedCompleted={market.milestoneCompleted}/></CardContent></Card>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="text-base">Linked Initiatives</CardTitle></CardHeader><CardContent className="space-y-3">{market.initiatives.map(mi=><Link key={mi.id} href={`/initiatives/${mi.initiativeId}`} className="block rounded-lg border p-3"><p className="text-sm font-medium">{mi.initiative.code} · {mi.initiative.name}</p><p className="text-xs text-muted-foreground">Local lead: {mi.localLead}</p></Link>)}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Documents ({market.documents.length})</CardTitle></CardHeader><CardContent><DocumentsList documents={market.documents}/></CardContent></Card><NotesCard marketId={market.id} initiatives={allInitiatives} notes={notes}/><Card><CardHeader><CardTitle className="text-base">Meetings</CardTitle></CardHeader><CardContent className="space-y-3">{market.meetings.map(m=><div key={m.id} className="rounded-lg border p-3"><p className="text-sm font-medium">{m.title}</p><p className="text-xs text-muted-foreground">{format(m.date,"EEE, MMM d yyyy")} · {meetingTypeLabel(m.type)}</p></div>)}</CardContent></Card></div>
  </div>;
}
