import { ClassificationBadge } from '@imp/components/classification-badge';
import {
  getAquilaColor,
  getAquilaLabel,
  getClassificationColor,
  getThreatColor,
  IMPERIUM_DATA,
  type Legion,
  type ThreatLevel,
} from '@imp/lib/imperium-data';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Crown,
  Database,
  DollarSign,
  Globe2,
  Lock,
  RefreshCw,
  Server,
  Shield,
  Wifi,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useOpsBadgeCounts } from '../../hooks/use-ops-badge-counts';

const THREAT_DISPLAY: Record<string, string> = {
  CLEAR: 'CLEAR',
  ELEVATED: 'ELEVATED',
  ACTIVE: 'ACTIVE',
  CRITICAL: 'CRITICAL',
};

function AquilaGauge({ score }: { score: number }) {
  const color = getAquilaColor(score);
  const label = getAquilaLabel(score);
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="4"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 4px ${color}60)`,
              transition: 'stroke-dashoffset 1s ease',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-sm font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="font-mono text-[9px] tracking-widest" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function LegionCard({ legion }: { legion: Legion }) {
  const totalSentinels = legion.cohorts.reduce(
    (a, c) => a + c.centuries.reduce((b, ct) => b + ct.sentinels.length, 0),
    0,
  );
  const threatColor = getThreatColor(legion.threatLevel);

  return (
    <Link href="/infrastructure/imperium-map">
      <a className="block imperial-card rounded-lg p-4 hover:border-gold/40 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-display text-xs tracking-[0.15em] gold-text font-semibold">
              {legion.name}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{legion.label}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-gold transition-colors mt-0.5" />
        </div>
        <div className="flex items-center justify-between">
          <AquilaGauge score={legion.aquilaScore} />
          <div className="flex-1 pl-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Groups</span>
              <span className="font-mono text-slate-300">{legion.cohorts.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Resources</span>
              <span className="font-mono text-slate-300">{totalSentinels}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Threat</span>
              <span className="font-mono text-xs tracking-wider" style={{ color: threatColor }}>
                {THREAT_DISPLAY[legion.threatLevel] ?? legion.threatLevel}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Monthly</span>
              <span className="font-mono text-slate-300">
                ${legion.costPerMonth.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1">
          {legion.cohorts.map((c) => (
            <ClassificationBadge key={c.id} classification={c.classification} size="xs" />
          ))}
        </div>
      </a>
    </Link>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  href?: string;
}) {
  const content = (
    <div className="imperial-card rounded-lg p-4 hover:border-gold/30 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: color || '#c9a227' }} />
        <span className="text-xs text-slate-500 tracking-wider uppercase">{label}</span>
      </div>
      <div className="font-mono text-xl font-bold" style={{ color: color || '#c9a227' }}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
  if (href)
    return (
      <Link href={href}>
        <a className="block cursor-pointer">{content}</a>
      </Link>
    );
  return content;
}

interface LiveStatus {
  aquilaScore: number;
  threatLevel: ThreatLevel;
  uptime: number;
  activeAgents: number;
  p95LatencyMs: number;
  totalResources: number;
  generatedAt: string;
}

export default function LegatusConsole() {
  const base = IMPERIUM_DATA;
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const badgeCounts = useOpsBadgeCounts();

  useEffect(() => {
    const fetchStatus = () => {
      fetch('/api/infrastructure/status', { credentials: 'include' })
        .then((r) => (r.ok ? (r.json() as Promise<LiveStatus>) : null))
        .then((data) => {
          if (data) setLiveStatus(data);
        })
        .catch(() => {});
    };
    fetchStatus();
    const t = setInterval(fetchStatus, 30000);
    return () => clearInterval(t);
  }, []);

  const imperium = {
    ...base,
    aquilaScore: liveStatus?.aquilaScore ?? base.aquilaScore,
    threatLevel: liveStatus?.threatLevel ?? base.threatLevel,
    totalResources: liveStatus?.totalResources ?? base.totalResources,
  };

  const classEntries = Object.entries(imperium.classificationSummary) as [
    keyof typeof imperium.classificationSummary,
    number,
  ][];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Crown className="w-5 h-5" style={{ color: '#c9a227' }} />
            <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
              Executive Console
            </h1>
          </div>
          <p className="text-xs text-slate-500 tracking-wide ml-8">
            Platform at a glance — {imperium.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <RefreshCw
              className="w-3 h-3 text-slate-600 animate-spin"
              style={{ animationDuration: '3s' }}
            />
            <span className="text-[10px] font-mono text-slate-600 tracking-widest">LIVE</span>
          </div>
          {liveStatus && (
            <span className="text-[9px] font-mono text-slate-700 tracking-wider">
              {new Date(liveStatus.generatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Threat Banner */}
      <div
        className="rounded-lg p-3 flex items-center justify-between border"
        style={{
          background: `rgba(${imperium.threatLevel === 'CLEAR' ? '74,222,128' : imperium.threatLevel === 'ELEVATED' ? '250,204,21' : imperium.threatLevel === 'ACTIVE' ? '251,146,60' : '239,68,68'},0.06)`,
          borderColor: `rgba(${imperium.threatLevel === 'CLEAR' ? '74,222,128' : imperium.threatLevel === 'ELEVATED' ? '250,204,21' : imperium.threatLevel === 'ACTIVE' ? '251,146,60' : '239,68,68'},0.3)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: getThreatColor(imperium.threatLevel) }}
          />
          <div>
            <span
              className="font-display text-sm tracking-[0.2em] font-bold mr-2"
              style={{ color: getThreatColor(imperium.threatLevel) }}
            >
              THREAT: {THREAT_DISPLAY[imperium.threatLevel] ?? imperium.threatLevel}
            </span>
            <span className="text-xs text-slate-400">
              {imperium.threatLevel === 'CLEAR' &&
                'All clear — no active threats. Standard monitoring in effect.'}
              {imperium.threatLevel === 'ELEVATED' &&
                'Elevated — enhanced monitoring active. WAF rules tightened.'}
              {imperium.threatLevel === 'ACTIVE' &&
                'Active threat detected. Emergency hardening protocols engaged.'}
              {imperium.threatLevel === 'CRITICAL' &&
                'Critical breach. Emergency protocols active. Manual isolation required.'}
            </span>
          </div>
        </div>
        <Link href="/infrastructure/praetorian">
          <a className="text-xs font-mono tracking-wider text-slate-400 hover:text-gold transition-colors flex items-center gap-1">
            SECURITY CENTER <ChevronRight className="w-3 h-3" />
          </a>
        </Link>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Globe2}
          label="Health Score"
          value={`${imperium.aquilaScore}/100`}
          sub={getAquilaLabel(imperium.aquilaScore)}
          color={getAquilaColor(imperium.aquilaScore)}
        />
        <StatCard
          icon={Server}
          label="Total Resources"
          value={imperium.totalResources}
          sub={`${imperium.legions.length} Regions active`}
        />
        <StatCard
          icon={DollarSign}
          label="Monthly Cost"
          value={`$${imperium.totalCostPerMonth.toLocaleString()}`}
          sub="All regions combined"
          color="#4ade80"
        />
        <StatCard
          icon={Shield}
          label="Sovereign Resources"
          value={imperium.classificationSummary.SOVEREIGN}
          sub="Security-protected"
          href="/infrastructure/praetorian"
        />
      </div>

      {/* Classification breakdown */}
      <div className="imperial-card rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4" style={{ color: '#c9a227' }} />
          <span className="font-display text-xs tracking-[0.15em] gold-text uppercase">
            Classification Posture
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {classEntries.map(([cls, count]) => (
            <div
              key={cls}
              className="rounded p-3 text-center border"
              style={{
                borderColor: `${getClassificationColor(cls)}30`,
                background: `${getClassificationColor(cls)}08`,
              }}
            >
              <div
                className="font-mono text-2xl font-bold mb-1"
                style={{ color: getClassificationColor(cls) }}
              >
                {count}
              </div>
              <ClassificationBadge classification={cls} size="xs" />
              <div className="text-[10px] text-slate-500 mt-1">
                {Math.round((count / imperium.totalResources) * 100)}% of estate
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 h-2 rounded-full overflow-hidden bg-white/5 flex">
          {classEntries.map(([cls, count]) => (
            <div
              key={cls}
              className="h-full transition-all duration-1000"
              style={{
                width: `${(count / imperium.totalResources) * 100}%`,
                backgroundColor: getClassificationColor(cls),
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>

      {/* Legions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4" style={{ color: '#c9a227' }} />
          <span className="font-display text-xs tracking-[0.15em] gold-text uppercase">
            Active Regions
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {imperium.legions.map((legion) => (
            <LegionCard key={legion.id} legion={legion} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          {
            label: 'RESOURCE MAP',
            sub: 'Full hierarchy view',
            href: '/infrastructure/imperium-map',
            icon: Globe2,
          },
          {
            label: 'GOVERNANCE BOARD',
            sub:
              badgeCounts.governancePending != null
                ? `${badgeCounts.governancePending} approval${badgeCounts.governancePending === 1 ? '' : 's'} pending`
                : 'Governance approvals',
            href: '/infrastructure/senate',
            icon: AlertTriangle,
          },
          {
            label: 'NETWORK TOPOLOGY',
            sub: 'Service mesh routes',
            href: '/infrastructure/supply-lines',
            icon: Wifi,
          },
          {
            label: 'INTELLIGENCE',
            sub: 'Signals briefing',
            href: '/infrastructure/intelligence',
            icon: Database,
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <a className="imperial-card rounded-lg p-3 hover:border-gold/40 transition-all cursor-pointer flex items-start gap-2.5">
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#c9a227' }} />
                <div>
                  <div className="font-display text-[10px] tracking-[0.12em] gold-text font-semibold leading-tight">
                    {action.label}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    {action.sub}
                  </div>
                </div>
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
