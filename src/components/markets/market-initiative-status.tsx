"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateMarketInitiativeStatus } from "@/lib/actions/market-initiatives";

type Status = "ON_TRACK" | "AT_RISK" | "CRITICAL";

export function MarketInitiativeStatus({ linkId, value }: { linkId: string; value: Status }) {
  const [pending, startTransition] = useTransition();
  return <div className="flex items-center gap-2">
    <select
      value={value}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => { await updateMarketInitiativeStatus(linkId, next); });
      }}
      className="h-9 rounded-md border bg-background px-2 text-xs font-medium"
      aria-label="Local rollout status"
    >
      <option value="ON_TRACK">On Track</option>
      <option value="AT_RISK">At Risk</option>
      <option value="CRITICAL">Critical</option>
    </select>
    {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
  </div>;
}
