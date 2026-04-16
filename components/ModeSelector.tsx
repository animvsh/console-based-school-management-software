"use client";

import { Globe, Library, Sparkles, Wand2 } from "lucide-react";

import type { SearchMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES: Array<{
  id: SearchMode;
  label: string;
  hint: string;
  Icon: typeof Globe;
}> = [
  {
    id: "auto",
    label: "Auto",
    hint: "Let Scout choose",
    Icon: Wand2,
  },
  {
    id: "web",
    label: "Web",
    hint: "Only live web results",
    Icon: Globe,
  },
  {
    id: "library",
    label: "Library",
    hint: "Your files + connected apps",
    Icon: Library,
  },
  {
    id: "pro",
    label: "Pro",
    hint: "Deeper retrieval (slower)",
    Icon: Sparkles,
  },
];

interface Props {
  value: SearchMode;
  onChange: (v: SearchMode) => void;
  compact?: boolean;
}

export function ModeSelector({ value, onChange, compact }: Props) {
  return (
    <div
      role="tablist"
      className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elev-2)] p-1"
    >
      {MODES.map(({ id, label, hint, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            title={hint}
            onClick={() => onChange(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors",
              active
                ? "bg-[var(--bg-elev)] text-white shadow-soft"
                : "text-ink-300 hover:bg-[var(--bg-elev)] hover:text-white",
            )}
          >
            <Icon size={12} />
            {!compact && label}
          </button>
        );
      })}
    </div>
  );
}
