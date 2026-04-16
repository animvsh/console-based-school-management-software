import { minimaxStream } from "./minimax";
import { retrieve } from "./retrieval";
import type {
  Citation,
  Evidence,
  Message,
  SearchMode,
  StepTrace,
} from "./types";

export type SynthesisDelta =
  | { type: "trace"; step: StepTrace }
  | { type: "evidence"; evidence: Evidence[] }
  | { type: "token"; text: string }
  | { type: "done"; citations: Citation[] };

/**
 * End-to-end query pipeline:
 *   plan -> retrieve -> rank -> synthesize (stream) -> extract citations.
 *
 * Yields deltas so the API route can relay them to the client over SSE.
 */
export async function* runQuery(
  params: {
    query: string;
    history: Message[];
    mode: SearchMode;
    proSearch: boolean;
  },
): AsyncGenerator<SynthesisDelta, void, void> {
  const { query, history, mode, proSearch } = params;

  yield {
    type: "trace",
    step: {
      label: "Planning",
      detail: `mode=${mode}${proSearch ? " · pro" : ""}`,
      at: Date.now(),
    },
  };

  const evidence = await retrieve(query, mode, { proSearch });
  yield { type: "evidence", evidence };
  yield {
    type: "trace",
    step: {
      label: "Retrieved",
      detail: `${evidence.length} source${evidence.length === 1 ? "" : "s"}`,
      at: Date.now(),
    },
  };

  const system = buildSystemPrompt(mode, proSearch);
  const evidencePack = formatEvidence(evidence);

  const priorTurns = history
    .slice(-8)
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const messages = [
    { role: "system" as const, content: system },
    ...priorTurns.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user" as const,
      content: `${query}\n\n---\nEvidence:\n${evidencePack}`,
    },
  ];

  yield {
    type: "trace",
    step: { label: "Synthesizing", at: Date.now() },
  };

  let full = "";
  for await (const delta of minimaxStream(messages, {
    maxTokens: proSearch ? 1600 : 900,
    temperature: 0.25,
  })) {
    full += delta;
    yield { type: "token", text: delta };
  }

  yield {
    type: "done",
    citations: extractCitations(full, evidence),
  };
}

function buildSystemPrompt(mode: SearchMode, pro: boolean): string {
  const scope =
    mode === "web"
      ? "Only use the web evidence provided."
      : mode === "library"
        ? "Only use the user's library (uploaded files and connected apps)."
        : "Use whichever evidence is most relevant — web, library, or both.";
  return [
    "You are Scout, an answer engine.",
    "Write a concise, well-structured answer that the reader can skim in under 20 seconds.",
    "Lead with the direct answer. Support it with 2–4 short paragraphs or a tight list.",
    "Cite sources inline using bracket numerals like [1], [2] that match the numbered Evidence list.",
    "Only cite numbers that exist in the Evidence list. If evidence is thin, say so honestly.",
    "Never fabricate URLs, quotes, or statistics. If you don't know, say you don't know.",
    scope,
    pro
      ? "This is Pro Search — be thorough, compare sources, and highlight disagreement where it exists."
      : "Be brief. Prefer clarity over exhaustiveness.",
  ].join(" ");
}

function formatEvidence(ev: Evidence[]): string {
  if (!ev.length) return "(no evidence found — answer cautiously and say so)";
  return ev
    .map((e, i) => {
      const src = e.url ? `${e.sourceType} · ${e.url}` : e.sourceType;
      return `[${i + 1}] (${src}) ${e.title}\n${e.snippet}`;
    })
    .join("\n\n");
}

/**
 * Parse [n] markers from the synthesized answer and map them back onto the
 * evidence array. Only markers that fall within range become citations.
 */
function extractCitations(text: string, ev: Evidence[]): Citation[] {
  const seen = new Map<number, Citation>();
  const re = /\[(\d{1,2})\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = Number(m[1]);
    if (!Number.isFinite(n)) continue;
    const idx = n - 1;
    if (idx < 0 || idx >= ev.length) continue;
    if (!seen.has(n)) {
      seen.set(n, { index: n, evidenceId: ev[idx].id });
    }
  }
  return [...seen.values()].sort((a, b) => a.index - b.index);
}
