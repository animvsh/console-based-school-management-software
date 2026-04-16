import { nanoid } from "nanoid";
import { z } from "zod";

import { runQuery } from "@/lib/pipeline";
import { getThread, upsertThread } from "@/lib/store";
import type { Citation, Evidence, Message, SearchMode } from "@/lib/types";
import { titleFromQuery } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  threadId: z.string(),
  query: z.string().min(1).max(4000),
  mode: z.enum(["auto", "web", "library", "pro"]).default("auto"),
});

/**
 * Server-sent events stream:
 *   event: trace    — pipeline step update
 *   event: evidence — full evidence array (fires once, before tokens)
 *   event: token    — incremental delta
 *   event: done     — final citations + persisted assistant message id
 *   event: error    — fatal error; stream closes
 */
export async function POST(req: Request) {
  const body = BodySchema.parse(await req.json());
  const thread = await getThread(body.threadId);
  if (!thread) {
    return new Response(JSON.stringify({ error: "thread_not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Append the user turn immediately so reloads mid-stream still show it.
  const userMsg: Message = {
    id: `m_${nanoid(10)}`,
    role: "user",
    content: body.query,
    createdAt: Date.now(),
    mode: body.mode as SearchMode,
  };
  thread.messages.push(userMsg);
  thread.updatedAt = Date.now();
  if (thread.messages.length === 1 || thread.title === "New thread") {
    thread.title = titleFromQuery(body.query);
  }
  await upsertThread(thread);

  const proSearch = body.mode === "pro";

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
          ),
        );
      };

      const assistantId = `m_${nanoid(10)}`;
      send("start", { assistantId });

      let evidence: Evidence[] = [];
      let fullText = "";
      let citations: Citation[] = [];

      try {
        for await (const delta of runQuery({
          query: body.query,
          history: thread.messages,
          mode: body.mode as SearchMode,
          proSearch,
        })) {
          switch (delta.type) {
            case "trace":
              send("trace", delta.step);
              break;
            case "evidence":
              evidence = delta.evidence;
              send("evidence", evidence);
              break;
            case "token":
              fullText += delta.text;
              send("token", { text: delta.text });
              break;
            case "done":
              citations = delta.citations;
              break;
          }
        }

        const assistantMsg: Message = {
          id: assistantId,
          role: "assistant",
          content: fullText,
          evidence,
          citations,
          mode: body.mode as SearchMode,
          createdAt: Date.now(),
        };
        thread.messages.push(assistantMsg);
        thread.updatedAt = Date.now();
        await upsertThread(thread);

        send("done", { id: assistantId, citations });
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "stream_failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
