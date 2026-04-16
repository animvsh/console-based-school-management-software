import { NextResponse } from "next/server";
import { z } from "zod";

import {
  CONNECTORS,
  composioConfigured,
  startConnection,
  type ConnectorId,
} from "@/lib/composio";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: composioConfigured(),
    connectors: CONNECTORS,
  });
}

const ConnectSchema = z.object({
  connectorId: z.enum([
    "gmail",
    "googledrive",
    "notion",
    "slack",
    "github",
    "googlecalendar",
  ]),
  userId: z.string().default("demo-user"),
});

export async function POST(req: Request) {
  const body = ConnectSchema.parse(await req.json());
  const result = await startConnection(
    body.connectorId as ConnectorId,
    body.userId,
  );
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
