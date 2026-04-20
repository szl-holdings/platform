import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Moon,
  Sun,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface IntiAction {
  id: string;
  timestamp: Date;
  agent: string;
  action: string;
  trigger: string;
  latency: number;
  outcome: 'completed' | 'escalated' | 'blocked';
}

interface MamaQuillaTask {
  id: string;
  agent: string;
  task: string;
  stage: 'gathering' | 'analyzing' | 'synthesizing' | 'delivering';
  progress: number;
  startedAt: Date;
  estimatedComplete: string;
  depth: 'shallow' | 'medium' | 'deep';
}

const INTI_ACTIONS_SEED: IntiAction[] = [
  {
    id: 'ia1',
    timestamp: new Date(Date.now() - 8000),
    agent: 'Maritime Analyst',
    action: 'Flagged dark vessel transition — MV Adriatic Star',
    trigger: 'AIS gap > 4h',
    latency: 340,
    outcome: 'completed',
  },
  {
    id: 'ia2',
    timestamp: new Date(Date.now() - 18000),
    agent: 'IT Sentinel',
    action: 'Auto-triaged P1 ticket #TKT-4821 to on-call engineer',
    trigger: 'CPU spike > 94%',
    latency: 210,
    outcome: 'completed',
  },
  {
    id: 'ia3',
    timestamp: new Date(Date.now() - 34000),
    agent: 'Security Sentinel',
    action: 'Blocked agent action: external API write without policy token',
    trigger: 'Policy violation',
    latency: 45,
    outcome: 'blocked',
  },
  {
    id: 'ia4',
    timestamp: new Date(Date.now() - 51000),
    agent: 'Brand Monitor',
    action: 'Sent reputation alert for negative Forbes mention',
    trigger: 'Sentiment < -0.7',
    latency: 180,
    outcome: 'completed',
  },
  {
    id: 'ia5',
    timestamp: new Date(Date.now() - 78000),
    agent: 'Creative Director',
    action: 'Escalated campaign anomaly to human review',
    trigger: 'CTR drop > 40%',
    latency: 290,
    outcome: 'escalated',
  },
];

const MAMA_QUILLA_TASKS: MamaQuillaTask[] = [
  {
    id: 'mq1',
    agent: 'Portfolio Analyst',
    task: 'Q1 2026 ecosystem health synthesis — 12 apps, 6 Lenses across all domains',
    stage: 'synthesizing',
    progress: 78,
    startedAt: new Date(Date.now() - 840000),
    estimatedComplete: '12 min',
    depth: 'deep',
  },
  {
    id: 'mq2',
    agent: 'Advisory Agent',
    task: 'Competitive landscape analysis: SZL vs. emerging PE-tech firms in advisory automation',
    stage: 'analyzing',
    progress: 45,
    startedAt: new Date(Date.now() - 1200000),
    estimatedComplete: '28 min',
    depth: 'deep',
  },
  {
    id: 'mq3',
    agent: 'IT Sentinel',
    task: 'Predictive model: infrastructure failure probability for next 7-day window based on 90-day patterns',
    stage: 'gathering',
    progress: 22,
    startedAt: new Date(Date.now() - 300000),
    estimatedComplete: '1h 10m',
    depth: 'medium',
  },
  {
    id: 'mq4',
    agent: 'Deal Scout',
    task: 'Miami Beach micro-market scenario modeling: 3 economic conditions × 5 property types',
    stage: 'analyzing',
    progress: 61,
    startedAt: new Date(Date.now() - 960000),
    estimatedComplete: '18 min',
    depth: 'deep',
  },
  {
    id: 'mq5',
    agent: 'Intelligence Router',
    task: 'Intelligence mesh optimization: re-routing analysis to reduce avg relay latency by 15%',
    stage: 'delivering',
    progress: 94,
    startedAt: new Date(Date.now() - 2400000),
    estimatedComplete: '4 min',
    depth: 'shallow',
  },
];

function generateIntiAction(): IntiAction {
  const actions = [
    {
      agent: 'Maritime Analyst',
      action: 'Real-time vessel reroute advisory issued',
      trigger: 'Storm system approaching',
    },
    {
      agent: 'IT Sentinel',
      action: 'Auto-resolved memory leak on MSP-DB-03',
      trigger: 'Memory > 92% for 5min',
    },
    {
      agent: 'Security Sentinel',
      action: 'Policy check passed — agent action approved',
      trigger: 'Routine audit',
    },
    {
      agent: 'Creative Director',
      action: 'Paused underperforming ad set #AD-2847',
      trigger: 'ROAS < 1.2x',
    },
    {
      agent: 'Brand Monitor',
      action: 'Captured and logged viral mention — Tech Crunch',
      trigger: 'Reach threshold exceeded',
    },
    {
      agent: 'Portfolio Analyst',
      action: 'Health score recalculated — Vessels: 84 → 87',
      trigger: 'Metric refresh cycle',
    },
  ];
  const outcomes: IntiAction['outcome'][] = [
    'completed',
    'completed',
    'completed',
    'escalated',
    'blocked',
  ];
  const choice = actions[Math.floor(Math.random() * actions.length)];
  return {
    id: Math.random().toString(36).slice(2, 8),
    timestamp: new Date(),
    ...choice,
    latency: 50 + Math.floor(Math.random() * 450),
    outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
  };
}

const STAGE_CONFIG = {
  gathering: {
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    bar: 'bg-blue-400',
    label: 'Gathering data',
  },
  analyzing: {
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    bar: 'bg-amber-400',
    label: 'Analyzing',
  },
  synthesizing: {
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    bar: 'bg-violet-400',
    label: 'Synthesizing',
  },
  delivering: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    bar: 'bg-emerald-400',
    label: 'Delivering',
  },
};

const DEPTH_CONFIG = {
  shallow: { label: 'Shallow', color: 'text-sky-400' },
  medium: { label: 'Medium', color: 'text-amber-400' },
  deep: { label: 'Deep', color: 'text-violet-400' },
};

export default function DualMindMonitor() {
  const [intiActions, setIntiActions] = useState<IntiAction[]>(INTI_ACTIONS_SEED);
  const [mamaQuillaTasks] = useState<MamaQuillaTask[]>(MAMA_QUILLA_TASKS);
  const [tick, setTick] = useState(0);
  const counterRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTick((k) => k + 1);
      counterRef.current++;
      if (counterRef.current % 4 === 0) {
        setIntiActions((prev) => [generateIntiAction(), ...prev.slice(0, 14)]);
      }
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const intiStats = {
    total: intiActions.length,
    completed: intiActions.filter((a) => a.outcome === 'completed').length,
    blocked: intiActions.filter((a) => a.outcome === 'blocked').length,
    escalated: intiActions.filter((a) => a.outcome === 'escalated').length,
    avgLatency: Math.round(intiActions.reduce((s, a) => s + a.latency, 0) / intiActions.length),
  };

  const mamaStats = {
    total: mamaQuillaTasks.length,
    inProgress: mamaQuillaTasks.filter((t) => t.stage !== 'delivering').length,
    delivering: mamaQuillaTasks.filter((t) => t.stage === 'delivering').length,
    avgProgress: Math.round(
      mamaQuillaTasks.reduce((s, t) => s + t.progress, 0) / mamaQuillaTasks.length,
    ),
  };

  const outcomeStyle = (outcome: IntiAction['outcome']) =>
    ({
      completed: { icon: CheckCircle2, color: 'text-emerald-400' },
      escalated: { icon: AlertCircle, color: 'text-amber-400' },
      blocked: { icon: AlertCircle, color: 'text-red-400' },
    })[outcome];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/15 flex items-center justify-center">
              <Sun className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-400/15 flex items-center justify-center">
              <Moon className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
            Dual-Mind Monitor
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="text-yellow-400">Inti</span> (System 1) — fast reflexive responses
          happening right now. &nbsp;
          <span className="text-indigo-400">Mama Quilla</span> (System 2) — deep reasoning tasks in
          progress. Inspired by the Inca dual-divinity of Sun and Moon.
        </p>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INTI — System 1 */}
        <div className="bg-gradient-to-br from-yellow-500/5 via-orange-500/3 to-transparent border border-yellow-400/20 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-yellow-400/15">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Sun className="w-5 h-5 text-yellow-400" />
                <div>
                  <h2 className="text-sm font-display font-bold text-yellow-400">
                    Inti — System 1
                  </h2>
                  <p className="text-[10px] text-muted-foreground">Reflexive real-time actions</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-[10px] font-mono text-yellow-400">ACTIVE</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Actions', value: intiStats.total, color: 'text-foreground' },
                { label: 'Completed', value: intiStats.completed, color: 'text-emerald-400' },
                { label: 'Escalated', value: intiStats.escalated, color: 'text-amber-400' },
                {
                  label: 'Avg Latency',
                  value: `${intiStats.avgLatency}ms`,
                  color: 'text-cyan-400',
                },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={cn('text-lg font-display font-bold', s.color)}>{s.value}</p>
                  <p className="text-[9px] text-muted-foreground font-mono">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-yellow-400/5 max-h-96 overflow-y-auto">
            {intiActions.map((action, i) => {
              const os = outcomeStyle(action.outcome);
              const OutcomeIcon = os.icon;
              return (
                <div
                  key={action.id}
                  className={cn(
                    'px-4 py-3 hover:bg-yellow-400/3 transition-all',
                    i === 0 ? 'bg-yellow-400/5' : '',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <OutcomeIcon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', os.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug">
                        {action.action}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {action.agent}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">·</span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {action.trigger}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {action.latency}ms
                      </p>
                      <p className="text-[9px] text-muted-foreground/50">
                        {Math.round((Date.now() - action.timestamp.getTime()) / 1000)}s ago
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAMA QUILLA — System 2 */}
        <div className="bg-gradient-to-br from-indigo-500/5 via-violet-500/3 to-transparent border border-indigo-400/20 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-indigo-400/15">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Moon className="w-5 h-5 text-indigo-400" />
                <div>
                  <h2 className="text-sm font-display font-bold text-indigo-400">
                    Mama Quilla — System 2
                  </h2>
                  <p className="text-[10px] text-muted-foreground">
                    Deep analytical reasoning in progress
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[10px] font-mono text-indigo-400">THINKING</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Tasks', value: mamaStats.total, color: 'text-foreground' },
                { label: 'In Progress', value: mamaStats.inProgress, color: 'text-indigo-400' },
                {
                  label: 'Avg Progress',
                  value: `${mamaStats.avgProgress}%`,
                  color: 'text-violet-400',
                },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={cn('text-lg font-display font-bold', s.color)}>{s.value}</p>
                  <p className="text-[9px] text-muted-foreground font-mono">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 space-y-4">
            {mamaQuillaTasks.map((task) => {
              const stage = STAGE_CONFIG[task.stage];
              const depth = DEPTH_CONFIG[task.depth];
              return (
                <div
                  key={task.id}
                  className="bg-indigo-400/5 rounded-xl border border-indigo-400/10 p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground mb-0.5">{task.agent}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {task.task}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0.5 rounded',
                          stage.bg,
                          stage.color,
                        )}
                      >
                        {stage.label}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground font-mono">
                        {task.progress}% complete
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={cn('font-mono', depth.color)}>depth: {depth.label}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="text-muted-foreground font-mono">
                          ETA: {task.estimatedComplete}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-[2000ms]',
                          stage.bar,
                        )}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System comparison */}
      <div className="bg-card/60 border border-border rounded-xl p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" />
          Dual-Mind Architecture — Design Philosophy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-yellow-400/5 border border-yellow-400/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sun className="w-4 h-4 text-yellow-400" />
              <h4 className="text-xs font-bold text-yellow-400">Inti — Sun God · System 1</h4>
            </div>
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              {[
                'Responds in milliseconds — no waiting for analysis',
                'Triggered by threshold breaches, anomalies, real-time events',
                'Auto-remediation, alerts, routing, escalation',
                'Low latency, high frequency, narrow scope',
                'Operates instinctively — like a reflex arc',
              ].map((item) => (
                <div key={item} className="flex items-start gap-1.5">
                  <span className="text-yellow-400/60 mt-0.5">→</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-indigo-400/5 border border-indigo-400/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-indigo-400">
                Mama Quilla — Moon Goddess · System 2
              </h4>
            </div>
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              {[
                'Takes minutes to hours — deliberate, thorough analysis',
                'Triggered by scheduled cycles, strategic questions, escalations',
                'Trend analysis, scenario modeling, strategic recommendations',
                'High quality, long-form outputs, broad scope',
                'Operates analytically — like deep strategic planning',
              ].map((item) => (
                <div key={item} className="flex items-start gap-1.5">
                  <span className="text-indigo-400/60 mt-0.5">→</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
