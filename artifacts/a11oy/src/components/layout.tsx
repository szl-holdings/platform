import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-a11oy-navy)', color: 'var(--color-a11oy-text)' }}>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header
      className="border-b sticky top-0 z-50 backdrop-blur-sm"
      style={{
        backgroundColor: 'rgba(10, 15, 30, 0.92)',
        borderColor: 'var(--color-a11oy-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href={`${BASE}/`}
            style={{ textDecoration: 'none' }}
            className="flex items-center gap-3"
          >
            <div
              className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold"
              style={{ backgroundColor: 'var(--color-a11oy-blue)', color: 'white' }}
            >
              A
            </div>
            <span className="font-display font-semibold tracking-tight" style={{ fontSize: '0.9rem', color: 'var(--color-a11oy-text)' }}>
              A11oy
            </span>
          </a>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-sub)', fontSize: '10px' }}
          >
            v0.1
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <NavLink href={`${BASE}/fabric`}>Fabric</NavLink>
          <NavLink href={`${BASE}/command`}>Command</NavLink>
          <a
            href={`${BASE}/command`}
            className="text-xs px-3 py-1.5 rounded font-medium transition-all"
            style={{
              backgroundColor: 'var(--color-a11oy-blue)',
              color: 'white',
              textDecoration: 'none',
            }}
          >
            Request Access
          </a>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-sm transition-colors"
      style={{ color: 'var(--color-a11oy-text-sub)', textDecoration: 'none' }}
      onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--color-a11oy-text)'; }}
      onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--color-a11oy-text-sub)'; }}
    >
      {children}
    </a>
  );
}

function Footer() {
  return (
    <footer
      className="border-t py-8 mt-16"
      style={{ borderColor: 'var(--color-a11oy-border)', backgroundColor: 'var(--color-a11oy-deep)' }}
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>A11oy</span>
          <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Live Enterprise Execution Fabric</span>
        </div>
        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Phase 1 Foundation — Proof-Carrying Execution
        </div>
      </div>
    </footer>
  );
}
