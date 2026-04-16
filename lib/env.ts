function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function withDefault(name: string, fallback: string): string {
  return optional(name) ?? fallback;
}

export const env = {
  minimax: {
    apiKey: optional("MINIMAX_API_KEY"),
    groupId: optional("MINIMAX_GROUP_ID"),
    model: withDefault("MINIMAX_MODEL", "MiniMax-Text-01"),
    routerModel: optional("MINIMAX_ROUTER_MODEL"),
    baseUrl: withDefault("MINIMAX_BASE_URL", "https://api.minimax.io/v1"),
  },
  search: {
    provider: withDefault("SEARCH_PROVIDER", "mock") as
      | "tavily"
      | "exa"
      | "serpapi"
      | "mock",
    tavily: optional("TAVILY_API_KEY"),
    exa: optional("EXA_API_KEY"),
    serpapi: optional("SERPAPI_API_KEY"),
  },
  embeddings: {
    provider: withDefault("EMBEDDINGS_PROVIDER", "mock") as
      | "minimax"
      | "openai"
      | "mock",
    openaiKey: optional("OPENAI_API_KEY"),
    model: withDefault("EMBEDDINGS_MODEL", "text-embedding-3-small"),
  },
  composio: {
    apiKey: optional("COMPOSIO_API_KEY"),
    baseUrl: withDefault("COMPOSIO_BASE_URL", "https://backend.composio.dev"),
  },
  storage: {
    dataDir: withDefault("SCOUT_DATA_DIR", ".data"),
    uploadDir: withDefault("SCOUT_UPLOAD_DIR", "uploads"),
  },
  quotas: {
    freeDaily: Number(withDefault("SCOUT_FREE_DAILY_QUERIES", "15")),
    plusMonthly: Number(withDefault("SCOUT_PLUS_MONTHLY_QUERIES", "1500")),
    proMonthly: Number(withDefault("SCOUT_PRO_SEARCH_MONTHLY", "50")),
  },
};

export function isLive(): boolean {
  return Boolean(env.minimax.apiKey);
}
