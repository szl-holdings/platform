import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  Cloud,
  Eye,
  Loader2,
  Skull,
  Target,
  Timer,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  type FrontierAiThreatLabResponse,
  getFrontierAiThreatLabPage,
} from '../lib/sentra-api';

const STATUS_COLORS: Record<string, string> = {
  attacking: 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10',
  detected: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  contained: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  evaded: 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10',
};

export default function FrontierAIThreatLab() {
  const [data, setData] = useState<FrontierAiThreatLabResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState(4);
  const [simRunning, setSimRunning] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getFrontierAiThreatLabPage()
      .then((res) => {
        if (!active) return;
        if (!res) {
          setError('Unable to load Frontier AI Threat Lab data.');
        } else {
          setData(res);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!simRunning || !data) return;
    const len = data.killChain.length;
    const iv = setInterval(() => {
      setActivePhase((p) => (p + 1) % len);
    }, 3000);
    return () => clearInterval(iv);
  }, [simRunning, data]);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-xs text-zinc-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading Frontier AI Threat Lab…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[#f5f5f5]/30 bg-[#f5f5f5]/5 p-4 text-xs text-[#f5f5f5]">
          {error ?? 'Frontier AI Threat Lab data unavailable.'}
        </div>
      </div>
    );
  }

  const { killChain, multiAgentAttacks, frontierExposures, metrics } = data;

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
          { label: 'Full Ransomware Chain', value: metrics.fullChainDuration, sub: 'AI agent autonomous execution', color: '#f5f5f5', icon: Skull },
          { label: 'AI Specialist Agents', value: metrics.aiSpecialistAgents.toString(), sub: 'per kill chain phase', color: '#c9b787', icon: Bot },
          { label: 'CVE Weaponization', value: metrics.cveWeaponizationDays, sub: 'AI-accelerated exploit dev', color: '#c9b787', icon: Target },
          { label: 'Detection Gap', value: metrics.detectionGap, sub: 'between breach and detection', color: '#f5f5f5', icon: Eye },
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
          Autonomous Kill-Chain Simulator — {metrics.fullChainDuration} Ransomware Chain
        </h2>
        <div className="space-y-1.5">
          {killChain.map((phase, i) => {
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
            width: `${((activePhase + 1) / killChain.length) * 100}%`,
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
            {multiAgentAttacks.map((agent) => (
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
            {frontierExposures.map((exp) => (
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
