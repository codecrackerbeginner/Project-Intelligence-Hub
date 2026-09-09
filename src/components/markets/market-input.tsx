"use client";

import { ChangeEvent, useState } from "react";
import { FileUp, Loader2, Sparkles, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Market = { id: string; code: string; name: string };
const ACCEPTED = [".ppt", ".pptx", ".pdf", ".xls", ".xlsx", ".doc", ".docx", ".txt"];

export function MarketInput({ market }: { market: Market }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    if (!next) return;
    if (!ACCEPTED.some((ext) => next.name.toLowerCase().endsWith(ext))) {
      setFile(null);
      setError("Unsupported file type. Please choose a PowerPoint, PDF, Excel, Word or TXT file.");
      return;
    }
    setFile(next);
    setError("");
    setSuccess("");
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError("");
    setSuccess("");
    const form = new FormData();
    form.append("file", file);
    form.append("contextType", "MARKET");
    form.append("contextCode", market.code);
    form.append("entityId", market.id);
    try {
      const response = await fetch("/api/documents/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      setSuccess(`${file.name} uploaded to ${market.name}.`);
      setFile(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return <div className="relative">
    <Button type="button" onClick={() => setOpen((v) => !v)} className="bg-[#78FAAE] text-[#0D3B32] hover:bg-[#78FAAE]/90"><FileUp className="h-4 w-4" />Input</Button>
    {open ? <div className="absolute right-0 top-11 z-50 w-[min(34rem,calc(100vw-3rem))] rounded-xl border border-[#78FAAE] bg-card p-5 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-4"><div><p className="font-semibold">Market Input</p><p className="text-xs text-muted-foreground">Upload a source file directly to {market.name}.</p></div><button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-secondary"><X className="h-4 w-4" /></button></div>
      <div className="space-y-4">
        <div className="rounded-md border bg-secondary/30 px-3 py-2 text-sm"><span className="font-medium">{market.code}</span> — {market.name}</div>
        <div className="grid gap-1.5 text-sm"><span>Source file</span><label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-secondary/20 px-4 py-5 text-center hover:border-[#78FAAE] hover:bg-[#78FAAE]/5"><UploadCloud className="mb-2 h-5 w-5 text-[#0D3B32]" /><span className="font-medium">Choose file</span><span className="mt-1 text-xs text-muted-foreground">PPT, PDF, Excel, Word or TXT</span><input type="file" className="sr-only" accept={ACCEPTED.join(",")} disabled={uploading} onChange={onFileChange} /></label>{file ? <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2"><span className="truncate text-sm font-medium">{file.name}</span><span className="ml-3 shrink-0 text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span></div> : null}</div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}{success ? <p className="rounded-md border border-[#78FAAE] bg-[#78FAAE]/10 p-3 text-sm">{success}</p> : null}
        <div className="flex justify-end"><Button type="button" onClick={upload} disabled={!file || uploading} className="bg-[#78FAAE] text-[#0D3B32] hover:bg-[#78FAAE]/90">{uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Storing...</> : <><Sparkles className="h-4 w-4" />Upload & Analyze</>}</Button></div>
      </div>
    </div> : null}
  </div>;
}
