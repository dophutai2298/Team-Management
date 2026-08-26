# 08: Task workspace foundation

**What to build:** Create the shared task workspace used by Admin, Parent, and Employee roles, including task list/detail, personal task CRUD, and assigned task visibility.

**Blocked by:** 05: Role, permission catalog, and authorization matrix; 06: Employee profile and admin employee management.

**Status:** ready-for-agent

- [ ] Task workspace uses TanStack Query for reads/mutations and TanStack Table for the task list.
- [ ] Users see loading, empty, error, and mutation pending states.
- [ ] Employees can create, update, and delete their own personal tasks.
- [ ] Assigned tasks are visible to permitted users according to authorization scope.
- [ ] Task detail view shows core task fields and assignee summary placeholders.
- [ ] Task reads and mutations go through Next.js APIs and application authorization.
