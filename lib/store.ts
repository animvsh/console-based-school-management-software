import fs from "node:fs/promises";
import path from "node:path";

import { env } from "./env";
import type { DocChunk, Thread, UploadedFile } from "./types";

/**
 * Tiny JSON-file store so Scout runs with zero infra in dev. Mirrors the
 * shape we'd later back with Postgres + pgvector. All reads/writes serialize
 * through a per-file mutex — good enough for single-process dev, obviously
 * not for prod.
 */

type DbShape = {
  threads: Record<string, Thread>;
  files: Record<string, UploadedFile>;
  chunks: DocChunk[];
};

const EMPTY: DbShape = { threads: {}, files: {}, chunks: [] };

let cache: DbShape | null = null;
let writing: Promise<void> = Promise.resolve();

function dbFile(): string {
  return path.join(env.storage.dataDir, "scout.json");
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(env.storage.dataDir, { recursive: true });
  await fs.mkdir(env.storage.uploadDir, { recursive: true });
}

async function load(): Promise<DbShape> {
  if (cache) return cache;
  await ensureDir();
  try {
    const raw = await fs.readFile(dbFile(), "utf8");
    cache = { ...EMPTY, ...(JSON.parse(raw) as Partial<DbShape>) };
  } catch {
    cache = structuredClone(EMPTY);
  }
  return cache!;
}

async function flush(): Promise<void> {
  if (!cache) return;
  const snap = JSON.stringify(cache);
  writing = writing.then(async () => {
    await ensureDir();
    await fs.writeFile(dbFile(), snap, "utf8");
  });
  await writing;
}

export async function listThreads(): Promise<Thread[]> {
  const db = await load();
  return Object.values(db.threads).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getThread(id: string): Promise<Thread | null> {
  const db = await load();
  return db.threads[id] ?? null;
}

export async function upsertThread(thread: Thread): Promise<void> {
  const db = await load();
  db.threads[thread.id] = thread;
  await flush();
}

export async function deleteThread(id: string): Promise<void> {
  const db = await load();
  delete db.threads[id];
  await flush();
}

export async function listFiles(): Promise<UploadedFile[]> {
  const db = await load();
  return Object.values(db.files).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addFile(
  file: UploadedFile,
  chunks: DocChunk[],
): Promise<void> {
  const db = await load();
  db.files[file.id] = file;
  db.chunks.push(...chunks);
  await flush();
}

export async function removeFile(id: string): Promise<void> {
  const db = await load();
  delete db.files[id];
  db.chunks = db.chunks.filter((c) => c.fileId !== id);
  await flush();
}

export async function allChunks(): Promise<DocChunk[]> {
  const db = await load();
  return db.chunks;
}
