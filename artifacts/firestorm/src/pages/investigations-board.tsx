import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@workspace/shared-ui/utils";
import {
  Search, FileText, Tag, ChevronRight, ChevronDown, Plus, Circle,
  Clock, User, Link2, AlertTriangle, Network, Layers, Lightbulb,
  CheckCircle2, XCircle, Minus, ArrowRight, Shield, Eye, Lock,
  BookOpen, Zap, Activity, Target, Brain
} from "lucide-react";
import { TradecraftPanel, RelatedCasesPanel, EvidenceIndexPanel } from "@/components/tradecraft-panel";

const MOCK_CASE = {
  id: "CASE-0041",
  title: "APT29 Lateral Movement — DC-PROD-03",
  status: "investigation",
  priority: "p1_critical",
  analyst: "J. Chen",
  openedAt: "2h 14m ago",
  tenantLabel: "NORTHGATE-CORP",
  envLabel: "PRODUCTION",
  sensitivityLabel: "RESTRICTED",
};

const FALLBACK_TIMELINE = [
  { at: "14:02 UTC", type: "alert", text: "SIEM alert: Unusual SMB traffic from SVC-ACCNT-04 to DC-PROD-03", actor: "SIEM", severity: "high" as string | null },
  { at: "14:08 UTC", type: "action", text: "Alert acknowledged and promoted to Case CASE-0041", actor: "J. Chen", severity: null as string | null },
  { at: "14:11 UTC", type: "evidence", text: "Evidence collected: network capture PCAPs tagged #IOC-0881", actor: "J. Chen", severity: null as string | null },
  { at: "14:19 UTC", type: "signal", text: "Correlated signal: T1021.002 — RemCom execution pattern from same source", actor: "Detection Engine", severity: "critical" as string | null },
  { at: "14:27 UTC", type: "hypothesis", text: "Hypothesis drafted: APT29 TTP overlap — pass-the-hash lateral movement", actor: "J. Chen", severity: null as string | null },
  { at: "14:35 UTC", type: "action", text: "Recommended action proposed: isolate DC-PROD-03 (pending approval APR-001)", actor: "J. Chen → SOC Mgr", severity: null as string | null },
  { at: "14:52 UTC", type: "signal", text: "New signal: outbound C2 beacon detected — port 443 to 103.45.18.22", actor: "Detection Engine", severity: "critical" as string | null },
];

const FALLBACK_ENTITIES = [
  { id: "E01", type: "host", label: "DC-PROD-03", detail: "Domain Controller · PROD", risk: "critical" },
  { id: "E02", type: "identity", label: "SVC-ACCNT-04", detail: "Service Account · IAM", risk: "high" },
  { id: "E03", type: "network", label: "103.45.18.22", detail: "Known C2 · APT29 infra", risk: "critical" },
];

const FALLBACK_SIGNALS = [
  { id: "SIG-081", type: "T1021.002", source: "EDR", severity: "critical", text: "RemCom lateral movement — SVC-ACCNT-04 → DC-PROD-03", at: "14:19" },
  { id: "SIG-082", type: "T1071.001", source: "FW", severity: "critical", text: "C2 beacon outbound — port 443 → 103.45.18.22", at: "14:52" },
];

const FALLBACK_EVIDENCE = [
  { id: "EV-01", name: "network-capture-0881.pcap", type: "network_capture", collectedBy: "J. Chen", at: "14:11", trustLevel: "verified", sensitivity: "RESTRICTED", retentionClass: "IR-90D" },
  { id: "EV-02", name: "edr-lsass-dump-2024.log", type: "log_artifact", collectedBy: "Detection Engine", at: "15:05", trustLevel: "verified", sensitivity: "RESTRICTED", retentionClass: "IR-90D" },
];

const FALLBACK_HYPOTHESES = [
  { id: "HYP-A", title: "APT29 pass-the-hash lateral movement", confidence: 88, status: "active", notes: "MITRE T1021.002 and T1003.001 pattern overlap with known APT29 TTPs. C2 IP matches threat intel feed." },
  { id: "HYP-B", title: "Insider threat — privileged service account misuse", confidence: 22, status: "considered", notes: "SVC-ACCNT-04 is shared across 3 teams. Cannot rule out misuse, but C2 beacon makes this less likely." },
];

const FALLBACK_ACTIONS = [
  { id: "RA-01", text: "Isolate DC-PROD-03 from network segment", gate: "approval_required", status: "pending", severity: "critical" },
  { id: "RA-02", text: "Rotate SVC-ACCNT-04 credentials and revoke active tokens", gate: "approval_required", status: "pending", severity: "high" },
];

const TYPE_ICONS: Record<string, typeof Search> = {
  alert: AlertTriangle, action: Activity, evidence: FileText, signal: Target, hypothesis: Lightbulb, note: BookOpen,
};

const TYPE_COLORS: Record<string, string> = {
  alert: "#f97316", action: "#3b82f6", evidence: "#8b5cf6", signal: "#ef4444", hypothesis: "#f59e0b", note: "#10b981",
};

const ENTITY_COLORS: Record<string, string> = {
  host: "#3b82f6", identity: "#f59e0b", network: "#ef4444", threat: "#8b5cf6", incident: "#ef4444",
};

const SEV_COLORS: Record<string, string> = {
  critical: "text-red-400 border-red-500/25 bg-red-500/10",
  high: "text-orange-400 border-orange-500/25 bg-orange-500/10",
  medium: "text-yellow-400 border-yellow-500/25 bg-yellow-500/10",
  low: "text-blue-400 border-blue-500/25 bg-blue-500/10",
};

const GATE_STYLES: Record<string, string> = {
  approval_required: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  propose_only: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  approved_execute: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
};

interface LinkedIncident {
  id: number;
  title: string;
  severity: string;
  status: string;
  source?: string | null;
  sourceRef?: string | null;
  createdAt?: string;
}

interface CaseNote {
  content: string;
  author: string;
  at: string;
}

interface CaseEvidence {
  name: string;
  type: string;
  url?: string;
  addedAt: string;
}

interface InvestigationCase {
  id: number;
  caseNumber?: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string;
  assignedAnalyst?: string | null;
  createdAt: string;
  notes?: CaseNote[] | null;
  evidence?: CaseEvidence[] | null;
  linkedIncidents?: LinkedIncident[];
}

interface InvestigationsPayload {
  investigations: InvestigationCase[];
  totalOpen?: number;
  ztEnvironment?: string;
  ztPermissionClass?: string;
  ztDataLabels?: { sensitivityLabel: string; retentionClass: string };
  fetchedAt: string;
}

function formatTimeShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toISOString().slice(11, 16) + " UTC";
  } catch {
    return dateStr;
  }
}

export default function InvestigationsBoard() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<"timeline" | "entities" | "signals" | "evidence" | "hypotheses" | "actions" | "tradecraft">("timeline");
  const [noteText, setNoteText] = useState("");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  const { data: investigationsData, isSuccess: investigationsLoaded } = useQuery<InvestigationsPayload>({
    queryKey: ["command-investigations"],
    queryFn: () => api.command.investigations(),
    retry: false,
  });

  const addNoteMutation = useMutation({
    mutationFn: (params: { note: string; caseId?: number }) =>
      api.command.addNote(params.note, params.caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["command-investigations"] });
      setNoteText("");
    },
  });

  const liveCases = investigationsData?.investigations ?? [];
  const activeCaseFromLive = liveCases[selectedCaseIdx] ?? liveCases[0] ?? null;
  const usingLive = investigationsLoaded;
  const displayCase = activeCaseFromLive
    ? {
        id: activeCaseFromLive.caseNumber ?? `CASE-${String(activeCaseFromLive.id).padStart(4, "0")}`,
        title: activeCaseFromLive.title,
        status: activeCaseFromLive.status,
        priority: activeCaseFromLive.priority ?? "p1_critical",
        analyst: activeCaseFromLive.assignedAnalyst ?? "Unassigned",
        openedAt: new Date(activeCaseFromLive.createdAt).toLocaleString(),
        tenantLabel: investigationsData?.ztPermissionClass ? `CLASS:${investigationsData.ztPermissionClass.toUpperCase()}` : MOCK_CASE.tenantLabel,
        envLabel: investigationsData?.ztEnvironment ?? MOCK_CASE.envLabel,
        sensitivityLabel: investigationsData?.ztDataLabels?.sensitivityLabel ?? MOCK_CASE.sensitivityLabel,
      }
    : MOCK_CASE;

  const timeline = useMemo(() => {
    if (!activeCaseFromLive) return FALLBACK_TIMELINE;
    const entries: Array<{ at: string; type: string; text: string; actor: string; severity: string | null }> = [];

    entries.push({
      at: formatTimeShort(activeCaseFromLive.createdAt),
      type: "action",
      text: `Case opened: ${activeCaseFromLive.title}`,
      actor: activeCaseFromLive.assignedAnalyst ?? "System",
      severity: null,
    });

    const linkedIncidents = activeCaseFromLive.linkedIncidents ?? [];
    for (const inc of linkedIncidents) {
      entries.push({
        at: inc.createdAt ? formatTimeShort(inc.createdAt) : "—",
        type: "alert",
        text: `Linked incident: ${inc.title}`,
        actor: inc.source ?? "SIEM",
        severity: inc.severity ?? null,
      });
    }

    const notes = activeCaseFromLive.notes ?? [];
    for (const note of notes) {
      entries.push({
        at: formatTimeShort(note.at),
        type: "note",
        text: note.content,
        actor: note.author,
        severity: null,
      });
    }

    const evidence = activeCaseFromLive.evidence ?? [];
    for (const ev of evidence) {
      entries.push({
        at: formatTimeShort(ev.addedAt),
        type: "evidence",
        text: `Evidence collected: ${ev.name} (${ev.type})`,
        actor: "Analyst",
        severity: null,
      });
    }

    entries.sort((a, b) => a.at.localeCompare(b.at));
    return entries.length > 0 ? entries : FALLBACK_TIMELINE;
  }, [activeCaseFromLive]);

  const entities = useMemo(() => {
    if (!activeCaseFromLive) return FALLBACK_ENTITIES;
    const linkedIncidents = activeCaseFromLive.linkedIncidents ?? [];
    if (linkedIncidents.length === 0) return FALLBACK_ENTITIES;
    return linkedIncidents.map((inc, i) => ({
      id: `E${String(i + 1).padStart(2, "0")}`,
      type: "incident" as string,
      label: `INC-${inc.id}`,
      detail: inc.title,
      risk: inc.severity ?? "medium",
    }));
  }, [activeCaseFromLive]);

  const signals = useMemo(() => {
    if (!activeCaseFromLive) return FALLBACK_SIGNALS;
    const linkedIncidents = activeCaseFromLive.linkedIncidents ?? [];
    if (linkedIncidents.length === 0) return FALLBACK_SIGNALS;
    return linkedIncidents.map((inc, i) => ({
      id: `SIG-${String(inc.id).padStart(3, "0")}`,
      type: inc.sourceRef ?? "detection",
      source: inc.source ?? "SIEM",
      severity: inc.severity ?? "medium",
      text: inc.title,
      at: inc.createdAt ? formatTimeShort(inc.createdAt).replace(" UTC", "") : "—",
    }));
  }, [activeCaseFromLive]);

  const caseEvidence = useMemo(() => {
    if (!activeCaseFromLive) return FALLBACK_EVIDENCE;
    const ev = activeCaseFromLive.evidence ?? [];
    if (ev.length === 0) return FALLBACK_EVIDENCE;
    return ev.map((e, i) => ({
      id: `EV-${String(i + 1).padStart(2, "0")}`,
      name: e.name,
      type: e.type,
      collectedBy: "Analyst",
      at: formatTimeShort(e.addedAt),
      trustLevel: "verified",
      sensitivity: investigationsData?.ztDataLabels?.sensitivityLabel ?? "RESTRICTED",
      retentionClass: "IR-90D",
    }));
  }, [activeCaseFromLive, investigationsData?.ztDataLabels?.sensitivityLabel]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNoteMutation.mutate({
      note: noteText,
      caseId: activeCaseFromLive?.id,
    });
  };

  const sections = [
    { id: "timeline" as const, label: "Timeline", icon: Clock },
    { id: "entities" as const, label: "Entities", icon: Network },
    { id: "signals" as const, label: "Signals", icon: Activity },
    { id: "evidence" as const, label: "Evidence", icon: FileText },
    { id: "hypotheses" as const, label: "Hypotheses", icon: Lightbulb },
    { id: "actions" as const, label: "Rec. Actions", icon: Zap },
    { id: "tradecraft" as const, label: "Tradecraft", icon: Brain },
  ];

  return (
    <div className="flex flex-col h-full min-h-screen" style={{ backgroundColor: "#070A10", color: "#e2e8f0" }}>
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono text-white/40">{displayCase.id}</span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400 uppercase">{displayCase.status}</span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 uppercase">{(displayCase.priority ?? "p1_critical").replace("_", " ")}</span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/5 text-emerald-400/70">{displayCase.envLabel}</span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/30 bg-blue-500/5 text-blue-400/70">{displayCase.tenantLabel}</span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/5 text-red-400/70 flex items-center gap-0.5">
                <Lock className="w-2 h-2" />{displayCase.sensitivityLabel}
              </span>
              {usingLive && (
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400/70">LIVE</span>
              )}
            </div>
            <h1 className="text-sm font-bold text-white">{displayCase.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span>Lead: {displayCase.analyst}</span>
              <span>·</span>
              <span>Opened {displayCase.openedAt}</span>
              {liveCases.length > 1 && (
                <>
                  <span>·</span>
                  <span className="text-blue-400">{liveCases.length} open cases</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {liveCases.length > 1 && (
              <select
                value={selectedCaseIdx}
                onChange={e => setSelectedCaseIdx(Number(e.target.value))}
                className="px-2 py-1 rounded-lg text-[11px] bg-white/5 border border-white/10 text-white/70 outline-none"
              >
                {liveCases.map((c, i) => (
                  <option key={c.id} value={i} className="bg-[#070A10]">
                    {c.caseNumber ?? `CASE-${c.id}`}: {c.title.slice(0, 40)}
                  </option>
                ))}
              </select>
            )}
            <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition-colors">
              Decision Console
            </button>
            <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors">
              Escalate
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-0.5 px-6 py-2 border-b border-white/5 overflow-x-auto">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all",
              activeSection === id ? "bg-blue-500/15 text-blue-300 border border-blue-500/20" : "text-white/50 hover:text-white/80 hover:bg-white/5"
            )}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeSection === "timeline" && (
          <div className="space-y-4">
            <div className="relative pl-4">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />
              {timeline.map((ev, i) => {
                const Icon = TYPE_ICONS[ev.type] ?? Circle;
                const color = TYPE_COLORS[ev.type] ?? "#ffffff";
                return (
                  <div key={i} className="relative flex gap-4 pb-6">
                    <div className="absolute left-[-16px] w-4 h-4 rounded-full border-2 border-[#070A10] flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: color + "22", borderColor: color + "44" }}>
                      <Icon className="w-2 h-2" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0 ml-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-white/40">{ev.at}</span>
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded capitalize" style={{ backgroundColor: color + "15", color }}>{ev.type}</span>
                        {ev.severity && <span className={cn("text-[8px] font-mono px-1 py-0.5 rounded border uppercase", SEV_COLORS[ev.severity])}>{ev.severity}</span>}
                      </div>
                      <p className="text-[11px] text-white/80">{ev.text}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>by {ev.actor}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.15em] mb-2 text-white/40">Analyst Note</div>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note to the case timeline..."
                className="w-full bg-transparent text-xs text-white/80 placeholder-white/20 resize-none outline-none min-h-[60px]"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] text-white/30 font-mono">
                  identity-logged · tenant-scoped
                  {activeCaseFromLive && <> · persists to CASE-{activeCaseFromLive.id}</>}
                </span>
                <button
                  onClick={handleAddNote}
                  disabled={addNoteMutation.isPending}
                  className="px-3 py-1 rounded text-[10px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition-colors disabled:opacity-40"
                >
                  {addNoteMutation.isPending ? "Saving..." : "Add Note"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "entities" && (
          <div className="space-y-3">
            {entities.map(ent => (
              <div key={ent.id} className="flex items-center gap-4 bg-white/[0.025] border border-white/5 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (ENTITY_COLORS[ent.type] ?? "#3b82f6") + "18" }}>
                  <Network className="w-4 h-4" style={{ color: ENTITY_COLORS[ent.type] ?? "#3b82f6" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{ent.label}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{ent.detail}</p>
                </div>
                <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase", SEV_COLORS[ent.risk] ?? "")}>{ent.risk}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/40 capitalize">{ent.type}</span>
              </div>
            ))}
          </div>
        )}

        {activeSection === "signals" && (
          <div className="space-y-3">
            {signals.map(sig => (
              <div key={sig.id} className="bg-white/[0.025] border border-white/5 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-300">{sig.type}</span>
                      <span className="text-[9px] font-mono text-white/40">{sig.source}</span>
                      <span className="text-[9px] font-mono text-white/30">{sig.at} UTC</span>
                    </div>
                    <p className="text-[11px] text-white/85">{sig.text}</p>
                  </div>
                  <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0", SEV_COLORS[sig.severity] ?? "")}>{sig.severity}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "evidence" && (
          <div className="space-y-3">
            {caseEvidence.map(ev => (
              <div key={ev.id} className="bg-white/[0.025] border border-white/5 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-xs font-mono text-white/90">{ev.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/40">{ev.type}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400/70">trust: {ev.trustLevel}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-red-500/20 bg-red-500/5 text-red-400/70 flex items-center gap-0.5">
                        <Lock className="w-2 h-2" />{ev.sensitivity}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400/70">retain: {ev.retentionClass}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/40">{ev.collectedBy}</p>
                    <p className="text-[10px] text-white/30">{ev.at}</p>
                  </div>
                </div>
              </div>
            ))}
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-white/10 text-white/40 text-xs hover:border-white/20 hover:text-white/60 transition-colors w-full">
              <Plus className="w-3.5 h-3.5" />
              Add Evidence
            </button>
          </div>
        )}

        {activeSection === "hypotheses" && (
          <div className="space-y-4">
            <div className="text-[9px] font-mono text-white/25 px-1 mb-1">SCENARIO DATA — no live hypothesis engine</div>
            {FALLBACK_HYPOTHESES.map(hyp => (
              <div key={hyp.id} className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <Lightbulb className={cn("w-4 h-4 mt-0.5 shrink-0", hyp.status === "active" ? "text-yellow-400" : "text-white/25")} />
                    <div>
                      <p className="text-xs font-semibold text-white">{hyp.title}</p>
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded border border-white/10 text-white/40 mt-1 inline-block capitalize">{hyp.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-white/10 w-20 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${hyp.confidence}%` }} />
                    </div>
                    <span className="text-xs font-mono text-emerald-400 tabular-nums">{hyp.confidence}%</span>
                  </div>
                </div>
                <p className="text-[11px] text-white/65 leading-relaxed">{hyp.notes}</p>
              </div>
            ))}
          </div>
        )}

        {activeSection === "actions" && (
          <div className="space-y-3">
            <div className="text-[9px] font-mono text-white/25 px-1 mb-1">RECOMMENDED — requires approval gate</div>
            {FALLBACK_ACTIONS.map(ra => (
              <div key={ra.id} className="bg-white/[0.025] border border-white/5 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-[11px] font-medium text-white/90 mb-2">{ra.text}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider", GATE_STYLES[ra.gate] ?? "")}>{ra.gate}</span>
                      <span className="text-[9px] font-mono text-white/30 capitalize">{ra.status}</span>
                    </div>
                  </div>
                  <button className="px-3 py-1 rounded text-[10px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition-colors shrink-0">
                    Submit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "tradecraft" && (
          <div className="space-y-4">
            <TradecraftPanel
              caseId={activeCaseFromLive ? String(activeCaseFromLive.id) : displayCase.id}
              title="Tradecraft Decisions"
            />
            <RelatedCasesPanel
              caseId={activeCaseFromLive ? String(activeCaseFromLive.id) : displayCase.id}
            />
            <EvidenceIndexPanel
              caseId={activeCaseFromLive ? String(activeCaseFromLive.id) : displayCase.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
