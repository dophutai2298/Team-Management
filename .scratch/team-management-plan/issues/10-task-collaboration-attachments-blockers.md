# 10: Task collaboration, attachments, and blockers

**What to build:** Add the basic collaboration layer for tasks: comments, attachments, authorized download, and simple blocker reporting.

**Blocked by:** 09: Scoped task assignment and multi-assignee progress.

**Status:** resolved

- [x] Permitted users can comment on tasks they can access.
- [x] Assignees can report blockers with a blocked reason and blocked status.
- [x] Users can upload allowed task attachment types up to the configured file limit.
- [x] Attachment metadata is stored so files can be downloaded or removed safely.
- [x] Attachment download enforces task access permission.
- [x] Comments, blocker changes, and important attachment actions are represented in task activity or audit as appropriate.
- [x] Task details moved from the large modal to the dedicated `/tasks/[taskId]` page.
- [x] My progress update modal loads and displays the current assignee status/progress before editing.
- [x] Attachments are limited to 2 MB per upload and 5 active files per task across UI, API, and database constraints.
- [x] Auth-scoped task queries are isolated per signed-in actor and fetched with no-store semantics to prevent admin task data leaking after logout/login.
- [x] InsForge private storage bucket `task-attachments` is provisioned for authorized task attachment uploads/downloads.
