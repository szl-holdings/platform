import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { PageDataSkeleton } from '@szl-holdings/shared-ui/page-data-skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  Database,
  Download,
  FolderOpen,
  Layers,
  Loader2,
  Pencil,
  Save,
  Thermometer,
  Trash2,
  Zap,
} from 'lucide-react';
import { calcWaterfall, DEFAULT_WATERFALL_INPUTS, type WaterfallInputs } from '../lib/waterfall-math';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link, useRoute } from 'wouter';
import { api } from '../lib/api';

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color?: string;
  fill?: string;
}
interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.05)',
  accent: { gold: '#b8943c', blue: '#3a7ad4', green: '#40856a', red: '#c0503a', purple: '#7c5cbf' },
  text: {
    primary: 'rgba(255,255,255,0.85)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.3)',
    muted: 'rgba(255,255,255,0.18)',
  },
};

const DEMO_WATERFALL_STRUCTURES: { name: string; inputs: WaterfallInputs }[] = [
  { name: 'Demo · Standard 8% Pref / 80-20 Promote', inputs: { ...DEFAULT_WATERFALL_INPUTS } },
];

const fmt = (n: number) =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(2)}B`
    : n >= 1e6
      ? `$${(n / 1e6).toFixed(2)}M`
      : n >= 1e3
        ? `$${(n / 1e3).toFixed(0)}K`
        : `$${Math.round(n).toLocaleString()}`;
const pct = (n: number) => `${n.toFixed(2)}%`;

function useWaterfall(inputs: WaterfallInputs) {
  return useMemo(() => calcWaterfall(inputs), [inputs]);
}

function NumInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <div>
      <label
        className="block text-[9px] font-semibold uppercase tracking-wider mb-1"
        style={{ color: DS.text.muted }}
      >
        {label}
      </label>
      <div
        className="flex items-center rounded-lg border overflow-hidden"
        style={{ borderColor: DS.border, background: 'rgba(255,255,255,0.03)' }}
      >
        {prefix && (
          <span className="px-2 text-[10px]" style={{ color: DS.text.muted }}>
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          step={step ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white focus:outline-none w-full"
        />
        {suffix && (
          <span className="px-2 text-[10px]" style={{ color: DS.text.muted }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg p-2 text-xs shadow-xl"
      style={{ background: 'rgba(10,12,16,0.97)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="font-semibold text-white/80 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex gap-2">
          <span style={{ color: p.fill ?? p.color }}>{p.name}:</span>
          <span className="text-white/70">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const TIER_COLORS = [DS.accent.blue, DS.accent.green, DS.accent.purple, DS.accent.gold];

function exportWaterfallCSV(
  inputs: WaterfallInputs,
  r: ReturnType<typeof useWaterfall>,
  name: string,
) {
  const rows = [
    ['Terra — Investor Waterfall Export'],
    ['Structure Name', name],
    ['Export Date', new Date().toLocaleDateString()],
    [],
    ['=== INPUTS ==='],
    ['Total Equity', inputs.totalEquity],
    ['GP Contribution %', inputs.gpContributionPct],
    ['Preferred Return % (p.a.)', inputs.preferredReturn],
    ['GP Catch-Up %', inputs.catchUpPct],
    ['GP Promote %', inputs.promotePct],
    ['Exit Proceeds', inputs.exitProceeds],
    ['Hold Period (months)', inputs.holdMonths],
    [],
    ['=== SUMMARY ==='],
    ['', 'GP', 'LP'],
    ['Equity Invested', r.gpEquity, r.lpEquity],
    ['Total Distributions', r.gpTotal, r.lpTotal],
    ['Equity Multiple', `${r.gpEM.toFixed(2)}x`, `${r.lpEM.toFixed(2)}x`],
    ['IRR', `${r.gpIRR.toFixed(2)}%`, `${r.lpIRR.toFixed(2)}%`],
    [],
    ['=== WATERFALL TIERS ==='],
    ['Tier', 'Description', 'GP Amount', 'LP Amount', 'Total', 'GP %', 'LP %'],
    ...r.tiers.map((t) => [
      t.tier,
      t.description,
      t.gpAmount,
      t.lpAmount,
      t.total,
      `${t.gpPct.toFixed(1)}%`,
      `${t.lpPct.toFixed(1)}%`,
    ]),
    [],
    [
      'Total',
      '',
      r.gpTotal,
      r.lpTotal,
      inputs.exitProceeds,
      `${((r.gpTotal / inputs.exitProceeds) * 100).toFixed(1)}%`,
      `${((r.lpTotal / inputs.exitProceeds) * 100).toFixed(1)}%`,
    ],
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `waterfall-${name.replace(/\s+/g, '-').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function WaterfallCalculatorPage() {
  const [, params] = useRoute<{ propertyId: string }>('/waterfall-calculator/:propertyId');
  const propertyId = params?.propertyId;

  const { data: propertyData, isLoading: propertyLoading } = useStandardQuery({
    queryKey: ['terra-waterfall', propertyId],
    queryFn: () => api.properties.waterfall(propertyId!),
    enabled: !!propertyId,
    staleTime: 300_000,
  });

  const queryClient = useQueryClient();

  const { data: savedStructures } = useStandardQuery({
    queryKey: ['terra-waterfall-structures'],
    queryFn: () => api.waterfall.list(),
    staleTime: 30_000,
  });

  const saveStructureMutation = useStandardMutation({
    mutationFn: (data: {
      name: string;
      inputs: Record<string, unknown>;
      results: Record<string, unknown>;
    }) => api.waterfall.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terra-waterfall-structures'] });
    },
  });

  const updateStructureMutation = useStandardMutation({
    mutationFn: (args: { id: string; name: string }) =>
      api.waterfall.update(args.id, { name: args.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terra-waterfall-structures'] });
    },
  });

  const seedDemoMutation = useStandardMutation({
    mutationFn: async () => {
      for (const demo of DEMO_WATERFALL_STRUCTURES) {
        const computed = calcWaterfall(demo.inputs);
        await api.waterfall.create({
          name: demo.name,
          inputs: demo.inputs as unknown as Record<string, unknown>,
          results: {
            gpEM: computed.gpEM,
            lpEM: computed.lpEM,
            gpIRR: computed.gpIRR,
            lpIRR: computed.lpIRR,
            gpTotal: computed.gpTotal,
            lpTotal: computed.lpTotal,
          },
          isDemo: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terra-waterfall-structures'] });
    },
  });

  const deleteStructureMutation = useStandardMutation({
    mutationFn: (id: string) => api.waterfall.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terra-waterfall-structures'] });
    },
  });

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [inputs, setInputs] = useState<WaterfallInputs>(DEFAULT_WATERFALL_INPUTS);
  const [showStructures, setShowStructures] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [structureName, setStructureName] = useState('Waterfall Structure');

  const [climatePropertyId, setClimatePropertyId] = useState('prop-sf-001');
  const [fetchClimate, setFetchClimate] = useState(false);
  const [climateApplied, setClimateApplied] = useState(false);
  const [showClimatePanel, setShowClimatePanel] = useState(false);
  const [propClimateApplied, setPropClimateApplied] = useState(false);
  const [showPropClimatePanel, setShowPropClimatePanel] = useState(false);
  const [fetchPropClimate, setFetchPropClimate] = useState(false);

  const { data: climateData, isLoading: climateLoading } = useStandardQuery({
    queryKey: ['waterfall-climate-risk', climatePropertyId, fetchClimate],
    queryFn: () => api.properties.climateRisk(climatePropertyId),
    enabled: fetchClimate && !!climatePropertyId,
    staleTime: 300_000,
  });

  const { data: propClimateData, isLoading: propClimateLoading } = useStandardQuery({
    queryKey: ['waterfall-prop-climate-risk', propertyId, fetchPropClimate],
    queryFn: () => api.properties.climateRisk(propertyId!),
    enabled: fetchPropClimate && !!propertyId,
    staleTime: 300_000,
  });

  function applyClimateToStandalone() {
    const d = climateData?.data;
    if (!d) return;
    const haircut = d.valuationHaircut / 100;
    setInputs((prev) => ({
      ...prev,
      exitProceeds: parseFloat((prev.exitProceeds * (1 - haircut)).toFixed(0)),
    }));
    setClimateApplied(true);
  }

  function applyClimateToPropInputs() {
    const d = propClimateData?.data;
    if (!d || !propInputs) return;
    const haircut = d.valuationHaircut / 100;
    setPropInputs((prev) =>
      prev
        ? { ...prev, exitProceeds: parseFloat((prev.exitProceeds * (1 - haircut)).toFixed(0)) }
        : null,
    );
    setPropClimateApplied(true);
  }

  const set = (k: keyof WaterfallInputs) => (v: number) =>
    setInputs((prev) => ({ ...prev, [k]: v }));
  const r = useWaterfall(inputs);

  const d_prop = propertyData?.data;
  const [propInputs, setPropInputs] = useState<WaterfallInputs | null>(null);
  useEffect(() => {
    if (d_prop && propInputs === null) {
      setPropInputs({
        totalEquity: d_prop.totalEquity,
        gpContributionPct: d_prop.gpContributionPct,
        preferredReturn: d_prop.preferredReturn,
        catchUpPct: d_prop.catchUpPct,
        promotePct: d_prop.promotePct,
        exitProceeds: d_prop.exitProceeds,
        holdMonths: d_prop.holdMonths,
      });
    }
  }, [d_prop, propInputs]);
  const setP = (k: keyof WaterfallInputs) => (v: number) =>
    setPropInputs((prev) => (prev ? { ...prev, [k]: v } : null));
  const propWaterfall = useWaterfall(propInputs ?? DEFAULT_WATERFALL_INPUTS);

  const barData = r.tiers.map((t) => ({
    name: t.description.split(' (')[0],
    GP: t.gpAmount,
    LP: t.lpAmount,
  }));
  const pieData = [
    { name: 'GP Total', value: r.gpTotal, color: DS.accent.gold },
    { name: 'LP Total', value: r.lpTotal, color: DS.accent.blue },
  ];

  function saveStructure() {
    saveStructureMutation.mutate(
      {
        name: structureName,
        inputs: inputs as unknown as Record<string, unknown>,
        results: {
          gpEM: r.gpEM,
          lpEM: r.lpEM,
          gpIRR: r.gpIRR,
          lpIRR: r.lpIRR,
          gpTotal: r.gpTotal,
          lpTotal: r.lpTotal,
        },
      },
      {
        onSuccess: () => {
          setSavedMsg('Saved!');
          setTimeout(() => setSavedMsg(null), 2000);
        },
      },
    );
  }

  function loadStructure(s: { inputs: Record<string, unknown>; name: string }) {
    setInputs(s.inputs as unknown as WaterfallInputs);
    setStructureName(s.name);
    setShowStructures(false);
  }

  if (propertyId) {
    return (
      <div className="min-h-screen p-6" style={{ background: '#0a0c10' }}>
        <div className="max-w-5xl mx-auto">
          <Link href={`/property/${propertyId}`}>
            <span
              className="inline-flex items-center gap-1 text-xs mb-5 cursor-pointer"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Property
            </span>
          </Link>
          <div className="flex items-center justify-between gap-2.5 mb-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white">Investor Waterfall Calculator</h1>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold"
                style={{
                  color: DS.accent.purple,
                  background: `${DS.accent.purple}15`,
                  border: `1px solid ${DS.accent.purple}25`,
                }}
              >
                GP / LP
              </span>
              {(savedStructures?.structures.length ?? 0) > 0 ? (
                <span
                  className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    color: DS.accent.green,
                    background: `${DS.accent.green}10`,
                    border: `1px solid ${DS.accent.green}20`,
                  }}
                >
                  <Database className="w-2.5 h-2.5" />
                  Live DB · {savedStructures?.structures.length}
                </span>
              ) : (
                savedStructures && (
                  <button
                    onClick={() => seedDemoMutation.mutate()}
                    disabled={seedDemoMutation.isPending}
                    className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer"
                    style={{
                      color: DS.text.muted,
                      background: DS.surface,
                      border: `1px solid ${DS.border}`,
                    }}
                  >
                    <Database className="w-2.5 h-2.5" />
                    {seedDemoMutation.isPending ? 'Seeding…' : 'Seed Demo Data'}
                  </button>
                )
              )}
            </div>
            {propInputs && (
              <button
                onClick={() =>
                  exportWaterfallCSV(propInputs, propWaterfall, `Property ${propertyId}`)
                }
                className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 font-medium"
                style={{
                  background: DS.surface,
                  border: `1px solid ${DS.border}`,
                  color: DS.text.secondary,
                }}
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            )}
          </div>
          <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Property-scoped waterfall model for{' '}
            <code style={{ color: DS.accent.purple }}>{propertyId}</code> — edit inputs to model
            scenarios
          </p>

          {propertyLoading || !propInputs ? (
            <div
              className="rounded-xl p-6"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <PageDataSkeleton variant="dashboard" rows={4} showHeader showStats />
            </div>
          ) : (
            <>
              {/* Editable Inputs */}
              <div
                className="rounded-xl border p-4 mb-5"
                style={{ borderColor: DS.border, background: DS.surface }}
              >
                <p
                  className="text-[9px] uppercase tracking-wider mb-3"
                  style={{ color: DS.text.muted }}
                >
                  Deal Parameters — Edit to Model Scenarios
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <NumInput
                    label="Total Equity ($)"
                    value={propInputs.totalEquity}
                    onChange={setP('totalEquity')}
                    prefix="$"
                    step={100000}
                  />
                  <NumInput
                    label="Exit Proceeds ($)"
                    value={propInputs.exitProceeds}
                    onChange={setP('exitProceeds')}
                    prefix="$"
                    step={100000}
                  />
                  <NumInput
                    label="Hold Period (months)"
                    value={propInputs.holdMonths}
                    onChange={setP('holdMonths')}
                    suffix="mo"
                  />
                  <NumInput
                    label="GP Contribution %"
                    value={propInputs.gpContributionPct}
                    onChange={setP('gpContributionPct')}
                    suffix="%"
                    step={1}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <NumInput
                    label="Preferred Return (% p.a.)"
                    value={propInputs.preferredReturn}
                    onChange={setP('preferredReturn')}
                    suffix="%"
                    step={0.5}
                  />
                  <NumInput
                    label="GP Catch-Up %"
                    value={propInputs.catchUpPct}
                    onChange={setP('catchUpPct')}
                    suffix="%"
                    step={5}
                  />
                  <NumInput
                    label="GP Promote %"
                    value={propInputs.promotePct}
                    onChange={setP('promotePct')}
                    suffix="%"
                    step={1}
                  />
                </div>
              </div>

              {/* Summary Cards — computed from propInputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  {
                    label: 'Total Equity',
                    value: fmt(propInputs.totalEquity),
                    color: DS.text.primary,
                    sub: 'deal size',
                  },
                  {
                    label: 'GP Returns',
                    value: fmt(propWaterfall.gpTotal),
                    color: DS.accent.gold,
                    sub: `${propWaterfall.gpEM.toFixed(2)}× · ${pct(propWaterfall.gpIRR)} IRR`,
                  },
                  {
                    label: 'LP Returns',
                    value: fmt(propWaterfall.lpTotal),
                    color: DS.accent.blue,
                    sub: `${propWaterfall.lpEM.toFixed(2)}× · ${pct(propWaterfall.lpIRR)} IRR`,
                  },
                  {
                    label: 'Exit Proceeds',
                    value: fmt(propInputs.exitProceeds),
                    color: DS.accent.green,
                    sub: `${propInputs.holdMonths}mo hold`,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border p-4"
                    style={{ borderColor: DS.border, background: DS.surface }}
                  >
                    <p
                      className="text-[9px] uppercase tracking-wider"
                      style={{ color: DS.text.muted }}
                    >
                      {m.label}
                    </p>
                    <p className="text-xl font-bold font-mono mt-1" style={{ color: m.color }}>
                      {m.value}
                    </p>
                    <p className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
                      {m.sub}
                    </p>
                  </div>
                ))}
              </div>

              {/* Waterfall Tiers — computed live */}
              <div
                className="rounded-xl border overflow-hidden mb-4"
                style={{ borderColor: DS.border, background: DS.surface }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-2.5 border-b"
                  style={{ borderColor: DS.border }}
                >
                  <Layers className="w-3.5 h-3.5" style={{ color: DS.accent.purple }} />
                  <span className="text-xs font-semibold" style={{ color: DS.text.primary }}>
                    Waterfall Tiers
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: DS.border }}>
                  {propWaterfall.tiers.map((t, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3">
                      <span
                        className="text-[9px] font-mono w-4 text-center"
                        style={{ color: DS.text.muted }}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 text-xs" style={{ color: DS.text.secondary }}>
                        {t.description}
                      </span>
                      <div className="grid grid-cols-2 gap-6 text-right">
                        <div>
                          <p className="text-[9px]" style={{ color: DS.text.muted }}>
                            GP
                          </p>
                          <p
                            className="text-sm font-mono font-bold"
                            style={{ color: DS.accent.gold }}
                          >
                            {fmt(t.gpAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px]" style={{ color: DS.text.muted }}>
                            LP
                          </p>
                          <p
                            className="text-sm font-mono font-bold"
                            style={{ color: DS.accent.blue }}
                          >
                            {fmt(t.lpAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[9px]" style={{ color: DS.text.muted }}>
                Source: {d_prop?.dataSource}
              </p>

              {/* Climate Risk Auto-Pull — Property Waterfall */}
              <div
                className="rounded-xl border overflow-hidden mt-4"
                style={{ borderColor: DS.border, background: DS.surface }}
              >
                <button
                  onClick={() => setShowPropClimatePanel((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
                    <span className="text-xs font-semibold text-white/70">Climate Risk Overlay</span>
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
                      style={{
                        background: 'rgba(249,115,22,0.08)',
                        color: '#f97316',
                        border: '1px solid rgba(249,115,22,0.15)',
                      }}
                    >
                      Auto-Pull
                    </span>
                    {propClimateApplied && (
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"
                        style={{
                          background: 'rgba(52,211,153,0.08)',
                          color: '#34d399',
                          border: '1px solid rgba(52,211,153,0.15)',
                        }}
                      >
                        <CheckCircle className="w-2.5 h-2.5" />
                        Applied
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/30">
                    {showPropClimatePanel ? 'Collapse ▲' : 'Adjust exit proceeds for climate risk ▼'}
                  </span>
                </button>
                <AnimatePresence>
                  {showPropClimatePanel && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t" style={{ borderColor: DS.border }}>
                        <p className="text-[10px] text-white/30 mt-3 mb-3 leading-relaxed">
                          Fetch climate hazard data for this property and automatically reduce{' '}
                          <strong className="text-white/50">Exit Proceeds</strong> by the climate
                          valuation haircut — reflecting elevated insurance costs and market
                          liquidity discount on exit.
                        </p>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1">
                            <label
                              className="block text-[9px] font-semibold uppercase tracking-wider mb-1"
                              style={{ color: DS.text.muted }}
                            >
                              Property ID
                            </label>
                            <input
                              type="text"
                              value={propertyId ?? ''}
                              readOnly
                              className="w-full px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/4 border border-white/8 outline-none cursor-not-allowed"
                            />
                          </div>
                          <button
                            onClick={() => setFetchPropClimate(true)}
                            disabled={propClimateLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all self-end"
                            style={{
                              background: 'rgba(249,115,22,0.1)',
                              border: '1px solid rgba(249,115,22,0.2)',
                              color: '#f97316',
                            }}
                          >
                            {propClimateLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Thermometer className="w-3.5 h-3.5" />
                            )}
                            Pull Climate Risk
                          </button>
                        </div>
                        {propClimateData?.data && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                {
                                  label: 'Risk Score',
                                  value: propClimateData.data.overallRiskScore.toString(),
                                  color: '#f97316',
                                },
                                {
                                  label: 'Climate Grade',
                                  value: propClimateData.data.overallGrade,
                                  color: '#f97316',
                                },
                                {
                                  label: 'Insurance Adj.',
                                  value: `+${propClimateData.data.insuranceAdjustment}%`,
                                  color: '#fbbf24',
                                },
                                {
                                  label: 'Value Haircut',
                                  value: `−${propClimateData.data.valuationHaircut}%`,
                                  color: '#ef4444',
                                },
                              ].map((m) => (
                                <div
                                  key={m.label}
                                  className="rounded-lg p-2.5"
                                  style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${DS.border}`,
                                  }}
                                >
                                  <p
                                    className="text-[8px] uppercase tracking-wider mb-0.5"
                                    style={{ color: DS.text.muted }}
                                  >
                                    {m.label}
                                  </p>
                                  <p className="text-sm font-bold" style={{ color: m.color }}>
                                    {m.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <div
                              className="rounded-lg p-3"
                              style={{
                                background: 'rgba(249,115,22,0.04)',
                                border: '1px solid rgba(249,115,22,0.1)',
                              }}
                            >
                              <p className="text-[10px] text-white/50 mb-1 font-semibold">
                                Impact on this waterfall:
                              </p>
                              <div className="flex items-center gap-6 text-[10px] text-white/40">
                                <span>
                                  Exit Proceeds:{' '}
                                  <span className="text-red-400">
                                    −{propClimateData.data.valuationHaircut}%
                                  </span>{' '}
                                  ({propInputs ? fmt(propInputs.exitProceeds * (propClimateData.data.valuationHaircut / 100)) : '—'} reduction)
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={applyClimateToPropInputs}
                                disabled={propClimateApplied}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                style={{
                                  background: propClimateApplied
                                    ? 'rgba(52,211,153,0.08)'
                                    : 'rgba(249,115,22,0.12)',
                                  border: `1px solid ${propClimateApplied ? 'rgba(52,211,153,0.2)' : 'rgba(249,115,22,0.25)'}`,
                                  color: propClimateApplied ? '#34d399' : '#f97316',
                                }}
                              >
                                {propClimateApplied ? (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Applied to Waterfall
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-3.5 h-3.5" />
                                    Apply to Waterfall Inputs
                                  </>
                                )}
                              </button>
                              <span className="text-[9px] text-white/20">
                                Source: {propClimateData.data.dataSource}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-base font-bold text-white tracking-tight font-display">
              Investor Waterfall Calculator
            </h1>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold"
              style={{
                color: DS.accent.purple,
                background: `${DS.accent.purple}15`,
                border: `1px solid ${DS.accent.purple}25`,
              }}
            >
              GP / LP
            </span>
            {(savedStructures?.structures.length ?? 0) > 0 ? (
              <span
                className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  color: DS.accent.green,
                  background: `${DS.accent.green}10`,
                  border: `1px solid ${DS.accent.green}20`,
                }}
              >
                <Database className="w-2.5 h-2.5" />
                Live DB · {savedStructures?.structures.length}
              </span>
            ) : (
              savedStructures && (
                <button
                  onClick={() => seedDemoMutation.mutate()}
                  disabled={seedDemoMutation.isPending}
                  className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer"
                  style={{
                    color: DS.text.muted,
                    background: DS.surface,
                    border: `1px solid ${DS.border}`,
                  }}
                >
                  <Database className="w-2.5 h-2.5" />
                  {seedDemoMutation.isPending ? 'Seeding…' : 'Seed Demo Data'}
                </button>
              )
            )}
          </div>
          <p className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
            Preferred return · catch-up · promote splits · multi-tier GP/LP distribution waterfall
            modeling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={structureName}
            onChange={(e) => setStructureName(e.target.value)}
            className="bg-transparent border rounded-lg px-2 py-1.5 text-[10px] w-40"
            style={{ borderColor: DS.border, color: DS.text.secondary }}
          />
          <button
            onClick={saveStructure}
            disabled={saveStructureMutation.isPending}
            className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
            style={{
              background: `${DS.accent.purple}15`,
              border: `1px solid ${DS.accent.purple}30`,
              color: DS.accent.purple,
            }}
          >
            <Save className="w-3 h-3" />
            {savedMsg ?? (saveStructureMutation.isPending ? 'Saving…' : 'Save')}
          </button>
          <button
            onClick={() => exportWaterfallCSV(inputs, r, structureName)}
            className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
            style={{
              background: `${DS.accent.green}15`,
              border: `1px solid ${DS.accent.green}30`,
              color: DS.accent.green,
            }}
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>
          <div className="relative">
            <button
              onClick={() => setShowStructures((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
              style={{
                background: DS.surface,
                border: `1px solid ${DS.border}`,
                color: DS.text.secondary,
              }}
            >
              <FolderOpen className="w-3 h-3" />
              Load ({savedStructures?.structures.length ?? 0})
            </button>
            {showStructures && (savedStructures?.structures.length ?? 0) > 0 && (
              <div
                className="absolute right-0 top-full mt-1 w-72 rounded-xl border shadow-2xl z-50 overflow-hidden"
                style={{ background: '#0d0f15', borderColor: DS.border }}
              >
                {savedStructures?.structures.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1 px-3 py-2 hover:bg-white/5 transition-colors"
                    style={{ borderBottom: `1px solid ${DS.border}` }}
                  >
                    {renamingId === s.id ? (
                      <input
                        className="flex-1 bg-transparent text-[11px] text-white focus:outline-none border-b"
                        style={{ borderColor: DS.accent.purple }}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && renameValue.trim()) {
                            updateStructureMutation.mutate({ id: s.id, name: renameValue.trim() });
                            setRenamingId(null);
                            setShowStructures(false);
                          } else if (e.key === 'Escape') {
                            setRenamingId(null);
                          }
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => loadStructure(s)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-[11px] font-medium truncate" style={{ color: DS.text.primary }}>
                          {s.name}
                        </p>
                        <p className="text-[9px]" style={{ color: DS.text.muted }}>
                          {new Date(s.updatedAt).toLocaleDateString()}
                        </p>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (renamingId === s.id) {
                          if (renameValue.trim()) {
                            updateStructureMutation.mutate({ id: s.id, name: renameValue.trim() });
                          }
                          setRenamingId(null);
                          setShowStructures(false);
                        } else {
                          setRenamingId(s.id);
                          setRenameValue(s.name);
                        }
                      }}
                      className="p-1 rounded shrink-0"
                      title="Rename"
                      style={{ color: DS.text.muted }}
                    >
                      {renamingId === s.id ? <Save className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteStructureMutation.mutate(s.id);
                        setShowStructures(false);
                        setRenamingId(null);
                      }}
                      className="p-1 rounded shrink-0"
                      title="Delete"
                      style={{ color: `${DS.accent.red}99` }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: DS.border, background: DS.surface }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-wider mb-3"
          style={{ color: DS.text.muted }}
        >
          Deal Structure Inputs
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumInput
            label="Total Equity"
            value={inputs.totalEquity}
            onChange={set('totalEquity')}
            prefix="$"
            step={500000}
          />
          <NumInput
            label="GP Contribution %"
            value={inputs.gpContributionPct}
            onChange={set('gpContributionPct')}
            suffix="%"
            step={1}
          />
          <NumInput
            label="Preferred Return"
            value={inputs.preferredReturn}
            onChange={set('preferredReturn')}
            suffix="% p.a."
            step={0.5}
          />
          <NumInput
            label="GP Catch-Up %"
            value={inputs.catchUpPct}
            onChange={set('catchUpPct')}
            suffix="%"
            step={5}
          />
          <NumInput
            label="GP Promote"
            value={inputs.promotePct}
            onChange={set('promotePct')}
            suffix="%"
            step={5}
          />
          <NumInput
            label="Exit Proceeds"
            value={inputs.exitProceeds}
            onChange={set('exitProceeds')}
            prefix="$"
            step={500000}
          />
          <NumInput
            label="Hold Period"
            value={inputs.holdMonths}
            onChange={set('holdMonths')}
            suffix="months"
            step={3}
          />
        </div>
      </div>

      {/* Climate Risk Auto-Pull — Standalone Waterfall */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: DS.border, background: DS.surface }}
      >
        <button
          onClick={() => setShowClimatePanel((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
            <span className="text-xs font-semibold text-white/70">Climate Risk Overlay</span>
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{
                background: 'rgba(249,115,22,0.08)',
                color: '#f97316',
                border: '1px solid rgba(249,115,22,0.15)',
              }}
            >
              Auto-Pull
            </span>
            {climateApplied && (
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"
                style={{
                  background: 'rgba(52,211,153,0.08)',
                  color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.15)',
                }}
              >
                <CheckCircle className="w-2.5 h-2.5" />
                Applied
              </span>
            )}
          </div>
          <span className="text-[10px] text-white/30">
            {showClimatePanel ? 'Collapse ▲' : 'Adjust exit proceeds for climate risk ▼'}
          </span>
        </button>
        <AnimatePresence>
          {showClimatePanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t" style={{ borderColor: DS.border }}>
                <p className="text-[10px] text-white/30 mt-3 mb-3 leading-relaxed">
                  Fetch climate hazard data for a property and automatically reduce{' '}
                  <strong className="text-white/50">Exit Proceeds</strong> by the climate valuation
                  haircut — reflecting elevated insurance costs and market liquidity discount on exit.
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <label
                      className="block text-[9px] font-semibold uppercase tracking-wider mb-1"
                      style={{ color: DS.text.muted }}
                    >
                      Property ID
                    </label>
                    <input
                      type="text"
                      value={climatePropertyId}
                      onChange={(e) => {
                        setClimatePropertyId(e.target.value);
                        setClimateApplied(false);
                        setFetchClimate(false);
                      }}
                      placeholder="prop-sf-001"
                      className="w-full px-3 py-1.5 rounded-lg text-xs text-white/80 bg-white/4 border border-white/8 focus:border-white/20 outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setFetchClimate(true)}
                    disabled={!climatePropertyId || climateLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all self-end"
                    style={{
                      background: 'rgba(249,115,22,0.1)',
                      border: '1px solid rgba(249,115,22,0.2)',
                      color: '#f97316',
                    }}
                  >
                    {climateLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Thermometer className="w-3.5 h-3.5" />
                    )}
                    Pull Climate Risk
                  </button>
                </div>
                {climateData?.data && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        {
                          label: 'Risk Score',
                          value: climateData.data.overallRiskScore.toString(),
                          color: '#f97316',
                        },
                        {
                          label: 'Climate Grade',
                          value: climateData.data.overallGrade,
                          color: '#f97316',
                        },
                        {
                          label: 'Insurance Adj.',
                          value: `+${climateData.data.insuranceAdjustment}%`,
                          color: '#fbbf24',
                        },
                        {
                          label: 'Value Haircut',
                          value: `−${climateData.data.valuationHaircut}%`,
                          color: '#ef4444',
                        },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className="rounded-lg p-2.5"
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: `1px solid ${DS.border}`,
                          }}
                        >
                          <p
                            className="text-[8px] uppercase tracking-wider mb-0.5"
                            style={{ color: DS.text.muted }}
                          >
                            {m.label}
                          </p>
                          <p className="text-sm font-bold" style={{ color: m.color }}>
                            {m.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div
                      className="rounded-lg p-3"
                      style={{
                        background: 'rgba(249,115,22,0.04)',
                        border: '1px solid rgba(249,115,22,0.1)',
                      }}
                    >
                      <p className="text-[10px] text-white/50 mb-1 font-semibold">
                        Impact on current waterfall structure:
                      </p>
                      <div className="flex items-center gap-6 text-[10px] text-white/40">
                        <span>
                          Exit Proceeds:{' '}
                          <span className="text-red-400">
                            −{climateData.data.valuationHaircut}%
                          </span>{' '}
                          ({fmt(inputs.exitProceeds * (climateData.data.valuationHaircut / 100))}{' '}
                          reduction)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={applyClimateToStandalone}
                        disabled={climateApplied}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: climateApplied
                            ? 'rgba(52,211,153,0.08)'
                            : 'rgba(249,115,22,0.12)',
                          border: `1px solid ${climateApplied ? 'rgba(52,211,153,0.2)' : 'rgba(249,115,22,0.25)'}`,
                          color: climateApplied ? '#34d399' : '#f97316',
                        }}
                      >
                        {climateApplied ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Applied to Structure
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            Apply to Waterfall Inputs
                          </>
                        )}
                      </button>
                      <span className="text-[9px] text-white/20">
                        Source: {climateData.data.dataSource}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: 'GP Equity Invested',
            value: fmt(r.gpEquity),
            sub: `${inputs.gpContributionPct}% of total`,
            color: DS.accent.gold,
          },
          {
            label: 'LP Equity Invested',
            value: fmt(r.lpEquity),
            sub: `${100 - inputs.gpContributionPct}% of total`,
            color: DS.accent.blue,
          },
          {
            label: 'GP Returns',
            value: fmt(r.gpTotal),
            sub: `${r.gpEM.toFixed(2)}× · ${pct(r.gpIRR)} IRR`,
            color: DS.accent.gold,
          },
          {
            label: 'LP Returns',
            value: fmt(r.lpTotal),
            sub: `${r.lpEM.toFixed(2)}× · ${pct(r.lpIRR)} IRR`,
            color: DS.accent.blue,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border p-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <p className="text-[9px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
              {m.label}
            </p>
            <p className="text-2xl font-bold font-mono mt-1" style={{ color: m.color }}>
              {m.value}
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: DS.border, background: DS.surface }}
      >
        <div
          className="flex items-center gap-2 px-4 py-2.5 border-b"
          style={{ borderColor: DS.border }}
        >
          <Layers className="w-3.5 h-3.5" style={{ color: DS.accent.gold }} />
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: `${DS.accent.gold}99` }}
          >
            Distribution Waterfall
          </span>
        </div>

        <div
          className="grid grid-cols-7 gap-2 px-4 py-2 border-b text-[9px] font-semibold uppercase tracking-wider"
          style={{ borderColor: DS.border, color: DS.text.muted }}
        >
          {['Tier', 'Description', 'GP Amount', 'LP Amount', 'Total', 'GP Split', 'LP Split'].map(
            (h) => (
              <div key={h}>{h}</div>
            ),
          )}
        </div>

        <div className="divide-y" style={{ borderColor: DS.border }}>
          {r.tiers.map((tier, i) => (
            <motion.div
              key={tier.tier}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className="grid grid-cols-7 gap-2 px-4 py-3 items-center hover:bg-white/[0.015] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: TIER_COLORS[i] }} />
                <span
                  className="text-[10px] font-bold font-mono"
                  style={{ color: DS.text.primary }}
                >
                  {tier.tier}
                </span>
              </div>
              <div className="text-[10px]" style={{ color: DS.text.secondary }}>
                {tier.description}
              </div>
              <div className="text-[10px] font-mono font-bold" style={{ color: DS.accent.gold }}>
                {tier.gpAmount > 0 ? fmt(tier.gpAmount) : '—'}
              </div>
              <div className="text-[10px] font-mono font-bold" style={{ color: DS.accent.blue }}>
                {tier.lpAmount > 0 ? fmt(tier.lpAmount) : '—'}
              </div>
              <div className="text-[10px] font-mono" style={{ color: DS.text.secondary }}>
                {fmt(tier.total)}
              </div>
              <div className="text-[10px] font-mono" style={{ color: DS.accent.gold }}>
                {tier.gpPct > 0 ? `${tier.gpPct.toFixed(0)}%` : '—'}
              </div>
              <div className="text-[10px] font-mono" style={{ color: DS.accent.blue }}>
                {tier.lpPct > 0 ? `${tier.lpPct.toFixed(0)}%` : '—'}
              </div>
            </motion.div>
          ))}
          <div
            className="grid grid-cols-7 gap-2 px-4 py-3 items-center"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div
              className="col-span-2 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: DS.text.muted }}
            >
              Total Distributions
            </div>
            <div className="text-[11px] font-bold font-mono" style={{ color: DS.accent.gold }}>
              {fmt(r.gpTotal)}
            </div>
            <div className="text-[11px] font-bold font-mono" style={{ color: DS.accent.blue }}>
              {fmt(r.lpTotal)}
            </div>
            <div className="text-[11px] font-bold font-mono" style={{ color: DS.text.primary }}>
              {fmt(inputs.exitProceeds)}
            </div>
            <div className="text-[11px] font-bold font-mono" style={{ color: DS.accent.gold }}>
              {pct((r.gpTotal / inputs.exitProceeds) * 100)}
            </div>
            <div className="text-[11px] font-bold font-mono" style={{ color: DS.accent.blue }}>
              {pct((r.lpTotal / inputs.exitProceeds) * 100)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: DS.border, background: DS.surface }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-3"
            style={{ color: DS.text.muted }}
          >
            Distributions by Tier
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8 }} />
              <YAxis
                tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`}
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="GP"
                fill={DS.accent.gold}
                fillOpacity={0.85}
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="LP"
                fill={DS.accent.blue}
                fillOpacity={0.85}
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ borderColor: DS.border, background: DS.surface }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-3"
            style={{ color: DS.text.muted }}
          >
            GP vs. LP Total Returns
          </p>
          <div className="flex items-center justify-center h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value, _entry) => (
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
