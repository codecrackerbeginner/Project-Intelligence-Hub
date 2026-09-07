"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

type MarketOption = { id: string; code: string; name: string };

export function AddMarketForm({ initiativeId, markets }: { initiativeId: string; markets: MarketOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/initiatives/${initiativeId}/markets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId: form.get("marketId"), localStatus: form.get("localStatus"), localLead: form.get("localLead") }),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) { setError(result.error ?? "Could not link market."); return; }
    setOpen(false);
    router.refresh();
  }

  if (!markets.length) return <p className="text-sm text-muted-foreground">All markets are already linked.</p>;

  return <div className="mb-4">
    {!open ? <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" />Add Market</button> :
      <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-secondary/20 p-4 md:grid-cols-[2fr_1fr_1.5fr_auto] md:items-end">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">Market<select name="marketId" required className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground">{markets.map(m => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</select></label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">Status<select name="localStatus" defaultValue="ON_TRACK" className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground"><option value="ON_TRACK">On Track</option><option value="AT_RISK">At Risk</option><option value="CRITICAL">Critical</option></select></label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">Local Lead<input name="localLead" defaultValue="TBD" className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground" /></label>
        <div className="flex gap-2"><button disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save"}</button><button type="button" onClick={() => setOpen(false)} className="h-9 rounded-md border px-3 text-sm">Cancel</button></div>
        {error ? <p className="text-xs text-destructive md:col-span-4">{error}</p> : null}
      </form>}
  </div>;
}
