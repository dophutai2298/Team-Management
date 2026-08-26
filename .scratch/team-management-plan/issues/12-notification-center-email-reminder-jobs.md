# 12: Notification center, email service, and reminder jobs

**What to build:** Deliver in-app and email notifications for account, task, deadline, overdue, and calendar events using idempotent background jobs.

**Blocked by:** 04: Admin account approval workflow; 09: Scoped task assignment and multi-assignee progress; 11: Calendar events and task deadline calendar.

**Status:** ready-for-agent

- [ ] Notification events and per-user recipients support read/unread state.
- [ ] Users can view and mark notifications as read in a notification center.
- [ ] New task assignment and deadline changes create notifications.
- [ ] Approaching deadline and overdue jobs create notifications idempotently.
- [ ] Email service interface sends supported notification emails without leaking provider details into business logic.
- [ ] Notification reads and actions are scoped to the current actor.
