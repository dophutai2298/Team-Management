# 05: Role, permission catalog, and authorization matrix

**What to build:** Establish the permission foundation: seed role templates, permission catalog, actor loading, authorization evaluator, and tests for the key access scopes.

**Blocked by:** 03: Auth session, registration, and pending access gate.

**Status:** resolved

- [x] The permission catalog supports resource-action-scope permissions for MVP resources.
- [x] Seed roles exist for System Admin, Department Head, Team Leader, and Employee.
- [x] Actor context loads account status, employee identity, role, permissions, memberships, and manager relationship data.
- [x] Mutations can call a common authorization evaluator before performing business actions.
- [x] Authorization matrix tests cover self, direct report, descendant, peer, manager, and other subtree cases.
- [x] Role names are not hard-coded as permission logic.

## Comments

- Added the 13-resource permission catalog, role-permission seed bundles, capability-derived Admin compatibility, and recursive descendant lookup in migration `20260829031944_add-role-permission-authorization.sql`.
- Added shared actor loading and authorization guards. Existing account approval/rejection mutations now require explicit account capabilities.
- Validated on an InsForge schema-only branch before merging to the parent project: 119 permissions, four seeded role bundles, no merge conflicts, and one active account approver preserved.
- Verification passed: lint, typecheck, 35 Vitest tests, production build, and 4 Playwright tests.
