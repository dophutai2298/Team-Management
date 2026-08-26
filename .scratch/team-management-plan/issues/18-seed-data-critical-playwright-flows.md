# 18: Seed data and critical Playwright flows

**What to build:** Add demo seed data and critical end-to-end tests that prove the MVP works across account approval, scoped authorization, task assignment, notification, productivity, and dashboard flows.

**Blocked by:** 15: Role-aware dashboards with Chart.js; 16: Audit log admin experience and coverage pass; 17: Data-heavy table polish and server-side filtering.

**Status:** ready-for-agent

- [ ] Seed data creates Admin, Department Head, Team Leader, three Employees, two teams, and representative tasks.
- [ ] Seed data includes multi-assignee task, personal task, calendar event, notifications, and focus sessions.
- [ ] Seed/demo data is prevented from running in production.
- [ ] Playwright covers account approval and active access.
- [ ] Playwright covers Parent subtree access versus peer/manager/other subtree denial.
- [ ] Playwright covers task assignment, notification, todo/focus, and dashboard access smoke flows.
