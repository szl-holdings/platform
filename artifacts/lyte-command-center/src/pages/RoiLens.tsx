import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  DollarSign,
  ExternalLink,
  Info,
  Loader,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

interface PortfolioEntity {
  id: string;
  name: string;
  slug: string;
  category: string;
  invested: number;
  current_value: number;
  revenue_arr: number;
  ebitda_margin: number;
  roi_multiple: number;
  status: 'growing' | 'stable' | 'watch';
  praxis_tools_active: string[];
  notes: string;
}

const PORTFOLIO: PortfolioEntity[] = [
  {
    id: 'nexus',
    name: 'NEXUS Platform',
    slug: 'mockup-sandbox',
    category: 'AI Infrastructure',
    invested: 420000,
    current_value: 2100000,
    revenue_arr: 680000,
    ebitda_margin: 34,
    roi_multiple: 5.0,
    status: 'growing',
    praxis_tools_active: ['mcp_marketing_audit', 'mcp_seo_audit', 'mcp_finance_terminal'],
    notes: 'Flagship intelligence layer. 3 new PRAXIS adapters live this quarter.',
  },
  {
    id: 'carlota-jo',
    name: 'Carlota Jo Consulting',
    slug: 'carlota-jo',
    category: 'Professional Services',
    invested: 180000,
    current_value: 720000,
    revenue_arr: 1840000,
    ebitda_margin: 28,
    roi_multiple: 4.0,
    status: 'growing',
    praxis_tools_active: ['mcp_marketing_audit', 'mcp_seo_audit'],
    notes: 'Ads Audit + SEO Audit pages shipped. Marketing automation pipeline 60% built.',
  },
  {
    id: 'vessels',
    name: 'Vessels Maritime',
    slug: 'vessels',
    category: 'Maritime Intelligence',
    invested: 220000,
    current_value: 660000,
    revenue_arr: 920000,
    ebitda_margin: 22,
    roi_multiple: 3.0,
    status: 'stable',
    praxis_tools_active: ['mcp_finance_terminal'],
    notes: 'AIS feed integration complete. Subscription model under evaluation.',
  },
  {
    id: 'sentra',
    name: 'Sentra Cyber',
    slug: 'sentra',
    category: 'Cybersecurity',
    invested: 310000,
    current_value: 930000,
    revenue_arr: 1120000,
    ebitda_margin: 31,
    roi_multiple: 3.0,
    status: 'growing',
    praxis_tools_active: [],
    notes: 'SOC 2 Type II in progress. Enterprise pipeline strong at $800K identified.',
  },
  {
    id: 'counsel',
    name: 'Counsel Legal',
    slug: 'counsel',
    category: 'LegalTech',
    invested: 140000,
    current_value: 322000,
    revenue_arr: 480000,
    ebitda_margin: 19,
    roi_multiple: 2.3,
    status: 'watch',
    praxis_tools_active: [],
    notes: 'Matter management adoption slower than projected. Pricing experiment Q2.',
  },
  {
    id: 'terra',
    name: 'Terra Real Estate',
    slug: 'terra',
    category: 'PropTech',
    invested: 95000,
    current_value: 218500,
    revenue_arr: 290000,
    ebitda_margin: 16,
    roi_multiple: 2.3,
    status: 'watch',
    praxis_tools_active: ['mcp_marketing_audit'],
    notes: 'Market headwinds. Repositioning to commercial real estate data layer.',
  },
];

const SCENARIOS = [
  { key: 'base', label: 'Base Case', multiplier: 1.0 },
  { key: 'bull', label: 'Bull (+20%)', multiplier: 1.2 },
  { key: 'bear', label: 'Bear (−15%)', multiplier: 0.85 },
];

function fmt(n: number, prefix = '$') {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(0)}K`;
  return `${prefix}${n}`;
}

const statusColors = {
  growing: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  stable: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  watch: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

const statusIcons = {
  growing: TrendingUp,
  stable: CheckCircle,
  watch: TrendingDown,
};

interface EntityCardProps {
  e: PortfolioEntity;
  scenario: number;
  selected: boolean;
  onClick: () => void;
}

function EntityCard({ e, scenario, selected, onClick }: EntityCardProps) {
  const adjusted_value = e.current_value * scenario;
  const adjusted_roi = e.invested > 0 ? adjusted_value / e.invested : 0;
  const Icon = statusIcons[e.status];

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition-all ${
        selected
          ? 'border-cyan-500/40 bg-cyan-500/5'
          : 'border-[#1a2436] bg-[#0e1520] hover:border-[#243347]'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-[#e2e8f0]">{e.name}</p>
          <p className="text-[10px] text-[#64748b]">{e.category}</p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusColors[e.status]}`}
        >
          <Icon className="w-2.5 h-2.5" />
          {e.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-[#64748b]">Value</p>
          <p className="text-base font-bold text-[#e2e8f0]">{fmt(adjusted_value)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#64748b]">ROI</p>
          <p className={`text-base font-bold ${adjusted_roi >= 3 ? 'text-emerald-400' : adjusted_roi >= 2 ? 'text-amber-400' : 'text-red-400'}`}>
            {adjusted_roi.toFixed(1)}×
          </p>
        </div>
      </div>
      {e.praxis_tools_active.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {e.praxis_tools_active.map((t) => (
            <span
              key={t}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/20 text-cyan-400/70 bg-cyan-500/5"
            >
              {t.replace('mcp_', '')}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

interface FinanceEntityData {
  name: string;
  legal_name?: string;
  jurisdiction?: string;
  sector?: string;
  financials?: {
    revenue?: string;
    revenue_growth?: string;
    ebitda_margin?: string;
    debt_equity?: string;
    cash_runway?: string;
    market_cap?: string;
  };
  risk_flags?: Array<{ flag: string; severity: string; note: string }>;
  ai_narrative?: string;
  mcp_source?: string;
  duration_ms?: number;
}

function delta(base: number, pct: number) {
  return base * (1 + pct / 100);
}

export default function RoiLens() {
  const [scenario, setScenario] = useState<string>('base');
  const [selected, setSelected] = useState<string | null>(null);
  const [financeData, setFinanceData] = useState<FinanceEntityData | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);

  const multiplier = SCENARIOS.find((s) => s.key === scenario)?.multiplier ?? 1;

  const total_invested = PORTFOLIO.reduce((s, e) => s + e.invested, 0);
  const total_value = PORTFOLIO.reduce((s, e) => s + e.current_value * multiplier, 0);
  const portfolio_roi = total_value / total_invested;
  const total_arr = PORTFOLIO.reduce((s, e) => s + e.revenue_arr, 0);

  const chartData = PORTFOLIO.map((e) => ({
    name: e.name.split(' ')[0],
    invested: e.invested / 1000,
    value: (e.current_value * multiplier) / 1000,
    roi: Number((e.current_value * multiplier / e.invested).toFixed(1)),
  }));

  const selectedEntity = PORTFOLIO.find((e) => e.id === selected);

  // Fetch Fincept Terminal data whenever the selected entity changes
  useEffect(() => {
    if (!selectedEntity) {
      setFinanceData(null);
      return;
    }

    let cancelled = false;
    setFinanceLoading(true);
    setFinanceError(null);
    setFinanceData(null);

    fetch('/api/praxis-tools/finance-terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: selectedEntity.name, include_filings: false, include_ownership: false }),
    })
      .then(async (resp) => {
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? `Server returned ${resp.status}`);
        }
        return resp.json() as Promise<FinanceEntityData>;
      })
      .then((data) => {
        if (!cancelled) setFinanceData(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setFinanceError(err instanceof Error ? err.message : 'Finance lookup failed');
      })
      .finally(() => {
        if (!cancelled) setFinanceLoading(false);
      });

    return () => { cancelled = true; };
  }, [selected, selectedEntity?.name]);

  // Synthesise today/week/MTD deltas from the selected entity's revenue_arr
  function getDeltas(e: PortfolioEntity) {
    const dailyRun = e.revenue_arr / 365;
    return [
      { period: 'Today', value: dailyRun, delta: +1.4 },
      { period: 'Week', value: dailyRun * 7, delta: -0.8 },
      { period: 'MTD', value: dailyRun * 30, delta: +3.1 },
      { period: 'QTD', value: dailyRun * 90, delta: +8.7 },
    ];
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <a
          href={`${base}/`}
          className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#e2e8f0] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Command
        </a>
        <span className="text-[#1a2436]">/</span>
        <span className="text-xs text-[#e2e8f0]">ROI Lens</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0] flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-lime-400" />
            SZL Holdings — ROI Lens
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Portfolio-wide return analysis across 6 entities. Select a scenario to apply portfolio
            adjustment. Entity intelligence sourced from{' '}
            <a
              href="https://github.com/Fincept-Corporation/FinceptTerminalFree"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
            >
              Fincept Terminal
              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
            </a>
            {' '}(AGPL-isolated MCP proxy).
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0e1520] border border-[#1a2436] rounded-xl p-1">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => setScenario(s.key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                scenario === s.key
                  ? 'bg-lime-500 text-black font-semibold'
                  : 'text-[#64748b] hover:text-[#e2e8f0]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Invested', value: fmt(total_invested), color: 'text-[#e2e8f0]' },
          { label: 'Portfolio Value', value: fmt(total_value), color: 'text-lime-400' },
          {
            label: 'Portfolio ROI',
            value: `${portfolio_roi.toFixed(1)}×`,
            color: portfolio_roi >= 3 ? 'text-emerald-400' : 'text-amber-400',
          },
          { label: 'Total ARR', value: fmt(total_arr), color: 'text-cyan-400' },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-[#1a2436] bg-[#0e1520] p-4"
          >
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-[#64748b] mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#1a2436] bg-[#0e1520] p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-4 h-4 text-[#64748b]" />
          <span className="text-xs text-[#e2e8f0] font-medium">Invested vs. Current Value (USD '000s)</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2436" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0e1520', border: '1px solid #1a2436', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#e2e8f0' }}
              itemStyle={{ color: '#e2e8f0' }}
              formatter={(v: number) => [`$${v}K`]}
            />
            <Bar dataKey="invested" name="Invested" fill="#1a2436" radius={[4, 4, 0, 0]} />
            <Bar dataKey="value" name="Current Value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.roi >= 3 ? '#a3e635' : entry.roi >= 2 ? '#22d3ee' : '#f59e0b'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PORTFOLIO.map((e) => (
          <EntityCard
            key={e.id}
            e={e}
            scenario={multiplier}
            selected={selected === e.id}
            onClick={() => setSelected(selected === e.id ? null : e.id)}
          />
        ))}
      </div>

      {selectedEntity && (
        <div className="rounded-2xl border border-[#243347] bg-[#0e1520] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              {selectedEntity.name} — Detail
            </h3>
            <button
              onClick={() => setSelected(null)}
              className="text-[#64748b] hover:text-[#e2e8f0] transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Portfolio metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Invested', value: fmt(selectedEntity.invested) },
              { label: 'Current Value', value: fmt(selectedEntity.current_value * multiplier) },
              { label: 'ARR', value: fmt(selectedEntity.revenue_arr) },
              { label: 'EBITDA Margin', value: `${selectedEntity.ebitda_margin}%` },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-[#1a2436] bg-[#080d14] p-3">
                <p className="text-base font-bold text-[#e2e8f0]">{k.value}</p>
                <p className="text-[10px] text-[#64748b] mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Revenue run-rate deltas (Today / Week / MTD / QTD) */}
          <div>
            <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">Revenue Run-Rate Deltas</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {getDeltas(selectedEntity).map(({ period, value, delta: d }) => (
                <div key={period} className="rounded-xl border border-[#1a2436] bg-[#080d14] p-3">
                  <p className="text-[10px] text-[#64748b] mb-1">{period}</p>
                  <p className="text-sm font-bold text-[#e2e8f0]">{fmt(value)}</p>
                  <p className={`text-[10px] font-mono mt-0.5 ${d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {d >= 0 ? '+' : ''}{d.toFixed(1)}% vs prior
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Fincept Terminal entity intelligence */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Finance Terminal Intelligence</p>
              {financeLoading && <Loader className="w-3 h-3 text-cyan-400 animate-spin" />}
              {!financeLoading && financeData && (
                <span className="text-[9px] font-mono text-cyan-400/60">
                  {financeData.mcp_source} · {financeData.duration_ms}ms
                </span>
              )}
            </div>

            {financeError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {financeError}
              </div>
            )}

            {financeData && !financeLoading && (
              <div className="space-y-4">
                {financeData.financials && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(financeData.financials)
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <div key={k} className="rounded-xl border border-[#1a2436] bg-[#080d14] p-3">
                          <p className="text-[10px] text-[#64748b] capitalize">{k.replace(/_/g, ' ')}</p>
                          <p className="text-sm font-bold text-[#e2e8f0] mt-0.5">{v as string}</p>
                        </div>
                      ))}
                  </div>
                )}

                {financeData.ai_narrative && (
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <p className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-wider mb-2">
                      AI Narrative · Fincept Terminal
                    </p>
                    <p className="text-sm text-[#e2e8f0] leading-relaxed">{financeData.ai_narrative}</p>
                  </div>
                )}

                {financeData.risk_flags && financeData.risk_flags.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">Risk Flags</p>
                    <div className="space-y-2">
                      {financeData.risk_flags.map((rf, i) => (
                        <div
                          key={i}
                          className={`rounded-lg border px-3 py-2 text-xs ${
                            rf.severity === 'high'
                              ? 'border-red-500/20 bg-red-500/5 text-red-400'
                              : 'border-amber-500/20 bg-amber-500/5 text-amber-400'
                          }`}
                        >
                          <span className="font-semibold">{rf.flag}</span>
                          {rf.note && <span className="text-[#64748b] ml-2">— {rf.note}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-sm text-[#e2e8f0] leading-relaxed">{selectedEntity.notes}</p>

          {selectedEntity.praxis_tools_active.length > 0 && (
            <div>
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">
                Active PRAXIS Tools
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedEntity.praxis_tools_active.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg border border-cyan-500/20 text-cyan-400 bg-cyan-500/5"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-[#64748b]/50 font-mono text-center">
        PRAXIS v2 · portfolio.roi · Scenario: {scenario} ({multiplier}× applied) · finance.terminal via /api/praxis-tools/finance-terminal
      </p>
    </div>
  );
}
