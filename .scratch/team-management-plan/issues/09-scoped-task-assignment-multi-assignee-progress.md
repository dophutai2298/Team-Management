# 09: Scoped task assignment and multi-assignee progress

**What to build:** Make assignment real: Admin and Parent users can assign tasks inside their allowed scope, including multiple assignees and team assignment with per-assignee progress.

**Blocked by:** 07: Team hierarchy and read-only organization view; 08: Task workspace foundation.

**Status:** resolved

- [x] Admin can assign tasks to any permitted employee set.
- [x] Parent users can assign tasks only to descendants in their reportsTo subtree.
- [x] Team assignment expands into task assignees according to authorized team visibility.
- [x] Each assignee has independent status, progress, completion, and blocked reason fields.
- [x] Overall task progress is derived from assignee progress.
- [x] Assignment, deadline, and assignee changes are authorized and audited.
