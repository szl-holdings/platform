import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  Radio,
  Shield,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  TIER_CONFIG,
  type SanctionsExposureScore,
  type SanctionsRule,
} from '@/data/sanctions-network-data';

const SEVERITY_CONFIG = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: '#ef4444' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: '#f97316' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: '#f59e0b' },
  low: { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', dot: '#4d8fcc' },
};

const LIST_LABEL: Record<string, string> = {
  OFAC_SDN: 'OFAC SDN',
  EU_CONSOLIDATED: 'EU Consolidated',
  UK_OFSI: 'UK OFSI',
  UN_SECURITY_COUNCIL: 'UN Security Council',
  INTERNAL: 'Internal Rules Engine',
};

function ScoreArc({ score, tier }: { score: number; tier: string }) {
  const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.clear!;
  const r = 52;
  const cx = 64;
  const cy = 64;
  const startAngle = -220;
  const endAngle = 40;
  const totalArc = endAngle - startAngle;
  const filledArc = (score / 100) * totalArc;

  function polarToXY(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(startDeg: number, endDeg: number, rad: number) {
    const s = polarToXY(startDeg, rad);
    const e = polarToXY(endDeg, rad);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${rad} ${rad} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  return (
    <div className="flex items-center justify-center">
      <svg width={128} height={100} viewBox="0 0 128 100">
        <path
          d={arcPath(startAngle, endAngle, r)}
          fill="none"
          stroke="#1e293b"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {score > 0 && (
          <path
            d={arcPath(startAngle, startAngle + filledArc, r)}
            fill="none"
            stroke={tierCfg.dot}
            strokeWidth={10}
            strokeLinecap="round"
          />
        )}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={22} fill={tierCfg.dot} fontWeight="bold" fontFamily="monospace">
          {score}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" fontSize={9.5} fill="#94a3b8">
          / 100
        </text>
        <text x={cx} y={cy + 28} textAnchor="middle" fontSize={9} fill={tierCfg.dot}>
          {tierCfg.label}
        </text>
      </svg>
    </div>
  );
}

function RuleRow({ rule }: { rule: SanctionsRule }) {
  const sevCfg = SEVERITY_CONFIG[rule.severity];
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors',
        rule.triggered
          ? `${sevCfg.bg} ${sevCfg.border}`
          : 'bg-slate-800/30 border-slate-700/30 opacity-50',
      )}
    >
      <div className="shrink-0 mt-0.5">
        {rule.triggered ? (
          <AlertTriangle className={cn('w-3.5 h-3.5', sevCfg.color)} />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'font-mono text-[10px] px-1.5 py-0.5 rounded border',
              rule.triggered
                ? `${sevCfg.color} ${sevCfg.bg} ${sevCfg.border}`
                : 'text-slate-500 bg-slate-700/20 border-slate-700/30',
            )}
          >
            {rule.ruleCode}
          </span>
          <span className={cn('text-[10px]', rule.triggered ? 'text-slate-400' : 'text-slate-600')}>
            {LIST_LABEL[rule.list] ?? rule.list}
          </span>
          {rule.triggered && (
            <span className={cn('text-[10px] font-semibold ml-auto shrink-0', sevCfg.color)}>
              +{rule.score}
            </span>
          )}
        </div>
        <p className={cn('text-xs mt-0.5', rule.triggered ? 'text-slate-300' : 'text-slate-600')}>
          {rule.description}
        </p>
        {rule.triggered && rule.evidence && (
          <p className="text-[10px] text-slate-500 mt-0.5 italic">{rule.evidence}</p>
        )}
      </div>
    </div>
  );
}

interface Props {
  data: SanctionsExposureScore;
  className?: string;
}

export function SanctionsScorePanel({ data, className }: Props) {
  const [showAll, setShowAll] = useState(false);
  const tierCfg = TIER_CONFIG[data.tier] ?? TIER_CONFIG.clear!;
  const triggeredRules = data.rules.filter((r) => r.triggered);
  const clearRules = data.rules.filter((r) => !r.triggered);
  const displayRules = showAll ? data.rules : [...triggeredRules, ...clearRules.slice(0, 2)];
  const totalScore = triggeredRules.reduce((s, r) => s + r.score, 0);

  const computedAgo = (() => {
    const diff = Date.now() - new Date(data.computedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div className={cn('space-y-4', className)} data-testid="sanctions-score-panel" data-score={data.score} data-tier={data.tier}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center gap-1">
          <ScoreArc score={data.score} tier={data.tier} />
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold',
              tierCfg.color,
              tierCfg.bg,
              tierCfg.border,
            )}
          >
            {data.tier === 'critical' || data.tier === 'high' ? (
              <ShieldAlert className="w-3 h-3" />
            ) : (
              <Shield className="w-3 h-3" />
            )}
            {tierCfg.label}
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Intelligence Summary
            </span>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium',
                  data.dataSource === 'live'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                )}
              >
                {data.dataSource === 'live' ? (
                  <Radio className="w-2.5 h-2.5" />
                ) : (
                  <Database className="w-2.5 h-2.5" />
                )}
                {data.dataSource === 'live' ? 'Live Data' : 'Simulated Data'}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="w-2.5 h-2.5" />
                {computedAgo}
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{data.summary}</p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-slate-700/30 rounded-lg p-2 text-center">
              <div className="text-lg font-bold font-mono text-slate-100">{triggeredRules.length}</div>
              <div className="text-[10px] text-slate-500">Rules Triggered</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-2 text-center">
              <div className={cn('text-lg font-bold font-mono', tierCfg.color)}>{totalScore}</div>
              <div className="text-[10px] text-slate-500">Raw Score</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-2 text-center">
              <div className="text-lg font-bold font-mono text-slate-100">
                {data.networkNodes.filter((n) => n.sanctioned).length}
              </div>
              <div className="text-[10px] text-slate-500">Sanctioned Entities</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Rules Engine
            </span>
          </div>
          <div className="flex items-center gap-2">
            {triggeredRules.length > 0 && (
              <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                {triggeredRules.length} hit{triggeredRules.length !== 1 ? 's' : ''}
              </Badge>
            )}
            <span className="text-[10px] text-slate-500">{data.rules.length} rules total</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {displayRules.map((rule) => (
            <RuleRow key={rule.id} rule={rule} />
          ))}
        </div>
        {data.rules.length > displayRules.length && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-2 text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            <Eye className="w-3 h-3" />
            Show all {data.rules.length} rules
          </button>
        )}
        {showAll && displayRules.length === data.rules.length && (
          <button
            onClick={() => setShowAll(false)}
            className="mt-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            Collapse
          </button>
        )}
      </div>

      <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg px-4 py-2.5 flex items-center gap-3 text-[11px] text-slate-500">
        <Zap className="w-3.5 h-3.5 text-sky-500/60 shrink-0" />
        <span>
          Score computed{' '}
          <span className="text-slate-400">{computedAgo}</span> from{' '}
          <span className={data.dataSource === 'live' ? 'text-emerald-400' : 'text-amber-400'}>
            {data.dataSource === 'live' ? 'live sanctions feeds' : 'simulated / cached data'}
          </span>
          . Scores refresh every 15 minutes against OFAC SDN, EU Consolidated, UK OFSI, and UN
          Security Council lists plus internal fleet risk rules.
        </span>
      </div>
    </div>
  );
}
