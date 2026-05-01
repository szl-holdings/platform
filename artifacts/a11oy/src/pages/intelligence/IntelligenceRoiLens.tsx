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
import { Link } from 'wouter';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const base = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

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
  a11oy_tools_active: string[];
  notes: string;
}

const PORTFOLIO: PortfolioEntity[] = [
  {
    id: 'a11oy',
    name: 'A11oy Platform',
    slug: 'a11oy',
    category: 'AI Infrastructure',
    invested: 420000,
    current_value: 2100000,
    revenue_arr: 680000,
    ebitda_margin: 34,
    roi_multiple: 5.0,
    status: 'growing',
    a11oy_tools_active: ['marketing.audit', 'seo.audit', 'finance.terminal'],
    notes: 'Flagship governed intelligence layer. 3 new tool adapters live this quarter.',
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
    a11oy_tools_active: ['marketing.audit', 'seo.audit'],
    notes: 'Ads + SEO audit pages shipped. Marketing automation pipeline 60% built.',
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
    a11oy_tools_active: ['finance.terminal'],
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
    a11oy_tools_active: [],
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
    a11oy_tools_active: [],
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
    a11oy_tools_active: ['marketing.audit'],
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
          ? 'border-[var(--color-a11oy-gold-dim)] bg-[var(--color-a11oy-gold-glow)]'
          : 'border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] hover:border-[var(--color-a11oy-muted)]'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-a11oy-text)]">{e.name}</p>
          <p className="text-[10px] text-[var(--color-a11oy-text-ghost)]">{e.category}</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 border-[var(--color-a11oy-border)] text-[var(--color-a11oy-text-sub)]">
          <Icon className="w-2.5 h-2.5" />
          {e.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-[var(--color-a11oy-text-ghost)]">Value</p>
          <p className="text-base font-semibold text-[var(--color-a11oy-text)]">{fmt(adjusted_value)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-a11oy-text-ghost)]">ROI</p>
          <p className="text-base font-semibold text-[var(--color-a11oy-gold)]">
            {adjusted_roi.toFixed(1)}×
          </p>
        </div>
      </div>
      {e.a11oy_tools_active.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {e.a11oy_tools_active.map((t) => (
            <span
              key={t}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--color-a11oy-gold-dim)] text-[var(--color-a11oy-gold)] bg-[var(--color-a11oy-gold-glow)]"
            >
              {t}
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

export function IntelligenceRoiLens() {
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
    roi: Number(((e.current_value * multiplier) / e.invested).toFixed(1)),
  }));

  const selectedEntity = PORTFOLIO.find((e) => e.id === selected);

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
      body: JSON.stringify({
        entity: selectedEntity.name,
        include_filings: false,
        include_ownership: false,
      }),
    })
      .then(async (resp) => {
        if (!resp.ok) {
          const body = (await resp.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Server returned ${resp.status}`);
        }
        return resp.json() as Promise<FinanceEntityData>;
      })
      .then((data) => {
        if (!cancelled) setFinanceData(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFinanceError(err instanceof Error ? err.message : 'Finance lookup failed');
        }
      })
      .finally(() => {
        if (!cancelled) setFinanceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected, selectedEntity?.name]);

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
        <Link
          href={`${base}/intelligence`}
          className="flex items-center gap-1 text-xs text-[var(--color-a11oy-text-ghost)] hover:text-[var(--color-a11oy-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Intelligence
        </Link>
        <span className="text-[var(--color-a11oy-border)]">/</span>
        <span className="text-xs text-[var(--color-a11oy-text)]">ROI Lens</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-a11oy-text)] flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-[var(--color-a11oy-gold)]" />
            SZL Holdings · ROI Lens
          </h1>
          <p className="text-sm text-[var(--color-a11oy-text-sub)] mt-1">
            Portfolio-wide return analysis across 6 entities. Select a scenario to apply portfolio
            adjustment. Entity intelligence sourced from{' '}
            <a
              href="https://github.com/Fincept-Corporation/FinceptTerminalFree"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-a11oy-gold)] hover:underline inline-flex items-center gap-0.5"
            >
              Fincept Terminal
              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
            </a>{' '}
            (AGPL-isolated MCP proxy).
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--color-a11oy-card)] border border-[var(--color-a11oy-border)] rounded-xl p-1">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => setScenario(s.key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                scenario === s.key
                  ? 'bg-[var(--color-a11oy-gold)] text-[var(--color-a11oy-navy)] font-semibold'
                  : 'text-[var(--color-a11oy-text-ghost)] hover:text-[var(--color-a11oy-text)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Invested', value: fmt(total_invested) },
          { label: 'Portfolio Value', value: fmt(total_value) },
          { label: 'Portfolio ROI', value: `${portfolio_roi.toFixed(1)}×` },
          { label: 'Total ARR', value: fmt(total_arr) },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-4"
          >
            <p className="text-2xl font-semibold text-[var(--color-a11oy-gold)]">{k.value}</p>
            <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-4 h-4 text-[var(--color-a11oy-text-ghost)]" />
          <span className="text-xs text-[var(--color-a11oy-text)] font-medium">
            Invested vs. Current Value (USD '000s)
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#888888', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#888888', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#141414',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: '#f5f5f5' }}
              itemStyle={{ color: '#f5f5f5' }}
              formatter={(v: number) => [`$${v}K`]}
            />
            <Bar dataKey="invested" name="Invested" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="value" name="Current Value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.roi >= 3 ? '#c9b787' : entry.roi >= 2 ? '#a89868' : '#8a8a8a'}
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
        <div className="rounded-2xl border border-[var(--color-a11oy-gold-dim)] bg-[var(--color-a11oy-card)] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--color-a11oy-text)] flex items-center gap-2">
              <Info className="w-4 h-4 text-[var(--color-a11oy-gold)]" />
              {selectedEntity.name} · Detail
            </h3>
            <button
              onClick={() => setSelected(null)}
              className="text-[var(--color-a11oy-text-ghost)] hover:text-[var(--color-a11oy-text)] transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Invested', value: fmt(selectedEntity.invested) },
              { label: 'Current Value', value: fmt(selectedEntity.current_value * multiplier) },
              { label: 'ARR', value: fmt(selectedEntity.revenue_arr) },
              { label: 'EBITDA Margin', value: `${selectedEntity.ebitda_margin}%` },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-navy)] p-3"
              >
                <p className="text-base font-semibold text-[var(--color-a11oy-text)]">{k.value}</p>
                <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] uppercase tracking-wider mb-2">
              Revenue Run-Rate Deltas
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {getDeltas(selectedEntity).map(({ period, value, delta: d }) => (
                <div
                  key={period}
                  className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-navy)] p-3"
                >
                  <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] mb-1">{period}</p>
                  <p className="text-sm font-semibold text-[var(--color-a11oy-text)]">{fmt(value)}</p>
                  <p
                    className={`text-[10px] font-mono mt-0.5 ${
                      d >= 0 ? 'text-[var(--color-a11oy-gold)]' : 'text-[var(--color-a11oy-text-sub)]'
                    }`}
                  >
                    {d >= 0 ? '+' : ''}
                    {d.toFixed(1)}% vs prior
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] uppercase tracking-wider">
                Finance Terminal Intelligence
              </p>
              {financeLoading && (
                <Loader className="w-3 h-3 text-[var(--color-a11oy-gold)] animate-spin" />
              )}
              {!financeLoading && financeData && (
                <span className="text-[9px] font-mono text-[var(--color-a11oy-gold)]/60">
                  {financeData.mcp_source} · {financeData.duration_ms}ms
                </span>
              )}
            </div>

            {financeError && (
              <div
                className="rounded-xl border px-3 py-2 text-xs"
                style={{
                  borderColor: 'rgba(245,245,245,0.2)',
                  color: 'var(--color-a11oy-critical)',
                }}
              >
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
                        <div
                          key={k}
                          className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-navy)] p-3"
                        >
                          <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] capitalize">
                            {k.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm font-semibold text-[var(--color-a11oy-text)] mt-0.5">
                            {v as string}
                          </p>
                        </div>
                      ))}
                  </div>
                )}

                {financeData.ai_narrative && (
                  <div className="rounded-xl border border-[var(--color-a11oy-gold-dim)] bg-[var(--color-a11oy-gold-glow)] p-4">
                    <p className="text-[10px] font-mono text-[var(--color-a11oy-gold)] uppercase tracking-wider mb-2">
                      AI Narrative · Fincept Terminal
                    </p>
                    <p className="text-sm text-[var(--color-a11oy-text)] leading-relaxed">
                      {financeData.ai_narrative}
                    </p>
                  </div>
                )}

                {financeData.risk_flags && financeData.risk_flags.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] uppercase tracking-wider mb-2">
                      Risk Flags
                    </p>
                    <div className="space-y-2">
                      {financeData.risk_flags.map((rf, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-navy)] px-3 py-2 text-xs text-[var(--color-a11oy-text-sub)]"
                        >
                          <span className="font-semibold text-[var(--color-a11oy-text)]">
                            {rf.flag}
                          </span>
                          {rf.note && (
                            <span className="text-[var(--color-a11oy-text-ghost)] ml-2">
                              — {rf.note}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-sm text-[var(--color-a11oy-text)] leading-relaxed">
            {selectedEntity.notes}
          </p>

          {selectedEntity.a11oy_tools_active.length > 0 && (
            <div>
              <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] uppercase tracking-wider mb-2">
                Active A11oy Tools
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedEntity.a11oy_tools_active.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg border border-[var(--color-a11oy-gold-dim)] text-[var(--color-a11oy-gold)] bg-[var(--color-a11oy-gold-glow)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] font-mono text-center">
        a11oy v4.2 · portfolio.roi · Scenario: {scenario} ({multiplier}× applied) · finance.terminal
        via /api/praxis-tools/finance-terminal
      </p>
    </div>
  );
}
