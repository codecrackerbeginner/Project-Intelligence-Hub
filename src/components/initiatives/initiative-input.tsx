"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Sparkles, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Initiative = { id: string; code: string; name: string };
type Props = { initiatives: Initiative[]; fixedInitiative?: Initiative; compact?: boolean };

const ACCEPTED_EXTENSIONS = [".ppt", ".pptx", ".pdf", ".xls", ".xlsx", ".doc", ".docx", ".txt"];

export function InitiativeInput({ initiatives, fixedInitiative, compact = false }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const general = { id: "__general__", code: "GENERAL", name: "General" };
  const options = fixedInitiative ? [fixedInitiative] : [general, ...initiatives];
  const [open, setOpen] = useState(false);
  const [initiativeId, setInitiativeId] = useState(fixedInitiative?.id ?? options[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const selected = fixedInitiative ?? options.find((i) => i.id === initiativeId);

  function selectFile(nextFile: File | null) {
    if (!nextFile) return;
    const lowerName = nextFile.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
      setFile(null);
      setError("Unsupported file type. Please choose a PowerPoint, PDF, Excel, Word or TXT file.");
      return;
    }
    setFile(nextFile);
    setError("");
    setSuccess("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    if (!uploading) selectFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function upload() {
    if (!file || !selected) return;
    setUploading(true);
    setError("");
    setSuccess("");
    const isGeneral = selected.id === "__general__";
    const form = new FormData();
    form.append("file", file);
    form.append("contextType", isGeneral ? "GENERAL" : "INITIATIVE");
    form.append("contextCode", selected.code);
    form.append("entityId", isGeneral ? "" : selected.id);
    try {
      const response = await fetch("/api/documents/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      setSuccess(`${file.name} uploaded and assigned to ${selected.name}.`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative" onClick={(e) => e.preventDefault()}>
      <Button type="button" size={compact ? "sm" : "default"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }} className="bg-[#78FAAE] text-[#0D3B32] hover:bg-[#78FAAE]/90">
        <FileUp className="h-4 w-4" />Input
      </Button>
      {open ? (
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="absolute right-0 top-11 z-40 w-[min(34rem,calc(100vw-3rem))] rounded-xl border border-[#78FAAE] bg-card p-5 text-left shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div><p className="font-semibold">Initiative Input</p><p className="text-xs text-muted-foreground">Upload and assign a source file directly to {fixedInitiative ? fixedInitiative.code : "an initiative or General"}.</p></div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-secondary"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-4">
            {fixedInitiative ? (
              <div className="rounded-md border bg-secondary/30 px-3 py-2 text-sm"><span className="font-medium">{fixedInitiative.code}</span> — {fixedInitiative.name}</div>
            ) : (
              <label className="grid gap-1.5 text-sm">Assign to initiative<select className="h-10 w-full rounded-md border bg-background px-3" value={initiativeId} onChange={(e) => { setInitiativeId(e.target.value); setSuccess(""); }} disabled={uploading}>{options.map((i) => <option key={i.id} value={i.id}>{i.id === "__general__" ? "General" : `${i.code} — ${i.name}`}</option>)}</select></label>
            )}

            <div className="grid gap-1.5 text-sm">
              <span>Source file</span>
              <input ref={inputRef} type="file" className="sr-only" accept={ACCEPTED_EXTENSIONS.join(",")} disabled={uploading} onChange={handleFileChange} />
              <div
                role="button"
                tabIndex={0}
                onClick={() => !uploading && inputRef.current?.click()}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !uploading) { e.preventDefault(); inputRef.current?.click(); } }}
                onDragEnter={(e) => { e.preventDefault(); if (!uploading) setDragging(true); }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                onDrop={handleDrop}
                className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-5 text-center transition-colors ${dragging ? "border-[#78FAAE] bg-[#78FAAE]/10" : "border-border bg-secondary/20 hover:border-[#78FAAE] hover:bg-[#78FAAE]/5"}`}
              >
                <UploadCloud className="mb-2 h-5 w-5 text-[#0D3B32]" />
                <span className="font-medium">Choose file</span>
                <span className="mt-1 text-xs text-muted-foreground">or drag & drop here · PPT, PDF, Excel, Word or TXT</span>
              </div>
              {file ? <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2"><span className="min-w-0 truncate text-sm font-medium">{file.name}</span><span className="ml-3 shrink-0 text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span></div> : null}
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? <p className="rounded-md border border-[#78FAAE] bg-[#78FAAE]/10 p-3 text-sm">{success}</p> : null}
            <div className="flex justify-end">
              <Button type="button" onClick={upload} disabled={!file || !selected || uploading} className="bg-[#78FAAE] text-[#0D3B32] hover:bg-[#78FAAE]/90">
                {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Storing securely...</> : <><Sparkles className="h-4 w-4" />Upload & Analyze</>}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
