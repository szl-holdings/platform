import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

function b(path: string) {
  return path === '/' ? `${BASE}/` : `${BASE}${path}`;
}

const NAV_GROUPS = [
  {
    label: 'NOW',
    items: [
      { href: '/',      label: 'Hero',          icon: '◈' },
      { href: '/now',   label: 'Now Board',     icon: '⬡' },
      { href: '/command', label: 'Command',     icon: '▸' },
    ],
  },
  {
    label: 'FABRIC',
    items: [
      { href: '/signals',    label: 'Signal Mesh',    icon: '∿' },
      { href: '/actions',    label: 'Action Rail',    icon: '→' },
      { href: '/proof',      label: 'Proof Ledger',   icon: '◇' },
      { href: '/governance', label: 'Governance',     icon: '⚖' },
    ],
  },
  {
    label: 'RUNTIME',
    items: [
      { href: '/agents',    label: 'Operators',       icon: '◎' },
      { href: '/workcells', label: 'Workcells',       icon: '△' },
      { href: '/evals',     label: 'MirrorEval',      icon: '⟺' },
      { href: '/replay',    label: 'Replay',          icon: '⟲' },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { href: '/connectors',   label: 'Connectors',   icon: '⬟' },
      { href: '/twins',        label: 'Twin Foundry', icon: '⊕' },
      { href: '/model-router', label: 'Model Router', icon: '⊞' },
      { href: '/skills',       label: 'Skills',       icon: '⊗' },
    ],
  },
  {
    label: 'TRUST',
    items: [
      { href: '/trust',         label: 'Trust Center',  icon: '◆' },
      { href: '/sovereign',     label: 'Sovereign',     icon: '⬛' },
      { href: '/boardroom',     label: 'Boardroom',     icon: '▣' },
      { href: '/investor-demo', label: 'Investor Demo', icon: '▶' },
    ],
  },
];

function useActiveRoute() {
  const [location] = useLocation();
  return location;
}

interface LayoutProps {
  children: ReactNode;
  fullscreen?: boolean;
}

export function Layout({ children, fullscreen = false }: LayoutProps) {
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return sessionStorage.getItem('a11oy-banner-dismissed') === '1'; } catch { return false; }
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useActiveRoute();

  function dismissBanner() {
    try { sessionStorage.setItem('a11oy-banner-dismissed', '1'); } catch {}
    setBannerDismissed(true);
  }

  if (fullscreen) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-a11oy-navy)', color: 'var(--color-a11oy-text)' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-a11oy-navy)', color: 'var(--color-a11oy-text)' }}>
      {!bannerDismissed && (
        <div
          className="flex items-center justify-between gap-4 px-4 py-2 text-xs font-mono"
          style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#f59e0b' }} />
            Active prototype — demo data unless connectors are configured
          </div>
          <button
            onClick={dismissBanner}
            className="opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
      <div
        className="flex items-center justify-between px-4 h-12 border-b sticky top-0 z-40 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(10,15,30,0.94)', borderColor: 'var(--color-a11oy-border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="w-7 h-7 flex items-center justify-center rounded text-sm transition-colors"
            style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ☰
          </button>
          <Link
            href={b('/')}
            className="flex items-center gap-2"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center font-mono text-xs font-bold"
              style={{ backgroundColor: 'var(--color-a11oy-blue)', color: 'white' }}
            >
              A
            </div>
            <span className="font-display font-semibold text-sm tracking-tight" style={{ color: 'var(--color-a11oy-text)' }}>
              A11oy
            </span>
            <span className="font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)', fontSize: '9px' }}>
              DEMO
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: '#10b981' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
            <span className="font-mono">Fabric operational</span>
          </div>
          <Link
            href={b('/investor-demo')}
            className="text-xs px-3 py-1.5 rounded font-medium"
            style={{ backgroundColor: 'var(--color-a11oy-blue)', color: 'white', textDecoration: 'none' }}
          >
            Investor Demo
          </Link>
        </div>
      </div>
      <div className="flex flex-1" style={{ minHeight: 0 }}>
        {sidebarOpen && (
          <aside
            className="w-52 border-r flex-shrink-0 overflow-y-auto py-4"
            style={{ backgroundColor: 'var(--color-a11oy-deep)', borderColor: 'var(--color-a11oy-border)', position: 'sticky', top: 48, height: 'calc(100vh - 48px)' }}
          >
            {NAV_GROUPS.map(group => (
              <div key={group.label} className="mb-5">
                <div
                  className="px-4 mb-1.5 text-xs font-mono font-medium tracking-widest"
                  style={{ color: 'var(--color-a11oy-text-ghost)' }}
                >
                  {group.label}
                </div>
                {group.items.map(item => {
                  const fullHref = b(item.href);
                  const isActive =
                    item.href === '/'
                      ? location === fullHref || location === BASE || location === `${BASE}/`
                      : location.startsWith(fullHref);
                  return (
                    <Link
                      key={item.href}
                      href={fullHref}
                      className="flex items-center gap-2.5 px-4 py-1.5 text-sm transition-colors"
                      style={{
                        textDecoration: 'none',
                        color: isActive ? 'var(--color-a11oy-text)' : 'var(--color-a11oy-text-sub)',
                        backgroundColor: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                        borderLeft: isActive ? '2px solid var(--color-a11oy-blue)' : '2px solid transparent',
                        fontWeight: isActive ? 500 : 400,
                        display: 'flex',
                      }}
                    >
                      <span className="text-xs w-4 text-center flex-shrink-0" style={{ color: isActive ? 'var(--color-a11oy-blue)' : 'var(--color-a11oy-text-ghost)' }}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </aside>
        )}
        <main className="flex-1 overflow-y-auto p-6" style={{ minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
