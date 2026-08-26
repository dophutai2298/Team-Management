# 16: Audit log admin experience and coverage pass

**What to build:** Add the Admin audit log experience and ensure sensitive mutations across account, employee, org, task, and notification workflows are recorded consistently.

**Blocked by:** 04: Admin account approval workflow; 06: Employee profile and admin employee management; 09: Scoped task assignment and multi-assignee progress; 12: Notification center, email service, and reminder jobs.

**Status:** ready-for-agent

- [ ] Admin can view audit records in a filterable/searchable table.
- [ ] Audit entries show actor type, actor, action, resource, timestamp, and before/after details where appropriate.
- [ ] System job actions can be represented with system actor metadata.
- [ ] Sensitive account, role, permission, team, manager, and task mutations create audit records.
- [ ] Audit log access is restricted to authorized Admin users.
- [ ] Audit records do not expose passwords, OTPs, tokens, or secrets.
