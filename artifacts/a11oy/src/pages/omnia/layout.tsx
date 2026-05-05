import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import {
  Activity,
  BookOpen,
  Globe,
  Layers,
  Network,
  Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const ACCENT = '#8b7ac8';
const BG = 'var(--gi-bg-base)';
const SURFACE = 'rgba(255,255,255,0.025)';
const BORDER = `rgba(139,122,200,0.14)`;

const NAV_ITEMS = [
  { href: '/omnia', label: 'OMNIA Hub', icon: Network },
  { href: '/omnia/world-model', label: 'World Model', icon: Layers },
  { href: '/omnia/narrative', label: 'Synthesis Narrative', icon: BookOpen },
  { href: '/omnia/ripple', label: 'Ripple View', icon: Activity },
  { href: '/omnia/story', label: 'Public Story Mode', icon: Globe },
];

interface OmniaLayoutProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export function OmniaLayout({ title, subtitle, children }: OmniaLayoutProps) {
  const [location] = useLocation();

  return (
    <div
      style={{
        background: BG,
        minHeight: '100vh',
        color: 'rgba(235,230,220,0.9)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 44px)' }}>
        <nav
          style={{
            width: 200,
            flexShrink: 0,
            borderRight: `1px solid ${BORDER}`,
            background: 'rgba(255,255,255,0.012)',
            padding: '16px 12px',
            position: 'sticky',
            top: 44,
            height: 'calc(100vh - 44px)',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '4px 8px 12px',
              marginBottom: 4,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <Network size={13} style={{ color: ACCENT }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: ACCENT,
              }}
            >
              OMNIA
            </span>
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== '/omnia' && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={`${BASE}${item.href}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 7,
                  textDecoration: 'none',
                  marginBottom: 2,
                  background: isActive ? `${ACCENT}18` : 'transparent',
                  color: isActive ? 'rgba(235,230,220,0.95)' : 'rgba(255,255,255,0.5)',
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  transition: 'all 0.12s',
                  borderLeft: isActive ? `2px solid ${ACCENT}` : '2px solid transparent',
                }}
              >
                <Icon size={13} style={{ color: isActive ? ACCENT : 'rgba(255,255,255,0.4)' }} />
                {item.label}
              </Link>
            );
          })}

          <div style={{ marginTop: 16, padding: '8px 8px 0', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>
              Portfolio
            </div>
            {[
              { href: '/', label: 'Holdings', accent: '#c9b787' },
              { href: '/sentra', label: 'Sentra', accent: '#c9b787' },
              { href: '/terra', label: 'DOMAINE', accent: '#22c55e' },
              { href: '/vessels', label: 'SEXTANT', accent: '#4d8fcc' },
              { href: '/counsel', label: 'Counsel', accent: '#8b5cf6' },
              { href: '/a11oy', label: 'A11oy', accent: '#c9b787' },
            ].map((app) => (
              <a
                key={app.href}
                href={app.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '5px 8px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: 'rgba(255,255,255,0.38)',
                  fontSize: 12,
                  marginBottom: 1,
                  transition: 'color 0.12s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = app.accent; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.38)'; }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: app.accent, flexShrink: 0 }} />
                {app.label}
              </a>
            ))}
          </div>
        </nav>

        <main style={{ flex: 1, minWidth: 0, padding: '28px 32px' }}>
          {(title || subtitle) && (
            <div style={{ marginBottom: 24 }}>
              {title && (
                <h1 style={{ fontSize: 22, fontWeight: 600, color: 'rgba(235,230,220,0.95)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Zap size={18} style={{ color: ACCENT }} />
                  {title}
                </h1>
              )}
              {subtitle && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
