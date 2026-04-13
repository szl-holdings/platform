import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Activity, RefreshCw,
  Zap, Eye, Bug, Lock, TrendingDown, Play, ChevronDown, ChevronUp,
  Filter, Info, BarChart3, Loader2
} from "lucide-react";

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f97316",
  gemini: "#60a5fa",
  meta: "#a78bfa",
  alibaba: "#f43f5e",
  microsoft: "#22d3ee",
};

const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/25", text: "text-red-400" },
  high: { color: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/25", text: "text-orange-400" },
  medium: { color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-400" },
  low: { color: "#60a5fa", bg: "bg-blue-500/10", border: "border-blue-500/25", text: "text-blue-400" },
};

const STATUS_CONFIG = {
  active: { label: "Active", color: "text-red-400", icon: AlertTriangle },
  cleared: { label: "Cleared", color: "text-emerald-400", icon: CheckCircle },
  mitigated: { label: "Mitigated", color: "text-amber-400", icon: Shield },
  disputed: { label: "Disputed", color: "text-blue-400", icon: Info },
};

const SCAN_STATUS_CONFIG = {
  passed: { color: "text-emerald-400", icon: CheckCircle, badge: "badge-running" },
  warning: { color: "text-amber-400", icon: AlertTriangle, badge: "badge-warning" },
  failed: { color: "text-red-400", icon: XCircle, badge: "badge-error" },
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{className?: string}>> = {
  "prompt-injection": Zap,
  "data-leakage": Eye,
  "toxicity": AlertTriangle,
  "adversarial": Bug,
  "bias": BarChart3,
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 88 ? "#22c55e" : score >= 75 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</div>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <div className="text-xs font-mono w-8 text-right" style={{ color }}>{score}</div>
    </div>
  );
}

export function ModelSecurityScanning() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"dashboard" | "vulnerabilities" | "scans">("dashboard");
  const [vulnStatusFilter, setVulnStatusFilter] = useState<string>("All");
  const [vulnSeverityFilter, setVulnSeverityFilter] = useState<string>("All");
  const [expandedVuln, setExpandedVuln] = useState<string | null>(null);

  const scansQuery = useQuery({
    queryKey: ["inca-security-scans"],
    queryFn: () => api.getSecurityScans(),
    staleTime: 30_000,
  });

  const scanMutation = useMutation({
    mutationFn: (modelId: string) => api.triggerScan(modelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inca-security-scans"] });
      qc.invalidateQueries({ queryKey: ["inca-model-catalog"] });
    },
  });

  const scans = scansQuery.data?.data.scans ?? [];
  const vulnerabilities = scansQuery.data?.data.vulnerabilities ?? [];
  const summary = scansQuery.data?.data.summary ?? { avgFleetScore: 0, activeVulnerabilities: 0, failedScans: 0, policyBlocked: 0 };

  const filteredVulns = vulnerabilities.filter(v => {
    if (vulnStatusFilter !== "All" && v.status !== vulnStatusFilter) return false;
    if (vulnSeverityFilter !== "All" && v.severity !== vulnSeverityFilter) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Model Security Scanning</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Automated security evaluation: prompt injection resistance, toxicity scoring, data leakage probes, and adversarial robustness. Agentic real-time vulnerability monitoring.
        </p>
      </div>

      {scansQuery.isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading security scan data…</span>
        </div>
      )}

      {scansQuery.isError && (
        <div className="inca-panel p-4 border-red-500/20 text-sm text-red-400 flex items-center gap-2 mb-5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Failed to load scan data: {scansQuery.error?.message}
        </div>
      )}

      {!scansQuery.isLoading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Fleet Security Score</div>
              <div className={cn("text-xl font-display font-bold", summary.avgFleetScore >= 85 ? "text-emerald-400" : summary.avgFleetScore >= 70 ? "text-amber-400" : "text-red-400")}>{summary.avgFleetScore}</div>
              <div className="text-xs text-muted-foreground">avg across {scans.length} models</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Active Vulnerabilities</div>
              <div className={cn("text-xl font-display font-bold", summary.activeVulnerabilities > 0 ? "text-red-400" : "text-foreground")}>{summary.activeVulnerabilities}</div>
              <div className="text-xs text-muted-foreground">require remediation</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Failed Scans</div>
              <div className={cn("text-xl font-display font-bold", summary.failedScans > 0 ? "text-red-400" : "text-foreground")}>{summary.failedScans}</div>
              <div className="text-xs text-muted-foreground">below threshold</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Policy Blocked</div>
              <div className={cn("text-xl font-display font-bold", summary.policyBlocked > 0 ? "text-amber-400" : "text-foreground")}>{summary.policyBlocked}</div>
              <div className="text-xs text-muted-foreground">score &lt;75 threshold</div>
            </div>
          </div>

          <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit">
            <button onClick={() => setTab("dashboard")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "dashboard" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Shield className="w-3.5 h-3.5" /> Security Dashboard
            </button>
            <button onClick={() => setTab("vulnerabilities")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "vulnerabilities" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Bug className="w-3.5 h-3.5" /> Vulnerability Intelligence
            </button>
            <button onClick={() => setTab("scans")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "scans" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Activity className="w-3.5 h-3.5" /> Scan Results
            </button>
          </div>

          {tab === "dashboard" && (
            <div className="space-y-4">
              <div className="inca-panel p-4">
                <div className="text-sm font-medium text-foreground mb-4">Fleet Security Posture — Per Model</div>
                <div className="space-y-4">
                  {scans.map((scan) => {
                    const statusCfg = SCAN_STATUS_CONFIG[scan.status];
                    const StatusIcon = statusCfg.icon;
                    return (
                      <div key={scan.id} className="border-b border-border/40 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[scan.provider] || "#888" }} />
                            <span className="text-sm font-medium text-foreground">{scan.model}</span>
                            <span className={cn("flex items-center gap-1 text-xs", statusCfg.color)}>
                              <StatusIcon className="w-3 h-3" /> {scan.status}
                            </span>
                            {scan.vulnerabilitiesFound > 0 && (
                              <span className="badge-warning px-1.5 py-0.5 rounded text-xs">{scan.vulnerabilitiesFound} vuln{scan.vulnerabilitiesFound > 1 ? "s" : ""}</span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={cn("text-lg font-display font-bold", scan.overallScore >= 88 ? "text-emerald-400" : scan.overallScore >= 75 ? "text-amber-400" : "text-red-400")}>{scan.overallScore}</div>
                            <div className="text-xs text-muted-foreground">overall</div>
                          </div>
                        </div>
                        <div className="space-y-1.5 ml-4">
                          <ScoreBar score={scan.promptInjectionScore} label="Prompt Injection" />
                          <ScoreBar score={scan.toxicityScore} label="Toxicity" />
                          <ScoreBar score={scan.dataLeakageScore} label="Data Leakage" />
                          <ScoreBar score={scan.adversarialRobustnessScore} label="Adversarial" />
                          <ScoreBar score={scan.biasScore} label="Bias" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="inca-panel p-4">
                <div className="text-sm font-medium text-foreground mb-3">Policy Engine — Automatic Blocking Rules</div>
                <div className="space-y-2">
                  {[
                    { rule: "Overall security score < 75", action: "Block production deployment", triggered: scans.filter(r => r.overallScore < 75).length > 0, models: scans.filter(r => r.overallScore < 75).map(r => r.model) },
                    { rule: "Active critical/high vulnerability", action: "Flag for human review", triggered: vulnerabilities.filter(v => v.status === "active" && (v.severity === "critical" || v.severity === "high")).length > 0, models: [...new Set(vulnerabilities.filter(v => v.status === "active" && (v.severity === "critical" || v.severity === "high")).map(v => v.model))] },
                    { rule: "Data leakage score < 70", action: "Restrict PII use cases", triggered: scans.filter(r => r.dataLeakageScore < 70).length > 0, models: scans.filter(r => r.dataLeakageScore < 70).map(r => r.model) },
                    { rule: "Prompt injection score < 70", action: "Require output sanitization", triggered: scans.filter(r => r.promptInjectionScore < 70).length > 0, models: scans.filter(r => r.promptInjectionScore < 70).map(r => r.model) },
                  ].map(({ rule, action, triggered, models }) => (
                    <div key={rule} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", triggered ? "bg-amber-500/20" : "bg-emerald-500/20")}>
                        {triggered ? <AlertTriangle className="w-3 h-3 text-amber-400" /> : <CheckCircle className="w-3 h-3 text-emerald-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-foreground">{rule}</div>
                        <div className="text-xs text-muted-foreground">→ {action}</div>
                        {triggered && models.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {models.map(m => (
                              <span key={m} className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">{m}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "vulnerabilities" && (
            <div>
              <div className="flex flex-wrap gap-3 mb-4">
                <select value={vulnStatusFilter} onChange={e => setVulnStatusFilter(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                  {["All", "active", "cleared", "mitigated", "disputed"].map(s => <option key={s}>{s}</option>)}
                </select>
                <select value={vulnSeverityFilter} onChange={e => setVulnSeverityFilter(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                  {["All", "critical", "high", "medium", "low"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                {filteredVulns.map((vuln) => {
                  const sev = SEVERITY_CONFIG[vuln.severity];
                  const statusCfg = STATUS_CONFIG[vuln.status];
                  const StatusIcon = statusCfg.icon;
                  const CatIcon = CATEGORY_ICONS[vuln.category] || Shield;
                  const isExpanded = expandedVuln === vuln.id;

                  return (
                    <div key={vuln.id} className="inca-panel overflow-hidden">
                      <button
                        className="w-full p-4 text-left"
                        onClick={() => setExpandedVuln(isExpanded ? null : vuln.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0", sev.bg, sev.border, "border")}>
                            <CatIcon className={cn("w-4 h-4", sev.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-medium text-foreground">{vuln.title}</span>
                              <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium border capitalize", sev.bg, sev.border, sev.text)}>{vuln.severity}</span>
                              <span className={cn("flex items-center gap-1 text-xs", statusCfg.color)}>
                                <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono">{vuln.cveId}</span>
                              <span>Model: {vuln.model}</span>
                              <span>CVSS: <span className={cn("font-mono", sev.text)}>{vuln.cvssScore}</span></span>
                              <span>Updated: {vuln.updatedDate}</span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-border/50 pt-3 animate-fade-in space-y-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Description</div>
                            <div className="text-sm text-foreground leading-relaxed bg-secondary rounded-lg p-3">{vuln.description}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Remediation Guidance</div>
                            <div className="text-sm text-foreground leading-relaxed bg-primary/5 border border-primary/15 rounded-lg p-3">{vuln.remediation}</div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Category: <span className="text-foreground capitalize">{vuln.category.replace("-", " ")}</span></span>
                            <span>Discovered: {vuln.discoveredDate}</span>
                            <span>Provider: <span className="text-foreground capitalize">{vuln.provider}</span></span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredVulns.length === 0 && (
                  <div className="inca-panel p-10 text-center">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">No vulnerabilities match the current filters.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "scans" && (
            <div className="space-y-3">
              {scans.map((scan) => {
                const statusCfg = SCAN_STATUS_CONFIG[scan.status];
                const StatusIcon = statusCfg.icon;
                const providerColor = PROVIDER_COLORS[scan.provider] || "#888";
                const isRunning = scanMutation.isPending && scanMutation.variables === scan.modelId;

                return (
                  <div key={scan.id} className="inca-panel p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${providerColor}18`, border: `1px solid ${providerColor}30` }}>
                        <Shield className="w-4 h-4" style={{ color: providerColor }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-foreground">{scan.model}</span>
                          <span className="text-xs text-muted-foreground capitalize font-mono">{scan.provider}</span>
                          <span className={cn("flex items-center gap-1 text-xs", statusCfg.color)}>
                            <StatusIcon className="w-3 h-3" /> {scan.status}
                          </span>
                          {scan.vulnerabilitiesFound > 0 && (
                            <span className="badge-warning px-1.5 py-0.5 rounded text-xs">{scan.vulnerabilitiesFound} vulnerability{scan.vulnerabilitiesFound > 1 ? " issues" : ""}</span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <ScoreBar score={scan.promptInjectionScore} label="Prompt Injection" />
                          <ScoreBar score={scan.toxicityScore} label="Toxicity" />
                          <ScoreBar score={scan.dataLeakageScore} label="Data Leakage" />
                          <ScoreBar score={scan.adversarialRobustnessScore} label="Adversarial" />
                          <ScoreBar score={scan.biasScore} label="Bias" />
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Scanned: {scan.scanDate}</span>
                          <span>Duration: {(scan.scanDurationMs / 1000).toFixed(0)}s</span>
                          <span>Overall: <span className={cn("font-mono", scan.overallScore >= 88 ? "text-emerald-400" : scan.overallScore >= 75 ? "text-amber-400" : "text-red-400")}>{scan.overallScore}</span></span>
                        </div>
                      </div>
                      <button
                        onClick={() => scanMutation.mutate(scan.modelId)}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-secondary border border-border rounded-lg hover:border-primary/40 hover:text-primary transition-all flex-shrink-0 disabled:opacity-50"
                      >
                        {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        {isRunning ? "Scanning…" : "Re-scan"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
