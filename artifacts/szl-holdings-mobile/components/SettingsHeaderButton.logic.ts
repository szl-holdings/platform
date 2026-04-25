export function formatBadgeCount(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function shouldShowBadge(count: number): boolean {
  return count > 0;
}

export interface NotificationItem {
  isRead: boolean;
}

export type NotificationsResponse =
  | NotificationItem[]
  | { data?: NotificationItem[] };

export function deriveUnreadCount(raw: NotificationsResponse | undefined): number {
  if (!raw) return 0;
  const arr = Array.isArray(raw)
    ? raw
    : ((raw as { data?: NotificationItem[] }).data ?? []);
  return arr.filter((n) => !n.isRead).length;
}
