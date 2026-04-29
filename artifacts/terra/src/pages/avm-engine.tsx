import { MicroFeedbackWidget } from '@szl-holdings/shared-ui/micro-feedback-widget';
import { cn } from '@szl-holdings/shared-ui/utils';
import { motion as m } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

type Approach = 'sales_comparison' | 'income' | 'cost' | 'dcf';

interface ValuationResult {
  approach: Approach;
  label: string;
  value: number;
  low: number;
  high: number;
  confidence: number;
  weight: number;
  methodology: string;
  keyInputs: { label: string; value: string }[];
}

interface ComparableSale {
  address: string;
  saleDate: string;
  price: number;
  pricePerSqft: number;
  sqft: number;
  adjustedPrice: number;
  adjustments: { factor: string; amount: number }[];
  similarity: number;
}

interface PropertyValuation {
  id: string;
  address: string;
  type: string;
  sqft: number;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  lotSqft: number;
  blendedValue: number;
  blendedLow: number;
  blendedHigh: number;
  medianError: number;
  confidenceLevel: string;
  approaches: ValuationResult[];
  comparables: ComparableSale[];
  marketAdjustments: { factor: string; impact: number; detail: string }[];
}

const VALUATIONS: PropertyValuation[] = [
  {
    id: 'avm-1',
    address: '345 Park Ave, San Jose, CA 95110',
    type: 'Office',
    sqft: 125000,
    yearBuilt: 2018,
    bedrooms: 0,
    bathrooms: 0,
    lotSqft: 42000,
    blendedValue: 52800000,
    blendedLow: 50200000,
    blendedHigh: 55400000,
    medianError: 2.4,
    confidenceLevel: 'High',
    approaches: [
      {
        approach: 'sales_comparison',
        label: 'Sales Comparison',
        value: 54200000,
        low: 51400000,
        high: 57000000,
        confidence: 82,
        weight: 0.35,
        methodology:
          'ML-enhanced comparable selection using gradient-boosted trees. 847 transactions analyzed within 5-mile radius, 24-month lookback. Top 6 comps selected by feature similarity score.',
        keyInputs: [
          { label: 'Comparable Pool', value: '847 transactions' },
          { label: 'Median $/SF', value: '$422' },
          { label: 'Time Adjustment', value: '-1.2% annual' },
          { label: 'Location Factor', value: '+3.8%' },
        ],
      },
      {
        approach: 'income',
        label: 'Income Approach',
        value: 51500000,
        low: 49200000,
        high: 53800000,
        confidence: 88,
        weight: 0.35,
        methodology:
          'Direct capitalization using stabilized NOI. Cap rate derived from 23 comparable sales of similar vintage and class. Vacancy adjusted to submarket equilibrium of 8.2%.',
        keyInputs: [
          { label: 'Stabilized NOI', value: '$3,862,500' },
          { label: 'Market Cap Rate', value: '7.50%' },
          { label: 'Effective GI', value: '$5,625,000' },
          { label: 'Operating Ratio', value: '31.3%' },
        ],
      },
      {
        approach: 'cost',
        label: 'Cost Approach',
        value: 48900000,
        low: 45800000,
        high: 52000000,
        confidence: 65,
        weight: 0.1,
        methodology:
          'Replacement cost new less depreciation. Marshall & Swift Class A office, good quality. Physical depreciation via age-life method. External obsolescence from remote work impact.',
        keyInputs: [
          { label: 'Replacement Cost/SF', value: '$385' },
          { label: 'Land Value', value: '$12,600,000' },
          { label: 'Physical Depreciation', value: '8.3%' },
          { label: 'External Obsolescence', value: '4.0%' },
        ],
      },
      {
        approach: 'dcf',
        label: 'DCF Analysis',
        value: 53400000,
        low: 50100000,
        high: 56700000,
        confidence: 78,
        weight: 0.2,
        methodology:
          '10-year discounted cash flow with terminal cap rate of 8.0%. Rent growth at 2.5% annually. Capital reserves at $2.50/SF. Discount rate derived from WACC analysis.',
        keyInputs: [
          { label: 'Discount Rate', value: '9.25%' },
          { label: 'Terminal Cap', value: '8.00%' },
          { label: 'Rent Growth', value: '2.50% / yr' },
          { label: 'Hold Period', value: '10 years' },
        ],
      },
    ],
    comparables: [
      {
        address: '2025 Gateway Pl, San Jose',
        saleDate: '2025-08',
        price: 48500000,
        pricePerSqft: 415,
        sqft: 116800,
        adjustedPrice: 51200000,
        adjustments: [
          { factor: 'Size', amount: -800000 },
          { factor: 'Age', amount: 1200000 },
          { factor: 'Location', amount: 2300000 },
        ],
        similarity: 92,
      },
      {
        address: '177 Park Ave, San Jose',
        saleDate: '2025-05',
        price: 62000000,
        pricePerSqft: 438,
        sqft: 141500,
        adjustedPrice: 55800000,
        adjustments: [
          { factor: 'Size', amount: -3200000 },
          { factor: 'Condition', amount: -1800000 },
          { factor: 'Parking', amount: -1200000 },
        ],
        similarity: 87,
      },
      {
        address: '10 Almaden Blvd, San Jose',
        saleDate: '2025-02',
        price: 39200000,
        pricePerSqft: 392,
        sqft: 100000,
        adjustedPrice: 46500000,
        adjustments: [
          { factor: 'Size', amount: 2800000 },
          { factor: 'Age', amount: 3200000 },
          { factor: 'Amenities', amount: 1300000 },
        ],
        similarity: 84,
      },
      {
        address: '225 W Santa Clara St',
        saleDate: '2024-11',
        price: 44800000,
        pricePerSqft: 408,
        sqft: 109800,
        adjustedPrice: 49100000,
        adjustments: [
          { factor: 'Time', amount: 2200000 },
          { factor: 'Location', amount: 1500000 },
          { factor: 'Quality', amount: 600000 },
        ],
        similarity: 81,
      },
    ],
    marketAdjustments: [
      {
        factor: 'Interest Rate Environment',
        impact: -2.8,
        detail:
          '10Y Treasury at 4.25% compressing cap rates. Negative pressure on valuations vs. 2021 peak.',
      },
      {
        factor: 'Remote Work Impact',
        impact: -4.2,
        detail:
          'Office submarket vacancy at 14.3% vs. 8.1% pre-COVID. Sublease overhang remains elevated.',
      },
      {
        factor: 'Tech Employment Growth',
        impact: 3.1,
        detail:
          'AI/ML hiring boom driving positive net absorption in Silicon Valley. 12-month trend reversal.',
      },
      {
        factor: 'ESG & Sustainability Premium',
        impact: 1.5,
        detail:
          'LEED Platinum certification commands 3-5% rent premium. Green building demand exceeds supply.',
      },
    ],
  },
];

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

const APPROACH_COLORS: Record<Approach, string> = {
  sales_comparison: '#60a5fa',
  income: '#34d399',
  cost: '#fbbf24',
  dcf: '#a78bfa',
};

export default function AvmEnginePage() {
  const [selectedApproach, setSelectedApproach] = useState<Approach | null>(null);
  const v = VALUATIONS[0];

  return (
    <div className="min-h-screen" style={{ background: '#0a0c10' }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
            Automated Valuation
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            AVM 2.0 — Multi-Approach Valuation Engine
          </h1>
          <p className="mt-1 text-sm text-white/40">
            ML-enhanced comparable selection, confidence intervals, and sub-3% median error
            targeting.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-8">
          <div className="flex items-start gap-6 mb-6">
            <div>
              <div className="text-sm text-white/40 mb-1">{v.address}</div>
              <div className="text-3xl font-bold text-white">{fmt(v.blendedValue)}</div>
              <div className="text-xs text-white/40 mt-1">
                Range: {fmt(v.blendedLow)} — {fmt(v.blendedHigh)}
              </div>
            </div>
            <div className="flex gap-4 ml-auto">
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: '#34d399' }}>
                  {v.medianError}%
                </div>
                <div className="text-[9px] text-white/30">Median Error</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: '#60a5fa' }}>
                  {v.confidenceLevel}
                </div>
                <div className="text-[9px] text-white/30">Confidence</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {v.approaches.map((a) => (
              <button
                key={a.approach}
                onClick={() =>
                  setSelectedApproach(a.approach === selectedApproach ? null : a.approach)
                }
                className={cn(
                  'rounded-xl border p-4 text-left transition',
                  a.approach === selectedApproach
                    ? 'border-white/20 bg-white/[0.04]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03]',
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: APPROACH_COLORS[a.approach] }}
                  />
                  <span className="text-xs font-semibold text-white/50">{a.label}</span>
                  <span className="ml-auto text-[9px] text-white/30">
                    wt: {(a.weight * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-lg font-bold text-white">{fmt(a.value)}</div>
                <div className="text-[10px] text-white/30 mt-0.5">
                  {fmt(a.low)} — {fmt(a.high)}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex-1 h-1 rounded-full bg-white/[0.06]">
                    <div
                      className="h-1 rounded-full"
                      style={{ width: `${a.confidence}%`, background: APPROACH_COLORS[a.approach] }}
                    />
                  </div>
                  <span className="text-[9px] text-white/40">{a.confidence}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedApproach &&
          (() => {
            const a = v.approaches.find((x) => x.approach === selectedApproach)!;
            return (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-8"
              >
                <h3 className="text-sm font-semibold text-white mb-2">{a.label} — Methodology</h3>
                <p className="text-xs text-white/40 mb-4">{a.methodology}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {a.keyInputs.map((ki) => (
                    <div
                      key={ki.label}
                      className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3"
                    >
                      <div className="text-[10px] text-white/30">{ki.label}</div>
                      <div className="text-sm font-semibold text-white mt-0.5">{ki.value}</div>
                    </div>
                  ))}
                </div>
              </m.div>
            );
          })()}

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">ML-Selected Comparables</h3>
            <div className="space-y-3">
              {v.comparables.map((c, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-white">{c.address}</div>
                      <div className="text-[10px] text-white/40">
                        {c.saleDate} · {c.sqft.toLocaleString()} SF · ${c.pricePerSqft}/SF
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{fmt(c.price)}</div>
                      <div className="text-[10px]" style={{ color: '#60a5fa' }}>
                        {c.similarity}% similar
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {c.adjustments.map((adj, j) => (
                      <span
                        key={j}
                        className="text-[9px] px-2 py-0.5 rounded-full border"
                        style={{
                          color: adj.amount >= 0 ? '#34d399' : '#ef4444',
                          background: adj.amount >= 0 ? '#34d39908' : '#ef444408',
                          borderColor: adj.amount >= 0 ? '#34d39920' : '#ef444420',
                        }}
                      >
                        {adj.factor}: {adj.amount >= 0 ? '+' : ''}
                        {fmt(adj.amount)}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
                    <span className="text-[10px] text-white/30">Adjusted Value</span>
                    <span className="text-sm font-semibold text-white">{fmt(c.adjustedPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Market Condition Adjustments</h3>
            <div className="space-y-3">
              {v.marketAdjustments.map((ma, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20">
                      {ma.impact >= 0 ? (
                        <ArrowUpRight className="h-3.5 w-3.5" style={{ color: '#34d399' }} />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{ma.factor}</div>
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: ma.impact >= 0 ? '#34d399' : '#ef4444' }}
                    >
                      {pct(ma.impact)}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/35 ml-11">{ma.detail}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[#2d6a4f]/20 bg-[#2d6a4f]/[0.04] p-4 mt-4">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#2d6a4f' }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#2d6a4f' }}>
                    AVM Accuracy Disclosure
                  </p>
                  <p className="text-[10px] text-white/35 mt-0.5">
                    This automated valuation model achieves a {v.medianError}% median absolute
                    percentage error on back-tested data. The blended estimate uses a weighted
                    average of four valuation approaches. Results are for analytical purposes only
                    and should not substitute for a licensed appraisal.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-3">
              <MicroFeedbackWidget
                featureId="terra-avm-valuation"
                featureName="TERRA AVM Property Valuation"
                app="terra"
                compact
                prompt="Was this valuation useful?"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
