# 09: Scoped task assignment and multi-assignee progress

**What to build:** Make assignment real: Admin and Parent users can assign tasks inside their allowed scope, including multiple assignees and team assignment with per-assignee progress.

**Blocked by:** 07: Team hierarchy and read-only organization view; 08: Task workspace foundation.

**Status:** ready-for-agent

- [ ] Admin can assign tasks to any permitted employee set.
- [ ] Parent users can assign tasks only to descendants in their reportsTo subtree.
- [ ] Team assignment expands into task assignees according to authorized team visibility.
- [ ] Each assignee has independent status, progress, completion, and blocked reason fields.
- [ ] Overall task progress is derived from assignee progress.
- [ ] Assignment, deadline, and assignee changes are authorized and audited.
