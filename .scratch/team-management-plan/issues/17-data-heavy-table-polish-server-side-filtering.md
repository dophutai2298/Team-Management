# 17: Data-heavy table polish and server-side filtering

**What to build:** Standardize data-heavy screens with consistent TanStack Table behavior, HeroUI presentation, server-side filtering/sorting/pagination, and permission-safe query patterns.

**Blocked by:** 06: Employee profile and admin employee management; 07: Team hierarchy and read-only organization view; 08: Task workspace foundation; 16: Audit log admin experience and coverage pass.

**Status:** ready-for-agent

- [ ] Employees, Tasks, Accounts, Roles & Permissions, and Audit Log screens follow the same table interaction patterns.
- [ ] Tables support useful filtering, sorting, pagination, and loading/empty/error states.
- [ ] Server-side filtering is used where permission filtering or dataset size requires it.
- [ ] Query keys include resource, scope, and filter state consistently.
- [ ] Mutations invalidate or update relevant table queries predictably.
- [ ] Table UI uses HeroUI components while TanStack Table owns table state.
