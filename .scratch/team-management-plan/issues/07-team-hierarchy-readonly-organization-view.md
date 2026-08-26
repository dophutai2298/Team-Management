# 07: Team hierarchy and read-only organization view

**What to build:** Model teams, multi-team membership, primary team, and reportsTo hierarchy, then expose a read-only organization view for users with the right permissions.

**Blocked by:** 05: Role, permission catalog, and authorization matrix; 06: Employee profile and admin employee management.

**Status:** ready-for-agent

- [ ] Admin can manage teams, parent teams, team metadata, and active memberships.
- [ ] Each employee can have multiple active team memberships and exactly one primary team.
- [ ] The reportsTo hierarchy supports recursive subtree lookup.
- [ ] Organization table and read-only organization chart render scoped data.
- [ ] Team scope and subtree scope behave differently according to the spec.
- [ ] Team and manager changes are authorized and audited.
