# 11: Calendar events and task deadline calendar

**What to build:** Add calendar events and task deadline visibility so users can see personal/team events and task deadlines in a timezone-aware calendar.

**Blocked by:** 09: Scoped task assignment and multi-assignee progress.

**Status:** ready-for-agent

- [ ] Use Mobiscroll React Eventcalendar as the primary calendar UI.
- [ ] Use the Mobiscroll Month / Week Eventcalendar pattern for normal calendar browsing.
- [ ] Support at minimum:
  - Month view
  - Week view
  - Team Schedule / hierarchy view
- [ ] Users can switch between Month, Week, and Team Schedule without leaving the Calendar page.
- [ ] Preserve the selected date and filters when switching views where practical.
- [ ] Users can create and view private calendar events.
- [ ] Permitted users can create and view team calendar events.
- [ ] Calendar events can optionally link to tasks.
- [ ] Task deadlines appear in the calendar for users allowed to see those tasks.
- [ ] Calendar rendering respects UTC storage and user timezone display.
- [ ] Calendar access is filtered by actor permission and event visibility scope.
