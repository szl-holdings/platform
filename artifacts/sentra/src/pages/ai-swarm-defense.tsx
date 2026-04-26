import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  GitBranch,
  Layers,
  Network,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type SwarmAgent = {
  id: string;
  name: string;
  role: 'detector' | 'analyzer' | 'disruptor' | 'coordinator';
  status: 'active' | 'engaged' | 'standby' | 'deploying';
  load: number;
  threatsBlocked: number;
  region: string;
};

const DEFENSE_AGENTS: SwarmAgent[] = [
  { id: 'sd-001', name: 'Sentinel-North-1', role: 'detector', status: 'active', load: 78, threatsBlocked: 142, region: 'US-East' },
  { id: 'sd-002', name: 'Sentinel-North-2', role: 'detector', status: 'engaged', load: 94, threatsBlocked: 89, region: 'US-West' },
  { id: 'sd-003', name: 'Analyzer-Prime', role: 'analyzer', status: 'active', load: 67, threatsBlocked: 0, region: 'EU-West' },
  { id: 'sd-004', name: 'Disruptor-Alpha', role: 'disruptor', status: 'engaged', load: 88, threatsBlocked: 312, region: 'US-East' },
  { id: 'sd-005', name: 'Disruptor-Beta', role: 'disruptor', status: 'active', load: 45, threatsBlocked: 187, region: 'APAC' },
  { id: 'sd-006', name: 'Coordinator-Central', role: 'coordinator', status: 'active', load: 56, threatsBlocked: 0, region: 'Global' },
  { id: 'sd-007', name: 'Sentinel-South-1', role: 'detector', status: 'standby', load: 12, threatsBlocked: 34, region: 'US-South' },
  { id: 'sd-008', name: 'Analyzer-Secondary', role: 'analyzer', status: 'deploying', load: 0, threatsBlocked: 0, region: 'EU-East' },
];

type SwarmPattern = {
  id: string;
  name: string;
  type: 'coordinated_scan' | 'distributed_brute' | 'ai_probe' | 'botnet_swarm' | 'apt_multi_vector';
  agentCount: number;
  confidence: number;
  status: 'active' | 'mitigated' | 'analyzing';
  firstSeen: string;
  description: string;
};

const SWARM_PATTERNS: SwarmPattern[] = [
  { id: 'sp-1', name: 'Coordinated API Enumeration', type: 'coordinated_scan', agentCount: 847, confidence: 96, status: 'active', firstSeen: '4m ago', description: '847 unique IPs probing API endpoints in synchronized 2s intervals — matches AI-orchestrated reconnaissance pattern' },
  { id: 'sp-2', name: 'Distributed Credential Spray', type: 'distributed_brute', agentCount: 2_341, confidence: 94, status: 'mitigated', firstSeen: '18m ago', description: 'Low-and-slow credential spray across 2,341 source IPs targeting Azure AD — 1 attempt per IP to evade lockout' },
  { id: 'sp-3', name: 'AI-Driven Vulnerability Probe', type: 'ai_probe', agentCount: 156, confidence: 89, status: 'active', firstSeen: '7m ago', description: 'Adaptive scanning adjusting payloads based on responses — indicative of AI fuzzer with reinforcement learning' },
  { id: 'sp-4', name: 'IoT Botnet DDoS Swarm', type: 'botnet_swarm', agentCount: 14_892, confidence: 98, status: 'mitigated', firstSeen: '45m ago', description: 'Mirai-variant botnet with 14,892 compromised IoT devices targeting edge load balancers' },
  { id: 'sp-5', name: 'APT Multi-Vector Campaign', type: 'apt_multi_vector', agentCount: 23, confidence: 87, status: 'analyzing', firstSeen: '2h ago', description: '23 coordinated attack agents across phishing, exploitation, and lateral movement — matches APT41 TTP profile' },
];

type KillChainDisruption = {
  phase: string;
  blocked: number;
  method: string;
  latency: string;
};

const KILL_CHAIN_DISRUPTIONS: KillChainDisruption[] = [
  { phase: 'Reconnaissance', blocked: 847, method: 'Honeypot redirection + rate limiting', latency: '0.3s' },
  { phase: 'Weaponization', blocked: 12, method: 'Payload signature detection + sandbox detonation', latency: '1.8s' },
  { phase: 'Delivery', blocked: 2_341, method: 'IP reputation blocking + credential lockout', latency: '0.1s' },
  { phase: 'Exploitation', blocked: 156, method: 'WAF rule injection + virtual patching', latency: '0.5s' },
  { phase: 'Lateral Movement', blocked: 34, method: 'Microsegmentation enforcement + token revocation', latency: '2.1s' },
  { phase: 'C2 Communication', blocked: 89, method: 'DNS sinkholing + TLS inspection', latency: '0.4s' },
  { phase: 'Exfiltration', blocked: 7, method: 'DLP enforcement + network isolation', latency: '0.8s' },
];

const ROLE_COLORS: Record<string, string> = {
  detector: '#c9b787',
  analyzer: '#8a8a8a',
  disruptor: '#f5f5f5',
  coordinator: '#c9b787',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  engaged: 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10',
  standby: 'text-zinc-400 border-zinc-700 bg-zinc-800/50',
  deploying: 'text-[#8a8a8a] border-[#8a8a8a]/30 bg-[#8a8a8a]/10',
  mitigated: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  analyzing: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
};

export default function AISwarmDefense() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPulse((p) => p + 1), 2000);
    return () => clearInterval(iv);
  }, []);

  const totalBlocked = DEFENSE_AGENTS.reduce((s, a) => s + a.threatsBlocked, 0);
  const activeAgents = DEFENSE_AGENTS.filter((a) => a.status === 'active' || a.status === 'engaged').length;

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-[#c9b787]" />
            <h1 className="text-lg font-semibold text-white">AI Swarm Defense</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#c9b787]/30 bg-[#c9b787]/10 text-[#c9b787] font-mono uppercase">
              Counter-Swarm Active
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Parallel detection agent deployment, swarm pattern recognition, distributed kill-chain disruption
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Defense Agents', value: `${activeAgents}/${DEFENSE_AGENTS.length}`, sub: 'active / total deployed', color: '#c9b787', icon: Bot },
          { label: 'Swarm Attacks Detected', value: SWARM_PATTERNS.length.toString(), sub: `${SWARM_PATTERNS.filter(p => p.status === 'active').length} currently active`, color: '#f5f5f5', icon: AlertTriangle },
          { label: 'Threats Blocked (24h)', value: totalBlocked.toLocaleString(), sub: 'across all defense agents', color: '#c9b787', icon: Shield },
          { label: 'Avg Disruption Latency', value: '0.7s', sub: 'from detection to block', color: '#8a8a8a', icon: Clock },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-xl font-bold text-white font-mono">{m.value}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-[#c9b787]" />
            Parallel Detection Agent Deployment
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {DEFENSE_AGENTS.map((agent) => {
              const isActive = agent.status === 'active' || agent.status === 'engaged';
              return (
                <div key={agent.id} className={cn(
                  'rounded-xl border p-3 transition-all',
                  agent.status === 'engaged' ? 'border-[#f5f5f5]/20 bg-[#f5f5f5]/3' : 'border-white/8 bg-white/3',
                )}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? ROLE_COLORS[agent.role] : '#555' }} />
                      <span className="text-[10px] font-medium text-white">{agent.name}</span>
                    </div>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded border', STATUS_COLORS[agent.status])}>
                      {agent.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-1.5">
                    <span className="capitalize">{agent.role}</span>
                    <span>{agent.region}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/5">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${agent.load}%`,
                        background: agent.load > 80 ? '#f5f5f5' : agent.load > 50 ? '#c9b787' : '#c9b787',
                      }} />
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono">{agent.load}%</span>
                  </div>
                  {agent.threatsBlocked > 0 && (
                    <div className="text-[10px] text-[#c9b787] mt-1">{agent.threatsBlocked} blocked</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Network className="w-3.5 h-3.5 text-[#f5f5f5]" />
            Swarm Pattern Recognition
          </h2>
          <div className="space-y-2">
            {SWARM_PATTERNS.map((pattern) => (
              <div key={pattern.id} className={cn(
                'rounded-xl border p-3',
                pattern.status === 'active' ? 'border-[#f5f5f5]/20 bg-[#f5f5f5]/3' : 'border-white/8 bg-white/3',
              )}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-medium text-white">{pattern.name}</span>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded border shrink-0', STATUS_COLORS[pattern.status])}>
                    {pattern.status}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mb-1.5 leading-relaxed">{pattern.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span className="text-[#c9b787] font-mono">{pattern.agentCount.toLocaleString()} sources</span>
                  <span>{pattern.confidence}% confidence</span>
                  <span>First seen: {pattern.firstSeen}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-[#c9b787]" />
          Distributed Kill-Chain Disruption
        </h2>
        <div className="grid grid-cols-7 gap-1.5">
          {KILL_CHAIN_DISRUPTIONS.map((d, i) => {
            const isHighlight = pulse % 7 === i;
            return (
              <div key={d.phase} className={cn(
                'rounded-xl border p-3 text-center transition-all',
                isHighlight ? 'border-[#c9b787]/40 bg-[#c9b787]/5' : 'border-white/8 bg-white/3',
              )}>
                <div className="text-lg font-bold text-white font-mono mb-1">{d.blocked.toLocaleString()}</div>
                <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1.5">{d.phase}</div>
                <div className="text-[9px] text-zinc-400">{d.method}</div>
                <div className="text-[9px] text-[#c9b787] mt-1 font-mono">{d.latency}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-[#c9b787]/20 bg-[#c9b787]/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-[#c9b787]" />
          <span className="text-xs font-semibold text-[#c9b787]">Autonomous Counter-Swarm Response</span>
          <span className="text-[9px] text-zinc-500 font-mono ml-auto">Real-time · Coordinated defense</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Active Counter-Swarms', value: '3', color: '#c9b787' },
            { label: 'IPs Blacklisted (24h)', value: '18,234', color: '#f5f5f5' },
            { label: 'Auto-Playbooks Executed', value: '47', color: '#c9b787' },
            { label: 'False Positive Rate', value: '0.02%', color: '#8a8a8a' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
