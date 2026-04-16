import { NextResponse } from "next/server";

import { ingestFile } from "@/lib/ingest";
import { listFiles, removeFile } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const files = await listFiles();
  return NextResponse.json({ files });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const saved = await ingestFile({
    name: file.name,
    mime: file.type || "application/octet-stream",
    bytes: buf,
  });
  return NextResponse.json({ file: saved });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  await removeFile(id);
  return NextResponse.json({ ok: true });
}
