export type SearchMode = "auto" | "web" | "library" | "pro";

export type SourceType =
  | "web"
  | "upload"
  | "drive"
  | "gmail"
  | "slack"
  | "notion"
  | "github"
  | "calendar";

export interface Evidence {
  id: string;
  sourceType: SourceType;
  title: string;
  url?: string;
  snippet: string;
  // 0..1 relevance score from the ranker.
  score: number;
  // Optional per-source metadata: page, chunk index, sender, channel, etc.
  meta?: Record<string, string | number | boolean>;
}

export interface Citation {
  // Index into message.evidence — the inline [n] marker in the answer text.
  index: number;
  evidenceId: string;
}

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  // Only populated on assistant messages.
  evidence?: Evidence[];
  citations?: Citation[];
  mode?: SearchMode;
  createdAt: number;
  // True while the model is still streaming into this message.
  streaming?: boolean;
  // Optional short step trace surfaced in the UI (retrieval, synthesis, etc.).
  trace?: StepTrace[];
}

export interface StepTrace {
  label: string;
  detail?: string;
  at: number;
}

export interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  messages: Message[];
}

export interface UploadedFile {
  id: string;
  name: string;
  mime: string;
  bytes: number;
  createdAt: number;
  chunks: number;
}

export interface DocChunk {
  id: string;
  fileId: string;
  fileName: string;
  text: string;
  // Optional page/section hint used in the citation label.
  anchor?: string;
  embedding?: number[];
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedAt?: string;
}

export interface RetrievalPlan {
  queries: string[];
  scope: SearchMode;
  notes?: string;
}
