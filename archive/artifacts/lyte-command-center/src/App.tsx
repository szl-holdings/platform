const A11OY_BASE = 'https://a11oy.szlholdings.com';
const GOLD = '#c9b787';

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#080d14',
      color: '#e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: 640, textAlign: 'center' }}>
        <div style={{
          fontSize: 11,
          fontFamily: 'ui-monospace, monospace',
          letterSpacing: '0.18em',
          color: GOLD,
          textTransform: 'uppercase',
          marginBottom: 24,
        }}>
          LEXICON · LYTE — Deprecated
        </div>
        <h1 style={{
          fontSize: 38,
          fontWeight: 600,
          lineHeight: 1.15,
          marginBottom: 20,
          letterSpacing: '-0.02em',
        }}>
          Lyte / KORA has moved into A11oy.
        </h1>
        <p style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: '#94a3b8',
          marginBottom: 28,
        }}>
          The License Intelligence Catalog and Decision Intelligence Command,
          including Deep Dive and ROI Lens, now live inside A11oy as the unified
          <strong style={{ color: '#e2e8f0' }}> Decisions </strong>
          workspace — alongside the Agent Foundry, Strategy, Operations,
          Infrastructure, Primitives, Doctrine, and Trust surfaces.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={`${A11OY_BASE}/decisions`} style={{
            display: 'inline-block',
            padding: '12px 22px',
            backgroundColor: GOLD,
            color: '#0a0a0a',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
          }}>
            Open Decisions in A11oy →
          </a>
          <a href={`${A11OY_BASE}/whats-new`} style={{
            display: 'inline-block',
            padding: '12px 22px',
            backgroundColor: 'transparent',
            color: '#e2e8f0',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            What's New
          </a>
        </div>
        <div style={{
          marginTop: 40,
          fontSize: 11,
          fontFamily: 'ui-monospace, monospace',
          color: '#475569',
          letterSpacing: '0.04em',
        }}>
          This standalone surface is read-only and will be archived in a future release.
        </div>
      </div>
    </div>
  );
}
