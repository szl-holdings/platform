import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, FileText, Shield, AlertTriangle, Target, CheckCircle2,
  Clock, Download, Copy, ChevronDown, ChevronRight, Loader2, RefreshCw,
  TrendingUp, TrendingDown, Minus, Eye, Brain, Lock, Zap
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { api } from "@/lib/api";

const BG = "#070A10";

interface Incident {
  id: number;
  title: string;
  severity: string;
  status: string;
  assignedAnalyst?: string;
  description?: string;
  createdAt?: string;
  resolvedAt?: string | null;
}

const MOCK_INCIDENTS: Incident[] = [
  { id: 1001, title: "APT29 Suspected Lateral Movement — Finance Subnet", severity: "critical", status: "open", assignedAnalyst: "J. Chen", description: "Cozy Bear TTPs detected via UEBA correlation. C2 traffic to 185.220.101.x confirmed on WKST-0041 and WKST-0044. Dwell time estimated 45 days.", createdAt: "2025-04-04T09:00:00Z" },
  { id: 1002, title: "Ransomware Deployment — Sacsayhuamán Crisis", severity: "critical", status: "contained", assignedAnalyst: "L. Kim", description: "LockBit 3.0 deployed across 12 endpoints. 40% file encryption. Backup integrity under review.", createdAt: "2025-04-02T02:14:00Z", resolvedAt: null },
  { id: 1003, title: "Privilege Escalation via CVE-2024-21447 — WKST-0019", severity: "high", status: "mitigated", assignedAnalyst: "M. Walsh", description: "Exploit targeting Windows print spooler used to elevate from local user to SYSTEM. Patched and isolated.", createdAt: "2025-04-01T11:00:00Z", resolvedAt: "2025-04-01T16:00:00Z" },
  { id: 1004, title: "Data Exfiltration Attempt — Insider Threat Signal", severity: "high", status: "investigating", assignedAnalyst: "S. Ramirez", description: "UEBA flagged 4.2GB transfer to personal Dropbox. Analyst on notice. HR, Legal, CISO involved.", createdAt: "2025-04-03T23:47:00Z" },
];

interface BriefSection {
  id: string;
  title: string;
  icon: typeof BookOpen;
  content: string[];
}

function generateBrief(incident: Incident): BriefSection[] {
  const isCritical = incident.severity === "critical";
  const isOpen = incident.status === "open" || incident.status === "investigating";

  return [
    {
      id: "situation",
      title: "Situation Summary",
      icon: FileText,
      content: [
        `${incident.title} was ${isOpen ? "identified and is currently active" : "identified and has been contained"}.`,
        incident.description ?? "No additional description available.",
        `Classification: ${incident.severity.toUpperCase()} severity · Status: ${incident.status.toUpperCase()}`,
        `Lead Analyst: ${incident.assignedAnalyst ?? "Unassigned"} · First detected: ${incident.createdAt ? new Date(incident.createdAt).toLocaleString() : "Unknown"}`,
      ],
    },
    {
      id: "assumptions",
      title: "Key Assumptions (Explicit)",
      icon: Brain,
      content: [
        isCritical
          ? "ASSUMPTION: Adversary may have had access to systems prior to initial detection. Dwell time is estimated, not confirmed."
          : "ASSUMPTION: Threat was limited to the initially identified systems and scope.",
        "ASSUMPTION: Backup integrity has not yet been confirmed — recovery timelines are provisional.",
        `ASSUMPTION: ${incident.assignedAnalyst ?? "Lead analyst"} findings are based on available telemetry at the time of reporting. New evidence may revise these assessments.`,
        isOpen
          ? "ASSUMPTION: All persistence mechanisms may not yet have been identified."
          : "ASSUMPTION: Eradication is complete based on current evidence — re-compromise is possible if assumptions are incorrect.",
      ],
    },
    {
      id: "unknowns",
      title: "Gaps & Unknowns",
      icon: Eye,
      content: [
        isCritical
          ? "UNKNOWN: Full scope of data accessed by adversary during dwell period. This cannot be confirmed without forensic completion."
          : "UNKNOWN: Whether this is an isolated event or part of a broader campaign.",
        "UNKNOWN: Whether additional systems outside initial telemetry scope were accessed.",
        "UNKNOWN: Identity and attribution of adversary actor — threat intel confidence is moderate.",
        isOpen
          ? "UNKNOWN: Total exfiltration volume and data sensitivity of accessed records."
          : "UNKNOWN: Whether this vulnerability class exists on other systems not yet assessed.",
      ],
    },
    {
      id: "alternatives",
      title: "Alternative Scenarios (Not Eliminated)",
      icon: Target,
      content: [
        isCritical
          ? "ALTERNATIVE: Observed activity may represent a decoy/diversion while primary adversary actions occur elsewhere in the environment."
          : "ALTERNATIVE: This incident may be a precursor reconnaissance activity rather than the primary threat action.",
        "ALTERNATIVE: Insider involvement cannot be fully excluded at this stage pending HR investigation.",
        "ALTERNATIVE: Threat actor may have achieved persistence via a second, undetected mechanism.",
      ],
    },
    {
      id: "recommendations",
      title: "Recommended Board Actions",
      icon: CheckCircle2,
      content: [
        "IMMEDIATE: Authorize emergency containment spend — estimated $X based on current scope. IR retainer activation recommended.",
        isCritical
          ? "IMMEDIATE: Legal and regulatory review required — potential notification obligations under GDPR (72h) and applicable state breach laws."
          : "SHORT-TERM: Legal review recommended to assess notification obligations.",
        "SHORT-TERM: Commission third-party forensic investigation to establish confirmed scope before executive communications.",
        "STRATEGIC: Initiate post-incident review of detection controls. Specific gaps identified: [endpoint isolation automation, vendor access monitoring].",
        "COMMUNICATIONS: Prepare holding statement for customer/partner inquiry. Do not confirm breach scope until forensics are complete.",
      ],
    },
    {
      id: "posture",
      title: "Current Security Posture Impact",
      icon: Shield,
      content: [
        `Threat Level: ${isCritical ? "CRITICAL — Board notification threshold met" : "HIGH — Elevated monitoring required"}`,
        "Confidence in Contained Status: " + (isOpen ? "LOW — Incident is active" : "MODERATE — Containment complete, eradication unverified"),
        "Residual Risk: " + (isCritical ? "HIGH — Unknown scope and potential persistence" : "MEDIUM — Specific systems mitigated, broader attack surface unreviewed"),
        "Recommended Board Review Cadence: " + (isCritical ? "Daily until downgraded" : "Weekly review at next governance meeting"),
      ],
    },
  ];
}

const SEVERITY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  critical: { text: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/20" },
  high: { text: "text-orange-300", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  medium: { text: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  low: { text: "text-blue-300", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  open: AlertTriangle,
  investigating: Brain,
  contained: Lock,
  mitigated: CheckCircle2,
  closed: CheckCircle2,
};

function IncidentSelector({ incidents, selected, onSelect }: { incidents: Incident[]; selected: Incident | null; onSelect: (i: Incident) => void }) {
  return (
    <div className="space-y-2">
      {incidents.map(inc => {
        const sev = SEVERITY_COLORS[inc.severity] || SEVERITY_COLORS.medium;
        const StatusIcon = STATUS_ICONS[inc.status] || AlertTriangle;
        const isSelected = selected?.id === inc.id;
        return (
          <button
            key={inc.id}
            onClick={() => onSelect(inc)}
            className={cn("w-full text-left p-4 rounded-xl border transition-all", isSelected ? "border-blue-500/30 bg-blue-500/5" : "border-white/5 bg-white/[0.02] hover:border-white/10")}
          >
            <div className="flex items-start gap-3">
              <div className={cn("px-1.5 py-0.5 rounded text-[8px] font-mono uppercase shrink-0 mt-0.5", sev.text, sev.bg, sev.border)}>
                {inc.severity}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{inc.title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[9px] text-white/30">
                  <StatusIcon size={9} />
                  <span>{inc.status}</span>
                  <span>·</span>
                  <span>#{inc.id}</span>
                  {inc.assignedAnalyst && <><span>·</span><span>{inc.assignedAnalyst}</span></>}
                </div>
              </div>
              <ChevronRight size={12} className={cn("shrink-0 text-white/20 transition-transform", isSelected && "rotate-90 text-blue-400")} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function BriefSectionCard({ section }: { section: BriefSection }) {
  const [expanded, setExpanded] = useState(true);
  const Icon = section.icon;
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-white/50" />
          <span className="text-xs font-bold text-white">{section.title}</span>
        </div>
        {expanded ? <ChevronDown size={12} className="text-white/30" /> : <ChevronRight size={12} className="text-white/30" />}
      </button>
      {expanded && (
        <div className="px-5 pb-4 pt-1 space-y-2">
          {section.content.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[11px] leading-relaxed">
              <div className="w-1 h-1 rounded-full bg-white/20 shrink-0 mt-2" />
              <p className="text-white/60">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BoardBriefGenerator() {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [generating, setGenerating] = useState(false);
  const [brief, setBrief] = useState<BriefSection[] | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: liveIncidents, isLoading } = useQuery({
    queryKey: ["incidents-brief"],
    queryFn: () => api.incidents.list(),
    retry: false,
  });

  const incidents: Incident[] = Array.isArray(liveIncidents) && liveIncidents.length > 0 ? liveIncidents : MOCK_INCIDENTS;

  const handleGenerate = () => {
    if (!selectedIncident) return;
    setGenerating(true);
    setBrief(null);
    setTimeout(() => {
      setBrief(generateBrief(selectedIncident));
      setGenerating(false);
    }, 1200);
  };

  const handleCopy = () => {
    if (!brief || !selectedIncident) return;
    const text = [
      `EXECUTIVE BOARD BRIEF — RESTRICTED`,
      `Incident: ${selectedIncident.title} (#${selectedIncident.id})`,
      `Generated: ${new Date().toLocaleString()}`,
      `Classification: FOR BOARD USE ONLY`,
      ``,
      ...brief.map(s => [
        `## ${s.title.toUpperCase()}`,
        ...s.content.map(c => `• ${c}`),
        ``
      ].join("\n")),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: BG, color: "#e2e8f0" }}>
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h1 className="text-sm font-bold text-white">Executive Board Brief Generator</h1>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/5 text-cyan-400/70">RESTRICTED</span>
          </div>
          {brief && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors"
            >
              <Copy size={11} />
              {copied ? "Copied!" : "Copy Brief"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Incident selector */}
        <div className="w-[40%] border-r border-white/5 overflow-y-auto px-5 py-4">
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">
            {isLoading ? "Loading incidents…" : `Select Incident for Brief (${incidents.length})`}
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-white/30 text-xs gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : (
            <IncidentSelector incidents={incidents} selected={selectedIncident} onSelect={inc => { setSelectedIncident(inc); setBrief(null); }} />
          )}
        </div>

        {/* RIGHT: Brief generation */}
        <div className="w-[60%] overflow-y-auto px-5 py-4 flex flex-col">
          {!selectedIncident ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
              <BookOpen size={32} className="text-cyan-500/20 mb-4" />
              <p className="text-sm text-white/30 mb-1">Select an incident</p>
              <p className="text-[11px] text-white/20 leading-relaxed max-w-xs">
                Choose an incident from the left panel to generate a structured executive board brief with situation, assumptions, unknowns, alternatives, and recommended actions.
              </p>
            </div>
          ) : !brief && !generating ? (
            <div className="flex flex-col flex-1">
              <div className="mb-5">
                <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Selected Incident</div>
                <h2 className="text-sm font-bold text-white mb-1">{selectedIncident.title}</h2>
                <div className="text-[11px] text-white/40">{selectedIncident.description}</div>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] mb-5 text-[11px] text-white/40 leading-relaxed">
                The brief will include: <span className="text-white/60">Situation Summary · Key Assumptions (Explicit) · Gaps & Unknowns · Alternative Scenarios · Recommended Board Actions · Posture Impact</span>
                <br /><br />
                All assumptions and unknowns are explicitly labeled per structured analytic tradecraft standards. The brief is formatted for director-level and board-level audiences.
              </div>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold self-start transition-all bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/15"
              >
                <FileText size={14} /> Generate Board Brief
              </button>
            </div>
          ) : generating ? (
            <div className="flex items-center justify-center flex-1 gap-3 text-white/40">
              <Loader2 size={18} className="animate-spin text-cyan-400" />
              <span className="text-sm">Generating structured brief…</span>
            </div>
          ) : brief ? (
            <div className="flex-1">
              <div className="border border-white/5 bg-white/[0.015] rounded-xl p-4 mb-4">
                <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">EXECUTIVE BOARD BRIEF — RESTRICTED</div>
                <h2 className="text-sm font-bold text-white">{selectedIncident.title}</h2>
                <div className="text-[10px] text-white/30 mt-1">#{selectedIncident.id} · Generated {new Date().toLocaleString()} · Classification: Board Eyes Only</div>
              </div>
              <div className="space-y-2.5">
                {brief.map(section => (
                  <BriefSectionCard key={section.id} section={section} />
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition-colors">
                  <RefreshCw size={11} /> Regenerate
                </button>
                <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/15 transition-colors">
                  <Copy size={11} /> {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
