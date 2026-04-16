"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SearchBox } from "./SearchBox";
import { SuggestionGrid } from "./SuggestionGrid";
import type { SearchMode } from "@/lib/types";

export function HomeLanding() {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("auto");
  const [busy, setBusy] = useState(false);

  const startThread = async (seed: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedQuery: seed }),
      });
      const { id } = (await res.json()) as { id: string };
      const url = new URL(`/thread/${id}`, window.location.origin);
      url.searchParams.set("q", seed);
      url.searchParams.set("mode", mode);
      router.push(url.pathname + url.search);
    } finally {
      setBusy(false);
    }
  };

  const attachFiles = async (files: File[]) => {
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      await fetch("/api/upload", { method: "POST", body: fd });
    }
  };

  return (
    <div className="scout-scroll flex h-full flex-col items-center overflow-y-auto px-4">
      <div className="mt-[18vh] w-full max-w-2xl">
        <div className="mb-5 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            What do you want to know?
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            Scout searches the web, your files, and your connected apps —
            powered by MiniMax.
          </p>
        </div>

        <SearchBox
          autoFocus
          size="lg"
          mode={mode}
          onModeChange={setMode}
          disabled={busy}
          onSubmit={startThread}
          onAttach={attachFiles}
          placeholder="Ask anything — web, your docs, Gmail, Drive, Slack, Notion…"
        />

        <SuggestionGrid onPick={startThread} />

        <div className="mb-16 mt-10 text-center text-[11px] text-ink-400">
          Powered by MiniMax · Connected via Composio
        </div>
      </div>
    </div>
  );
}
