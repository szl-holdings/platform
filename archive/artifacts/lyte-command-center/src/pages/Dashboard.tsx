import { useEffect, useState } from 'react';
import { ArrowRight, Brain, DollarSign, Search, Shield, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { useLyteSignalUpdated, useLyteQueueChanged, useLyteIncidentUpdated } from '@szl-holdings/graphql-client';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const BASE_KPIS = [
  { key: 'entities', label: 'Portfolio Entities', value: '14', delta: '+2 this quarter', color: 'text-cyan-400' },
  { key: 'feeds', label: 'Active Intel Feeds', value: '6', delta: '2 pending auth', color: 'text-emerald-400' },
  { key: 'roi', label: 'Avg ROI Signal', value: '2.3×', delta: 'vs 1.8× baseline', color: 'text-lime-400' },
  { key: 'alerts', label: 'Open Alerts', value: '3', delta: '1 critical', color: 'text-amber-400' },
];

const BASE_RECENT = [
  { entity: 'Carlota Jo Consulting', type: 'Entity deep dive', time: '2h ago', status: 'complete' },
  { entity: 'SZL Holdings LLC', type: 'ROI lens', time: '4h ago', status: 'complete' },
  { entity: 'NEXUS Platform', type: 'Finance terminal', time: '1d ago', status: 'complete' },
  { entity: 'Vessels Maritime', type: 'Entity deep dive', time: '2d ago', status: 'stale' },
];

interface CyberResilienceTile {
  compositeScore: number;
  weekOverWeekDelta: number | null;
  rollingFourWeekAvg: number | null;
  regressions: number;
  payloads: Array<{ name: string; score: number; status: string }>;
  ranAt: string;
}

function CyberResilienceTrend({ tile }: { tile: CyberResilienceTile }) {
  const pct = Math.round(tile.compositeScore * 100);
  const deltaVal = tile.weekOverWeekDelta;
  const hasDelta = deltaVal != null;
  const deltaUp = hasDelta && deltaVal! >= 0;
  const DeltaIcon = deltaUp ? TrendingUp : TrendingDown;
  const scoreColor =
    pct >= 80 ? 'text-emerald-400' : pct >= 65 ? 'text-amber-400' : 'text-red-400';
  const deltaColor = deltaUp ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="rounded-2xl border border-[#1a2436] bg-[#0e1520] p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#e2e8f0]">Cyber Resilience Trend</h2>
            <p className="text-[10px] text-[#64748b] font-mono mt-0.5">ATT&CK Emulation · CPS Payloads</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-2xl font-bold font-mono ${scoreColor}`}>{pct}%</span>
          {hasDelta && (
            <div className={`flex items-center gap-1 text-[11px] font-mono ${deltaColor}`}>
              <DeltaIcon className="w-3 h-3" />
              WoW {deltaVal! >= 0 ? '+' : ''}{(deltaVal! * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Composite', value: `${pct}%`, color: scoreColor },
          { label: '4-Wk Avg', value: tile.rollingFourWeekAvg != null ? `${Math.round(tile.rollingFourWeekAvg * 100)}%` : '—', color: 'text-[#e2e8f0]' },
          { label: 'Regressions', value: String(tile.regressions), color: tile.regressions > 0 ? 'text-red-400' : 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg bg-[#0a0f18] border border-[#1a2436] px-3 py-2">
            <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
            <p className="text-[9px] text-[#64748b] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {tile.payloads.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-4">
          {tile.payloads.map(p => {
            const s = Math.round(p.score * 100);
            const c = s >= 80 ? 'text-emerald-400' : s >= 65 ? 'text-amber-400' : 'text-red-400';
            const barColor = s >= 80 ? '#22c55e' : s >= 65 ? '#f59e0b' : '#ef4444';
            return (
              <div key={p.name} className="flex items-center gap-2">
                <div className="w-28 text-[9px] text-[#64748b] truncate shrink-0">{p.name}</div>
                <div className="flex-1 h-1.5 rounded-full bg-[#1a2436] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s}%`, background: barColor }} />
                </div>
                <span className={`text-[10px] font-mono w-8 text-right ${c}`}>{s}%</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[9px] text-[#64748b]">
          {tile.ranAt ? `Updated ${new Date(tile.ranAt).toLocaleDateString()}` : 'Awaiting first emulation run'}
        </p>
        <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-md border border-cyan-500/20 text-cyan-400 bg-cyan-500/5">
          <Shield className="w-2.5 h-2.5" /> KORA · Sentra
        </div>
      </div>
    </div>
  );
}

function useCyberResilienceTile(): { tile: CyberResilienceTile | null; loading: boolean } {
  const [tile, setTile] = useState<CyberResilienceTile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = `${window.location.origin}/api`;
    fetch(`${apiBase}/firestorm/emulation/runs?limit=1`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((data: unknown) => {
        const runs = (data as { runs?: Array<{
          ranAt: string;
          overallCompositeScore: number | null;
          weekOverWeekDelta: number | null;
          rollingFourWeekAvg: number | null;
          regressionCount: number;
          scorecards: Array<{ payloadName: string; compositeConfidence: number; status: string }>;
        }> } | null)?.runs ?? [];
        if (runs.length > 0) {
          const latest = runs[0];
          setTile({
            compositeScore: latest.overallCompositeScore ?? 0,
            weekOverWeekDelta: latest.weekOverWeekDelta,
            rollingFourWeekAvg: latest.rollingFourWeekAvg,
            regressions: latest.regressionCount,
            payloads: (latest.scorecards ?? []).map(sc => ({
              name: sc.payloadName,
              score: sc.compositeConfidence,
              status: sc.status,
            })),
            ranAt: latest.ranAt,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { tile, loading };
}

export default function Dashboard() {
  const [alertCount, setAlertCount] = useState(3);
  const [queueCount, setQueueCount] = useState(0);
  const [liveSignal, setLiveSignal] = useState<{ title: string; severity: string } | null>(null);
  const [liveIncident, setLiveIncident] = useState<{ id: string; severity: string; status: string } | null>(null);

  const { data: signalData } = useLyteSignalUpdated();
  const { data: queueData } = useLyteQueueChanged();
  const { data: incidentData } = useLyteIncidentUpdated();
  const { tile: cyberTile } = useCyberResilienceTile();

  const signalUpdate = (signalData as { lyteSignalUpdated?: { id: string; title: string; severity: string } } | undefined)?.lyteSignalUpdated;
  const queueUpdate = (queueData as { lyteQueueChanged?: { id: string; entityType: string; entityId: string; priority: string } } | undefined)?.lyteQueueChanged;
  const incidentUpdate = (incidentData as { lyteIncidentUpdated?: { id: string; severity: string; status: string } } | undefined)?.lyteIncidentUpdated;

  useEffect(() => {
    if (!signalUpdate?.id) return;
    setLiveSignal({ title: signalUpdate.title, severity: signalUpdate.severity });
    setAlertCount((c) => c + 1);
    const t = setTimeout(() => setLiveSignal(null), 8_000);
    return () => clearTimeout(t);
  }, [signalUpdate]);

  useEffect(() => {
    if (!queueUpdate?.id) return;
    setQueueCount((c) => c + 1);
  }, [queueUpdate]);

  useEffect(() => {
    if (!incidentUpdate?.id) return;
    setLiveIncident({ id: incidentUpdate.id, severity: incidentUpdate.severity, status: incidentUpdate.status });
    const t = setTimeout(() => setLiveIncident(null), 12_000);
    return () => clearTimeout(t);
  }, [incidentUpdate]);

  const kpis = BASE_KPIS.map((k) =>
    k.key === 'alerts' ? { ...k, value: String(alertCount) } : k,
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0] tracking-tight">Command Overview</h1>
        <p className="text-sm text-[#64748b] mt-1">
          KORA aggregates entity intelligence, finance-grade data, and portfolio metrics across the
          SZL Holdings ecosystem.
        </p>
      </div>

      {liveSignal && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2 flex items-center gap-3 animate-pulse">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-300 font-mono">
            LIVE SIGNAL [{liveSignal.severity.toUpperCase()}] — {liveSignal.title}
          </span>
        </div>
      )}

      {liveIncident && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
          <span className="text-xs text-red-300 font-mono">
            INCIDENT [{liveIncident.severity.toUpperCase()}] · {liveIncident.status} · ID {liveIncident.id.slice(0, 8)}
          </span>
        </div>
      )}

      {queueCount > 0 && (
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 flex items-center gap-3">
          <span className="text-xs text-cyan-400 font-mono">
            QUEUE — {queueCount} item{queueCount !== 1 ? 's' : ''} processed this session
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-[#1a2436] bg-[#0e1520] p-4 space-y-1"
          >
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-[#e2e8f0]">{k.label}</p>
            <p className="text-[10px] text-[#64748b]">{k.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <a
          href={`${base}/deep-dive`}
          className="group rounded-2xl border border-[#1a2436] bg-[#0e1520] p-6 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-cyan-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#64748b] group-hover:text-cyan-400 transition-colors" />
          </div>
          <h2 className="text-base font-semibold text-[#e2e8f0]">Deep Dive on Entity</h2>
          <p className="text-sm text-[#64748b] mt-1 leading-relaxed">
            Finance-grade entity analysis via Fincept Terminal (AGPL-isolated MCP proxy). Company
            financials, ownership graph, regulatory filings, and AI narrative.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-cyan-500/20 text-cyan-400 bg-cyan-500/5">
              finance.terminal
            </span>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-[#1a2436] text-[#64748b]">
              fincept@v0.9-mcp
            </span>
          </div>
        </a>

        <a
          href={`${base}/roi-lens`}
          className="group rounded-2xl border border-[#1a2436] bg-[#0e1520] p-6 hover:border-lime-500/30 hover:bg-lime-500/5 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-lime-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#64748b] group-hover:text-lime-400 transition-colors" />
          </div>
          <h2 className="text-base font-semibold text-[#e2e8f0]">SZL Holdings — ROI Lens</h2>
          <p className="text-sm text-[#64748b] mt-1 leading-relaxed">
            Portfolio-wide return analysis across SZL holdings — NEXUS, Carlota Jo, Vessels,
            Sentra, and Counsel — with waterfall breakdowns and scenario overlays.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-lime-500/20 text-lime-400 bg-lime-500/5">
              portfolio.roi
            </span>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-[#1a2436] text-[#64748b]">
              PRAXIS v2
            </span>
          </div>
        </a>
      </div>

      {cyberTile && (
        <CyberResilienceTrend tile={cyberTile} />
      )}

      {!cyberTile && (
        <div className="rounded-2xl border border-[#1a2436] bg-[#0e1520] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#e2e8f0]">Cyber Resilience Trend</h2>
              <p className="text-[10px] text-[#64748b] font-mono mt-0.5">ATT&CK Emulation · CPS Payloads</p>
            </div>
          </div>
          <p className="text-sm text-[#64748b]">
            Weekly emulation loop initializing — first scorecard will populate 5 minutes after API server boot.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-cyan-500/20 text-cyan-400 bg-cyan-500/5">
              identity.kill-chain
            </span>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-cyan-500/20 text-cyan-400 bg-cyan-500/5">
              lateral.movement
            </span>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-cyan-500/20 text-cyan-400 bg-cyan-500/5">
              exfiltration.guardrail
            </span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#1a2436] bg-[#0e1520] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#1a2436] flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#64748b]" />
          <span className="text-xs text-[#e2e8f0] font-medium">Recent Activity</span>
        </div>
        <div className="divide-y divide-[#1a2436]">
          {BASE_RECENT.map((r) => (
            <div key={r.entity + r.type} className="px-5 py-3 flex items-center gap-3">
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.status === 'complete' ? 'bg-emerald-400' : 'bg-amber-400'}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#e2e8f0] truncate">{r.entity}</p>
                <p className="text-[10px] text-[#64748b]">{r.type}</p>
              </div>
              <span className="text-[10px] text-[#64748b] shrink-0">{r.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Brain, label: 'PRAXIS AI Layer', desc: 'GPT-4o router active — 98.4% uptime this week', color: 'text-purple-400', border: 'border-purple-500/20' },
          { icon: TrendingUp, label: 'Fincept Terminal', desc: 'AGPL-isolated MCP proxy · REST bridge healthy', color: 'text-cyan-400', border: 'border-cyan-500/20' },
          { icon: Zap, label: 'Tool Bridge', desc: '3 new adapters registered: marketing.audit, seo.audit, finance.terminal', color: 'text-lime-400', border: 'border-lime-500/20' },
        ].map(({ icon: Icon, label, desc, color, border }) => (
          <div key={label} className={`rounded-xl border ${border} bg-[#0e1520] p-4`}>
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className="text-sm font-medium text-[#e2e8f0]">{label}</p>
            <p className="text-[11px] text-[#64748b] mt-0.5 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
