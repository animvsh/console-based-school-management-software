import { nanoid } from "nanoid";

import { embed } from "./embeddings";
import { chunk } from "./extract";
import { addFile } from "./store";
import type { DocChunk, UploadedFile } from "./types";

/**
 * Upload pipeline: extract -> chunk -> embed -> persist.
 * Binary formats like PDF/DOCX are handled by dynamic imports so the base
 * bundle stays small and build doesn't fail when a parser is absent.
 */
export async function ingestFile(params: {
  name: string;
  mime: string;
  bytes: Buffer;
}): Promise<UploadedFile> {
  const text = await extractText(params.name, params.mime, params.bytes);
  const pieces = chunk(text, 900, 150);
  const fileId = `f_${nanoid(10)}`;
  const chunks: DocChunk[] = [];
  for (let i = 0; i < pieces.length; i++) {
    const t = pieces[i];
    const vec = await embed(t);
    chunks.push({
      id: `${fileId}_${i}`,
      fileId,
      fileName: params.name,
      text: t,
      anchor: `chunk ${i + 1}`,
      embedding: vec,
    });
  }
  const file: UploadedFile = {
    id: fileId,
    name: params.name,
    mime: params.mime,
    bytes: params.bytes.byteLength,
    createdAt: Date.now(),
    chunks: chunks.length,
  };
  await addFile(file, chunks);
  return file;
}

async function extractText(
  name: string,
  mime: string,
  buf: Buffer,
): Promise<string> {
  const lower = name.toLowerCase();
  if (
    mime.startsWith("text/") ||
    lower.endsWith(".md") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".csv")
  ) {
    return buf.toString("utf8").slice(0, 200_000);
  }
  if (mime === "application/pdf" || lower.endsWith(".pdf")) {
    try {
      const mod = (await import("pdf-parse")) as
        | { default?: (b: Buffer) => Promise<{ text: string }> }
        | ((b: Buffer) => Promise<{ text: string }>);
      const fn =
        typeof mod === "function" ? mod : (mod.default ?? (() => undefined));
      if (typeof fn === "function") {
        const out = await fn(buf);
        return (out?.text ?? "").slice(0, 200_000);
      }
    } catch {
      // fall through to raw-ish fallback
    }
  }
  // Last-ditch fallback: interpret bytes as UTF-8 and strip non-printables.
  return buf
    .toString("utf8")
    .replace(/[^\x20-\x7e\n\r\t]+/g, " ")
    .slice(0, 200_000);
}
