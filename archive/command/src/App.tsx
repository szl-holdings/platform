import { Link, Route, Switch, Router as WouterRouter } from 'wouter';
import { HeliosProposalsInbox } from '@/components/helios-proposals-inbox';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '') || '';

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  sub: '#8a8a8a',
  muted: '#5e5e5e',
  gold: '#c9b787',
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>
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
            COMMAND
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Operator Console</div>
        </div>
        <nav style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
          <Link
            href="/"
            style={{
              fontSize: 12,
              fontFamily: 'monospace',
              color: T.sub,
              textDecoration: 'none',
              padding: '4px 10px',
              border: `1px solid ${T.border}`,
              borderRadius: 6,
            }}
          >
            Home
          </Link>
          <Link
            href="/frontier/proposals"
            style={{
              fontSize: 12,
              fontFamily: 'monospace',
              color: T.gold,
              textDecoration: 'none',
              padding: '4px 10px',
              border: `1px solid rgba(201,183,135,0.3)`,
              borderRadius: 6,
              background: 'rgba(201,183,135,0.08)',
            }}
          >
            Frontier Proposals
          </Link>
        </nav>
      </header>
      <main style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>{children}</main>
    </div>
  );
}

function Home() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 0.5rem' }}>Command</h1>
      <p style={{ color: T.sub, fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>
        Operator console for the platform. Use the navigation above to reach the Frontier
        Capability Proposals inbox.
      </p>
      <div style={{ marginTop: '1.5rem' }}>
        <Link
          href="/frontier/proposals"
          style={{
            display: 'inline-block',
            padding: '8px 14px',
            borderRadius: 8,
            border: `1px solid rgba(201,183,135,0.3)`,
            background: 'rgba(201,183,135,0.08)',
            color: T.gold,
            fontFamily: 'monospace',
            fontSize: 12,
            textDecoration: 'none',
          }}
        >
          Open Frontier Proposals →
        </Link>
      </div>
    </div>
  );
}

function FrontierProposalsPage() {
  return (
    <div>
      <HeliosProposalsInbox />
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: '2rem', color: T.muted, fontFamily: 'monospace', fontSize: 13 }}>
      Page not found.
    </div>
  );
}

export default function App() {
  return (
    <WouterRouter base={BASE}>
      <Shell>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/frontier/proposals" component={FrontierProposalsPage} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </WouterRouter>
  );
}
