# 05: Role, permission catalog, and authorization matrix

**What to build:** Establish the permission foundation: seed role templates, permission catalog, actor loading, authorization evaluator, and tests for the key access scopes.

**Blocked by:** 03: Auth session, registration, and pending access gate.

**Status:** ready-for-agent

- [ ] The permission catalog supports resource-action-scope permissions for MVP resources.
- [ ] Seed roles exist for System Admin, Department Head, Team Leader, and Employee.
- [ ] Actor context loads account status, employee identity, role, permissions, memberships, and manager relationship data.
- [ ] Mutations can call a common authorization evaluator before performing business actions.
- [ ] Authorization matrix tests cover self, direct report, descendant, peer, manager, and other subtree cases.
- [ ] Role names are not hard-coded as permission logic.
