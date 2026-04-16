import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Filter, RefreshCw, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageDataSkeleton, EmptyState, ErrorState } from "@szl/shared-ui";

interface Notification {
  id: number;
  userId: number;
  type: string;
  channel: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  appId?: string;
}

const APP_SOURCES = [
  { id: "all", label: "All Sources" },
  { id: "aegis", label: "Aegis" },
  { id: "vessels", label: "Vessels" },
  { id: "terra", label: "Terra" },
  { id: "lyte", label: "Lyte" },
  { id: "carlota-jo", label: "Carlota Jo" },
  { id: "alloy", label: "Alloy" },
  { id: "system", label: "System" },
];

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  action_required: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

const TYPE_DOT: Record<string, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  success: "bg-emerald-500",
  action_required: "bg-violet-500",
};

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

function NotificationRow({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const typeColor = TYPE_COLORS[notification.type] ?? TYPE_COLORS.info;
  const typeDot = TYPE_DOT[notification.type] ?? TYPE_DOT.info;

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-5 py-4 border-b border-border/40 transition-colors hover:bg-white/[0.02]",
        !notification.isRead && "bg-white/[0.015]"
      )}
    >
      <div className="flex-shrink-0 mt-1.5">
        <div className={cn("w-2 h-2 rounded-full", typeDot, notification.isRead && "opacity-30")} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", typeColor)}>
              {notification.type.replace("_", " ").toUpperCase()}
            </span>
            {notification.appId && notification.appId !== "system" && (
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {notification.appId}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{formatRelative(notification.createdAt)}</span>
        </div>

        <p className={cn("text-sm font-medium mb-0.5", notification.isRead ? "text-foreground/60" : "text-foreground")}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>

        {notification.actionUrl && (
          <a
            href={notification.actionUrl}
            className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            View details <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notification.isRead && (
          <button
            onClick={() => onMarkRead(notification.id)}
            title="Mark as read"
            className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-emerald-400 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          title="Delete"
          className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsInbox() {
  const [filterSource, setFilterSource] = useState("all");
  const [filterRead, setFilterRead] = useState<"all" | "unread" | "read">("all");
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<Notification[]>({
    queryKey: ["notifications-inbox"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=100");
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error("Failed to load notifications");
      }
      const json = await res.json();
      return (json.data ?? json) as Notification[];
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark as read");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications-inbox"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark all as read");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications-inbox"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete notification");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications-inbox"] }),
  });

  const notifications = data ?? [];

  const filtered = notifications.filter((n) => {
    const sourceMatch = filterSource === "all" || (n.appId ?? "system") === filterSource;
    const readMatch =
      filterRead === "all" ||
      (filterRead === "unread" && !n.isRead) ||
      (filterRead === "read" && n.isRead);
    return sourceMatch && readMatch;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-white/6 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Platform-wide alerts and updates from all SZL Intelligence workspaces.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border/60 bg-card/60">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(["all", "unread", "read"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFilterRead(v)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                    filterRead === v
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
              <div className="w-px h-4 bg-border mx-1 shrink-0" />
              {APP_SOURCES.map((src) => (
                <button
                  key={src.id}
                  onClick={() => setFilterSource(src.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                    filterSource === src.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {src.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="p-4">
              <PageDataSkeleton variant="list" rows={5} />
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState
                compact
                title="Unable to load notifications"
                description="You may need to sign in, or there was a problem reaching the server."
                onRetry={() => refetch()}
                retryLabel="Retry"
                onReset={() => { window.location.href = "/api/auth/login"; }}
                resetLabel="Sign In"
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 px-4">
              <EmptyState
                compact
                icon={CheckCheck}
                headline={filterRead === "unread" ? "No unread notifications" : "No notifications"}
                description={
                  filterRead === "unread"
                    ? "You're all caught up."
                    : "New alerts from your workspaces will appear here."
                }
              />
            </div>
          ) : (
            <div>
              {filtered.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
                {filterRead !== "all" ? ` (${filterRead})` : ""}
                {filterSource !== "all" ? ` from ${filterSource}` : ""}
              </p>
              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
