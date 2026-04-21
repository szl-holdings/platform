// @ts-nocheck

import { api, type CommandReadinessItem } from '@lyte/lib/api';
import { cn } from '@lyte/lib/utils';
import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Lock,
  RefreshCw,
  Shield,
  Users,
} from 'lucide-react';
import { useState } from 'react';

const itemTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  launch_gate: { label: 'Launch Gate', icon: Shield, color: 'text-cyan-400' },
  blocker: { label: 'Blocker', icon: Lock, color: 'text-[#c45a4a]' },
  dependency: { label: 'Dependency', icon: Activity, color: 'text-[#8b7ac8]' },
  milestone: { label: 'Milestone', icon: Cpu, color: 'text-[#6b8f71]' },
  owner_check: { label: 'Owner Check', icon: Users, color: 'text-[#d4a054]' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  complete: {
    label: 'Complete',
    color: 'text-[#6b8f71]',
    bg: 'bg-[#6b8f71]/10',
    border: 'border-[#6b8f71]/20',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  not_started: {
    label: 'Not Started',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
  blocked: {
    label: 'Blocked',
    color: 'text-[#c45a4a]',
    bg: 'bg-[#c45a4a]/10',
    border: 'border-[#c45a4a]/20',
  },
  waived: {
    label: 'Waived',
    color: 'text-slate-500',
    bg: 'bg-slate-500/5',
    border: 'border-slate-500/15',
  },
};

function computeScore(items: CommandReadinessItem[]): number {
  if (items.length === 0) return 0;
  const scorable = items.filter((i) => i.status !== 'waived');
  if (scorable.length === 0) return 100;
  const complete = scorable.filter((i) => i.status === 'complete').length;
  return Math.round((complete / scorable.length) * 100);
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#6b8f71' : score >= 60 ? '#d4a054' : '#c45a4a';
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width={100} height={100} className="rotate-[-90deg]">
      <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
      <circle
        cx={50}
        cy={50}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text
        x={50}
        y={56}
        textAnchor="middle"
        fill={color}
        fontSize={18}
        fontWeight="bold"
        className="rotate-90 origin-[50px_50px] font-mono"
        style={{ rotate: '90deg', transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        {score}
      </text>
    </svg>
  );
}

function ReadinessItemCard({ item, onUpdate }: { item: CommandReadinessItem; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const typeConf = itemTypeConfig[item.itemType] ?? itemTypeConfig.launch_gate;
  const statConf = statusConfig[item.status] ?? statusConfig.not_started;
  const TypeIcon = typeConf.icon;

  const update = async (status: string) => {
    setLoading(status);
    try {
      await api.readiness.update(item.id, { status });
      onUpdate();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border transition-all',
        item.status === 'blocked' ? 'border-[#c45a4a]/20' : 'border-white/5',
      )}
    >
      <button
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <TypeIcon className={cn('w-4 h-4 mt-0.5 shrink-0', typeConf.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium text-white/90">{item.title}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded border',
                statConf.color,
                statConf.bg,
                statConf.border,
              )}
            >
              {statConf.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span>{typeConf.label}</span>
            {item.owner && <span>· {item.owner}</span>}
            {item.readinessScore != null && (
              <span>
                · Score: <span className="text-slate-400">{item.readinessScore}%</span>
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-600 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          {item.description && (
            <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            {item.status !== 'complete' && item.status !== 'waived' && (
              <button
                disabled={!!loading}
                onClick={() => update('complete')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#6b8f71]/10 border border-[#6b8f71]/20 text-[#6b8f71] hover:bg-[#6b8f71]/20 transition-all disabled:opacity-50"
              >
                {loading === 'complete' ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
                Mark Complete
              </button>
            )}
            {item.status !== 'in_progress' &&
              item.status !== 'complete' &&
              item.status !== 'waived' && (
                <button
                  disabled={!!loading}
                  onClick={() => update('in_progress')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                >
                  {loading === 'in_progress' ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  Start
                </button>
              )}
            {item.status !== 'not_started' && item.status !== 'waived' && (
              <button
                disabled={!!loading}
                onClick={() => update('not_started')}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium border border-white/10 text-slate-500 hover:text-slate-400 transition-all disabled:opacity-50"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type CategoryFilter = 'all' | string;

export default function ReadinessPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
  } = useStandardQuery({
    queryKey: ['lyte-readiness'],
    queryFn: () => api.readiness.list(),
    refetchInterval: 60_000,
  });

  const score = computeScore(items);
  const completeCount = items.filter((i) => i.status === 'complete').length;
  const inProgressCount = items.filter((i) => i.status === 'in_progress').length;
  const blockedCount = items.filter((i) => i.status === 'blocked').length;

  const itemTypes = [...new Set(items.map((i) => i.itemType))];
  const filtered = items.filter((i) => categoryFilter === 'all' || i.itemType === categoryFilter);

  const groupedByType = itemTypes.reduce<Record<string, CommandReadinessItem[]>>((acc, t) => {
    acc[t] = (categoryFilter === 'all' ? items : filtered).filter((i) => i.itemType === t);
    return acc;
  }, {});

  const onUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['lyte-readiness'] });
  };

  return (
    <div className="max-w-[900px] space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">
            Command Readiness
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Operational readiness scoring across all business dimensions
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-all"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      {isError && (
        <div className="p-4 rounded-xl border border-[#c45a4a]/20 bg-[#c45a4a]/5 text-sm text-[#c45a4a]">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Failed to load readiness items —{' '}
          <button onClick={() => refetch()} className="underline">
            retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 rounded-xl border border-white/5 bg-white/[0.02] p-6 flex flex-col items-center justify-center">
          <div className="relative mb-2">
            <ScoreRing score={score} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-2xl font-display font-bold"
                style={{ color: score >= 80 ? '#6b8f71' : score >= 60 ? '#d4a054' : '#c45a4a' }}
              >
                {score}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 text-center">Readiness Score</div>
        </div>

        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Items', value: items.length, color: 'text-white' },
            { label: 'Complete', value: completeCount, color: 'text-[#6b8f71]' },
            { label: 'In Progress', value: inProgressCount, color: 'text-cyan-400' },
            { label: 'Blocked', value: blockedCount, color: 'text-[#c45a4a]' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-4 border border-white/5 bg-white/[0.02]">
              <div className="text-[11px] text-slate-400 mb-1">{stat.label}</div>
              <div className={cn('font-display font-bold text-xl', stat.color)}>
                {isLoading ? '—' : stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] text-slate-500 mr-2">Type:</span>
        {['all', ...itemTypes].map((t) => (
          <button
            key={t}
            onClick={() => setCategoryFilter(t)}
            className={cn(
              'text-[10px] px-2.5 py-1.5 rounded-lg border transition-all capitalize',
              categoryFilter === t
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'border-white/8 text-slate-500 hover:text-white hover:border-white/15',
            )}
          >
            {t === 'all' ? 'All' : (itemTypeConfig[t]?.label ?? t)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : categoryFilter === 'all' ? (
        <div className="space-y-6">
          {Object.entries(groupedByType)
            .filter(([, its]) => its.length > 0)
            .map(([t, typeItems]) => {
              const tConf = itemTypeConfig[t] ?? itemTypeConfig.launch_gate;
              const TIcon = tConf.icon;
              const tScore = computeScore(typeItems);
              return (
                <div key={t}>
                  <div className="flex items-center gap-2 mb-3">
                    <TIcon className={cn('w-3.5 h-3.5', tConf.color)} />
                    <h2 className={cn('text-sm font-semibold', tConf.color)}>{tConf.label}</h2>
                    <span className="text-[10px] text-slate-600">
                      {typeItems.length} items · {tScore}% complete
                    </span>
                  </div>
                  <div className="space-y-2">
                    {typeItems.map((item) => (
                      <ReadinessItemCard key={item.id} item={item} onUpdate={onUpdate} />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <ReadinessItemCard key={item.id} item={item} onUpdate={onUpdate} />
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">
              No items in this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
