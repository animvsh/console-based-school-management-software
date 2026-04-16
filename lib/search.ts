import { env } from "./env";
import type { SearchResult } from "./types";

/**
 * Unified web-search front. Each provider returns a normalized SearchResult[]
 * so the retrieval layer doesn't care which backend served the query.
 */
export async function webSearch(
  query: string,
  limit = 6,
): Promise<SearchResult[]> {
  switch (env.search.provider) {
    case "tavily":
      return tavilySearch(query, limit);
    case "exa":
      return exaSearch(query, limit);
    case "serpapi":
      return serpapiSearch(query, limit);
    default:
      return mockSearch(query, limit);
  }
}

async function tavilySearch(q: string, limit: number): Promise<SearchResult[]> {
  if (!env.search.tavily) return mockSearch(q, limit);
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: env.search.tavily,
      query: q,
      max_results: limit,
      search_depth: "basic",
      include_answer: false,
    }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    results?: Array<{
      title: string;
      url: string;
      content: string;
      published_date?: string;
    }>;
  };
  return (json.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
    publishedAt: r.published_date,
  }));
}

async function exaSearch(q: string, limit: number): Promise<SearchResult[]> {
  if (!env.search.exa) return mockSearch(q, limit);
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.search.exa,
    },
    body: JSON.stringify({
      query: q,
      numResults: limit,
      contents: { text: { maxCharacters: 600 } },
    }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    results?: Array<{
      title: string;
      url: string;
      text?: string;
      publishedDate?: string;
    }>;
  };
  return (json.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.text ?? "",
    publishedAt: r.publishedDate,
  }));
}

async function serpapiSearch(
  q: string,
  limit: number,
): Promise<SearchResult[]> {
  if (!env.search.serpapi) return mockSearch(q, limit);
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", q);
  url.searchParams.set("num", String(limit));
  url.searchParams.set("api_key", env.search.serpapi);
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const json = (await res.json()) as {
    organic_results?: Array<{
      title: string;
      link: string;
      snippet?: string;
      date?: string;
    }>;
  };
  return (json.organic_results ?? []).slice(0, limit).map((r) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet ?? "",
    publishedAt: r.date,
  }));
}

/**
 * Deterministic offline search so the pipeline works without credentials.
 * Returns plausible-looking sources seeded off the query.
 */
function mockSearch(q: string, limit: number): SearchResult[] {
  const base = [
    {
      title: `Overview: ${q}`,
      url: `https://example.com/overview?q=${encodeURIComponent(q)}`,
      snippet: `A broad overview covering the core concepts, recent developments, and common questions about ${q}.`,
      publishedAt: "2026-03-12",
    },
    {
      title: `Deep dive — ${q}`,
      url: `https://research.example.org/deep-dive/${encodeURIComponent(q)}`,
      snippet: `Primary-source analysis with data, context, and comparisons relevant to ${q}.`,
      publishedAt: "2026-02-28",
    },
    {
      title: `Discussion on ${q}`,
      url: `https://news.example.net/discussion/${encodeURIComponent(q)}`,
      snippet: `Community commentary, expert takes, and counterarguments related to ${q}.`,
      publishedAt: "2026-04-02",
    },
    {
      title: `${q}: what changed this week`,
      url: `https://weekly.example.io/updates?topic=${encodeURIComponent(q)}`,
      snippet: `A running log of notable updates, releases, and shifts in the space around ${q}.`,
      publishedAt: "2026-04-11",
    },
    {
      title: `Background & history of ${q}`,
      url: `https://wiki.example.com/wiki/${encodeURIComponent(q)}`,
      snippet: `Encyclopedic background, timelines, and foundational references for ${q}.`,
    },
  ];
  return base.slice(0, limit);
}
