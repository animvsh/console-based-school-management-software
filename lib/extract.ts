/**
 * Page fetcher + readability extractor. In V1 we use a very small naive
 * HTML-stripper so the whole app stays self-contained. In production swap
 * this for Mozilla Readability / Trafilatura behind the same signature.
 */
export async function fetchAndExtract(
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const res = await fetch(url, {
      signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ScoutBot/0.1; +https://scout.local)",
      },
    });
    if (!res.ok) return "";
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) return "";
    const html = await res.text();
    return stripHtml(html);
  } catch {
    return "";
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

/** Split a long string into overlapping windows for retrieval indexing. */
export function chunk(
  text: string,
  size = 900,
  overlap = 150,
): string[] {
  const out: string[] = [];
  if (!text) return out;
  let i = 0;
  while (i < text.length) {
    out.push(text.slice(i, i + size));
    if (i + size >= text.length) break;
    i += size - overlap;
  }
  return out;
}
