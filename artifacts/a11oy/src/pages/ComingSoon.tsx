import { Layout } from '../components/layout';

interface ComingSoonProps {
  title: string;
  route: string;
}

export function ComingSoon({ title, route }: ComingSoonProps) {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div
          className="px-3 py-1 rounded-full text-xs font-mono mb-6"
          style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-blue)' }}
        >
          Phase 2 — Runtime
        </div>
        <h1
          className="text-3xl font-display font-semibold text-center mb-3"
          style={{ color: 'var(--color-a11oy-text)' }}
        >
          {title}
        </h1>
        <p className="text-center max-w-md mb-8" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          This module is coming online in Phase 2. The agent runtime, operators, governed tools,
          MirrorEval, and the full Workcell engine are being wired now.
        </p>
        <div
          className="font-mono text-xs px-4 py-2 rounded border"
          style={{
            backgroundColor: 'var(--color-a11oy-card)',
            borderColor: 'var(--color-a11oy-border)',
            color: 'var(--color-a11oy-text-sub)',
          }}
        >
          {route} · coming online
        </div>
        <a
          href="../"
          className="mt-8 text-sm"
          style={{ color: 'var(--color-a11oy-blue)', textDecoration: 'none' }}
        >
          ← Back to A11oy
        </a>
      </div>
    </Layout>
  );
}
