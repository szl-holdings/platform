import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Button } from "@szl-holdings/shared-ui/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@szl-holdings/shared-ui/ui/dialog";
import { Input } from "@szl-holdings/shared-ui/ui/input";
import { Label } from "@szl-holdings/shared-ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@szl-holdings/shared-ui/ui/select";
import { Textarea } from "@szl-holdings/shared-ui/ui/textarea";
import { Plus, AlertTriangle, Shield, Clock, Users, Trash2, ArrowRight, FileText, Loader2, X, ChevronUp, ChevronDown, Activity } from "lucide-react";
import { AtlasScenePanel } from "@/components/atlas-scene-panel";
import { EmptyState } from "@szl-holdings/shared-ui/design-system";
import { CommentThread, ActivityFeed } from "@szl-holdings/shared-ui/collaboration";
import { useState, useEffect, useRef } from "react";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";
import { useRealtimeChannel } from "@szl-holdings/shared-ui/use-realtime-channel";
import { ExportButton } from "@szl-holdings/shared-ui/data-export";
import {
  OperationalDetailPane,
  OperationalStatusBadge,
  OperationalRiskBadge,
  OperationalOwnerChip,
  OperationalAuditTimeline,
  OperationalEvidencePanel,
  OperationalEscalationPanel,
  severityToRiskLevel,
  formatAgo,
  type OperationalEntity,
  type AuditHistoryEntry,
  type EvidenceItem,
  type EscalationPath,
} from "@szl-holdings/shared-ui/operational-primitives";

async function downloadIncidentPDF(incident: Record<string, unknown>): Promise<void> {
  const res = await fetch("/api/documents/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template: "aegis-incident-summary",
      data: {
        incident,
        responseActions: [
          "Initial detection and severity triage completed.",
          "Incident record opened in Aegis platform with full audit trail.",
          "Assigned analyst notified and investigation initiated.",
          "Affected systems flagged for containment evaluation.",
          "Stakeholder notification distributed per incident response protocol.",
        ],
      },
    }),
  });
  if (!res.ok) throw new Error("PDF generation failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aegis-incident-${(incident.id as number) || "report"}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function playAlertTone(severity: string): void {
  try {
    const win = window as any;
    const AudioCtx = win.AudioContext ?? win.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(severity === "critical" ? 880 : 660, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.8);
    if (severity === "critical") {
      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.connect(g2);
      g2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.3);
      g2.gain.setValueAtTime(0.25, ctx.currentTime + 0.3);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
      osc2.start(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 1.1);
    }
  } catch {
  }
}

const statusOrder = ["detection", "triage", "investigation", "containment", "remediation", "closed"];
const statusColors: Record<string, string> = {
  detection: "bg-red-500/10 text-red-400 border-red-500/20",
  triage: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  investigation: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  containment: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  remediation: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  closed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const severityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

interface IncidentPayload { id?: number; severity?: string; status?: string; title?: string; }

function buildIncidentEntity(incident: any): OperationalEntity {
  const evidence: EvidenceItem[] = [];
  if (incident.attackTechnique) {
    evidence.push({
      id: "att-ck",
      label: "ATT&CK Technique",
      value: incident.attackTechnique,
      source: "MITRE ATT&CK",
      confidence: 0.9,
    });
  }
  if (incident.severity) {
    evidence.push({
      id: "severity",
      label: "Severity Classification",
      value: incident.severity.toUpperCase(),
      source: "Triage System",
      confidence: incident.severity === "critical" ? 0.97 : incident.severity === "high" ? 0.88 : 0.75,
    });
  }

  const auditHistory: AuditHistoryEntry[] = [];
  if (incident.createdAt) {
    auditHistory.push({
      id: "created",
      action: "Incident detected and opened",
      actor: "System",
      actorType: "system",
      newState: "detection",
      timestamp: incident.createdAt,
    });
  }
  if (incident.assignedAnalyst) {
    auditHistory.push({
      id: "assigned",
      action: `Assigned to ${incident.assignedAnalyst}`,
      actor: incident.assignedAnalyst,
      actorType: "user",
      previousState: "detection",
      newState: "triage",
      timestamp: incident.createdAt,
      notes: `Analyst assigned for triage`,
    });
  }
  if (incident.status && incident.status !== "detection") {
    auditHistory.push({
      id: "status-update",
      action: `Status advanced to ${incident.status}`,
      actor: incident.assignedAnalyst ?? "Analyst",
      actorType: "user",
      previousState: "triage",
      newState: incident.status,
      timestamp: incident.updatedAt ?? incident.createdAt,
    });
  }
  if (incident.resolvedAt) {
    auditHistory.push({
      id: "resolved",
      action: "Incident closed and resolved",
      actor: incident.assignedAnalyst ?? "System",
      actorType: "user",
      previousState: "remediation",
      newState: "closed",
      timestamp: incident.resolvedAt,
    });
  }

  const escalationPaths: EscalationPath[] = [];
  if (incident.severity === "critical" && incident.status !== "closed") {
    escalationPaths.push({
      id: "l1",
      level: 1,
      label: "Critical — Incident Commander",
      targetRole: "Incident Commander",
      notifyChannels: ["Slack #incidents-critical", "PagerDuty"],
      triggeredAt: incident.createdAt,
      active: true,
    });
  }

  return {
    id: incident.id,
    title: incident.title,
    status: incident.status,
    riskLevel: severityToRiskLevel(incident.severity ?? "low"),
    riskScore: incident.severity === "critical" ? 0.95 : incident.severity === "high" ? 0.75 : incident.severity === "medium" ? 0.5 : 0.2,
    owner: incident.assignedAnalyst ? { name: incident.assignedAnalyst, role: "Analyst" } : undefined,
    nextAction: incident.status === "closed" ? undefined : statusOrder[Math.min(statusOrder.indexOf(incident.status) + 1, statusOrder.length - 1)] ? `Advance to ${statusOrder[Math.min(statusOrder.indexOf(incident.status) + 1, statusOrder.length - 1)]}` : undefined,
    evidence,
    rationale: incident.description ?? undefined,
    auditHistory,
    escalationPaths,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt ?? incident.createdAt,
  };
}

function IncidentDetailSidePane({ incident, onClose, onUpdate }: {
  incident: any;
  onClose: () => void;
  onUpdate: (id: number, data: any) => void;
}) {
  const entity = buildIncidentEntity(incident);
  const [paneTab, setPaneTab] = useState<"detail" | "atlas">("detail");
  const isDemoIncident = !incident.id || String(incident.externalId ?? incident.id).startsWith("INC-2026");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0A0D14] border-l border-white/10 h-full w-full max-w-lg overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/10 sticky top-0 bg-[#0A0D14] z-10 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-mono text-red-400/50 uppercase tracking-widest mb-0.5">Incident Detail</p>
            <h2 className="text-sm font-semibold text-white leading-tight line-clamp-1">{incident.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-white/10 px-5">
          <button
            onClick={() => setPaneTab("detail")}
            className={`flex items-center gap-1.5 px-0 py-2.5 mr-5 text-xs font-medium border-b-2 -mb-px transition-all ${paneTab === "detail" ? "border-red-500 text-red-300" : "border-transparent text-white/40 hover:text-white/60"}`}
          >
            <FileText className="w-3 h-3" /> Detail
          </button>
          <button
            onClick={() => setPaneTab("atlas")}
            className={`flex items-center gap-1.5 px-0 py-2.5 text-xs font-medium border-b-2 -mb-px transition-all ${paneTab === "atlas" ? "border-red-500 text-red-300" : "border-transparent text-white/40 hover:text-white/60"}`}
          >
            <Activity className="w-3 h-3" /> ATLAS Scene
          </button>
        </div>

        <div className="p-5">
          {paneTab === "detail" ? (
            <OperationalDetailPane entity={entity}>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(255,255,255,0.28)" }}>Investigation Thread</p>
                <CommentThread
                  entityType="incident"
                  entityId={String(incident.id)}
                  title=""
                  collapsible={false}
                />
              </div>
            </OperationalDetailPane>
          ) : (
            <AtlasScenePanel incidentId={incident.id} isDemo={isDemoIncident} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function IncidentsPage() {
  const qc = useQueryClient();
  const { data: incidents = [], isLoading } = useQuery({ queryKey: ["incidents"], queryFn: api.incidents.list });
  const [open, setOpen] = useState(false);

  const [liveAlert, setLiveAlert] = useState<{ title?: string; severity?: string } | null>(null);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { lastMessage: wsIncident } = useRealtimeChannel<IncidentPayload>("aegis-incidents");
  useEffect(() => {
    if (!wsIncident) return;
    qc.invalidateQueries({ queryKey: ["incidents"] });
    const sev = wsIncident.data?.severity;
    const title = wsIncident.data?.title;
    if (sev === "critical" || sev === "high") {
      playAlertTone(sev);
      setLiveAlert({ title, severity: sev });
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => setLiveAlert(null), 10000);
    }
    return () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, [wsIncident, qc]);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [detailPaneIncident, setDetailPaneIncident] = useState<any | null>(null);
  const [form, setForm] = useState({ title: "", description: "", severity: "medium", assignedAnalyst: "", attackTechnique: "" });
  const [downloadingIncidentId, setDownloadingIncidentId] = useState<number | null>(null);

  const selectedIncident = detailPaneIncident ?? (selectedIncidentId !== null ? incidents.find((i: any) => i.id === selectedIncidentId) : null);

  const createMut = useMutation({
    mutationFn: (data: any) => api.incidents.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); setOpen(false); toast.success("Incident created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => api.incidents.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["incidents"] });
      const prev = qc.getQueryData(["incidents"]);
      qc.setQueryData(["incidents"], (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const asObj = old as Record<string, unknown>;
        const list = Array.isArray(asObj.incidents) ? asObj.incidents : Array.isArray(old) ? (old as Record<string, unknown>[]) : [];
        const updated = list.map((i: Record<string, unknown>) => i.id === id ? { ...i, ...data } : i);
        return Array.isArray(old) ? updated : { ...asObj, incidents: updated };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(["incidents"], ctx.prev);
      toast.error("Failed to update incident");
    },
    onSuccess: () => toast.success("Incident updated"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["incidents"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.incidents.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); toast.success("Incident deleted"); },
  });

  const advanceStatus = (incident: any) => {
    const idx = statusOrder.indexOf(incident.status);
    if (idx < statusOrder.length - 1) {
      const nextStatus = statusOrder[idx + 1];
      const updates: any = { status: nextStatus };
      if (nextStatus === "closed") updates.resolvedAt = new Date().toISOString();
      updateMut.mutate({ id: incident.id, data: updates });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {selectedIncident && (
        <IncidentDetailSidePane
          incident={selectedIncident}
          onClose={() => { setDetailPaneIncident(null); setSelectedIncidentId(null); }}
          onUpdate={(id, data) => updateMut.mutate({ id, data })}
        />
      )}

      {liveAlert && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border animate-pulse" style={{ background: liveAlert.severity === "critical" ? "rgba(239,68,68,0.12)" : "rgba(249,115,22,0.10)", borderColor: liveAlert.severity === "critical" ? "rgba(239,68,68,0.4)" : "rgba(249,115,22,0.3)" }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: liveAlert.severity === "critical" ? "#ef4444" : "#f97316" }} />
          <span className="text-sm font-semibold" style={{ color: liveAlert.severity === "critical" ? "#ef4444" : "#f97316" }}>
            {liveAlert.severity?.toUpperCase()} incident received live
          </span>
          {liveAlert.title && <span className="text-sm text-muted-foreground truncate">{liveAlert.title}</span>}
          <span className="ml-auto text-xs text-muted-foreground">via realtime channel</span>
        </div>
      )}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Incident Response
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Triage, containment, root cause tracking, and post-incident review</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <Button variant={view === "list" ? "default" : "ghost"} size="sm" onClick={() => setView("list")}>List</Button>
            <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" onClick={() => setView("kanban")}>Kanban</Button>
          </div>
          <ExportButton
            data={incidents.map((i: any) => ({
              ID: i.id,
              Title: i.title,
              Severity: i.severity,
              Status: i.status,
              "Assigned Analyst": i.assignedAnalyst || "",
              "ATT&CK Technique": i.attackTechnique || "",
              "Created At": i.createdAt ? new Date(i.createdAt).toLocaleString() : "",
            }))}
            options={{ filename: "incidents", title: "Incident Response Log", accentColor: "#ef4444" }}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> New Incident</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="font-display">Create Incident</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Unauthorized Access Detected" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Severity</Label>
                    <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Assigned Analyst</Label><Input value={form.assignedAnalyst} onChange={e => setForm(p => ({ ...p, assignedAnalyst: e.target.value }))} placeholder="e.g. Analyst-1" /></div>
                </div>
                <div><Label>ATT&CK Technique</Label><Input value={form.attackTechnique} onChange={e => setForm(p => ({ ...p, attackTechnique: e.target.value }))} placeholder="e.g. T1566.001" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe the incident..." /></div>
                <Button onClick={() => {
                  if (!form.title) { toast.error("Title required"); return; }
                  createMut.mutate({ ...form, status: "detection" });
                }} disabled={createMut.isPending} className="w-full">
                  {createMut.isPending ? "Creating..." : "Create Incident"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        {["detection", "investigation", "containment", "closed"].map(status => {
          const count = incidents.filter((i: any) => i.status === status).length;
          return (
            <Card key={status} className="bg-card border-border hover:border-primary/20 transition-all group">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider capitalize">{status}</p>
                  <p className="text-2xl font-bold font-display mt-1">{count}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status === "detection" ? "bg-red-500/10" : status === "closed" ? "bg-emerald-500/10" : "bg-primary/10"} group-hover:scale-110 transition-transform`}>
                  {status === "detection" ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                   status === "closed" ? <Shield className="w-5 h-5 text-emerald-400" /> :
                   <Clock className="w-5 h-5 text-primary" />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-6 gap-3 overflow-x-auto animate-fade-in-up stagger-2">
          {statusOrder.map(status => (
            <div key={status} className="min-w-[200px]">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={statusColors[status]}>{status}</Badge>
                <span className="text-xs text-muted-foreground">({incidents.filter((i: any) => i.status === status).length})</span>
              </div>
              <div className="space-y-2">
                {incidents.filter((i: any) => i.status === status).map((incident: any) => (
                  <Card key={incident.id} className={`bg-card border-border hover:border-primary/20 transition-all cursor-pointer ${incident.severity === "critical" ? "ring-1 ring-red-500/10" : ""}`}
                    onClick={() => setDetailPaneIncident(incident)}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-xs font-semibold line-clamp-2">{incident.title}</h4>
                        <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={e => { e.stopPropagation(); deleteMut.mutate(incident.id); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <OperationalRiskBadge level={severityToRiskLevel(incident.severity ?? "low")} size="xs" />
                        {incident.assignedAnalyst && (
                          <OperationalOwnerChip owner={{ name: incident.assignedAnalyst, role: "Analyst" }} size="xs" />
                        )}
                      </div>
                      {status !== "closed" && (
                        <Button variant="ghost" size="sm" className="w-full mt-2 h-6 text-[10px]" onClick={e => { e.stopPropagation(); advanceStatus(incident); }}>
                          Advance <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in-up stagger-2">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="bg-card border-border"><CardContent className="p-4"><div className="skeleton h-16 w-full" /></CardContent></Card>
            ))
          ) : incidents.length === 0 ? (
            <EmptyState
              icon={Shield}
              headline="No active incidents"
              description="Defenses are holding — no incidents have been opened or escalated. New incidents created from alerts, hunts, or analyst escalations will land here."
              accentColor="#10b981"
              className="border border-dashed border-border rounded-lg"
            />
          ) : (
            incidents.map((incident: any) => (
              <Card
                key={incident.id}
                className={`bg-card border-border hover:border-primary/20 transition-all duration-300 cursor-pointer ${incident.severity === "critical" && incident.status !== "closed" ? "ring-1 ring-red-500/10" : ""}`}
                onClick={() => setDetailPaneIncident(incident)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-sm">{incident.title}</h3>
                        <OperationalStatusBadge status={incident.status} size="xs" />
                        <OperationalRiskBadge level={severityToRiskLevel(incident.severity ?? "low")} size="xs" />
                      </div>
                      {incident.description && <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{incident.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {incident.assignedAnalyst && (
                          <OperationalOwnerChip owner={{ name: incident.assignedAnalyst, role: "Analyst" }} size="xs" />
                        )}
                        {incident.attackTechnique && <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{incident.attackTechnique}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatAgo(incident.detectedAt ?? incident.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4" onClick={e => e.stopPropagation()}>
                      <Select value={incident.status} onValueChange={v => {
                        const updates: any = { status: v };
                        if (v === "closed") updates.resolvedAt = new Date().toISOString();
                        updateMut.mutate({ id: incident.id, data: updates });
                      }}>
                        <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOrder.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        disabled={downloadingIncidentId === incident.id}
                        onClick={async e => {
                          e.stopPropagation();
                          setDownloadingIncidentId(incident.id);
                          try { await downloadIncidentPDF(incident); } catch { toast.error("PDF generation failed"); } finally { setDownloadingIncidentId(null); }
                        }}
                        title="Export Incident Report PDF"
                      >
                        {downloadingIncidentId === incident.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={e => { e.stopPropagation(); deleteMut.mutate(incident.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <ActivityFeed entityType="incident" title="Incident Response Team Activity" limit={8} compact />
    </div>
  );
}
