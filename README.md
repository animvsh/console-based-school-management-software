# Scout

> A MiniMax-powered, Perplexity-style answer engine — with personal knowledge
> and connected-app search.

Scout takes a question, plans a retrieval pass across the **web**, your
**uploaded files**, and your **connected apps** (Gmail, Drive, Notion, Slack,
GitHub, Calendar), ranks the evidence, and synthesizes a cited answer via
**MiniMax**. It keeps threads so you can follow up, and exposes a clean
source drawer so every claim is inspectable.

This repo is the V1 skeleton from the Scout PRD: Sprint 1 (chat + streaming
web answers with citations) and the core Sprint 2 primitives (upload
ingestion, library retrieval, Composio connector handshake).

## Stack

| Layer         | Choice                                                   |
| ------------- | -------------------------------------------------------- |
| Frontend      | Next.js 14 (App Router) · React 18 · Tailwind            |
| Backend       | Next.js route handlers (Node runtime) · Zod              |
| LLM           | **MiniMax** (`MiniMax-Text-01` by default)               |
| Web search    | Tavily · Exa · SerpAPI (pluggable) · mock (offline)      |
| Embeddings    | OpenAI / MiniMax / deterministic hash (offline)          |
| Storage       | Local JSON file store (swap to Postgres + pgvector)      |
| Connectors    | Composio (OAuth + action APIs)                           |

Everything runs end-to-end without any API keys thanks to offline-safe
fallbacks for the search provider, embeddings, and LLM. Set real keys in
`.env.local` to flip to the live stack.

## Quickstart

```bash
cp .env.example .env.local          # paste MiniMax / search keys when you have them
npm install
npm run dev                         # http://localhost:3000
```

With no keys configured you still get:

- a working chat UI with streaming answers,
- a mock web-search provider that returns plausible results,
- hash-based embeddings so file uploads are still searchable,
- a deterministic "mock" MiniMax response that demonstrates the citation
  pipeline end-to-end.

## Layout

```
app/
  api/
    chat/         # SSE stream: plan -> retrieve -> synthesize -> cite
    threads/      # create / list / patch / delete threads
    upload/       # file ingest (extract -> chunk -> embed -> index)
    connectors/   # Composio connection bootstrap
  page.tsx        # home: search box + suggestions
  thread/[id]/    # thread view with streaming answers + source drawer
components/       # AppShell, SearchBox, AnswerCard, SourceDrawer, …
lib/
  minimax.ts      # live + offline MiniMax client (buffered & streaming)
  search.ts       # Tavily / Exa / SerpAPI / mock web search
  extract.ts      # tiny HTML readability + chunker
  embeddings.ts   # OpenAI / MiniMax / hash fallback + cosine
  retrieval.ts    # hybrid ranker across web + library
  ingest.ts       # upload -> extract -> chunk -> embed -> persist
  pipeline.ts     # end-to-end query pipeline, yields SSE-shaped deltas
  store.ts        # JSON-file store (threads, files, chunks)
  composio.ts     # connector list + OAuth bootstrap
```

## Environment variables

See [`.env.example`](.env.example). The important ones:

- `MINIMAX_API_KEY` — the primary intelligence layer. Without it Scout uses
  the local mock; with it you get live streaming answers.
- `SEARCH_PROVIDER` — `tavily` | `exa` | `serpapi` | `mock`.
- `EMBEDDINGS_PROVIDER` — `openai` | `minimax` | `mock`.
- `COMPOSIO_API_KEY` — unlocks the connector flow.

## Cost posture (why the $5 plan can work)

The pipeline is intentionally retrieval-heavy, not context-heavy:

- top-k chunk selection happens **before** MiniMax is called,
- page text is stripped and capped at ~8k chars,
- web & library evidence is merged, de-duplicated, and capped at 8 items
  (12 in Pro Search),
- a cheaper router model (`MINIMAX_ROUTER_MODEL`) can be set to keep planning
  / rewrites off the primary tier,
- Pro Search is rate-limited separately so a single power user can't burn the
  margin on the whole plan.

## Status vs the PRD

| PRD item                                                   | Status      |
| ---------------------------------------------------------- | ----------- |
| 5.1 core chat / thread history / streaming answers         | ✅ done     |
| 5.2 web answer engine with citations & source cards        | ✅ done     |
| 5.3 file upload + personal retrieval (pdf, txt, md, csv)   | ✅ done     |
| 5.4 Composio connector OAuth bootstrap                     | ✅ handshake only |
| 5.4 connector-backed retrieval (Drive/Gmail/Notion)        | 🟡 stubbed, next sprint |
| 5.5 source drawer with snippet focus                       | ✅ done     |
| 5.6 modes: auto / web / library / pro                      | ✅ done     |
| 5.7 auth + billing + quotas                                | ⏳ deferred |
| deep research / write actions / team workspaces            | ⏳ V2       |

## Roadmap

- **Sprint 3:** connector-backed retrieval (Drive/Gmail/Notion via Composio),
  unified evidence schema + per-source freshness scoring.
- **Sprint 4:** Stripe billing, Postgres + pgvector, quotas/usage accounting,
  public Pro Search.
- **V2:** multi-agent plan-then-act research, write actions with explicit
  confirmation, browser extension, team workspaces.
