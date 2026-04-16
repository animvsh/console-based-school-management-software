"use client";

import { useState } from "react";

import { ThreadSidebar } from "./ThreadSidebar";
import type { Thread } from "@/lib/types";

interface Props {
  threads: Thread[];
  activeThreadId?: string;
  children: React.ReactNode;
}

export function AppShell({ threads, activeThreadId, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ThreadSidebar
        threads={threads}
        activeThreadId={activeThreadId}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((s) => !s)}
      />
      <main
        className={`relative flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ${
          sidebarOpen ? "" : "pl-0"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
