import { nanoid } from "nanoid";

import { cosine, embed } from "./embeddings";
import { fetchAndExtract } from "./extract";
import { webSearch } from "./search";
import { allChunks } from "./store";
import type { Evidence, SearchMode, SearchResult } from "./types";

/**
 * Hybrid retrieval across web + library (uploaded docs + connectors later).
 * Returns a ranked, de-duplicated evidence pack ready for synthesis.
 */
export async function retrieve(
  query: string,
  mode: SearchMode,
  opts: { proSearch?: boolean } = {},
): Promise<Evidence[]> {
  const webBudget = opts.proSearch ? 10 : 6;
  const libBudget = opts.proSearch ? 8 : 5;

  const [web, lib] = await Promise.all([
    mode === "library" ? Promise.resolve<Evidence[]>([]) : retrieveWeb(query, webBudget),
    mode === "web" ? Promise.resolve<Evidence[]>([]) : retrieveLibrary(query, libBudget),
  ]);

  const merged = [...web, ...lib];
  merged.sort((a, b) => b.score - a.score);
  return dedupe(merged).slice(0, opts.proSearch ? 12 : 8);
}

async function retrieveWeb(query: string, limit: number): Promise<Evidence[]> {
  const results = await webSearch(query, limit);
  if (!results.length) return [];

  // Fetch & extract top N in parallel so we can cite real text, not just
  // search snippets. Bounded by `limit` to keep latency + cost predictable.
  const enriched = await Promise.all(
    results.slice(0, limit).map(async (r) => {
      const body = await fetchAndExtract(r.url).catch(() => "");
      return { ...r, body };
    }),
  );

  const qTokens = tokens(query);
  return enriched.map<Evidence>((r) => {
    const snippet = (r.body || r.snippet).slice(0, 600);
    return {
      id: `web_${nanoid(8)}`,
      sourceType: "web",
      title: r.title,
      url: r.url,
      snippet,
      score: scoreResult(qTokens, r, snippet),
      meta: r.publishedAt ? { publishedAt: r.publishedAt } : undefined,
    };
  });
}

async function retrieveLibrary(
  query: string,
  limit: number,
): Promise<Evidence[]> {
  const chunks = await allChunks();
  if (!chunks.length) return [];

  const qVec = await embed(query);
  const qTokens = new Set(tokens(query));

  const scored = chunks.map((c) => {
    const semantic = c.embedding ? cosine(qVec, c.embedding) : 0;
    const lex = lexicalScore(qTokens, c.text);
    const score = 0.65 * semantic + 0.35 * lex;
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map<Evidence>(({ c, score }) => ({
    id: `lib_${c.id}`,
    sourceType: "upload",
    title: c.fileName,
    snippet: c.text.slice(0, 500),
    score,
    meta: c.anchor ? { anchor: c.anchor } : undefined,
  }));
}

/** Split on word boundaries, drop tiny/common tokens. */
function tokens(s: string): string[] {
  return (
    s
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((t) => t.length > 2 && !STOP.has(t)) ?? []
  );
}

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "what",
  "when",
  "how",
  "why",
  "are",
  "was",
  "were",
  "about",
  "into",
  "over",
  "under",
  "have",
  "has",
  "had",
]);

function lexicalScore(q: Set<string>, text: string): number {
  if (!q.size) return 0;
  const toks = tokens(text);
  if (!toks.length) return 0;
  let hits = 0;
  for (const t of toks) if (q.has(t)) hits++;
  return Math.min(1, hits / (q.size * 2));
}

function scoreResult(
  qTokens: string[],
  r: SearchResult & { body?: string },
  snippet: string,
): number {
  const q = new Set(qTokens);
  const titleHit = lexicalScore(q, r.title) * 1.3;
  const snipHit = lexicalScore(q, snippet);
  const fresh = freshnessBonus(r.publishedAt);
  // Blend: title weight > body, + small freshness boost.
  return Math.min(1, 0.5 * titleHit + 0.4 * snipHit + 0.1 * fresh);
}

function freshnessBonus(published?: string): number {
  if (!published) return 0;
  const t = Date.parse(published);
  if (!Number.isFinite(t)) return 0;
  const days = (Date.now() - t) / 86_400_000;
  if (days < 7) return 1;
  if (days < 30) return 0.6;
  if (days < 180) return 0.3;
  return 0.1;
}

function dedupe(ev: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  const out: Evidence[] = [];
  for (const e of ev) {
    const key = (e.url ?? e.title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}
