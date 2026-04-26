import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  Clock,
  Cloud,
  Cpu,
  Eye,
  GitBranch,
  Layers,
  Network,
  Shield,
  Skull,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type KillChainPhase = {
  id: string;
  phase: string;
  technique: string;
  timeElapsed: string;
  totalMinutes: number;
  description: string;
  aiAgent: string;
  status: 'complete' | 'active' | 'pending';
};

const AUTONOMOUS_KILL_CHAIN: KillChainPhase[] = [
  { id: 'kc-1', phase: 'Reconnaissance', technique: 'AI-Powered OSINT Scraping', timeElapsed: '0:00', totalMinutes: 0, description: 'LLM agent scrapes LinkedIn, GitHub, Shodan for target org infrastructure data', aiAgent: 'ReconBot-7', status: 'complete' },
  { id: 'kc-2', phase: 'Weaponization', technique: 'Polymorphic Payload Generation', timeElapsed: '3:12', totalMinutes: 3, description: 'AI generates evasion-optimized payload using reinforcement learning, unique per-target signature', aiAgent: 'WeaponForge', status: 'complete' },
  { id: 'kc-3', phase: 'Delivery', technique: 'AI-Crafted Spear Phishing', timeElapsed: '5:47', totalMinutes: 6, description: 'GPT-class model generates contextually perfect phishing email using scraped OSINT data', aiAgent: 'PhishCraft', status: 'complete' },
  { id: 'kc-4', phase: 'Exploitation', technique: 'Zero-Day Exploit Chain', timeElapsed: '8:33', totalMinutes: 9, description: 'AI fuzzer discovers and chains 2 zero-days in target application stack', aiAgent: 'ExploitGPT', status: 'complete' },
  { id: 'kc-5', phase: 'Installation', technique: 'Fileless Persistence via LOLBins', timeElapsed: '11:15', totalMinutes: 11, description: 'Living-off-the-land techniques selected by AI for maximum stealth', aiAgent: 'PersistAgent', status: 'active' },
  { id: 'kc-6', phase: 'C2 Establishment', technique: 'Domain-Fronted C2 via CDN', timeElapsed: '14:02', totalMinutes: 14, description: 'AI selects CDN-fronted C2 channel to evade network detection', aiAgent: 'C2Pilot', status: 'pending' },
  { id: 'kc-7', phase: 'Actions on Objectives', technique: 'Automated Data Exfil + Ransomware', timeElapsed: '25:00', totalMinutes: 25, description: 'Coordinated exfiltration and encryption — full ransomware chain complete in 25 min', aiAgent: 'RansomOrch', status: 'pending' },
];

type AgentCloudAttack = {
  id: string;
  name: string;
  framework: string;
  role: string;
  target: string;
  status: 'attacking' | 'detected' | 'contained' | 'evaded';
  confidence: number;
};

const MULTI_AGENT_ATTACKS: AgentCloudAttack[] = [
  { id: 'ma-1', name: 'CloudRecon-Alpha', framework: 'CrewAI', role: 'Cloud Enumerator', target: 'AWS S3 Buckets', status: 'detected', confidence: 94 },
  { id: 'ma-2', name: 'IAMEscalator', framework: 'AutoGen', role: 'Privilege Escalation', target: 'IAM Policies', status: 'contained', confidence: 91 },
  { id: 'ma-3', name: 'LambdaInjector', framework: 'CrewAI', role: 'Serverless Backdoor', target: 'Lambda Functions', status: 'attacking', confidence: 78 },
  { id: 'ma-4', name: 'SecretHarvester', framework: 'AutoGen', role: 'Credential Extraction', target: 'Secrets Manager', status: 'evaded', confidence: 67 },
  { id: 'ma-5', name: 'K8sBreaker', framework: 'CrewAI', role: 'Container Escape', target: 'EKS Clusters', status: 'detected', confidence: 89 },
  { id: 'ma-6', name: 'DataExfilBot', framework: 'AutoGen', role: 'Data Exfiltration', target: 'RDS Databases', status: 'contained', confidence: 96 },
];

type FrontierExposure = {
  id: string;
  vector: string;
  severity: 'critical' | 'high' | 'medium';
  exposure: string;
  weaponizationDays: number;
  mitigation: string;
};

const FRONTIER_EXPOSURES: FrontierExposure[] = [
  { id: 'fe-1', vector: 'LLM Prompt Injection via Public API', severity: 'critical', exposure: '3 public-facing LLM endpoints', weaponizationDays: 2, mitigation: 'Input sanitization + output guardrails' },
  { id: 'fe-2', vector: 'Model Poisoning via Training Pipeline', severity: 'critical', exposure: 'CI/CD pipeline to ML model registry', weaponizationDays: 7, mitigation: 'Data provenance verification' },
  { id: 'fe-3', vector: 'AI Agent Goal Hijacking', severity: 'high', exposure: '12 autonomous agent deployments', weaponizationDays: 3, mitigation: 'Agent sandboxing + policy constraints' },
  { id: 'fe-4', vector: 'Deepfake Voice Cloning for Vishing', severity: 'high', exposure: 'Executive voice samples on public calls', weaponizationDays: 1, mitigation: 'Voice authentication watermarking' },
  { id: 'fe-5', vector: 'Adversarial ML Evasion of EDR', severity: 'high', exposure: 'ML-based EDR models (3 vendors)', weaponizationDays: 14, mitigation: 'Adversarial training + ensemble models' },
  { id: 'fe-6', vector: 'Supply Chain LLM Dependency Attack', severity: 'medium', exposure: '47 AI/ML pip packages', weaponizationDays: 30, mitigation: 'Dependency pinning + hash verification' },
];

const STATUS_COLORS: Record<string, string> = {
  attacking: 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10',
  detected: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  contained: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  evaded: 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10',
};

export default function FrontierAIThreatLab() {
  const [activePhase, setActivePhase] = useState(4);
  const [simRunning, setSimRunning] = useState(true);

  useEffect(() => {
    if (!simRunning) return;
    const iv = setInterval(() => {
      setActivePhase((p) => (p + 1) % AUTONOMOUS_KILL_CHAIN.length);
    }, 3000);
    return () => clearInterval(iv);
  }, [simRunning]);

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-[#f5f5f5]" />
            <h1 className="text-lg font-semibold text-white">Frontier AI Threat Lab</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#f5f5f5]/30 bg-[#f5f5f5]/10 text-[#f5f5f5] font-mono uppercase">
              Unit 42 Research
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Autonomous kill-chain simulation, multi-agent attack visualization, and frontier AI exposure analysis
          </p>
        </div>
        <button
          onClick={() => setSimRunning(!simRunning)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            simRunning ? 'bg-[#f5f5f5]/10 border-[#f5f5f5]/30 text-[#f5f5f5]' : 'bg-zinc-800 border-zinc-700 text-zinc-400',
          )}
        >
          {simRunning ? <><Activity className="w-3.5 h-3.5 animate-pulse" /> Simulation Running</> : <><Timer className="w-3.5 h-3.5" /> Paused</>}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Full Ransomware Chain', value: '25 min', sub: 'AI agent autonomous execution', color: '#f5f5f5', icon: Skull },
          { label: 'AI Specialist Agents', value: '7', sub: 'per kill chain phase', color: '#c9b787', icon: Bot },
          { label: 'CVE Weaponization', value: '< 2 days', sub: 'AI-accelerated exploit dev', color: '#c9b787', icon: Target },
          { label: 'Detection Gap', value: '14 min', sub: 'between breach and detection', color: '#f5f5f5', icon: Eye },
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

      <div>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Skull className="w-3.5 h-3.5 text-[#f5f5f5]" />
          Autonomous Kill-Chain Simulator — 25-Minute Ransomware Chain
        </h2>
        <div className="space-y-1.5">
          {AUTONOMOUS_KILL_CHAIN.map((phase, i) => {
            const isHighlight = i === activePhase;
            return (
              <div key={phase.id} className={cn(
                'rounded-xl border p-3 transition-all cursor-pointer',
                isHighlight ? 'border-[#f5f5f5]/30 bg-[#f5f5f5]/5' :
                phase.status === 'complete' ? 'border-[#c9b787]/20 bg-white/3' :
                phase.status === 'active' ? 'border-[#c9b787]/30 bg-[#c9b787]/5' :
                'border-white/5 bg-white/[0.015]',
              )} onClick={() => setActivePhase(i)}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-[120px] shrink-0">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border',
                      phase.status === 'complete' ? 'bg-[#c9b787]/20 border-[#c9b787]/40 text-[#c9b787]' :
                      phase.status === 'active' ? 'bg-[#c9b787]/20 border-[#c9b787]/40 text-[#c9b787] animate-pulse' :
                      'bg-zinc-800 border-zinc-700 text-zinc-500',
                    )}>
                      {i + 1}
                    </span>
                    <div>
                      <span className="text-[11px] font-medium text-white block">{phase.phase}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">{phase.timeElapsed}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-[#c9b787] font-medium">{phase.technique}</span>
                    {isHighlight && <p className="text-[10px] text-zinc-400 mt-1">{phase.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] text-zinc-500 font-mono">{phase.aiAgent}</span>
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded border',
                      phase.status === 'complete' ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10' :
                      phase.status === 'active' ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10' :
                      'text-zinc-500 border-zinc-700 bg-zinc-800/50',
                    )}>
                      {phase.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{
            width: `${((activePhase + 1) / AUTONOMOUS_KILL_CHAIN.length) * 100}%`,
            background: 'linear-gradient(90deg, #c9b787, #f5f5f5)',
          }} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-[#8a8a8a]" />
            Multi-Agent Cloud Attack Chain (CrewAI/AutoGen PoC)
          </h2>
          <div className="space-y-2">
            {MULTI_AGENT_ATTACKS.map((agent) => (
              <div key={agent.id} className="rounded-xl border border-white/8 bg-white/3 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-[#c9b787]" />
                    <span className="text-[11px] font-medium text-white">{agent.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8a8a8a]/10 text-[#8a8a8a] border border-[#8a8a8a]/20 font-mono">{agent.framework}</span>
                  </div>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded border', STATUS_COLORS[agent.status])}>
                    {agent.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{agent.role} → {agent.target}</span>
                  <span className="font-mono">{agent.confidence}% detection</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#f5f5f5]" />
            Frontier AI Exposure Analysis
          </h2>
          <div className="space-y-2">
            {FRONTIER_EXPOSURES.map((exp) => (
              <div key={exp.id} className={cn(
                'rounded-xl border p-3',
                exp.severity === 'critical' ? 'border-[#f5f5f5]/20 bg-[#f5f5f5]/3' : 'border-white/8 bg-white/3',
              )}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[11px] font-medium text-white">{exp.vector}</span>
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded border shrink-0',
                    exp.severity === 'critical' ? 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10' : 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
                  )}>
                    {exp.severity}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 mb-1.5">{exp.exposure}</div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span className="text-[#c9b787]">Weaponization: {exp.weaponizationDays}d</span>
                  <span className="text-zinc-400">{exp.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
