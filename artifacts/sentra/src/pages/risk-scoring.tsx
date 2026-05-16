import { useStandardQuery } from '@szl-holdings/api-client-react';
import { AnimatedCounter } from '@szl-holdings/shared-ui/animated-counter';
import { Card, CardContent } from '@szl-holdings/shared-ui/ui/card';
import { Progress } from '@szl-holdings/shared-ui/ui/progress';
import {
  AlertTriangle,
  Brain,
  Cpu,
  Gauge,
  Minus,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getMLModelRegistry, getMLDriftStatus } from '@/lib/sentra-api';

function getScoreColor(score: number) {
  if (score < 30) return 'text-[#c9b787]';
  if (score < 50) return 'text-[#c9b787]';
  if (score < 70) return 'text-[#c9b787]';
  return 'text-[#f5f5f5]';
}

function getScoreBg(score: number) {
  if (score < 30) return 'bg-[#c9b787]';
  if (score < 50) return 'bg-[#c9b787]';
  if (score < 70) return 'bg-[#c9b787]';
  return 'bg-[#f5f5f5]';
}

function getScoreLabel(score: number) {
  if (score < 30) return 'Low Risk';
  if (score < 50) return 'Moderate Risk';
  if (score < 70) return 'High Risk';
  return 'Critical Risk';
}

function getScoreRingColor(score: number) {
  if (score < 30) return 'stroke-emerald-400';
  if (score < 50) return 'stroke-amber-400';
  if (score < 70) return 'stroke-orange-400';
  return 'stroke-red-400';
}

const trendIcons: Record<string, any> = {
  improving: TrendingDown,
  stable: Minus,
  degrading: TrendingUp,
};

const trendColors: Record<string, string> = {
  improving: 'text-[#c9b787]',
  stable: 'text-[#c9b787]',
  degrading: 'text-[#f5f5f5]',
};

const categoryLabels: Record<string, string> = {
  network: 'Network Security',
  application: 'Application Security',
  infrastructure: 'Infrastructure',
  data_protection: 'Data Protection',
  access_control: 'Access Control',
  social_engineering: 'Social Engineering',
  physical: 'Physical Security',
  compliance: 'Compliance',
};

function AnimatedProgress({ value, className }: { value: number; className?: string }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setCurrent(value), 100);
    return () => clearTimeout(timer);
  }, [value]);
  return <Progress value={current} className={`${className} transition-all duration-1000`} />;
}

function RiskGauge({ score, size = 120 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);
  const radius = (size - 16) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size / 2 + 16 }}
    >
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        <path
          d={`M 8 ${size / 2 + 8} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 8}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M 8 ${size / 2 + 8} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 8}`}
          fill="none"
          className={getScoreRingColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <p className={`text-2xl font-bold font-display ${getScoreColor(score)}`}>
          <AnimatedCounter value={score} />
        </p>
      </div>
    </div>
  );
}

function RiskSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1.5">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-24" />
          </div>
          <div className="skeleton h-6 w-12" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-12 rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RiskScoringPage() {
  const { data: riskScores = [], isLoading } = useStandardQuery({
    queryKey: ['riskScores'],
    queryFn: () => api.riskScores.list(),
  });
  const { data: assessments = [] } = useStandardQuery({
    queryKey: ['assessments'],
    queryFn: api.assessments.list,
  });

  const { data: mlRegistry } = useQuery({
    queryKey: ['sentra-ml-registry'],
    queryFn: getMLModelRegistry,
    staleTime: 5 * 60_000,
  });

  const { data: driftStatus } = useQuery({
    queryKey: ['sentra-ml-drift'],
    queryFn: getMLDriftStatus,
    staleTime: 5 * 60_000,
  });

  const avgScore =
    riskScores.length > 0
      ? riskScores.reduce((sum: number, r: any) => sum + Number(r.currentScore || 0), 0) /
        riskScores.length
      : 0;

  const categoryScores = riskScores.reduce(
    (acc: Record<string, number[]>, r: any) => {
      const cat = r.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(Number(r.currentScore || 0));
      return acc;
    },
    {} as Record<string, number[]>,
  );

  const categoryAverages = Object.entries(categoryScores)
    .map(([cat, scores]) => ({
      category: cat,
      avg:
        (scores as number[]).reduce((a: number, b: number) => a + b, 0) /
        (scores as number[]).length,
      count: (scores as number[]).length,
    }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Risk Scoring</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Risk scores by category, assessment rollup, and remediation priority
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] text-[#c9b787] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
              ML Scoring Live
            </span>
          </div>
        </div>
      </div>

      {mlRegistry && mlRegistry.models.length > 0 && (
        <div className="rounded-xl border border-[#c9b787]/20 bg-[#c9b787]/5 p-4 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-[#c9b787]" />
            <span className="text-xs font-semibold text-[#c9b787]">ML Scoring Registry — Sentra Risk Intelligence</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#c9b787]/30 bg-[#c9b787]/10 text-[#c9b787] font-mono uppercase ml-auto">
              {mlRegistry.models.filter(m => m.status === 'production').length} Production
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {mlRegistry.models.map(model => {
              const drift = driftStatus?.models.find(d => d.modelId === model.modelId);
              return (
                <div key={model.modelId} className="rounded-lg border border-white/8 bg-white/3 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#8a8a8a]" />
                      <span className="text-[11px] font-medium text-white">{model.displayName}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#c9b787]/30 bg-[#c9b787]/10 text-[#c9b787]">
                      {model.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-2 leading-snug">{model.description}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Accuracy</span>
                    <span className="text-[#c9b787] font-mono">{(model.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  {drift && (
                    <div className="flex items-center justify-between text-[10px] mt-0.5">
                      <span className="text-zinc-500">Drift PSI</span>
                      <span className={drift.psiScore < 0.1 ? 'text-[#c9b787] font-mono' : 'text-[#f5f5f5] font-mono'}>
                        {drift.psiScore.toFixed(3)} ({drift.driftStatus})
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border animate-fade-in-up stagger-1 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-6 text-center">
            <RiskGauge score={avgScore} />
            <p className={`text-sm mt-2 ${getScoreColor(avgScore)}`}>{getScoreLabel(avgScore)}</p>
            <p className="text-xs text-muted-foreground mt-1">Average Risk Score</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in-up stagger-2 hover:border-chart-4/20 transition-all duration-300 group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-chart-4/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-chart-4" />
            </div>
            <p className="text-4xl font-bold font-display">
              <AnimatedCounter value={riskScores.length} decimals={0} />
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Across {assessments.length} assessments
            </p>
            <p className="text-xs text-muted-foreground">Total Scores</p>
          </CardContent>
        </Card>
        <Card
          className={`bg-card border-border animate-fade-in-up stagger-3 hover:border-chart-2/20 transition-all duration-300 group ${riskScores.filter((r: any) => Number(r.currentScore) >= 70).length > 0 ? 'ring-1 ring-chart-2/10' : ''}`}
        >
          <CardContent className="p-6 text-center">
            <div
              className={`w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform ${riskScores.filter((r: any) => Number(r.currentScore) >= 70).length > 0 ? 'animate-pulse' : ''}`}
            >
              <AlertTriangle className="w-6 h-6 text-chart-2" />
            </div>
            <p className="text-4xl font-bold font-display text-chart-2">
              <AnimatedCounter
                value={riskScores.filter((r: any) => Number(r.currentScore) >= 70).length}
                decimals={0}
              />
            </p>
            <p className="text-sm text-muted-foreground mt-1">Score 70+</p>
            <p className="text-xs text-muted-foreground">High Risk Areas</p>
          </CardContent>
        </Card>
      </div>

      {categoryAverages.length > 0 && (
        <div className="animate-fade-in-up stagger-4">
          <h2 className="font-display text-lg font-semibold mb-4">Risk by Category</h2>
          <div className="space-y-3">
            {categoryAverages.map(({ category, avg, count }, i) => {
              const isHighRisk = avg >= 70;
              return (
                <Card
                  key={category}
                  className={`bg-card border-border hover:border-primary/20 transition-all duration-300 animate-fade-in-up stagger-${Math.min(i + 1, 8)} ${isHighRisk ? 'ring-1 ring-red-500/10' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-8 rounded-full ${getScoreBg(avg)} ${isHighRisk ? 'animate-pulse' : ''}`}
                        />
                        <div>
                          <p className="font-semibold text-sm">
                            {categoryLabels[category] || category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {count} score{count > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold font-display ${getScoreColor(avg)}`}>
                          <AnimatedCounter value={avg} />
                        </p>
                        <p className={`text-xs ${getScoreColor(avg)}`}>{getScoreLabel(avg)}</p>
                      </div>
                    </div>
                    <AnimatedProgress value={avg} className="h-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <RiskSkeleton key={i} />
          ))}
        </div>
      ) : riskScores.length === 0 ? (
        <Card className="bg-card border-border border-dashed animate-fade-in-up stagger-5">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <Gauge className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">No risk scores available yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Risk scores will populate once assessments generate results
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-in-up stagger-5">
          <h2 className="font-display text-lg font-semibold mb-4">All Risk Scores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskScores.map((score: any, i: number) => {
              const assessment = assessments.find((a: any) => a.id === score.assessmentId);
              const current = Number(score.currentScore || 0);
              const residual = score.residualScore ? Number(score.residualScore) : null;
              const TrendIcon = trendIcons[score.trend] || Minus;
              const isHighRisk = current >= 70;

              return (
                <Card
                  key={score.id}
                  className={`bg-card border-border hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up stagger-${Math.min((i % 6) + 1, 8)} ${isHighRisk ? 'ring-1 ring-red-500/10' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm">
                          {categoryLabels[score.category] || score.category}
                        </p>
                        {assessment && (
                          <p className="text-xs text-muted-foreground">{assessment.name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xl font-bold font-display ${getScoreColor(current)} ${isHighRisk ? 'animate-threat-pulse' : ''}`}
                        >
                          <AnimatedCounter value={current} />
                        </p>
                        <div
                          className={`flex items-center gap-1 text-xs ${trendColors[score.trend] || ''}`}
                        >
                          <TrendIcon className="w-3 h-3" />
                          <span>{score.trend}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-muted/50 rounded p-2 text-center hover:bg-muted/70 transition-colors">
                        <p className="text-muted-foreground">Likelihood</p>
                        <p className="font-bold">{score.likelihood}</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2 text-center hover:bg-muted/70 transition-colors">
                        <p className="text-muted-foreground">Impact</p>
                        <p className="font-bold">{score.impact}</p>
                      </div>
                      {residual !== null && (
                        <div className="bg-muted/50 rounded p-2 text-center hover:bg-muted/70 transition-colors">
                          <p className="text-muted-foreground">Residual</p>
                          <p className={`font-bold ${getScoreColor(residual)}`}>
                            {residual.toFixed(1)}
                          </p>
                        </div>
                      )}
                    </div>
                    {score.notes && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                        {score.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
