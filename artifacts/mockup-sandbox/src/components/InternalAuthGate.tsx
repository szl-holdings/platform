import { useEffect, useState } from 'react';

type AuthState = 'loading' | 'authed' | 'unauthed';

export default function InternalAuthGate({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>('loading');

  useEffect(() => {
    fetch('/api/nexus/status')
      .then((res) => {
        if (res.status === 401) {
          setAuth('unauthed');
        } else {
          setAuth('authed');
        }
      })
      .catch(() => {
        setAuth('authed');
      });
  }, []);

  if (auth === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-nexus-bg">
        <div className="text-muted-foreground/60 text-sm font-mono animate-pulse">Checking access…</div>
      </div>
    );
  }

  if (auth === 'unauthed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-nexus-bg gap-8">
        <div className="text-center space-y-3 max-w-sm">
          <div className="text-[10px] font-mono text-nexus-amber tracking-widest uppercase">
            Internal Tooling — Restricted
          </div>
          <h1 className="text-2xl font-bold text-foreground">Sign In Required</h1>
          <p className="text-sm text-muted-foreground/70">
            This tool is for authorized SZL Holdings personnel only. Please sign in via the platform
            to continue.
          </p>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-nexus-surface border border-nexus text-sm font-medium text-foreground hover:bg-nexus-surface/80 transition-colors"
        >
          Go to Platform Login
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
