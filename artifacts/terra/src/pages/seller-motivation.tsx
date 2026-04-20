import { useStandardQuery } from '@szl-holdings/api-client-react';
import { cn } from '@szl-holdings/shared-ui/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Info,
  Loader2,
  Shield,
  Sliders,
  Target,
  TrendingDown,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { api } from '@/lib/api';

type AcceptanceCategory = 'very-likely' | 'likely' | 'possible' | 'unlikely';

interface MotivationFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

interface SellerProfile {
  id: string;
  address: string;
  neighborhood: string;
  ownerName: string;
  ownerType: 'individual' | 'LLC' | 'estate' | 'institutional';
  debtLoad: number;
  estimatedEquity: number;
  daysInDistress: number;
  priorOffers: number;
  listingExpiry: string | null;
  acceptanceScore: number;
  acceptanceCategory: AcceptanceCategory;
  suggestedDiscount: number;
  factors: MotivationFactor[];
  aiInsight: string;
  comparableAcceptances: number;
}

const CATEGORY_META: Record<
  AcceptanceCategory,
  { label: string; color: string; bg: string; description: string }
> = {
  'very-likely': {
    label: 'Very Likely',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/20',
    description: 'Strong motivation indicators — aggressive offer warranted',
  },
  likely: {
    label: 'Likely',
    color: 'text-sky-400',
    bg: 'bg-sky-400/10 border-sky-400/20',
    description: 'Multiple positive signals — below-market offer viable',
  },
  possible: {
    label: 'Possible',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    description: 'Mixed signals — relationship-building approach recommended',
  },
  unlikely: {
    label: 'Unlikely',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/20',
    description: 'Seller has leverage — full-price or near-market required',
  },
};

function formatCurrency(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? '#34d399' : score >= 60 ? '#38bdf8' : score >= 40 ? '#fbbf24' : '#f87171';
  const angle = (score / 100) * 180 - 90;
  const r = 38;
  const cx = 52,
    cy = 52;
  const startAngle = -180 * (Math.PI / 180);
  const endAngle = (angle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = score > 50 ? 1 : 0;
  return (
    <div className="flex flex-col items-center">
      <svg width={104} height={60} viewBox="0 0 104 60">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={6}
        />
        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight="bold" fill={color}>
          {score}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.3)">
          / 100
        </text>
      </svg>
    </div>
  );
}

function FactorBar({ factor }: { factor: MotivationFactor }) {
  const color =
    factor.impact === 'positive' ? '#34d399' : factor.impact === 'negative' ? '#f87171' : '#94a3b8';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-white/60 flex-1">{factor.factor}</span>
        <span className="text-[10px] font-bold flex-shrink-0" style={{ color }}>
          {(factor.weight * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-1 bg-white/5 rounded-full">
        <div
          className="h-1 rounded-full"
          style={{ width: `${factor.weight * 100}%`, background: color }}
        />
      </div>
      <p className="text-[10px] text-white/30">{factor.description}</p>
    </div>
  );
}

function SellerCard({
  seller,
  selected,
  onClick,
}: {
  seller: SellerProfile;
  selected: boolean;
  onClick: () => void;
}) {
  const meta = CATEGORY_META[seller.acceptanceCategory];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border cursor-pointer transition-all duration-200',
        selected
          ? 'bg-white/4 border-white/15'
          : 'bg-[#0f1115] border-white/5 hover:border-white/10',
      )}
    >
      <div className="flex items-start gap-4">
        <ScoreGauge score={seller.acceptanceScore} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">{seller.address}</p>
              <p className="text-xs text-white/40 mt-0.5">
                {seller.neighborhood} ·{' '}
                {seller.ownerType === 'individual' ? 'Individual Owner' : seller.ownerName}
              </p>
            </div>
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold flex-shrink-0',
                meta.bg,
              )}
            >
              <span className={meta.color}>{meta.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-xs">
              <span className="text-white/30">Debt: </span>
              <span className="text-white/70">{formatCurrency(seller.debtLoad)}</span>
            </div>
            <div className="text-xs">
              <span className="text-white/30">Equity: </span>
              <span className="text-white/70">{formatCurrency(seller.estimatedEquity)}</span>
            </div>
            <div className="text-xs">
              <span className="text-white/30">Days: </span>
              <span className="text-white/70">{seller.daysInDistress}d</span>
            </div>
            <div className="text-xs">
              <span className="text-[#40856a]">−{seller.suggestedDiscount}% target</span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}

function DetailPanel({ seller, onClose }: { seller: SellerProfile; onClose: () => void }) {
  const meta = CATEGORY_META[seller.acceptanceCategory];
  const positiveFactors = seller.factors.filter((f) => f.impact === 'positive').length;
  const negativeFactors = seller.factors.filter((f) => f.impact === 'negative').length;

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      className="flex flex-col bg-[#0a0c10] border-l border-white/6 overflow-hidden"
      style={{ width: 420, flexShrink: 0 }}
    >
      <div className="p-5 border-b border-white/6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">{seller.address}</h3>
            <p className="text-xs text-white/40">{seller.neighborhood}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <ScoreGauge score={seller.acceptanceScore} />
          <div>
            <div
              className={cn('px-2 py-1 rounded border text-xs font-semibold', meta.bg, meta.color)}
            >
              {meta.label}
            </div>
            <p className="text-[10px] text-white/40 mt-1 max-w-[200px]">{meta.description}</p>
          </div>
        </div>
      </div>

      <div className="p-5 border-b border-white/6">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
          AI Motivation Analysis
        </p>
        <p className="text-xs text-white/60 leading-relaxed">{seller.aiInsight}</p>
      </div>

      <div className="p-5 border-b border-white/6">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Debt Load', value: formatCurrency(seller.debtLoad), color: 'text-white/80' },
            {
              label: 'Est. Equity',
              value: formatCurrency(seller.estimatedEquity),
              color: 'text-white/80',
            },
            {
              label: 'Days in Distress',
              value: `${seller.daysInDistress}d`,
              color: 'text-amber-400',
            },
            { label: 'Prior Offers', value: seller.priorOffers.toString(), color: 'text-white/80' },
            {
              label: 'Suggested Discount',
              value: `−${seller.suggestedDiscount}%`,
              color: 'text-[#40856a]',
            },
            {
              label: 'Comp Acceptances',
              value: `${seller.comparableAcceptances} similar deals`,
              color: 'text-sky-400',
            },
          ].map((m) => (
            <div key={m.label} className="bg-white/3 border border-white/5 rounded-lg p-2.5">
              <p className="text-[9px] text-white/30">{m.label}</p>
              <p className={cn('text-sm font-bold mt-0.5', m.color)}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Factor Model</p>
          <div className="flex gap-3 text-[9px]">
            <span className="text-emerald-400">{positiveFactors} bullish</span>
            <span className="text-red-400">{negativeFactors} bearish</span>
          </div>
        </div>
        <div className="space-y-4">
          {seller.factors
            .sort((a, b) => b.weight - a.weight)
            .map((f) => (
              <FactorBar key={f.factor} factor={f} />
            ))}
        </div>
      </div>

      <div className="p-4 border-t border-white/6 space-y-2">
        <button className="w-full py-2.5 rounded-lg bg-[#40856a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" />
          Generate Offer Strategy
        </button>
        <button className="w-full py-2 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors">
          Launch Deal Autopilot
        </button>
      </div>
    </motion.div>
  );
}

export default function SellerMotivation() {
  const [, params] = useRoute<{ propertyId: string }>('/seller-motivation/:propertyId');
  const propertyId = params?.propertyId;

  const { data: propertyData, isLoading: propertyLoading } = useStandardQuery({
    queryKey: ['terra-seller-motivation', propertyId],
    queryFn: () => api.properties.sellerMotivation(propertyId!),
    enabled: !!propertyId,
    staleTime: 300_000,
  });

  const {
    data: portfolioData,
    isLoading: portfolioLoading,
    isError: portfolioError,
  } = useStandardQuery({
    queryKey: ['terra-portfolio-seller-motivation'],
    queryFn: () => api.portfolio.sellerMotivation(),
    enabled: !propertyId,
    staleTime: 300_000,
  });

  const SELLERS: SellerProfile[] = (portfolioData?.sellers as SellerProfile[] | undefined) ?? [];

  const [selected, setSelected] = useState<SellerProfile | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<AcceptanceCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return SELLERS.filter(
      (s) => categoryFilter === 'all' || s.acceptanceCategory === categoryFilter,
    ).sort((a, b) => b.acceptanceScore - a.acceptanceScore);
  }, [categoryFilter, SELLERS]);

  const stats = {
    veryLikely: SELLERS.filter((s) => s.acceptanceCategory === 'very-likely').length,
    likely: SELLERS.filter((s) => s.acceptanceCategory === 'likely').length,
    avgDiscount: SELLERS.length
      ? Math.round(SELLERS.reduce((s, p) => s + p.suggestedDiscount, 0) / SELLERS.length)
      : 0,
    avgScore: SELLERS.length
      ? Math.round(SELLERS.reduce((s, p) => s + p.acceptanceScore, 0) / SELLERS.length)
      : 0,
  };

  if (propertyId) {
    const d = propertyData?.data;
    const catColors: Record<string, string> = {
      'very-likely': '#34d399',
      likely: '#60a5fa',
      possible: '#fbbf24',
      unlikely: '#f87171',
    };
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
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5" style={{ color: '#40856a' }} />
            <h1 className="text-xl font-bold text-white">Seller Motivation Predictor</h1>
            {d && (
              <span
                className="text-[9px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wide"
                style={{
                  background: 'rgba(64,133,106,0.1)',
                  color: '#40856a',
                  borderColor: 'rgba(64,133,106,0.2)',
                }}
              >
                Score {d.acceptanceScore}
              </span>
            )}
          </div>
          <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            AI-scored below-market acceptance probability for property{' '}
            <code style={{ color: '#40856a' }}>{propertyId}</code>
          </p>

          {propertyLoading || !d ? (
            <div
              className="flex items-center gap-3 p-8 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#40856a' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Analysing seller motivation…
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  {
                    label: 'Acceptance Score',
                    value: d.acceptanceScore.toString(),
                    color: catColors[d.acceptanceCategory] ?? '#fff',
                    sub: d.acceptanceCategory.replace('-', ' '),
                  },
                  {
                    label: 'Target Discount',
                    value: `−${d.suggestedDiscount}%`,
                    color: '#40856a',
                    sub: 'below market ask',
                  },
                  {
                    label: 'Estimated Equity',
                    value: formatCurrency(d.estimatedEquity),
                    color: '#60a5fa',
                    sub: 'estimated',
                  },
                  {
                    label: 'Days on Market',
                    value: d.daysOnMarket.toString(),
                    color: d.daysOnMarket > 90 ? '#f97316' : '#34d399',
                    sub: 'DOM',
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <p
                      className="text-[9px] uppercase tracking-wider mb-1"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      {m.label}
                    </p>
                    <p className="text-xl font-bold" style={{ color: m.color }}>
                      {m.value}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {m.sub}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="rounded-xl p-5 mb-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p className="text-sm font-semibold text-white mb-3">Motivation Factors</p>
                <div className="space-y-2.5">
                  {d.motivationFactors.map((f) => (
                    <div key={f.factor} className="flex items-start gap-3">
                      <div className="flex items-center gap-2 w-48 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-xs text-white/70">{f.factor}</span>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-full h-1.5 mt-1">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500"
                          style={{ width: `${f.weight * 100}%` }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-semibold w-10 text-right"
                        style={{ color: '#40856a' }}
                      >
                        {Math.round(f.weight * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-5"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <p className="text-xs font-semibold text-white mb-2">Outreach Script</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {d.outreachScript}
                  </p>
                </div>
                <div
                  className="rounded-xl p-5"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <p className="text-xs font-semibold text-white mb-2">Distress Signals</p>
                  <div className="space-y-1.5">
                    {(d.distressSignals as string[]).map((s: string) => (
                      <div key={s} className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-[11px] text-white/60">{s}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Source: {d.dataSource}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (portfolioLoading || (!portfolioData && !portfolioError)) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: '#0a0c10' }}>
        <div
          className="flex items-center gap-3 px-6 py-4 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#40856a' }} />
          <p className="text-sm text-white/50">Loading seller portfolio…</p>
        </div>
      </div>
    );
  }

  if (portfolioError) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: '#0a0c10' }}>
        <div
          className="px-6 py-4 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <p className="text-sm text-red-400">Unable to load seller portfolio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-6 border-b border-white/6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#40856a]" />
                Seller Motivation Predictor
              </h1>
              <p className="text-xs text-white/40 mt-1">
                AI scoring of below-market acceptance probability based on debt load, distress
                depth, and comparable transaction patterns
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              {
                label: 'Very Likely Sellers',
                value: stats.veryLikely.toString(),
                color: 'text-emerald-400',
                sub: 'score ≥ 80',
              },
              {
                label: 'Likely Sellers',
                value: stats.likely.toString(),
                color: 'text-sky-400',
                sub: 'score 60-79',
              },
              {
                label: 'Avg Acceptance Score',
                value: stats.avgScore.toString(),
                color: 'text-white',
                sub: 'across pipeline',
              },
              {
                label: 'Avg Target Discount',
                value: `−${stats.avgDiscount}%`,
                color: 'text-[#40856a]',
                sub: 'below market',
              },
            ].map((m) => (
              <div key={m.label} className="bg-white/2 border border-white/5 rounded-xl p-3">
                <p className="text-[9px] text-white/30 uppercase tracking-wider">{m.label}</p>
                <p className={cn('text-xl font-bold mt-1', m.color)}>{m.value}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-3 border-b border-white/6 flex items-center gap-2">
          {(['all', 'very-likely', 'likely', 'possible', 'unlikely'] as const).map((c) => {
            const meta = c !== 'all' ? CATEGORY_META[c] : null;
            return (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs border transition-colors font-medium',
                  categoryFilter === c
                    ? meta
                      ? `${meta.bg} ${meta.color}`
                      : 'bg-white/8 text-white border-white/20'
                    : 'text-white/30 border-white/8 hover:border-white/15 hover:text-white/50',
                )}
              >
                {c === 'all' ? 'All Sellers' : CATEGORY_META[c].label}
              </button>
            );
          })}
          <span className="ml-auto text-xs text-white/30">{filtered.length} profiles</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {filtered.map((s) => (
            <SellerCard
              key={s.id}
              seller={s}
              selected={selected?.id === s.id}
              onClick={() => setSelected(s)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <DetailPanel key={selected.id} seller={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
