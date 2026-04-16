"use client";

import {
  BarChart3,
  Brain,
  FolderSearch,
  Newspaper,
  MessageSquare,
  Sparkles,
} from "lucide-react";

const SUGGESTIONS: Array<{
  icon: typeof Newspaper;
  title: string;
  subtitle: string;
  prompt: string;
}> = [
  {
    icon: Newspaper,
    title: "This week in AI",
    subtitle: "Summarize notable launches and research",
    prompt: "What are the most notable AI launches and research papers this week?",
  },
  {
    icon: FolderSearch,
    title: "Search my library",
    subtitle: "Ask anything about your uploaded docs",
    prompt: "Summarize the key points in my uploaded documents about onboarding.",
  },
  {
    icon: MessageSquare,
    title: "Team signals",
    subtitle: "What did the team discuss recently?",
    prompt: "What has my team said in Slack about the launch this month?",
  },
  {
    icon: BarChart3,
    title: "Compare two ideas",
    subtitle: "Side-by-side analysis with citations",
    prompt: "Compare retrieval-augmented generation vs long-context approaches for enterprise search.",
  },
  {
    icon: Brain,
    title: "Explain like I'm smart",
    subtitle: "Deep background on a new concept",
    prompt: "Explain how MiniMax-M1's lightning attention works and why it matters.",
  },
  {
    icon: Sparkles,
    title: "Pro Search a topic",
    subtitle: "Slower, deeper, more sources",
    prompt: "Do a deep research pass on the state of AI-native answer engines in 2026.",
  },
];

export function SuggestionGrid({ onPick }: { onPick: (p: string) => void }) {
  return (
    <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
      {SUGGESTIONS.map(({ icon: Icon, title, subtitle, prompt }) => (
        <button
          key={title}
          onClick={() => onPick(prompt)}
          className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-3 text-left transition-colors hover:border-accent/40 hover:bg-[var(--bg-elev-2)]"
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elev-2)] text-ink-300 group-hover:text-accent">
            <Icon size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-white">
              {title}
            </span>
            <span className="mt-0.5 block text-[12px] text-ink-400">
              {subtitle}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
