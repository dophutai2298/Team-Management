import type { Metadata } from "next";

import { TaskWorkspace } from "@/components/task-workspace";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return <TaskWorkspace />;
}
