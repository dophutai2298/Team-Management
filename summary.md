# Team Management System — Project Brief

## 1. Project Goal

Xây dựng hệ thống quản lý nội bộ cho công ty, tập trung vào:

* Account & Employee Management
* Team & Organization Structure
* Role / Permission Management
* Task & Planning
* Calendar & Notification
* KPI / Performance Review
* Personal Todo & Pomodoro
* Internal AI Chatbot / RAG
* Reporting & Audit Log

Hệ thống sử dụng **hierarchical organization + scoped permissions**, không chỉ đơn giản là Admin/User.

---

# 2. Main Roles

Có 3 nhóm role chính:

```text
Admin
  ↓
Parent Role
  ↓
Child Role / Employee
```

Ví dụ:

```text
Admin
  └── Head of Engineering
        └── Backend Team Leader
              ├── Senior Backend
              └── Junior Backend
```

Quan hệ quản lý phải dựa trên:

```text
managerId / reportsTo
```

Không được xác định quyền chỉ bằng tên role.

---

# 3. Permission Model

Permission nên theo dạng:

```text
resource:action:scope
```

Ví dụ:

```text
task:create:self
task:create:subtree
task:update:subtree
task:read:self
task:read:team
task:read:all
```

Scope chính:

```text
self
team
subtree
all
```

## Admin

Có quyền toàn hệ thống:

* quản lý account
* employee
* role
* permission
* team
* organization structure
* task
* KPI
* system configuration
* RAG documents
* reporting

## Parent Role

Quản lý **cây nhân sự trực thuộc**.

Có thể:

* xem nhân viên thuộc subtree
* CRUD task của cấp dưới
* theo dõi dashboard/calendar của subtree
* đánh giá KPI cấp dưới
* truy vấn chatbot trong phạm vi được phép

Không được:

* quản trị role toàn hệ thống
* duyệt account
* sửa team khác
* quản lý peer
* quản lý manager
* quản lý subtree khác

## Employee

Có thể:

* quản lý profile cá nhân
* tạo personal task
* cập nhật task được giao
* xem team được phép
* xem KPI của chính mình
* dùng Todo/Pomodoro
* sử dụng chatbot trong phạm vi quyền

Không được sửa/xóa task của người khác.

---

# 4. Authentication & Account Lifecycle

Employee đăng ký bằng email công ty.

Flow:

```text
Register
→ Email OTP Verification
→ Pending Approval
→ Admin Approval
→ Active
```

Account states:

```text
Pending Verification
Pending Approval
Active
Disabled
Terminated
```

Features:

* register
* login
* email OTP verification
* forgot password
* change password
* resend verification
* Admin approve/reject
* Admin disable/activate account

Không expose password hoặc authentication secrets.

---

# 5. Employee Management

Employee profile gồm:

* full name
* employee code
* birthday
* phone
* address
* hometown
* avatar
* team
* position
* level
* role
* manager

Admin quản lý:

```text
Team
Position
Level
Role
Manager
```

Employee không tự thay đổi các thông tin organization trên.

Cần giữ lịch sử:

```text
Team History
Role History
Position History
Manager History
```

Employee rời công ty nên dùng:

```text
Deactivate / Terminated
```

thay vì hard-delete để giữ dữ liệu lịch sử.

---

# 6. Team & Organization

Team hỗ trợ:

* CRUD team
* team name
* description
* parent team
* team manager
* members

Organization dựa trên:

```text
Team hierarchy
+
Employee reportsTo hierarchy
```

Cần hỗ trợ:

```text
Organization Chart
Organization Table
```

Một employee có thể thuộc nhiều team.

Mỗi membership cần xác định manager tương ứng.

---

# 7. Task Management

Task khác với Personal Todo.

Task fields chính:

```text
title
description
creator
assigner
assignee
team
priority
status
progress
deadline
tags
attachments
createdAt
updatedAt
```

Có thể thêm:

```text
comments
blockers
activity history
```

## Admin

CRUD mọi task.

Có thể assign cho:

* employee
* multiple employees
* team
* company

## Parent Role

CRUD task của toàn bộ employee trong subtree.

Không được thao tác task của:

```text
peer
manager
other subtree
```

## Employee

Employee có thể tự tạo:

```text
Personal Task
```

Task này mặc định private.

Với Assigned Task, employee chỉ được:

* update status
* update progress
* comment
* attach files
* report blocker

Không được tự thay đổi:

* assigner
* assignee
* deadline

trừ khi có permission.

---

# 8. Multi-Assignee Task

Task có thể giao nhiều người.

Nên thiết kế:

```text
Task
  └── TaskAssignee[]
```

Mỗi assignee có record riêng để theo dõi:

```text
status
progress
completion
```

Task có thể đồng thời có overall progress.

---

# 9. Calendar & Planning

Calendar hỗ trợ:

```text
Personal
Team
Company
Admin
```

Calendar Event có thể liên kết Task nhưng không bắt buộc.

Có thể xem:

* task deadline
* plan
* event
* reminder

---

# 10. Notification

Channels:

```text
In-App
Email
```

Trigger chính:

* new task assigned
* deadline changed
* approaching deadline
* overdue task
* calendar event
* KPI result

Notification Center hỗ trợ:

* unread/read
* mark as read
* link tới resource liên quan

Reminder có thể cấu hình:

```text
7 days before
1 day before
1 hour before
```

Timezone hiện tại:

```text
Vietnam
```

nhưng architecture nên hỗ trợ timezone theo user trong tương lai.

---

# 11. KPI / Performance Review

KPI theo:

```text
Quarter
Year
```

Default criteria:

```text
Performance
Attitude
Skill
Knowledge Sharing
English
```

Admin có thể CRUD KPI criteria.

Workflow:

```text
Draft
→ Submitted
→ Reviewed
→ Locked
```

Parent Role có thể đánh giá employee thuộc subtree.

Employee chỉ xem KPI của chính mình.

KPI record cần:

* criteria scores
* weight
* total score
* reviewer
* comments
* period
* status

KPI đã Locked không được sửa tự do.

Mọi chỉnh sửa quan trọng phải có audit log.

---

# 12. Todo

Todo hoàn toàn độc lập với Task.

Todo dùng cho checklist cá nhân hằng ngày.

Không dùng mặc định để:

* assign work
* performance tracking
* KPI calculation

CRUD chỉ thuộc user sở hữu.

---

# 13. Pomodoro

Employee có:

```text
Focus Timer
Break Timer
Focus Session Statistics
Music
```

Admin quản lý centralized music library:

* name
* description
* background image
* YouTube URL
* enabled/disabled

Admin có thể cấu hình Pomodoro presets.

---

# 14. AI Chatbot / RAG

Admin quản lý RAG documents.

Document có:

```text
title
category
file
access scope
team scope
createdBy
```

Access scope:

```text
Company
Team
Admin Only
```

Chatbot bắt buộc tuân theo permission của user.

Employee có thể hỏi:

* internal knowledge
* own tasks
* own plans
* permitted documents

Parent Role có thể hỏi:

* subtree task summary
* subtree plans
* permitted team documents

Admin có thể truy vấn toàn hệ thống.

Chatbot phải:

* trả lời kèm source/citation
* không hallucinate dữ liệu không tồn tại
* không truy cập dữ liệu user không có permission
* không trực tiếp mutate database

Các action kiểu:

```text
create
update
delete
export
send
```

phải gọi controlled tools/API.

Các thao tác nhạy cảm phải có confirmation.

---

# 15. Email Template

Admin cấu hình email template cho:

```text
Account Verification
Account Approval
Forgot Password
Password Changed
Notification
Confirmation
```

System cung cấp default templates.

---

# 16. Dashboard

## Admin Dashboard

Hiển thị:

* pending accounts
* active employees
* overdue tasks
* task progress by team
* KPI progress
* organization statistics

## Parent Dashboard

Hiển thị:

* subtree employees
* subtree tasks
* overdue tasks
* task progress
* team calendar
* KPI status

## Employee Dashboard

Hiển thị:

* today's tasks
* upcoming deadlines
* overdue tasks
* todo
* Pomodoro summary
* notifications

---

# 17. Collaboration

Task có thể hỗ trợ:

* comments
* mentions
* attachments
* blocker
* activity history

---

# 18. Audit Log

Audit các thao tác nhạy cảm:

```text
Account approval
Account disable
Role changes
Permission changes
Team changes
Manager changes
KPI changes
Data exports
```

Audit record nên có:

```text
actor
action
resource
resourceId
before
after
timestamp
```

---

# 19. Reports & Export

Theo permission, hỗ trợ export:

```text
Employee
Task
KPI
Team Performance
```

Formats:

```text
CSV
XLSX
PDF
```

Mọi export dữ liệu quan trọng cần audit.

---

# 20. MVP Scope

Phase MVP tập trung vào nền tảng chính.

## Authentication

* Register
* Email OTP
* Admin account approval
* Login
* Forgot/change password

## Organization

* Employee management
* Role
* Permission
* Team
* Position
* Level
* managerId/reportsTo
* Organization Chart

## Task

* Task CRUD
* Parent subtree permission
* Assignment
* Multiple assignee
* Deadline
* Progress
* Personal Task

## Calendar & Notification

* Basic calendar
* Task deadline
* In-app notification
* Email notification

## Productivity

* Personal Todo
* Pomodoro
* Music Library

## Administration

* Basic Dashboard
* Basic Audit Log
* Email Templates

---

# 21. Phase 2

Thêm:

* Project / Workspace
* Kanban Board
* Advanced comments / attachments
* advanced Parent Role permission
* KPI workflow
* reports
* CSV/XLSX/PDF export
* RAG document management
* read-only AI chatbot with citations

---

# 22. Phase 3

Thêm:

* AI tool calling
* AI reporting/export
* action confirmation
* advanced analytics
* SSO
* 2FA
* Google/Microsoft Calendar integration
* Slack/Teams integration
* Leave / Availability management

---

# 23. Important Business Rules

Các rule sau phải được giữ khi thiết kế hệ thống.

### Rule 1 — Permission

Permission phải dựa trên:

```text
Role
+
Action
+
Scope
+
reportsTo hierarchy
```

Không hard-code bằng role name.

### Rule 2 — Parent Role

Parent Role chỉ quản lý subtree của mình.

```text
Parent
→ Child
→ Child
→ Employee
```

Không có quyền Admin.

### Rule 3 — Task Ownership

Employee:

```text
own personal task → CRUD
assigned task → update progress/status only
other people's task → no CRUD
```

Parent:

```text
subtree task → CRUD
other subtree → no access
```

Admin:

```text
all task → CRUD
```

### Rule 4 — Historical Data

Không hard-delete employee khi đã phát sinh business data.

Dùng:

```text
Disabled
Terminated
```

để giữ:

* Task history
* KPI history
* Team history
* Audit logs

### Rule 5 — AI Security

RAG search và chatbot query phải áp dụng cùng permission model với application.

LLM không được bypass authorization.

---

# 24. Architecture Requirements

Khi lên architecture cần đặc biệt xem xét:

```text
Authentication
RBAC + scoped permission
Organization tree
Task assignment model
Multi-team membership
Multi-assignee task
Audit logging
Notification
Background jobs
Email service
File storage
RAG/vector database
AI authorization
Reporting/export
```

Không nên implement authorization chỉ ở frontend.

Mọi permission phải được validate ở Backend/API.

---

# 25. Questions To Resolve During Planning

AI cần đánh dấu và đưa recommendation cho các điểm chưa hoàn toàn chốt:

1. Một employee thuộc nhiều team thì role/manager được xác định theo từng membership như thế nào?

2. Parent Role có được thay đổi team/position/level của subordinate hay chỉ Admin?

3. Multi-assignee task:

   * progress tổng tính như thế nào?
   * mỗi assignee có status riêng hay không?

4. KPI có Self Review không?

5. KPI reviewer flow là:

```text
Employee
→ Team Leader
→ Admin
```

hay chỉ:

```text
Team Leader/Admin
```

6. Parent Role có thể tạo KPI period hay chỉ đánh giá?

7. Employee có được share Personal Task cho người khác không?

8. Organization Chart visibility:

   * chỉ team
   * subtree
   * hay toàn công ty?

9. RAG document access khi employee thuộc nhiều team xử lý như thế nào?

---
