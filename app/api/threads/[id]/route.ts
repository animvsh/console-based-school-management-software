import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteThread, getThread, upsertThread } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const thread = await getThread(params.id);
  if (!thread) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ thread });
}

const PatchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  pinned: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const thread = await getThread(params.id);
  if (!thread) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const body = PatchSchema.parse(await req.json());
  const next = {
    ...thread,
    ...body,
    updatedAt: Date.now(),
  };
  await upsertThread(next);
  return NextResponse.json({ thread: next });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await deleteThread(params.id);
  return NextResponse.json({ ok: true });
}
