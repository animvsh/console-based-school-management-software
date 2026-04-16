import { env } from "./env";

/**
 * Thin wrapper around Composio's connected-app APIs. V1 surfaces just enough
 * to: list available connectors, start an OAuth connect flow, and probe
 * whether a key is configured. Read/search actions per-connector land in
 * sprint 3 and plug into retrieval.ts as an additional evidence source.
 */
export const CONNECTORS = [
  { id: "gmail", label: "Gmail", icon: "mail" },
  { id: "googledrive", label: "Google Drive", icon: "drive" },
  { id: "notion", label: "Notion", icon: "notion" },
  { id: "slack", label: "Slack", icon: "slack" },
  { id: "github", label: "GitHub", icon: "github" },
  { id: "googlecalendar", label: "Google Calendar", icon: "calendar" },
] as const;

export type ConnectorId = (typeof CONNECTORS)[number]["id"];

export function composioConfigured(): boolean {
  return Boolean(env.composio.apiKey);
}

/**
 * Kick off an OAuth connection. Returns the redirect URL the user should
 * hit. Composio handles token storage server-side.
 */
export async function startConnection(
  connectorId: ConnectorId,
  userId: string,
): Promise<{ redirectUrl: string } | { error: string }> {
  if (!composioConfigured()) {
    return { error: "Composio is not configured. Set COMPOSIO_API_KEY." };
  }
  const res = await fetch(
    `${env.composio.baseUrl}/api/v1/connectedAccounts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.composio.apiKey!,
      },
      body: JSON.stringify({
        integrationId: connectorId,
        userId,
      }),
    },
  );
  if (!res.ok) {
    return { error: `Composio error ${res.status}` };
  }
  const json = (await res.json()) as { redirectUrl?: string };
  if (!json.redirectUrl) return { error: "No redirect URL returned." };
  return { redirectUrl: json.redirectUrl };
}
