# 08: Task workspace foundation

**What to build:** Create the shared task workspace used by Admin, Parent, and Employee roles, including task list/detail, personal task CRUD, and assigned task visibility.

**Blocked by:** 05: Role, permission catalog, and authorization matrix; 06: Employee profile and admin employee management.

**Status:** resolved

- [x] Task workspace uses TanStack Query for reads/mutations and TanStack Table for the task list.
- [x] Users see loading, empty, error, and mutation pending states.
- [x] Employees can create, update, and delete their own personal tasks.
- [x] Assigned tasks are visible to permitted users according to authorization scope.
- [x] Task detail view shows core task fields and assignee summary placeholders.
- [x] Task reads and mutations go through Next.js APIs and application authorization.
