import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Button } from "@workspace/shared-ui/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/shared-ui/ui/dialog";
import { Input } from "@workspace/shared-ui/ui/input";
import { Label } from "@workspace/shared-ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shared-ui/ui/select";
import { Textarea } from "@workspace/shared-ui/ui/textarea";
import { Progress } from "@workspace/shared-ui/ui/progress";
import {
  Shield, Play, CheckCircle, Clock, AlertTriangle,
  Activity, Target, Zap, User, CalendarDays, ChevronDown,
  ChevronRight, XCircle, RefreshCw, Info
} from "lucide-react";
import { type ElementType, useState } from "react";
import { toast } from "sonner";

interface AuditEntry { action: string; user: string; at: string; }
interface SimulationRun {
  id: number;
  name: string;
  scenario?: string | null;
  status: string;
  mode: string;
  outcome?: string | null;
  gapsFound?: string[];
  linkedAssets?: string[];
  owner?: string | null;
  dueDate?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  detectionRate?: number | null;
  meanTimeToDetect?: number | null;
  coverage?: { tested: number; detected: number; missed: number };
  recommendedActions?: string[];
  auditTrail?: AuditEntry[];
  parameters?: Record<string, unknown>;
}

const DEMO_SIMULATIONS: SimulationRun[] = [
  {
    id: 1, name: "Q1 2026 — Credential Stuffing Defense Validation", scenario: "Brute Force & Credential Stuffing", status: "completed", mode: "controlled", outcome: "partial_pass", gapsFound: ["MFA bypass via legacy SSO endpoint", "Rate limiting not applied to /api/auth/login", "No IP reputation check on authentication endpoint"], linkedAssets: ["auth-service-cluster", "admin-portal-sso"], owner: "Morgan Lee", dueDate: "2026-04-05", startedAt: "2026-03-15T09:00:00Z", completedAt: "2026-03-15T14:30:00Z", detectionRate: 72, meanTimeToDetect: 18, coverage: { tested: 8, detected: 6, missed: 2 }, recommendedActions: ["Apply rate limiting to auth endpoint", "Enable IP reputation check", "Patch legacy SSO endpoint"], auditTrail: [{ action: "Simulation authorized by CISO", user: "CISO", at: "2026-03-14T16:00:00Z" }, { action: "Simulation started", user: "Morgan Lee", at: "2026-03-15T09:00:00Z" }, { action: "Completed — gaps logged", user: "System", at: "2026-03-15T14:30:00Z" }]
  },
  {
    id: 2, name: "Q1 2026 — Lateral Movement Detection Test", scenario: "East-West Lateral Movement", status: "completed", mode: "controlled", outcome: "fail", gapsFound: ["No network segmentation between payment and customer-data subnets", "Windows SMB lateral movement not detected by EDR", "Service account token reuse across segments not flagged"], linkedAssets: ["customer-data-db-primary", "payment-api-v3", "aws-eks-prod-cluster"], owner: "Riley Torres", dueDate: "2026-04-10", startedAt: "2026-03-20T10:00:00Z", completedAt: "2026-03-20T16:00:00Z", detectionRate: 34, meanTimeToDetect: 45, coverage: { tested: 9, detected: 3, missed: 6 }, recommendedActions: ["Implement network segmentation between payment and DB subnets", "Tune EDR rules for SMB lateral movement", "Rotate service account tokens quarterly"], auditTrail: [{ action: "Authorized by Security Director", user: "Security Director", at: "2026-03-19T15:00:00Z" }, { action: "Simulation started", user: "Riley Torres", at: "2026-03-20T10:00:00Z" }, { action: "Completed — critical gaps found", user: "System", at: "2026-03-20T16:00:00Z" }]
  },
  {
    id: 3, name: "Q1 2026 — Data Exfiltration Prevention Test", scenario: "Data Exfiltration via HTTP/S", status: "completed", mode: "controlled", outcome: "pass", gapsFound: [], linkedAssets: ["customer-data-db-primary", "prod-api-gateway-01"], owner: "Marcus Webb", dueDate: "2026-03-28", startedAt: "2026-03-25T09:00:00Z", completedAt: "2026-03-25T12:00:00Z", detectionRate: 94, meanTimeToDetect: 4, coverage: { tested: 6, detected: 6, missed: 0 }, recommendedActions: ["Continue current DLP controls", "Extend monitoring to DNS exfiltration patterns"], auditTrail: [{ action: "Authorized", user: "CISO", at: "2026-03-24T14:00:00Z" }, { action: "Completed — all controls held", user: "System", at: "2026-03-25T12:00:00Z" }]
  },
  {
    id: 4, name: "Q2 2026 — Ransomware Defense Validation (Scheduled)", scenario: "Ransomware Propagation Simulation", status: "pending", mode: "controlled", outcome: null, gapsFound: [], linkedAssets: ["endpoint-win-fleet", "customer-data-db-primary"], owner: "Morgan Lee", dueDate: "2026-04-25", startedAt: null, completedAt: null, detectionRate: null, meanTimeToDetect: null, coverage: { tested: 0, detected: 0, missed: 0 }, recommendedActions: [], auditTrail: [{ action: "Simulation scheduled by CISO", user: "CISO", at: "2026-03-28T10:00:00Z" }]
  },
];

const SCENARIO_TEMPLATES = [
  "Brute Force & Credential Stuffing",
  "East-West Lateral Movement",
  "Data Exfiltration via HTTP/S",
  "Phishing Simulation (Internal)",
  "Ransomware Propagation Simulation",
  "API Abuse & Authorization Bypass",
  "Privilege Escalation Detection",
  "Supply Chain Compromise Simulation",
];

const statusConfig: Record<string, { color: string; label: string; icon: ElementType }> = {
  pending: { color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", label: "Scheduled", icon: Clock },
  running: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Running", icon: Activity },
  completed: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Completed", icon: CheckCircle },
  failed: { color: "bg-red-500/10 text-red-400 border-red-500/20", label: "Failed", icon: XCircle },
  aborted: { color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", label: "Aborted", icon: XCircle },
};

const outcomeConfig: Record<string, { color: string; label: string }> = {
  pass: { color: "text-emerald-400", label: "Pass" },
  partial_pass: { color: "text-amber-400", label: "Partial Pass" },
  fail: { color: "text-red-400", label: "Fail" },
};

export default function SimulationPanelPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", scenario: "", owner: "", dueDate: "", notes: "" });

  const { data: rawSims, isLoading } = useQuery<SimulationRun[]>({
    queryKey: ["firestorm-simulations"],
    queryFn: () => api.simulations.list() as Promise<SimulationRun[]>,
    placeholderData: DEMO_SIMULATIONS,
  });

  const simulations: SimulationRun[] = (rawSims && rawSims.length > 0) ? rawSims : DEMO_SIMULATIONS;

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.simulations.create({ name: data.name, mode: "controlled", parameters: { scenario: data.scenario, owner: data.owner, dueDate: data.dueDate, notes: data.notes } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["firestorm-simulations"] });
      setOpen(false);
      toast.success("Simulation scheduled and authorized");
      setForm({ name: "", scenario: "", owner: "", dueDate: "", notes: "" });
    },
    onError: () => toast.error("Failed to schedule simulation"),
  });

  const workflowMutation = useMutation({
    mutationFn: ({ entityId, actionType, assignedTo }: { entityId: number; actionType: string; assignedTo?: string }) =>
      api.workflowActions.create({ entityType: "simulation", entityId, actionType, assignedTo }),
    onSuccess: () => toast.success("Workflow action triggered via AlloyScape"),
    onError: () => toast.error("Failed to trigger workflow"),
  });

  const completed = simulations.filter(s => s.status === "completed").length;
  const pending = simulations.filter(s => s.status === "pending").length;
  const totalGaps = simulations.reduce((sum, s) => sum + (s.gapsFound?.length ?? 0), 0);
  const avgDetection = (() => {
    const withRate = simulations.filter(s => s.detectionRate != null);
    if (withRate.length === 0) return null;
    return Math.round(withRate.reduce((sum, s) => sum + (s.detectionRate ?? 0), 0) / withRate.length);
  })();

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            Simulation Panel
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">Authorized defensive validation simulations — scenario, status, outcome, and control gaps</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500 bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-1.5 w-fit">
            <Info className="w-3 h-3 text-blue-400" />
            <span className="text-blue-300/80">Defensive validation only — all simulations are authorized, controlled, and logged. No offensive exploit tooling.</span>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Play className="w-3.5 h-3.5" />
              Schedule Simulation
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">New Defensive Validation Simulation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-2 text-[11px] text-blue-300/80 flex items-start gap-1.5">
                <Shield className="w-3 h-3 mt-0.5 text-blue-400 flex-shrink-0" />
                All simulations require prior authorization. Controlled, internal, and defensive scope only.
              </div>
              <div>
                <Label className="text-zinc-300 text-xs">Simulation Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Q2 Phishing Defense Test" className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-300 text-xs">Scenario Template</Label>
                <Select value={form.scenario} onValueChange={v => setForm(p => ({ ...p, scenario: v }))}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 mt-1">
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {SCENARIO_TEMPLATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-300 text-xs">Assigned Owner</Label>
                  <Input value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} placeholder="e.g. Morgan Lee" className="bg-zinc-900 border-zinc-700 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-300 text-xs">Due Date</Label>
                  <Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="bg-zinc-900 border-zinc-700 text-white mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-zinc-300 text-xs">Notes / Authorization Reference</Label>
                <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Authorization ticket, scope, constraints..." className="bg-zinc-900 border-zinc-700 text-white mt-1" rows={3} />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!form.name || !form.scenario) { toast.error("Name and scenario required"); return; }
                  createMutation.mutate(form);
                }}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Scheduling..." : "Schedule Simulation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-emerald-400 font-medium mb-1">Completed</div>
            <div className="text-3xl font-bold text-emerald-400">{completed}</div>
            <div className="text-[10px] text-zinc-500 mt-1">This quarter</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-700">
          <CardContent className="p-4">
            <div className="text-xs text-zinc-400 font-medium mb-1">Scheduled</div>
            <div className="text-3xl font-bold text-zinc-300">{pending}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Upcoming</div>
          </CardContent>
        </Card>
        <Card className={`${totalGaps > 0 ? "bg-red-500/5 border-red-500/20" : "bg-zinc-900/50 border-zinc-700"}`}>
          <CardContent className="p-4">
            <div className={`text-xs font-medium mb-1 ${totalGaps > 0 ? "text-red-400" : "text-zinc-400"}`}>Control Gaps Found</div>
            <div className={`text-3xl font-bold ${totalGaps > 0 ? "text-red-400" : "text-zinc-500"}`}>{totalGaps}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Require remediation</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-blue-400 font-medium mb-1">Avg Detection Rate</div>
            <div className="text-3xl font-bold text-blue-400">{avgDetection !== null ? `${avgDetection}%` : "—"}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Across completed sims</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          Loading simulations…
        </div>
      ) : simulations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500 text-sm gap-2">
          <Shield className="w-8 h-8 text-zinc-700" />
          No simulations scheduled yet. Click "Schedule Simulation" to begin.
        </div>
      ) : (
        <div className="space-y-3">
          {simulations.map((sim) => {
            const isExpanded = expandedId === sim.id;
            const statusInfo = statusConfig[sim.status] || statusConfig.pending;
            const StatusIcon = statusInfo.icon;
            const outcomeInfo = sim.outcome ? outcomeConfig[sim.outcome] : null;
            const gapCount = sim.gapsFound?.length || 0;

            return (
              <div key={sim.id} className={`border rounded-xl overflow-hidden transition-all ${sim.outcome === "fail" ? "border-red-500/30" : sim.outcome === "partial_pass" ? "border-amber-500/20" : "border-zinc-800"} bg-zinc-900/20`}>
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-zinc-800/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : sim.id)}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${sim.outcome === "fail" ? "bg-red-500/10" : sim.outcome === "pass" ? "bg-emerald-500/10" : sim.outcome === "partial_pass" ? "bg-amber-500/10" : "bg-zinc-800"}`}>
                    <StatusIcon className={`w-4 h-4 ${sim.status === "completed" && sim.outcome === "fail" ? "text-red-400" : sim.status === "completed" && sim.outcome === "pass" ? "text-emerald-400" : sim.status === "completed" ? "text-amber-400" : "text-zinc-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white">{sim.name}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {sim.scenario && (
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{sim.scenario}</span>
                          )}
                          {sim.owner && (
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <User className="w-3 h-3" />{sim.owner}
                            </span>
                          )}
                          {sim.dueDate && (
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />Due {new Date(sim.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {gapCount > 0 && (
                            <span className="text-[10px] text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />{gapCount} gap{gapCount > 1 ? "s" : ""}
                            </span>
                          )}
                          {sim.detectionRate !== null && sim.detectionRate !== undefined && (
                            <span className={`text-[10px] font-medium ${sim.detectionRate >= 80 ? "text-emerald-400" : sim.detectionRate >= 60 ? "text-amber-400" : "text-red-400"}`}>
                              {sim.detectionRate}% detection
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {outcomeInfo && (
                          <span className={`text-xs font-semibold ${outcomeInfo.color}`}>{outcomeInfo.label}</span>
                        )}
                        <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-800/60 px-4 pb-4 pt-3 space-y-4">
                    {sim.status === "completed" && sim.detectionRate != null && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                          <div className="text-[10px] text-zinc-500 mb-1">Detection Rate</div>
                          <div className={`text-2xl font-bold ${sim.detectionRate >= 80 ? "text-emerald-400" : sim.detectionRate >= 60 ? "text-amber-400" : "text-red-400"}`}>{sim.detectionRate}%</div>
                          <Progress value={sim.detectionRate} className="h-1 mt-2" />
                        </div>
                        {sim.meanTimeToDetect && (
                          <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                            <div className="text-[10px] text-zinc-500 mb-1">Mean Time to Detect</div>
                            <div className="text-2xl font-bold text-blue-400">{sim.meanTimeToDetect}m</div>
                            <div className="text-[10px] text-zinc-600 mt-1">minutes</div>
                          </div>
                        )}
                        {sim.coverage && (
                          <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                            <div className="text-[10px] text-zinc-500 mb-1">Coverage</div>
                            <div className="text-2xl font-bold text-zinc-300">{sim.coverage.detected}/{sim.coverage.tested}</div>
                            <div className="text-[10px] text-zinc-600 mt-1">detected / tested</div>
                          </div>
                        )}
                      </div>
                    )}

                    {gapCount > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Control Gaps Found
                        </div>
                        <div className="space-y-1.5">
                          {(sim.gapsFound ?? []).map((gap, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-red-200/80 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                              <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                              {gap}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sim.recommendedActions && sim.recommendedActions.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Recommended Actions
                        </div>
                        <div className="space-y-1.5">
                          {sim.recommendedActions.map((action: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-emerald-200/80 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                              <Target className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sim.linkedAssets && sim.linkedAssets.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Tested Assets</div>
                        <div className="flex flex-wrap gap-1.5">
                          {sim.linkedAssets.map((asset: string) => (
                            <span key={asset} className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{asset}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {sim.auditTrail && sim.auditTrail.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Audit Trail
                        </div>
                        <div className="space-y-1">
                          {(sim.auditTrail ?? []).map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <div className="w-1 h-1 rounded-full bg-zinc-600 flex-shrink-0" />
                              <span className="text-zinc-400">{entry.action}</span>
                              <span className="text-zinc-600 ml-auto">{entry.user} · {new Date(entry.at).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {gapCount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-[11px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => workflowMutation.mutate({ entityId: sim.id, actionType: "route_to_response", assignedTo: sim.owner ?? undefined })}
                          disabled={workflowMutation.isPending}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Route Gaps via Alloy
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-[11px] border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                        onClick={() => workflowMutation.mutate({ entityId: sim.id, actionType: "assign_owner", assignedTo: sim.owner || "Security Team" })}
                        disabled={workflowMutation.isPending}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Assign Follow-up
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
