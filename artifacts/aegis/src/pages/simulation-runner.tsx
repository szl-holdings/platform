import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { doctrineEventBus } from '@szl-holdings/observability';
import { AnimatedCounter } from '@szl-holdings/shared-ui/animated-counter';
import { DoctrineLayerBadge } from '@szl-holdings/shared-ui/doctrine-layer-badge';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Card, CardContent, } from '@szl-holdings/shared-ui/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@szl-holdings/shared-ui/ui/dialog';
import { Input } from '@szl-holdings/shared-ui/ui/input';
import { Label } from '@szl-holdings/shared-ui/ui/label';
import { Progress } from '@szl-holdings/shared-ui/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@szl-holdings/shared-ui/ui/select';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { useRole } from '@szl-holdings/shared-ui/use-role';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle,
  Clock,
  Loader2,
  Lock,
  Play,
  Shield,
  Target,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const statusColors: Record<string, string> = {
  pending: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  running: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  aborted: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

function getScoreColor(score: number) {
  if (score < 30) return 'text-emerald-400';
  if (score < 50) return 'text-amber-400';
  if (score < 70) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreBg(score: number) {
  if (score < 30) return 'bg-emerald-500/10';
  if (score < 50) return 'bg-amber-500/10';
  if (score < 70) return 'bg-orange-500/10';
  return 'bg-red-500/10';
}

function AnimatedProgress({ value, className }: { value: number; className?: string }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setCurrent(value), 100);
    return () => clearTimeout(timer);
  }, [value]);
  return <Progress value={current} className={`${className} transition-all duration-1000`} />;
}

function SimSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="skeleton w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-3 w-56" />
          </div>
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const exercisePhases = [
  'Initializing emulation',
  'Enumerating targets',
  'Mapping attack surface',
  'Executing TTPs',
  'Generating debrief',
];

function RunningExerciseDisplay() {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % exercisePhases.length);
    }, 2500);
    const progInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 5, 95));
    }, 500);
    return () => {
      clearInterval(interval);
      clearInterval(progInterval);
    };
  }, []);
  return (
    <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 20px, hsl(var(--primary) / 0.1) 20px, hsl(var(--primary) / 0.1) 21px)',
          }}
        />
      </div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-medium">Exercise in progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            {exercisePhases.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${idx <= phase ? 'bg-amber-400' : 'bg-amber-400/20'}`}
              />
            ))}
          </div>
        </div>
        <AnimatedProgress value={progress} className="h-2" />
        <div className="flex items-center justify-between mt-2 text-xs text-amber-400/60">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {exercisePhases[phase]}...
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}

export default function AdversaryEmulation() {
  const { isSecurity, isAdmin, isLoading: rolesLoading } = useRole();
  const qc = useQueryClient();
  const { data: simulations = [], isLoading } = useStandardQuery({
    queryKey: ['simulations'],
    queryFn: api.simulations.list,
  });
  const { data: scenarios = [] } = useStandardQuery({
    queryKey: ['scenarios'],
    queryFn: api.scenarios.list,
  });
  const { data: assessments = [] } = useStandardQuery({
    queryKey: ['assessments'],
    queryFn: api.assessments.list,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', scenarioId: '', assessmentId: '' });

  interface SimulationItem {
    id: number;
    status: string;
    name?: string;
    riskScore?: number;
  }
  const allSimulations = simulations as SimulationItem[];
  const completedSimulations = allSimulations.filter((s) => s.status === 'completed');
  const runningSimulations = allSimulations.filter((s) => s.status === 'running');

  const accessDenied = !rolesLoading && !isSecurity && !isAdmin;

  useEffect(() => {
    if (completedSimulations.length > 0) {
      const latest = completedSimulations[0];
      const riskScore = latest?.riskScore ?? 0;
      const severity = riskScore > 70 ? 'critical' : riskScore > 40 ? 'warning' : 'info';
      doctrineEventBus.emit({
        type: 'anomaly',
        sourceApp: 'aegis',
        layer: 'UNDERSTAND',
        severity,
        title: 'Security simulation analysis complete',
        description: `PARAGON blast radius analysis: ${completedSimulations.length} simulation(s) completed. ${runningSimulations.length} currently running.`,
        entitiesInvolved: completedSimulations.slice(0, 3).map((s) => s.name ?? 'simulation'),
        context: {
          source: 'simulation-runner',
          sourceApp: 'aegis',
          severity: severity === 'critical' ? 'critical' : severity === 'warning' ? 'high' : 'low',
          confidence: 0.9,
          impactedEntities: completedSimulations.slice(0, 5).map((s) => s.name ?? 'simulation'),
          causalFactors: ['adversary emulation', 'attack path analysis', 'blast radius mapping'],
          suggestedNextAction:
            'Review simulation findings and apply recommended hardening controls',
          businessImpact: `Risk score: ${riskScore}/100 — ${severity === 'critical' ? 'critical' : severity === 'warning' ? 'significant' : 'minimal'} exposure identified`,
          operationalImpact: `${completedSimulations.length} simulation(s) complete; ${runningSimulations.length} running`,
          layer: 'UNDERSTAND',
          timestamp: Date.now(),
        },
        metadata: {
          completedCount: completedSimulations.length,
          runningCount: runningSimulations.length,
          source: 'simulation-runner',
        },
      });
    }
  }, [completedSimulations.length]);

  const createMut = useStandardMutation({
    mutationFn: (data: any) => api.simulations.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['simulations'] });
      setOpen(false);
      toast.success('Exercise launched');
      setTimeout(() => qc.invalidateQueries({ queryKey: ['simulations'] }), 5000);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (accessDenied) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Lock className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Security Access Required</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Launching and managing adversary simulations is restricted to users with the security
            role. Contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="font-display text-2xl font-bold">Adversary Emulation</h1>
            <DoctrineLayerBadge appId="aegis" variant="compact" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Controlled red team exercises using MITRE ATT&CK TTPs — validate detection coverage
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Play className="w-4 h-4 mr-2" /> Launch Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">New Red Team Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Exercise Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. APT29 Emulation — Q1 2026"
                />
              </div>
              <div>
                <Label>Playbook</Label>
                <Select
                  value={form.scenarioId}
                  onValueChange={(v) => setForm((p) => ({ ...p, scenarioId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select playbook" />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assessment</Label>
                <Select
                  value={form.assessmentId}
                  onValueChange={(v) => setForm((p) => ({ ...p, assessmentId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.map((a: any) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => {
                  if (!form.name || !form.scenarioId || !form.assessmentId) {
                    toast.error('All fields required');
                    return;
                  }
                  createMut.mutate({
                    name: form.name,
                    scenarioId: Number(form.scenarioId),
                    assessmentId: Number(form.assessmentId),
                  });
                }}
                disabled={createMut.isPending}
                className="w-full"
              >
                {createMut.isPending ? 'Launching...' : 'Launch Exercise'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border animate-fade-in-up stagger-1 hover:border-primary/20 transition-all duration-300 group">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Total Exercises
              </p>
              <p className="text-2xl font-bold font-display mt-1">
                <AnimatedCounter value={simulations.length} />
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card
          className={`bg-card border-border animate-fade-in-up stagger-2 hover:border-chart-3/20 transition-all duration-300 group ${simulations.filter((s: any) => s.status === 'running').length > 0 ? 'ring-1 ring-chart-3/10' : ''}`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">In Progress</p>
              <p className="text-2xl font-bold font-display mt-1 text-chart-3">
                <AnimatedCounter
                  value={simulations.filter((s: any) => s.status === 'running').length}
                />
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center group-hover:scale-110 transition-transform ${simulations.filter((s: any) => s.status === 'running').length > 0 ? 'animate-pulse' : ''}`}
            >
              <Clock className="w-5 h-5 text-chart-3" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in-up stagger-3 hover:border-chart-4/20 transition-all duration-300 group">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-bold font-display mt-1 text-chart-4">
                <AnimatedCounter
                  value={simulations.filter((s: any) => s.status === 'completed').length}
                />
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5 text-chart-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SimSkeleton key={i} />
          ))}
        </div>
      ) : simulations.length === 0 ? (
        <Card className="bg-card border-border border-dashed animate-fade-in-up stagger-4">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">No exercises launched yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Launch your first red team exercise to begin adversary emulation
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {simulations.map((sim: any, i: number) => {
            const scenario = scenarios.find((s: any) => s.id === sim.scenarioId);
            const assessment = assessments.find((a: any) => a.id === sim.assessmentId);
            const results = sim.results as any;
            const score = results?.overallScore ? Number(results.overallScore) : null;
            const isRunning = sim.status === 'running';

            return (
              <Card
                key={sim.id}
                className={`bg-card border-border transition-all duration-300 animate-fade-in-up stagger-${Math.min(i + 1, 8)} ${isRunning ? 'ring-1 ring-amber-500/20 animate-glow-border' : ''}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5 ${isRunning ? 'ring-1 ring-amber-500/20' : ''}`}
                      >
                        {isRunning ? (
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                        ) : sim.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : sim.status === 'failed' ? (
                          <XCircle className="w-5 h-5 text-red-400" />
                        ) : (
                          <Activity className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display font-semibold">{sim.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {scenario && (
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" /> {scenario.name}
                            </span>
                          )}
                          {assessment && (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" /> {assessment.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${statusColors[sim.status] || ''} ${isRunning ? 'animate-pulse' : ''}`}
                    >
                      {isRunning && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse-dot" />
                      )}
                      {sim.status}
                    </Badge>
                  </div>

                  {isRunning && <RunningExerciseDisplay />}

                  {sim.status === 'completed' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {score !== null && (
                        <div
                          className={`${getScoreBg(score)} rounded-lg p-3 text-center border border-transparent hover:border-primary/10 transition-colors`}
                        >
                          <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
                          <p className={`text-xl font-bold font-display ${getScoreColor(score)}`}>
                            {score.toFixed(1)}
                          </p>
                        </div>
                      )}
                      {results?.vulnerabilitiesFound !== undefined && (
                        <div className="bg-chart-2/10 rounded-lg p-3 text-center border border-transparent hover:border-chart-2/20 transition-colors">
                          <p className="text-xs text-muted-foreground mb-1">Vulnerabilities</p>
                          <p className="text-xl font-bold font-display text-chart-2">
                            {results.vulnerabilitiesFound}
                          </p>
                        </div>
                      )}
                      {results?.attackPathsIdentified !== undefined && (
                        <div className="bg-primary/10 rounded-lg p-3 text-center border border-transparent hover:border-primary/20 transition-colors">
                          <p className="text-xs text-muted-foreground mb-1">Attack Paths</p>
                          <p className="text-xl font-bold font-display text-primary">
                            {results.attackPathsIdentified}
                          </p>
                        </div>
                      )}
                      {results?.mitigationsApplied !== undefined && (
                        <div className="bg-chart-4/10 rounded-lg p-3 text-center border border-transparent hover:border-chart-4/20 transition-colors">
                          <p className="text-xs text-muted-foreground mb-1">Mitigations</p>
                          <p className="text-xl font-bold font-display text-chart-4">
                            {results.mitigationsApplied}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {results?.recommendations && Array.isArray(results.recommendations) && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Recommendations</p>
                      <ul className="space-y-1">
                        {results.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="text-xs flex items-start gap-2">
                            <Shield className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    {sim.startedAt && (
                      <span>Started: {new Date(sim.startedAt).toLocaleString()}</span>
                    )}
                    {sim.completedAt && (
                      <span>Completed: {new Date(sim.completedAt).toLocaleString()}</span>
                    )}
                    {sim.durationSeconds && <span>Duration: {sim.durationSeconds}s</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
