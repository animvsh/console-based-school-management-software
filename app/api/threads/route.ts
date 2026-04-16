import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";

import { listThreads, upsertThread } from "@/lib/store";
import { titleFromQuery } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  const threads = await listThreads();
  return NextResponse.json({
    threads: threads.map((t) => ({
      id: t.id,
      title: t.title,
      updatedAt: t.updatedAt,
      pinned: t.pinned,
      messageCount: t.messages.length,
    })),
  });
}

const CreateSchema = z.object({
  title: z.string().optional(),
  seedQuery: z.string().optional(),
});

export async function POST(req: Request) {
  const body = CreateSchema.parse(await req.json());
  const id = `t_${nanoid(10)}`;
  const now = Date.now();
  const title = body.title ?? (body.seedQuery ? titleFromQuery(body.seedQuery) : "New thread");
  await upsertThread({
    id,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  });
  return NextResponse.json({ id });
}
