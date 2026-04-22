import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  CheckCircle,
  Network,
  RefreshCw,
  Shield,
  Shuffle,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface MTDPolicy {
  id: string;
  name: string;
  target: string;
  rotationType: string;
  interval: string;
  status: 'active' | 'standby' | 'executing' | 'scheduled';
  lastRotation: string;
  nextRotation: string;
  rotationsToday: number;
  successRate: number;
}

interface RotationEvent {
  id: string;
  time: string;
  policy: string;
  from: string;
  to: string;
  trigger: 'scheduled' | 'threat-triggered' | 'manual';
  duration: string;
  result: 'success' | 'partial' | 'failed';
}

const THREAT_LEVEL = 78;

const POLICIES: MTDPolicy[] = [
  {
    id: 'MTD-001',
    name: 'IP Rotation — DMZ',
    target: 'DMZ Network (12 hosts)',
    rotationType: 'IP Address & MAC Spoofing',
    interval: '4h',
    status: 'active',
    lastRotation: '2h ago',
    nextRotation: 'in 2h',
    rotationsToday: 6,
    successRate: 100,
  },
  {
    id: 'MTD-002',
    name: 'Port Shuffling — External',
    target: 'External Services (8 ports)',
    rotationType: 'Service Port Randomization',
    interval: '6h',
    status: 'executing',
    lastRotation: 'now',
    nextRotation: 'in 6h',
    rotationsToday: 4,
    successRate: 100,
  },
  {
    id: 'MTD-003',
    name: 'Service Fingerprint Mutation',
    target: 'Web Servers (SRV-WEB-01, 02, 03)',
    rotationType: 'OS/Service Banner Morphing',
    interval: '12h',
    status: 'active',
    lastRotation: '5h ago',
    nextRotation: 'in 7h',
    rotationsToday: 2,
    successRate: 100,
  },
  {
    id: 'MTD-004',
    name: 'Network Topology Shuffle',
    target: 'Internal VLANs',
    rotationType: 'Virtual Network Reconfiguration',
    interval: '24h',
    status: 'standby',
    lastRotation: '22h ago',
    nextRotation: 'in 2h',
    rotationsToday: 1,
    successRate: 100,
  },
  {
    id: 'MTD-005',
    name: 'DNS Record Rotation',
    target: 'Public DNS Records (47 entries)',
    rotationType: 'A/AAAA Record Cycling',
    interval: '1h',
    status: 'active',
    lastRotation: '45m ago',
    nextRotation: 'in 15m',
    rotationsToday: 24,
    successRate: 98,
  },
  {
    id: 'MTD-006',
    name: 'TLS Certificate Cycling',
    target: 'All Public Endpoints',
    rotationType: 'Certificate/Key Pair Rotation',
    interval: '48h',
    status: 'scheduled',
    lastRotation: '48h ago',
    nextRotation: 'in 30m',
    rotationsToday: 0,
    successRate: 100,
  },
];

const EVENTS: RotationEvent[] = [
  {
    id: 'ROT-089',
    time: '14:33:00',
    policy: 'Port Shuffling — External',
    from: '443, 80, 8080, 22',
    to: '4431, 8844, 9080, 2222',
    trigger: 'threat-triggered',
    duration: '4.2s',
    result: 'success',
  },
  {
    id: 'ROT-088',
    time: '14:30:00',
    policy: 'IP Rotation — DMZ',
    from: '10.20.1.0/24',
    to: '10.20.7.0/24',
    trigger: 'scheduled',
    duration: '8.7s',
    result: 'success',
  },
  {
    id: 'ROT-087',
    time: '14:28:15',
    policy: 'Service Fingerprint Mutation',
    from: 'Apache/2.4.51 (Ubuntu)',
    to: 'nginx/1.23.0',
    trigger: 'threat-triggered',
    duration: '1.1s',
    result: 'success',
  },
  {
    id: 'ROT-086',
    time: '14:15:00',
    policy: 'DNS Record Rotation',
    from: '203.0.113.45',
    to: '203.0.113.72',
    trigger: 'scheduled',
    duration: '2.3s',
    result: 'success',
  },
  {
    id: 'ROT-085',
    time: '13:30:00',
    policy: 'IP Rotation — DMZ',
    from: '10.20.4.0/24',
    to: '10.20.1.0/24',
    trigger: 'manual',
    duration: '9.1s',
    result: 'partial',
  },
];

const triggerColor: Record<string, string> = {
  scheduled: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  'threat-triggered': 'text-red-400 bg-red-500/10 border-red-500/30',
  manual: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
};

const resultColor: Record<string, string> = {
  success: 'text-emerald-400',
  partial: 'text-amber-400',
  failed: 'text-red-400',
};

const statusConfig: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  standby: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
  executing: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  scheduled: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

export default function MTDEngine() {
  const [activating, setActivating] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const handleEmergencyRotation = () => {
    setActivating(true);
    setTimeout(() => {
      setActivating(false);
      setEmergencyMode(true);
      toast.success('Emergency MTD activated — all attack surfaces rotating simultaneously');
    }, 2500);
  };

  const rotationsToday = POLICIES.reduce((s, p) => s + p.rotationsToday, 0);

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shuffle className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-semibold text-white">Moving Target Defense Engine</h1>
          </div>
          <p className="text-xs text-zinc-500">
            Automated rotation of network configurations, IPs, ports, and service fingerprints to
            make the attack surface unpredictable.
          </p>
        </div>
        <button
          onClick={handleEmergencyRotation}
          disabled={activating}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
            emergencyMode
              ? 'bg-red-500/20 border-red-500/40 text-red-400'
              : 'bg-orange-500/15 border-orange-500/30 text-orange-400 hover:bg-orange-500/25',
          )}
        >
          {activating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Rotating...
            </>
          ) : emergencyMode ? (
            <>
              <Zap className="w-3.5 h-3.5" /> Emergency Active
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" /> Emergency Rotation
            </>
          )}
        </button>
      </div>

      {/* Threat Level Bar */}
      <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-white">Current Threat Level</span>
          </div>
          <span className="text-sm font-bold text-orange-400">{THREAT_LEVEL}/100 — ELEVATED</span>
        </div>
        <div className="h-2 rounded-full bg-white/8">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${THREAT_LEVEL}%`,
              background: 'linear-gradient(90deg, #10b981, #f97316, #ef4444)',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-zinc-500">
          <span>Auto-MTD triggers at level 70 ✓</span>
          <span>Port shuffling & IP rotation activated automatically at 14:33</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Active Policies',
            value: POLICIES.filter((p) => p.status === 'active').length,
            sub: `${POLICIES.length} total configured`,
            color: '#3b82f6',
            icon: Shield,
          },
          {
            label: 'Rotations Today',
            value: rotationsToday,
            sub: 'attack surface changes',
            color: '#10b981',
            icon: Shuffle,
          },
          {
            label: 'Surface Entropy',
            value: '94.2%',
            sub: 'unpredictability score',
            color: '#8b5cf6',
            icon: TrendingDown,
          },
          {
            label: 'Attack Surface',
            value: '-67%',
            sub: 'vs static baseline',
            color: '#ef4444',
            icon: Network,
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-2xl font-bold text-white">{m.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Policies */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            MTD Policies
          </h2>
          <div className="space-y-2">
            {POLICIES.map((policy) => (
              <div
                key={policy.id}
                className={cn(
                  'rounded-xl border p-3',
                  policy.status === 'executing'
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-white/8 bg-white/3',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-xs font-medium text-white">{policy.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{policy.target}</div>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded border shrink-0 capitalize',
                      statusConfig[policy.status],
                    )}
                  >
                    {policy.status === 'executing' ? '⟳ Executing' : policy.status}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mb-2">{policy.rotationType}</div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                  <span>Every {policy.interval}</span>
                  <span>{policy.rotationsToday} today</span>
                  <span className="text-emerald-400">{policy.successRate}% success</span>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px]">
                  <span className="text-zinc-500">Last: {policy.lastRotation}</span>
                  <span className="text-blue-400">Next: {policy.nextRotation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rotation Events */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Rotation Log
          </h2>
          <div className="space-y-2">
            {EVENTS.map((evt) => (
              <div key={evt.id} className="rounded-xl border border-white/8 bg-white/3 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={cn('w-3.5 h-3.5', resultColor[evt.result])} />
                    <span className="text-xs font-medium text-white">{evt.policy}</span>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded border',
                      triggerColor[evt.trigger],
                    )}
                  >
                    {evt.trigger === 'threat-triggered' ? '⚡ Threat Triggered' : evt.trigger}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <div className="text-zinc-500 mb-0.5">From</div>
                    <div className="text-zinc-300 font-mono">{evt.from}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-0.5">To</div>
                    <div className="text-zinc-300 font-mono">{evt.to}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
                  <span>{evt.time}</span>
                  <span>Duration: {evt.duration}</span>
                  <span className={cn('ml-auto', resultColor[evt.result])}>{evt.result}</span>
                </div>
              </div>
            ))}
          </div>

          {/* MTD Config Panel */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 mt-4">
            <div className="text-xs font-semibold text-blue-300 mb-3">
              Auto-Trigger Configuration
            </div>
            <div className="space-y-2">
              {[
                { label: 'Threat Level Threshold', value: '70/100', active: true },
                { label: 'Anomalous Scan Detection', value: 'Triggers Port Shuffle', active: true },
                { label: 'IOC Match — Known C2', value: 'Triggers IP Rotation', active: true },
                {
                  label: 'Failed Auth Spike (>20/min)',
                  value: 'Triggers Service Fingerprint Mutation',
                  active: true,
                },
                {
                  label: 'Ransomware Indicator',
                  value: 'Emergency All-Surface Rotation',
                  active: false,
                },
              ].map((rule) => (
                <div key={rule.label} className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">{rule.label}</span>
                  <span className={rule.active ? 'text-emerald-400' : 'text-zinc-500'}>
                    {rule.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
