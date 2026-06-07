import React, { useRef, useState } from 'react';
import { Bell, CheckCheck, ExternalLink, Shield, Ship, X } from 'lucide-react';
import { useOmniaShell } from './OmniaShellProvider.js';
import type { OmniaNotification } from './types.js';

const LEVEL_STYLES: Record<OmniaNotification['level'], { dot: string; border: string; bg: string }> = {
  critical: { dot: '#ef4444', border: 'rgba(239,68,68,0.25)', bg: 'rgba(239,68,68,0.06)' },
  warning: { dot: '#f59e0b', border: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.06)' },
  info: { dot: '#3b82f6', border: 'rgba(59,130,246,0.25)', bg: 'rgba(59,130,246,0.06)' },
  success: { dot: '#22c55e', border: 'rgba(34,197,94,0.25)', bg: 'rgba(34,197,94,0.06)' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function OmniaNotificationInbox({ accentColor = '#8b7ac8' }: { accentColor?: string }) {
  const { notifications, unreadCount, markNotificationRead } = useOmniaShell();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button
        onClick={() => setOpen((p) => !p)}
        title={`${unreadCount} unread OMNIA notifications`}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 34,
          height: 34,
          background: open ? `${accentColor}18` : 'transparent',
          border: `1px solid ${open ? `${accentColor}40` : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 8,
          cursor: 'pointer',
          color: 'rgba(235,230,220,0.8)',
          transition: 'all 0.15s',
        }}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ef4444',
              border: '1.5px solid #0a0a0a',
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 360,
            background: '#0f1520',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: accentColor, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                OMNIA
              </span>
              <span style={{ color: 'rgba(235,230,220,0.6)', fontSize: 13 }}>
                Portfolio Events
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    padding: '1px 6px',
                    background: `${accentColor}20`,
                    border: `1px solid ${accentColor}40`,
                    borderRadius: 10,
                    fontSize: 11,
                    color: accentColor,
                    fontWeight: 600,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                No events yet
              </div>
            ) : (
              notifications.map((n) => {
                const styles = LEVEL_STYLES[n.level];
                return (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    style={{
                      padding: '11px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: n.read ? 'transparent' : styles.bg,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span
                        style={{
                          flexShrink: 0,
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: n.read ? 'rgba(255,255,255,0.2)' : styles.dot,
                          marginTop: 5,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                            {n.artifactName}
                          </span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                            {relativeTime(n.timestamp)}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 500, color: n.read ? 'rgba(235,230,220,0.6)' : 'rgba(235,230,220,0.9)', marginBottom: 3 }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                          {n.message}
                        </div>
                        {n.actionUrl && (
                          <a
                            href={n.actionUrl}
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, color: accentColor, textDecoration: 'none', opacity: 0.8 }}
                          >
                            View <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.some((n) => !n.read) && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => notifications.forEach((n) => markNotificationRead(n.id))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: accentColor,
                  padding: 0,
                }}
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
