"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  Pin,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";

import type { Thread } from "@/lib/types";
import { cn, fmtRelative } from "@/lib/utils";

interface Props {
  threads: Thread[];
  activeThreadId?: string;
  open: boolean;
  onToggle: () => void;
}

export function ThreadSidebar({
  threads,
  activeThreadId,
  open,
  onToggle,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const onDelete = async (id: string) => {
    if (!confirm("Delete this thread?")) return;
    await fetch(`/api/threads/${id}`, { method: "DELETE" });
    if (pathname?.includes(id)) router.push("/");
    else router.refresh();
  };

  const onPin = async (id: string, pinned: boolean) => {
    await fetch(`/api/threads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !pinned }),
    });
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-elev)] transition-[width] duration-200",
        open ? "w-64" : "w-0",
      )}
    >
      {open && (
        <>
          <div className="flex items-center justify-between px-3 pb-2 pt-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-1 text-sm font-semibold tracking-tight"
            >
              <span
                aria-hidden
                className="inline-block h-5 w-5 rounded bg-gradient-to-br from-[#6c5cff] to-[#3a2fbf]"
              />
              Scout
            </Link>
            <button
              onClick={onToggle}
              className="rounded-md p-1.5 text-ink-400 hover:bg-[var(--bg-elev-2)] hover:text-white"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          <Link
            href="/"
            className="mx-3 mb-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elev-2)] px-3 py-2 text-sm text-white hover:border-accent/50"
          >
            <Plus size={14} /> New thread
          </Link>

          <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-[var(--bg-elev-2)] px-2.5 py-1.5 text-xs text-ink-400">
            <Search size={12} />
            <span>Your threads</span>
          </div>

          <nav className="scout-scroll flex-1 overflow-y-auto px-2 pb-2">
            {threads.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-ink-400">
                No threads yet.
              </div>
            )}
            {threads.map((t) => {
              const active = t.id === activeThreadId;
              return (
                <div
                  key={t.id}
                  className={cn(
                    "group relative mb-0.5 rounded-md",
                    active
                      ? "bg-[var(--bg-elev-2)]"
                      : "hover:bg-[var(--bg-elev-2)]",
                  )}
                >
                  <Link
                    href={`/thread/${t.id}`}
                    className="block truncate px-3 py-2 pr-16 text-[13px]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {t.pinned ? (
                        <Pin size={11} className="text-accent shrink-0" />
                      ) : (
                        <MessageSquare
                          size={11}
                          className="shrink-0 text-ink-400"
                        />
                      )}
                      <span className="truncate">{t.title}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-ink-400">
                      {fmtRelative(t.updatedAt)}
                    </div>
                  </Link>
                  <div className="absolute right-1.5 top-1.5 hidden gap-1 group-hover:flex">
                    <button
                      onClick={() => onPin(t.id, Boolean(t.pinned))}
                      className="rounded p-1 text-ink-400 hover:bg-[var(--bg-elev)] hover:text-white"
                      aria-label={t.pinned ? "Unpin" : "Pin"}
                    >
                      <Pin size={12} />
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="rounded p-1 text-ink-400 hover:bg-[var(--bg-elev)] hover:text-red-300"
                      aria-label="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-[var(--border)] px-3 py-2 text-[11px] text-ink-400">
            <div className="flex items-center justify-between">
              <span>Library · Connectors</span>
              <Settings size={12} />
            </div>
          </div>
        </>
      )}
      {!open && (
        <button
          onClick={onToggle}
          className="m-2 rounded-md p-1.5 text-ink-400 hover:bg-[var(--bg-elev-2)] hover:text-white"
          aria-label="Open sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}
    </aside>
  );
}
