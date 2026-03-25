export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DateRange {
  from: string;
  to: string;
}

export interface SelectOption {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
  isActive?: boolean;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "flat";
  icon?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
  actor?: string;
  metadata?: Record<string, unknown>;
}

export type Status = "active" | "inactive" | "pending" | "error" | "completed";

export interface NotificationPayload {
  type: "info" | "success" | "warning" | "error" | "action_required";
  channel: "in_app" | "email" | "sms" | "slack";
  title: string;
  message: string;
  userId: number;
  actionUrl?: string;
}
