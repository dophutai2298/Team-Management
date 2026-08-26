export const LOCALES = ["vi", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "vi";
export const FALLBACK_LOCALE: Locale = "en";

const englishMessages = {
  "app.name": "Team Management",
  "app.workspace": "Operations workspace",
  "nav.primary": "Primary navigation",
  "nav.overview": "Overview",
  "nav.organization": "Organization",
  "nav.employees": "Employees",
  "nav.tasks": "Tasks",
  "nav.calendar": "Calendar",
  "nav.notifications": "Notifications",
  "nav.todo": "Todo",
  "nav.focus": "Focus",
  "nav.admin": "Admin",
  "nav.soon": "Soon",
  "header.search": "Search workspace",
  "header.notifications": "Notifications",
  "header.openMenu": "Open navigation",
  "header.closeMenu": "Close navigation",
  "header.theme": "Theme",
  "header.lightTheme": "Use light theme",
  "header.darkTheme": "Use dark theme",
  "header.language": "Language",
  "header.profile": "Profile menu",
  "dashboard.eyebrow": "Wednesday, 26 August",
  "dashboard.title": "Overview",
  "dashboard.greeting": "Good evening, Tai",
  "dashboard.description": "Here is what needs your attention across the team today.",
  "dashboard.englishOnlyHint": "Your workspace is ready.",
  "dashboard.quickAction": "Create task",
  "dashboard.healthTitle": "Workspace status",
  "dashboard.healthDescription": "Next.js API and client query connection",
  "dashboard.healthChecking": "Checking workspace connection",
  "dashboard.healthReady": "All systems ready",
  "dashboard.healthError": "Could not reach the workspace API",
  "dashboard.retry": "Try again",
  "dashboard.activePeople": "Active people",
  "dashboard.openTasks": "Open tasks",
  "dashboard.dueThisWeek": "Due this week",
  "dashboard.completionRate": "Completion rate",
  "dashboard.emptyTitle": "Your dashboard is ready",
  "dashboard.emptyDescription": "Team activity will appear here when the first workflows are connected.",
  "dashboard.priorityTitle": "Needs attention",
  "dashboard.priorityEmpty": "Nothing urgent right now",
  "dashboard.priorityEmptyDescription": "Overdue approvals and tasks will appear in this area.",
  "error.title": "We could not load this page",
  "error.description": "The issue may be temporary. Try loading this workspace again.",
  "error.retry": "Reload page",
  "loading.label": "Loading workspace",
} as const;

export type MessageKey = keyof typeof englishMessages;

const vietnameseMessages: Partial<Record<MessageKey, string>> = {
  "app.name": "Quản lý đội ngũ",
  "app.workspace": "Không gian vận hành",
  "nav.primary": "Điều hướng chính",
  "nav.overview": "Tổng quan",
  "nav.organization": "Tổ chức",
  "nav.employees": "Nhân sự",
  "nav.tasks": "Công việc",
  "nav.calendar": "Lịch",
  "nav.notifications": "Thông báo",
  "nav.todo": "Việc cần làm",
  "nav.focus": "Tập trung",
  "nav.admin": "Quản trị",
  "nav.soon": "Sắp có",
  "header.search": "Tìm trong workspace",
  "header.notifications": "Thông báo",
  "header.openMenu": "Mở điều hướng",
  "header.closeMenu": "Đóng điều hướng",
  "header.theme": "Giao diện",
  "header.lightTheme": "Dùng giao diện sáng",
  "header.darkTheme": "Dùng giao diện tối",
  "header.language": "Ngôn ngữ",
  "header.profile": "Menu hồ sơ",
  "dashboard.eyebrow": "Thứ Tư, 26 tháng 8",
  "dashboard.title": "Tổng quan",
  "dashboard.greeting": "Chào buổi tối, Tai",
  "dashboard.description": "Đây là những việc cần bạn chú ý trong đội ngũ hôm nay.",
  "dashboard.quickAction": "Tạo công việc",
  "dashboard.healthTitle": "Trạng thái workspace",
  "dashboard.healthDescription": "Kết nối Next.js API và client query",
  "dashboard.healthChecking": "Đang kiểm tra kết nối workspace",
  "dashboard.healthReady": "Tất cả hệ thống đã sẵn sàng",
  "dashboard.healthError": "Không thể kết nối tới workspace API",
  "dashboard.retry": "Thử lại",
  "dashboard.activePeople": "Nhân sự hoạt động",
  "dashboard.openTasks": "Công việc đang mở",
  "dashboard.dueThisWeek": "Hạn trong tuần",
  "dashboard.completionRate": "Tỷ lệ hoàn thành",
  "dashboard.emptyTitle": "Dashboard đã sẵn sàng",
  "dashboard.emptyDescription": "Hoạt động của đội ngũ sẽ xuất hiện khi các quy trình đầu tiên được kết nối.",
  "dashboard.priorityTitle": "Cần chú ý",
  "dashboard.priorityEmpty": "Hiện không có việc khẩn cấp",
  "dashboard.priorityEmptyDescription": "Các phê duyệt và công việc quá hạn sẽ xuất hiện tại đây.",
  "error.title": "Không thể tải trang này",
  "error.description": "Sự cố có thể chỉ là tạm thời. Hãy thử tải lại workspace.",
  "error.retry": "Tải lại trang",
  "loading.label": "Đang tải workspace",
};

const messages: Record<Locale, Partial<Record<MessageKey, string>>> = {
  en: englishMessages,
  vi: vietnameseMessages,
};

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function resolveMessage(locale: Locale, key: MessageKey): string {
  return messages[locale][key] ?? messages[FALLBACK_LOCALE][key] ?? key;
}
