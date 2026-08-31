# Team Management

Ứng dụng quản lý nội bộ cho công ty, tập trung vào vòng đời tài khoản nhân viên, cấu trúc team, phân quyền theo phạm vi và các màn hình vận hành nền tảng. Dự án đang dùng InsForge làm backend và Next.js làm web application/BFF.

## Mục tiêu sản phẩm

Team Management không chỉ có mô hình Admin/User đơn giản. Hệ thống được thiết kế quanh:

- `reportsTo` / manager hierarchy để xác định tuyến quản lý.
- Role và permission theo dạng `resource:action:scope`.
- Scope chính: `self`, `team`, `subtree`, `all`.
- Employee có thể thuộc nhiều team, có primary team, role và manager.
- Các thao tác quan trọng như duyệt tài khoản, đổi role/team/manager cần được kiểm soát ở server/API, không chỉ ở frontend.

## Tính năng hiện có

- Đăng ký, đăng nhập, xác thực email và trạng thái chờ duyệt.
- Admin duyệt hoặc từ chối tài khoản mới.
- Admin quản lý employee profile, team, role, manager và thông tin tổ chức.
- Catalog role/permission và kiểm tra quyền theo scope.
- Organization view gồm table có search/filter/sort/pagination và chart theo team.
- Profile cá nhân cho employee.
- App shell có dark/light mode và chuyển ngôn ngữ Tiếng Việt/Tiếng Anh.
- API routes trong Next.js để truy cập InsForge qua server-side contract.

## Roadmap

Các module sau nằm trong project brief/spec và sẽ được triển khai ở các phase tiếp theo:

- Task management, multi-assignee task, comment, blocker, attachment.
- Calendar, planning, reminder và notification center.
- KPI/performance review theo kỳ, workflow review/lock.
- Personal todo và Pomodoro.
- Audit log, reporting và export.
- Internal AI chatbot/RAG có phân quyền và citation.
- Integrations như SSO, Google/Microsoft Calendar, Slack/Teams.

## Tech Stack

- Next.js 16, App Router, TypeScript, Server Components, Route Handlers.
- React 19.
- HeroUI, Tailwind CSS.
- TanStack Query cho query/mutation API.
- TanStack Table cho các bảng dữ liệu.
- Chart/organization visualization với `@unicef/react-org-chart`.
- InsForge backend: PostgreSQL, Authentication, Storage và API access.
- Vitest cho unit tests.
- Playwright cho e2e tests.
- OpenNext + Wrangler để deploy lên Cloudflare Workers.

## Cấu trúc thư mục chính

```text
src/app                 Next.js routes, layouts, API route handlers
src/components          UI/workspace components
src/components/heroui   Shared HeroUI wrappers and field styles
src/components/data-table
                        TanStack Table components
src/lib                 Business logic, API client, auth, authorization, InsForge access
src/lib/organization    Team, employee hierarchy and organization view logic
e2e                     Playwright tests
migrations              InsForge/Postgres migrations and seed data
docs                    Project and deployment docs
.scratch                Local planning/issues generated during project planning
```

## Local Setup

Yêu cầu:

- Node.js compatible với Next.js 16.
- npm.
- InsForge project credentials.

Tạo `.env.local` dựa trên `.env.example`:

```env
NEXT_PUBLIC_INSFORGE_URL=https://your-app-key.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3100

INSFORGE_URL=https://your-app-key.region.insforge.app
INSFORGE_API_KEY=your-server-only-api-key
```

Cài dependencies:

```sh
npm install
```

Chạy dev server:

```sh
npm run dev
```

Mặc định app chạy ở:

```text
http://localhost:3000
```

## Scripts

```sh
npm run dev          # chạy Next.js dev server
npm run build        # production Next.js build
npm run start        # chạy Next.js production server
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run test:run     # Vitest unit tests
npm run test:e2e     # Playwright e2e tests
```

Cloudflare/OpenNext:

```sh
npm run cf:build     # generate .open-next/worker.js
npm run cf:deploy    # deploy bundle đã build lên Cloudflare
npm run deploy       # build + deploy một lệnh
npm run preview      # build + preview local Cloudflare worker
```

## InsForge

App code đọc InsForge config từ `.env.local`. CLI đọc project link từ `.insforge/project.json`.

Không hardcode hoặc commit API keys. Các key public chỉ được dùng cho browser-safe client; admin/server key chỉ dùng ở server.

Các pattern quan trọng:

- Database inserts dùng array: `insert([{ ... }])`.
- Reference user qua `auth.users(id)`.
- RLS policies nên dùng `auth.uid()`.
- Storage upload cần lưu cả `url` và `key`.

## Deployment Cloudflare

Không commit `.open-next/`. Đây là output được tạo khi chạy OpenNext build.

Cloudflare Workers Builds nên cấu hình:

```text
Build command: npm run cf:build
Deploy command: npm run cf:deploy
```

Không chạy `wrangler deploy` trực tiếp nếu `.open-next/worker.js` chưa tồn tại trong cùng environment.

Xem thêm: [docs/cloudflare-deployment.md](docs/cloudflare-deployment.md).

## Verification

Trước khi mở PR hoặc deploy, nên chạy:

```sh
npm run typecheck
npm run lint
npm run test:run
npm run build
```

Nếu thay đổi UI flow quan trọng:

```sh
npm run test:e2e
```

Nếu thay đổi deployment:

```sh
npm run cf:build
```

## Tài liệu liên quan

- [summary.md](summary.md): project brief ban đầu.
- [Team-management.md](Team-management.md): functional review chi tiết.
- [docs/cloudflare-deployment.md](docs/cloudflare-deployment.md): hướng dẫn deploy Cloudflare/OpenNext.
