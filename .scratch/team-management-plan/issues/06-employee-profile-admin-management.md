# 06: Employee profile and admin employee management

**What to build:** Allow employees to maintain personal profile fields while Admins manage official organization fields and employee lifecycle state.

**Blocked by:** 04: Admin account approval workflow; 05: Role, permission catalog, and authorization matrix.

**Status:** done

- [x] Employees can edit allowed profile fields such as full name, birthday, phone, address, hometown, avatar, timezone, and locale.
- [x] Employees cannot edit official organization fields such as role, team, manager, position, level, or official employee code.
- [x] Admin can view, search, and update employees through a data-heavy table experience.
- [x] Admin changes to role, position, level, manager, team, or status create history records.
- [x] Disabled or Terminated employees are preserved instead of hard-deleted.
- [x] Sensitive employee management actions are authorized and audited.

## Implementation Notes

- Added InsForge migration `20260829113001_add-employee-profile-management.sql` with personal profile columns, `employee_management_history`, and project-admin RPCs for self profile updates and admin employee updates.
- Added `/api/profile`, `/api/admin/employees`, and `/api/admin/employees/[employeeId]` route handlers with shared validation and authorization guards.
- Added `/profile` for employee self-service profile editing and `/employees` for Admin employee directory management.
- Added TanStack Table search, status filtering, sorting, pagination, and HeroUI modal/form controls for employee management.
- Verified with lint, typecheck, Vitest, Next production build, Playwright app-shell tests, and live InsForge schema/RPC checks.
