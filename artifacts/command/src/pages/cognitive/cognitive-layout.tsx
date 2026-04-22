import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import {
  Activity,
  Archive,
  Brain,
  CheckCircle2,
  Cpu,
  GitMerge,
  Globe,
  Lightbulb,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const ACCENT = '#8b7ac8';
const BG = '#080c14';
const BORDER = 'rgba(139,122,200,0.12)';

const NAV_ITEMS = [
  { href: '/cognitive', label: 'Command Center', icon: Brain },
  { href: '/cognitive/loop', label: 'Live Loop', icon: Activity },
  { href: '/cognitive/self-model', label: 'Self Model', icon: Cpu },
  { href: '/cognitive/world-model', label: 'World Model', icon: Globe },
  { href: '/cognitive/memory', label: 'Memory Explorer', icon: Archive },
  { href: '/cognitive/planner', label: 'Planner Studio', icon: GitMerge },
  { href: '/cognitive/verifier', label: 'Verifier Console', icon: CheckCircle2 },
  { href: '/cognitive/reflection', label: 'Reflection Console', icon: Lightbulb },
];

interface CognitiveLayoutProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export function CognitiveLayout({ title, subtitle, children }: CognitiveLayoutProps) {
  const [location] = useLocation();

  return (
    <div
      style={{
        background: BG,
        minHeight: '100vh',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />
      <div
        style={{
          borderBottom: `1px solid ${BORDER}`,
          background: 'rgba(6,10,18,0.95)',
          backdropFilter: 'blur(8px)',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/cognitive'
                ? location === '/cognitive'
                : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={`${BASE}${item.href}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '8px 12px',
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? ACCENT : 'rgba(255,255,255,0.4)',
                  borderBottom: isActive ? `2px solid ${ACCENT}` : '2px solid transparent',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.12s',
                }}
              >
                <Icon
                  style={{
                    width: 12,
                    height: 12,
                    color: isActive ? ACCENT : 'rgba(255,255,255,0.25)',
                  }}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>
        {title && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>{title}</span>
              <span
                style={{
                  fontSize: 10,
                  color: ACCENT,
                  background: `${ACCENT}18`,
                  padding: '2px 10px',
                  borderRadius: 20,
                  border: `1px solid ${ACCENT}40`,
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              >
                COGNITIVE
              </span>
            </div>
            {subtitle && <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
