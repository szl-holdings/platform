import { Link } from 'wouter';
import { CommandShell } from './CommandShell';

const T = {
  sub: '#8a8a8a',
  gold: '#c9b787',
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
    </CommandShell>
  );
}

export default CommandHome;
