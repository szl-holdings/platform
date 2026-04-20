import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  DollarSign,
  Eye,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const ACCENT = '#0ea5e9';
const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

const RISK_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    label: 'Critical',
  },
  high: {
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.20)',
    label: 'High',
  },
  medium: {
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.20)',
    label: 'Medium',
  },
  low: {
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.15)',
    label: 'Low',
  },
};

const SANCTION_RISK_CONFIG: Record<string, { color: string; label: string }> = {
  none: { color: '#34d399', label: 'None' },
  watch: { color: '#fbbf24', label: 'Watch' },
  elevated: { color: '#f87171', label: 'Elevated' },
};

interface Counterparty {
  id: string;
  name: string;
  type: string;
  country: string;
  creditRating: string;
  activeContracts: number;
  totalExposureUsd: number;
  overdueAmount: number;
  paymentRecord: string;
  sanctionRisk: string;
  relationships: string[];
  concentrationPct: number;
  riskScore: number;
  riskTier: string;
  overdueRatePct: number;
  confidence: number;
  lastReviewedAt: string;
  provenance: { confidence: number; verifierApproved: boolean; attestation: string };
}

interface PortfolioData {
  counterparties: Counterparty[];
  portfolio: {
    totalCounterparties: number;
    totalExposureUsd: number;
    totalOverdueUsd: number;
    overdueRatePct: number;
    weightedAvgRiskScore: number;
    byRisk: Record<string, number>;
    concentrationRisk: string;
  };
  provenance: {
    confidence: number;
    verifierApproved: boolean;
    attestation: string;
    freshness: { fetchedAt: string };
  };
}

function RiskBar({ score }: { score: number }) {
  const color =
    score >= 70 ? '#ef4444' : score >= 50 ? '#f87171' : score >= 30 ? '#fbbf24' : '#34d399';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function CPCard({
  cp,
  selected,
  onClick,
}: {
  cp: Counterparty;
  selected: boolean;
  onClick: () => void;
}) {
  const riskCfg = RISK_CONFIG[cp.riskTier] ?? RISK_CONFIG.low;
  const srCfg = SANCTION_RISK_CONFIG[cp.sanctionRisk] ?? SANCTION_RISK_CONFIG.none;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl p-4 border transition-all',
        selected ? 'ring-1 ring-sky-400/40' : 'hover:border-sky-500/20',
      )}
      style={{
        background: selected ? riskCfg.bg : 'rgba(10,22,40,0.7)',
        borderColor: selected ? riskCfg.border : 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-[12px] font-semibold text-sky-100">{cp.name}</div>
          <div className="text-[9px] text-sky-400/50 mt-0.5">
            {cp.type.replace(/_/g, ' ')} · {cp.country}
          </div>
        </div>
        <span
          className="text-[9px] px-2 py-0.5 rounded-full border font-medium capitalize"
          style={{ color: riskCfg.color, borderColor: riskCfg.border, background: riskCfg.bg }}
        >
          {riskCfg.label}
        </span>
      </div>
      <RiskBar score={cp.riskScore} />
      <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]">
        <div>
          <div className="text-sky-400/40">Exposure</div>
          <div className="text-sky-200 font-medium">
            ${(cp.totalExposureUsd / 1_000_000).toFixed(1)}M
          </div>
        </div>
        <div>
          <div className="text-sky-400/40">Credit</div>
          <div className="text-sky-200 font-medium">{cp.creditRating}</div>
        </div>
        <div>
          <div className="text-sky-400/40">Sanction</div>
          <div className="font-medium" style={{ color: srCfg.color }}>
            {srCfg.label}
          </div>
        </div>
      </div>
      {cp.overdueAmount > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-[9px] text-amber-300/70">
          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />$
          {(cp.overdueAmount / 1000).toFixed(0)}k overdue · {cp.overdueRatePct.toFixed(1)}%
        </div>
      )}
      <div className="flex items-center gap-1 mt-1.5">
        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400/40" />
        <span className="text-[9px] text-sky-400/30">{Math.round(cp.confidence * 100)}% conf.</span>
      </div>
    </button>
  );
}

export default function CounterpartyRiskMapPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Counterparty | null>(null);
  const [sortBy, setSortBy] = useState<'riskScore' | 'exposure' | 'overdue'>('riskScore');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/vessels/cognitive/counterparty-risk`);
      if (r.ok) setData((await r.json()) as PortfolioData);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const cps = (data?.counterparties ?? []).slice().sort((a, b) => {
    if (sortBy === 'riskScore') return b.riskScore - a.riskScore;
    if (sortBy === 'exposure') return b.totalExposureUsd - a.totalExposureUsd;
    return b.overdueAmount - a.overdueAmount;
  });

  const fmt = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1400, margin: '0 auto' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5" style={{ color: ACCENT }} />
            <h1 className="text-xl font-semibold text-sky-100">Counterparty Risk Map</h1>
            <Badge variant="outline" className="text-[9px] border-sky-500/30 text-sky-400/70">
              COGNITIVE RUNTIME
            </Badge>
          </div>
          <p className="text-xs text-sky-400/60">
            Aggregates per-counterparty exposure, payment records, sanction risk, and credit quality
            with confidence scores.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-sky-400 border border-sky-500/20 hover:border-sky-500/40 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {data?.portfolio && (
        <div className="grid grid-cols-6 gap-3 mb-5">
          {[
            { label: 'Total Exposure', value: fmt(data.portfolio.totalExposureUsd), color: ACCENT },
            {
              label: 'Counterparties',
              value: data.portfolio.totalCounterparties,
              color: '#38bdf8',
            },
            { label: 'Overdue', value: fmt(data.portfolio.totalOverdueUsd), color: '#fbbf24' },
            {
              label: 'Overdue Rate',
              value: `${data.portfolio.overdueRatePct.toFixed(1)}%`,
              color: data.portfolio.overdueRatePct > 3 ? '#f87171' : '#fbbf24',
            },
            {
              label: 'Avg Risk Score',
              value: data.portfolio.weightedAvgRiskScore,
              color: data.portfolio.weightedAvgRiskScore >= 50 ? '#f87171' : '#34d399',
            },
            {
              label: 'Concentration',
              value: data.portfolio.concentrationRisk,
              color: data.portfolio.concentrationRisk === 'elevated' ? '#fbbf24' : '#34d399',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3 border border-sky-500/10"
              style={{ background: 'rgba(10,22,40,0.8)' }}
            >
              <div className="text-[10px] text-sky-400/50 uppercase tracking-wider mb-1">
                {s.label}
              </div>
              <div className="text-lg font-bold capitalize" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.provenance && (
        <div
          className="flex items-center gap-3 mb-5 px-3 py-2 rounded-lg border border-emerald-500/15"
          style={{ background: 'rgba(52,211,153,0.04)' }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-emerald-300/70 font-medium">
            {data.provenance.attestation}
          </span>
          <span className="text-[10px] text-sky-400/40">·</span>
          <span className="text-[10px] text-sky-400/50">
            {Math.round(data.provenance.confidence * 100)}% confidence
          </span>
          <span className="text-[10px] text-sky-400/40">·</span>
          <span className="text-[10px] text-sky-400/40">
            Fetched {new Date(data.provenance.freshness.fetchedAt).toLocaleTimeString()}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-3.5 h-3.5 text-sky-400/40" />
        <span className="text-[10px] text-sky-400/50">Sort by:</span>
        {[
          { k: 'riskScore', label: 'Risk Score' },
          { k: 'exposure', label: 'Exposure' },
          { k: 'overdue', label: 'Overdue' },
        ].map((o) => (
          <button
            key={o.k}
            onClick={() => setSortBy(o.k as any)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] border transition-colors',
              sortBy === o.k
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                : 'border-sky-500/10 text-sky-400/50 hover:text-sky-300/70',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7 grid grid-cols-2 gap-3 content-start">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center h-48 text-sky-400/40 text-sm">
              Loading counterparty map…
            </div>
          ) : (
            cps.map((cp) => (
              <CPCard
                key={cp.id}
                cp={cp}
                selected={selected?.id === cp.id}
                onClick={() => setSelected(selected?.id === cp.id ? null : cp)}
              />
            ))
          )}
        </div>

        <div className="col-span-5">
          {selected ? (
            <div
              className="rounded-xl border border-sky-500/10 p-4 sticky top-4"
              style={{ background: 'rgba(10,22,40,0.9)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: RISK_CONFIG[selected.riskTier]?.bg }}
                >
                  <Building2
                    className="w-4 h-4"
                    style={{ color: RISK_CONFIG[selected.riskTier]?.color }}
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-sky-100">{selected.name}</div>
                  <div className="text-[10px] text-sky-400/50 capitalize">
                    {selected.type.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>
              <RiskBar score={selected.riskScore} />
              <div className="space-y-2.5 mt-4 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Country</span>
                  <span className="text-sky-200">{selected.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Credit Rating</span>
                  <span className="text-sky-200 font-mono">{selected.creditRating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Active Contracts</span>
                  <span className="text-sky-200">{selected.activeContracts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Total Exposure</span>
                  <span className="text-sky-200">{fmt(selected.totalExposureUsd)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Overdue</span>
                  <span style={{ color: selected.overdueAmount > 0 ? '#fbbf24' : '#34d399' }}>
                    {fmt(selected.overdueAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Overdue Rate</span>
                  <span style={{ color: selected.overdueRatePct > 3 ? '#f87171' : '#34d399' }}>
                    {selected.overdueRatePct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Payment Record</span>
                  <span
                    className="capitalize"
                    style={{
                      color:
                        selected.paymentRecord === 'excellent'
                          ? '#34d399'
                          : selected.paymentRecord === 'good'
                            ? '#38bdf8'
                            : selected.paymentRecord === 'fair'
                              ? '#fbbf24'
                              : '#f87171',
                    }}
                  >
                    {selected.paymentRecord}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Sanction Risk</span>
                  <span
                    className="capitalize"
                    style={{ color: SANCTION_RISK_CONFIG[selected.sanctionRisk]?.color }}
                  >
                    {SANCTION_RISK_CONFIG[selected.sanctionRisk]?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Concentration</span>
                  <span className="text-sky-200">
                    {selected.concentrationPct.toFixed(1)}% of portfolio
                  </span>
                </div>
              </div>
              {selected.relationships.length > 0 && (
                <div className="mt-3 pt-3 border-t border-sky-500/10">
                  <div className="text-[9px] text-sky-400/40 mb-1.5">Relationship Types</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.relationships.map((r) => (
                      <span
                        key={r}
                        className="text-[9px] px-2 py-0.5 rounded-full border border-sky-500/20 text-sky-400/60"
                      >
                        {r.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-sky-500/10">
                <div className="text-[9px] text-sky-400/40 mb-1.5">
                  Provenance · {selected.provenance.attestation}
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-sky-300/60">
                    {Math.round(selected.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="text-[9px] text-sky-400/30 mt-0.5">
                  Last reviewed {new Date(selected.lastReviewedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl border border-sky-500/10 p-4"
              style={{ background: 'rgba(10,22,40,0.8)' }}
            >
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Eye className="w-6 h-6 text-sky-400/30 mb-2" />
                <p className="text-sky-400/40 text-sm">Select a counterparty to inspect</p>
                <p className="text-sky-400/25 text-xs mt-1">
                  Exposure, credit, sanction risk, payment record
                </p>
              </div>
            </div>
          )}

          {data?.portfolio && (
            <div
              className="rounded-xl border border-sky-500/10 p-4 mt-3"
              style={{ background: 'rgba(10,22,40,0.8)' }}
            >
              <div className="text-[10px] text-sky-400/50 uppercase tracking-wider mb-3">
                Risk Distribution
              </div>
              {Object.entries(data.portfolio.byRisk).map(([tier, count]) => (
                <div key={tier} className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: RISK_CONFIG[tier]?.color ?? '#888' }}
                  />
                  <span className="text-[11px] text-sky-300/70 capitalize w-16">{tier}</span>
                  <div
                    className="flex-1 h-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${(count / data.portfolio.totalCounterparties) * 100}%`,
                        background: RISK_CONFIG[tier]?.color ?? '#888',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-sky-400/40 w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
