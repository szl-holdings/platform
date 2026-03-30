import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shared-ui/ui/select";
import { FileText, Shield, AlertTriangle, CheckCircle, BarChart3, Target, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const severityColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

function getScoreColor(score: number) {
  if (score < 30) return "text-emerald-400";
  if (score < 50) return "text-amber-400";
  if (score < 70) return "text-orange-400";
  return "text-red-400";
}

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    let cancelled = false;
    const startTime = performance.now();
    const step = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / 1000, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
      else ref.current = value;
    };
    requestAnimationFrame(step);
    return () => { cancelled = true; };
  }, [value]);
  return <>{display}</>;
}

export default function ReportsPage() {
  const { data: assessments = [] } = useQuery({ queryKey: ["assessments"], queryFn: api.assessments.list });
  const [selectedId, setSelectedId] = useState<string>("");
  const { data: report, isLoading, error } = useQuery({
    queryKey: ["report", selectedId],
    queryFn: () => api.reports.get(Number(selectedId)),
    enabled: !!selectedId,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold">Executive Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Executive-ready assessment reports with CVSS scoring, remediation timelines, and compliance evidence</p>
      </div>

      <Card className="bg-card border-border animate-fade-in-up stagger-1">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger><SelectValue placeholder="Select an assessment to generate report" /></SelectTrigger>
                <SelectContent>
                  {assessments.map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="bg-card border-border animate-fade-in-up">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Generating report...</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Compiling findings and risk data</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="bg-card border-border border-destructive/30 animate-fade-in-up">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive/50 mx-auto mb-3" />
            <p className="text-destructive font-medium">Failed to generate report</p>
          </CardContent>
        </Card>
      )}

      {!selectedId && (
        <Card className="bg-card border-border border-dashed animate-fade-in-up stagger-2">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">Select an assessment above to generate a detailed executive report</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Reports include findings, risk scores, and recommendations</p>
          </CardContent>
        </Card>
      )}

      {report && (
        <div className="space-y-6 animate-fade-in-up">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-xl">{report.assessment?.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Type: {report.assessment?.assessmentType?.replace("_", " ")} | Scope: {report.assessment?.scope || "N/A"} | Target: {report.assessment?.targetEnvironment || "N/A"}
                  </p>
                </div>
                <Badge variant="outline" className="text-sm">{report.assessment?.status?.replace("_", " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {report.assessment?.description && (
                <p className="text-sm text-muted-foreground">{report.assessment.description}</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border animate-fade-in-up stagger-1 hover:border-primary/20 transition-all duration-300 group">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Total Findings</p>
                <p className="text-2xl font-bold font-display"><AnimatedCounter value={report.summary?.totalFindings || 0} /></p>
              </CardContent>
            </Card>
            <Card className={`bg-card border-border animate-fade-in-up stagger-2 hover:border-red-500/20 transition-all duration-300 group ${(report.summary?.criticalCount || 0) > 0 ? "ring-1 ring-red-500/10" : ""}`}>
              <CardContent className="p-4 text-center">
                <div className={`w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform ${(report.summary?.criticalCount || 0) > 0 ? "animate-pulse" : ""}`}>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-xs text-muted-foreground">Critical</p>
                <p className={`text-2xl font-bold font-display text-red-400 ${(report.summary?.criticalCount || 0) > 0 ? "animate-threat-pulse" : ""}`}>
                  <AnimatedCounter value={report.summary?.criticalCount || 0} />
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border animate-fade-in-up stagger-3 hover:border-orange-500/20 transition-all duration-300 group">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5 text-orange-400" />
                </div>
                <p className="text-xs text-muted-foreground">High</p>
                <p className="text-2xl font-bold font-display text-orange-400"><AnimatedCounter value={report.summary?.highCount || 0} /></p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border animate-fade-in-up stagger-4 hover:border-primary/20 transition-all duration-300 group">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Risk Categories</p>
                <p className="text-2xl font-bold font-display"><AnimatedCounter value={report.summary?.riskCategories || 0} /></p>
              </CardContent>
            </Card>
          </div>

          {report.summary?.simulationsRun > 0 && (
            <Card className="bg-card border-border animate-fade-in-up stagger-5">
              <CardHeader>
                <CardTitle className="text-sm font-display">Red Team Exercise Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {report.summary.simulationsRun} exercise{report.summary.simulationsRun > 1 ? "s" : ""} completed
                </p>
              </CardContent>
            </Card>
          )}

          {report.findings && report.findings.length > 0 && (
            <div className="animate-fade-in-up stagger-5">
              <h2 className="font-display text-lg font-semibold mb-4">Finding Details</h2>
              <div className="space-y-3">
                {report.findings.map((finding: any, i: number) => {
                  const isCritical = finding.severity === "critical";
                  return (
                    <Card key={finding.id} className={`bg-card border-border hover:border-primary/20 transition-all duration-300 animate-fade-in-up stagger-${Math.min(i + 1, 8)} ${isCritical ? "ring-1 ring-red-500/10" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-sm">{finding.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${severityColors[finding.severity] || ""} ${isCritical ? "animate-threat-pulse" : ""}`}>
                              {finding.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{finding.status?.replace("_", " ")}</Badge>
                          </div>
                        </div>
                        {finding.description && <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {finding.affectedAsset && <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{finding.affectedAsset}</span>}
                          {finding.cvssScore && <span>CVSS: {Number(finding.cvssScore).toFixed(1)}</span>}
                          {finding.cveId && <span className="font-mono">{finding.cveId}</span>}
                        </div>
                        {finding.recommendation && (
                          <p className="text-xs text-emerald-400/80 mt-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {finding.recommendation}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {report.riskScores && report.riskScores.length > 0 && (
            <div className="animate-fade-in-up stagger-6">
              <h2 className="font-display text-lg font-semibold mb-4">Risk Score Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.riskScores.map((score: any, i: number) => {
                  const currentScore = Number(score.currentScore);
                  const isHighRisk = currentScore >= 70;
                  return (
                    <Card key={score.id} className={`bg-card border-border hover:border-primary/20 transition-all duration-300 animate-fade-in-up stagger-${Math.min(i + 1, 8)} ${isHighRisk ? "ring-1 ring-red-500/10" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm capitalize">{score.category?.replace("_", " ")}</p>
                          <p className={`text-lg font-bold font-display ${getScoreColor(currentScore)} ${isHighRisk ? "animate-threat-pulse" : ""}`}>
                            {currentScore.toFixed(1)}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-muted/50 rounded p-2 text-center hover:bg-muted/70 transition-colors"><p className="text-muted-foreground">Likelihood</p><p className="font-bold">{score.likelihood}</p></div>
                          <div className="bg-muted/50 rounded p-2 text-center hover:bg-muted/70 transition-colors"><p className="text-muted-foreground">Impact</p><p className="font-bold">{score.impact}</p></div>
                          {score.residualScore && <div className="bg-muted/50 rounded p-2 text-center hover:bg-muted/70 transition-colors"><p className="text-muted-foreground">Residual</p><p className="font-bold">{Number(score.residualScore).toFixed(1)}</p></div>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
