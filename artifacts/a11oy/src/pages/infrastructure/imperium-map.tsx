import { ClassificationBadge } from '../../components/infrastructure/classification-badge';
import {
  type Century,
  type Cohort,
  getAquilaColor,
  getAquilaLabel,
  getThreatColor,
  IMPERIUM_DATA,
  type Legion,
  type Sentinel,
} from '../../lib/infrastructure/imperium-data';
import { cn } from '../../lib/infrastructure/utils';
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  Globe2,
  Lock,
  Network,
  Radio,
  Server,
  Shield,
} from 'lucide-react';
import React, { useState } from 'react';

const CENTURY_ICONS: Record<string, React.ElementType> = {
  'container-app': Cpu,
  'static-web-app': Globe2,
  database: Database,
  cache: Activity,
  storage: Server,
  messaging: Radio,
  keyvault: Lock,
  network: Network,
  monitoring: Shield,
};

function AquilaPip({ score, size = 'sm' }: { score: number; size?: 'xs' | 'sm' }) {
  const color = getAquilaColor(score);
  const dim = size === 'xs' ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]';
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-mono font-bold flex-shrink-0',
        dim,
      )}
      style={{ background: `${color}18`, border: `1px solid ${color}50`, color }}
    >
      {score}
    </div>
  );
}

function SentinelRow({ sentinel, depth }: { sentinel: Sentinel; depth: number }) {
  const statusColor =
    sentinel.status === 'ACTIVE'
      ? '#4ade80'
      : sentinel.status === 'DEGRADED'
        ? '#fb923c'
        : '#ef4444';
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/3 transition-all group animate-data-stream"
      style={{ paddingLeft: `${depth * 12 + 12}px` }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: statusColor }}
      />
      <span className="font-mono text-[10px] text-slate-400 group-hover:text-slate-300 flex-1 truncate">
        {sentinel.name}
      </span>
      <span className="text-[10px] text-slate-600 hidden sm:block truncate max-w-[120px]">
        {sentinel.type}
      </span>
      <AquilaPip score={sentinel.aquilaScore} size="xs" />
      <ClassificationBadge classification={sentinel.classification} size="xs" />
    </div>
  );
}

function CenturyBlock({ century, depth }: { century: Century; depth: number }) {
  const [open, setOpen] = useState(false);
  const Icon = CENTURY_ICONS[century.type] || Server;
  const color = getAquilaColor(century.aquilaScore);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-white/3 transition-all text-left"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {open ? (
          <ChevronDown className="w-3 h-3 text-slate-600 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
        )}
        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
        <div className="flex-1 min-w-0">
          <span className="font-display text-[10px] tracking-[0.1em] text-slate-300 font-semibold truncate block">
            {century.name}
          </span>
          <span className="text-[9px] text-slate-600">
            {century.label} · {century.sentinels.length} resources
          </span>
        </div>
        <AquilaPip score={century.aquilaScore} size="xs" />
        <ClassificationBadge classification={century.classification} size="xs" />
      </button>
      {open && (
        <div>
          {century.sentinels.map((s) => (
            <SentinelRow key={s.id} sentinel={s} depth={depth + 2} />
          ))}
        </div>
      )}
    </div>
  );
}

function CohortBlock({ cohort, depth }: { cohort: Cohort; depth: number }) {
  const [open, setOpen] = useState(true);
  const color = getAquilaColor(cohort.aquilaScore);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded hover:bg-white/5 transition-all text-left border border-transparent hover:border-white/5"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div
            className="font-display text-[11px] tracking-[0.12em] font-bold truncate"
            style={{ color }}
          >
            {cohort.name}
          </div>
          <div className="text-[10px] text-slate-500">
            {cohort.label} · ${cohort.costPerMonth}/mo
          </div>
        </div>
        <AquilaPip score={cohort.aquilaScore} />
        <ClassificationBadge classification={cohort.classification} size="xs" />
      </button>
      {open && (
        <div className="ml-2 border-l border-white/5 pl-1 mt-1 space-y-0.5">
          {cohort.centuries.map((ct) => (
            <CenturyBlock key={ct.id} century={ct} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function LegionBlock({ legion }: { legion: Legion }) {
  const [open, setOpen] = useState(true);
  const color = getAquilaColor(legion.aquilaScore);
  const threatColor = getThreatColor(legion.threatLevel);

  return (
    <div className="imperial-card rounded-lg mb-4 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-all text-left border-b border-gold/10"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
        )}
        <div className="flex-1">
          <div className="font-display text-sm tracking-[0.15em] font-bold" style={{ color }}>
            {legion.name}
          </div>
          <div className="text-[11px] text-slate-400">
            {legion.label} · Azure {legion.region}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="px-2 py-0.5 rounded font-mono text-[10px] tracking-widest border"
            style={{
              color: threatColor,
              borderColor: `${threatColor}40`,
              background: `${threatColor}10`,
            }}
          >
            {legion.threatLevel}
          </div>
          <AquilaPip score={legion.aquilaScore} />
        </div>
      </button>
      {open && (
        <div className="p-2">
          <div className="grid grid-cols-3 gap-3 mb-3 px-2 py-2">
            <div className="text-center">
              <div className="font-mono text-lg font-bold" style={{ color }}>
                {legion.aquilaScore}
              </div>
              <div className="text-[10px] text-slate-500">Health Score</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-slate-300">
                {legion.cohorts.length}
              </div>
              <div className="text-[10px] text-slate-500">Groups</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-green-400">
                ${legion.costPerMonth.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">Monthly</div>
            </div>
          </div>
          <div className="space-y-1">
            {legion.cohorts.map((cohort) => (
              <CohortBlock key={cohort.id} cohort={cohort} depth={0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImperiumMap() {
  const imperium = IMPERIUM_DATA;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Globe2 className="w-5 h-5" style={{ color: '#c9a227' }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Resource Map
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Full platform hierarchy — Regions → Groups → Clusters → Resources
        </p>
      </div>

      {/* Hierarchy legend */}
      <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 font-mono">
        {[
          { label: 'PLATFORM', desc: 'Entire cloud estate' },
          { label: 'REGION', desc: 'Azure region' },
          { label: 'GROUP', desc: 'Resource group / service cluster' },
          { label: 'CLUSTER', desc: 'Service type group' },
          { label: 'RESOURCE', desc: 'Individual resource instance' },
        ].map((tier, i) => (
          <React.Fragment key={tier.label}>
            {i > 0 && <ChevronRight className="w-3 h-3 text-slate-700 self-center" />}
            <div>
              <span className="gold-text font-semibold">{tier.label}</span>
              <span className="text-slate-600 ml-1">({tier.desc})</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Imperium root */}
      <div
        className="rounded-lg p-4 border"
        style={{ background: 'rgba(201,162,39,0.04)', borderColor: 'rgba(201,162,39,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <Globe2 className="w-6 h-6" style={{ color: '#c9a227' }} />
          <div className="flex-1">
            <div className="font-display text-base tracking-[0.2em] gold-text font-bold">
              {imperium.name}
            </div>
            <div className="text-xs text-slate-400">
              {imperium.totalResources} total resources · Aquila {imperium.aquilaScore} · $
              {imperium.totalCostPerMonth.toLocaleString()}/mo
            </div>
          </div>
          <div
            className="px-3 py-1 rounded font-mono text-sm font-bold"
            style={{
              color: getAquilaColor(imperium.aquilaScore),
              background: `${getAquilaColor(imperium.aquilaScore)}15`,
              border: `1px solid ${getAquilaColor(imperium.aquilaScore)}40`,
            }}
          >
            {imperium.aquilaScore} · {getAquilaLabel(imperium.aquilaScore)}
          </div>
        </div>
      </div>

      {/* Legions */}
      <div>
        {imperium.legions.map((legion) => (
          <LegionBlock key={legion.id} legion={legion} />
        ))}
      </div>
    </div>
  );
}
