import { Link } from 'wouter';
import { V7_PANEL_FACTS } from '@szl-holdings/szl-doctrine';
import { CommandShell } from './CommandShell';

const T = {
  sub: '#8a8a8a',
  gold: '#c9b787',
  border: 'rgba(255,255,255,0.08)',
  cardBg: 'rgba(255,255,255,0.02)',
  chipBg: 'rgba(201,183,135,0.06)',
  chipBorder: 'rgba(201,183,135,0.30)',
};

export function CommandHome() {
  return (
    <CommandShell active="home">
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 0.5rem' }}>Command</h1>
      <p style={{ color: T.sub, fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>
        Operator console for the A11oy platform. Use the navigation above to reach the Frontier
        Capability Proposals inbox.
      </p>
      <div style={{ marginTop: '1.5rem' }}>
        <Link
          href="/a11oy/command/frontier/proposals"
          style={{
            display: 'inline-block',
            padding: '8px 14px',
            borderRadius: 8,
            border: `1px solid ${T.chipBorder}`,
            background: T.chipBg,
            color: T.gold,
            fontFamily: 'monospace',
            fontSize: 12,
            textDecoration: 'none',
          }}
        >
          Open Frontier Proposals →
        </Link>
      </div>

      <section
        aria-label="Latest audit"
        style={{
          marginTop: '2rem',
          padding: '14px 16px',
          border: `1px solid ${T.border}`,
          background: T.cardBg,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: T.sub,
            }}
          >
            Latest audit
          </span>
          <span
            style={{
              fontSize: 12,
              fontFamily: 'monospace',
              color: '#f5f5f5',
              textAlign: 'right',
            }}
          >
            {V7_PANEL_FACTS.latestAuditText}
          </span>
        </div>
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <a
            href={V7_PANEL_FACTS.prTriageDocHref}
            title={V7_PANEL_FACTS.prTriageDocTitle}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: T.gold,
              border: `1px solid ${T.chipBorder}`,
              background: T.chipBg,
              borderRadius: 2,
              textDecoration: 'none',
            }}
          >
            ↗ PR triage
          </a>
          <a
            href={V7_PANEL_FACTS.pmDecisionsDocHref}
            title={V7_PANEL_FACTS.pmDecisionsDocTitle}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: T.gold,
              border: `1px solid ${T.chipBorder}`,
              background: T.chipBg,
              borderRadius: 2,
              textDecoration: 'none',
            }}
          >
            ↗ PM decisions
          </a>
        </div>
      </section>
    </CommandShell>
  );
}

export default CommandHome;
