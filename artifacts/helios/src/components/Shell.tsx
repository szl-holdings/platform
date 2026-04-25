import {
  Activity,
  BarChart3,
  Brain,
  ChevronRight,
  Cpu,
  FileText,
  FlameKindling,
  type LucideProps,
  Radar,
  Settings,
  Sparkles,
  Sun,
  Telescope,
  Zap,
} from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

type LucideIcon = ComponentType<LucideProps>;

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/helios';

const NAV_GROUPS = [
  {
    label: 'Intelligence',
    items: [
      { href: `${BASE}/`, label: 'Frontier Feed', icon: Radar },
      { href: `${BASE}/mythos`, label: 'Mythos Index', icon: Brain },
      { href: `${BASE}/memos`, label: 'Recalibration Memos', icon: FileText },
    ],
  },
  {
    label: 'Evolution',
    items: [
      { href: `${BASE}/proposals`, label: 'Capability Proposals', icon: Sparkles },
      { href: `${BASE}/benchmarks`, label: 'Benchmark Scoreboard', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { href: `${BASE}/scanners`, label: 'Scanner Admin', icon: Cpu },
      { href: `${BASE}/system`, label: 'System Health', icon: Activity },
    ],
  },
];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  const [location] = useLocation();
  const isActive =
    location === href ||
    (href.endsWith('/') && location === href.slice(0, -1)) ||
    (label === 'Frontier Feed' &&
      (location === BASE || location === `${BASE}/` || location === '/'));

  return (
    <Link href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
      <Icon size={14} strokeWidth={1.75} />
      <span>{label}</span>
      {isActive && <ChevronRight size={11} className="ml-auto opacity-60" />}
    </Link>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--helios-bg)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 228,
          flexShrink: 0,
          background: 'var(--helios-bg-2)',
          borderRight: '1px solid var(--helios-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--helios-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="glow-pulse"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'radial-gradient(circle at 40% 40%, rgba(245,158,11,0.4), rgba(245,158,11,0.05))',
                border: '1px solid rgba(245,158,11,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sun size={15} color="#f59e0b" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.01em' }}>
                HELIOS
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--helios-amber)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                Frontier Engine
              </div>
            </div>
          </div>
        </div>

        {/* Scan status indicator */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--helios-border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: 'rgba(245,158,11,0.06)',
              borderRadius: 6,
              border: '1px solid rgba(245,158,11,0.15)',
            }}
          >
            <div
              className="solar-pulse"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#f59e0b',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '0.67rem', color: '#f59e0b', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Scanning Frontier
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '10px 10px', flex: 1, overflowY: 'auto' }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{
                fontSize: '0.58rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--helios-text-muted)',
                padding: '10px 12px 6px',
              }}>
                {group.label}
              </div>
              {group.items.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          ))}
        </nav>

        {/* Ecosystem links */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--helios-border)' }}>
          <div style={{ fontSize: '0.58rem', color: 'var(--helios-text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Ecosystem
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Pulse', href: '/pulse/' },
              { label: 'Command', href: '/command/' },
              { label: 'Sentra', href: '/sentra/' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 8px',
                  fontSize: '0.75rem',
                  color: 'var(--helios-text-muted)',
                  textDecoration: 'none',
                  borderRadius: 4,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--helios-text-dim)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--helios-text-muted)')}
              >
                <Zap size={10} />
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--helios-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FlameKindling size={10} color="var(--helios-amber)" />
            <span style={{ fontSize: '0.6rem', color: 'var(--helios-amber-dim)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              EVOLUTION LOOP ACTIVE
            </span>
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--helios-text-muted)', marginTop: 2 }}>
            Helios v1.0 · Daily cadence
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Top classification bar */}
        <div
          style={{
            padding: '5px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            borderBottom: '1px solid var(--helios-border)',
            background: 'rgba(245,158,11,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Telescope size={10} color="var(--helios-amber)" />
            <span style={{ fontSize: '0.62rem', color: 'var(--helios-amber)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              HELIOS · FRONTIER INTELLIGENCE ENGINE · SZL-RESTRICTED
            </span>
          </div>
          <span style={{ fontSize: '0.6rem', color: 'var(--helios-text-muted)' }}>
            Agent Evolution Loop · Public Data Sources Only
          </span>
        </div>

        {/* Page content */}
        <div style={{ flex: 1 }}>{children}</div>
      </main>
    </div>
  );
}
