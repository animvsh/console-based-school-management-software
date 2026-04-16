import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { ThreadView } from "@/components/ThreadView";
import { getThread, listThreads } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const [thread, threads] = await Promise.all([
    getThread(params.id),
    listThreads(),
  ]);
  if (!thread) notFound();
  return (
    <AppShell threads={threads} activeThreadId={thread.id}>
      <ThreadView thread={thread} />
    </AppShell>
  );
}
