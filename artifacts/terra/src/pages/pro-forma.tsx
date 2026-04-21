import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart2,
  BarChart3,
  Building2,
  Calculator,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Database,
  DollarSign,
  Download,
  FolderOpen,
  GitCompare,
  Grid3X3,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../lib/api';
import {
  BEAR_INPUTS,
  BULL_INPUTS,
  calcProForma,
  DEFAULT_INPUTS,
  type ProFormaInputs,
  type ProFormaResult,
} from '../lib/pro-forma-math';

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
  accent: {
    gold: '#b8943c',
    blue: '#3a7ad4',
    green: '#40856a',
    red: '#c0503a',
    purple: '#8b5cf6',
    orange: '#d97706',
  },
  text: {
    primary: 'rgba(255,255,255,0.85)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.3)',
    muted: 'rgba(255,255,255,0.18)',
  },
};

const fmt = (n: number) =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(2)}B`
    : n >= 1e6
      ? `$${(n / 1e6).toFixed(2)}M`
      : n >= 1e3
        ? `$${(n / 1e3).toFixed(0)}K`
        : `$${Math.round(n)}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

interface Scenario {
  id: string;
  name: string;
  color: string;
  inputs: ProFormaInputs;
}

const SCENARIO_COLORS = [
  DS.accent.gold,
  DS.accent.blue,
  DS.accent.green,
  DS.accent.purple,
  DS.accent.orange,
];
function useProForma(inputs: ProFormaInputs) {
  return useMemo(() => calcProForma(inputs), [inputs]);
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
          <span style={{ color: p.color ?? p.fill }}>{p.name}:</span>
          <span className="text-white/70">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

function irrColor(irr: number) {
  if (irr >= 22) return DS.accent.green;
  if (irr >= 18) return '#7db89e';
  if (irr >= 14) return DS.accent.gold;
  if (irr >= 10) return '#c88a3c';
  return DS.accent.red;
}

function irrBg(irr: number) {
  if (irr >= 22) return 'rgba(64,133,106,0.35)';
  if (irr >= 18) return 'rgba(64,133,106,0.20)';
  if (irr >= 14) return 'rgba(184,148,60,0.25)';
  if (irr >= 10) return 'rgba(200,138,60,0.18)';
  return 'rgba(192,80,58,0.30)';
}

type SensAxisKey = 'hardCost' | 'capRate' | 'rent' | 'occupancy' | 'financing';
const SENS_AXES: Record<
  SensAxisKey,
  {
    label: string;
    shortLabel: string;
    steps: number[];
    formatStep: (d: number) => string;
    applyDelta: (inp: ProFormaInputs, d: number) => ProFormaInputs;
    stepColor: (d: number) => string;
    isRevenue: boolean;
  }
> = {
  hardCost: {
    label: 'Hard Cost/SF Δ',
    shortLabel: 'HC/SF Δ',
    steps: [-30, -20, -10, 0, 10, 20, 30],
    formatStep: (d) => (d === 0 ? '$0' : d > 0 ? `+$${d}` : `-$${Math.abs(d)}`),
    applyDelta: (inp, d) => ({ ...inp, hardCostPerSF: inp.hardCostPerSF + d }),
    stepColor: (d) => (d < 0 ? DS.accent.green : d > 0 ? DS.accent.red : DS.accent.gold),
    isRevenue: false,
  },
  capRate: {
    label: 'Exit Cap Rate Δ',
    shortLabel: 'Cap Rate Δ',
    steps: [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75],
    formatStep: (d) => (d === 0 ? '0%' : d > 0 ? `+${d.toFixed(2)}%` : `${d.toFixed(2)}%`),
    applyDelta: (inp, d) => ({ ...inp, exitCapRate: inp.exitCapRate + d }),
    stepColor: (d) => (d < 0 ? DS.accent.green : d > 0 ? DS.accent.red : DS.accent.gold),
    isRevenue: false,
  },
  rent: {
    label: 'Market Rent/SF Δ',
    shortLabel: 'Rent/SF Δ',
    steps: [-0.4, -0.25, -0.1, 0, 0.1, 0.25, 0.4],
    formatStep: (d) =>
      d === 0 ? '$0' : d > 0 ? `+$${d.toFixed(2)}` : `-$${Math.abs(d).toFixed(2)}`,
    applyDelta: (inp, d) => ({ ...inp, marketRentPerSF: inp.marketRentPerSF + d }),
    stepColor: (d) => (d > 0 ? DS.accent.green : d < 0 ? DS.accent.red : DS.accent.gold),
    isRevenue: true,
  },
  occupancy: {
    label: 'Occupancy Δ',
    shortLabel: 'Occ Δ',
    steps: [-6, -4, -2, 0, 2, 4, 6],
    formatStep: (d) => (d === 0 ? '0%' : d > 0 ? `+${d}%` : `${d}%`),
    applyDelta: (inp, d) => ({ ...inp, stabilizedOccupancy: inp.stabilizedOccupancy + d }),
    stepColor: (d) => (d > 0 ? DS.accent.green : d < 0 ? DS.accent.red : DS.accent.gold),
    isRevenue: true,
  },
  financing: {
    label: 'Financing Rate Δ',
    shortLabel: 'Rate Δ',
    steps: [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5],
    formatStep: (d) => (d === 0 ? '0%' : d > 0 ? `+${d.toFixed(1)}%` : `${d.toFixed(1)}%`),
    applyDelta: (inp, d) => ({ ...inp, financingRate: inp.financingRate + d }),
    stepColor: (d) => (d < 0 ? DS.accent.green : d > 0 ? DS.accent.red : DS.accent.gold),
    isRevenue: false,
  },
};
const AXIS_OPTIONS = Object.entries(SENS_AXES).map(([k, v]) => ({
  key: k as SensAxisKey,
  label: v.label,
  shortLabel: v.shortLabel,
}));

function SensHeatMap({ inputs }: { inputs: ProFormaInputs }) {
  const [colAxis, setColAxis] = useState<SensAxisKey>('hardCost');
  const [rowAxis, setRowAxis] = useState<SensAxisKey>('capRate');
  const colCfg = SENS_AXES[colAxis];
  const rowCfg = SENS_AXES[rowAxis];

  const rows = rowCfg.steps.map((rowDelta) => ({
    delta: rowDelta,
    label: rowCfg.formatStep(rowDelta),
    cells: colCfg.steps.map((colDelta) => {
      const modified = rowCfg.applyDelta(colCfg.applyDelta(inputs, colDelta), rowDelta);
      const r = calcProForma(modified);
      return { irr: r.irr, isBase: rowDelta === 0 && colDelta === 0 };
    }),
  }));

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: DS.border, background: DS.surface }}
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Grid3X3 className="w-3.5 h-3.5 shrink-0" style={{ color: DS.accent.gold }} />
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: DS.text.muted }}
        >
          2D Sensitivity → Levered IRR
        </p>
        <div className="flex items-center gap-2 ml-2 flex-wrap">
          <span className="text-[9px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
            Cols →
          </span>
          <div className="flex items-center gap-1">
            {AXIS_OPTIONS.filter((o) => o.key !== rowAxis).map((o) => (
              <button
                key={o.key}
                onClick={() => setColAxis(o.key)}
                className="text-[9px] px-2 py-0.5 rounded font-medium transition-all"
                style={{
                  background: colAxis === o.key ? `${DS.accent.blue}20` : 'transparent',
                  border: `1px solid ${colAxis === o.key ? `${DS.accent.blue}50` : DS.border}`,
                  color: colAxis === o.key ? DS.accent.blue : DS.text.muted,
                }}
              >
                {o.shortLabel}
              </button>
            ))}
          </div>
          <span
            className="text-[9px] uppercase tracking-wider ml-2"
            style={{ color: DS.text.muted }}
          >
            Rows ↓
          </span>
          <div className="flex items-center gap-1">
            {AXIS_OPTIONS.filter((o) => o.key !== colAxis).map((o) => (
              <button
                key={o.key}
                onClick={() => setRowAxis(o.key)}
                className="text-[9px] px-2 py-0.5 rounded font-medium transition-all"
                style={{
                  background: rowAxis === o.key ? `${DS.accent.gold}20` : 'transparent',
                  border: `1px solid ${rowAxis === o.key ? `${DS.accent.gold}50` : DS.border}`,
                  color: rowAxis === o.key ? DS.accent.gold : DS.text.muted,
                }}
              >
                {o.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[9px] mb-3" style={{ color: DS.text.muted }}>
        {colCfg.label} (columns) × {rowCfg.label} (rows) → Levered IRR. Outlined cell = base case.
      </p>
      <div className="overflow-x-auto">
        <table className="text-[9px] font-mono border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th
                className="text-left pr-3 pb-1 whitespace-nowrap font-semibold uppercase tracking-wider"
                style={{ color: DS.text.muted }}
              >
                {rowCfg.shortLabel} ↓ / {colCfg.shortLabel} →
              </th>
              {colCfg.steps.map((d) => (
                <th
                  key={d}
                  className="text-center px-2 pb-1 font-semibold whitespace-nowrap"
                  style={{ color: colCfg.stepColor(d) }}
                >
                  {colCfg.formatStep(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.delta}>
                <td
                  className="pr-3 py-0.5 font-semibold whitespace-nowrap"
                  style={{ color: rowCfg.stepColor(row.delta) }}
                >
                  {row.label}
                  {row.delta === 0 ? ' ◀ base' : ''}
                </td>
                {row.cells.map((cell, ci) => (
                  <td
                    key={ci}
                    className="text-center px-2 py-1 rounded-md font-bold"
                    style={{
                      background: irrBg(cell.irr),
                      color: irrColor(cell.irr),
                      outline: cell.isBase ? `1.5px solid ${DS.accent.gold}` : undefined,
                      minWidth: 52,
                    }}
                  >
                    {pct(cell.irr)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {[
          { label: '≥22% IRR', bg: 'rgba(64,133,106,0.35)', color: DS.accent.green },
          { label: '≥18% IRR', bg: 'rgba(64,133,106,0.20)', color: '#7db89e' },
          { label: '≥14% IRR', bg: 'rgba(184,148,60,0.25)', color: DS.accent.gold },
          { label: '<14% IRR', bg: 'rgba(192,80,58,0.30)', color: DS.accent.red },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: l.bg, border: `1px solid ${l.color}40` }}
            />
            <span className="text-[9px]" style={{ color: DS.text.muted }}>
              {l.label}
            </span>
          </div>
        ))}
        <span className="text-[9px]" style={{ color: DS.text.muted }}>
          ◀ = base case
        </span>
      </div>
    </div>
  );
}

type ProFormaMetricKey = Extract<
  keyof Pick<
    ProFormaResult,
    | 'irr'
    | 'equityMultiple'
    | 'profitOnCost'
    | 'totalProjectCost'
    | 'stabilizedValue'
    | 'developerProfit'
    | 'noi'
    | 'yieldOnCost'
  >,
  string
>;

interface ComparisonMetric {
  key: ProFormaMetricKey;
  label: string;
  format: (v: number) => string;
  good: (v: number) => boolean;
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  { key: 'irr', label: 'Levered IRR', format: (v: number) => pct(v), good: (v: number) => v >= 18 },
  {
    key: 'equityMultiple',
    label: 'Equity Multiple',
    format: (v: number) => `${v.toFixed(2)}×`,
    good: (v: number) => v >= 1.85,
  },
  {
    key: 'profitOnCost',
    label: 'Profit on Cost',
    format: (v: number) => pct(v),
    good: (v: number) => v >= 15,
  },
  {
    key: 'totalProjectCost',
    label: 'Total Project Cost',
    format: (v: number) => fmt(v),
    good: () => true,
  },
  {
    key: 'stabilizedValue',
    label: 'Stabilized Value',
    format: (v: number) => fmt(v),
    good: () => true,
  },
  {
    key: 'developerProfit',
    label: 'Developer Profit',
    format: (v: number) => fmt(v),
    good: (v: number) => v > 0,
  },
  { key: 'noi', label: 'NOI', format: (v: number) => fmt(v), good: () => true },
  {
    key: 'yieldOnCost',
    label: 'Yield on Cost',
    format: (v: number) => pct(v),
    good: (v: number) => v >= 5,
  },
];

function exportComparisonCSV(scenarios: Scenario[]) {
  const results = scenarios.map((s) => ({ ...s, r: calcProForma(s.inputs) }));
  const header = ['Metric', ...results.map((s) => s.name)];
  const rows = COMPARISON_METRICS.map((m) => [
    m.label,
    ...results.map((s) => m.format(s.r[m.key])),
  ]);
  const inputRows = [
    ['=== INPUTS ==='],
    ['Hard Cost/SF', ...results.map((s) => `$${s.inputs.hardCostPerSF}`)],
    ['Market Rent/SF/Mo', ...results.map((s) => `$${s.inputs.marketRentPerSF}`)],
    ['Occupancy', ...results.map((s) => `${s.inputs.stabilizedOccupancy}%`)],
    ['Financing Rate', ...results.map((s) => `${s.inputs.financingRate}%`)],
    ['Exit Cap Rate', ...results.map((s) => `${s.inputs.exitCapRate}%`)],
  ];
  const csv = [
    ['Terra — Scenario Comparison'],
    [`Export Date: ${new Date().toLocaleDateString()}`],
    [],
    header,
    ...rows,
    [],
    ...inputRows,
  ]
    .map((r) => r.map((c) => `"${c}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `terra-scenario-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildHeatMapHtml(baseInputs: ProFormaInputs, baseScenarioName: string): string {
  const colCfg = SENS_AXES['hardCost'];
  const rowCfg = SENS_AXES['capRate'];

  function heatColor(irr: number): { bg: string; fg: string } {
    if (irr >= 22) return { bg: '#1a3d2e', fg: '#40856a' };
    if (irr >= 18) return { bg: '#18312a', fg: '#7db89e' };
    if (irr >= 14) return { bg: '#2e2410', fg: '#b8943c' };
    return { bg: '#2e1410', fg: '#c0503a' };
  }

  const colHeaders = colCfg.steps
    .map(
      (d) =>
        `<th style="padding:5px 10px;text-align:center;font-size:10px;color:#888;border:1px solid #222">${colCfg.formatStep(d)}</th>`,
    )
    .join('');

  const bodyRows = rowCfg.steps
    .map((rowDelta) => {
      const rowLabel = rowCfg.formatStep(rowDelta) + (rowDelta === 0 ? ' ◀' : '');
      const cells = colCfg.steps
        .map((colDelta) => {
          const modified = rowCfg.applyDelta(colCfg.applyDelta(baseInputs, colDelta), rowDelta);
          const r = calcProForma(modified);
          const isBase = rowDelta === 0 && colDelta === 0;
          const { bg, fg } = heatColor(r.irr);
          const outline = isBase ? 'outline:2px solid #b8943c;outline-offset:-2px;' : '';
          return `<td style="padding:5px 10px;text-align:center;font-family:monospace;font-weight:700;font-size:10px;background:${bg};color:${fg};border:1px solid #111;${outline}">${pct(r.irr)}</td>`;
        })
        .join('');
      const labelColor = rowDelta === 0 ? '#b8943c' : '#666';
      return `<tr><td style="padding:5px 10px;font-size:10px;color:${labelColor};font-family:monospace;border:1px solid #111;white-space:nowrap">${rowLabel}</td>${cells}</tr>`;
    })
    .join('');

  return `
  <h2 style="color:#b8943c;font-size:14px;margin:32px 0 4px">2D Sensitivity — Levered IRR</h2>
  <p style="color:#555;font-size:10px;margin-bottom:8px">
    Columns: ${colCfg.label} &nbsp;·&nbsp; Rows: ${rowCfg.label} &nbsp;·&nbsp;
    Base scenario: ${baseScenarioName} &nbsp;·&nbsp; ◀ = base case cell
  </p>
  <table style="border-collapse:collapse;background:#0d0f15">
    <thead>
      <tr>
        <th style="padding:5px 10px;text-align:left;font-size:10px;color:#555;border:1px solid #222">${rowCfg.shortLabel} ↓ / ${colCfg.shortLabel} →</th>
        ${colHeaders}
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div style="display:flex;gap:16px;margin-top:8px;flex-wrap:wrap">
    ${[
      { label: '≥22% IRR', bg: '#1a3d2e', fg: '#40856a' },
      { label: '≥18% IRR', bg: '#18312a', fg: '#7db89e' },
      { label: '≥14% IRR', bg: '#2e2410', fg: '#b8943c' },
      { label: '<14% IRR', bg: '#2e1410', fg: '#c0503a' },
    ]
      .map(
        (l) =>
          `<span style="display:flex;align-items:center;gap:6px;font-size:10px;color:#666"><span style="display:inline-block;width:12px;height:12px;background:${l.bg};border:1px solid ${l.fg}40;border-radius:2px"></span>${l.label}</span>`,
      )
      .join('')}
  </div>`;
}

function exportComparisonPDF(scenarios: Scenario[]) {
  const results = scenarios.map((s) => ({ ...s, r: calcProForma(s.inputs) }));
  const headerCells = results
    .map(
      (s) =>
        `<th style="padding:8px 12px;background:${s.color}18;color:${s.color};border:1px solid ${s.color}30;font-family:monospace">${s.name}</th>`,
    )
    .join('');
  const metricRows = COMPARISON_METRICS.map((m) => {
    const values = results.map((s) => s.r[m.key]);
    const best = m.key === 'totalProjectCost' ? Math.min(...values) : Math.max(...values);
    const cells = results
      .map((s, i) => {
        const v = values[i];
        const isBest = Math.abs(v - best) < 0.001;
        const isOk = m.good(v);
        const color = isOk ? (isBest ? s.color : '#999') : '#c0503a';
        return `<td style="padding:6px 12px;text-align:right;font-family:monospace;font-weight:600;color:${color};border:1px solid #111">${m.format(v)}${isBest ? ' ▲' : ''}</td>`;
      })
      .join('');
    return `<tr><td style="padding:6px 12px;color:#999;border:1px solid #111">${m.label}</td>${cells}</tr>`;
  }).join('');

  const inputRows = results
    .map((s) => {
      const inp = s.inputs;
      return `
      <tr>
        <td style="padding:5px 10px;color:#b8943c;font-family:monospace;font-weight:700;border:1px solid #111" colspan="${results.length + 1}">${s.name}</td>
      </tr>
      <tr>
        <td style="padding:4px 10px;color:#666;font-size:10px;border:1px solid #111">Hard Cost/SF</td>
        <td style="padding:4px 10px;font-family:monospace;font-size:10px;color:#ccc;border:1px solid #111" colspan="${results.length}">$${inp.hardCostPerSF}</td>
      </tr>
      <tr>
        <td style="padding:4px 10px;color:#666;font-size:10px;border:1px solid #111">Market Rent/SF/Mo</td>
        <td style="padding:4px 10px;font-family:monospace;font-size:10px;color:#ccc;border:1px solid #111" colspan="${results.length}">$${inp.marketRentPerSF}</td>
      </tr>
      <tr>
        <td style="padding:4px 10px;color:#666;font-size:10px;border:1px solid #111">Occupancy</td>
        <td style="padding:4px 10px;font-family:monospace;font-size:10px;color:#ccc;border:1px solid #111" colspan="${results.length}">${inp.stabilizedOccupancy}%</td>
      </tr>
      <tr>
        <td style="padding:4px 10px;color:#666;font-size:10px;border:1px solid #111">Financing Rate</td>
        <td style="padding:4px 10px;font-family:monospace;font-size:10px;color:#ccc;border:1px solid #111" colspan="${results.length}">${inp.financingRate}%</td>
      </tr>
      <tr>
        <td style="padding:4px 10px;color:#666;font-size:10px;border:1px solid #111">Exit Cap Rate</td>
        <td style="padding:4px 10px;font-family:monospace;font-size:10px;color:#ccc;border:1px solid #111" colspan="${results.length}">${inp.exitCapRate}%</td>
      </tr>`;
    })
    .join('');

  const heatMapSection = buildHeatMapHtml(scenarios[0].inputs, scenarios[0].name);

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Terra — Scenario Comparison Report</title>
  <style>
    body{background:#0a0c10;color:#ddd;font-family:sans-serif;padding:32px;font-size:13px}
    h1{color:#b8943c;font-size:20px;margin-bottom:4px}
    h2{color:#b8943c;font-size:15px;margin:28px 0 6px}
    p{color:#555;margin-bottom:16px;font-size:11px}
    table{border-collapse:collapse;background:#0d0f15}
    th{font-size:11px;text-transform:uppercase;letter-spacing:.08em}
    .full-width{width:100%}
    @media print{
      body{background:white;color:#111}
      table{background:white}
      h1,h2{color:#7a6028}
    }
  </style>
</head>
<body>
  <h1>Terra — Scenario Comparison Report</h1>
  <p>Exported ${new Date().toLocaleString()} &nbsp;·&nbsp; ${results.length} scenarios &nbsp;·&nbsp; ▲ = best value</p>

  <h2>Key Metrics</h2>
  <table class="full-width">
    <thead><tr><th style="padding:8px 12px;text-align:left;color:#555;border:1px solid #222">Metric</th>${headerCells}</tr></thead>
    <tbody>${metricRows}</tbody>
  </table>

  <h2>Scenario Inputs</h2>
  <table class="full-width">
    <tbody>${inputRows}</tbody>
  </table>

  ${heatMapSection}
</body>
</html>`;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}

function ScenarioComparisonPanel({ scenarios }: { scenarios: Scenario[] }) {
  if (scenarios.length < 2) return null;

  const metrics = COMPARISON_METRICS;

  const results = scenarios.map((s) => ({ ...s, r: calcProForma(s.inputs) }));

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: DS.border, background: DS.surface }}
    >
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <GitCompare className="w-3.5 h-3.5" style={{ color: DS.accent.blue }} />
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: DS.text.muted }}
        >
          Scenario Comparison
        </p>
        <div className="flex items-center gap-2 ml-2 flex-wrap">
          {results.map((s) => (
            <span
              key={s.id}
              className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: `${s.color}18`,
                border: `1px solid ${s.color}40`,
                color: s.color,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: s.color }}
              />
              {s.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => exportComparisonCSV(scenarios)}
            className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-medium"
            style={{
              background: `${DS.accent.green}12`,
              border: `1px solid ${DS.accent.green}30`,
              color: DS.accent.green,
            }}
            title="Export comparison as CSV"
          >
            <Download className="w-3 h-3" /> CSV
          </button>
          <button
            onClick={() => exportComparisonPDF(scenarios)}
            className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-medium"
            style={{
              background: `${DS.accent.blue}12`,
              border: `1px solid ${DS.accent.blue}30`,
              color: DS.accent.blue,
            }}
            title="Export comparison as PDF (print dialog)"
          >
            <Download className="w-3 h-3" /> PDF
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th
                className="text-left pb-2 font-semibold uppercase tracking-wider pr-4"
                style={{ color: DS.text.muted }}
              >
                Metric
              </th>
              {results.map((s) => (
                <th
                  key={s.id}
                  className="text-right pb-2 font-semibold px-3"
                  style={{ color: s.color }}
                >
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const values = results.map((s) => s.r[m.key]);
              const best = m.key === 'totalProjectCost' ? Math.min(...values) : Math.max(...values);
              return (
                <tr key={m.key} className="border-t" style={{ borderColor: DS.border }}>
                  <td className="py-1.5 pr-4 font-medium" style={{ color: DS.text.secondary }}>
                    {m.label}
                  </td>
                  {results.map((s, i) => {
                    const v = values[i];
                    const isOk = m.good(v);
                    const isBest = Math.abs(v - best) < 0.001;
                    return (
                      <td
                        key={s.id}
                        className="py-1.5 px-3 text-right font-mono font-bold"
                        style={{
                          color: isOk ? (isBest ? s.color : DS.text.secondary) : DS.accent.red,
                        }}
                      >
                        {m.format(v)}
                        {isBest && (
                          <span className="ml-1 text-[8px]" style={{ color: s.color }}>
                            ▲
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

const INITIAL_SCENARIOS: Scenario[] = [
  { id: 'base', name: 'Base Case', color: SCENARIO_COLORS[0], inputs: { ...DEFAULT_INPUTS } },
  { id: 'bear', name: 'Bear Case', color: SCENARIO_COLORS[2], inputs: { ...BEAR_INPUTS } },
  { id: 'bull', name: 'Bull Case', color: SCENARIO_COLORS[1], inputs: { ...BULL_INPUTS } },
];

export default function ProFormaPage() {
  const queryClient = useQueryClient();

  const { data: savedProjects } = useStandardQuery({
    queryKey: ['terra-pro-forma-projects'],
    queryFn: () => api.proForma.list(),
    staleTime: 30_000,
  });

  const saveProjectMutation = useStandardMutation({
    mutationFn: (data: {
      projectName: string;
      inputs: Record<string, unknown>;
      results: Record<string, unknown>;
    }) => api.proForma.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terra-pro-forma-projects'] });
    },
  });

  const updateProjectMutation = useStandardMutation({
    mutationFn: (args: { id: string; projectName: string }) =>
      api.proForma.update(args.id, { projectName: args.projectName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terra-pro-forma-projects'] });
    },
  });

  const deleteProjectMutation = useStandardMutation({
    mutationFn: (id: string) => api.proForma.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terra-pro-forma-projects'] });
    },
  });

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [scenarios, setScenarios] = useState<Scenario[]>(INITIAL_SCENARIOS);
  const [activeId, setActiveId] = useState('base');
  const [showInputs, setShowInputs] = useState(true);
  const [showProjects, setShowProjects] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'sensitivity' | 'compare'>('builder');
  const [newScenarioName, setNewScenarioName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const activeScenario = scenarios.find((s) => s.id === activeId) ?? scenarios[0];
  const inputs = activeScenario.inputs;
  const r = useProForma(inputs);

  const setInput = (k: keyof ProFormaInputs) => (v: number | string) =>
    setScenarios((prev) =>
      prev.map((s) => (s.id === activeId ? { ...s, inputs: { ...s.inputs, [k]: v } } : s)),
    );

  const saveScenario = (name: string) => {
    const colorIdx = scenarios.length % SCENARIO_COLORS.length;
    setScenarios((prev) => [
      ...prev,
      { id: genId(), name, color: SCENARIO_COLORS[colorIdx], inputs: { ...inputs } },
    ]);
    setShowAddModal(false);
    setNewScenarioName('');
  };

  const cloneScenario = (id: string) => {
    const src = scenarios.find((s) => s.id === id);
    if (!src) return;
    const colorIdx = scenarios.length % SCENARIO_COLORS.length;
    const newS: Scenario = {
      id: genId(),
      name: `${src.name} (Copy)`,
      color: SCENARIO_COLORS[colorIdx],
      inputs: { ...src.inputs },
    };
    setScenarios((prev) => [...prev, newS]);
    setActiveId(newS.id);
  };

  const deleteScenario = (id: string) => {
    if (scenarios.length <= 1) return;
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(scenarios.find((s) => s.id !== id)?.id ?? '');
  };

  const irr_ok = r.irr >= 18;
  const em_ok = r.equityMultiple >= inputs.equityMultipleTarget;
  const poc_ok = r.profitOnCost >= 15;

  function saveProject() {
    saveProjectMutation.mutate(
      {
        projectName: inputs.projectName,
        inputs: inputs as unknown as Record<string, unknown>,
        results: {
          irr: r.irr,
          equityMultiple: r.equityMultiple,
          profitOnCost: r.profitOnCost,
          totalProjectCost: r.totalProjectCost,
          stabilizedValue: r.stabilizedValue,
          developerProfit: r.developerProfit,
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

  function loadProject(project: { inputs: Record<string, unknown>; projectName?: string }) {
    const colorIdx = scenarios.length % SCENARIO_COLORS.length;
    const loaded: Scenario = {
      id: genId(),
      name: (project.projectName as string | undefined) ?? 'Loaded Project',
      color: SCENARIO_COLORS[colorIdx],
      inputs: project.inputs as unknown as ProFormaInputs,
    };
    setScenarios((prev) => [...prev, loaded]);
    setActiveId(loaded.id);
    setShowProjects(false);
  }

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-base font-bold text-white tracking-tight font-display">
              Development Pro Forma Builder
            </h1>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold"
              style={{
                color: DS.accent.blue,
                background: `${DS.accent.blue}10`,
                border: `1px solid ${DS.accent.blue}20`,
              }}
            >
              Feasibility
            </span>
            {(savedProjects?.projects.length ?? 0) > 0 && (
              <span
                className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  color: DS.accent.green,
                  background: `${DS.accent.green}10`,
                  border: `1px solid ${DS.accent.green}20`,
                }}
              >
                <Database className="w-2.5 h-2.5" />
                Live DB · {savedProjects!.projects.length}
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
            Ground-up development analysis · IRR · Equity Multiple · Sensitivity · Multi-Scenario
            Comparison
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveProject}
            disabled={saveProjectMutation.isPending}
            className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
            style={{
              background: saveProjectMutation.isPending ? DS.surface : `${DS.accent.gold}15`,
              border: `1px solid ${saveProjectMutation.isPending ? DS.border : DS.accent.gold}`,
              color: DS.accent.gold,
            }}
          >
            <Save className="w-3 h-3" />
            {savedMsg ?? (saveProjectMutation.isPending ? 'Saving…' : 'Save')}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowProjects((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
              style={{
                background: DS.surface,
                border: `1px solid ${DS.border}`,
                color: DS.text.secondary,
              }}
            >
              <FolderOpen className="w-3 h-3" />
              Load ({savedProjects?.projects.length ?? 0})
            </button>
            {showProjects && (savedProjects?.projects.length ?? 0) > 0 && (
              <div
                className="absolute right-0 top-full mt-1 w-72 rounded-xl border shadow-2xl z-50 overflow-hidden"
                style={{ background: '#0d0f15', borderColor: DS.border }}
              >
                {savedProjects!.projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1 px-3 py-2 hover:bg-white/5 transition-colors"
                    style={{ borderBottom: `1px solid ${DS.border}` }}
                  >
                    {renamingId === p.id ? (
                      <input
                        className="flex-1 bg-transparent text-[11px] text-white focus:outline-none border-b"
                        style={{ borderColor: DS.accent.gold }}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && renameValue.trim()) {
                            updateProjectMutation.mutate({ id: p.id, projectName: renameValue.trim() });
                            setRenamingId(null);
                          } else if (e.key === 'Escape') {
                            setRenamingId(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => loadProject(p)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-[11px] font-medium truncate" style={{ color: DS.text.primary }}>
                          {p.projectName}
                        </p>
                        <p className="text-[9px]" style={{ color: DS.text.muted }}>
                          {new Date(p.updatedAt).toLocaleDateString()}
                        </p>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (renamingId === p.id) {
                          if (renameValue.trim()) {
                            updateProjectMutation.mutate({ id: p.id, projectName: renameValue.trim() });
                          }
                          setRenamingId(null);
                        } else {
                          setRenamingId(p.id);
                          setRenameValue(p.projectName);
                        }
                      }}
                      className="p-1 rounded shrink-0"
                      title="Rename"
                      style={{ color: DS.text.muted }}
                    >
                      {renamingId === p.id ? <Save className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProjectMutation.mutate(p.id);
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
          <button
            onClick={() => setShowInputs((v) => !v)}
            className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
            style={{
              background: DS.surface,
              border: `1px solid ${DS.border}`,
              color: DS.text.secondary,
            }}
          >
            <Calculator className="w-3 h-3" />
            {showInputs ? 'Hide' : 'Show'} Inputs
          </button>
        </div>
      </div>

      {/* Scenario tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {scenarios.map((s) => (
            <div key={s.id} className="flex items-center gap-0.5 group">
              <button
                onClick={() => setActiveId(s.id)}
                className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{
                  background: activeId === s.id ? `${s.color}18` : DS.surface,
                  border: `1px solid ${activeId === s.id ? `${s.color}50` : DS.border}`,
                  color: activeId === s.id ? s.color : DS.text.secondary,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </button>
              {scenarios.length > 1 && (
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => cloneScenario(s.id)}
                    title="Duplicate"
                    className="p-1 rounded"
                    style={{ color: DS.text.muted }}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {scenarios.length > 1 && (
                    <button
                      onClick={() => deleteScenario(s.id)}
                      title="Delete"
                      className="p-1 rounded"
                      style={{ color: DS.accent.red + '99' }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg"
          style={{
            background: DS.surface,
            border: `1px dashed ${DS.border}`,
            color: DS.text.muted,
          }}
        >
          <Plus className="w-3 h-3" /> Save Current as Scenario
        </button>
      </div>

      {/* Add scenario modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border p-4 flex items-center gap-3"
            style={{ borderColor: DS.accent.gold + '40', background: `${DS.accent.gold}08` }}
          >
            <p className="text-[10px] font-semibold" style={{ color: DS.text.secondary }}>
              Scenario name:
            </p>
            <input
              type="text"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newScenarioName.trim())
                  saveScenario(newScenarioName.trim());
              }}
              placeholder="e.g. Stress Test, Upside, Conservative…"
              className="flex-1 bg-transparent px-2 py-1 text-xs text-white focus:outline-none rounded border"
              style={{ borderColor: DS.border }}
              autoFocus
            />
            <button
              onClick={() => {
                if (newScenarioName.trim()) saveScenario(newScenarioName.trim());
              }}
              className="px-3 py-1 rounded text-[10px] font-semibold"
              style={{ background: DS.accent.gold, color: '#000' }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowAddModal(false);
                setNewScenarioName('');
              }}
              className="px-3 py-1 rounded text-[10px]"
              style={{ color: DS.text.muted }}
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab navigation */}
      <div className="flex items-center gap-1">
        {[
          { id: 'builder', label: 'Pro Forma', icon: <BarChart3 className="w-3 h-3" /> },
          { id: 'sensitivity', label: '2D Sensitivity', icon: <Grid3X3 className="w-3 h-3" /> },
          { id: 'compare', label: 'Scenario Compare', icon: <GitCompare className="w-3 h-3" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{
              background: activeTab === tab.id ? `${DS.accent.blue}18` : DS.surface,
              border: `1px solid ${activeTab === tab.id ? `${DS.accent.blue}50` : DS.border}`,
              color: activeTab === tab.id ? DS.accent.blue : DS.text.secondary,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'builder' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Total Project Cost',
                value: fmt(r.totalProjectCost),
                sub: `${fmt(r.costPerUnit)}/unit`,
                color: DS.accent.gold,
              },
              {
                label: 'Stabilized Value',
                value: fmt(r.stabilizedValue),
                sub: `${fmt(r.valuePerUnit)}/unit`,
                color: DS.accent.green,
              },
              {
                label: 'Developer Profit',
                value: fmt(r.developerProfit),
                sub: `${pct(r.profitOnCost)} on cost`,
                color: poc_ok ? DS.accent.green : DS.accent.red,
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

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Levered IRR',
                value: `${pct(r.irr)}`,
                ok: irr_ok,
                threshold: '≥18% target',
              },
              {
                label: 'Equity Multiple',
                value: `${r.equityMultiple.toFixed(2)}×`,
                ok: em_ok,
                threshold: `≥${inputs.equityMultipleTarget}× target`,
              },
              {
                label: 'Yield on Cost',
                value: `${pct(r.yieldOnCost)}`,
                ok: r.yieldOnCost > inputs.exitCapRate,
                threshold: `vs. ${pct(inputs.exitCapRate)} cap rate`,
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl border p-4 flex items-center gap-3"
                style={{
                  borderColor: m.ok ? `${DS.accent.green}30` : `${DS.accent.red}30`,
                  background: m.ok ? `${DS.accent.green}06` : `${DS.accent.red}06`,
                }}
              >
                {m.ok ? (
                  <CheckCircle className="w-5 h-5 shrink-0" style={{ color: DS.accent.green }} />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: DS.accent.red }} />
                )}
                <div>
                  <p
                    className="text-[9px] uppercase tracking-wider"
                    style={{ color: DS.text.muted }}
                  >
                    {m.label}
                  </p>
                  <p
                    className="text-xl font-bold font-mono"
                    style={{ color: m.ok ? DS.accent.green : DS.accent.red }}
                  >
                    {m.value}
                  </p>
                  <p className="text-[9px]" style={{ color: DS.text.muted }}>
                    {m.threshold}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {showInputs && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border p-4"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-3"
                style={{ color: DS.text.muted }}
              >
                Project Inputs —{' '}
                <span style={{ color: activeScenario.color }}>{activeScenario.name}</span>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <NumInput
                  label="Total Units"
                  value={inputs.totalUnits}
                  onChange={setInput('totalUnits')}
                />
                <NumInput
                  label="Avg Unit SF"
                  value={inputs.avgUnitSF}
                  onChange={setInput('avgUnitSF')}
                  suffix="SF"
                />
                <NumInput
                  label="Land Cost"
                  value={inputs.landCost}
                  onChange={setInput('landCost')}
                  prefix="$"
                  step={100000}
                />
                <NumInput
                  label="Hard Cost/SF"
                  value={inputs.hardCostPerSF}
                  onChange={setInput('hardCostPerSF')}
                  prefix="$"
                  suffix="/SF"
                  step={5}
                />
                <NumInput
                  label="Soft Cost %"
                  value={inputs.softCostPct}
                  onChange={setInput('softCostPct')}
                  suffix="%"
                  step={0.5}
                />
                <NumInput
                  label="Contingency %"
                  value={inputs.contingencyPct}
                  onChange={setInput('contingencyPct')}
                  suffix="%"
                  step={0.5}
                />
                <NumInput
                  label="Financing Rate"
                  value={inputs.financingRate}
                  onChange={setInput('financingRate')}
                  suffix="%"
                  step={0.25}
                />
                <NumInput
                  label="Loan-to-Cost"
                  value={inputs.loanToCost}
                  onChange={setInput('loanToCost')}
                  suffix="%"
                  step={1}
                />
                <NumInput
                  label="Construction Mo."
                  value={inputs.constructionMonths}
                  onChange={setInput('constructionMonths')}
                  suffix="mo"
                />
                <NumInput
                  label="Absorption Mo."
                  value={inputs.absorptionMonths}
                  onChange={setInput('absorptionMonths')}
                  suffix="mo"
                />
                <NumInput
                  label="Market Rent/SF/Mo"
                  value={inputs.marketRentPerSF}
                  onChange={setInput('marketRentPerSF')}
                  prefix="$"
                  step={0.05}
                />
                <NumInput
                  label="Exit Cap Rate"
                  value={inputs.exitCapRate}
                  onChange={setInput('exitCapRate')}
                  suffix="%"
                  step={0.25}
                />
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-3"
                style={{ color: DS.text.muted }}
              >
                Cost Waterfall
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={r.schedule} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="phase" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="cost"
                    name="Cost"
                    fill={activeScenario.color}
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
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
                Exit Cap Rate Sensitivity
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr>
                      {['Cap Rate', 'Stabilized Value', 'Developer Profit', 'Equity Multiple'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left pb-2 font-semibold uppercase tracking-wider"
                            style={{ color: DS.text.muted }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {r.sensRows.map((row) => {
                      const isBase = Math.abs(row.capRate - inputs.exitCapRate) < 0.01;
                      return (
                        <tr
                          key={row.capRate}
                          className={cn('border-t', isBase ? 'bg-white/[0.02]' : '')}
                          style={{ borderColor: DS.border }}
                        >
                          <td
                            className="py-1.5 font-mono font-bold"
                            style={{ color: isBase ? DS.accent.gold : DS.text.secondary }}
                          >
                            {pct(row.capRate)}
                            {isBase ? ' ← base' : ''}
                          </td>
                          <td className="py-1.5 font-mono" style={{ color: DS.text.secondary }}>
                            {fmt(row.value)}
                          </td>
                          <td
                            className="py-1.5 font-mono"
                            style={{ color: row.profit > 0 ? DS.accent.green : DS.accent.red }}
                          >
                            {fmt(row.profit)}
                          </td>
                          <td
                            className="py-1.5 font-mono"
                            style={{
                              color:
                                row.em >= inputs.equityMultipleTarget
                                  ? DS.accent.green
                                  : DS.accent.red,
                            }}
                          >
                            {row.em.toFixed(2)}×
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
              Income & Expense Summary
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: 'Gross Potential Rent',
                  value: fmt(r.grossPotentialRent),
                  sub: 'annualized',
                },
                {
                  label: 'Effective Gross Income',
                  value: fmt(r.effectiveGrossIncome),
                  sub: `at ${inputs.stabilizedOccupancy}% occ.`,
                },
                {
                  label: 'Operating Expenses',
                  value: fmt(r.opex),
                  sub: `$${inputs.opexPerSF}/SF/yr`,
                },
                {
                  label: 'Net Operating Income',
                  value: fmt(r.noi),
                  sub: `${pct(r.yieldOnCost)} yield on cost`,
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${DS.border}` }}
                >
                  <p
                    className="text-[8px] uppercase tracking-wider"
                    style={{ color: DS.text.muted }}
                  >
                    {m.label}
                  </p>
                  <p
                    className="text-base font-bold font-mono mt-1"
                    style={{ color: DS.accent.gold }}
                  >
                    {m.value}
                  </p>
                  <p className="text-[8px] mt-0.5" style={{ color: DS.text.muted }}>
                    {m.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'sensitivity' && (
        <div className="space-y-4">
          <div
            className="rounded-xl border p-4 flex items-start gap-3"
            style={{ borderColor: `${DS.accent.blue}30`, background: `${DS.accent.blue}06` }}
          >
            <BarChart2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: DS.accent.blue }} />
            <div>
              <p className="text-[10px] font-semibold" style={{ color: DS.text.secondary }}>
                Analyzing <span style={{ color: activeScenario.color }}>{activeScenario.name}</span>
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
                Select any two axes — Hard Cost, Cap Rate, Rent/SF, Occupancy, or Financing Rate —
                to generate a Levered IRR heat map. Use the Cols/Rows pickers inside the panel.
                Green = strong returns, red = challenged deal. Outlined cell = base case.
              </p>
            </div>
          </div>
          <SensHeatMap inputs={inputs} />
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="space-y-4">
          {scenarios.length < 2 ? (
            <div
              className="rounded-xl border p-6 text-center"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <GitCompare className="w-8 h-8 mx-auto mb-2" style={{ color: DS.text.muted }} />
              <p className="text-sm font-semibold text-white/60">
                Save at least 2 scenarios to compare
              </p>
              <p className="text-[10px] mt-1" style={{ color: DS.text.muted }}>
                Use the "Save Current as Scenario" button above, or switch tabs to adjust inputs.
              </p>
            </div>
          ) : (
            <ScenarioComparisonPanel scenarios={scenarios} />
          )}
        </div>
      )}
    </div>
  );
}
