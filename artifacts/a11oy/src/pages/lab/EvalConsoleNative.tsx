import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Beaker, ExternalLink, Loader, ShieldOff } from 'lucide-react';

const base = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

interface RegressionRow {
  id?: string;
  promptId?: string;
  domain?: string;
  status?: string;
  score?: number;
  passRate?: number;
  delta?: number;
  lastRunAt?: string;
}

interface DashboardPayload {
  dashboard?: {
    rows?: RegressionRow[];
    summary?: Record<string, unknown>;
    [k: string]: unknown;
  } | RegressionRow[] | unknown;
}

export function EvalConsoleNative() {
  const [rows, setRows] = useState<RegressionRow[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authBlocked, setAuthBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAuthBlocked(false);

    fetch('/api/pulse-evals/regression-dashboard')
      .then(async (resp) => {
        if (resp.status === 401 || resp.status === 403) {
          if (!cancelled) setAuthBlocked(true);
          return null;
        }
        if (!resp.ok) throw new Error(`Regression dashboard returned ${resp.status}`);
        return resp.json() as Promise<DashboardPayload>;
      })
      .then((body) => {
        if (cancelled || !body) return;
        const dashboard = body.dashboard;
        if (Array.isArray(dashboard)) {
          setRows(dashboard);
        } else if (dashboard && typeof dashboard === 'object') {
          const d = dashboard as { rows?: RegressionRow[]; summary?: Record<string, unknown> };
          setRows(d.rows ?? []);
          setSummary(d.summary ?? null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load regression dashboard');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`${base}/lab`}
          className="flex items-center gap-1 text-xs text-[var(--color-a11oy-text-ghost)] hover:text-[var(--color-a11oy-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Lab
        </Link>
        <span className="text-[var(--color-a11oy-border)]">/</span>
        <span className="text-xs text-[var(--color-a11oy-text)]">Eval Console</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-a11oy-text)] flex items-center gap-3">
            <Beaker className="w-6 h-6 text-[var(--color-a11oy-gold)]" />
            Eval Console
          </h1>
          <p className="text-sm text-[var(--color-a11oy-text-sub)] mt-1">
            Pulse evals · regression dashboard. Watch the deltas, gate the releases.
          </p>
        </div>
        <a
          href="/nexus/#eval-console"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono px-3 py-2 rounded-lg border border-[var(--color-a11oy-border)] text-[var(--color-a11oy-text-sub)] hover:text-[var(--color-a11oy-gold)] hover:border-[var(--color-a11oy-gold-dim)] transition-colors flex items-center gap-1.5"
        >
          Open in Praxis
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-[var(--color-a11oy-text-ghost)]">
          <Loader className="w-5 h-5 animate-spin" />
          <span className="ml-2 text-sm">Loading regression dashboard…</span>
        </div>
      )}

      {authBlocked && !loading && (
        <div className="rounded-xl border border-[var(--color-a11oy-gold-dim)] bg-[var(--color-a11oy-gold-glow)] p-6">
          <div className="flex items-start gap-3">
            <ShieldOff className="w-4 h-4 text-[var(--color-a11oy-gold)] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--color-a11oy-text)]">
                Eval console requires admin or operator role
              </p>
              <p className="text-xs text-[var(--color-a11oy-text-sub)] mt-1 leading-relaxed">
                Regression dashboards are gated to roles that can promote prompt versions. Sign in
                with the appropriate role, or open the deep Praxis console.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && !loading && !authBlocked && (
        <div className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-6 text-sm text-[var(--color-a11oy-text-sub)]">
          <p className="text-[var(--color-a11oy-text)] font-medium mb-1">Dashboard unavailable</p>
          <p className="text-[var(--color-a11oy-text-ghost)] text-xs">{error}</p>
        </div>
      )}

      {!loading && !error && !authBlocked && (
        <>
          {summary && (
            <div className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-4">
              <p className="text-[10px] font-mono text-[var(--color-a11oy-text-ghost)] uppercase tracking-wider mb-2">
                Summary
              </p>
              <pre className="text-[11px] font-mono text-[var(--color-a11oy-text-sub)] whitespace-pre-wrap">
                {JSON.stringify(summary, null, 2)}
              </pre>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-6 text-sm text-[var(--color-a11oy-text-sub)]">
              No regression rows yet. Trigger a pulse eval from Praxis to populate the dashboard.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div
                  key={r.id ?? r.promptId ?? i}
                  className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-a11oy-text)]">
                      {r.promptId ?? r.id ?? `row-${i}`}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-mono text-[var(--color-a11oy-text-ghost)]">
                      {r.domain && <span>domain: {r.domain}</span>}
                      {r.status && <span>status: {r.status}</span>}
                      {r.lastRunAt && <span>last: {new Date(r.lastRunAt).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {r.score != null && (
                      <p className="text-base font-semibold text-[var(--color-a11oy-gold)]">
                        {(r.score * 100).toFixed(0)}%
                      </p>
                    )}
                    {r.passRate != null && (
                      <p className="text-[10px] font-mono text-[var(--color-a11oy-text-ghost)]">
                        pass {(r.passRate * 100).toFixed(0)}%
                      </p>
                    )}
                    {r.delta != null && (
                      <p
                        className={`text-[10px] font-mono ${
                          r.delta >= 0
                            ? 'text-[var(--color-a11oy-gold)]'
                            : 'text-[var(--color-a11oy-text-sub)]'
                        }`}
                      >
                        Δ {r.delta >= 0 ? '+' : ''}{(r.delta * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
