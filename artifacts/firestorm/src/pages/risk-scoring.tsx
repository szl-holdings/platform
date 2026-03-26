import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Shield, TrendingUp, TrendingDown, AlertTriangle, Minus } from "lucide-react";

function getScoreColor(score: number) {
  if (score < 30) return "text-emerald-400";
  if (score < 50) return "text-amber-400";
  if (score < 70) return "text-orange-400";
  return "text-red-400";
}

function getScoreBg(score: number) {
  if (score < 30) return "bg-emerald-500";
  if (score < 50) return "bg-amber-500";
  if (score < 70) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreLabel(score: number) {
  if (score < 30) return "Low Risk";
  if (score < 50) return "Moderate Risk";
  if (score < 70) return "High Risk";
  return "Critical Risk";
}

const trendIcons: Record<string, any> = {
  improving: TrendingDown,
  stable: Minus,
  degrading: TrendingUp,
};

const trendColors: Record<string, string> = {
  improving: "text-emerald-400",
  stable: "text-amber-400",
  degrading: "text-red-400",
};

const categoryLabels: Record<string, string> = {
  network: "Network Security",
  application: "Application Security",
  infrastructure: "Infrastructure",
  data_protection: "Data Protection",
  access_control: "Access Control",
  social_engineering: "Social Engineering",
  physical: "Physical Security",
  compliance: "Compliance",
};

export default function RiskScoringPage() {
  const { data: riskScores = [], isLoading } = useQuery({ queryKey: ["riskScores"], queryFn: () => api.riskScores.list() });
  const { data: assessments = [] } = useQuery({ queryKey: ["assessments"], queryFn: api.assessments.list });

  const avgScore = riskScores.length > 0
    ? riskScores.reduce((sum: number, r: any) => sum + Number(r.currentScore || 0), 0) / riskScores.length
    : 0;

  const categoryScores = riskScores.reduce((acc: Record<string, number[]>, r: any) => {
    const cat = r.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(Number(r.currentScore || 0));
    return acc;
  }, {} as Record<string, number[]>);

  const categoryAverages = Object.entries(categoryScores).map(([cat, scores]) => ({
    category: cat,
    avg: (scores as number[]).reduce((a: number, b: number) => a + b, 0) / (scores as number[]).length,
    count: (scores as number[]).length,
  })).sort((a, b) => b.avg - a.avg);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Risk Scoring</h1>
        <p className="text-sm text-muted-foreground mt-1">Aggregate risk scores across assessments and categories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Average Risk Score</p>
            <p className={`text-4xl font-bold font-display ${getScoreColor(avgScore)}`}>{avgScore.toFixed(1)}</p>
            <p className={`text-sm mt-1 ${getScoreColor(avgScore)}`}>{getScoreLabel(avgScore)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <Shield className="w-6 h-6 text-chart-4 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Scores</p>
            <p className="text-4xl font-bold font-display">{riskScores.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Across {assessments.length} assessments</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-6 h-6 text-chart-2 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">High Risk Areas</p>
            <p className="text-4xl font-bold font-display text-chart-2">{riskScores.filter((r: any) => Number(r.currentScore) >= 70).length}</p>
            <p className="text-sm text-muted-foreground mt-1">Score 70+</p>
          </CardContent>
        </Card>
      </div>

      {categoryAverages.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold mb-4">Risk by Category</h2>
          <div className="space-y-3">
            {categoryAverages.map(({ category, avg, count }) => (
              <Card key={category} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${getScoreBg(avg)}`} />
                      <div>
                        <p className="font-semibold text-sm">{categoryLabels[category] || category}</p>
                        <p className="text-xs text-muted-foreground">{count} score{count > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold font-display ${getScoreColor(avg)}`}>{avg.toFixed(1)}</p>
                      <p className={`text-xs ${getScoreColor(avg)}`}>{getScoreLabel(avg)}</p>
                    </div>
                  </div>
                  <Progress value={avg} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading risk scores...</div>
      ) : riskScores.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No risk scores available yet</div>
      ) : (
        <div>
          <h2 className="font-display text-lg font-semibold mb-4">All Risk Scores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskScores.map((score: any) => {
              const assessment = assessments.find((a: any) => a.id === score.assessmentId);
              const current = Number(score.currentScore || 0);
              const residual = score.residualScore ? Number(score.residualScore) : null;
              const TrendIcon = trendIcons[score.trend] || Minus;

              return (
                <Card key={score.id} className="bg-card border-border hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm">{categoryLabels[score.category] || score.category}</p>
                        {assessment && <p className="text-xs text-muted-foreground">{assessment.name}</p>}
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold font-display ${getScoreColor(current)}`}>{current.toFixed(1)}</p>
                        <div className={`flex items-center gap-1 text-xs ${trendColors[score.trend] || ""}`}>
                          <TrendIcon className="w-3 h-3" />
                          <span>{score.trend}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-muted/50 rounded p-2 text-center">
                        <p className="text-muted-foreground">Likelihood</p>
                        <p className="font-bold">{score.likelihood}</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2 text-center">
                        <p className="text-muted-foreground">Impact</p>
                        <p className="font-bold">{score.impact}</p>
                      </div>
                      {residual !== null && (
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <p className="text-muted-foreground">Residual</p>
                          <p className={`font-bold ${getScoreColor(residual)}`}>{residual.toFixed(1)}</p>
                        </div>
                      )}
                    </div>
                    {score.notes && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">{score.notes}</p>
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
