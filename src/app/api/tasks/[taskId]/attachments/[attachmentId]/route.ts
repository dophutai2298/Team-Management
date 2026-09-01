import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { AuthorizationError } from "@/lib/authorization/authorization";
import { getCurrentActor, type CurrentActor } from "@/lib/auth/session";
import { downloadTaskAttachment, removeTaskAttachment } from "@/lib/task/repository";
import { taskRouteFailure } from "@/lib/task/http";
import { canAccessTaskWorkspace, isTaskId, type TaskDetail } from "@/lib/task/task";

type RouteContext = { params: Promise<{ taskId: string; attachmentId: string }> };

export const dynamic = "force-dynamic";

async function requireTaskActor(): Promise<CurrentActor & { employeeId: string }> {
  const actor = await getCurrentActor();

  if (!actor) throw new AuthorizationError("UNAUTHENTICATED", 401);
  if (!actor.employeeId) throw new AuthorizationError("FORBIDDEN", 403);

  return actor as CurrentActor & { employeeId: string };
}

function encodeDownloadName(fileName: string): string {
  return encodeURIComponent(fileName)
    .replace(/[!'()]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, "%2A");
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { attachmentId, taskId } = await context.params;

  if (!isTaskId(taskId) || !isTaskId(attachmentId)) {
    return NextResponse.json(apiFailure("INVALID_TASK_ID", "Invalid task or attachment identifier."), { status: 400 });
  }

  try {
    const actor = await requireTaskActor();
    if (!canAccessTaskWorkspace(actor)) throw new AuthorizationError("FORBIDDEN", 403);

    const result = await downloadTaskAttachment(actor, taskId, attachmentId);
    if (!result) {
      return NextResponse.json(apiFailure("TASK_ATTACHMENT_NOT_FOUND", "The attachment could not be found."), {
        status: 404,
      });
    }

    const { attachment, blob } = result;
    return new Response(blob, {
      headers: {
        "Content-Disposition": `attachment; filename="${attachment.file_name.replace(/"/g, "")}"; filename*=UTF-8''${encodeDownloadName(attachment.file_name)}`,
        "Content-Length": String(attachment.file_size_bytes),
        "Content-Type": attachment.content_type || "application/octet-stream",
      },
    });
  } catch (error) {
    return taskRouteFailure(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<{ task: TaskDetail }>>> {
  const { attachmentId, taskId } = await context.params;

  if (!isTaskId(taskId) || !isTaskId(attachmentId)) {
    return NextResponse.json(apiFailure("INVALID_TASK_ID", "Invalid task or attachment identifier."), { status: 400 });
  }

  try {
    const actor = await requireTaskActor();
    if (!canAccessTaskWorkspace(actor)) throw new AuthorizationError("FORBIDDEN", 403);

    const task = await removeTaskAttachment(actor, taskId, attachmentId, crypto.randomUUID());
    return task
      ? NextResponse.json(apiSuccess({ task }))
      : NextResponse.json(apiFailure("TASK_ATTACHMENT_NOT_FOUND", "The attachment could not be found."), { status: 404 });
  } catch (error) {
    return taskRouteFailure(error);
  }
}
