import {
  Activity,
  BarChart2,
  BookOpen,
  BookmarkCheck,
  ChevronRight,
  Cpu,
  FileText,
  type LucideProps,
  MessageSquare,
  Network,
  Radio,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

type LucideIcon = ComponentType<LucideProps>;

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/pulse';

const NAV_ITEMS = [
  { href: `${BASE}/`, label: "Today's Brief", icon: Radio },
  { href: `${BASE}/watchlist`, label: 'My Watchlist', icon: BookmarkCheck },
  { href: `${BASE}/library`, label: 'Briefing Library', icon: BookOpen },
  { href: `${BASE}/engine`, label: 'Brief Engine', icon: Cpu },
  { href: `${BASE}/confidence`, label: 'Confidence', icon: BarChart2 },
  { href: `${BASE}/custom`, label: 'Custom Brief', icon: FileText },
  { href: `${BASE}/dissent`, label: 'Dissent Channel', icon: MessageSquare },
  { href: `${BASE}/constellation`, label: 'Constellation', icon: Network },
  { href: `${BASE}/governed-cockpit`, label: 'Governed Intelligence', icon: Shield },
  { href: `${BASE}/system`, label: 'System Health', icon: Activity },
  { href: `${BASE}/settings`, label: 'Settings', icon: Settings },
];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  const [location] = useLocation();
  const isActive =
    location === href ||
    (href.endsWith('/') && location === href.slice(0, -1)) ||
    (label === "Today's Brief" &&
      (location === BASE || location === `${BASE}/` || location === '/'));

  return (
    <Link href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
      <Icon size={15} strokeWidth={1.75} />
      <span>{label}</span>
      {isActive && <ChevronRight size={12} className="ml-auto opacity-60" />}
    </Link>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--pulse-bg)',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 224,
          flexShrink: 0,
          background: 'var(--pulse-bg-2)',
          borderRight: '1px solid var(--pulse-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--pulse-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'linear-gradient(135deg, rgba(200,168,75,0.2), rgba(200,168,75,0.05))',
                border: '1px solid rgba(200,168,75,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={14} color="#c8a84b" strokeWidth={2} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#e8edf8',
                  letterSpacing: '-0.01em',
                }}
              >
                Pulse
              </div>
              <div
                style={{
                  fontSize: '0.6rem',
                  color: 'var(--pulse-text-muted)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                AI Briefing
              </div>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--pulse-border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: 'rgba(78,202,139,0.08)',
              borderRadius: 6,
              border: '1px solid rgba(78,202,139,0.15)',
            }}
          >
            <div
              className="live-indicator"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#4eca8b',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '0.67rem',
                color: '#4eca8b',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Live · Daily Brief Active
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
                padding: '4px 12px 8px',
              }}
            >
              Intelligence
            </div>
            {NAV_ITEMS.slice(0, 5).map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
          <div>
            <div
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
                padding: '12px 12px 8px',
              }}
            >
              System
            </div>
            {NAV_ITEMS.slice(5).map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        </nav>

        {/* Classification footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--pulse-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={11} color="var(--pulse-gold)" />
            <span
              style={{
                fontSize: '0.6rem',
                color: 'var(--pulse-gold-dim)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              SZL-EXEC-RESTRICTED
            </span>
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--pulse-text-muted)', marginTop: 3 }}>
            {dateStr}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Classification bar */}
        <div
          className="classification-bar"
          style={{
            padding: '6px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={11} color="var(--pulse-gold)" />
            <span
              style={{
                fontSize: '0.65rem',
                color: 'var(--pulse-gold)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              SZL-EXEC-RESTRICTED · NOFORN · PROPRIETARY INTELLIGENCE
            </span>
          </div>
          <span style={{ fontSize: '0.62rem', color: 'var(--pulse-text-muted)' }}>
            Counsel v3.1 · Multi-Agent Synthesis
          </span>
        </div>

        {/* Page content */}
        <div style={{ flex: 1 }}>{children}</div>
      </main>
    </div>
  );
}
