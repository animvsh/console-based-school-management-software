"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { SourceChip } from "./SourceChip";
import type { Evidence, Message } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  message: Message;
  evidence: Evidence[];
  onCitationClick: (n: number) => void;
  streaming?: boolean;
}

export function AnswerCard({
  message,
  evidence,
  onCitationClick,
  streaming,
}: Props) {
  // Filter out any [n] markers that don't map to real evidence so we never
  // leave dangling citations on-screen.
  const safeText = useMemo(() => {
    if (!message.content) return "";
    return message.content.replace(/\[(\d{1,2})\]/g, (_m, g) => {
      const n = Number(g);
      if (!Number.isFinite(n) || n < 1 || n > evidence.length) return "";
      return `[${n}]`;
    });
  }, [message.content, evidence.length]);

  return (
    <article className="animate-fade-in">
      <div className={cn("prose-scout", streaming && "scout-caret")}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Rewrite the bracketed citation tokens inside any text node into
            // clickable chip buttons, while leaving the rest of the markdown
            // tree untouched (lists, code, headings, etc.).
            p: ({ children }) => (
              <p>{renderCitations(children, evidence, onCitationClick)}</p>
            ),
            li: ({ children }) => (
              <li>{renderCitations(children, evidence, onCitationClick)}</li>
            ),
          }}
        >
          {safeText}
        </ReactMarkdown>
      </div>

      {evidence.length > 0 && !streaming && (
        <div className="mt-5">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-ink-400">
            Sources
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {evidence.slice(0, 6).map((e, i) => (
              <SourceChip
                key={e.id}
                evidence={e}
                index={i + 1}
                onClick={() => onCitationClick(i + 1)}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function renderCitations(
  children: React.ReactNode,
  evidence: Evidence[],
  onClick: (n: number) => void,
): React.ReactNode {
  const out: React.ReactNode[] = [];
  const visit = (node: React.ReactNode, keyPrefix: string) => {
    if (typeof node === "string") {
      const parts = node.split(/(\[\d{1,2}\])/g);
      parts.forEach((part, i) => {
        const m = /^\[(\d{1,2})\]$/.exec(part);
        if (m) {
          const n = Number(m[1]);
          if (n >= 1 && n <= evidence.length) {
            out.push(
              <button
                key={`${keyPrefix}-${i}`}
                className="cite-chip"
                onClick={() => onClick(n)}
                aria-label={`Source ${n}`}
              >
                {n}
              </button>,
            );
            return;
          }
        }
        if (part) out.push(part);
      });
      return;
    }
    out.push(node);
  };
  if (Array.isArray(children)) {
    children.forEach((c, i) => visit(c, `c${i}`));
  } else {
    visit(children, "c0");
  }
  return out;
}
