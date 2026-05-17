import type { ReactNode } from 'react';
import { Link } from 'wouter';

const T = {
  bg: '#0a0a0a',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  sub: '#8a8a8a',
  gold: '#c9b787',
};

interface CommandShellProps {
  active: 'home' | 'inbox' | 'proposals' | 'approvals';
  children: ReactNode;
}

const NAV: Array<{ key: CommandShellProps['active']; label: string; href: string }> = [
  { key: 'home', label: 'Home', href: '/a11oy/command' },
  { key: 'inbox', label: 'Frontier Inbox', href: '/a11oy/command/inbox' },
  { key: 'proposals', label: 'Frontier Proposals', href: '/a11oy/command/frontier/proposals' },
  { key: 'approvals', label: 'Approvals', href: '/a11oy/command/approvals' },
];

export function CommandShell({ active, children }: CommandShellProps) {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'system-ui, sans-serif' }}>
      <header
        style={{
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          background: 'rgba(255,255,255,0.015)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: T.gold,
              marginBottom: 2,
            }}
          >
            A11OY · COMMAND
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Operator Console</div>
        </div>
        <nav style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {NAV.map((item) => {
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                style={{
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: isActive ? T.gold : T.sub,
                  textDecoration: 'none',
                  padding: '4px 10px',
                  border: `1px solid ${isActive ? 'rgba(201,183,135,0.3)' : T.border}`,
                  background: isActive ? 'rgba(201,183,135,0.08)' : 'transparent',
                  borderRadius: 6,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>{children}</main>
    </div>
  );
}
