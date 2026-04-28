import { ActivityFeed } from '@szl-holdings/shared-ui/collaboration';
import { DataStateBadge } from '@szl-holdings/shared-ui/data-state-badge';
import { LiveClock as SharedLiveClock } from '@szl-holdings/shared-ui/live-clock';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  ArrowRight,
  ArrowUpDown,
  BarChart3,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  DollarSign,
  FlaskConical,
  GitBranch,
  GitMerge,
  Layers,
  Lightbulb,
  Radio,
  Shield,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'wouter';
import { experiments, getResearchHealthScore, insights, models, projects } from '@/data/seed-data';

function LiveClock() {
  return (
    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
        <span className="uppercase tracking-wider text-[#c9b787] text-[10px] font-semibold">
          Systems Nominal
        </span>
      </div>
      <span className="text-border">·</span>
      <SharedLiveClock format="local" />
    </div>
  );
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-[#c9b787]' : score >= 60 ? 'bg-[#c9b787]' : 'bg-[#f5f5f5]';
  const textColor =
    score >= 80 ? 'text-[#c9b787]' : score >= 60 ? 'text-[#c9b787]' : 'text-[#f5f5f5]';
  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'Degraded' : 'Critical';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Research Health
        </span>
        <span className={`text-xs font-mono font-bold ${textColor}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${color}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={`text-2xl font-display font-bold ${textColor} tabular-nums`}>{score}</span>
      </div>
      <div className="flex gap-2 text-[10px] text-muted-foreground/50 font-mono">
        <span>0</span>
        <span className="flex-1 text-center">50</span>
        <span>100</span>
      </div>
    </div>
  );
}

type SortKey = 'name' | 'accuracy' | 'loss' | 'status' | 'domain';
type SortDir = 'asc' | 'desc';

function ExperimentComparisonTable() {
  const [sortKey, setSortKey] = useState<SortKey>('accuracy');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'accuracy') cmp = a.accuracy - b.accuracy;
      else if (sortKey === 'loss') cmp = a.loss - b.loss;
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortKey === 'domain') cmp = a.domain.localeCompare(b.domain);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-2.5 h-2.5 text-muted-foreground/30" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-2.5 h-2.5 text-[#c9b787]" />
    ) : (
      <ChevronDown className="w-2.5 h-2.5 text-[#c9b787]" />
    );
  };

  const statusConfig: Record<string, { text: string; dot: string; label: string }> = {
    research: {
      text: 'text-[#8a8a8a]',
      dot: 'bg-[#8a8a8a]',
      label: 'bg-[#8a8a8a]/10 text-[#8a8a8a]',
    },
    development: {
      text: 'text-[#c9b787]',
      dot: 'bg-[#c9b787]',
      label: 'bg-[#c9b787]/10 text-[#c9b787]',
    },
    testing: {
      text: 'text-[#c9b787]',
      dot: 'bg-[#c9b787]',
      label: 'bg-[#c9b787]/10 text-[#c9b787]',
    },
    deployed: {
      text: 'text-[#c9b787]',
      dot: 'bg-[#c9b787]',
      label: 'bg-[#c9b787]/10 text-[#c9b787]',
    },
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-primary" />
          Experiments — Parallel Comparison
        </h3>
        <Link href="/intel/experiments">
          <span className="text-xs text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">
            All Experiments <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              {[
                { key: 'name' as SortKey, label: 'Project' },
                { key: 'domain' as SortKey, label: 'Domain' },
                { key: 'accuracy' as SortKey, label: 'Accuracy' },
                { key: 'loss' as SortKey, label: 'Loss' },
                { key: 'status' as SortKey, label: 'Status' },
              ].map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 font-mono text-[10px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort(col.key)}
                >
                  <span className="flex items-center gap-1.5">
                    {col.label} <SortIcon col={col.key} />
                  </span>
                </th>
              ))}
              <th className="text-left px-4 py-3 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                Runs
              </th>
              <th className="text-left px-4 py-3 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                Inference
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map((p) => {
              const projExps = experiments.filter((e) => e.projectId === p.id);
              const running = projExps.filter((e) => e.status === 'running').length;
              const completed = projExps.filter((e) => e.status === 'completed').length;
              const s = statusConfig[p.status] || statusConfig.research;
              return (
                <tr
                  key={p.id}
                  className="border-b border-border/40 hover:bg-muted/15 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {p.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                      {p.domain}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-mono font-bold text-sm',
                          p.accuracy >= 90
                            ? 'text-[#c9b787]'
                            : p.accuracy >= 70
                              ? 'text-[#c9b787]'
                              : 'text-[#f5f5f5]',
                        )}
                      >
                        {p.accuracy.toFixed(1)}%
                      </span>
                      <div className="w-12 h-1 bg-border rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            p.accuracy >= 90
                              ? 'bg-[#c9b787]'
                              : p.accuracy >= 70
                                ? 'bg-[#c9b787]'
                                : 'bg-[#f5f5f5]',
                          )}
                          style={{ width: `${p.accuracy}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground text-[11px]">
                    {p.loss.toFixed(4)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-[10px] font-mono uppercase px-2 py-1 rounded-full flex items-center gap-1 w-fit',
                        s.label,
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          s.dot,
                          p.status === 'testing' && 'animate-pulse',
                        )}
                      />
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                    {completed}
                    {running > 0 && <span className="text-[#c9b787] ml-1">+{running} ▶</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground text-[11px]">
                    {p.inferenceTime}ms
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const hyperparamImportance = [
  { param: 'learning_rate', importance: 0.42, range: '1e-5 to 1e-3' },
  { param: 'batch_size', importance: 0.28, range: '16 to 512' },
  { param: 'dropout', importance: 0.15, range: '0.1 to 0.5' },
  { param: 'warmup_steps', importance: 0.09, range: '100 to 5000' },
  { param: 'weight_decay', importance: 0.06, range: '0.01 to 0.1' },
];

function HyperparamImportance() {
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="w-3.5 h-3.5 text-primary" />
        Hyperparameter Importance
      </h3>
      <div className="space-y-3">
        {hyperparamImportance.map((h) => (
          <div key={h.param}>
            <div className="flex items-center justify-between mb-1 text-[11px]">
              <span className="font-mono text-foreground">{h.param}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{h.range}</span>
                <span className="font-bold text-primary">{(h.importance * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                style={{ width: `${h.importance * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/50 mt-3 font-mono">
        Shapley values across 847 completed runs
      </p>
    </div>
  );
}

const modelLineageNodes = [
  { id: 'titan-v1', label: 'TITAN v1', type: 'model', status: 'archived', x: 15, y: 20 },
  { id: 'exp-224', label: 'EXP-224', type: 'experiment', status: 'completed', x: 45, y: 10 },
  { id: 'exp-231', label: 'EXP-231', type: 'experiment', status: 'completed', x: 45, y: 35 },
  { id: 'titan-v2', label: 'TITAN v2', type: 'model', status: 'production', x: 75, y: 22 },
  { id: 'deploy-prod', label: 'PROD Deploy', type: 'deploy', status: 'live', x: 90, y: 22 },
];

function ModelLineage() {
  const colorMap: Record<string, string> = {
    model: '#8a8a8a',
    experiment: '#c9b787',
    deploy: '#c9b787',
    archived: '#64748b',
  };
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <GitMerge className="w-3.5 h-3.5 text-primary" />
        Model Lineage Graph
      </h3>
      <div className="relative h-32 bg-muted/10 rounded-lg border border-border/50 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
          {[
            [15, 20, 45, 10],
            [15, 20, 45, 35],
            [45, 10, 75, 22],
            [45, 35, 75, 22],
            [75, 22, 90, 22],
          ].map(([x1, y1, x2, y2]) => (
            <line
              key={`${x1}-${y1}-${x2}-${y2}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(138,138,138,0.3)"
              strokeWidth="0.8"
              markerEnd="url(#arrow)"
            />
          ))}
          {modelLineageNodes.map((node) => {
            const color = node.status === 'archived' ? '#64748b' : colorMap[node.type] || '#8a8a8a';
            return (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y} r="4" fill={color} opacity="0.2" />
                <circle cx={node.x} cy={node.y} r="3" fill={color} opacity="0.9" />
                <text
                  x={node.x}
                  y={node.y + 8}
                  textAnchor="middle"
                  fontSize="3.5"
                  fill="rgba(255,255,255,0.6)"
                  fontFamily="monospace"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#8a8a8a] inline-block" />
          Model
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#c9b787] inline-block" />
          Experiment
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#c9b787] inline-block" />
          Deploy
        </span>
      </div>
    </div>
  );
}

const gpuOptRecs = [
  {
    cluster: 'A100 80GB',
    usage: 94,
    costPerFlop: '$0.0042',
    recommendation: 'Scale down during off-peak (02:00–06:00 UTC)',
    savings: '$1,840/mo',
  },
  {
    cluster: 'H100 SXM',
    usage: 78,
    costPerFlop: '$0.0061',
    recommendation: 'Migrate batch jobs to A100 cluster',
    savings: '$3,200/mo',
  },
  {
    cluster: 'TPU v4 Pod',
    usage: 62,
    costPerFlop: '$0.0038',
    recommendation: 'Consolidate 3 small experiments',
    savings: '$890/mo',
  },
];

function GPUOptimization() {
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <DollarSign className="w-3.5 h-3.5 text-[#c9b787]" />
        GPU Cost-Per-FLOP Optimization
      </h3>
      <div className="space-y-3">
        {gpuOptRecs.map((g) => (
          <div key={g.cluster} className="p-3 rounded-lg border border-border/50 bg-muted/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">{g.cluster}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {g.costPerFlop}/FLOP
                </span>
                <span className="text-[10px] font-bold text-[#c9b787]">Save {g.savings}</span>
              </div>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden mb-2">
              <div
                className={cn(
                  'h-full rounded-full',
                  g.usage > 90 ? 'bg-[#f5f5f5]' : g.usage > 75 ? 'bg-[#c9b787]' : 'bg-[#c9b787]',
                )}
                style={{ width: `${g.usage}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">{g.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const collaborativeReport = {
  title: 'Q1 2026 Research Report',
  authors: ['Dr. Chen', 'M. Rodriguez', 'S. Park'],
  highlights: [
    'TITAN v2 achieves 91.8 MMLU — 3.2pts above baseline',
    'PARAGON lateral collision avoidance: 69.4 nuScenes mAP',
    'GPU cost reduced 18% via workload consolidation',
  ],
};

function ModelPerformanceCharts() {
  const prodModels = models
    .filter((m) => m.status === 'production' || m.status === 'staging')
    .slice(0, 4);

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
          Model Performance Trends
        </h3>
        <Link href="/intel/models">
          <span className="text-xs text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">
            All Models <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prodModels.map((model) => {
          const chartData = (model.performanceHistory || []).map((h) => ({
            date: new Date(h.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            accuracy: h.accuracy,
          }));
          return (
            <div key={model.id} className="bg-muted/10 rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">{model.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {model.architecture} v{model.version}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      'text-[10px] font-mono px-2 py-0.5 rounded-full',
                      model.status === 'production'
                        ? 'text-[#c9b787] bg-[#c9b787]/10'
                        : 'text-[#c9b787] bg-[#c9b787]/10',
                    )}
                  >
                    {model.status}
                  </span>
                  <p
                    className={cn(
                      'text-xl font-display font-bold mt-0.5',
                      model.accuracy >= 90 ? 'text-[#c9b787]' : 'text-[#c9b787]',
                    )}
                  >
                    {model.accuracy.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={8}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={8}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        borderColor: '#333',
                        borderRadius: '6px',
                        fontSize: '10px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#c9b787"
                      strokeWidth={2}
                      dot={false}
                      name="Accuracy %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const healthScore = getResearchHealthScore();
  const activeProjects = projects.length;
  const runningExperiments = experiments.filter((e) => e.status === 'running').length;
  const deployedModels = models.filter((m) => m.status === 'production').length;
  const highImpactInsights = insights.filter((i) => i.impact === 'high').length;
  const meanAcc = (projects.reduce((s, p) => s + p.accuracy, 0) / projects.length).toFixed(1);

  const recentExperiments = experiments
    .filter((e) => e.status === 'running' || e.status === 'completed')
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 6);

  const topInsights = insights.filter((i) => i.impact === 'high').slice(0, 4);

  const categoryColors: Record<string, string> = {
    success: 'text-[#c9b787]',
    warning: 'text-[#c9b787]',
    trend: 'text-[#c9b787]',
    discovery: 'text-[#8a8a8a]',
  };

  const pipelineStages = [
    {
      label: 'Research',
      count: projects.filter((p) => p.status === 'research').length,
      color: 'bg-[#8a8a8a]',
      textColor: 'text-[#8a8a8a]',
    },
    {
      label: 'Dev',
      count: projects.filter((p) => p.status === 'development').length,
      color: 'bg-[#c9b787]',
      textColor: 'text-[#c9b787]',
    },
    {
      label: 'Testing',
      count: projects.filter((p) => p.status === 'testing').length,
      color: 'bg-[#c9b787]',
      textColor: 'text-[#c9b787]',
    },
    {
      label: 'Deployed',
      count: projects.filter((p) => p.status === 'deployed').length,
      color: 'bg-[#c9b787]',
      textColor: 'text-[#c9b787]',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
              Agentic Intelligence NEXUS
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#c9b787]/10 text-[#c9b787]/80 border border-[#c9b787]/15">
              AI Engine v2.1
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            The nervous system of the SZL ecosystem — 9 domain agents active, 6 Lenses as sensory
            perception, AI intelligence mesh online.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DataStateBadge state="seeded" label="Seed Data" />
          <LiveClock />
        </div>
      </div>

      {/* AI NEXUS Summary Banner */}
      <div className="relative bg-gradient-to-r from-amber-500/8 via-yellow-500/5 to-emerald-500/5 border border-[#c9b787]/15 rounded-xl p-5 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(60deg, #c9b787 0px, #c9b787 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-60deg, #c9b787 0px, #c9b787 1px, transparent 1px, transparent 20px)',
          }}
        />
        <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            {
              name: 'AI Engine',
              role: 'Agentic Core',
              desc: '9 nodes active',
              icon: '⌇',
              color: 'text-[#c9b787]',
            },
            {
              name: 'Policy Shield',
              role: 'Immune System',
              desc: 'Shield: nominal',
              icon: '◈',
              color: 'text-[#c9b787]',
            },
            {
              name: 'Intelligence Mesh',
              role: 'Signal Network',
              desc: '12 nodes online',
              icon: '⬡',
              color: 'text-[#8a8a8a]',
            },
            {
              name: 'AI Advisor',
              role: 'Model Oracle',
              desc: '6 models online',
              icon: '◎',
              color: 'text-[#8a8a8a]',
            },
            {
              name: 'Signal Router',
              role: 'Privacy Router',
              desc: '1.2K req/min',
              icon: '▶',
              color: 'text-[#c9b787]',
            },
            {
              name: 'Dual-Mode Engine',
              role: 'Reflex + Deep',
              desc: '6 reflex · 3 deep',
              icon: '☀◑',
              color: 'text-[#c9b787]',
            },
          ].map((layer) => (
            <div key={layer.name} className="text-center">
              <div
                className="text-2xl mb-1"
                style={{
                  color: layer.color.replace('text-', '').includes('-') ? undefined : undefined,
                }}
              >
                <span className={layer.color}>{layer.icon}</span>
              </div>
              <p className={`text-[11px] font-bold font-mono ${layer.color}`}>{layer.name}</p>
              <p className="text-[9px] text-muted-foreground/50">{layer.role}</p>
              <p className="text-[10px] text-foreground/70 font-mono mt-0.5">{layer.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Programs',
            value: activeProjects,
            icon: Brain,
            color: 'text-[#c9b787]',
            bg: 'bg-[#c9b787]/10',
            trend: '+2 Q1',
          },
          {
            label: 'Running',
            value: runningExperiments,
            icon: FlaskConical,
            color: 'text-[#c9b787]',
            bg: 'bg-[#c9b787]/10',
            trend: 'active now',
          },
          {
            label: 'Deployed',
            value: deployedModels,
            icon: Cpu,
            color: 'text-[#c9b787]',
            bg: 'bg-[#c9b787]/10',
            trend: '+1 this month',
          },
          {
            label: 'High-Impact',
            value: highImpactInsights,
            icon: Lightbulb,
            color: 'text-[#8a8a8a]',
            bg: 'bg-[#8a8a8a]/10',
            trend: 'insights',
          },
          {
            label: 'Avg Accuracy',
            value: `${meanAcc}%`,
            icon: Activity,
            color: 'text-[#8a8a8a]',
            bg: 'bg-[#8a8a8a]/10',
            trend: '+2.1% vs Q4',
          },
          {
            label: 'Health',
            value: healthScore,
            icon: Shield,
            color: healthScore >= 80 ? 'text-[#c9b787]' : 'text-[#c9b787]',
            bg: healthScore >= 80 ? 'bg-[#c9b787]/10' : 'bg-[#c9b787]/10',
            trend: 'score',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 hover:border-primary/20 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
              </div>
            </div>
            <p className={cn('text-2xl font-display font-bold', stat.color)}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
            <p className="text-[9px] text-muted-foreground/50 mt-0.5 font-mono">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl px-5 py-4">
        <HealthBar score={healthScore} />
      </div>

      <ExperimentComparisonTable />

      {/* New W&B-style features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HyperparamImportance />
        <ModelLineage />
      </div>

      <GPUOptimization />

      {/* Collaborative Report Builder */}
      <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-primary" />
            Collaborative Report Builder
          </h3>
          <span className="text-[10px] text-[#c9b787] font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
            Live · 3 contributors
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-muted/10 rounded-lg border border-border/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-foreground">{collaborativeReport.title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c9b787]/10 text-[#c9b787] font-mono">
                Draft
              </span>
            </div>
            <div className="space-y-2">
              {collaborativeReport.highlights.map((h) => (
                <div key={h} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-[#c9b787] shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Contributors
            </p>
            {collaborativeReport.authors.map((a) => (
              <div
                key={a}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/10 border border-border/50"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                  {a.split(' ').pop()?.[0]}
                </div>
                <span className="text-xs text-foreground">{a}</span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <ModelPerformanceCharts />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-primary" />
              Pipeline
            </h3>
            <Link href="/intel/projects">
              <span className="text-xs text-primary cursor-pointer flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <div className="space-y-2.5">
            {pipelineStages.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0',
                    s.color,
                  )}
                >
                  {s.count}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                    <span className={cn('text-[10px] font-mono', s.textColor)}>
                      {Math.round((s.count / projects.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className={cn(s.color, 'h-full rounded-full')}
                      style={{ width: `${(s.count / projects.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-primary" />
            Live Feed
          </h3>
          <div className="space-y-2">
            {recentExperiments.map((exp) => {
              const project = projects.find((p) => p.id === exp.projectId);
              return (
                <div
                  key={exp.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors border border-transparent hover:border-border/50"
                >
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      exp.status === 'running' ? 'bg-[#c9b787] animate-pulse' : 'bg-[#c9b787]',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{exp.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{project?.name}</p>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0',
                      exp.status === 'running'
                        ? 'text-[#c9b787] bg-[#c9b787]/10'
                        : 'text-[#c9b787] bg-[#c9b787]/10',
                    )}
                  >
                    {exp.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
              Priority Insights
            </h3>
            <Link href="/intel/insights">
              <span className="text-xs text-primary cursor-pointer flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <div className="space-y-2.5">
            {topInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-3 rounded-lg border border-border/50 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={cn(
                      'text-[10px] font-mono uppercase',
                      categoryColors[insight.category],
                    )}
                  >
                    {insight.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                    {insight.confidence}%
                  </span>
                </div>
                <p className="text-xs text-foreground leading-snug">{insight.title}</p>
              </div>
            ))}
          </div>
        </div>
        <ActivityFeed entityType="experiment" title="Research Team Activity" limit={8} compact />
      </div>
    </div>
  );
}
