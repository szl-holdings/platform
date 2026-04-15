import { useState, useEffect, useRef } from "react";
import {
  Shield, AlertTriangle, Clock, Users, FileText, Radio, Zap,
  ChevronRight, CheckCircle, Circle, XCircle, Play, Pause,
  BarChart3, Activity, Target, Brain, Crosshair, MessageSquare,
  ClipboardList, TrendingUp, Bell, X, ArrowUpRight, Hash,
  Lock, Flame, Globe, Building2, Ship, Scale, Plus, ChevronDown,
  Download, Printer, RefreshCw, Eye, AlertOctagon,
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const DS = {
  bg: "#070b12",
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

const SEV: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#3b82f6", info: "#64748b" };

interface CrisisEvent {
  id: string;
  time: string;
  elapsed: string;
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "info";
  source: string;
  actor?: string;
  domain?: string;
  confirmed: boolean;
}

interface Decision {
  id: string;
  time: string;
  title: string;
  rationale: string;
  decidedBy: string;
  outcome: string;
  status: "enacted" | "pending" | "superseded";
}

interface ResourceAssignment {
  id: string;
  role: string;
  name: string;
  domain: string;
  task: string;
  status: "active" | "standby" | "unavailable";
  eta?: string;
  escalatable?: boolean;
}

interface CommEntry {
  id: string;
  time: string;
  from: string;
  role: string;
  message: string;
  type: "intel" | "action" | "escalation" | "update" | "broadcast";
  priority?: "urgent" | "normal";
}

const ACTIVE_CRISIS = {
  id: "CRS-2024-001",
  name: "APT29 Enterprise Infiltration",
  type: "CYBERATTACK" as const,
  severity: "critical" as const,
  declaredAt: "2024-01-15T14:22:00Z",
  elapsedMin: 43,
  phase: "CONTAINMENT" as const,
  impactSummary: "Active lateral movement on production infrastructure. 3 managed clients potentially affected. Estimated breach exposure $17.4M.",
  commander: "J. Chen",
  icsLevel: 3,
  activePlaybook: "PB-APT-001",
};

const TIMELINE_EVENTS: CrisisEvent[] = [
  { id: "E001", time: "14:22", elapsed: "T+0", title: "Initial Alert — SIEM Detection", detail: "APT29 TTP pattern matched on DC-PROD-03. Lateral movement via SMB. Confidence 96/100.", severity: "critical", source: "SIEM · Sentinel Watch", actor: "APT29", domain: "defense", confirmed: true },
  { id: "E002", time: "14:24", elapsed: "T+2m", title: "Crisis Declared — ICS Level 3", detail: "J. Chen declared Citadel crisis ICS Level 3. War room activated. Playbook PB-APT-001 initiated.", severity: "critical", source: "Incident Command", confirmed: true },
  { id: "E003", time: "14:26", elapsed: "T+4m", title: "Labs Pre-Detection Confirmed", detail: "Neural explorer had flagged pattern 8 minutes before SIEM alert. APT29 C2 beacon on INC-2846 linked.", severity: "high", source: "Aegis Labs · INCA", confirmed: true },
  { id: "E004", time: "14:29", elapsed: "T+7m", title: "Managed Client Impact Assessment", detail: "DC-PROD-03 is Northgate managed asset. SLA ticket #4827 potentially compromised. Client notified.", severity: "high", source: "MSP Command", actor: "Northgate", domain: "operations", confirmed: true },
  { id: "E005", time: "14:31", elapsed: "T+9m", title: "Evidence Preservation Initiated", detail: "Memory dump ordered on DC-PROD-03. Log preservation on 4 adjacent hosts. Chain of custody active.", severity: "medium", source: "Forensics · J. Park", confirmed: true },
  { id: "E006", time: "14:35", elapsed: "T+13m", title: "CVE-2024-3400 Correlation", detail: "Unpatched PA Firewall FW-EDGE-01 identified as likely initial access vector. CVE linked to this campaign.", severity: "critical", source: "Vulnerability Intel", confirmed: true },
  { id: "E007", time: "14:38", elapsed: "T+16m", title: "HITL Isolation Request — Pending Approval", detail: "Automated containment recommendation: isolate DC-PROD-03 via EDR. Awaiting analyst approval.", severity: "high", source: "SOAR · Playbook PB-APT-001", confirmed: false },
  { id: "E008", time: "14:47", elapsed: "T+25m", title: "S3 Exfiltration Pattern — ALT-5821", detail: "Data exfil pattern on 3 S3 buckets correlated with APT29 staging. TTL-based extraction. Blocked at edge.", severity: "critical", source: "Cloud Monitor", confirmed: true },
  { id: "E009", time: "14:52", elapsed: "T+30m", title: "C2 Beacon Severed — INC-2846", detail: "APT29 C2 communication path severed. Firewall rule deployed. Beacon re-establishment attempts detected.", severity: "high", source: "Network Defense · M. Rodriguez", confirmed: true },
  { id: "E010", time: "15:03", elapsed: "T+41m", title: "CISO Brief Delivered", detail: "Executive brief delivered to CISO. Board notification drafted. PR hold in place. Legal engaged.", severity: "medium", source: "Incident Command", confirmed: true },
  { id: "E011", time: "15:05", elapsed: "T+43m", title: "Containment Phase Active", detail: "Primary containment complete. Secondary sweep of adjacent hosts underway. Attribution confidence 94%.", severity: "medium", source: "SOC Lead", confirmed: true },
];

const DECISIONS: Decision[] = [
  { id: "D001", time: "14:26", title: "Declare ICS Level 3 Crisis", rationale: "Confirmed APT29 lateral movement on production infrastructure with 3 managed clients at risk. Escalation threshold met.", decidedBy: "J. Chen (Incident Commander)", outcome: "Full war room activation. PB-APT-001 initiated. All hands on deck.", status: "enacted" },
  { id: "D002", time: "14:38", title: "Defer Northgate Service Migration", rationale: "TKT-4827 (Northgate server migration) paused. DC-PROD-03 is the target host — migrating now would disrupt forensics and risk evidence contamination.", decidedBy: "R. Davis (MSP Lead)", outcome: "TKT-4827 moved to 'Hold — Security Event' status. Northgate CISO notified.", status: "enacted" },
  { id: "D003", time: "14:39", title: "Hold EDR Isolation — Preserve Evidence", rationale: "Isolation of DC-PROD-03 will sever the attacker's active session, but also destroy live forensic opportunity. Decision: monitor + collect before isolating.", decidedBy: "J. Chen (Incident Commander)", outcome: "15-minute evidence collection window. EDR isolation held pending memory dump completion.", status: "enacted" },
  { id: "D004", time: "14:52", title: "Execute EDR Isolation on DC-PROD-03", rationale: "Evidence collection complete. Memory dump captured. Live threat still active. Risk of further lateral movement exceeds forensic benefit of continued monitoring.", decidedBy: "J. Chen + S. Park (Approver)", outcome: "DC-PROD-03 isolated at 14:52. 3 adjacent hosts flagged for secondary sweep.", status: "enacted" },
  { id: "D005", time: "15:03", title: "Engage External Forensics — CrowdStrike IR", rationale: "Internal IR capacity stretched across 4 concurrent incidents. APT29 campaign requires dedicated specialized expertise for full attribution and remediation.", decidedBy: "J. Chen (Incident Commander)", outcome: "CrowdStrike IR engaged. SLA: 4-hour on-site response. Legal hold on all logs initiated.", status: "pending" },
];

const RESOURCES: ResourceAssignment[] = [
  { id: "R001", role: "Incident Commander", name: "J. Chen", domain: "Defense", task: "Directing containment and managing ICS L3 protocol", status: "active" },
  { id: "R002", role: "Lead Threat Analyst", name: "S. Park", domain: "Defense", task: "APT29 TTP attribution, C2 mapping, kill chain analysis", status: "active" },
  { id: "R003", role: "Forensics Lead", name: "M. Rodriguez", domain: "Defense", task: "Memory dump analysis, DC-PROD-03 forensic imaging", status: "active" },
  { id: "R004", role: "MSP Client Lead", name: "R. Davis", domain: "Operations", task: "Northgate communication, SLA breach mitigation, client impact", status: "active" },
  { id: "R005", role: "Intel Analyst", name: "INCA Neural System", domain: "Labs", task: "Real-time threat correlation, APT29 campaign pattern analysis", status: "active" },
  { id: "R006", role: "Network Defense", name: "A. Thompson", domain: "Defense", task: "Firewall rule deployment, C2 path severing, perimeter hardening", status: "active" },
  { id: "R007", role: "Legal Counsel", name: "K. Wilson (PRISM)", domain: "Legal", task: "Evidence preservation requirements, breach notification obligations", status: "standby", eta: "30m" },
  { id: "R008", role: "Executive Liaison", name: "P. Santos", domain: "Executive", task: "CISO briefing, board notification draft, PR hold coordination", status: "standby" },
  { id: "R009", role: "Cloud Security", name: "T. Kim", domain: "Infrastructure", task: "S3 bucket forensics, CloudTrail preservation, IAM audit", status: "active" },
  { id: "R010", role: "External IR (Pending)", name: "CrowdStrike", domain: "External", task: "Deep APT29 attribution, remediation roadmap, threat hunt", status: "unavailable", eta: "4h on-site" },
];

const COMMS: CommEntry[] = [
  { id: "C001", time: "14:22", from: "Sentinel SIEM", role: "Automated System", message: "ALERT P1: APT29 lateral movement detected on DC-PROD-03. MITRE T1021.002. Confidence 96. Incident INC-2847 opened. Assigning to J. Chen.", type: "intel", priority: "urgent" },
  { id: "C002", time: "14:25", from: "J. Chen", role: "Incident Commander", message: "Confirming CITADEL activation. ICS Level 3. War room open. All leads report in. PB-APT-001 active. Northgate impact assessment needed immediately.", type: "action", priority: "urgent" },
  { id: "C003", time: "14:27", from: "INCA Neural System", role: "AI Intel Agent", message: "Neural explorer analysis complete. APT29 C2 infrastructure overlaps with INC-2846. Pre-detection signal was 8 minutes ahead of SIEM. Attribution confidence: 94%. Recommending kill chain diagram.", type: "intel" },
  { id: "C004", time: "14:29", from: "R. Davis", role: "MSP Client Lead", message: "Northgate CISO K. O'Brien contacted. Confirmed DC-PROD-03 is critical infrastructure for their migration. TKT-4827 placed on hold. They're requesting hourly updates.", type: "update" },
  { id: "C005", time: "14:33", from: "S. Park", role: "Lead Threat Analyst", message: "APT29 Kill chain mapped: Recon → FW exploit (CVE-2024-3400) → Initial access → Credential harvesting → Lateral move SMB → DC-PROD-03. Staging via S3. Classic FIN7-adjacent pattern.", type: "intel" },
  { id: "C006", time: "14:41", from: "J. Chen", role: "Incident Commander", message: "Decision logged: Holding EDR isolation for 15 min evidence window. M. Rodriguez — begin memory dump NOW. S. Park — continue live monitoring, document every lateral attempt. A. Thompson — block all SMB to DC-PROD-03 adjacent hosts.", type: "action", priority: "urgent" },
  { id: "C007", time: "14:52", from: "J. Chen", role: "Incident Commander", message: "EDR isolation approved and executed on DC-PROD-03 at 14:52. Memory dump complete. 3 adjacent hosts flagged. C2 beacon severed by A. Thompson 14:50. Moving to eradication phase prep.", type: "action" },
  { id: "C008", time: "15:02", from: "P. Santos", role: "Executive Liaison", message: "CISO brief delivered. Board notification draft ready — holding pending legal review. PR statement drafted. No external disclosure. Legal hold on all logs confirmed by K. Wilson.", type: "update" },
  { id: "C009", time: "15:05", from: "CITADEL SYSTEM", role: "Automated Broadcast", message: "BROADCAST: Crisis status update distributed to all connected verticals. Vessels, Terra, PRISM, SZL Holdings — crisis banner active. Cross-domain impact assessment underway.", type: "broadcast" },
];

const COMM_COLORS: Record<string, string> = {
  intel: "#8b5cf6",
  action: "#ef4444",
  escalation: "#f97316",
  update: "#3b82f6",
  broadcast: "#22d3ee",
};

const STATUS_COLORS: Record<string, string> = { active: "#22c55e", standby: "#f59e0b", unavailable: "#64748b" };
const DECISION_COLORS: Record<string, string> = { enacted: "#22c55e", pending: "#f59e0b", superseded: "#64748b" };

type WarRoomTab = "timeline" | "resources" | "decisions" | "comms";

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="font-mono tabular-nums">{time.toISOString().slice(11, 19)} UTC</span>;
}

function ElapsedTimer({ startMin }: { startMin: number }) {
  const [elapsed, setElapsed] = useState(startMin);
  useEffect(() => { const t = setInterval(() => setElapsed(e => e + 1 / 60), 1000); return () => clearInterval(t); }, [startMin]);
  const h = Math.floor(elapsed / 60);
  const m = Math.floor(elapsed % 60);
  const s = Math.floor((elapsed * 60) % 60);
  return <span className="font-mono tabular-nums">{h > 0 ? `${h}h ` : ""}{m}m {String(s).padStart(2, "0")}s</span>;
}

export default function CitadelWarRoom() {
  const [activeTab, setActiveTab] = useState<WarRoomTab>("timeline");
  const [crisisActive] = useState(true);
  const [newComm, setNewComm] = useState("");
  const [comms, setComms] = useState(COMMS);
  const commEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comms]);

  const sendComm = () => {
    if (!newComm.trim()) return;
    const entry: CommEntry = {
      id: `C${Date.now()}`,
      time: new Date().toISOString().slice(11, 16),
      from: "You",
      role: "War Room Operator",
      message: newComm.trim(),
      type: "update",
    };
    setComms(prev => [...prev, entry]);
    setNewComm("");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: DS.bg, color: DS.text.primary }}>
      <div className="shrink-0 px-4 py-2.5 border-b flex items-center gap-3" style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-bold tracking-tight text-red-400">CITADEL WAR ROOM</span>
          <span className="text-[9px] px-2 py-0.5 rounded font-mono uppercase font-bold" style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}>ICS L{ACTIVE_CRISIS.icsLevel} ACTIVE</span>
        </div>
        <div className="h-4 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold truncate" style={{ color: DS.text.primary }}>{ACTIVE_CRISIS.name}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>{ACTIVE_CRISIS.type}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}>{ACTIVE_CRISIS.phase}</span>
          </div>
          <p className="text-[10px] truncate" style={{ color: DS.text.muted }}>{ACTIVE_CRISIS.impactSummary}</p>
        </div>
        <div className="shrink-0 flex items-center gap-4">
          <div className="text-right">
            <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>ELAPSED</div>
            <div className="text-[11px] text-red-400"><ElapsedTimer startMin={ACTIVE_CRISIS.elapsedMin} /></div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>WAR ROOM TIME</div>
            <div className="text-[11px]" style={{ color: DS.text.secondary }}><LiveClock /></div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>COMMANDER</div>
            <div className="text-[11px] font-semibold" style={{ color: DS.text.primary }}>{ACTIVE_CRISIS.commander}</div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-0 px-4 border-b" style={{ borderColor: DS.border }}>
        {([
          { id: "timeline", label: "Crisis Timeline", icon: Activity },
          { id: "resources", label: "Resource Board", icon: Users },
          { id: "decisions", label: "Decision Log", icon: ClipboardList },
          { id: "comms", label: "Comm Feed", icon: Radio },
        ] as { id: WarRoomTab; label: string; icon: typeof Activity }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold transition-all border-b-2"
            style={{
              borderColor: activeTab === id ? "#ef4444" : "transparent",
              color: activeTab === id ? "#ef4444" : DS.text.muted,
              background: activeTab === id ? "rgba(239,68,68,0.04)" : "transparent",
            }}
          >
            <Icon className="w-3 h-3" />
            {label}
            {id === "comms" && <span className="text-[8px] px-1 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>{comms.length}</span>}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 py-1.5">
          <a href="./citadel-playbooks" className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold transition-all" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            <Zap className="w-3 h-3" />
            Playbooks
          </a>
          <a href="./citadel-after-action" className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold transition-all" style={{ background: "rgba(255,255,255,0.05)", color: DS.text.secondary, border: "1px solid rgba(255,255,255,0.08)" }}>
            <FileText className="w-3 h-3" />
            After-Action
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "timeline" && (
          <div className="h-full overflow-y-auto px-4 py-3">
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DS.text.muted }}>Minute-by-Minute Event Log</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>LIVE · {TIMELINE_EVENTS.length} events</span>
                </div>
                <div className="flex gap-2">
                  {(["critical", "high", "medium", "info"] as const).map(s => (
                    <div key={s} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEV[s] }} />
                      <span className="text-[8px] capitalize font-mono" style={{ color: DS.text.muted }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-0">
                {TIMELINE_EVENTS.map((event, i) => (
                  <div key={event.id} className="flex gap-3 relative">
                    {i < TIMELINE_EVENTS.length - 1 && (
                      <div className="absolute left-[14px] top-8 bottom-0 w-px" style={{ background: `${SEV[event.severity]}20` }} />
                    )}
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                      <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center" style={{ background: `${SEV[event.severity]}15`, border: `1px solid ${SEV[event.severity]}30` }}>
                        {event.confirmed
                          ? <CheckCircle className="w-3 h-3" style={{ color: SEV[event.severity] }} />
                          : <Circle className="w-3 h-3 animate-pulse" style={{ color: SEV[event.severity] }} />}
                      </div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono font-bold" style={{ color: SEV[event.severity] }}>{event.elapsed}</span>
                        <span className="text-[10px] font-mono" style={{ color: DS.text.muted }}>{event.time}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold" style={{ background: `${SEV[event.severity]}15`, color: SEV[event.severity] }}>{event.severity}</span>
                        {!event.confirmed && <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold animate-pulse" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>PENDING CONFIRM</span>}
                      </div>
                      <div className="rounded-lg p-3" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
                        <h3 className="text-[12px] font-semibold mb-1" style={{ color: DS.text.primary }}>{event.title}</h3>
                        <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>{event.detail}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>Source: {event.source}</span>
                          {event.actor && <span className="text-[9px] font-semibold" style={{ color: "#ef4444" }}>· {event.actor}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "resources" && (
          <div className="h-full overflow-y-auto px-4 py-3">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DS.text.muted }}>Resource Allocation Board</span>
              <div className="flex items-center gap-3">
                {(["active", "standby", "unavailable"] as const).map(s => (
                  <div key={s} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[s] }} />
                    <span className="text-[9px] capitalize font-mono" style={{ color: DS.text.muted }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {RESOURCES.map(r => (
                <div key={r.id} className="rounded-xl p-3" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[r.status] }} />
                        <span className="text-[11px] font-semibold truncate" style={{ color: DS.text.primary }}>{r.name}</span>
                        {r.status === "active" && <span className="text-[7px] px-1 py-0.5 rounded-full uppercase font-bold" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>LIVE</span>}
                      </div>
                      <p className="text-[10px] font-semibold" style={{ color: DS.text.secondary }}>{r.role}</p>
                    </div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(255,255,255,0.05)", color: DS.text.muted }}>{r.domain}</span>
                  </div>
                  <p className="text-[10px] leading-snug" style={{ color: DS.text.muted }}>{r.task}</p>
                  {r.eta && <p className="text-[9px] mt-1.5 font-mono" style={{ color: "#f59e0b" }}>ETA: {r.eta}</p>}
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl p-3" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(239,68,68,0.7)" }}>Escalation Chain — ICS L3</p>
              <div className="flex items-center gap-2 flex-wrap">
                {["J. Chen (IC)", "→ CISO (P. Santos)", "→ CEO (Board)", "→ External IR (CrowdStrike)"].map((step, i) => (
                  <span key={i} className="text-[10px] px-2 py-1 rounded" style={{ background: "rgba(239,68,68,0.08)", color: i === 0 ? "#ef4444" : DS.text.secondary }}>
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "decisions" && (
          <div className="h-full overflow-y-auto px-4 py-3">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DS.text.muted }}>Decision Log · Immutable Record</span>
              <div className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: DS.text.muted }}>
                <Lock className="w-3 h-3" />
                Tamper-evident · {DECISIONS.length} decisions logged
              </div>
            </div>
            <div className="space-y-3 max-w-3xl">
              {DECISIONS.map((d, i) => (
                <div key={d.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
                  <div className="px-4 py-2 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: DS.text.muted }}>D{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-semibold" style={{ color: DS.text.primary }}>{d.title}</span>
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>{d.time}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0" style={{ background: `${DECISION_COLORS[d.status]}15`, color: DECISION_COLORS[d.status] }}>{d.status}</span>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>Rationale</p>
                      <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>{d.rationale}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>Outcome</p>
                      <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>{d.outcome}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] font-mono" style={{ color: DS.text.muted }}>Decided by: <span style={{ color: DS.text.secondary }}>{d.decidedBy}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "comms" && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {comms.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="shrink-0 pt-0.5">
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${COMM_COLORS[c.type]}15`, border: `1px solid ${COMM_COLORS[c.type]}25` }}>
                      {c.type === "intel" && <Brain className="w-3 h-3" style={{ color: COMM_COLORS[c.type] }} />}
                      {c.type === "action" && <Zap className="w-3 h-3" style={{ color: COMM_COLORS[c.type] }} />}
                      {c.type === "update" && <Activity className="w-3 h-3" style={{ color: COMM_COLORS[c.type] }} />}
                      {c.type === "broadcast" && <Radio className="w-3 h-3" style={{ color: COMM_COLORS[c.type] }} />}
                      {c.type === "escalation" && <AlertTriangle className="w-3 h-3" style={{ color: COMM_COLORS[c.type] }} />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold" style={{ color: DS.text.primary }}>{c.from}</span>
                      <span className="text-[9px]" style={{ color: DS.text.muted }}>{c.role}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded uppercase font-bold" style={{ background: `${COMM_COLORS[c.type]}12`, color: COMM_COLORS[c.type] }}>{c.type}</span>
                      {c.priority === "urgent" && <span className="text-[7px] px-1 py-0.5 rounded uppercase font-bold animate-pulse" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>URGENT</span>}
                      <span className="ml-auto text-[9px] font-mono shrink-0" style={{ color: DS.text.muted }}>{c.time}</span>
                    </div>
                    <div className="rounded-lg px-3 py-2" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
                      <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>{c.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={commEndRef} />
            </div>
            <div className="shrink-0 px-4 py-3 border-t flex gap-2" style={{ borderColor: DS.border }}>
              <input
                type="text"
                value={newComm}
                onChange={e => setNewComm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendComm()}
                placeholder="Enter war room communication..."
                className="flex-1 px-3 py-2 rounded-lg text-[11px] outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: DS.text.primary }}
              />
              <button
                onClick={sendComm}
                className="px-4 py-2 rounded-lg text-[11px] font-semibold transition-all"
                style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
