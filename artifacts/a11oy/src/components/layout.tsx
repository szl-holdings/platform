import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

function b(path: string) {
  return path === '/' ? `${BASE}/` : `${BASE}${path}`;
}

const NAV_GROUPS = [
  {
    label: 'SYSTEM',
    items: [
      { href: '/',              label: 'Home' },
      { href: '/architecture',  label: 'Architecture' },
      { href: '/applications',  label: 'Applications' },
      { href: '/resources',     label: 'Resources' },
      { href: '/constellation', label: 'Constellation' },
    ],
  },
  {
    label: 'NOW',
    items: [
      { href: '/now',     label: 'Now Board' },
      { href: '/command', label: 'Command' },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { href: '/recommendations', label: 'Recommendations' },
      { href: '/brief',           label: 'Executive Brief' },
      { href: '/frontier',        label: 'Frontier Intel' },
    ],
  },
  {
    label: 'FABRIC',
    items: [
      { href: '/fabric',     label: 'Fabric' },
      { href: '/verticals',  label: 'Verticals' },
      { href: '/signals',    label: 'Signal Mesh' },
      { href: '/outcomes',   label: 'Outcomes' },
      { href: '/actions',    label: 'Action Rail' },
      { href: '/proof',      label: 'Proof Ledger' },
      { href: '/governance', label: 'Governance' },
    ],
  },
  {
    label: 'PIPELINE',
    items: [
      { href: '/pipeline',        label: 'Live Pipeline' },
      { href: '/intent-router',   label: 'Intent Router' },
      { href: '/planner',         label: 'Planner Canvas' },
      { href: '/ontology',        label: 'Ontology Graph' },
      { href: '/learning',        label: 'Learning Loop' },
      { href: '/counterfactuals', label: 'Counterfactuals' },
      { href: '/adversarial',     label: 'Adversarial' },
    ],
  },
  {
    label: 'RUNTIME',
    items: [
      { href: '/agents',         label: 'Operators' },
      { href: '/workcells',      label: 'Workcells' },
      { href: '/evals',          label: 'MirrorEval' },
      { href: '/approval-queue', label: 'Approval Queue' },
      { href: '/verifier',       label: 'Verifier Agent' },
      { href: '/memory',         label: 'Memory' },
      { href: '/pce',            label: 'PCE' },
    ],
  },
  {
    label: 'AGENTIC',
    items: [
      { href: '/orchestration', label: 'Orchestration' },
      { href: '/agent-mesh',    label: 'Agent Mesh' },
      { href: '/agent-viz',     label: 'Visualization' },
      { href: '/sdk',           label: 'a11oy SDK' },
      { href: '/a11oy-code',    label: 'a11oy Code' },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { href: '/tools',        label: 'Tools' },
      { href: '/skills',       label: 'Skills' },
      { href: '/model-router', label: 'Model Router' },
      { href: '/connectors',   label: 'Connectors' },
      { href: '/twins',        label: 'Twin Foundry' },
      { href: '/terminal',     label: 'Terminal' },
    ],
  },
  {
    label: 'AGI',
    items: [
      { href: '/convergence', label: 'AGI Convergence' },
    ],
  },
  {
    label: 'DOCTRINE',
    items: [
      { href: '/doctrine',              label: 'Mythos Overview' },
      { href: '/risk-reports',           label: 'Risk Reports' },
      { href: '/behavioral-audit',       label: 'Behavioral Audit' },
      { href: '/covenant-lift',          label: 'Covenant Lift' },
      { href: '/code-behaviors',         label: 'Code Behaviors' },
      { href: '/reward-hacking',         label: 'Reward Hacking' },
      { href: '/alignment-review',       label: 'Alignment Review' },
      { href: '/snapshot-provenance',    label: 'Snapshot Provenance' },
      { href: '/ai-user-turn',           label: 'AI-User Turn' },
      { href: '/welfare',                label: 'Agent Welfare' },
      { href: '/red-team',               label: 'Red Team' },
      { href: '/glasswing',              label: 'Glasswing Mode' },
      { href: '/capability-trajectory',  label: 'Capability Trajectory' },
    ],
  },
  {
    label: 'TRUST',
    items: [
      { href: '/trust',         label: 'Trust Center' },
      { href: '/sovereign',     label: 'Sovereign' },
      { href: '/boardroom',     label: 'Boardroom' },
      { href: '/investor-demo', label: 'Investor Demo' },
      { href: '/about',         label: 'About' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { href: '/control-tower', label: 'Control Tower' },
    ],
  },
];

const TOKENS = {
  bg: '#0a0a0a',
  bgPure: '#000000',
  surface: 'rgba(255,255,255,0.018)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
  accent: '#c9b787',
  mono: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
};

interface LayoutProps {
  children: ReactNode;
  fullscreen?: boolean;
}

export function Layout({ children, fullscreen = false }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();

  if (fullscreen) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: TOKENS.bg, color: TOKENS.text, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: TOKENS.bg, color: TOKENS.text, display: 'flex', flexDirection: 'column', fontFeatureSettings: '"ss01", "cv11"' }}>
      {/* TOP BAR — minimal, monochrome */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        height: 52,
        borderBottom: `1px solid ${TOKENS.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setSidebarOpen(o => !o)}
            style={{
              width: 26, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none',
              color: TOKENS.textDim, cursor: 'pointer',
              fontSize: 13,
            }}
            aria-label="Toggle sidebar"
          >☰</button>
          <Link href={b('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 18, height: 18,
              border: `1px solid ${TOKENS.borderStrong}`,
              borderRadius: 3,
              fontSize: 10, fontFamily: TOKENS.mono, color: TOKENS.text,
            }}>a</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: TOKENS.text, letterSpacing: '-0.01em' }}>
              a11oy
            </span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.6875rem', fontFamily: TOKENS.mono, color: TOKENS.textDim,
            letterSpacing: '0.04em',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: TOKENS.accent, boxShadow: `0 0 6px ${TOKENS.accent}`,
            }} />
            Fabric operational
          </div>
          <Link
            href={b('/investor-demo')}
            style={{
              padding: '0.4rem 0.875rem',
              fontSize: '0.75rem', fontWeight: 500,
              color: '#0a0a0a',
              background: TOKENS.text,
              borderRadius: 999,
              textDecoration: 'none',
              letterSpacing: '-0.005em',
            }}
          >
            Investor demo
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {sidebarOpen && (
          <aside style={{
            width: 200,
            borderRight: `1px solid ${TOKENS.border}`,
            flexShrink: 0,
            overflowY: 'auto',
            padding: '1.5rem 0',
            background: TOKENS.bg,
            position: 'sticky',
            top: 52,
            height: 'calc(100vh - 52px)',
          }}>
            {NAV_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  padding: '0 1.25rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.625rem',
                  fontFamily: TOKENS.mono,
                  fontWeight: 500,
                  letterSpacing: '0.16em',
                  color: TOKENS.textMuted,
                }}>
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
                      style={{
                        display: 'block',
                        padding: '0.4rem 1.25rem',
                        fontSize: '0.8125rem',
                        textDecoration: 'none',
                        color: isActive ? TOKENS.text : TOKENS.textDim,
                        background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                        borderLeft: isActive ? `2px solid ${TOKENS.accent}` : '2px solid transparent',
                        fontWeight: isActive ? 500 : 400,
                        letterSpacing: '-0.005em',
                        transition: 'color 0.15s, background 0.15s',
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </aside>
        )}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', minWidth: 0, background: TOKENS.bg }}>
          {children}
        </main>
      </div>
    </div>
  );
}
