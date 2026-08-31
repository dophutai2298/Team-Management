import type { Metadata } from "next";

import { TaskDetailPage } from "@/components/tasks/task-detail-page";
import { getCurrentActor } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Task details" };

export default async function TaskDetailRoutePage({ params }: { params: Promise<{ taskId: string }> }) {
  const actor = await getCurrentActor();
  const { taskId } = await params;

  return <TaskDetailPage actorCacheKey={actor?.authUserId ?? "anonymous"} taskId={taskId} />;
}
