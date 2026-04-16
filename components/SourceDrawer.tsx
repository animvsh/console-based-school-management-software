"use client";

import { X } from "lucide-react";

import type { Evidence } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  evidence: Evidence[];
  focusIndex?: number | null;
  open: boolean;
  onClose: () => void;
}

export function SourceDrawer({ evidence, focusIndex, open, onClose }: Props) {
  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--bg-elev)] shadow-2xl transition-transform duration-200 sm:w-[420px]",
        open ? "translate-x-0" : "translate-x-full",
      )}
    >
      <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-white">Sources</div>
          <div className="text-[11px] text-ink-400">
            {evidence.length} cited · click a citation to focus
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-ink-400 hover:bg-[var(--bg-elev-2)] hover:text-white"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </header>
      <div className="scout-scroll flex-1 overflow-y-auto p-3">
        {evidence.length === 0 && (
          <div className="px-2 py-6 text-center text-xs text-ink-400">
            No sources yet.
          </div>
        )}
        {evidence.map((e, i) => {
          const n = i + 1;
          const focused = focusIndex === n;
          return (
            <a
              key={e.id}
              id={`source-${n}`}
              href={e.url ?? undefined}
              target={e.url ? "_blank" : undefined}
              rel="noreferrer"
              className={cn(
                "mb-2 block rounded-lg border p-3 transition-colors",
                focused
                  ? "border-accent/70 bg-[var(--bg-elev-2)]"
                  : "border-[var(--border)] hover:border-accent/30 hover:bg-[var(--bg-elev-2)]",
              )}
            >
              <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-ink-400">
                <span className="rounded bg-[var(--bg-elev-2)] px-1.5 py-0.5 text-[10px] text-ink-300">
                  {n}
                </span>
                <span>{e.sourceType}</span>
                {e.meta?.publishedAt && (
                  <span>· {String(e.meta.publishedAt)}</span>
                )}
              </div>
              <div className="text-[13px] font-medium text-white">
                {e.title}
              </div>
              {e.url && (
                <div className="mt-0.5 truncate text-[11px] text-ink-400">
                  {e.url}
                </div>
              )}
              <div className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-200">
                {e.snippet}
              </div>
            </a>
          );
        })}
      </div>
    </aside>
  );
}
