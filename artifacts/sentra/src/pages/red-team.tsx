import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Crosshair,
  Flame,
  Loader2,
  PackageSearch,
  Play,
  ShieldOff,
  Siren,
  Target,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { RED_TEAM_SCENARIOS, type RedTeamScenario } from '@/data/hunt-data';

const CATEGORY_CONFIG: Record<RedTeamScenario['category'], { label: string; icon: typeof Flame; color: string }> = {
  ransomware: { label: 'Ransomware', icon: Flame, color: 'text-red-400' },
  supply_chain: { label: 'Supply Chain', icon: PackageSearch, color: 'text-orange-300' },
  insider: { label: 'Insider Threat', icon: Users, color: 'text-[#c9b787]' },
};

const SEVERITY_CONFIG = {
  critical: { label: 'CRITICAL', text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/5' },
  high: { label: 'HIGH', text: 'text-orange-300', border: 'border-orange-400/30', bg: 'bg-orange-400/5' },
  medium: { label: 'MED', text: 'text-[#c9b787]', border: 'border-[#c9b787]/30', bg: 'bg-[#c9b787]/5' },
};

type RunState = 'idle' | 'initializing' | 'running' | 'complete';

function MitreChainDisplay({ chain }: { chain: RedTeamScenario['mitreChain'] }) {
  const phases = Array.from(new Set(chain.map((c) => c.phase)));
  return (
    <div className="space-y-2">
      {phases.map((phase) => {
        const items = chain.filter((c) => c.phase === phase);
        return (
          <div key={phase} className="flex items-start gap-3">
            <span className="text-[9px] font-mono text-slate-600 w-28 shrink-0 pt-0.5 uppercase tracking-wider">
              {phase}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item) => (
                <span
                  key={item.id}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400"
                  title={item.name}
                >
                  {item.id}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: RedTeamScenario }) {
  const [expanded, setExpanded] = useState(false);
  const [runState, setRunState] = useState<RunState>('idle');
  const [runStep, setRunStep] = useState(0);
  const [gapsFound, setGapsFound] = useState<string[]>([]);

  const cat = CATEGORY_CONFIG[scenario.category];
  const sev = SEVERITY_CONFIG[scenario.severity];
  const Icon = cat.icon;

  const relativeLastRun = scenario.lastRunAt
    ? (() => {
        const h = Math.floor((Date.now() - new Date(scenario.lastRunAt).getTime()) / 3600000);
        return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
      })()
    : null;

  const handleDryRun = () => {
    setRunState('initializing');
    setRunStep(0);
    setGapsFound([]);

    setTimeout(() => {
      setRunState('running');
      let step = 0;
      const interval = setInterval(() => {
        step++;
        setRunStep(step);
        if (step >= scenario.mitreChain.length) {
          clearInterval(interval);
          setTimeout(() => {
            setRunState('complete');
            setGapsFound(scenario.coverageGaps);
          }, 600);
        }
      }, 800);
    }, 1000);
  };

  return (
    <div className="sentra-panel overflow-hidden">
      <button
        className="w-full text-left p-5"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              sev.bg,
              'border',
              sev.border,
            )}
          >
            <Icon className={cn('w-5 h-5', cat.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider',
                  sev.text,
                  sev.bg,
                  sev.border,
                )}
              >
                {sev.label}
              </span>
              <span className={cn('text-[10px] font-mono', cat.color)}>{cat.label}</span>
              {scenario.runCount > 0 && (
                <span className="text-[10px] font-mono text-slate-600">
                  {scenario.runCount} run{scenario.runCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1">{scenario.name}</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
              {scenario.description}
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            )}
            <div className="text-[10px] font-mono text-red-400">
              ${(scenario.estimatedCost / 1000000).toFixed(1)}M impact
            </div>
            {relativeLastRun && (
              <div className="text-[10px] font-mono text-slate-600">{relativeLastRun}</div>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-800 px-5 pb-5 pt-4 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                Objective
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{scenario.objective}</p>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                Estimated Impact
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{scenario.estimatedImpact}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600 font-mono">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />~{scenario.durationMinutes}m
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {scenario.mitreChain.length} techniques
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
              MITRE ATT&CK Chain
            </div>
            <MitreChainDisplay chain={scenario.mitreChain} />
          </div>

          {scenario.coverageGaps.length > 0 && runState !== 'running' && runState !== 'initializing' && (
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                {runState === 'complete' ? 'Gaps Discovered in Dry Run' : 'Known Coverage Gaps'}
              </div>
              <div className="space-y-2">
                {(runState === 'complete' ? gapsFound : scenario.runCount > 0 ? scenario.coverageGaps : []).map(
                  (gap, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#c9b787] shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-400">{gap}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {runState !== 'idle' && (
            <div
              className={cn(
                'rounded-lg border p-4',
                runState === 'complete'
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-sky-400/20 bg-sky-400/5',
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                {runState === 'complete' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
                )}
                <span
                  className={cn(
                    'text-[11px] font-mono uppercase tracking-wider',
                    runState === 'complete' ? 'text-emerald-400' : 'text-sky-400',
                  )}
                >
                  {runState === 'initializing'
                    ? 'Initializing Simulation…'
                    : runState === 'running'
                      ? `Simulating — Step ${runStep}/${scenario.mitreChain.length}`
                      : 'Dry Run Complete'}
                </span>
              </div>

              {runState !== 'initializing' && (
                <div className="space-y-1.5">
                  {scenario.mitreChain.slice(0, runStep).map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-slate-600">{step.id}</span>
                      <span className="text-slate-500">{step.name}</span>
                    </div>
                  ))}
                  {runState === 'running' && runStep < scenario.mitreChain.length && (
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <Loader2 className="w-3 h-3 text-sky-400 animate-spin shrink-0" />
                      <span className="text-sky-400">
                        {scenario.mitreChain[runStep]?.id} — {scenario.mitreChain[runStep]?.name}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {runState === 'complete' && gapsFound.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <div className="text-[10px] font-mono text-[#c9b787] uppercase tracking-wider mb-2">
                    {gapsFound.length} coverage gap{gapsFound.length !== 1 ? 's' : ''} identified
                  </div>
                  <div className="space-y-1">
                    {gapsFound.map((gap, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-[#c9b787] shrink-0 mt-0.5" />
                        <span className="text-[10px] text-slate-400">{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            {(runState === 'idle' || runState === 'complete') && (
              <button
                onClick={handleDryRun}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-400/30 bg-sky-400/10 text-sky-400 text-xs font-semibold hover:bg-sky-400/20 hover:border-sky-400/50 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                {runState === 'complete' ? 'Re-run Dry Run' : 'Dry Run Scenario'}
              </button>
            )}
            {(runState === 'running' || runState === 'initializing') && (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-500 text-xs font-semibold cursor-not-allowed"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Simulation Running…
              </button>
            )}
            <span className="text-[10px] text-slate-600 font-mono">Dry run only — no actual changes</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RedTeamPage() {
  const totalScenarios = RED_TEAM_SCENARIOS.length;
  const totalRuns = RED_TEAM_SCENARIOS.reduce((s, sc) => s + sc.runCount, 0);
  const scenariosWithGaps = RED_TEAM_SCENARIOS.filter((sc) => sc.coverageGaps.length > 0 && sc.runCount > 0).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <div className="flex items-center gap-3 mb-1">
          <Crosshair className="w-5 h-5 text-[#f5f5f5]/60" />
          <h1 className="text-2xl font-display font-bold text-slate-100">Red-Team Scenario Library</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 uppercase tracking-wider">
            Adversarial Simulation
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          Dry-run common attack patterns against your current defenses. Each scenario simulates a real
          threat chain and identifies coverage gaps without making production changes.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Scenarios', value: totalScenarios, color: 'text-[#f5f5f5]', icon: BookOpen },
          { label: 'Total Runs', value: totalRuns, color: 'text-sky-400', icon: Activity },
          {
            label: 'Gaps Found',
            value: scenariosWithGaps,
            color: 'text-[#c9b787]',
            icon: AlertTriangle,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="sentra-panel px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn('w-3.5 h-3.5', color)} />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {label}
              </span>
            </div>
            <div className={cn('text-xl font-mono font-bold', color)}>{value}</div>
          </div>
        ))}
      </div>

      <div className="sentra-panel p-4 flex items-start gap-3">
        <ShieldOff className="w-4 h-4 text-[#c9b787] shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-mono text-[#c9b787] uppercase tracking-wider mb-1">
            How Dry Runs Work
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Scenarios simulate the full MITRE ATT&CK kill chain using your current telemetry baselines and
            detection rules. No actual payloads are executed. The simulation walks each technique step and
            checks whether Sentra's current detection coverage would catch it — then reports gaps as
            actionable findings. Results can be escalated directly to the Hunt queue.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {RED_TEAM_SCENARIOS.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </div>

      <div className="text-center text-[10px] text-slate-600 font-mono pt-2">
        <Siren className="w-3 h-3 inline mr-1" />
        Scenarios model real adversary TTPs. Contact your security team before escalating to live testing.
      </div>
    </div>
  );
}
