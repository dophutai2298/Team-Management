# 07: Team hierarchy and read-only organization view

**What to build:** Model teams, multi-team membership, primary team, and reportsTo hierarchy, then expose a read-only organization view for users with the right permissions.

**Blocked by:** 05: Role, permission catalog, and authorization matrix; 06: Employee profile and admin employee management.

**Status:** ready-for-agent

- [x] Admin can manage teams, parent teams, team metadata, and active memberships.
- [x] Each employee can have multiple active team memberships and exactly one primary team.
- [x] The reportsTo hierarchy supports recursive subtree lookup.
- [x] Organization table and read-only organization chart render scoped data.
- [x] Team scope and subtree scope behave differently according to the spec.
- [x] Team and manager changes are authorized and audited.

Other fix:

- [x] UI: The SVG and text placeholder are both positioned on the left in the ControlledSelectField. Please move the SVG to the right.
- [x] UI: The layout of the "Primary role" and "Manager" fields in the "Approve account" modal becomes misaligned when the "Approve" button is clicked without filling in the required fields; the misalignment occurs when the error messages are displayed.
- [x] UI: Required fields should have a red asterisk (*) next to the label for easy identification.

Implementation notes:

- Added team hierarchy metadata migration with `parent_team_id`, membership metadata, recursive team subtree RPCs, and atomic audited `admin_upsert_team`.
- Added `/api/organization`, `/organization`, read-only organization chart, and TanStack organization table.
- Extended admin employee management to submit active `teamIds` while preserving exactly one primary `teamId`.
- Added `/api/admin/teams` and `/api/admin/teams/[teamId]` for authorized audited team create/update.
- Added unit coverage for organization scope and team management input.
