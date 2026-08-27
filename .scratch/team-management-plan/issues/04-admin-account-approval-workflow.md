# 04: Admin account approval workflow

**What to build:** Give Admins an account approval workflow that turns pending verified users into active employees with official org data.

**Blocked by:** 03: Auth session, registration, and pending access gate.

**Status:** resolved

- [x] Admin can list pending accounts with loading, empty, and error states.
- [x] Admin can approve a pending account after verifying or editing the employee code.
- [x] Admin can reject a pending account with a reason.
- [x] Approval captures initial team, manager, role, position, and level.
- [x] Approved users become Active and can access protected app features.
- [x] Approval and rejection actions are audited.

## Verification

- Applied InsForge migrations `20260827152529_add-admin-approval-workflow.sql`, `20260827154124_add-admin-approval-bootstrap.sql`, and `20260827154502_sync-admin-flag-from-role.sql`; confirmed the organization schema, approval/bootstrap RPCs, role-based admin flag trigger, and four seed role templates.
- Passed `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test:run` (21 tests), and `npm.cmd run build`.
- Live approval E2E is pending a real pending account. The linked backend currently has zero active admins, active teams, and pending accounts. Bootstrap the first verified request through the project-admin-only `public.bootstrap_initial_admin(...)` RPC; it creates the initial team, activates the account as System Admin, and writes an audit event. Manager is intentionally optional for the first organizational leader.
