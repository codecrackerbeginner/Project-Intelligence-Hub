"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const stages = ["IDEATION", "EVALUATION", "DETAILING", "DEVELOPMENT", "ROLLOUT"] as const;
const labels: Record<string, string> = { IDEATION: "Ideation", EVALUATION: "Evaluation", DETAILING: "Detailing", DEVELOPMENT: "Development", ROLLOUT: "Rollout" };

export function InitiativeStageControl({ initiativeId, stage }: { initiativeId: string; stage: string }) {
  const router = useRouter();
  const [value, setValue] = useState(stage);
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    setValue(next);
    setSaving(true);
    const response = await fetch(`/api/initiatives/${initiativeId}/stage`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: next }) });
    if (!response.ok) setValue(stage);
    else router.refresh();
    setSaving(false);
  }

  return <select aria-label="Initiative stage" value={value} disabled={saving} onChange={(e) => change(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-[#78FAAE]">
    {stages.map((item) => <option key={item} value={item}>{labels[item]}</option>)}
  </select>;
}
