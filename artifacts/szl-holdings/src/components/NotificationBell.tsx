import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useAuth } from '@szl-holdings/replit-auth-web';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl: string | null;
}

const TYPE_DOT: Record<string, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  success: '#10b981',
  action_required: '#8b5cf6',
};

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  const { data } = useStandardQuery<Notification[]>({
    queryKey: ['navbar-notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=100');
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to load');
      }
      const json = await res.json();
      return (json.data ?? json) as Notification[];
    },
    enabled: isAuthenticated,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: false,
  });

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const recentFive = notifications.slice(0, 5);

  useEffect(() => {
    if (!isAuthenticated) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let dead = false;

    function connect() {
      if (dead) return;
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        ws?.send(JSON.stringify({ type: 'subscribe', channel: 'notifications' }));
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as { type: string; channel?: string };
          if (msg.type === 'message' && msg.channel === 'notifications') {
            void queryClient.invalidateQueries({ queryKey: ['navbar-notifications'] });
          }
        } catch {
          // ignore
        }
      };
      ws.onclose = () => {
        if (!dead) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      dead = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [queryClient, isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const markReadMutation = useStandardMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark as read');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['navbar-notifications'] });
    },
  });

  if (isLoading || !isAuthenticated) return null;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          background: open ? 'hsla(0,0%,100%,0.07)' : 'transparent',
          border: '1px solid hsla(0,0%,100%,0.08)',
          borderRadius: '4px',
          color: open ? 'hsl(38,12%,88%)' : 'hsl(210,5%,60%)',
          cursor: 'pointer',
          transition: 'color 0.18s ease, background 0.18s ease',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.color = 'hsl(38,12%,88%)';
            (e.currentTarget as HTMLButtonElement).style.background = 'hsla(0,0%,100%,0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.color = 'hsl(210,5%,60%)';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              minWidth: '14px',
              height: '14px',
              borderRadius: '7px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: '1',
              pointerEvents: 'none',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '340px',
              background: 'hsl(210,12%,8%)',
              border: '1px solid hsla(0,0%,100%,0.09)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px hsla(0,0%,0%,0.6)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid hsla(0,0%,100%,0.07)',
              }}
            >
              <span style={{ color: 'hsl(38,12%,88%)', fontSize: '13px', fontWeight: 600 }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{ fontSize: '11px', color: 'hsl(210,5%,48%)' }}>
                  {unreadCount} unread
                </span>
              )}
            </div>

            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: 'hsl(210,5%,45%)',
                  fontSize: '13px',
                }}
              >
                No notifications
              </div>
            ) : (
              <div>
                {recentFive.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '11px 16px',
                      borderBottom: '1px solid hsla(0,0%,100%,0.04)',
                      background: n.isRead ? 'transparent' : 'hsla(0,0%,100%,0.02)',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: n.isRead ? 'hsl(210,5%,28%)' : (TYPE_DOT[n.type] ?? '#3b82f6'),
                        marginTop: '5px',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          color: n.isRead ? 'hsl(210,5%,50%)' : 'hsl(38,12%,85%)',
                          fontSize: '12px',
                          fontWeight: n.isRead ? 400 : 500,
                          marginBottom: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={
                          {
                            color: 'hsl(210,5%,44%)',
                            fontSize: '11px',
                            lineHeight: '1.4',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          } as React.CSSProperties
                        }
                      >
                        {n.message}
                      </div>
                      <div
                        style={{
                          marginTop: '4px',
                          color: 'hsl(210,5%,36%)',
                          fontSize: '10px',
                        }}
                      >
                        {formatRelative(n.createdAt)}
                      </div>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markReadMutation.mutate(n.id)}
                        title="Mark as read"
                        disabled={markReadMutation.isPending}
                        style={{
                          flexShrink: 0,
                          background: 'transparent',
                          border: '1px solid hsla(0,0%,100%,0.08)',
                          cursor: 'pointer',
                          color: 'hsl(210,5%,45%)',
                          padding: '3px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '2px',
                          transition: 'color 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#10b981';
                          (e.currentTarget as HTMLButtonElement).style.borderColor =
                            'rgba(16,185,129,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = 'hsl(210,5%,45%)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor =
                            'hsla(0,0%,100%,0.08)';
                        }}
                      >
                        <Check size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid hsla(0,0%,100%,0.07)',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                style={{
                  fontSize: '12px',
                  color: 'hsl(192,72%,48%)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'hsl(192,72%,60%)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'hsl(192,72%,48%)';
                }}
              >
                View all notifications →
              </Link>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
