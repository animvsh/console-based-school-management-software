"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AnswerCard } from "./AnswerCard";
import { SearchBox } from "./SearchBox";
import { SourceChip } from "./SourceChip";
import { SourceDrawer } from "./SourceDrawer";
import type {
  Citation,
  Evidence,
  Message,
  SearchMode,
  StepTrace,
  Thread,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  thread: Thread;
}

export function ThreadView({ thread }: Props) {
  const sp = useSearchParams();
  const initialQ = sp.get("q");
  const initialMode = (sp.get("mode") as SearchMode | null) ?? "auto";

  const [messages, setMessages] = useState<Message[]>(thread.messages);
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [streaming, setStreaming] = useState(false);
  const [trace, setTrace] = useState<StepTrace[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [drawerEvidence, setDrawerEvidence] = useState<Evidence[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSubmitted = useRef(false);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const submit = useCallback(
    async (query: string, useMode: SearchMode) => {
      if (streaming) return;
      setStreaming(true);
      setTrace([]);

      // Optimistic user turn.
      const userMsg: Message = {
        id: `m_${Math.random().toString(36).slice(2, 10)}`,
        role: "user",
        content: query,
        createdAt: Date.now(),
        mode: useMode,
      };
      const placeholder: Message = {
        id: `m_stream_${Date.now()}`,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        mode: useMode,
        streaming: true,
        evidence: [],
        citations: [],
      };
      setMessages((prev) => [...prev, userMsg, placeholder]);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            threadId: thread.id,
            query,
            mode: useMode,
          }),
        });
        if (!res.ok || !res.body) throw new Error(`chat ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            handleEvent(part, placeholder.id);
          }
        }
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholder.id
              ? {
                  ...m,
                  streaming: false,
                  content:
                    m.content ||
                    `Scout couldn't complete that query (${
                      err instanceof Error ? err.message : "stream error"
                    }).`,
                }
              : m,
          ),
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, thread.id],
  );

  const handleEvent = (block: string, assistantId: string) => {
    const lines = block.split("\n");
    let event = "message";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (!data) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }

    switch (event) {
      case "trace": {
        setTrace((t) => [...t, parsed as StepTrace]);
        break;
      }
      case "evidence": {
        const ev = parsed as Evidence[];
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, evidence: ev } : m,
          ),
        );
        break;
      }
      case "token": {
        const { text } = parsed as { text: string };
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + text }
              : m,
          ),
        );
        break;
      }
      case "done": {
        const { citations } = parsed as { citations: Citation[] };
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, citations, streaming: false }
              : m,
          ),
        );
        break;
      }
      case "error": {
        const { message } = parsed as { message: string };
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  streaming: false,
                  content: m.content || `Error: ${message}`,
                }
              : m,
          ),
        );
        break;
      }
    }
  };

  // Auto-submit the seed query from the home page (once).
  useEffect(() => {
    if (autoSubmitted.current) return;
    if (thread.messages.length > 0) return;
    if (!initialQ) return;
    autoSubmitted.current = true;
    submit(initialQ, initialMode);
  }, [initialQ, initialMode, submit, thread.messages.length]);

  const openDrawerAt = (ev: Evidence[], n: number) => {
    setDrawerEvidence(ev);
    setFocusIdx(n);
    setDrawerOpen(true);
    setTimeout(() => {
      const el = document.getElementById(`source-${n}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-white">
            {thread.title}
          </div>
          <div className="text-[11px] text-ink-400">
            {messages.length} message{messages.length === 1 ? "" : "s"}
            {streaming && " · streaming…"}
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="scout-scroll flex-1 overflow-y-auto px-4 pb-6 pt-4 sm:px-8"
      >
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {messages.map((m) => {
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex">
                  <div className="ml-auto max-w-[92%] rounded-2xl bg-[var(--bg-elev)] px-4 py-2.5 text-[14px] text-white">
                    {m.content}
                  </div>
                </div>
              );
            }
            const ev = m.evidence ?? [];
            return (
              <div key={m.id}>
                {ev.length > 0 && (
                  <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="shrink-0 text-[11px] uppercase tracking-wide text-ink-400">
                      Searched
                    </span>
                    <div className="flex gap-2">
                      {ev.slice(0, 5).map((e, i) => (
                        <div key={e.id} className="shrink-0">
                          <SourceChip
                            evidence={e}
                            index={i + 1}
                            compact
                            onClick={() => openDrawerAt(ev, i + 1)}
                          />
                        </div>
                      ))}
                      {ev.length > 5 && (
                        <button
                          onClick={() => openDrawerAt(ev, 1)}
                          className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1.5 text-[12px] text-ink-300 hover:text-white"
                        >
                          +{ev.length - 5} more
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {m.streaming && trace.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {trace.slice(-3).map((t, i) => (
                      <span
                        key={`${t.label}-${i}`}
                        className={cn(
                          "rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-2 py-0.5 text-[11px]",
                          i === trace.slice(-3).length - 1
                            ? "text-white"
                            : "text-ink-400",
                        )}
                      >
                        {t.label}
                        {t.detail ? ` · ${t.detail}` : ""}
                      </span>
                    ))}
                  </div>
                )}

                <AnswerCard
                  message={m}
                  evidence={ev}
                  streaming={m.streaming}
                  onCitationClick={(n) => openDrawerAt(ev, n)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--bg)] p-3 sm:p-4">
        <div className="mx-auto w-full max-w-3xl">
          <SearchBox
            mode={mode}
            onModeChange={setMode}
            onSubmit={(v) => submit(v, mode)}
            disabled={streaming}
            placeholder={
              streaming ? "Scout is thinking…" : "Ask a follow-up…"
            }
          />
        </div>
      </div>

      <SourceDrawer
        evidence={drawerEvidence}
        focusIndex={focusIdx}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
