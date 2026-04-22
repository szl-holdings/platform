import { ClassificationBadge } from '@imp/components/classification-badge';
import {
  getClassificationColor,
  getThreatColor,
  INTELLIGENCE_BRIEFS,
} from '@imp/lib/imperium-data';
import { cn } from '@imp/lib/utils';
import {
  Activity,
  ChevronRight,
  DollarSign,
  Radio,
  Shield,
  TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';

function CostBar({ cost, max }: { cost: number; max: number }) {
  const pct = (cost / max) * 100;
  return (
    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #c9a227, #e8c547)' }}
      />
    </div>
  );
}

function BriefSection({
  title,
  icon: Icon,
  classification,
  children,
}: {
  title: string;
  icon: React.ElementType;
  classification: any;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const _color = getClassificationColor(classification);

  return (
    <div className="imperial-card rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/2 transition-all text-left border-b border-white/5"
      >
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#c9a227' }} />
        <span className="font-display text-xs tracking-[0.15em] gold-text font-semibold uppercase flex-1">
          {title}
        </span>
        <ClassificationBadge classification={classification} size="xs" />
        <ChevronRight
          className={cn('w-4 h-4 text-slate-600 transition-transform', open && 'rotate-90')}
        />
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

export default function IntelligenceBriefing() {
  const { cost, capacity, threat, operational } = INTELLIGENCE_BRIEFS;
  const maxCost = Math.max(...cost.topConsumers.map((c) => c.cost));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Radio className="w-5 h-5" style={{ color: '#c9a227' }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Intelligence Briefing
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          SIGINT-style infrastructure briefs — cost, capacity, threat, and operational intelligence
        </p>
      </div>

      {/* Classification banner */}
      <div
        className="rounded-lg px-4 py-2 flex items-center justify-between border"
        style={{ background: 'rgba(201,162,39,0.04)', borderColor: 'rgba(201,162,39,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5" style={{ color: '#c9a227' }} />
          <span className="font-mono text-[10px] tracking-widest text-slate-400">
            INTELLIGENCE BRIEF — AUTHORIZED PERSONNEL ONLY
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC
        </span>
      </div>

      {/* Operational summary — top line */}
      <div
        className="rounded-lg p-4 border"
        style={{ background: 'rgba(74,222,128,0.04)', borderColor: 'rgba(74,222,128,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="font-display text-xs tracking-[0.15em] text-green-400 uppercase">
            Operational Summary
          </span>
          <ClassificationBadge classification={operational.classification} size="xs" />
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-3">{operational.summary}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Uptime', value: operational.uptime, color: '#4ade80' },
            { label: 'P1/P2 Incidents', value: operational.incidentsToday, color: '#4ade80' },
            { label: 'API P95 Latency', value: `${operational.p95Latency}ms`, color: '#c9a227' },
            {
              label: 'SLA Compliance',
              value: `${operational.apiSlaCompliance}%`,
              color: '#4ade80',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded p-2.5 text-center bg-white/3">
              <div className="font-mono text-sm font-bold" style={{ color }}>
                {value}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Intelligence */}
      <BriefSection title={cost.title} icon={DollarSign} classification={cost.classification}>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-3xl font-bold gold-text">
                ${cost.totalMonthly.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Monthly spend · Trend: {cost.trend}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-slate-400">
                ${cost.forecast90Days.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-600">90-day forecast</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
              Top Cost Consumers
            </div>
            <div className="space-y-2">
              {cost.topConsumers.map((item) => (
                <div key={item.resource} className="flex items-center gap-3">
                  <div className="w-36 truncate text-xs text-slate-400">{item.resource}</div>
                  <CostBar cost={item.cost} max={maxCost} />
                  <div className="font-mono text-xs text-gold-dim w-16 text-right">
                    ${item.cost}/mo
                  </div>
                  <div
                    className="font-mono text-[10px] w-10 text-right"
                    style={{ color: item.trend === '+0%' ? '#4ade80' : '#fb923c' }}
                  >
                    {item.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded p-3 bg-white/3 border border-white/5 text-xs text-slate-400 leading-relaxed">
            <span className="font-mono text-slate-500 mr-2">OPTIMIZATION:</span>
            {cost.optimization}
          </div>
        </div>
      </BriefSection>

      {/* Capacity Intelligence */}
      <BriefSection
        title={capacity.title}
        icon={TrendingUp}
        classification={capacity.classification}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="font-mono text-slate-500 mr-2">GROWTH PROJECTION:</span>
            {capacity.projectedGrowth}
          </p>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
              Capacity Bottlenecks
            </div>
            <div className="space-y-3">
              {capacity.bottlenecks.map((b) => {
                const pct = b.current;
                const color = pct < 60 ? '#4ade80' : pct < 80 ? '#facc15' : '#ef4444';
                return (
                  <div key={b.resource}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">{b.resource}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono" style={{ color }}>
                          {b.current}
                          {b.unit}
                        </span>
                        {b.daysToCapacity && (
                          <span className="text-slate-600 text-[10px]">
                            ~{b.daysToCapacity}d to capacity
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: color,
                          boxShadow: pct > 80 ? `0 0 8px ${color}60` : undefined,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </BriefSection>

      {/* Threat Intelligence */}
      <BriefSection title={threat.title} icon={Shield} classification={threat.classification}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1.5 rounded font-display text-sm tracking-[0.2em] font-bold border"
              style={{
                color: getThreatColor(threat.currentLevel),
                borderColor: `${getThreatColor(threat.currentLevel)}40`,
                background: `${getThreatColor(threat.currentLevel)}10`,
              }}
            >
              {threat.currentLevel}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: getThreatColor(threat.currentLevel) }}
              />
              <span className="font-mono">{threat.wafStatus}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">{threat.summary}</p>

          <div className="grid grid-cols-1 gap-2">
            {threat.indicators.map((ind, i) => {
              const colors = { HIGH: '#ef4444', MEDIUM: '#fb923c', LOW: '#facc15' };
              const color = colors[ind.severity as keyof typeof colors];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded p-2.5 bg-white/3 border border-white/5"
                >
                  <div
                    className="px-1.5 py-0.5 rounded font-mono text-[9px] tracking-wider border flex-shrink-0"
                    style={{ color, borderColor: `${color}40`, background: `${color}10` }}
                  >
                    {ind.severity}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-slate-300 font-semibold">{ind.type}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      {ind.description}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-slate-500 flex-shrink-0">{ind.count}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded p-2.5 text-center bg-white/3">
              <div className="font-mono text-xs font-bold text-green-400">
                {threat.wafStatus.split(' — ')[0]}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">WAF Status</div>
            </div>
            <div className="rounded p-2.5 text-center bg-white/3">
              <div className="font-mono text-xs font-bold text-green-400">COMPLETE</div>
              <div className="text-[9px] text-slate-500 mt-0.5">VNet Isolation</div>
            </div>
          </div>
        </div>
      </BriefSection>
    </div>
  );
}
