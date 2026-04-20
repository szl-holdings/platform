import { useStandardQuery } from '@szl-holdings/api-client-react';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { cn } from '@szl-holdings/shared-ui/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Flame,
  Gavel,
  GitBranch,
  Info,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  Shield,
  Tag,
  Target,
  TrendingDown,
  User,
  Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useRoute } from 'wouter';

const ACCENT = '#40856a';
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

async function fetchWhyNow(propertyId: string) {
  const res = await fetch(`${BASE}/api/terra/why-this-property/${encodeURIComponent(propertyId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

function formatCurrency(n: number | null | undefined) {
  if (n == null) return 'N/A';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function ScoreTier({ tier }: { tier: string }) {
  const cfg = {
    critical: {
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.3)',
      label: 'CRITICAL',
    },
    high: {
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.3)',
      label: 'HIGH',
    },
    medium: {
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.1)',
      border: 'rgba(96,165,250,0.3)',
      label: 'MEDIUM',
    },
    low: {
      color: '#64748b',
      bg: 'rgba(100,116,139,0.1)',
      border: 'rgba(100,116,139,0.3)',
      label: 'LOW',
    },
  }[tier] ?? {
    color: '#64748b',
    bg: 'rgba(100,116,139,0.1)',
    border: 'rgba(100,116,139,0.3)',
    label: tier.toUpperCase(),
  };

  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest font-mono"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const color = value >= 0.85 ? ACCENT : value >= 0.65 ? '#c8a060' : '#c04a2a';
  const label = value >= 0.85 ? 'High' : value >= 0.65 ? 'Med' : 'Low';
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-mono"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
    >
      {label} {(value * 100).toFixed(0)}%
    </span>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const color =
    severity === 'critical'
      ? '#ef4444'
      : severity === 'high'
        ? '#f59e0b'
        : severity === 'medium'
          ? '#60a5fa'
          : '#64748b';
  return (
    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: color }} />
  );
}

function DataBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded"
      style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}25`, color: `${ACCENT}CC` }}
    >
      <Tag className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

type TabId = 'distress' | 'ownership' | 'financing' | 'neighborhood' | 'memo';

interface DistressFactor {
  factor: string;
  score: number;
  weight: number;
  maxScore: number;
  sourceSystem: string;
  dataset: string;
  citation: string;
  summary: string;
  records: Record<string, unknown>[];
}

interface DistressDecomposition {
  total: number;
  tier: string;
  headline: string;
  factors: DistressFactor[];
  dataSources: string[];
  fetchedAt: string;
  confidence?: number;
}

interface OwnerNode {
  id: string;
  type: string;
  label: string;
  subLabel: string;
  confidence: number;
  source: string;
  riskFlag?: string;
}

interface ChainEdge {
  from: string;
  to: string;
  label: string;
  docType: string;
  date: string;
  confidence: number;
  traceRef: string;
  amount: number | null;
}

interface OwnershipChain {
  nodes: OwnerNode[];
  edges: ChainEdge[];
  beneficialOwner: string;
  beneficialOwnerType: string;
  overallConfidence: number;
  unresolved: boolean;
  acrisRecords: number;
  source: string;
}

interface FinancingClue {
  clue: string;
  detail: string;
  severity: string;
}

interface AcrisMortgageRecord {
  docType: string;
  amount: number | null;
  date: string;
  traceRef: string;
}

interface FinancingStress {
  mortgageAge: number;
  maturityDate: string | null;
  daysToMaturity: number | null;
  ltvEstimate: number | null;
  refiPressure: string;
  debtAmount: number | null;
  estimatedValue: number | null;
  acrisRecords: AcrisMortgageRecord[];
  clues: FinancingClue[];
  source: string;
}

interface NeighborhoodTransaction {
  address: string;
  date: string;
  docType: string;
  traceRef: string;
}

interface NeighborhoodMotion {
  recentTransactions: NeighborhoodTransaction[];
  distressVelocity: number;
  permitActivity: { active: number; stopWork: number; avgApprovalDays: number };
  comparables: NeighborhoodTransaction[];
  source: string;
  borough: string;
  zipCode: string | null;
}

interface MemoFactorRow {
  factor: string;
  score: number;
  weight: string;
  summary: string;
  citation: string;
}

interface MemoEdgeRow {
  from: string;
  to: string;
  relation: string;
  docType: string;
  date: string;
  citation: string;
  amount: string | number | null;
}

interface MemoSection {
  id: string;
  heading: string;
  content?: string;
  table?: MemoFactorRow[];
  total?: number | string;
  edges?: MemoEdgeRow[];
  clues?: FinancingClue[];
  recentTransactions?: NeighborhoodTransaction[];
  permitActivity?: { active: number; stopWork: number };
  beneficialOwner?: string;
  ownerType?: string;
  confidence?: string;
  unresolved?: boolean;
  note?: string;
  ltvEstimate?: string | null;
  mortgageAge?: string | number;
  maturityDate?: string | null;
  daysToMaturity?: number | null;
  refiPressure?: string;
  distressVelocity?: number;
}

interface InvestmentMemo {
  title: string;
  date: string;
  generatedBy: string;
  confidential: boolean;
  sections: MemoSection[];
  dataSources: string[];
  disclaimer: string;
}

const TABS: { id: TabId; label: string; icon: typeof Flame }[] = [
  { id: 'distress', label: 'Distress Score', icon: Flame },
  { id: 'ownership', label: 'Ownership Chain', icon: GitBranch },
  { id: 'financing', label: 'Financing Stress', icon: DollarSign },
  { id: 'neighborhood', label: 'Neighborhood Motion', icon: Activity },
  { id: 'memo', label: 'Investment Memo', icon: FileText },
];

function DistressTab({ distress }: { distress: DistressDecomposition | undefined }) {
  const factors: DistressFactor[] = distress?.factors ?? [];

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="text-5xl font-black font-mono"
                style={{
                  color:
                    distress?.tier === 'critical'
                      ? '#ef4444'
                      : distress?.tier === 'high'
                        ? '#f59e0b'
                        : ACCENT,
                }}
              >
                {distress?.total ?? '—'}
              </div>
              <div>
                <div className="text-xs text-white/40 font-mono">/100</div>
                <ScoreTier tier={distress?.tier ?? 'low'} />
              </div>
            </div>
            <p
              className="text-sm leading-relaxed max-w-lg"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              {distress?.headline ?? 'Computing distress signals…'}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-[9px] uppercase tracking-wider mb-1"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Data sources
            </p>
            <div className="flex flex-col gap-1 items-end">
              {(distress?.dataSources ?? []).slice(0, 4).map((src: string) => (
                <DataBadge key={src} label={src.split('(')[0]!.trim()} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {factors.map((factor: DistressFactor, i: number) => {
            const pct = Math.round((factor.score / factor.maxScore) * 100);
            const barColor =
              pct >= 80 ? '#ef4444' : pct >= 60 ? '#f59e0b' : pct >= 40 ? ACCENT : '#475569';
            return (
              <motion.div
                key={factor.factor}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-xs font-semibold truncate"
                        style={{ color: 'rgba(255,255,255,0.8)' }}
                      >
                        {factor.factor}
                      </span>
                      <span
                        className="text-[9px] font-mono shrink-0"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        {(factor.weight * 100).toFixed(0)}% weight
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold font-mono" style={{ color: barColor }}>
                        {factor.score}
                      </span>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        / {factor.maxScore}
                      </span>
                    </div>
                  </div>

                  <div
                    className="w-full h-1.5 rounded-full mb-2"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <motion.div
                      className="h-1.5 rounded-full"
                      style={{ background: barColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.06 + 0.2 }}
                    />
                  </div>

                  <p
                    className="text-[10px] leading-relaxed mb-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {factor.summary}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <DataBadge label={factor.sourceSystem} />
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      {factor.citation}
                    </span>
                  </div>

                  {factor.records && factor.records.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-[9px] cursor-pointer" style={{ color: ACCENT }}>
                        {factor.records.length} source record{factor.records.length > 1 ? 's' : ''}{' '}
                        →
                      </summary>
                      <div className="mt-1 space-y-1">
                        {factor.records
                          .slice(0, 3)
                          .map((rec: Record<string, unknown>, ri: number) => (
                            <div
                              key={ri}
                              className="rounded p-2 text-[9px] font-mono"
                              style={{
                                background: 'rgba(255,255,255,0.02)',
                                color: 'rgba(255,255,255,0.35)',
                              }}
                            >
                              {Object.entries(rec)
                                .filter(([k]) => !k.startsWith(':'))
                                .slice(0, 5)
                                .map(([k, v]) => (
                                  <span key={k} className="mr-2">
                                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>{k}:</span>{' '}
                                    {String(v).slice(0, 40)}
                                  </span>
                                ))}
                            </div>
                          ))}
                      </div>
                    </details>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div
            className="flex items-center gap-2 text-[9px] font-mono"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <CheckCircle className="w-3 h-3" style={{ color: ACCENT }} />
            Data refreshed{' '}
            {distress?.fetchedAt ? new Date(distress.fetchedAt).toLocaleString() : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

const NODE_COLORS: Record<string, string> = {
  entity: '#4a7dc8',
  person: '#c8a060',
  property: ACCENT,
  lender: '#c04a2a',
};

const NODE_ICONS: Record<string, typeof Building2> = {
  entity: Building2,
  person: User,
  property: Building2,
  lender: Shield,
};

function OwnershipTab({ ownership }: { ownership: OwnershipChain | undefined }) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const nodes: OwnerNode[] = ownership?.nodes ?? [];
  const edges: ChainEdge[] = ownership?.edges ?? [];
  const selected: OwnerNode | undefined = nodes.find((n) => n.id === selectedNode);

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className="w-4 h-4" style={{ color: ACCENT }} />
          <h3 className="font-bold text-white text-sm">Ownership Chain</h3>
          <ConfidencePill value={ownership?.overallConfidence ?? 0} />
          {ownership?.unresolved && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-bold"
              style={{
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              LLC — Beneficial Control Unresolved
            </span>
          )}
          <span
            className="ml-auto text-[9px] font-mono"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            {ownership?.source}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p
              className="text-[9px] uppercase tracking-wider mb-2"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Entities
            </p>
            {nodes.map((node: OwnerNode) => {
              const color = NODE_COLORS[node.type] ?? '#64748b';
              const Icon = NODE_ICONS[node.type] ?? Building2;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  className="w-full text-left rounded-lg p-3 transition-all"
                  style={{
                    background: selectedNode === node.id ? `${color}12` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedNode === node.id ? `${color}40` : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="p-1.5 rounded flex-shrink-0"
                      style={{ background: `${color}18` }}
                    >
                      <Icon className="w-3 h-3" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-semibold truncate"
                          style={{ color: 'rgba(255,255,255,0.85)' }}
                        >
                          {node.label}
                        </span>
                        {node.riskFlag && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                          >
                            {node.riskFlag.split('—')[0]!.trim()}
                          </span>
                        )}
                        <ConfidencePill value={node.confidence} />
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: `${color}80` }}>
                        {node.subLabel}
                      </div>
                      <div
                        className="text-[9px] mt-0.5 truncate"
                        style={{ color: 'rgba(255,255,255,0.2)' }}
                      >
                        {node.source}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <p
              className="text-[9px] uppercase tracking-wider mb-2"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Deed & Mortgage Edges
            </p>
            {edges.length === 0 && (
              <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
                No ACRIS records found — provider may be temporarily unavailable
              </p>
            )}
            {edges.map((edge: ChainEdge, i: number) => (
              <div
                key={i}
                className="rounded-lg p-3"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    {edge.from}
                  </span>
                  <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    {edge.to}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: `${ACCENT}12`, color: ACCENT }}
                  >
                    {edge.docType}
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {edge.label} · {edge.date || '—'}
                  </span>
                  {edge.amount && (
                    <span className="text-[9px] font-mono font-bold" style={{ color: '#c8a060' }}>
                      {formatCurrency(edge.amount)}
                    </span>
                  )}
                  <ConfidencePill value={edge.confidence} />
                  <span className="text-[9px] font-mono ml-auto" style={{ color: `${ACCENT}50` }}>
                    {edge.traceRef}
                  </span>
                </div>
              </div>
            ))}

            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg p-3 mt-2"
                style={{
                  background: `${NODE_COLORS[selected.type] ?? ACCENT}10`,
                  border: `1px solid ${NODE_COLORS[selected.type] ?? ACCENT}30`,
                }}
              >
                <p
                  className="text-[9px] uppercase tracking-wider mb-1"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  Selected Entity
                </p>
                <p className="text-sm font-semibold text-white">{selected.label}</p>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {selected.subLabel}
                </p>
                {selected.riskFlag && (
                  <p className="text-[10px] mt-1" style={{ color: '#ef4444' }}>
                    {selected.riskFlag}
                  </p>
                )}
                <p className="text-[9px] mt-2 font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {selected.source}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancingTab({ financing }: { financing: FinancingStress | undefined }) {
  const clues: FinancingClue[] = financing?.clues ?? [];
  const acrisRecords: AcrisMortgageRecord[] = financing?.acrisRecords ?? [];

  const pressureColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#60a5fa',
    low: ACCENT,
  };
  const pressureColor = pressureColors[financing?.refiPressure ?? 'low'] ?? ACCENT;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'LTV Estimate',
            value:
              financing?.ltvEstimate != null
                ? `${(financing.ltvEstimate * 100).toFixed(0)}%`
                : 'N/A',
            sub: 'Debt-to-Value',
            color:
              financing?.ltvEstimate > 0.75
                ? '#ef4444'
                : financing?.ltvEstimate > 0.65
                  ? '#f59e0b'
                  : ACCENT,
          },
          {
            label: 'Mortgage Age',
            value: financing?.mortgageAge ? `${financing.mortgageAge}yr` : 'N/A',
            sub: 'Years since origination',
            color: (financing?.mortgageAge ?? 0) > 6 ? '#f59e0b' : ACCENT,
          },
          {
            label: 'Days to Maturity',
            value: financing?.daysToMaturity ? `${financing.daysToMaturity}d` : 'N/A',
            sub: financing?.maturityDate ?? 'Unknown',
            color: (financing?.daysToMaturity ?? 999) < 365 ? '#ef4444' : ACCENT,
          },
          {
            label: 'Refi Pressure',
            value: (financing?.refiPressure ?? '—').toUpperCase(),
            sub: 'Financing stress tier',
            color: pressureColor,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p
              className="text-[9px] uppercase tracking-wider mb-1"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {m.label}
            </p>
            <p className="text-2xl font-black font-mono" style={{ color: m.color }}>
              {m.value}
            </p>
            <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      {clues.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <p
            className="text-[9px] uppercase tracking-wider mb-3 font-semibold"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Financing Stress Clues
          </p>
          <div className="space-y-2">
            {clues.map((clue: FinancingClue, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <SeverityDot severity={clue.severity} />
                <div>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    {clue.clue}
                  </span>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {clue.detail}
                  </p>
                </div>
                <span
                  className="ml-auto text-[9px] font-bold uppercase"
                  style={{ color: pressureColors[clue.severity] ?? '#64748b' }}
                >
                  {clue.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {acrisRecords.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <p
              className="text-[9px] uppercase tracking-wider font-semibold"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              ACRIS Mortgage Records
            </p>
            <DataBadge label="bnx9-e6tj" />
          </div>
          <div className="space-y-2">
            {acrisRecords.map((rec: AcrisMortgageRecord, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: `${ACCENT}12`, color: ACCENT }}
                >
                  {rec.docType}
                </span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {rec.date}
                </span>
                {rec.amount && (
                  <span className="text-[10px] font-mono font-bold" style={{ color: '#c8a060' }}>
                    {formatCurrency(rec.amount)}
                  </span>
                )}
                <span className="ml-auto text-[9px] font-mono" style={{ color: `${ACCENT}50` }}>
                  {rec.traceRef}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[9px] mt-2 font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {financing?.source}
          </p>
        </div>
      )}
    </div>
  );
}

function NeighborhoodTab({ neighborhood }: { neighborhood: NeighborhoodMotion | undefined }) {
  const txns: NeighborhoodTransaction[] = neighborhood?.recentTransactions ?? [];
  const pa = neighborhood?.permitActivity ?? {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Distress Velocity',
            value: neighborhood?.distressVelocity ?? 0,
            unit: '% YoY',
            color: (neighborhood?.distressVelocity ?? 0) > 20 ? '#f59e0b' : ACCENT,
          },
          {
            label: 'Active Permits',
            value: pa.active ?? 0,
            unit: 'DOB filings',
            color: (pa.active ?? 0) > 3 ? '#60a5fa' : ACCENT,
          },
          {
            label: 'Stop Work Orders',
            value: pa.stopWork ?? 0,
            unit: 'active SWOs',
            color: (pa.stopWork ?? 0) > 0 ? '#ef4444' : ACCENT,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p
              className="text-[9px] uppercase tracking-wider mb-1"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {m.label}
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-black font-mono" style={{ color: m.color }}>
                {m.value}
              </p>
              {m.label === 'Distress Velocity' && (
                <span className="text-xs font-mono" style={{ color: m.color }}>
                  %
                </span>
              )}
            </div>
            <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {m.unit}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <p
            className="text-[9px] uppercase tracking-wider font-semibold"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Recent ACRIS Deed Transfers
          </p>
          <DataBadge label="8h5j-fqxa" />
          <span className="ml-auto text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {neighborhood?.borough}
          </span>
        </div>
        {txns.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
            No recent transfers on record — ACRIS provider may be temporarily unavailable
          </p>
        ) : (
          <div className="space-y-2">
            {txns.map((t: NeighborhoodTransaction, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <MapPin
                  className="w-3 h-3 flex-shrink-0"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                />
                <span
                  className="text-[10px] truncate flex-1"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  {t.address}
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: `${ACCENT}12`, color: ACCENT }}
                >
                  {t.docType}
                </span>
                <span
                  className="text-[9px] font-mono shrink-0"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {t.date}
                </span>
                <span className="text-[9px] font-mono shrink-0" style={{ color: `${ACCENT}50` }}>
                  {t.traceRef}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[9px] mt-3 font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {neighborhood?.source}
        </p>
      </div>
    </div>
  );
}

function MemoTab({
  memo,
  propertyAddress,
}: {
  memo: InvestmentMemo | undefined;
  propertyAddress: string;
}) {
  const [exporting, setExporting] = useState(false);

  const exportMarkdown = useCallback(() => {
    if (!memo) return;
    setExporting(true);
    try {
      const sections: string[] = [
        `# ${memo.title}`,
        `**Date:** ${memo.date}  `,
        `**Generated by:** ${memo.generatedBy}  `,
        `**Confidential:** ${memo.confidential ? 'Yes' : 'No'}`,
        '',
      ];

      for (const section of memo.sections ?? []) {
        sections.push(`## ${section.heading}`);
        if (section.content) sections.push(section.content);
        if (section.table) {
          sections.push('');
          sections.push('| Factor | Score | Weight | Summary | Citation |');
          sections.push('|--------|-------|--------|---------|----------|');
          for (const row of section.table) {
            sections.push(
              `| ${row.factor} | ${row.score} | ${row.weight} | ${row.summary} | ${row.citation} |`,
            );
          }
          sections.push(`**Total: ${section.total}**`);
        }
        if (section.edges) {
          sections.push('');
          sections.push('| From | To | Relation | Doc Type | Date | Citation | Amount |');
          sections.push('|------|----|----------|----------|------|----------|--------|');
          for (const edge of section.edges) {
            sections.push(
              `| ${edge.from} | ${edge.to} | ${edge.relation} | ${edge.docType} | ${edge.date} | ${edge.citation} | ${edge.amount} |`,
            );
          }
        }
        if (section.clues) {
          for (const clue of section.clues) {
            sections.push(
              `- **${clue.clue}** [${clue.severity?.toUpperCase() ?? ''}]: ${clue.detail}`,
            );
          }
        }
        if (section.recentTransactions) {
          sections.push('');
          sections.push('| Address | Date | Doc Type | Citation |');
          sections.push('|---------|------|----------|----------|');
          for (const t of section.recentTransactions) {
            sections.push(`| ${t.address} | ${t.date} | ${t.docType} | ${t.traceRef} |`);
          }
        }
        if (section.permitActivity) {
          sections.push(`- Active permits: ${section.permitActivity.active}`);
          sections.push(`- Stop work orders: ${section.permitActivity.stopWork}`);
        }
        if (section.beneficialOwner) {
          sections.push(`**Beneficial Owner:** ${section.beneficialOwner}  `);
          sections.push(`**Ownership Type:** ${section.ownerType}  `);
          sections.push(`**Confidence:** ${section.confidence}  `);
          if (section.unresolved)
            sections.push('**⚠ Beneficial control unresolved — LLC shell risk**');
          if (section.note) sections.push(`> ${section.note}`);
        }
        if (section.ltvEstimate) {
          sections.push(`- LTV: ${section.ltvEstimate}`);
          sections.push(`- Mortgage Age: ${section.mortgageAge}`);
          sections.push(`- Maturity: ${section.maturityDate} (${section.daysToMaturity} days)`);
          sections.push(`- Refi Pressure: ${section.refiPressure?.toUpperCase() ?? '—'}`);
        }
        if (section.distressVelocity != null) {
          sections.push(`- Distress velocity: ${section.distressVelocity}% YoY`);
        }
        sections.push('');
      }

      sections.push('---');
      sections.push('**Data Sources**');
      for (const src of memo.dataSources ?? []) {
        sections.push(`- ${src}`);
      }
      sections.push('');
      sections.push(`> ${memo.disclaimer}`);

      const blob = new Blob([sections.join('\n')], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terra-investment-memo-${propertyAddress.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Investment memo exported');
    } finally {
      setExporting(false);
    }
  }, [memo, propertyAddress]);

  if (!memo)
    return (
      <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Loading memo template…
      </div>
    );

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="font-bold text-white text-sm">{memo.title}</h3>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {memo.date} · {memo.generatedBy}
            </p>
          </div>
          <button
            onClick={exportMarkdown}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
            style={{ background: ACCENT, color: 'white' }}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export Memo
          </button>
        </div>

        <div className="space-y-4">
          {(memo.sections ?? []).map((section: MemoSection) => (
            <div
              key={section.id}
              className="rounded-lg p-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <p
                className="text-[9px] uppercase tracking-wider mb-2 font-semibold"
                style={{ color: ACCENT }}
              >
                {section.heading}
              </p>
              {section.content && (
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {section.content}
                </p>
              )}
              {section.table && (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr>
                        {['Factor', 'Score', 'Weight', 'Summary', 'Citation'].map((h) => (
                          <th
                            key={h}
                            className="text-left pb-2 pr-3 font-semibold uppercase tracking-wider"
                            style={{ color: 'rgba(255,255,255,0.25)' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.map((row: MemoFactorRow, i: number) => (
                        <tr
                          key={i}
                          className="border-t"
                          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                        >
                          <td
                            className="py-1.5 pr-3 font-medium"
                            style={{ color: 'rgba(255,255,255,0.7)' }}
                          >
                            {row.factor}
                          </td>
                          <td className="py-1.5 pr-3 font-mono font-bold" style={{ color: ACCENT }}>
                            {row.score}
                          </td>
                          <td
                            className="py-1.5 pr-3 font-mono"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                          >
                            {row.weight}
                          </td>
                          <td className="py-1.5 pr-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {row.summary?.slice(0, 80)}
                            {(row.summary?.length ?? 0) > 80 ? '…' : ''}
                          </td>
                          <td
                            className="py-1.5 font-mono"
                            style={{ color: 'rgba(255,255,255,0.2)' }}
                          >
                            {row.citation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {section.total && (
                    <p className="text-[10px] mt-2 font-bold" style={{ color: ACCENT }}>
                      Total: {section.total}
                    </p>
                  )}
                </div>
              )}
              {section.beneficialOwner && (
                <div className="space-y-1 text-[10px]">
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Beneficial Owner: </span>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {section.beneficialOwner}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Type: </span>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{section.ownerType}</span>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Confidence: </span>
                    <span style={{ color: ACCENT }}>{section.confidence}</span>
                  </div>
                  {section.unresolved && (
                    <p style={{ color: '#f59e0b' }}>
                      ⚠ Beneficial control unresolved — LLC shell risk
                    </p>
                  )}
                  {section.note && <p style={{ color: 'rgba(255,255,255,0.3)' }}>{section.note}</p>}
                </div>
              )}
              {section.ltvEstimate && (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    ['LTV', section.ltvEstimate],
                    ['Mortgage Age', section.mortgageAge],
                    ['Maturity', section.maturityDate],
                    ['Days to Maturity', section.daysToMaturity],
                    ['Refi Pressure', section.refiPressure?.toUpperCase()],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span style={{ color: 'rgba(255,255,255,0.35)' }}>{k}: </span>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              {section.clues && section.clues.length > 0 && (
                <div className="space-y-1 mt-2">
                  {section.clues.map((c: FinancingClue, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[10px]">
                      <SeverityDot severity={c.severity} />
                      <span style={{ color: 'rgba(255,255,255,0.65)' }}>
                        <strong>{c.clue}</strong>: {c.detail}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[9px] italic" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {memo.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WhyThisPropertyNow() {
  const [, params] = useRoute('/why-this-property/:propertyId');
  const propertyId = params?.propertyId ?? 'dp-001';
  const [activeTab, setActiveTab] = useState<TabId>('distress');

  const { data, isLoading, error, refetch, isFetching } = useStandardQuery({
    queryKey: ['why-this-property', propertyId],
    queryFn: () => fetchWhyNow(propertyId),
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });

  const prop = data?.property;
  const distress = data?.distressDecomposition;
  const ownership = data?.ownershipChain;
  const financing = data?.financingStress;
  const neighborhood = data?.neighborhoodMotion;
  const memo = data?.memoTemplate;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ color: 'white' }}>
      <div className="max-w-5xl mx-auto space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Link href="/distress-engine">
            <button
              className="flex items-center gap-2 text-xs transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)';
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Distress Engine
            </button>
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Why This Property Now
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span
              className="text-[9px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
            >
              Live NYC Open Data
            </span>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <RefreshCw
                className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')}
                style={{ color: 'rgba(255,255,255,0.4)' }}
              />
            </button>
          </div>
        </motion.div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: `${ACCENT}20`, borderTopColor: ACCENT }}
            />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Querying NYC open data sources…
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['HPD Violations', 'ACRIS Deeds', 'ECB Judgments', 'DOB Permits'].map((s) => (
                <DataBadge key={s} label={s} />
              ))}
            </div>
          </div>
        )}

        {error && !data && (
          <div
            className="text-center py-12 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color: '#ef4444' }} />
            <p className="text-sm font-semibold text-white mb-1">Unable to load property data</p>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Property ID "{propertyId}" not found or NYC data sources unavailable
            </p>
            <button
              onClick={() => refetch()}
              className="text-xs px-4 py-2 rounded-lg"
              style={{ background: ACCENT, color: 'white' }}
            >
              Retry
            </button>
          </div>
        )}

        {prop && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-5"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl" style={{ background: `${ACCENT}15` }}>
                  <Building2 className="w-6 h-6" style={{ color: ACCENT }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h1 className="text-xl font-bold text-white leading-tight">{prop.address}</h1>
                      <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {prop.borough} · {prop.zipCode ?? ''} · {prop.ownerName ?? 'Unknown Owner'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {distress && <ScoreTier tier={distress.tier} />}
                      {distress && (
                        <div className="text-right">
                          <div
                            className="text-3xl font-black font-mono"
                            style={{
                              color:
                                distress.tier === 'critical'
                                  ? '#ef4444'
                                  : distress.tier === 'high'
                                    ? '#f59e0b'
                                    : ACCENT,
                            }}
                          >
                            {distress.total}
                          </div>
                          <div
                            className="text-[9px] font-mono"
                            style={{ color: 'rgba(255,255,255,0.25)' }}
                          >
                            / 100
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {[
                      { label: 'Est. Value', value: formatCurrency(prop.estimatedValue) },
                      { label: 'Debt', value: formatCurrency(prop.debtAmount) },
                      {
                        label: 'Days in Distress',
                        value: prop.daysInDistress ? `${prop.daysInDistress}d` : '—',
                      },
                      {
                        label: 'Distress Type',
                        value: prop.distressType ? prop.distressType.replace(/-/g, ' ') : '—',
                      },
                    ].map((m) => (
                      <div key={m.label}>
                        <p
                          className="text-[9px] uppercase tracking-wider"
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                          {m.label}
                        </p>
                        <p
                          className="text-sm font-semibold capitalize mt-0.5"
                          style={{ color: 'rgba(255,255,255,0.75)' }}
                        >
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div
                className="flex gap-1 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}
              >
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap"
                      style={{
                        color: activeTab === tab.id ? ACCENT : 'rgba(255,255,255,0.35)',
                        borderBottom:
                          activeTab === tab.id ? `2px solid ${ACCENT}` : '2px solid transparent',
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === 'distress' && <DistressTab distress={distress} />}
                    {activeTab === 'ownership' && <OwnershipTab ownership={ownership} />}
                    {activeTab === 'financing' && <FinancingTab financing={financing} />}
                    {activeTab === 'neighborhood' && (
                      <NeighborhoodTab neighborhood={neighborhood} />
                    )}
                    {activeTab === 'memo' && <MemoTab memo={memo} propertyAddress={prop.address} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
