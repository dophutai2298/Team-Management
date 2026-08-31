import type { Metadata } from "next";

import { TaskWorkspace } from "@/components/task-workspace";
import { getCurrentActor } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage() {
  const actor = await getCurrentActor();

  return <TaskWorkspace actorCacheKey={actor?.authUserId ?? "anonymous"} />;
}
