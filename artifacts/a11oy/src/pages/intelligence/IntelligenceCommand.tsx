import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Brain, DollarSign, Search, TrendingUp, Zap } from 'lucide-react';

const base = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const IS_DEMO = import.meta.env.VITE_IS_DEMO === 'true';
const GHOST = '#5e5e5e';
const GOLD = '#c9b787';

const FALLBACK_KPIS = [
  { label: 'Portfolio Entities', value: '14', delta: '+2 this quarter' },
  { label: 'Active Intel Feeds', value: '6', delta: '2 pending auth' },
  { label: 'Avg ROI Signal', value: '2.3×', delta: 'vs 1.8× baseline' },
  { label: 'Open Alerts', value: '3', delta: '1 critical' },
];

const FALLBACK_RECENT = [
  { entity: 'Carlota Jo Consulting', type: 'Entity deep dive', time: '2h ago', status: 'complete' },
  { entity: 'SZL Holdings LLC', type: 'ROI lens', time: '4h ago', status: 'complete' },
  { entity: 'A11oy Platform', type: 'Finance terminal', time: '1d ago', status: 'complete' },
  { entity: 'Vessels Maritime', type: 'Entity deep dive', time: '2d ago', status: 'stale' },
];

interface Kpi { label: string; value: string; delta: string }
interface RecentItem { entity: string; type: string; time: string; status: string }

export function IntelligenceCommand() {
  const [kpis, setKpis] = useState<Kpi[]>(IS_DEMO ? FALLBACK_KPIS : []);
  const [recent, setRecent] = useState<RecentItem[]>(IS_DEMO ? FALLBACK_RECENT : []);
  const [loading, setLoading] = useState(!IS_DEMO);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (IS_DEMO) return;
    let cancelled = false;
    setLoading(true);
    fetch('/api/a11oy/pages/intelligence-summary')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => {
        if (cancelled) return;
        if (d.ok) {
          setKpis(d.data.kpis ?? []);
          setRecent(d.data.recent ?? []);
        } else {
          setError('API error — check server status');
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message ?? 'Failed to load intelligence summary');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-1">
          Intelligence · Command
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[var(--color-a11oy-text)] tracking-tight">
            Decision Intelligence Overview
          </h1>
          {!IS_DEMO && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: loading ? 'rgba(255,255,255,0.05)' : error ? '#ef444418' : '#22c55e18', color: loading ? GHOST : error ? '#ef4444' : '#22c55e' }}>
              {loading ? 'LOADING…' : error ? 'FALLBACK' : 'LIVE'}
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--color-a11oy-text-sub)] mt-1 max-w-3xl">
          A11oy aggregates entity intelligence, finance-grade data, and portfolio metrics across the
          SZL Holdings ecosystem under a single governed surface. Every call routes through the same
          policy-gated tool bridge as the rest of A11oy — every result is provable.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-4 space-y-1 animate-pulse">
                <div className="h-8 w-16 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                <div className="h-3 w-24 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
              </div>
            ))
          : kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-4 space-y-1"
              >
                <p className="text-3xl font-semibold text-[var(--color-a11oy-gold)]">{k.value}</p>
                <p className="text-xs text-[var(--color-a11oy-text)]">{k.label}</p>
                <p className="text-[10px] text-[var(--color-a11oy-text-ghost)]">{k.delta}</p>
              </div>
            ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href={`${base}/intelligence/deep-dive`}
          className="group rounded-2xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-6 hover:border-[var(--color-a11oy-gold-dim)] transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-a11oy-gold-glow)] border border-[var(--color-a11oy-gold-dim)] flex items-center justify-center">
              <Search className="w-5 h-5 text-[var(--color-a11oy-gold)]" />
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--color-a11oy-text-ghost)] group-hover:text-[var(--color-a11oy-gold)] transition-colors" />
          </div>
          <h2 className="text-base font-semibold text-[var(--color-a11oy-text)]">Entity Deep Dive</h2>
          <p className="text-sm text-[var(--color-a11oy-text-sub)] mt-1 leading-relaxed">
            Finance-grade entity analysis via the Fincept Terminal MCP bridge. Company financials,
            ownership graph, regulatory filings, and AI narrative — all governed and replayable.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-[var(--color-a11oy-gold-dim)] text-[var(--color-a11oy-gold)] bg-[var(--color-a11oy-gold-glow)]">
              finance.terminal
            </span>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-[var(--color-a11oy-border)] text-[var(--color-a11oy-text-ghost)]">
              fincept@v0.9-mcp
            </span>
          </div>
        </Link>

        <Link
          href={`${base}/intelligence/roi-lens`}
          className="group rounded-2xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-6 hover:border-[var(--color-a11oy-gold-dim)] transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-a11oy-gold-glow)] border border-[var(--color-a11oy-gold-dim)] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[var(--color-a11oy-gold)]" />
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--color-a11oy-text-ghost)] group-hover:text-[var(--color-a11oy-gold)] transition-colors" />
          </div>
          <h2 className="text-base font-semibold text-[var(--color-a11oy-text)]">SZL Holdings · ROI Lens</h2>
          <p className="text-sm text-[var(--color-a11oy-text-sub)] mt-1 leading-relaxed">
            Portfolio-wide return analysis across SZL holdings — A11oy, Carlota Jo, Vessels,
            Sentra, Counsel, Terra — with waterfall breakdowns and scenario overlays.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-[var(--color-a11oy-gold-dim)] text-[var(--color-a11oy-gold)] bg-[var(--color-a11oy-gold-glow)]">
              portfolio.roi
            </span>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-[var(--color-a11oy-border)] text-[var(--color-a11oy-text-ghost)]">
              a11oy v4.2
            </span>
          </div>
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-a11oy-border)] flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[var(--color-a11oy-text-ghost)]" />
          <span className="text-xs text-[var(--color-a11oy-text)] font-medium">Recent Activity</span>
        </div>
        <div className="divide-y divide-[var(--color-a11oy-border)]">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  <div className="flex-1"><div className="h-3 w-32 rounded mb-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} /></div>
                </div>
              ))
            : recent.map((r) => (
                <div key={r.entity + r.type} className="px-5 py-3 flex items-center gap-3">
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      r.status === 'complete' ? 'bg-[var(--color-a11oy-gold)]' : 'bg-[var(--color-a11oy-text-ghost)]'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-a11oy-text)] truncate">{r.entity}</p>
                    <p className="text-[10px] text-[var(--color-a11oy-text-ghost)]">{r.type}</p>
                  </div>
                  <span className="text-[10px] text-[var(--color-a11oy-text-ghost)] shrink-0">{r.time}</span>
                </div>
              ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Brain, label: 'Governed AI Layer', desc: 'Multi-model router active — 98.4% uptime this week' },
          { icon: TrendingUp, label: 'Fincept Terminal', desc: 'AGPL-isolated MCP proxy · REST bridge healthy' },
          { icon: Zap, label: 'Tool Bridge', desc: '3 adapters registered: marketing.audit, seo.audit, finance.terminal' },
        ].map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-4"
          >
            <Icon className="w-4 h-4 text-[var(--color-a11oy-gold)] mb-2" />
            <p className="text-sm font-medium text-[var(--color-a11oy-text)]">{label}</p>
            <p className="text-[11px] text-[var(--color-a11oy-text-ghost)] mt-0.5 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
