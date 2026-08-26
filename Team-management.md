# Team management

# Team Management — Functional Review

**Phiên bản:** 23/08/2026 — v1 (đã review)

## 1. Mục tiêu và thuật ngữ

Hệ thống quản lý nhân sự, cơ cấu đội nhóm, kế hoạch/công việc, KPI và các tiện ích tập trung cho công ty. Hệ thống dùng **cây quyền và cây quản lý** thay vì chỉ có Admin/User:

- **Admin:** role toàn hệ thống, có toàn quyền cấu hình tổ chức, role, nhân sự và dữ liệu nghiệp vụ theo chính sách.
- **Parent Role (role cha):** role cao nhất trong một team/nhánh tổ chức, ví dụ Head of Engineering hoặc Team Leader. Role này quản lý các role con và nhân viên nằm dưới nhánh của mình.
- **Child Role / Employee (role con/nhân viên):** thành viên thực thi; chỉ làm việc với dữ liệu cá nhân, task được giao và dữ liệu team mà được cấp quyền xem.

> Parent Role không phải Admin. Parent Role chỉ có quyền trong **cây nhân sự trực thuộc** của mình; không được quản trị role toàn hệ thống, xem/sửa team khác, duyệt tài khoản hoặc thay đổi cấu hình hệ thống.
> 

Phân biệt rõ:

- **Task:** công việc có người giao/chịu trách nhiệm, ưu tiên, deadline, trạng thái và có thể xuất hiện trên calendar.
- **Todo cá nhân:** checklist nhanh của riêng nhân viên; không có giá trị giao việc hay đánh giá KPI mặc định.
- **Plan/Calendar event:** lịch hoặc kế hoạch theo cá nhân, team, hoặc toàn công ty; có thể liên kết với task nhưng không bắt buộc.

## 2. Chức năng Admin

### 2.1. Tài khoản và vòng đời nhân sự

- Xem danh sách tài khoản đã đăng ký; chỉ duyệt tài khoản đã xác thực email/OTP.
- Duyệt, từ chối, kích hoạt, vô hiệu hóa hoặc khóa tài khoản. Nên lưu lý do và thời điểm thay đổi trạng thái.
- Xem và cập nhật hồ sơ nhân viên, tuyệt đối không hiển thị mật khẩu hay dữ liệu xác thực nhạy cảm.
- Gán nhân viên vào team, chức danh, level, role và người quản lý trực tiếp (Parent Role).
- Hỗ trợ reset mật khẩu hoặc gửi lại email xác thực theo luồng an toàn.
- Nên có trạng thái rõ ràng: `Pending verification → Pending approval → Active → Disabled/Terminated`.

### 2.2. Role, cây tổ chức và phân quyền

- Admin tạo/cấu hình role, thứ bậc role, permission và phạm vi áp dụng; sau đó gán role cho tài khoản đã được duyệt.
- Mô hình quyền mặc định: `Admin → Parent Role → Child Role/Employee`. Một Parent Role là role cao nhất của một team/nhánh và có thể có nhiều tầng role con bên dưới.
- Ví dụ: `Admin → Head of Engineering → Backend Team Leader → Senior Backend → Junior Backend`.
- Mỗi user cần có quan hệ **reportsTo / managerId**. Hệ thống xác định “cấp dưới” bằng cây quan hệ này, không chỉ dựa vào tên role.
- Parent Role được phép **tạo, xem, sửa, giao lại, đóng/hủy task** cho mọi Employee và role con trong nhánh trực thuộc; có thể xem dashboard/task calendar của nhánh đó.
- Parent Role không được CRUD task của peer, manager hoặc nhân sự/team ngoài nhánh; Admin có quyền vượt phạm vi này.
- Employee chỉ tạo, sửa hoặc xóa **task cá nhân do chính mình tạo**; với task được giao, chỉ được cập nhật tiến độ, trạng thái, bình luận và blocker theo permission.
- Permission nên tách thành action + scope, ví dụ: `task:create:subtree`, `task:update:subtree`, `task:delete:subtree`, `task:read:self`. Thiết kế này linh hoạt hơn việc hard-code role name.

### 2.3. Team và sơ đồ tổ chức

- CRUD team; thiết lập tên, mô tả, Parent Role/manager của team, thành viên và team cha (nếu có).
- Cấu hình chức danh và level, ví dụ: Team Leader, Senior, Junior.
- Thiết lập quan hệ báo cáo trực tiếp giữa nhân viên.
- Hiển thị cơ cấu theo hai dạng: **Organization chart** và **table**; có lọc theo team.
- Lưu lịch sử khi nhân viên chuyển team, đổi chức danh hoặc đổi quản lý để dữ liệu KPI/báo cáo quá khứ không bị sai.

### 2.4. Quản lý task và kế hoạch

- Admin có thể tạo, sửa, đóng, hủy và lưu nháp mọi task.
- Giao task cho một nhân viên, một nhóm nhân viên, một team hoặc toàn công ty; gửi thông báo in-app và email cho người được giao.
- Parent Role chỉ CRUD task của employee/role con trong nhánh trực thuộc; mọi kiểm tra quyền phải dựa trên cây `managerId/reportsTo`.
- Thiết lập tiêu đề, mô tả, priority, deadline, người giao, người thực hiện, trạng thái, nhãn và tệp đính kèm.
- Theo dõi tiến độ, bình luận/cập nhật, task quá hạn và lịch sử thay đổi.
- Tạo plan/event trên calendar cho cá nhân, team, toàn công ty hoặc riêng Admin.
- Nên bổ sung dự án/workspace để nhóm các task lớn; nếu chưa có, task phải ít nhất có team và tag.

### 2.5. KPI và đánh giá hiệu suất

- Thiết lập kỳ đánh giá theo quý và năm; chỉ Admin/KPI Reviewer mới tạo hoặc chốt kỳ.
- Parent Role có thể đánh giá hiệu suất của child mình
- Tạo tiêu chí, trọng số và thang điểm. Bộ tiêu chí hiện tại (Admin có thể CRUD Tiêu chí):
    - Performance
    - Attitude
    - Skill
    - Knowledge sharing
    - English
- Nhập nhận xét, điểm từng tiêu chí, tổng điểm, người đánh giá và trạng thái: Draft → Submitted → Reviewed → Locked.
- So sánh kết quả theo kỳ, team, level và xuất báo cáo.
- Nhân viên chỉ được xem KPI của chính mình; việc sửa sau khi chốt phải có audit log.

### 2.6. Calendar, thông báo và nhắc việc

- Xem calendar theo cá nhân, team, toàn công ty và loại sự kiện.
- Cấu hình notification in-app/email cho: task mới được giao, thay đổi deadline, sắp đến hạn, quá hạn, calendar event và kết quả KPI.
- Cho phép cấu hình thời điểm nhắc: ví dụ 7 ngày, 1 ngày, 1 giờ trước deadline.
- Có trang notification center: xem/chưa đọc, đánh dấu đã đọc, liên kết thẳng đến đối tượng liên quan.
- Nên có timezone theo user hoặc workspace để deadline và reminder không bị lệch.

### 2.7. Pomodoro và thư viện nhạc

- CRUD danh sách âm thanh/nhạc tập trung cho Pomodoro: tên, mô tả, ảnh nền, YouTube URL, trạng thái hiển thị.
- Kiểm tra URL hợp lệ và có cơ chế ẩn nội dung không còn dùng được.
- Có thể cấu hình preset thời lượng Pomodoro và break ở mức hệ thống.

### 2.8. Chatbot nội bộ và RAG

- Upload, phân loại, cập nhật và xóa tài liệu tri thức cho RAG; ví dụ proposal, tài liệu dự án, quy trình và tài liệu MVP.
- Gán phạm vi truy cập cho tài liệu: toàn công ty, theo team hoặc chỉ Admin. Chatbot phải tuân theo quyền của người hỏi.
- Trả lời câu hỏi về tri thức nội bộ kèm nguồn trích dẫn/link tài liệu.
- Hỗ trợ truy vấn dữ liệu có kiểm soát: tổng hợp task/plan theo tuần, tháng; theo Admin, toàn bộ nhân viên, team hoặc danh sách nhân viên chỉ định.
- Hỗ trợ xuất báo cáo hiệu suất/tình hình qua chat, nhưng cần màn hình xác nhận trước khi tạo file hoặc gửi dữ liệu.
- System prompt cần giới hạn chatbot trong phạm vi hệ thống; câu hỏi ngoài phạm vi phải trả lời rõ rằng không có dữ liệu/không hỗ trợ.
- Không để LLM tự do ghi, xóa hay đổi dữ liệu. Các thao tác thay đổi dữ liệu phải gọi tool có permission riêng và yêu cầu xác nhận.

### 2.9. Email template

- Admin Cấu hình các loại email template trong settings như là template verify account, change password, forgot password, notify, confirm … (Sẽ hiển thị Template mặc định)

## 3. Chức năng Employee

### 3.1. Đăng ký, xác thực và hồ sơ

- Đăng ký bằng email nội bộ công ty.
- Xác thực OTP qua email; sau đó chờ Admin duyệt để thành `Active`.
- Xem và cập nhật hồ sơ cá nhân: họ tên, ngày sinh, mã nhân viên, quê quán, địa chỉ hiện tại, số điện thoại, ảnh đại diện.
- Chức danh, level, team, role và người quản lý trực tiếp do Admin hoặc Parent Role được Admin ủy quyền quản lý; nhân viên không tự sửa.
- Đổi mật khẩu/quên mật khẩu qua email OTP; có thể bổ sung quản lý phiên đăng nhập và 2FA ở giai đoạn sau.

### 3.2. Task, plan và calendar

- Xem các task của bản thân, task chung và task của team mà mình được phép xem.
- Chỉ tự tạo task cá nhân; task này mặc định chỉ hiển thị cho người tạo cho đến khi được chia sẻ.
- Với task do Parent Role/Admin giao, cập nhật trạng thái, tiến độ, bình luận, tệp đính kèm và báo blocker; không tự thay đổi người giao, assignee hoặc deadline nếu không có quyền.
- Không thể sửa/xóa task của người khác. Parent Role là người có quyền CRUD task của toàn bộ employee/role con trong nhánh quản lý.
- Xem task ở dạng table/list/board và calendar; lọc theo deadline, priority, trạng thái, team hoặc tag.
- Nhận notification và cấu hình các loại reminder cá nhân trong giới hạn chính sách hệ thống.

### 3.3. Team và sơ đồ tổ chức

- Xem thông tin team và sơ đồ tổ chức trong phạm vi được cấp quyền.
- Với MVP, nhân viên chỉ xem team của mình; khi cần phối hợp liên-team có thể mở rộng quyền xem theo từng team.

### 3.4. Tiện ích cá nhân

- CRUD todo list hằng ngày độc lập với Task.
- Pomodoro timer với thời lượng focus/break, thống kê phiên tập trung cá nhân và chọn nhạc từ danh sách do Admin quản lý.
- Chatbot hỗ trợ tìm tri thức nội bộ, tóm tắt task/plan của chính mình theo tuần hoặc tháng. Không được truy vấn KPI, task hay báo cáo của người khác nếu không có quyền.

## 4. Các hạng mục nên bổ sung

- **Parent Role (bắt buộc):** role cao nhất trong từng team/nhánh; quản lý role con và Employee theo cây `reportsTo`, đồng thời CRUD task của toàn bộ cấp dưới. Không có quyền Admin toàn hệ thống hoặc quyền trên nhánh khác.
- **Dashboard:** Admin xem số tài khoản chờ duyệt, task quá hạn, tiến độ theo team, KPI chưa hoàn thành; Employee xem task hôm nay, sắp đến hạn và Pomodoro/todo.
- **Collaboration:** bình luận, mention, file đính kèm, hoạt động gần đây và lịch sử thay đổi task.
- **Audit log:** lưu các thao tác nhạy cảm như duyệt tài khoản, cấp quyền, thay đổi KPI, thay đổi cấu trúc team và export dữ liệu.
- **Quyền riêng tư và bảo mật:** tối thiểu hóa dữ liệu hồ sơ, phân quyền theo phạm vi, rate limit OTP/login, mã hóa dữ liệu nhạy cảm và chính sách lưu/xóa dữ liệu.
- **Báo cáo và export:** xuất CSV/XLSX/PDF cho task, KPI và nhân sự theo quyền; ghi log ai đã export dữ liệu nào.
- **Integrations (giai đoạn sau):** Google/Microsoft Calendar, Slack/Teams và SSO nội bộ.
- **Nghỉ phép/availability (giai đoạn sau):** trạng thái nghỉ, lịch bận/rảnh và approval workflow; hữu ích khi lập kế hoạch nhưng chưa cần đưa vào MVP.

## 5. Khuyến nghị phạm vi triển khai

### MVP

- Đăng ký, email OTP, Admin duyệt tài khoản, đăng nhập/quên mật khẩu.
- Employee profile, Admin quản lý nhân viên; RBAC và cây quyền `Admin → Parent Role → Child Role/Employee`.
- Team + sơ đồ tổ chức cơ bản + quan hệ `managerId/reportsTo`.
- Admin CRUD task toàn hệ thống; Parent Role CRUD task của cấp dưới; Employee quản lý task cá nhân và cập nhật task được giao.
- Task CRUD, assignment, deadline, calendar cơ bản và notification in-app/email.
- Todo cá nhân, Pomodoro và thư viện nhạc YouTube.
- Dashboard tối thiểu và audit log cho quyền/tài khoản.

### Phase 2

- Dự án/workspace, board view, bình luận/tệp đính kèm và permission nâng cao cho Parent Role.
- KPI theo kỳ với workflow review/lock.
- Báo cáo và export có phân quyền.
- RAG document management và chatbot chỉ đọc có trích dẫn.

### Phase 3

- Chatbot dùng tool để tổng hợp dữ liệu/export có bước xác nhận.
- SSO, calendar/chat integrations, 2FA,  analytics nâng cao.

## 6. Quy tắc ưu tiên cần chốt trước khi thiết kế

- Một tài khoản có thể thuộc một hay nhiều team. Mỗi team membership cần một `managerId`; Parent Role là người quản lý trực tiếp của nhánh đó, còn Admin chỉ là cấp quản trị cao nhất.
- Task giao cho nhiều người sẽ theo dõi tiến độ chung và mỗi người có một assignee record/subtask riêng.
- Employee chỉ tạo task cá nhân. Parent Role cao nhất của nhánh có thể CRUD task cho toàn bộ Employee/role con bên dưới; Admin có thể CRUD trên toàn hệ thống.
- KPI có self-review, review bởi Team Leader hoặc  Admin không
- Giữ lịch sử team/role và KPI sau khi nhân viên nghỉ việc. Nếu Admin xóa luôn employee đó sẽ mất hết record của Employee đó. Deactivate thì vẫn giữ record
- Dữ liệu chatbot/RAG nào được phép nhìn thấy theo team và chỉ có admin được upload/xóa tài liệu.
- Kênh email đã đăng ký được dùng và có cần nhắc theo timezone của từng người dùng (Hiện tại Viet Nam)

## 7. Sơ đồ chức năng từng Role

#### 👑 ADMIN (Quản trị toàn hệ thống)

Admin có toàn quyền quản trị, cấu hình và giám sát dữ liệu toàn công ty

```python
[ ADMIN ]
 ├── 🛠️ Quản lý Tài khoản & Nhân sự
 │    ├── Phê duyệt / Từ chối tài khoản mới đăng ký
 │    ├── Kích hoạt / Vô hiệu hóa / Khóa tài khoản
 │    ├── Gán Team, Chức danh, Level, Role, Parent Role (Manager)
 │    └── Hỗ trợ Reset mật khẩu / Gửi lại mail xác thực
 │
 ├── 🌳 Quản lý Role, Quyền & Cấu trúc Tổ chức
 │    ├── Tạo / Cấu hình Role, thứ bậc Role, Permission & Scope
 │    ├── CRUD Team (Tên, mô tả, team cha, thành viên, Parent Role của team)
 │    ├── Cấu hình Chức danh & Level (VD: Team Leader, Senior, Junior)
 │    ├── Thiết lập quan hệ báo cáo trực tiếp (managerId / reportsTo)
 │    └── Xem Org Chart / Danh sách tổ chức & Lưu lịch sử luân chuyển
 │
 ├── 📋 Quản lý Task & Kế hoạch (Toàn hệ thống)
 │    ├── CRUD / Lưu nháp / Đóng / Hủy mọi Task trong hệ thống
 │    ├── Giao Task cho Nhân viên, Nhóm, Team hoặc Toàn công ty
 │    ├── Theo dõi tiến độ, task quá hạn & lịch sử thay đổi
 │    └── Tạo Plan / Calendar Event (Cá nhân, Team, Toàn công ty)
 │
 ├── 📊 Quản lý KPI & Đánh giá Hiệu suất
 │    ├── Tạo & chốt Kỳ đánh giá (Quý / Năm)
 │    ├── CRUD Bộ tiêu chí đánh giá (Performance, Attitude, Skill, Knowledge sharing, English)
 │    ├── Nhập nhận xét, chấm điểm, chuyển trạng thái (Draft -> Locked)
 │    └── So sánh kết quả, xuất báo cáo & xem Audit log khi sửa KPI
 │
 ├── 🔔 Cấu hình Hệ thống & Tiện ích
 │    ├── Cấu hình Notification & Thời điểm nhắc nhở (In-app / Email)
 │    ├── CRUD Thư viện nhạc / âm thanh cho Pomodoro & Preset thời gian
 │    └── Cấu hình các loại Email Template (Verify, Reset password, Notify...)
 │
 └── 🤖 Quản lý AI Chatbot & Tri thức (RAG)
      ├── Upload, phân loại, cập nhật, xóa tài liệu tri thức (RAG) & phân quyền truy cập
      └── Tra cứu / Xuất báo cáo tổng hợp qua Chatbot (Có xác nhận thao tác)[cite: 1]
```

#### 👔 PARENT ROLE (Role Cha / Quản lý nhánh / Team Leader)

Parent Role là cấp quản lý trực tiếp một nhánh/team (ví dụ: Head of Engineering, Team Leader)[cite: 1]. **Parent Role không có quyền Admin** (không quản trị role toàn hệ thống, không sửa team khác, không duyệt tài khoản)[cite: 1].

```python
[ PARENT ROLE ]
 ├── 👥 Quản lý Nhân sự & Nhánh trực thuộc
 │    ├── Xem danh sách & thông tin nhân sự thuộc cây quản lý (`reportsTo`)[cite: 1]
 │    └── Xem Org Chart / Dashboard / Task Calendar của nhánh trực thuộc[cite: 1]
 │
 ├── 🎯 Quản lý Task nhánh (Giao việc & Giám sát)
 │    ├── CRUD (Tạo, Xem, Sửa, Giao lại, Đóng/Hủy) Task cho mọi Employee/Role con trong nhánh[cite: 1]
 │    ├── Theo dõi tiến độ, bình luận, giải quyết blocker, duyệt deadline trong nhánh[cite: 1]
 │    └── 🛑 Hạn chế: Không được CRUD task của Peer (đồng cấp), Manager hoặc team/nhánh khác[cite: 1].
 │
 ├── 📈 Đánh giá KPI Cấp dưới
 │    ├── Đánh giá hiệu suất / chấm điểm KPI cho các Child Role / Employee trực thuộc[cite: 1]
 │    └── Nhập nhận xét & gửi kết quả đánh giá theo kỳ[cite: 1]
 │
 └── 🛠️ Tiện ích & Tra cứu
      ├── Sử dụng Calendar, Todo cá nhân, Pomodoro[cite: 1, 2]
      └── Hỏi Chatbot RAG để tóm tắt Task / Plan / Tài liệu trong phạm vi quyền hạn[cite: 1]
```

#### 🧑‍💻 CHILD ROLE / EMPLOYEE (Nhân viên / Role con)

Role con / Nhân viên là thành viên thực thi công việc[cite: 1]. Chỉ làm việc với dữ liệu cá nhân, task được giao và thông tin team được cấp quyền xem[cite: 1].

```python
[ CHILD ROLE / EMPLOYEE ]
 ├── 👤 Tài khoản & Hồ sơ Cá nhân
 │    ├── Đăng ký tài khoản bằng email công ty & xác thực OTP[cite: 1]
 │    ├── Xem & cập nhật hồ sơ cá nhân (Họ tên, ngày sinh, SĐT, địa chỉ, avatar...)[cite: 1]
 │    └── Đổi mật khẩu / Quên mật khẩu qua Email OTP[cite: 1]
 │
 ├── 📝 Quản lý Task & Công việc cá nhân
 │    ├── TỰ TẠO Task cá nhân (Mặc định riêng tư cho đến khi chia sẻ)[cite: 1]
 │    ├── Với TASK ĐƯỢC GIAO (từ Admin / Parent Role):
 │    │    ├── Cập nhật trạng thái, tiến độ (%)[cite: 1]
 │    │    ├── Thêm bình luận, tệp đính kèm[cite: 1]
 │    │    └── Báo Blocker (Khó khăn/Vướng mắc)[cite: 1]
 │    ├── Xem Task dưới dạng List, Board, Calendar (Lọc theo deadline, priority, tag)[cite: 1]
 │    └── 🛑 Hạn chế: Không tự đổi người giao, assignee, deadline hoặc sửa/xóa task của người khác[cite: 1].
 │
 ├── 🏢 Xem thông tin Tổ chức
 │    └── Xem thông tin Team & Sơ đồ tổ chức trong phạm vi được cấp quyền (mặc định team mình)[cite: 1]
 │
 ├── 🎯 Xem kết quả KPI
 │    └── Xem bảng điểm KPI & nhận xét của chính bản thân mình[cite: 1]
 │
 └── 🛠️ Tiện ích Cá nhân
      ├── Todo list cá nhân hàng ngày (Checklist nhanh, không tính KPI)[cite: 1]
      ├── Đồng hồ Pomodoro tập trung + Nghe nhạc từ thư viện[cite: 1]
      ├── Nhận Notification (In-app/Email) & Cấu hình thời điểm nhắc lịch[cite: 1]
      └── Hỏi Chatbot RAG nội bộ (Tra cứu tài liệu công ty, tóm tắt task/plan cá nhân)[cite: 1]
```