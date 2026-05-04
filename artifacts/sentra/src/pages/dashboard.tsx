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
import { DataProvenance } from '@/lib/data-provenance';

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
          <Brain className="w-4 h-4 text-[#f5f5f5]" />
          Behavioral Baseline
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
          <span className="text-[9px] font-mono text-[#666] uppercase tracking-wider">
            Pattern of Life · Live
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {BASELINE_ENTITIES.map((e) => {
          const devColor =
            e.status === 'anomaly'
              ? 'text-[#f5f5f5]'
              : e.status === 'watch'
                ? 'text-[#c9b787]'
                : 'text-[#c9b787]';
          const barColor =
            e.status === 'anomaly'
              ? 'bg-[#f5f5f5]'
              : e.status === 'watch'
                ? 'bg-[#c9b787]'
                : 'bg-[#c9b787]';
          const barWidth =
            e.status === 'anomaly'
              ? '100%'
              : e.status === 'watch'
                ? '70%'
                : `${Math.min(100, 50 + e.deviation)}%`;
          return (
            <div
              key={e.name}
              className="grid grid-cols-12 gap-2 items-center py-2 border-b border-[rgba(255,255,255,0.06)] last:border-0"
            >
              <div className="col-span-3">
                <div className="text-[11px] font-mono text-[#e0e0e0] truncate">{e.name}</div>
                <div className="text-[9px] text-[#555] uppercase">{e.type}</div>
              </div>
              <div className="col-span-3 text-[10px] text-[#666] font-mono">
                {e.normalTraffic}
              </div>
              <div
                className="col-span-3 text-[10px] font-mono font-semibold"
                style={{
                  color:
                    e.status === 'anomaly'
                      ? '#f5f5f5'
                      : e.status === 'watch'
                        ? '#c9b787'
                        : '#c9b787',
                }}
              >
                {e.current}
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <div className="w-full h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
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
      <div className="text-[9px] font-mono text-[#555]">
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
        <Search className="w-4 h-4 text-[#f5f5f5]/60" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#666]">
          Threat Intelligence Query
        </span>
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(201,183,135,0.08)',
            border: '1px solid rgba(201,183,135,0.12)',
            color: '#f5f5f5',
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
          className="flex-1 bg-transparent text-xs text-[#e0e0e0] placeholder:text-[#555] outline-none"
          style={{
            background: 'rgba(201,183,135,0.03)',
            border: `1px solid ${active ? 'rgba(201,183,135,0.25)' : 'rgba(201,183,135,0.08)'}`,
            borderRadius: 8,
            padding: '8px 12px',
            transition: 'border-color 0.15s',
          }}
        />
        <button
          className="px-3 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
          style={{
            background: 'rgba(201,183,135,0.08)',
            border: '1px solid rgba(201,183,135,0.15)',
            color: '#f5f5f5',
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
            className="text-[9px] font-mono text-[#555] hover:text-[#8a8a8a] transition-colors px-2 py-1 rounded"
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
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-display font-bold text-[#f5f5f5]">Cyber Resilience Command</h1>
          <DataProvenance source="seed" label="Demo Data" />
        </div>
        <p className="text-[#8a8a8a] mt-1">Operational status and posture overview</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-panel p-6">
          <div className="flex items-center gap-3 text-[#f5f5f5] mb-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-sm font-medium">Active Incidents</span>
          </div>
          <div className="text-4xl font-display font-bold">{sentraTwin.incidents.length}</div>
          <div className="text-xs text-[#f5f5f5]/60 mt-2 font-mono">CRITICAL STATUS</div>
        </div>

        <div className="stat-panel p-6">
          <div className="flex items-center gap-3 text-[#c9b787] mb-2">
            <Cpu className="w-5 h-5" />
            <span className="text-sm font-medium">Assets at Risk</span>
          </div>
          <div className="text-4xl font-display font-bold">
            {sentraTwin.assets.filter((a) => a.exposureScore > 70).length}
          </div>
          <div className="text-xs text-[#c9b787]/60 mt-2 font-mono">EXPOSURE &gt; 70</div>
        </div>

        <div className="stat-panel p-6">
          <div className="flex items-center gap-3 text-[#8a8a8a] mb-2">
            <RotateCcw className="w-5 h-5" />
            <span className="text-sm font-medium">Recovery Posture</span>
          </div>
          <div className="text-4xl font-display font-bold">{sentraTwin.recoveryPosture}%</div>
          <div className="w-full bg-[#1a1a1a] h-1 mt-3 rounded-full overflow-hidden">
            <div
              className="bg-[#8a8a8a] h-full transition-all duration-1000"
              style={{ width: `${sentraTwin.recoveryPosture}%` }}
            />
          </div>
        </div>

        <div className="stat-panel p-6">
          <div className="flex items-center gap-3 text-[#8a8a8a] mb-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-medium">Control Drift</span>
          </div>
          <div className="text-4xl font-display font-bold">
            {sentraTwin.controlDrifts.filter((d) => d.status === 'drift_detected').length}
          </div>
          <div className="text-xs text-[#8a8a8a]/60 mt-2 font-mono">RESPOND / RECOVER FAMILY</div>
        </div>
      </div>

      <NLThreatQueryBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PatternOfLifePanel />
        <div className="sentra-panel p-5 space-y-3">
          <h2 className="text-sm font-display font-bold flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#8a8a8a]" />
            Time to Recover Estimate
          </h2>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-display font-bold text-[#8a8a8a]">4.2h</div>
            <div className="text-xs text-[#666] mb-1.5">
              estimated mean time to recover (MTTR)
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Containment', estimate: '45 min', progress: 90, color: '#f5f5f5' },
              { label: 'Eradication', estimate: '1.5h', progress: 45, color: '#c9b787' },
              { label: 'Recovery', estimate: '2h', progress: 20, color: '#8a8a8a' },
              { label: 'Validation', estimate: '30 min', progress: 0, color: '#8a8a8a' },
            ].map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#8a8a8a]">{s.label}</span>
                  <span className="font-mono text-[#666]">{s.estimate}</span>
                </div>
                <div className="w-full h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${s.progress}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="text-[9px] font-mono text-[#555]">
            Agent-verified · Updated on each control state change
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 sentra-panel p-6">
          <h2 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#f5f5f5]" />
            Critical Incident Timeline
          </h2>
          <div className="space-y-6">
            {sentraTwin.incidents.map((incident) => (
              <div key={incident.id} className="sentra-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[#f5f5f5]">{incident.title}</h3>
                  <span className="px-2 py-0.5 rounded bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 text-[10px] text-[#f5f5f5] font-mono">
                    {incident.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-[#8a8a8a] mb-4">{incident.description}</p>
                <div className="flex items-center gap-6 text-[11px] font-mono text-[#666]">
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
            <BarChart3 className="text-[#f5f5f5] w-5 h-5" />
            Financial Exposure
          </h2>
          <div className="space-y-6">
            <div className="text-5xl font-display font-bold text-[#f5f5f5]">
              ${(sentraTwin.financialExposure / 1000000).toFixed(1)}M
            </div>
            <p className="text-sm text-[#8a8a8a]">
              Estimated cost avoidance via recommended isolation and recovery actions.
            </p>

            <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <div className="flex justify-between text-xs">
                <span className="text-[#666]">Ransomware Impact</span>
                <span className="text-[#e0e0e0]">$1.8M</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#666]">Operational Downtime</span>
                <span className="text-[#e0e0e0]">$850K</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#666]">Data Recovery Costs</span>
                <span className="text-[#e0e0e0]">$150K</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
