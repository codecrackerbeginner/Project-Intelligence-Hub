"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const statusSchema = z.enum(["ON_TRACK", "AT_RISK", "CRITICAL"]);

export async function updateMarketInitiativeStatus(linkId: string, status: string) {
  const parsedStatus = statusSchema.parse(status);
  const link = await prisma.marketInitiative.update({
    where: { id: linkId },
    data: { localStatus: parsedStatus },
    include: { market: { select: { id: true, name: true } }, initiative: { select: { id: true, code: true, name: true } } },
  });
  await prisma.activity.create({
    data: {
      type: "MARKET_INITIATIVE_STATUS_UPDATED",
      description: `${link.market.name} · ${link.initiative.code} local rollout status changed to ${parsedStatus.replaceAll("_", " ")}`,
      entityType: "MarketInitiative",
      entityId: link.id,
      actor: "You",
    },
  });
  revalidatePath(`/markets/${link.market.id}`);
  revalidatePath(`/initiatives/${link.initiative.id}`);
  revalidatePath("/markets");
  revalidatePath("/dashboard");
  return { ok: true } as const;
}
