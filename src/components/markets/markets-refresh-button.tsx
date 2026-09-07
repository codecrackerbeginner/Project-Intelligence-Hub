"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function MarketsRefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  function refresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={refreshing}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-[#78FAAE] bg-[#78FAAE] px-3 text-sm font-medium text-[#003B2F] transition-opacity hover:opacity-90 disabled:opacity-60"
      aria-label="Refresh markets"
    >
      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
      Refresh
    </button>
  );
}
