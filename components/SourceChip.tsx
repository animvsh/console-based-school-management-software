"use client";

import {
  FileText,
  Github,
  Globe,
  Mail,
  MessageCircle,
  Calendar,
  BookOpen,
  HardDrive,
} from "lucide-react";

import type { Evidence, SourceType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON: Record<SourceType, typeof Globe> = {
  web: Globe,
  upload: FileText,
  drive: HardDrive,
  gmail: Mail,
  slack: MessageCircle,
  notion: BookOpen,
  github: Github,
  calendar: Calendar,
};

export function SourceChip({
  evidence,
  index,
  onClick,
  compact,
}: {
  evidence: Evidence;
  index: number;
  onClick?: () => void;
  compact?: boolean;
}) {
  const Icon = ICON[evidence.sourceType] ?? Globe;
  const domain = evidence.url ? hostFromUrl(evidence.url) : evidence.title;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex min-w-0 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] text-left transition-colors",
        "hover:border-accent/40 hover:bg-[var(--bg-elev-2)]",
        compact ? "px-2.5 py-1.5" : "p-3",
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--bg-elev-2)] text-ink-300 group-hover:text-accent">
        <Icon size={12} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] text-white">
            {evidence.title || domain}
          </span>
        </span>
        {!compact && (
          <span className="mt-0.5 block truncate text-[11px] text-ink-400">
            {domain}
          </span>
        )}
      </span>
      <span className="ml-auto shrink-0 rounded bg-[var(--bg-elev-2)] px-1.5 py-0.5 text-[10px] text-ink-300">
        {index}
      </span>
    </button>
  );
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
