# Team Management System - MVP Project Plan

## 1. Mục tiêu

Xây dựng web application quản lý nội bộ cho công ty, tập trung vào nền tảng:

- Authentication và account lifecycle.
- Organization hierarchy.
- Scoped permission.
- Employee/team/role management.
- Task management với subtree authorization.
- Calendar deadline và notification cơ bản.
- Personal Todo và Pomodoro.
- Audit log cho thao tác nhạy cảm.

MVP ưu tiên làm chắc nền tảng `Auth + Org + Permission + Task` hơn là mở rộng nhiều feature bề mặt. Rủi ro chính của hệ thống nằm ở authorization theo `reportsTo` subtree, multi-team membership, task ownership, audit, và khả năng mở rộng sang RAG/AI sau này.

## 2. Người dùng mục tiêu

MVP được thiết kế như internal SaaS cho công ty khoảng 30-100 nhân viên.

Role người dùng chính:

- `System Admin`: quản trị toàn hệ thống.
- `Department Head`: quản lý subtree lớn.
- `Team Leader`: quản lý subtree/team nhỏ hơn.
- `Employee`: nhân viên bình thường.

Logic quyền không được hard-code theo tên role. Các role trên chỉ là seed templates cho permission bundles ban đầu.

## 3. Tech Stack

### Web Application / BFF

- Next.js.
- TypeScript.
- App Router.
- Server Components.
- Route Handlers.
- Server Actions.
- TanStack Query.
- TanStack Table.
- Chart.js + React wrapper.
- HeroUI.

Next.js BFF là application backend chính của MVP. UI/client không gọi database trực tiếp. Tất cả nghiệp vụ đi qua API/access layer trong Next.js, sau đó tới service/repository layer và permission evaluator.

Guideline:

- App UI ưu tiên Client Components cho các màn hình dashboard/workspace nhiều tương tác để hiển thị loading, empty, error, optimistic/pending states rõ ràng.
- Server Components vẫn dùng cho layout, shell, static content, auth/session bootstrap, và các phần không cần interactivity.
- Server Actions dùng cho form mutations nội bộ khi phù hợp.
- Route Handlers dùng cho API cần gọi từ TanStack Query, webhook, background job, external service, hoặc non-mutation parallel requests.
- Server Components có thể gọi read service cho dữ liệu ít tương tác hoặc cần SSR.
- Không để component tự build query nghiệp vụ phức tạp.
- TanStack Query là chuẩn cho client-side server state: `useQuery` cho query, `useMutation` cho mutation, invalidate query keys sau mutation thành công.
- TanStack Table là chuẩn cho tables/data grids: sorting, filtering, pagination, column state. Visual components dùng HeroUI.
- Chart.js dùng cho dashboard charts. Chart components nên dynamic import khi nặng hoặc chỉ cần ở dashboard routes.
- HeroUI là component system chính cho form controls, buttons, modals, tabs, menus, tables shell, cards, toasts, và accessible interaction patterns.

### Backend Infrastructure

- InsForge.
- PostgreSQL.
- Authentication.
- Storage.
- Realtime available nhưng chưa dùng làm notification realtime trong MVP.
- Messaging / Cron.
- pgvector chuẩn bị cho Phase 2 AI/RAG.

InsForge cung cấp infra primitives. Business rules và authorization nằm trong Next.js BFF/application layer.

InsForge SDK/connection guideline:

- Tạo shared InsForge client module dùng chung thay vì tạo connection/client mới trong từng query.
- Tách rõ browser client, server user-scoped client, và server-only admin client.
- Admin/service API key chỉ dùng trong server-only code, không expose ra client bundle.
- Repository/service layer nhận client từ shared factory/context, không tự initialize lặp lại.
- Auth/session helpers, storage, email, realtime, cron/messaging integrations phải dùng cùng convention này.
- Khi có prompt setup InsForge riêng, cập nhật section này theo setup chính thức của project.

### AI Service

- Python.
- FastAPI.
- RAG ingestion.
- Retrieval.
- Embedding.
- Reranking.
- LLM orchestration.

AI Service là Phase 2. Frontend không gọi FastAPI trực tiếp. Next.js BFF luôn là gatekeeper: authorize user, tạo scoped context, rồi gọi FastAPI.

## 4. MVP Scope

### In Scope

- Register bằng company email.
- Email OTP verification.
- Pending approval flow.
- Admin approve/reject account.
- Login, forgot password, change password.
- Employee profile.
- Team, position, level, role, manager.
- Organization chart read-only.
- Organization table/forms cho Admin.
- Role/permission seed catalog.
- Assign role cho employee.
- Permission evaluator ở application layer.
- Authorization matrix tests.
- Task CRUD theo permission.
- Multi-assignee task schema.
- Task comments cơ bản.
- Task attachments cơ bản.
- Calendar events độc lập, optional linked task.
- Task deadline calendar.
- In-app notification table + polling nhẹ.
- Email notification qua background jobs.
- Personal Todo.
- Pomodoro focus sessions.
- Music Library cơ bản.
- Basic dashboard cho Admin, Parent, Employee.
- Basic audit log.
- Email templates subject + plain/simple HTML body.
- VI/EN UI.
- Seed/demo data cho dev/test.

### Out of Scope MVP

- KPI workflow.
- RAG chatbot.
- AI tool calling.
- Full CSV/XLSX/PDF exports.
- Realtime notification UX.
- PWA/offline.
- SSO.
- 2FA.
- Org chart drag/drop editing.
- Company-wide tasks.
- Rich email editor.
- Advanced task dependency graph.
- Global search.
- Advanced analytics.
- Leave / availability management.
- Slack/Teams integration.
- Google/Microsoft Calendar integration.

## 5. Success Criteria

MVP được coi là thành công khi:

- Admin có thể approve account và cấu hình organization data.
- Admin có thể quản lý employees, teams, roles, permissions, email templates, audit log, music library.
- Parent Role chỉ quản lý được employees/tasks/calendar trong subtree của mình.
- Employee quản lý được profile cá nhân, assigned tasks, personal tasks, todo, focus sessions.
- Employee không CRUD task của người khác ngoài quyền được cấp.
- Tất cả mutations nhạy cảm đều đi qua authorization và audit.
- Notification deadline hoạt động qua in-app notification và email.
- UI hỗ trợ Tiếng Việt và Tiếng Anh.
- Authorization matrix tests cover Admin, Parent, Employee với cases self, direct report, descendant, peer, manager, other subtree.

## 6. Architecture Principles

- Backend/API phải validate permission. Không implement authorization chỉ ở frontend.
- Authorization chính nằm trong Next.js application layer.
- Mọi API/Server Action gọi `getCurrentActor()`.
- Mọi mutation nghiệp vụ gọi `authorize(actor, action, resource, target)`.
- Service layer chứa business rules.
- Repository layer chứa database access.
- UI không truy cập DB trực tiếp.
- FastAPI AI service không được bypass authorization.
- Audit log ghi lại thao tác nhạy cảm.
- Timestamp lưu UTC, display theo user timezone.
- Data model chuẩn bị mở rộng nhưng không enterprise hóa MVP.

## 7. Authentication & Account Lifecycle

Flow:

```text
Register
-> Email OTP Verification
-> Pending Approval
-> Admin Approval
-> Active
```

Account states:

```text
Pending Verification
Pending Approval
Active
Disabled
Terminated
```

Decisions:

- InsForge Auth là identity/session source of truth.
- Domain profile nằm trong `employees`, linked bằng `authUserId`.
- User verified được login nhưng bị chặn app access nếu chưa `Active`.
- User tự nhập `employeeCode` khi register.
- Admin verify/chỉnh `employeeCode` trong bước approval.
- Sau approval, `employeeCode` trở thành official unique employee code.
- Tạo employee draft sau email verification với status `Pending Approval`.
- Admin approval hoàn thiện org fields: team, manager, role, position, level.
- Company email registration dùng `allowed_email_domains`.
- Nếu chưa config allowed domains, public registration bị chặn.

## 8. Organization Model

Organization dựa trên:

```text
Team hierarchy
+
Employee reportsTo hierarchy
```

Authorization tree chính của MVP là `reportsToEmployeeId` global.

Decisions:

- MVP dùng adjacency list + recursive CTE trong PostgreSQL để query subtree.
- `subtree` bao gồm mọi recursive descendants, không chỉ direct reports.
- Multi-team membership có từ MVP.
- Mỗi employee có nhiều active team memberships.
- Mỗi employee bắt buộc có đúng 1 primary team.
- Team-based visibility là union qua tất cả active memberships.
- Global `reportsToEmployeeId` không bắt buộc cùng team.
- `team_membership.managerId`, nếu có, nên là member/manager của team đó.
- Organization chart MVP read-only.
- Chỉnh org data qua Admin table/forms, không drag/drop.

## 9. Role, Position, Level, Permission

Tách rõ:

- `Role`: permission bundle.
- `Position`: HR/title.
- `Level`: seniority.

MVP role assignment:

- 1 primary role/user.
- Role-permission vẫn là many-to-many.
- Multiple roles/user để Phase 2 nếu cần.

Seed role templates:

- `System Admin`.
- `Department Head`.
- `Team Leader`.
- `Employee`.

Permission format:

```text
resource:action:scope
```

Scopes:

```text
self
team
subtree
all
```

Scope semantics:

- `self`: chính actor.
- `team`: employees cùng team membership.
- `subtree`: descendants theo `reportsToEmployeeId`.
- `all`: toàn organization/company.

MVP permission catalog resources:

```text
account
employee
team
role
permission
task
calendar
notification
todo
pomodoro
music
audit
dashboard
```

Admin có thể assign role cho employee. MVP chưa cần permission builder phức tạp. Có thể có màn hình read-only để xem role permissions.

## 10. Authorization Design

Permission evaluator nằm ở Next.js BFF/application layer.

Core API:

```text
getCurrentActor()
authorize(actor, action, resource, target)
```

`getCurrentActor()`:

```text
validate session/JWT
-> load employee/account
-> check accountStatus = Active
-> load role, permissions, team memberships, reportsTo
-> return actor context
```

Authorization tests bắt buộc từ đầu.

Matrix cases:

- Admin -> all.
- Parent -> direct report.
- Parent -> descendant.
- Parent -> peer.
- Parent -> manager.
- Parent -> other subtree.
- Employee -> self.
- Employee -> assigned task.
- Employee -> other person's task.

PostgreSQL RLS/constraints có thể thêm sau như defense-in-depth, nhưng không phải starting point của MVP.

## 11. Employee Management

Employee fields:

- `authUserId`.
- `organizationId/companyId`.
- `employeeCode`.
- `fullName`.
- `birthday`.
- `phone`.
- `address`.
- `hometown`.
- `avatar`.
- `primaryTeamId`.
- `positionId`.
- `levelId`.
- `roleId`.
- `reportsToEmployeeId`.
- `timezone`.
- `locale`.
- `accountStatus`.

Employee tự chỉnh:

- `fullName`.
- `birthday`.
- `phone`.
- `address`.
- `hometown`.
- `avatar`.
- `timezone`.
- `locale`.

Employee không tự chỉnh:

- official `employeeCode`.
- team.
- position.
- level.
- role.
- manager.

Không hard-delete employee khi đã phát sinh business data. Dùng `Disabled` hoặc `Terminated`.

History model:

- Team History.
- Role History.
- Position History.
- Manager History.

History fields:

- `effectiveFrom`.
- `effectiveTo`.
- `changedBy`.
- `reason`.

Current state vẫn lưu trên bảng chính để query nhanh. History ghi append-only khi thay đổi.

## 12. Task Management

Task khác với Todo.

Task assignment MVP hỗ trợ:

- Individual.
- Multiple employees.
- Team.

Company-wide task để Phase 2.

Task fields chính:

- `title`.
- `description`.
- `creatorId`.
- `assignerId`.
- `teamId`.
- `priority`.
- `status`.
- `progress`.
- `deadline`.
- `tags`.
- `attachments`.
- `createdAt`.
- `updatedAt`.
- `taskType`.

Task status enum:

```text
todo
in_progress
blocked
in_review
done
cancelled
```

Task type:

```text
personal
assigned
```

Personal Task nằm chung bảng `tasks` với `taskType = personal | assigned`.

Todo vẫn là bảng riêng cho checklist cá nhân hàng ngày.

### Multi-Assignee

Schema:

```text
Task
  -> TaskAssignee[]
```

Mỗi `TaskAssignee` có:

- `assigneeId`.
- `status`.
- `progress`.
- `completion`.
- `blockedReason`.

Overall progress:

- MVP tính tự động từ trung bình `TaskAssignee.progress`.
- Mỗi assignee có weight bằng nhau.
- Later có thể thêm weight.

Overall status:

- all done -> `done`.
- any blocked -> `blocked`.
- otherwise -> `in_progress`.

### Task Permissions

Admin:

- CRUD mọi task.

Parent Role:

- CRUD task của employees trong subtree.
- Không thao tác task của peer, manager, other subtree.

Employee:

- CRUD own personal task.
- Với assigned task: update status, progress, comment, attach files, report blocker.
- Không tự đổi assigner, assignee, deadline, trừ khi có permission.

`assignTask(actor, assignees)` validate từng assignee:

- Admin -> all.
- Parent -> descendants.
- Employee -> only self cho personal task.

Multi-assignee visibility:

- Assignee thấy task chung, list assignees, overall progress.
- Assignee không thấy thông tin nhạy cảm ngoài task context.
- Parent/Admin thấy chi tiết assignee trong scope.

### Collaboration MVP

MVP có:

- Comments cơ bản.
- Attachments cơ bản.
- Blocker đơn giản qua `blockedReason` và status `blocked`.

Dependency graph/blocking tasks để Phase 2.

## 13. Calendar

Calendar event là entity độc lập, có thể optional link tới task.

MVP views:

- Personal.
- Team.
- Admin.

Calendar event visibility:

```text
private
team
subtree
company
```

MVP chỉ cho tạo:

- `private`.
- `team`.

`subtree` và `company` reserved cho Admin/Phase 2.

Calendar hiển thị:

- Task deadline.
- Calendar event.
- Reminder/deadline notifications.

## 14. Notification

Channels:

- In-App.
- Email.

Triggers MVP:

- New task assigned.
- Deadline changed.
- Approaching deadline.
- Overdue task.
- Calendar event.
- Account approval/rejection.

Data model:

- `notification_events`.
- `notification_recipients`.

Lý do:

- Support multi-recipient events.
- Read/unread per user.
- Debug/audit tốt hơn.

MVP dùng notification table + polling nhẹ. Realtime để Phase 2 nếu cần.

Reminder defaults:

- 7 days before.
- 1 day before.
- 1 hour before.

Deadline/reminder jobs chạy qua InsForge Messaging/Cron hoặc scheduled worker tương đương. Jobs phải idempotent: ghi `notifications` trước rồi email sau.

## 15. Todo

Todo độc lập với Task.

MVP Todo:

- Personal checklist hằng ngày.
- CRUD chỉ thuộc owner.
- Không dùng mặc định để assign work.
- Không dùng cho KPI calculation.
- Không có reminder trong MVP.

## 16. Pomodoro / Focus

MVP lưu focus sessions:

- `startedAt`.
- `endedAt`.
- `durationMinutes`.
- `mode`.
- `completed`.
- optional `taskId`.

Dashboard hiển thị today/weekly summary đơn giản.

Music Library:

- Admin quản lý centralized music library.
- Fields: name, description, background image, YouTube URL, enabled/disabled.
- Admin có thể cấu hình Pomodoro presets.

## 17. Dashboard

Dashboard query live cho MVP. Dataset 30-100 users chưa cần precompute/materialized stats.

Admin Dashboard:

- pending accounts.
- active employees.
- overdue tasks.
- task progress by team.
- organization statistics.

Parent Dashboard:

- subtree employees.
- subtree tasks.
- overdue tasks.
- task progress.
- team calendar.

Employee Dashboard:

- today's tasks.
- upcoming deadlines.
- overdue tasks.
- todo.
- Pomodoro summary.
- notifications.

## 18. Audit Log

Audit thao tác nhạy cảm trước, không audit mọi CRUD nhỏ.

Audit events MVP:

- Account approval/rejection.
- Account disable/activate.
- Role changes.
- Permission changes.
- Team changes.
- Manager changes.
- Task assignment changes.
- Task deadline changes.
- Important task status changes.
- Data export hooks reserved for Phase 2.

Audit record:

- `actorType = user | system`.
- `actorId nullable`.
- `action`.
- `resource`.
- `resourceId`.
- `before` JSONB.
- `after` JSONB.
- `timestamp`.
- `requestId`.
- `jobId`.

System job mutations vẫn đi qua service layer.

Không log secrets, password, OTP, tokens.

## 19. Email Templates

Templates MVP:

- Account Verification.
- Account Approval.
- Forgot Password.
- Password Changed.
- Notification.
- Confirmation.

Template format:

- subject.
- plain text or simple HTML body.
- variables whitelist.

Không build rich editor trong MVP.

Email provider:

- Tạo `EmailService` interface từ đầu.
- Provider cụ thể chọn theo project env/InsForge option.
- Business logic không phụ thuộc trực tiếp provider.

## 20. Storage & Upload Security

MVP attachments:

- Avatar.
- Task attachments.

Limits:

- Image max 3MB.
- File max 10MB.

Allowed avatar:

- image only.

Allowed task attachments:

- pdf.
- doc/docx.
- xls/xlsx.
- png/jpg/webp.

Rules:

- Store metadata in DB.
- Validate MIME and extension.
- Enforce authorization on download.
- RAG documents Phase 2.

## 21. Internationalization

UI hỗ trợ:

- Tiếng Việt.
- Tiếng Anh.

Default locale:

- Vietnamese.

Fallback:

- English.

Code/domain identifiers dùng English. UI copy đi qua i18n keys ngay từ đầu.

User có thể chọn language trong profile. Lưu `locale` trên user profile. Default theo company config hoặc Vietnamese.

## 22. Timezone

- Store timestamps in UTC.
- User profile có `timezone`.
- Default timezone: `Asia/Ho_Chi_Minh`.
- Display theo user timezone.

## 23. API & Error Shape

API response chuẩn:

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

Guidelines:

- UI nhận message thân thiện.
- Internal logs giữ detail.
- Không expose sensitive data.
- Mutation APIs nên command-style rõ intent.
- Client UI dùng TanStack Query để gọi Next.js APIs.
- Query keys phải có convention ổn định theo resource/scope/filter, ví dụ `['tasks', 'list', filters]`, `['employees', 'detail', employeeId]`.
- Mutations dùng `useMutation`; sau success invalidate hoặc update đúng query keys liên quan.
- Loading/error/empty states là yêu cầu bắt buộc cho mọi màn hình query dữ liệu.
- Không gọi InsForge SDK trực tiếp từ Client Components cho business data cần authorization phức tạp.

API style:

- Read endpoints theo resource.
- Mutations quan trọng theo workflow/command intent.

Examples:

- `approveAccount`.
- `rejectAccount`.
- `assignTask`.
- `changeManager`.
- `disableEmployee`.
- `changeRole`.

## 24. UI Information Architecture

Main navigation:

- Dashboard.
- Organization.
- Employees.
- Tasks.
- Calendar.
- Notifications.
- Todo.
- Focus.
- Admin.

Admin areas:

- Accounts.
- Roles & Permissions.
- Teams.
- Email Templates.
- Audit Log.
- Music Library.

Admin và Parent dùng chung task workspace. Data/actions filter theo permission. UI hiển thị actions khác nhau theo capability.

Responsive web tốt. Chưa làm PWA/offline.

Design target:

- Desktop-first cho Admin/Parent workflows.
- Mobile-friendly cho Employee workflows.

UI library decisions:

- HeroUI là component library chính.
- TanStack Table dùng cho data-heavy screens như Employees, Tasks, Audit Log, Accounts, Roles & Permissions.
- Chart.js dùng cho dashboard charts và reporting-lite views.
- TanStack Query dùng cho client data loading/mutation ở app workspace.
- Mỗi màn hình data-heavy cần có loading skeleton/spinner, empty state, error state, và mutation pending state.
- Table filtering/sorting/pagination nên ưu tiên server-side khi dataset có thể lớn hoặc permission filtering cần backend enforce.

## 25. Database & Migration

MVP single-company, nhưng schema có `organizationId` hoặc `companyId` từ đầu.

Không cần tenant switching trong MVP.

ID strategy:

- UUID/ULID cho primary keys.
- Không dùng incremental IDs cho public-facing resources.
- `employeeCode` là business identifier riêng.

Soft delete/deactivate:

- employee.
- team.
- role.
- important task.

Todo/pomodoro session có thể hard-delete theo owner nếu không liên quan audit/KPI.

Schema/migrations nằm trong repo:

- Prefer InsForge migration workflow nếu có.
- Nếu không, giữ SQL migrations trong `db/migrations`.
- Không chỉnh production DB thủ công trong dashboard.

## 26. Search & Filters

MVP dùng database filtering + simple text search cho:

- employees.
- tasks.
- audit.

Chưa cần global search.

## 27. Observability

Structured logs tối thiểu:

- `requestId`.
- `actorId`.
- `action`.
- `resource`.
- `outcome`.
- `errorCode`.

Không log:

- secrets.
- password.
- OTP.
- tokens.

## 28. AI/RAG Preparation

RAG/AI chưa build trong MVP.

MVP chỉ chuẩn bị:

- permission vocabulary.
- audit action types.
- storage conventions.
- `companyId/organizationId`.
- FastAPI integration boundary.

Phase 2 RAG rules:

- Chatbot phải tuân theo permission model của app.
- Retrieval chỉ nhận allowed scopes/document IDs.
- Trả lời kèm source/citation.
- Không hallucinate dữ liệu không tồn tại.
- Không mutate database trực tiếp.
- Create/update/delete/export/send phải gọi controlled tools/API.
- Sensitive actions cần confirmation.

Trước khi build RAG Phase 2, cần làm threat model riêng.

## 29. Test Strategy

Unit/service tests:

- Vitest.
- Permission evaluator.
- Role/permission catalog.
- Task assignment rules.
- Account lifecycle.
- Notification job idempotency.

Critical UI flows:

- Playwright.

Required test data:

- System Admin.
- Department Head.
- Team Leader.
- 3 Employees.
- 2 teams.
- Multi-assignee tasks.
- Peer/manager/other subtree cases.

Authorization tests là gate từ đầu, không phải polish cuối.

## 30. Seed / Demo Data

Seed data MVP:

- Admin.
- Department Head.
- Team Leader.
- 3 Employees.
- 2 teams.
- Task assigned to one employee.
- Multi-assignee task.
- Personal task.
- Calendar event.
- Notifications.
- Pomodoro sessions.

Seed/demo data chỉ chạy ở local/dev/test. Không chạy vào production.

## 31. Milestones

### Milestone 1 - Foundation

- Repo/app scaffold.
- InsForge connection.
- Shared InsForge client modules.
- HeroUI provider/theme setup.
- TanStack Query provider setup.
- Database migration workflow.
- Auth integration.
- Account lifecycle base.
- `getCurrentActor()`.
- Audit log base.
- Error/API response shape.
- i18n foundation.

### Milestone 2 - Org & Permission

- Employee model.
- Team model.
- Position/Level.
- Role/Permission catalog.
- Role assignment.
- ReportsTo hierarchy.
- Recursive subtree query.
- Permission evaluator.
- Authorization matrix tests.
- Admin org forms.
- Read-only org chart.

### Milestone 3 - Task Core

- Task model.
- TaskAssignee model.
- Task CRUD.
- Individual/multiple/team assignment.
- Personal task.
- Comments.
- Attachments.
- Task permission tests.
- Shared task workspace for Admin/Parent/Employee.

### Milestone 4 - Calendar & Notification

- Calendar events.
- Task deadline calendar.
- Notification events/recipients.
- In-app notification center.
- Polling.
- Email notification service.
- Reminder/overdue jobs.

### Milestone 5 - Productivity

- Personal Todo.
- Pomodoro timer.
- Focus sessions.
- Music Library.
- Employee dashboard widgets.

### Milestone 6 - Dashboards & Hardening

- Admin dashboard.
- Parent dashboard.
- Employee dashboard.
- Chart.js dashboard widgets.
- Audit coverage pass.
- Upload/download authorization pass.
- Playwright critical flows.
- Seed/demo data polish.
- UX/i18n copy pass.

## 32. Implementation Approach

Use hybrid planning:

1. Build foundation and auth/permission layer first.
2. Then build vertical slices end-to-end:
   - account approval.
   - org setup.
   - task assignment.
   - notification.
   - todo/focus.

Do not build broad UI CRUD before permission model is testable.

Recommended next flow:

1. Review this spec.
2. Optionally prototype IA/task workspace and org/permission admin if still visually unclear.
3. Run `to-tickets` to split milestones into local markdown tickets with blocking edges.
4. Implement ticket by ticket, keeping authorization tests near the front.
