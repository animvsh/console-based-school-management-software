import { AppShell } from "@/components/AppShell";
import { HomeLanding } from "@/components/HomeLanding";
import { listThreads } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const threads = await listThreads();
  return (
    <AppShell threads={threads}>
      <HomeLanding />
    </AppShell>
  );
}
