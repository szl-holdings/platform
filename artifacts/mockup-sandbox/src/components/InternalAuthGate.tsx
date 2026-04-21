import { Lock, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

async function checkSession(): Promise<AuthState> {
  try {
    const res = await fetch('/api/nexus/status', {
      credentials: 'include',
    });
    if (res.status === 401 || res.status === 403) return 'unauthenticated';
    if (!res.ok) return 'unauthenticated';
    return 'authenticated';
  } catch {
    return 'unauthenticated';
  }
}

function LoginWall() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-nexus-bg">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full px-6">
        <div className="w-14 h-14 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center">
          <span className="text-nexus-cyan font-mono font-bold text-xl">N</span>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-nexus-cyan font-mono font-bold text-xl tracking-widest">NEXUS</h1>
          <p className="text-muted-foreground text-xs">Unified Agentic AI Layer</p>
        </div>

        <div className="w-full rounded-xl border border-[#ffb700]/30 bg-[#ffb700]/5 px-4 py-3 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-nexus-amber shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-nexus-amber font-mono uppercase tracking-wide">
              Internal Tooling — Restricted
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This workspace is for internal use only and is not a customer-facing product. Access
              requires an authenticated session.
            </p>
          </div>
        </div>

        <div className="w-full rounded-xl border border-nexus bg-nexus-surface px-5 py-5 space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-nexus-cyan" />
            <span className="text-xs font-mono text-nexus-cyan uppercase tracking-widest">
              Sign In Required
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            You are not currently logged in. Navigate to the main platform to authenticate, then
            return here.
          </p>
          <a
            href="/"
            className="block w-full text-center px-4 py-2.5 rounded-lg border border-nexus-cyan/40 bg-nexus-cyan/10 text-nexus-cyan text-xs font-semibold font-mono hover:bg-nexus-cyan/20 transition-colors"
          >
            Go to Platform Login →
          </a>
        </div>

        <p className="text-[10px] text-muted-foreground/40 text-center">
          NEXUS · Internal Tooling · Not Production
        </p>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-nexus-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center">
          <span className="text-nexus-cyan font-mono font-bold">N</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground/50 text-xs font-mono">
          <span className="animate-pulse">Verifying session…</span>
        </div>
      </div>
    </div>
  );
}

export default function InternalAuthGate({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    checkSession().then(setAuthState);
  }, []);

  if (authState === 'loading') return <LoadingScreen />;
  if (authState === 'unauthenticated') return <LoginWall />;
  return <>{children}</>;
}
