import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, CheckCircle, X, ChevronDown, ChevronRight, ChevronUp,
  Home, Package, Plane, Users, Thermometer, Calendar,
  AlertCircle, Edit3, Sparkles, Clock, Send, FileText,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getCadencePref, getCommsPref } from "@/data/genome-data";

const GOLD = "rgba(196,170,126,1)";
const GOLD_DIM = "rgba(196,170,126,0.08)";
const GOLD_BORDER = "rgba(196,170,126,0.15)";
const CREAM = "rgba(244,237,224,0.88)";
const CREAM_DIM = "rgba(244,237,224,0.45)";
const CREAM_FAINT = "rgba(244,237,224,0.07)";
const MUTED = "rgba(244,237,224,0.25)";
const GREEN = "rgba(16,185,129,0.85)";
const GREEN_DIM = "rgba(16,185,129,0.08)";
const GREEN_BORDER = "rgba(16,185,129,0.2)";

type ActionStatus = "pending" | "approved" | "modified" | "dismissed";
type ConfidenceLevel = "high" | "medium" | "low";

type ActionPlanItem = {
  label: string;
  detail: string;
  type: "vendor-contact" | "calendar" | "staff" | "checklist";
};

type GenomeSignal = {
  label: string;
  value: string;
  source: string;
  occurrences: number;
};

type ActionPlan = {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  summary: string;
  scheduledFor: string;
  genomeSignals: GenomeSignal[];
  actionItems: ActionPlanItem[];
  draftComm?: string;
  status: ActionStatus;
};

const confidenceConfig: Record<ConfidenceLevel, { color: string; bg: string; label: string }> = {
  high: { color: GREEN, bg: GREEN_DIM, label: "High confidence" },
  medium: { color: GOLD, bg: GOLD_DIM, label: "Medium confidence" },
  low: { color: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.08)", label: "Low confidence" },
};

const actionTypeConfig: Record<ActionPlanItem["type"], { icon: React.ElementType; label: string; color: string }> = {
  "vendor-contact": { icon: Send, label: "Vendor communication", color: "rgba(6,182,212,0.8)" },
  calendar: { icon: Calendar, label: "Calendar update", color: GOLD },
  staff: { icon: Users, label: "Staff adjustment", color: "rgba(139,92,246,0.8)" },
  checklist: { icon: FileText, label: "Checklist item", color: "rgba(245,158,11,0.8)" },
};

const actionPlans: ActionPlan[] = [
  {
    id: "ap1",
    title: "Oxfordshire Estate Opening — Full Activation Plan",
    category: "Residence Operations",
    icon: Home,
    confidence: "high",
    confidenceScore: 94,
    scheduledFor: "Week of 14 April 2026",
    summary: "Complete action plan for Oxfordshire Estate spring opening. System has generated vendor contacts, staff schedule adjustments, and a seasonal prep checklist based on the 2-year pattern.",
    genomeSignals: [
      { label: "Summer residence", value: "Oxfordshire Estate — May to September", source: "Observed 2 consecutive years", occurrences: 2 },
      { label: "Vendor access protocol", value: "All vendors must confirm 48h in advance", source: "Explicit instruction", occurrences: 4 },
    ],
    actionItems: [
      { label: "Draft: Caretaker opening inspection request", detail: "Email to James Alderton requesting inspection availability week of 14–18 April. References 2025 inspection format and includes pre-open checklist attachment.", type: "vendor-contact" },
      { label: "Draft: Oxfordshire grounds (Evergreen Estate Services) — summer schedule", detail: "Renewal of seasonal grounds maintenance contract. Proposed start date: 5 May 2026. References 2025 scope.", type: "vendor-contact" },
      { label: "Draft: Pool maintenance (Aqua Premier) — summer availability", detail: "Annual pool contract renewal. Note: 2025 delayed confirmation caused 3-week gap. Priority outreach.", type: "vendor-contact" },
      { label: "Calendar: Oxfordshire opening inspection — 14 April", detail: "Blocked in Household Rhythm Calendar. Marked as pending caretaker confirmation.", type: "calendar" },
      { label: "Calendar: Estate opening — 5 May 2026 (predicted)", detail: "Seasonal transition marker added. Flagged as high-confidence prediction.", type: "calendar" },
      { label: "Checklist: Pre-opening inspection items", detail: "Heating system, window seals, outdoor furniture inventory, garden irrigation, pool chemistry test, external lighting, staff wing inspection.", type: "checklist" },
    ],
    draftComm: "Subject: Oxfordshire Estate — Spring Opening 2026\n\nDear James,\n\nAs we approach the spring season, I am writing to arrange the annual opening inspection for the Oxfordshire estate, in advance of the May opening.\n\nWould you be available for the inspection during the week of 14–18 April? As in previous years, the walk-through will follow the standard pre-open checklist — I will send this ahead of the visit.\n\nPlease confirm your availability at your earliest convenience.\n\nKind regards,\nRosa\nOn behalf of the Principal",
    status: "pending",
  },
  {
    id: "ap2",
    title: "Mayfair Summer Staff Cover — Mrs. Chambers Leave",
    category: "Household Systems",
    icon: Users,
    confidence: "high",
    confidenceScore: 88,
    scheduledFor: "Action required by 30 April 2026",
    summary: "Mrs. Chambers will take her annual 6-week leave in July–August. No cover has been arranged for 2026. This plan stages an outreach to the preferred agency and a staff schedule adjustment.",
    genomeSignals: [
      { label: "Staff comms protocol", value: "All staff to report to Rosa first. No direct client contact.", source: "Service plan", occurrences: 8 },
      { label: "Tolerance for surprises", value: "Zero. All changes briefed in advance.", source: "Explicit instruction", occurrences: 3 },
    ],
    actionItems: [
      { label: "Draft: Knightsbridge Domestic Agency — cover request", detail: "Request for experienced housekeeper to cover 13 July – 24 August 2026 at Mayfair residence. Outlines property standards, fragrance-free requirement, and NDA requirement.", type: "vendor-contact" },
      { label: "Staff schedule: Flag July–August cover period", detail: "Mrs. Chambers leave window marked in staff rota. Cover period highlighted for confirmation.", type: "staff" },
      { label: "Checklist: Onboarding protocol for temporary cover", detail: "Property access briefing, household standards document, fragrance-free product list, security code handover protocol, escalation contact (Rosa only).", type: "checklist" },
      { label: "Calendar: Cover period — 13 July to 24 August", detail: "Flagged in Household Rhythm Calendar. Marked pending agency confirmation.", type: "calendar" },
    ],
    draftComm: "Subject: Temporary Housekeeper Cover — Mayfair — July/August 2026\n\nDear Karen,\n\nI am writing in advance to secure experienced temporary cover for our Mayfair residence during the period 13 July – 24 August 2026, while our regular housekeeper takes annual leave.\n\nThe role requires an experienced professional with a high-standard private household background. Key requirements:\n— All products used must be fragrance-free (non-negotiable)\n— Full briefing on household protocols prior to commencement\n— NDA required before placement confirmed\n— All liaison through me directly — no direct contact with the principal\n\nPlease confirm availability and send suitable candidate profiles by 15 April.\n\nKind regards,\nRosa",
    status: "pending",
  },
  {
    id: "ap3",
    title: "New York June Travel — Pre-Arrangements",
    category: "Travel & Lifestyle",
    icon: Plane,
    confidence: "medium",
    confidenceScore: 73,
    scheduledFor: "Initiate by 20 April 2026",
    summary: "Based on the established June New York pattern (2023, 2024, 2025), the system has pre-staged preferred hotel hold, ground transport contact, and a calendar block pending confirmation.",
    genomeSignals: [
      { label: "Travel frequency", value: "New York, Monaco, Dubai — 4–6 times per year", source: "Session notes, travel coordination", occurrences: 3 },
      { label: "Decision threshold", value: "Items under £2,000 — Rosa decides. Above: brief summary for approval.", source: "Engagement agreement", occurrences: 1 },
    ],
    actionItems: [
      { label: "Draft: The Carlyle — June provisional hold", detail: "Request for tentative hold on preferred suite, 8–14 June 2026 (flexible ±3 days). To be confirmed or released by 1 May.", type: "vendor-contact" },
      { label: "Draft: Executive ground transport — NYC dates", detail: "Preliminary outreach to Carey NYC for preferred car service availability. Dates to be confirmed.", type: "vendor-contact" },
      { label: "Calendar: New York travel window — June 2026 (predicted)", detail: "Placeholder added to Household Rhythm Calendar. Flagged as medium-confidence prediction — awaiting client confirmation.", type: "calendar" },
    ],
    draftComm: "Subject: June Travel — Provisional Hold Request\n\nDear Reservations Team,\n\nI am writing on behalf of a valued client to request a provisional hold on their preferred suite for the period 8–14 June 2026.\n\nWe anticipate confirming or releasing this hold by 1 May 2026. Please advise on suite availability and whether a provisional hold is possible on this basis.\n\nThank you for your discretion — our client prefers that no confirmation be communicated directly.\n\nKind regards,\nRosa\nCarlota Jo Advisory",
    status: "pending",
  },
  {
    id: "ap4",
    title: "Annual Heating System Service — Both Properties",
    category: "Maintenance",
    icon: Thermometer,
    confidence: "high",
    confidenceScore: 91,
    scheduledFor: "Outreach in May 2026, service September 2026",
    summary: "Annual boiler and heating service for Mayfair and Oxfordshire. Early outreach to Heritage Heating secures preferred September dates before their autumn booking window fills.",
    genomeSignals: [
      { label: "Winter base", value: "Mayfair — October to April", source: "Observed 2 consecutive years", occurrences: 2 },
      { label: "Summer residence", value: "Oxfordshire Estate — May to September", source: "Observed 2 consecutive years", occurrences: 2 },
    ],
    actionItems: [
      { label: "Draft: Heritage Heating — pre-book September service slots", detail: "Request for two service appointments: Mayfair (preferred 7–11 September) and Oxfordshire (preferred 14–18 September). References 2024 late booking issue.", type: "vendor-contact" },
      { label: "Calendar: Mayfair heating service — September 2026", detail: "Staged calendar entry. Dates to be confirmed with Heritage Heating.", type: "calendar" },
      { label: "Calendar: Oxfordshire heating service — September 2026", detail: "Staged calendar entry. Back-to-back with Mayfair service preferred.", type: "calendar" },
      { label: "Checklist: Pre-service property prep", detail: "Clear boiler room access (both properties), notify caretakers, confirm staff presence for engineer visit (48h vendor notice protocol).", type: "checklist" },
    ],
    draftComm: "Subject: Annual Heating Service — Pre-Booking Request — 2026\n\nDear Heritage Heating,\n\nI am writing to arrange the annual boiler and heating system service for two residential properties for September 2026.\n\nWe would prefer:\n— Mayfair residence: week of 7–11 September\n— Oxfordshire estate: week of 14–18 September\n\nAs in previous years, all access must be arranged with 48 hours advance notice. An NDA applies to all visits.\n\nPlease confirm availability and send proposed dates at your convenience.\n\nKind regards,\nRosa\nOn behalf of the Principal",
    status: "pending",
  },
  {
    id: "ap5",
    title: "Q3 Review Session — Schedule and Brief",
    category: "Engagement Cadence",
    icon: Calendar,
    confidence: "high",
    confidenceScore: 96,
    scheduledFor: "Propose by 30 April 2026",
    summary: "Quarterly review session is due early July. Client is typically abroad in late June. The system has pre-drafted a schedule proposal and a brief outline agenda for Rosa to review.",
    genomeSignals: [
      { label: "Review time preference", value: "Morning, before 10:00 AM", source: "Session scheduling history", occurrences: 4 },
      { label: "Communication window", value: "9:00 AM – 7:00 PM", source: "Message pattern analysis", occurrences: 14 },
    ],
    actionItems: [
      { label: "Draft: Q3 review session — scheduling note", detail: "Brief note proposing 6 or 7 July, 9:00 AM, Mayfair. Soft confirmation requested. References Q2 review format.", type: "vendor-contact" },
      { label: "Calendar: Q3 Review Session — 6 July 2026 (proposed)", detail: "Staged in Household Rhythm Calendar as proposed. Awaiting confirmation.", type: "calendar" },
      { label: "Checklist: Q3 review prep agenda", detail: "Summer operations review, Oxfordshire season report, autumn transition planning, annual heating service update, vendor performance notes, Q4 priorities.", type: "checklist" },
    ],
    status: "pending",
  },
];

function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 85 ? GREEN : score >= 65 ? GOLD : "rgba(239,68,68,0.85)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-light tabular-nums shrink-0" style={{ color }}>{score}%</span>
    </div>
  );
}

function GenomeSignalRow({ signal }: { signal: GenomeSignal }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5" style={{ borderBottom: `1px solid ${CREAM_FAINT}` }}>
      <Sparkles size={9} className="shrink-0 mt-0.5" style={{ color: "rgba(196,170,126,0.4)" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[10px] tracking-[0.12em] uppercase" style={{ color: GOLD }}>{signal.label}</p>
          <span
            className="text-[8px] tracking-wider px-1 py-0.5"
            style={{ color: GREEN, background: GREEN_DIM, border: `1px solid ${GREEN_BORDER}` }}
          >
            {signal.occurrences}× observed
          </span>
        </div>
        <p className="text-[11px] font-light" style={{ color: CREAM_DIM }}>{signal.value}</p>
        <p className="text-[9px] mt-0.5" style={{ color: MUTED }}>{signal.source}</p>
      </div>
    </div>
  );
}

function ActionItemRow({ item }: { item: ActionPlanItem }) {
  const cfg = actionTypeConfig[item.type];
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: `1px solid ${CREAM_FAINT}` }}>
      <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(255,255,255,0.04)" }}>
        <cfg.icon size={10} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[8px] tracking-[0.15em] uppercase" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
        <p className="text-[12px] font-light mb-0.5" style={{ color: CREAM }}>{item.label}</p>
        <p className="text-[10px] font-light leading-relaxed" style={{ color: CREAM_DIM }}>{item.detail}</p>
      </div>
    </div>
  );
}

function DraftCommPanel({ draft }: { draft: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase mb-2 transition-opacity hover:opacity-80"
        style={{ color: "rgba(6,182,212,0.7)" }}
        onClick={() => setOpen(!open)}
      >
        <Send size={9} />
        View draft vendor communication
        {open ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="p-4 font-light text-[11px] leading-relaxed whitespace-pre-line"
              style={{
                background: "rgba(6,182,212,0.04)",
                border: `1px solid rgba(6,182,212,0.12)`,
                color: CREAM_DIM,
              }}
            >
              {draft}
            </div>
            <p className="text-[9px] mt-1.5 font-light" style={{ color: MUTED }}>
              Draft communication — for Rosa to review and send. Not transmitted until approved.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionPlanCard({
  plan,
  onApprove,
  onDismiss,
  onModify,
}: {
  plan: ActionPlan;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  onModify: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = confidenceConfig[plan.confidence];

  if (plan.status === "dismissed") return null;

  const isApproved = plan.status === "approved";
  const isModified = plan.status === "modified";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isApproved || isModified ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      style={{
        border: `1px solid ${isApproved ? GREEN_BORDER : GOLD_BORDER}`,
        background: isApproved ? "rgba(16,185,129,0.04)" : "rgba(14,12,9,0.55)",
      }}
    >
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: isApproved ? GREEN_DIM : GOLD_DIM, border: `1px solid rgba(255,255,255,0.04)` }}
          >
            {isApproved
              ? <CheckCircle size={13} style={{ color: GREEN }} />
              : <plan.icon size={13} style={{ color: GOLD }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[8px] tracking-[0.2em] uppercase px-1.5 py-0.5"
                style={{ color: cfg.color, background: cfg.bg }}
              >
                {cfg.label}
              </span>
              <span className="text-[9px] tracking-wider uppercase" style={{ color: MUTED }}>
                {plan.category}
              </span>
              {isApproved && (
                <span className="text-[8px] tracking-[0.2em] uppercase px-1.5 py-0.5" style={{ color: GREEN, background: GREEN_DIM }}>
                  Approved
                </span>
              )}
              {isModified && (
                <span className="text-[8px] tracking-[0.2em] uppercase px-1.5 py-0.5" style={{ color: GOLD, background: GOLD_DIM }}>
                  Modified
                </span>
              )}
            </div>
            <h3 className="text-[14px] font-light mb-1.5" style={{ color: CREAM, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {plan.title}
            </h3>
            <p className="text-[11px] font-light leading-relaxed mb-2" style={{ color: CREAM_DIM }}>
              {plan.summary}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={9} style={{ color: MUTED }} />
              <span className="text-[10px] font-light" style={{ color: MUTED }}>{plan.scheduledFor}</span>
            </div>
            <ConfidenceBar score={plan.confidenceScore} />
          </div>
          {!isApproved && !isModified && (
            <button
              onClick={() => onDismiss(plan.id)}
              className="shrink-0 p-1 transition-opacity hover:opacity-75"
              style={{ color: MUTED }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase mb-0 transition-opacity hover:opacity-80"
          style={{ color: MUTED }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp size={10} /> : <ChevronRight size={10} />}
          {expanded ? "Hide plan details" : `View full plan — ${plan.actionItems.length} actions staged`}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4">
                <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: "rgba(196,170,126,0.5)" }}>
                  Genome signals that triggered this plan
                </p>
                <div style={{ border: `1px solid ${CREAM_FAINT}` }} className="mb-4">
                  {plan.genomeSignals.map((sig, i) => (
                    <GenomeSignalRow key={i} signal={sig} />
                  ))}
                </div>

                <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: "rgba(196,170,126,0.5)" }}>
                  Staged actions ({plan.actionItems.length})
                </p>
                <div style={{ border: `1px solid ${CREAM_FAINT}` }} className="mb-3">
                  {plan.actionItems.map((item, i) => (
                    <ActionItemRow key={i} item={item} />
                  ))}
                </div>

                {plan.draftComm && <DraftCommPanel draft={plan.draftComm} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isApproved && !isModified && (
        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: `1px solid ${CREAM_FAINT}` }}
        >
          <button
            onClick={() => onModify(plan.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase transition-all"
            style={{ background: "transparent", border: `1px solid ${CREAM_FAINT}`, color: MUTED }}
          >
            <Edit3 size={9} />
            Modify
          </button>
          <button
            onClick={() => onApprove(plan.id)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] tracking-[0.12em] uppercase transition-all"
            style={{ background: GREEN_DIM, border: `1px solid ${GREEN_BORDER}`, color: GREEN }}
          >
            <CheckCircle size={9} />
            Approve & Execute
          </button>
        </div>
      )}

      {isApproved && (
        <div
          className="flex items-center gap-2 px-5 py-3"
          style={{ borderTop: `1px solid ${GREEN_BORDER}` }}
        >
          <CheckCircle size={10} style={{ color: GREEN }} />
          <span className="text-[10px] tracking-[0.12em] uppercase" style={{ color: GREEN }}>
            Executing — vendor communications staged, calendar updated
          </span>
        </div>
      )}

      {isModified && (
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: `1px solid ${GOLD_BORDER}` }}
        >
          <span className="text-[10px] font-light" style={{ color: CREAM_DIM }}>
            Marked for manual review — Rosa will handle directly.
          </span>
          <button
            onClick={() => onApprove(plan.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase"
            style={{ background: GREEN_DIM, border: `1px solid ${GREEN_BORDER}`, color: GREEN }}
          >
            <CheckCircle size={9} />
            Approve
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function SilentQueue() {
  usePageMeta({
    title: "Silent Queue | Carlota Jo",
    description: "Auto-generated action plans awaiting Rosa's approval — Silent Orchestration system.",
    canonical: "https://szlholdings.com/carlota-jo/silent-queue",
  });

  const [plans, setPlans] = useState<ActionPlan[]>(actionPlans);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "dismissed">("all");

  const callApi = async (id: string, action: "approve" | "dismiss" | "modify") => {
    try {
      await fetch(`/api/carlota-jo/orchestration/queue/${id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch {
      // API call best-effort — UI state is the source of truth in the demo
    }
  };

  const approve = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status: "approved" } : p));
    void callApi(id, "approve");
  };
  const dismiss = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status: "dismissed" } : p));
    void callApi(id, "dismiss");
  };
  const modify = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status: "modified" } : p));
    void callApi(id, "modify");
  };

  const pending = plans.filter(p => p.status === "pending");
  const approved = plans.filter(p => p.status === "approved" || p.status === "modified");
  const dismissed = plans.filter(p => p.status === "dismissed");

  const visible = plans.filter(p => {
    if (filter === "all") return p.status !== "dismissed";
    if (filter === "pending") return p.status === "pending";
    if (filter === "approved") return p.status === "approved" || p.status === "modified";
    if (filter === "dismissed") return p.status === "dismissed";
    return true;
  });

  const genomeSignals = [
    getCadencePref("summer"),
    getCadencePref("travel"),
    getCommsPref("frequency"),
  ].filter(Boolean);

  return (
    <div className="min-h-screen" style={{ background: "#0e0c09", color: CREAM }}>
      <div className="max-w-4xl mx-auto px-6 py-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 flex items-center justify-center" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
              <Cpu size={15} style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-[9px] tracking-[0.32em] uppercase font-medium" style={{ color: "rgba(196,170,126,0.5)" }}>
                Silent Orchestration
              </p>
              <h1 className="text-xl font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                Silent Queue
              </h1>
            </div>
          </div>

          <p className="text-[13px] font-light leading-relaxed max-w-2xl mb-8" style={{ color: CREAM_DIM }}>
            Fully-formed action plans generated automatically from Preference Genome signals and observed patterns. Each plan is complete — vendor communications drafted, calendar entries staged, checklists built. Rosa approves or modifies with one tap. The client is never involved.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6 lg:grid-cols-6">
            {[
              { label: "Awaiting approval", value: pending.length, color: GOLD },
              { label: "Executed", value: approved.length, color: GREEN },
              { label: "Dismissed", value: dismissed.length, color: MUTED },
            ].map((stat) => (
              <div key={stat.label} className="col-span-2">
                <p className="text-[22px] font-light mb-0.5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: MUTED }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {([
              ["all", "All active", plans.filter(p => p.status !== "dismissed").length],
              ["pending", "Awaiting approval", pending.length],
              ["approved", "Executed", approved.length],
              ["dismissed", "Dismissed", dismissed.length],
            ] as [typeof filter, string, number][]).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase transition-all"
                style={{
                  background: filter === key ? GOLD_DIM : "transparent",
                  border: `1px solid ${filter === key ? GOLD_BORDER : CREAM_FAINT}`,
                  color: filter === key ? GOLD : MUTED,
                }}
              >
                {label}
                <span className="px-1 py-0.5 text-[9px]" style={{ background: "rgba(255,255,255,0.04)" }}>{count}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visible.map((plan) => (
              <ActionPlanCard
                key={plan.id}
                plan={plan}
                onApprove={approve}
                onDismiss={dismiss}
                onModify={modify}
              />
            ))}
          </AnimatePresence>

          {visible.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <CheckCircle size={24} style={{ color: MUTED, margin: "0 auto 12px" }} />
              <p className="text-[13px] font-light" style={{ color: MUTED }}>
                No plans in this queue. Silent Orchestration is running.
              </p>
            </motion.div>
          )}
        </div>

        <div className="mt-8 p-5" style={{ border: `1px solid ${GOLD_BORDER}`, background: GOLD_DIM }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={11} style={{ color: "rgba(196,170,126,0.55)" }} />
            <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(196,170,126,0.55)" }}>
              Active Genome signals driving orchestration
            </p>
          </div>
          <div className="space-y-2 mb-3">
            {genomeSignals.map(sig => sig && (
              <div key={sig.key} className="flex items-start gap-2">
                <span className="text-[9px] mt-0.5 shrink-0" style={{ color: "rgba(196,170,126,0.4)" }}>→</span>
                <p className="text-[11px] font-light" style={{ color: CREAM_DIM }}>
                  <span style={{ color: "rgba(196,170,126,0.7)" }}>{sig.label}:</span>{" "}{sig.value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[11px] font-light leading-relaxed" style={{ color: CREAM_DIM }}>
            Action plans are generated when pattern confidence exceeds 65%. Plans above 85% confidence are flagged high-priority. No action is taken without Rosa's explicit approval. The client receives a monthly Orchestration Report showing outcomes — not process.
          </p>
        </div>
      </div>
    </div>
  );
}
