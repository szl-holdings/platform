import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Shield,
  TrendingUp,
  UserCog,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useActionDebt } from '@/data/api';
import {
  addressDebt,
  bootstrapInterventions,
  formatTimestamp,
  reassignDebt,
  useInterventions,
} from '@/data/interventions';
import type { DebtItem } from '@/data/seed';

const TYPE_LABELS: Record<DebtItem['type'], string> = {
  overdue: 'OVERDUE',
  blocked: 'BLOCKED',
  looping: 'LOOPING',
  escalated: 'ESCALATED',
};

const TYPE_COLORS: Record<DebtItem['type'], string> = {
  overdue: 'text-orange-400 bg-orange-500/8 border-orange-500/20',
  blocked: 'text-red-400 bg-red-500/8 border-red-500/20',
  looping: 'text-purple-400 bg-purple-500/8 border-purple-500/20',
  escalated: 'text-rose-400 bg-rose-500/8 border-rose-500/20',
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#f59e0b' : '#84cc16';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-amber-500/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold w-6 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function DebtCard({ item }: { item: DebtItem }) {
  const [expanded, setExpanded] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [newOwner, setNewOwner] = useState('');
  const [evidence, setEvidence] = useState('');
  const { debt } = useInterventions();
  const intervention = debt[item.id];
  const reassigned = Boolean(intervention?.reassignedTo);
  const addressed = Boolean(intervention?.addressedBy);

  const handleReassign = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!newOwner.trim()) return;
    reassignDebt({ id: item.id, title: item.title }, newOwner.trim());
    setNewOwner('');
    setReassignOpen(false);
  };

  const handleAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!evidence.trim()) return;
    addressDebt({ id: item.id, title: item.title }, evidence.trim());
    setEvidence('');
    setAddressOpen(false);
  };

  return (
    <div
      className={`cockpit-panel transition-all ${
        addressed
          ? 'border-emerald-500/25 opacity-80'
          : item.status === 'critical'
            ? 'border-red-500/20'
            : item.status === 'warn'
              ? 'border-amber-500/20'
              : ''
      }`}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-amber-500/3 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Score circle */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 font-mono text-sm font-bold ${
            item.score >= 80
              ? 'border-red-500/40 text-red-400 bg-red-500/8'
              : item.score >= 60
                ? 'border-orange-500/40 text-orange-400 bg-orange-500/8'
                : item.score >= 40
                  ? 'border-amber-500/40 text-amber-400 bg-amber-500/8'
                  : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/8'
          }`}
        >
          {item.score}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-amber-100">{item.title}</p>
              <p className="text-[10px] font-mono text-amber-400/50 mt-0.5">
                {item.program} · {item.team}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${TYPE_COLORS[item.type]}`}
              >
                {TYPE_LABELS[item.type]}
              </span>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-400/40" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-amber-400/40" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-amber-400/55">
              <Clock className="w-3 h-3" />
              <span className="font-mono">{item.ageDays}d old</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-amber-400/55">
              <AlertTriangle className="w-3 h-3" />
              <span>
                {item.escalations} escalation{item.escalations !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-[10px] text-amber-400/40">
              {reassigned ? (
                <>
                  <span className="line-through text-amber-400/30">{item.owner}</span>{' '}
                  <span className="text-sky-300">→ {intervention?.reassignedTo}</span>
                </>
              ) : (
                item.owner
              )}
            </span>
            {addressed && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                ADDRESSED
              </span>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-amber-500/8 space-y-3">
          <div className="pt-3">
            <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-2">
              Debt Score Breakdown
            </p>
            <ScoreBar score={item.score} />
          </div>
          <div>
            <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-2">Evidence</p>
            <ul className="space-y-1.5">
              {item.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-mono text-amber-500/40 w-3 shrink-0 mt-0.5">
                    {i + 1}.
                  </span>
                  <span className="text-xs text-amber-100/60">{e}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Intervention status */}
          {(reassigned || addressed) && (
            <div
              className={`rounded p-3 border ${addressed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-sky-500/5 border-sky-500/20'}`}
            >
              <p
                className={`text-[10px] font-mono uppercase mb-1 ${addressed ? 'text-emerald-400/60' : 'text-sky-400/60'}`}
              >
                {addressed ? 'Addressed' : 'Reassigned — In Progress'}
              </p>
              {reassigned && (
                <p className="text-[11px] text-amber-100/70">
                  <span className="text-amber-200">{intervention?.reassignedBy}</span> reassigned to{' '}
                  <span className="text-sky-300 font-semibold">{intervention?.reassignedTo}</span> ·{' '}
                  {formatTimestamp(intervention?.reassignedAt ?? '')}
                  {intervention?.reassignProofRef && (
                    <span className="ml-2 proof-badge text-[9px]">
                      <Shield className="w-2 h-2" />
                      {intervention.reassignProofRef}
                    </span>
                  )}
                </p>
              )}
              {addressed && (
                <p className="text-[11px] text-amber-100/70 mt-1">
                  <span className="text-amber-200">{intervention?.addressedBy}</span> flagged as
                  addressed · {formatTimestamp(intervention?.addressedAt ?? '')}
                  {intervention?.addressedProofRef && (
                    <span className="ml-2 proof-badge text-[9px]">
                      <Shield className="w-2 h-2" />
                      {intervention.addressedProofRef}
                    </span>
                  )}
                </p>
              )}
              {addressed && intervention?.addressedNote && (
                <p className="text-[11px] text-amber-100/55 mt-1.5 italic">
                  "{intervention.addressedNote}"
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          {!addressed && (
            <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {!reassignOpen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReassignOpen(true);
                  }}
                  data-testid={`button-open-reassign-${item.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-sky-500/40 bg-sky-500/10 text-sky-300 text-[11px] font-semibold hover:bg-sky-500/15 transition-colors"
                >
                  <UserCog className="w-3 h-3" />
                  {reassigned ? 'Reassign Again' : 'Reassign Owner'}
                </button>
              )}
              {!addressOpen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddressOpen(true);
                  }}
                  data-testid={`button-open-address-${item.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-500/15 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Flag as Addressed
                </button>
              )}
            </div>
          )}

          {reassignOpen && !addressed && (
            <div
              className="rounded border border-sky-500/20 bg-sky-500/4 p-3 space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] font-mono text-sky-400/60 uppercase">Reassign to</p>
              <input
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="Sarah Kim (VP BD)"
                data-testid={`input-reassign-owner-${item.id}`}
                className="w-full text-xs bg-[#0d1520] border border-amber-500/15 rounded px-2 py-1.5 text-amber-100 placeholder:text-amber-400/30 focus:outline-none focus:border-sky-500/40"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReassign}
                  disabled={!newOwner.trim()}
                  data-testid={`button-confirm-reassign-${item.id}`}
                  className="px-3 py-1 rounded bg-sky-500 text-sky-950 text-[11px] font-semibold hover:bg-sky-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm Reassign
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReassignOpen(false);
                    setNewOwner('');
                  }}
                  className="px-3 py-1 rounded text-[11px] text-amber-400/60 hover:text-amber-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {addressOpen && !addressed && (
            <div
              className="rounded border border-emerald-500/20 bg-emerald-500/4 p-3 space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] font-mono text-emerald-400/60 uppercase">
                Evidence of resolution
              </p>
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Proof ref, link, or description of action taken."
                rows={2}
                data-testid={`input-address-evidence-${item.id}`}
                className="w-full text-xs bg-[#0d1520] border border-amber-500/15 rounded px-2 py-1.5 text-amber-100 placeholder:text-amber-400/30 focus:outline-none focus:border-emerald-500/40"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddress}
                  disabled={!evidence.trim()}
                  data-testid={`button-confirm-address-${item.id}`}
                  className="px-3 py-1 rounded bg-emerald-500 text-emerald-950 text-[11px] font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm Addressed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddressOpen(false);
                    setEvidence('');
                  }}
                  className="px-3 py-1 rounded text-[11px] text-amber-400/60 hover:text-amber-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-amber-500/8">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-400/40 font-mono">
                Owner: {reassigned ? intervention?.reassignedTo : item.owner}
              </span>
            </div>
            <span className="proof-badge">
              <Shield className="w-2.5 h-2.5" />
              {item.proofRef}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  fill: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0d1520] border border-amber-500/20 rounded px-3 py-2 text-xs shadow-xl">
        <p className="text-amber-400/60 font-mono mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="font-mono" style={{ color: p.fill }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ActionDebtPage() {
  useEffect(() => {
    void bootstrapInterventions();
  }, []);

  const [typeFilter, setTypeFilter] = useState<'all' | DebtItem['type']>('all');
  const [sortBy, setSortBy] = useState<'score' | 'age'>('score');
  const { data, isLoading, error } = useActionDebt();

  if (isLoading) {
    return <div className="p-6 text-xs font-mono text-amber-400/50">Loading action debt…</div>;
  }
  if (error || !data) {
    return (
      <div className="p-6 text-xs font-mono text-red-400/70">Failed to load action debt data.</div>
    );
  }
  const debtItems = data.items;
  const debtScoreHistory = data.history;
  const filtered =
    typeFilter === 'all' ? debtItems : debtItems.filter((d) => d.type === typeFilter);
  const sorted = [...filtered].sort((a, b) =>
    sortBy === 'score' ? b.score - a.score : b.ageDays - a.ageDays,
  );

  const totalScore = Math.round(debtItems.reduce((a, d) => a + d.score, 0) / debtItems.length);
  const criticalCount = debtItems.filter((d) => d.status === 'critical').length;
  const loopingCount = debtItems.filter((d) => d.type === 'looping').length;
  const totalEscalations = debtItems.reduce((a, d) => a + d.escalations, 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-amber-400" />
          <h1 className="text-xl font-display font-bold text-amber-50">Action Debt Index</h1>
        </div>
        <p className="text-sm text-amber-100/50">
          Scored backlog of overdue, blocked, looping, and repeatedly-escalated work.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Index Score', value: totalScore, sub: 'avg item score', color: 'amber' },
          { label: 'Critical Items', value: criticalCount, sub: 'score ≥ 80', color: 'red' },
          { label: 'Looping Items', value: loopingCount, sub: 'circular dependency', color: 'red' },
          {
            label: 'Total Escalations',
            value: totalEscalations,
            sub: 'all items combined',
            color: 'amber',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="cockpit-panel p-4">
            <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-1">{kpi.label}</p>
            <p
              className={`text-2xl font-mono font-bold ${kpi.color === 'red' ? 'text-red-400' : 'text-amber-300'}`}
            >
              {kpi.value}
            </p>
            <p className="text-[10px] text-amber-400/40">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="cockpit-panel p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-amber-100">Debt Accumulation — 7 Weeks</p>
            <p className="text-[10px] text-amber-400/45">
              Critical + High + Medium item counts over time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="proof-badge">
              <Shield className="w-2.5 h-2.5" />
              ALLOY-DEBT
            </span>
            <span className="text-[10px] font-mono text-red-400/70 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +54% in 7w
            </span>
          </div>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={debtScoreHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: 'rgba(245,158,11,0.4)', fontFamily: 'JetBrains Mono' }}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'rgba(245,158,11,0.4)', fontFamily: 'JetBrains Mono' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="critical" name="Critical" fill="#ef4444" opacity={0.85} stackId="a" />
              <Bar dataKey="high" name="High" fill="#f97316" opacity={0.85} stackId="a" />
              <Bar
                dataKey="medium"
                name="Medium"
                fill="#f59e0b"
                opacity={0.85}
                stackId="a"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters + list */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-xs font-semibold text-amber-100">{sorted.length} Items</p>
          <div className="flex items-center gap-3">
            {/* Type filter */}
            <div className="flex items-center gap-1">
              {(['all', 'overdue', 'blocked', 'looping', 'escalated'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
                    typeFilter === f
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                      : 'text-amber-400/40 hover:text-amber-300 border border-transparent'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            {/* Sort */}
            <div className="flex items-center gap-1 border-l border-amber-500/15 pl-3">
              <span className="text-[9px] font-mono text-amber-400/40">SORT:</span>
              {(['score', 'age'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
                    sortBy === s
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                      : 'text-amber-400/40 hover:text-amber-300'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {sorted.map((item) => (
            <DebtCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
