import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OPEN_POINT = /\b(open|pending|outstanding|todo|to do|next step|action|follow[- ]?up|needs?|required|waiting|tbd)\b/i;
const RISK = /\b(risk|issue|blocker|blocked|delay|delayed|critical|at risk|concern|problem)\b/i;
const DECISION = /\b(decided|decision|agreed|approved|confirmed|aligned|signed off|sign[- ]?off)\b/i;

function firstUsefulLine(content: string) {
  const lines = content.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return lines[0] ?? content.trim();
}

function matchingLines(notes: Array<{ content: string }>, pattern: RegExp, limit = 4) {
  const seen = new Set<string>();
  const matches: string[] = [];
  for (const note of [...notes].reverse()) {
    for (const line of note.content.split(/\n|(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean)) {
      if (pattern.test(line) && !seen.has(line.toLowerCase())) {
        seen.add(line.toLowerCase());
        matches.push(line);
        if (matches.length >= limit) return matches;
      }
    }
  }
  return matches;
}

export async function POST(request: Request) {
  try {
    const { marketId } = await request.json();
    if (!marketId || typeof marketId !== "string") return NextResponse.json({ error: "Market is required." }, { status: 400 });

    const market = await prisma.market.findUnique({
      where: { id: marketId },
      select: {
        name: true,
        notes: {
          orderBy: { createdAt: "asc" },
          select: { content: true, createdAt: true, initiative: { select: { id: true, code: true, name: true } } },
        },
      },
    });
    if (!market) return NextResponse.json({ error: "Market not found." }, { status: 404 });
    if (market.notes.length === 0) return NextResponse.json({ error: "No notes available yet." }, { status: 400 });

    const latestByCategory = new Map<string, (typeof market.notes)[number]>();
    for (const note of market.notes) latestByCategory.set(note.initiative?.id ?? "__general__", note);
    const latest = Array.from(latestByCategory.values()).sort((a, b) => (a.initiative?.code ?? "GENERAL").localeCompare(b.initiative?.code ?? "GENERAL"));
    const newest = market.notes[market.notes.length - 1];
    const openPoints = matchingLines(market.notes, OPEN_POINT);
    const risks = matchingLines(market.notes, RISK);
    const decisions = matchingLines(market.notes, DECISION);

    const sections = [
      `Overall: ${market.name} has ${market.notes.length} recorded update${market.notes.length === 1 ? "" : "s"} across ${latest.length} categor${latest.length === 1 ? "y" : "ies"}. The latest recorded update is from ${newest.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}.`,
      "Updates:\n" + latest.map((note) => `• ${note.initiative ? `${note.initiative.code} · ${note.initiative.name}` : "General"}: ${firstUsefulLine(note.content)}`).join("\n"),
      openPoints.length ? "Open Points:\n" + openPoints.map((item) => `• ${item}`).join("\n") : "",
      decisions.length ? "Decisions:\n" + decisions.map((item) => `• ${item}`).join("\n") : "",
      risks.length ? "Risks / Issues:\n" + risks.map((item) => `• ${item}`).join("\n") : "",
      `Based on notes through: ${newest.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
    ].filter(Boolean);

    return NextResponse.json({ summary: sections.join("\n\n") });
  } catch {
    return NextResponse.json({ error: "Could not summarize notes." }, { status: 500 });
  }
}
