import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const validStatuses = new Set(["ON_TRACK", "AT_RISK", "CRITICAL"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: initiativeId } = await params;
  const body = await request.json().catch(() => null);
  const marketId = typeof body?.marketId === "string" ? body.marketId.trim() : "";
  const localLead = typeof body?.localLead === "string" && body.localLead.trim() ? body.localLead.trim() : "TBD";
  const localStatus = typeof body?.localStatus === "string" && validStatuses.has(body.localStatus) ? body.localStatus : "ON_TRACK";

  if (!marketId) return NextResponse.json({ error: "Market is required." }, { status: 400 });

  try {
    const link = await prisma.marketInitiative.create({
      data: { initiativeId, marketId, localLead, localStatus: localStatus as "ON_TRACK" | "AT_RISK" | "CRITICAL" },
      include: { market: true },
    });
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Unique constraint") ? "This market is already linked." : "Could not link market.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
