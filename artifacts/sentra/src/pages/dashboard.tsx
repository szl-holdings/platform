import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Cpu,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { sentraTwin } from '@/data/sentra-twin';

const BASELINE_ENTITIES = [
  {
    name: 'api-gateway-prod',
    type: 'Service',
    normalTraffic: '12.4k req/min',
    current: '12.1k req/min',
    deviation: 2,
    status: 'normal',
  },
  {
    name: 'db-replica-01',
    type: 'Database',
    normalTraffic: '840 conn/min',
    current: '2,341 conn/min',
    deviation: 178,
    status: 'anomaly',
  },
  {
    name: 'auth-service',
    type: 'Service',
    normalTraffic: '3.2k req/min',
    current: '3.4k req/min',
    deviation: 6,
    status: 'normal',
  },
  {
    name: 'analytics-worker-03',
    type: 'Compute',
    normalTraffic: 'Idle 82%',
    current: 'Idle 12%',
    deviation: 85,
    status: 'watch',
  },
];

const NL_EXAMPLES = [
  'show assets with unusual outbound connections in the last 6h',
  'which controls have drifted from policy since Monday?',
  'list incidents touching the auth-service blast radius',
];

function PatternOfLifePanel() {
  return (
    <div className="sentra-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-display font-bold flex items-center gap-2">
          <Brain className="w-4 h-4 text-red-500" />
          Behavioral Baseline
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            Pattern of Life · Live
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {BASELINE_ENTITIES.map((e) => {
          const devColor =
            e.status === 'anomaly'
              ? 'text-red-400'
              : e.status === 'watch'
                ? 'text-amber-400'
                : 'text-emerald-400';
          const barColor =
            e.status === 'anomaly'
              ? 'bg-red-500'
              : e.status === 'watch'
                ? 'bg-amber-500'
                : 'bg-emerald-500';
          const barWidth =
            e.status === 'anomaly'
              ? '100%'
              : e.status === 'watch'
                ? '70%'
                : `${Math.min(100, 50 + e.deviation)}%`;
          return (
            <div
              key={e.name}
              className="grid grid-cols-12 gap-2 items-center py-2 border-b border-slate-800/60 last:border-0"
            >
              <div className="col-span-3">
                <div className="text-[11px] font-mono text-slate-300 truncate">{e.name}</div>
                <div className="text-[9px] text-slate-600 uppercase">{e.type}</div>
              </div>
              <div className="col-span-3 text-[10px] text-slate-500 font-mono">
                {e.normalTraffic}
              </div>
              <div
                className="col-span-3 text-[10px] font-mono font-semibold"
                style={{
                  color:
                    e.status === 'anomaly'
                      ? '#f87171'
                      : e.status === 'watch'
                        ? '#fbbf24'
                        : '#34d399',
                }}
              >
                {e.current}
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: barWidth }}
                  />
                </div>
              </div>
              <div className={`col-span-1 text-[9px] font-mono font-bold ${devColor} text-right`}>
                {e.status === 'normal' ? '—' : `+${e.deviation}%`}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[9px] font-mono text-slate-600">
        Baseline computed over rolling 30-day window · Antigena autonomous response: ENABLED
      </div>
    </div>
  );
}

function NLThreatQueryBar() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(false);
  return (
    <div className="sentra-panel p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-red-400/60" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
          Threat Intelligence Query
        </span>
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#f87171',
          }}
        >
          NL-powered
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          placeholder="Ask in plain English — e.g. 'show assets with unusual outbound activity this week'"
          className="flex-1 bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none"
          style={{
            background: 'rgba(239,68,68,0.03)',
            border: `1px solid ${active ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.1)'}`,
            borderRadius: 8,
            padding: '8px 12px',
            transition: 'border-color 0.15s',
          }}
        />
        <button
          className="px-3 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171',
          }}
        >
          Run
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {NL_EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setQuery(ex)}
            className="text-[9px] font-mono text-slate-600 hover:text-slate-400 transition-colors px-2 py-1 rounded"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-100">Cyber Resilience Command</h1>
        <p className="text-slate-400 mt-1">Operational status and posture overview</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-panel p-6">
          <div className="flex items-center gap-3 text-red-400 mb-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-sm font-medium">Active Incidents</span>
          </div>
          <div className="text-4xl font-display font-bold">{sentraTwin.incidents.length}</div>
          <div className="text-xs text-red-400/60 mt-2 font-mono">CRITICAL STATUS</div>
        </div>

        <div className="stat-panel p-6">
          <div className="flex items-center gap-3 text-amber-400 mb-2">
            <Cpu className="w-5 h-5" />
            <span className="text-sm font-medium">Assets at Risk</span>
          </div>
          <div className="text-4xl font-display font-bold">
            {sentraTwin.assets.filter((a) => a.exposureScore > 70).length}
          </div>
          <div className="text-xs text-amber-400/60 mt-2 font-mono">EXPOSURE &gt; 70</div>
        </div>

        <div className="stat-panel p-6">
          <div className="flex items-center gap-3 text-sky-400 mb-2">
            <RotateCcw className="w-5 h-5" />
            <span className="text-sm font-medium">Recovery Posture</span>
          </div>
          <div className="text-4xl font-display font-bold">{sentraTwin.recoveryPosture}%</div>
          <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full transition-all duration-1000"
              style={{ width: `${sentraTwin.recoveryPosture}%` }}
            />
          </div>
        </div>

        <div className="stat-panel p-6">
          <div className="flex items-center gap-3 text-purple-400 mb-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-medium">Control Drift</span>
          </div>
          <div className="text-4xl font-display font-bold">
            {sentraTwin.controlDrifts.filter((d) => d.status === 'drift_detected').length}
          </div>
          <div className="text-xs text-purple-400/60 mt-2 font-mono">RESPOND / RECOVER FAMILY</div>
        </div>
      </div>

      <NLThreatQueryBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PatternOfLifePanel />
        <div className="sentra-panel p-5 space-y-3">
          <h2 className="text-sm font-display font-bold flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-sky-400" />
            Time to Recover Estimate
          </h2>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-display font-bold text-sky-300">4.2h</div>
            <div className="text-xs text-slate-500 mb-1.5">
              estimated mean time to recover (MTTR)
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Containment', estimate: '45 min', progress: 90, color: '#ef4444' },
              { label: 'Eradication', estimate: '1.5h', progress: 45, color: '#f97316' },
              { label: 'Recovery', estimate: '2h', progress: 20, color: '#0ea5e9' },
              { label: 'Validation', estimate: '30 min', progress: 0, color: '#8b5cf6' },
            ].map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="font-mono text-slate-500">{s.estimate}</span>
                </div>
                <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${s.progress}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="text-[9px] font-mono text-slate-600">
            Agent-verified · Updated on each control state change
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 sentra-panel p-6">
          <h2 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Critical Incident Timeline
          </h2>
          <div className="space-y-6">
            {sentraTwin.incidents.map((incident) => (
              <div key={incident.id} className="sentra-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-red-400">{incident.title}</h3>
                  <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-mono">
                    {incident.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">{incident.description}</p>
                <div className="flex items-center gap-6 text-[11px] font-mono text-slate-500">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    STAGE: {incident.mitreStage}
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    ID: {incident.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sentra-panel p-6">
          <h2 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="text-red-500 w-5 h-5" />
            Financial Exposure
          </h2>
          <div className="space-y-6">
            <div className="text-5xl font-display font-bold text-slate-100">
              ${(sentraTwin.financialExposure / 1000000).toFixed(1)}M
            </div>
            <p className="text-sm text-slate-400">
              Estimated cost avoidance via recommended isolation and recovery actions.
            </p>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Ransomware Impact</span>
                <span className="text-slate-300">$1.8M</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Operational Downtime</span>
                <span className="text-slate-300">$850K</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Data Recovery Costs</span>
                <span className="text-slate-300">$150K</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
