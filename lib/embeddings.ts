import { env } from "./env";

/**
 * Embedding provider abstraction. Production uses OpenAI / MiniMax; the
 * default mock returns a stable hash-based vector so library retrieval still
 * works offline (it degenerates to lexical similarity but the shape matches).
 */
export async function embed(text: string): Promise<number[]> {
  switch (env.embeddings.provider) {
    case "openai":
      return openaiEmbed(text);
    case "minimax":
      return minimaxEmbed(text);
    default:
      return hashEmbed(text);
  }
}

async function openaiEmbed(text: string): Promise<number[]> {
  if (!env.embeddings.openaiKey) return hashEmbed(text);
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.embeddings.openaiKey}`,
    },
    body: JSON.stringify({ input: text, model: env.embeddings.model }),
  });
  if (!res.ok) return hashEmbed(text);
  const json = (await res.json()) as {
    data?: Array<{ embedding: number[] }>;
  };
  return json.data?.[0]?.embedding ?? hashEmbed(text);
}

async function minimaxEmbed(text: string): Promise<number[]> {
  if (!env.minimax.apiKey) return hashEmbed(text);
  const res = await fetch(`${env.minimax.baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.minimax.apiKey}`,
    },
    body: JSON.stringify({ texts: [text], type: "db" }),
  });
  if (!res.ok) return hashEmbed(text);
  const json = (await res.json()) as { vectors?: number[][] };
  return json.vectors?.[0] ?? hashEmbed(text);
}

/**
 * Deterministic 128-d hash vector. Tokens are mapped into buckets with a tiny
 * FNV-1a so semantically-nothing-but-lexically-similar strings share weight.
 */
function hashEmbed(text: string): number[] {
  const dim = 128;
  const v = new Array<number>(dim).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  for (const tok of tokens) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    v[h % dim] += 1;
  }
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  return v.map((x) => x / norm);
}

export function cosine(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}
