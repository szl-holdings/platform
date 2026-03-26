import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Shield, AlertTriangle, CheckCircle, Download, BarChart3, Target } from "lucide-react";
import { useState } from "react";

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

function getScoreLabel(score: number) {
  if (score < 30) return "Low Risk";
  if (score < 50) return "Moderate Risk";
  if (score < 70) return "High Risk";
  return "Critical Risk";
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
      <div>
        <h1 className="font-display text-2xl font-bold">Executive Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate comprehensive security assessment reports</p>
      </div>

      <Card className="bg-card border-border">
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
        <div className="text-center py-12 text-muted-foreground">Generating report...</div>
      )}

      {error && (
        <div className="text-center py-12 text-destructive">Failed to generate report</div>
      )}

      {!selectedId && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Select an assessment above to generate a detailed executive report</p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
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
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Target className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Total Findings</p>
                <p className="text-2xl font-bold font-display">{report.summary?.totalFindings || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold font-display text-red-400">{report.summary?.criticalCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Shield className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">High</p>
                <p className="text-2xl font-bold font-display text-orange-400">{report.summary?.highCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Risk Categories</p>
                <p className="text-2xl font-bold font-display">
                  {report.summary?.riskCategories || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {report.summary?.simulationsRun > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm font-display">Simulation Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {report.summary.simulationsRun} simulation{report.summary.simulationsRun > 1 ? "s" : ""} executed
                </p>
              </CardContent>
            </Card>
          )}

          {report.findings && report.findings.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold mb-4">Finding Details</h2>
              <div className="space-y-3">
                {report.findings.map((finding: any) => (
                  <Card key={finding.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{finding.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={severityColors[finding.severity] || ""}>{finding.severity}</Badge>
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
                ))}
              </div>
            </div>
          )}

          {report.riskScores && report.riskScores.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold mb-4">Risk Score Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.riskScores.map((score: any) => (
                  <Card key={score.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-sm capitalize">{score.category?.replace("_", " ")}</p>
                        <p className={`text-lg font-bold font-display ${getScoreColor(Number(score.currentScore))}`}>{Number(score.currentScore).toFixed(1)}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-muted/50 rounded p-2 text-center"><p className="text-muted-foreground">Likelihood</p><p className="font-bold">{score.likelihood}</p></div>
                        <div className="bg-muted/50 rounded p-2 text-center"><p className="text-muted-foreground">Impact</p><p className="font-bold">{score.impact}</p></div>
                        {score.residualScore && <div className="bg-muted/50 rounded p-2 text-center"><p className="text-muted-foreground">Residual</p><p className="font-bold">{Number(score.residualScore).toFixed(1)}</p></div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
