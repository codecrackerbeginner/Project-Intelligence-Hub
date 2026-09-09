import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const stages = new Set(["IDEATION", "EVALUATION", "DETAILING", "DEVELOPMENT", "ROLLOUT"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  if (!stages.has(body.stage)) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  const initiative = await prisma.initiative.update({ where: { id }, data: { stage: body.stage } });
  await prisma.activity.create({ data: { type: "INITIATIVE_STAGE_UPDATED", description: `Updated ${initiative.code} stage to ${body.stage}`, entityType: "Initiative", entityId: initiative.id, actor: "You" } });
  return NextResponse.json(initiative);
}
