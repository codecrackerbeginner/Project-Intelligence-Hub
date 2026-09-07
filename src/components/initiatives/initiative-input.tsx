"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Initiative = { id: string; code: string; name: string };

type Props = {
  initiatives: Initiative[];
  fixedInitiative?: Initiative;
  compact?: boolean;
};

export function InitiativeInput({ initiatives, fixedInitiative, compact = false }: Props) {
  const router = useRouter();
  const options = fixedInitiative ? [fixedInitiative] : initiatives;
  const [open, setOpen] = useState(false);
  const [initiativeId, setInitiativeId] = useState(fixedInitiative?.id ?? options[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const selected = fixedInitiative ?? options.find((initiative) => initiative.id === initiativeId);

  async function upload() {
    if (!file || !selected) return;
    setUploading(true); setError(""); setSuccess("");
    const form = new FormData();
    form.append("file", file);
    form.append("contextType", "INITIATIVE");
    form.append("contextCode", selected.code);
    form.append("entityId", selected.id);
    try {
      const response = await fetch("/api/documents/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      setSuccess(`${file.name} uploaded and assigned to ${selected.code}.`);
      setFile(null);
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally { setUploading(false); }
  }

  return <div className="relative" onClick={(event) => event.preventDefault()}>
    <Button type="button" size={compact ? "sm" : "default"} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen((value) => !value); }} className="bg-[#78FAAE] text-[#0D3B32] hover:bg-[#78FAAE]/90">
      <FileUp className="h-4 w-4" />Input
    </Button>
    {open ? <div onClick={(event) => { event.preventDefault(); event.stopPropagation(); }} className="absolute right-0 top-11 z-40 w-[min(34rem,calc(100vw-3rem))] rounded-xl border border-[#78FAAE] bg-card p-5 text-left shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-4"><div><p className="font-semibold">Initiative Input</p><p className="text-xs text-muted-foreground">Upload and assign a source file directly to {fixedInitiative ? fixedInitiative.code : "an initiative"}.</p></div><button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-secondary"><X className="h-4 w-4" /></button></div>
      <div className="space-y-4">
        {fixedInitiative ? <div className="rounded-md border bg-secondary/30 px-3 py-2 text-sm"><span className="font-medium">{fixedInitiative.code}</span> — {fixedInitiative.name}</div> : <label className="grid gap-1.5 text-sm">Assign to initiative<select className="h-10 w-full rounded-md border bg-background px-3" value={initiativeId} onChange={(event) => { setInitiativeId(event.target.value); setSuccess(""); }} disabled={uploading}>{options.map((initiative) => <option key={initiative.id} value={initiative.id}>{initiative.code} — {initiative.name}</option>)}</select></label>}
        <label className="grid gap-1.5 text-sm">Source file<Input type="file" accept=".ppt,.pptx,.pdf,.xls,.xlsx,.doc,.docx,.txt" disabled={uploading} onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(""); setSuccess(""); }} /></label>
        {file ? <p className="text-xs text-muted-foreground">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? <p className="rounded-md border border-[#78FAAE] bg-[#78FAAE]/10 p-3 text-sm">{success}</p> : null}
        <div className="flex justify-end"><Button type="button" onClick={upload} disabled={!file || !selected || uploading} className="bg-[#78FAAE] text-[#0D3B32] hover:bg-[#78FAAE]/90">{uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Storing securely...</> : <><Sparkles className="h-4 w-4" />Upload & Analyze</>}</Button></div>
      </div>
    </div> : null}
  </div>;
}
