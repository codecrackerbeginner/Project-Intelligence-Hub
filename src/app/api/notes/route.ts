import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const marketId = typeof body.marketId === "string" && body.marketId ? body.marketId : null;
    const initiativeId = typeof body.initiativeId === "string" && body.initiativeId !== "GENERAL" && body.initiativeId ? body.initiativeId : null;
    if (!content || (!marketId && !initiativeId)) return NextResponse.json({ error: "Note and a market or initiative are required." }, { status: 400 });
    const [market,initiative] = await Promise.all([
      marketId ? prisma.market.findUnique({ where:{id:marketId},select:{id:true} }) : Promise.resolve(null),
      initiativeId ? prisma.initiative.findUnique({ where:{id:initiativeId},select:{id:true} }) : Promise.resolve(null),
    ]);
    if ((marketId && !market) || (initiativeId && !initiative)) return NextResponse.json({ error:"Market or initiative not found." },{status:400});
    const note = await prisma.note.create({ data:{content,marketId,initiativeId} });
    await prisma.activity.create({data:{type:"NOTE_CREATED",description:initiativeId?"Added an initiative note":"Added a market note",entityType:initiativeId?"Initiative":"Market",entityId:initiativeId??marketId!,actor:"You"}});
    return NextResponse.json(note,{status:201});
  } catch { return NextResponse.json({ error:"Could not save note." },{status:500}); }
}
