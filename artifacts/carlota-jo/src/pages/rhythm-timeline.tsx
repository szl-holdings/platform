import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ChevronDown, ChevronRight, Home, Plane, Wrench,
  Users, Star, Calendar, MapPin, CheckCircle, Circle,
  Clock, Cpu, Zap,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOLD = "rgba(196,170,126,1)";
const GOLD_DIM = "rgba(196,170,126,0.08)";
const GOLD_BORDER = "rgba(196,170,126,0.15)";
const CREAM = "rgba(244,237,224,0.88)";
const CREAM_DIM = "rgba(244,237,224,0.45)";
const CREAM_FAINT = "rgba(244,237,224,0.07)";
const MUTED = "rgba(244,237,224,0.25)";
const GREEN = "rgba(16,185,129,0.85)";
const GREEN_DIM = "rgba(16,185,129,0.07)";
const GREEN_BORDER = "rgba(16,185,129,0.2)";

type EventKind = "seasonal" | "travel" | "maintenance" | "staff" | "review" | "vendor" | "household";
type ConfidenceLevel = "high" | "medium" | "low";
type ActionStatus = "auto-staged" | "approved" | "confirmed" | "predicted";

type TimelineEvent = {
  id: string;
  week: number;
  month: string;
  date: string;
  title: string;
  kind: EventKind;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  status: ActionStatus;
  location?: string;
  summary: string;
  autoAction?: string;
};

const kindConfig: Record<EventKind, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  seasonal: { color: GREEN, bg: GREEN_DIM, icon: Home, label: "Seasonal Transition" },
  travel: { color: "rgba(6,182,212,0.85)", bg: "rgba(6,182,212,0.07)", icon: Plane, label: "Travel" },
  maintenance: { color: "rgba(245,158,11,0.85)", bg: "rgba(245,158,11,0.07)", icon: Wrench, label: "Maintenance" },
  staff: { color: "rgba(139,92,246,0.85)", bg: "rgba(139,92,246,0.07)", icon: Users, label: "Staffing" },
  review: { color: GOLD, bg: GOLD_DIM, icon: Star, label: "Review Session" },
  vendor: { color: "rgba(6,182,212,0.7)", bg: "rgba(6,182,212,0.05)", icon: Zap, label: "Vendor Action" },
  household: { color: "rgba(239,68,68,0.75)", bg: "rgba(239,68,68,0.07)", icon: Calendar, label: "Household Ops" },
};

const statusConfig: Record<ActionStatus, { label: string; color: string; icon: React.ElementType }> = {
  "auto-staged": { label: "Auto-staged", color: GOLD, icon: Cpu },
  approved: { label: "Approved", color: GREEN, icon: CheckCircle },
  confirmed: { label: "Confirmed", color: GREEN, icon: CheckCircle },
  predicted: { label: "Predicted", color: MUTED, icon: Circle },
};

const confidenceConfig: Record<ConfidenceLevel, { color: string }> = {
  high: { color: GREEN },
  medium: { color: GOLD },
  low: { color: "rgba(239,68,68,0.85)" },
};

const timelineEvents: TimelineEvent[] = [
  {
    id: "t1",
    week: 1,
    month: "April",
    date: "14 Apr",
    title: "Oxfordshire opening inspection",
    kind: "seasonal",
    confidence: "high",
    confidenceScore: 94,
    status: "auto-staged",
    location: "Oxfordshire Estate",
    summary: "Pre-open inspection. Caretaker contact drafted. Checklist staged.",
    autoAction: "Draft vendor communication ready for Rosa's approval.",
  },
  {
    id: "t2",
    week: 2,
    month: "April",
    date: "21 Apr",
    title: "Summer vendor contract outreach",
    kind: "vendor",
    confidence: "high",
    confidenceScore: 91,
    status: "auto-staged",
    location: "Remote",
    summary: "Grounds, pool, and cleaning vendors contacted for Oxfordshire summer renewal.",
    autoAction: "3 draft vendor communications staged.",
  },
  {
    id: "t3",
    week: 3,
    month: "April",
    date: "28 Apr",
    title: "Mrs. Chambers cover — agency outreach",
    kind: "staff",
    confidence: "high",
    confidenceScore: 88,
    status: "auto-staged",
    location: "Mayfair",
    summary: "Temporary cover for July–August leave. Agency outreach drafted.",
    autoAction: "Draft communication to Knightsbridge Domestic Agency staged.",
  },
  {
    id: "t4",
    week: 1,
    month: "May",
    date: "5 May",
    title: "Oxfordshire Estate opens",
    kind: "seasonal",
    confidence: "high",
    confidenceScore: 96,
    status: "auto-staged",
    location: "Oxfordshire Estate",
    summary: "Annual seasonal transition. Staff briefings and vendor activations staged.",
    autoAction: "Calendar transition event staged. Staff schedule update prepared.",
  },
  {
    id: "t5",
    week: 2,
    month: "May",
    date: "12 May",
    title: "Summer staffing brief — Oxfordshire",
    kind: "staff",
    confidence: "medium",
    confidenceScore: 78,
    status: "predicted",
    location: "Oxfordshire",
    summary: "Full estate operational briefing with seasonal staff. Agenda to be prepared.",
  },
  {
    id: "t6",
    week: 3,
    month: "May",
    date: "19 May",
    title: "Heritage Heating — pre-booking outreach",
    kind: "vendor",
    confidence: "high",
    confidenceScore: 91,
    status: "auto-staged",
    location: "Remote",
    summary: "Early booking for September heating service (both properties). Draft ready.",
    autoAction: "Draft vendor communication staged for both properties.",
  },
  {
    id: "t7",
    week: 1,
    month: "June",
    date: "8 Jun",
    title: "New York travel — predicted",
    kind: "travel",
    confidence: "medium",
    confidenceScore: 73,
    status: "auto-staged",
    location: "New York — The Carlyle",
    summary: "June New York visit based on 3-year pattern. Carlyle provisional hold drafted.",
    autoAction: "Hotel provisional hold draft staged. Ground transport contact initiated.",
  },
  {
    id: "t8",
    week: 2,
    month: "June",
    date: "15 Jun",
    title: "Q3 Review Session scheduling",
    kind: "review",
    confidence: "high",
    confidenceScore: 96,
    status: "auto-staged",
    location: "Mayfair",
    summary: "Quarterly review scheduling note drafted. Proposed: 6 July, 9:00 AM.",
    autoAction: "Scheduling note staged. Calendar entry prepared pending confirmation.",
  },
  {
    id: "t9",
    week: 1,
    month: "July",
    date: "6 Jul",
    title: "Q3 Review Session",
    kind: "review",
    confidence: "high",
    confidenceScore: 96,
    status: "predicted",
    location: "London, Mayfair",
    summary: "Quarterly review. Morning slot. Q3 briefing agenda to be prepared.",
  },
  {
    id: "t10",
    week: 2,
    month: "July",
    date: "13 Jul",
    title: "Mrs. Chambers leave begins",
    kind: "staff",
    confidence: "high",
    confidenceScore: 88,
    status: "predicted",
    location: "Mayfair",
    summary: "6-week leave (established pattern). Cover arrangement in progress.",
  },
  {
    id: "t11",
    week: 2,
    month: "September",
    date: "8 Sep",
    title: "Heating service — Mayfair",
    kind: "maintenance",
    confidence: "high",
    confidenceScore: 91,
    status: "predicted",
    location: "Mayfair Residence",
    summary: "Annual boiler and heating system service. Booking in progress.",
  },
  {
    id: "t12",
    week: 3,
    month: "September",
    date: "15 Sep",
    title: "Heating service — Oxfordshire",
    kind: "maintenance",
    confidence: "high",
    confidenceScore: 91,
    status: "predicted",
    location: "Oxfordshire Estate",
    summary: "Annual service. Back-to-back with Mayfair preferred.",
  },
  {
    id: "t13",
    week: 4,
    month: "September",
    date: "28 Sep",
    title: "Oxfordshire Estate closes",
    kind: "seasonal",
    confidence: "high",
    confidenceScore: 94,
    status: "predicted",
    location: "Oxfordshire Estate",
    summary: "Seasonal transition to Mayfair. Winterisation, caretaker handover.",
  },
  {
    id: "t14",
    week: 1,
    month: "October",
    date: "5 Oct",
    title: "Q4 Review Session",
    kind: "review",
    confidence: "medium",
    confidenceScore: 82,
    status: "predicted",
    location: "London, Mayfair",
    summary: "Quarterly review. Winter season planning, year-end preparations.",
  },
  {
    id: "t15",
    week: 3,
    month: "November",
    date: "17 Nov",
    title: "Monaco travel — predicted",
    kind: "travel",
    confidence: "medium",
    confidenceScore: 68,
    status: "predicted",
    location: "Monaco",
    summary: "Historical November pattern (2024, 2025). Pre-arrangements to be staged.",
  },
  {
    id: "t16",
    week: 2,
    month: "December",
    date: "14 Dec",
    title: "Festive staffing uplift — Oxfordshire",
    kind: "staff",
    confidence: "high",
    confidenceScore: 97,
    status: "predicted",
    location: "Oxfordshire Estate",
    summary: "Family gathering. Elevated staffing and catering. Pre-planning to begin October.",
  },
];

const MONTHS_90 = ["April", "May", "June", "July"];

function ConfidenceDot({ level, score }: { level: ConfidenceLevel; score: number }) {
  const cfg = confidenceConfig[level];
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: cfg.color }}
      />
      <span className="text-[9px] tabular-nums" style={{ color: cfg.color }}>{score}%</span>
    </div>
  );
}

function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const [expanded, setExpanded] = useState(false);
  const kindCfg = kindConfig[event.kind];
  const statusCfg = statusConfig[event.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      style={{ border: `1px solid ${CREAM_FAINT}`, background: "rgba(14,12,9,0.4)" }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div
          className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: kindCfg.bg }}
        >
          <kindCfg.icon size={11} style={{ color: kindCfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[8px] tracking-[0.18em] uppercase px-1.5 py-0.5"
                style={{ color: statusCfg.color, background: event.status === "auto-staged" ? GOLD_DIM : "rgba(255,255,255,0.04)" }}
              >
                {statusCfg.label}
              </span>
              <span className="text-[8px] tracking-wider uppercase" style={{ color: kindCfg.color }}>
                {kindCfg.label}
              </span>
            </div>
            <ConfidenceDot level={event.confidence} score={event.confidenceScore} />
          </div>
          <p className="text-[12px] font-light mb-0.5" style={{ color: CREAM, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {event.title}
          </p>
          {event.location && (
            <div className="flex items-center gap-1 mb-1">
              <MapPin size={8} style={{ color: MUTED }} />
              <span className="text-[9px] font-light" style={{ color: MUTED }}>{event.location}</span>
            </div>
          )}
          {event.autoAction && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 mb-1"
              style={{ background: "rgba(196,170,126,0.05)", border: `1px solid rgba(196,170,126,0.1)` }}
            >
              <Cpu size={8} style={{ color: "rgba(196,170,126,0.5)" }} />
              <span className="text-[9px] font-light" style={{ color: "rgba(196,170,126,0.6)" }}>{event.autoAction}</span>
            </div>
          )}
          <button
            className="flex items-center gap-1 text-[9px] tracking-wider uppercase mt-1 transition-opacity hover:opacity-75"
            style={{ color: MUTED }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
            {expanded ? "Less" : "Details"}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[11px] font-light leading-relaxed mt-2 overflow-hidden"
                style={{ color: CREAM_DIM }}
              >
                {event.summary}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function MonthColumn({ month, events, isActive }: { month: string; events: TimelineEvent[]; isActive: boolean }) {
  const autoStaged = events.filter(e => e.status === "auto-staged").length;
  const totalEvents = events.length;

  return (
    <div className="flex-1 min-w-0">
      <div
        className="px-3 py-2 mb-3 flex items-center justify-between"
        style={{
          background: isActive ? GOLD_DIM : "rgba(255,255,255,0.02)",
          borderBottom: `2px solid ${isActive ? GOLD : CREAM_FAINT}`,
        }}
      >
        <div>
          <p className="text-[11px] font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: isActive ? GOLD : CREAM }}>
            {month}
          </p>
          <p className="text-[8px] tracking-wider uppercase" style={{ color: MUTED }}>
            {totalEvents} events
          </p>
        </div>
        {autoStaged > 0 && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5"
            style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
          >
            <Cpu size={8} style={{ color: GOLD }} />
            <span className="text-[8px] tracking-wider" style={{ color: GOLD }}>{autoStaged}</span>
          </div>
        )}
      </div>
      <div className="space-y-1.5 px-1">
        {events.map(event => (
          <TimelineEventCard key={event.id} event={event} />
        ))}
        {events.length === 0 && (
          <p className="text-[10px] font-light text-center py-6" style={{ color: MUTED }}>
            No events predicted
          </p>
        )}
      </div>
    </div>
  );
}

type FilterKind = EventKind | "all";

export default function RhythmTimeline() {
  usePageMeta({
    title: "Rhythm Timeline | Carlota Jo",
    description: "90-day household rhythm visualization with auto-staged orchestration actions.",
    canonical: "https://szlholdings.com/carlota-jo/rhythm-timeline",
  });

  const [filter, setFilter] = useState<FilterKind>("all");
  const [view, setView] = useState<"timeline" | "list">("timeline");

  const currentMonth = "April";

  const filteredEvents = filter === "all"
    ? timelineEvents
    : timelineEvents.filter(e => e.kind === filter);

  const autoStagedCount = timelineEvents.filter(e => e.status === "auto-staged").length;
  const highConfCount = timelineEvents.filter(e => e.confidence === "high").length;
  const confirmedCount = timelineEvents.filter(e => e.status === "confirmed" || e.status === "approved").length;

  const filterOptions: { id: FilterKind; label: string }[] = [
    { id: "all", label: "All" },
    { id: "seasonal", label: "Seasonal" },
    { id: "travel", label: "Travel" },
    { id: "maintenance", label: "Maintenance" },
    { id: "staff", label: "Staffing" },
    { id: "review", label: "Reviews" },
    { id: "vendor", label: "Vendors" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0e0c09", color: CREAM }}>
      <div className="max-w-7xl mx-auto px-6 py-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 flex items-center justify-center" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
              <Activity size={15} style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-[9px] tracking-[0.32em] uppercase font-medium" style={{ color: "rgba(196,170,126,0.5)" }}>
                Silent Orchestration
              </p>
              <h1 className="text-xl font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                Rhythm Timeline
              </h1>
            </div>
          </div>

          <p className="text-[13px] font-light leading-relaxed max-w-2xl mb-8" style={{ color: CREAM_DIM }}>
            The predicted household cadence for the next 90 days, with auto-staged orchestration actions mapped along it. Events are colour-coded by confidence level. Auto-staged actions appear in the Silent Queue for Rosa's approval.
          </p>

          <div className="grid grid-cols-3 gap-6 mb-6 lg:grid-cols-6">
            {[
              { label: "Events predicted", value: timelineEvents.length, color: CREAM },
              { label: "Auto-staged", value: autoStagedCount, color: GOLD },
              { label: "High confidence", value: highConfCount, color: GREEN },
            ].map((stat) => (
              <div key={stat.label} className="col-span-2">
                <p className="text-[22px] font-light mb-0.5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: MUTED }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {filterOptions.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase transition-all"
                  style={{
                    background: filter === f.id ? GOLD_DIM : "transparent",
                    border: `1px solid ${filter === f.id ? GOLD_BORDER : CREAM_FAINT}`,
                    color: filter === f.id ? GOLD : MUTED,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {(["timeline", "list"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase transition-all"
                  style={{
                    background: view === v ? GOLD_DIM : "transparent",
                    border: `1px solid ${view === v ? GOLD_BORDER : CREAM_FAINT}`,
                    color: view === v ? GOLD : MUTED,
                  }}
                >
                  {v === "timeline" ? "Column view" : "List view"}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="mb-4 flex items-center gap-6 flex-wrap">
          {[
            { label: "Auto-staged (in Silent Queue)", color: GOLD, style: "solid" },
            { label: "High confidence (85%+)", color: GREEN, style: "solid" },
            { label: "Medium confidence (65–84%)", color: GOLD, style: "dashed" },
            { label: "Predicted (<65%)", color: MUTED, style: "dotted" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-0.5"
                style={{
                  background: item.style === "solid" ? item.color : "transparent",
                  border: item.style !== "solid" ? `1px ${item.style} ${item.color}` : "none",
                }}
              />
              <span className="text-[9px] font-light" style={{ color: MUTED }}>{item.label}</span>
            </div>
          ))}
        </div>

        {view === "timeline" ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {MONTHS_90.map(month => (
              <div key={month} className="flex-1 min-w-[220px]">
                <MonthColumn
                  month={month}
                  events={filteredEvents.filter(e => e.month === month)}
                  isActive={month === currentMonth}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEvents.map(event => {
              const kindCfg = kindConfig[event.kind];
              const statusCfg = statusConfig[event.status];
              const confCfg = confidenceConfig[event.confidence];
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-4 px-5 py-3"
                  style={{ border: `1px solid ${CREAM_FAINT}`, background: "rgba(14,12,9,0.4)" }}
                >
                  <div className="w-16 shrink-0">
                    <p className="text-[11px] font-light" style={{ color: CREAM }}>{event.date}</p>
                    <p className="text-[9px]" style={{ color: MUTED }}>{event.month}</p>
                  </div>
                  <div
                    className="w-6 h-6 flex items-center justify-center shrink-0"
                    style={{ background: kindCfg.bg }}
                  >
                    <kindCfg.icon size={11} style={{ color: kindCfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-light" style={{ color: CREAM }}>{event.title}</p>
                    {event.location && (
                      <p className="text-[9px]" style={{ color: MUTED }}>{event.location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-[8px] tracking-[0.15em] uppercase px-1.5 py-0.5"
                      style={{ color: statusCfg.color, background: "rgba(255,255,255,0.04)" }}
                    >
                      {statusCfg.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: confCfg.color }} />
                      <span className="text-[9px] tabular-nums" style={{ color: confCfg.color }}>{event.confidenceScore}%</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="p-5" style={{ border: `1px solid ${GOLD_BORDER}`, background: GOLD_DIM }}>
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={11} style={{ color: "rgba(196,170,126,0.55)" }} />
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(196,170,126,0.55)" }}>
                How the timeline is built
              </p>
            </div>
            <p className="text-[11px] font-light leading-relaxed" style={{ color: CREAM_DIM }}>
              The Rhythm Timeline is generated from Preference Genome signals cross-referenced with historical behavioural patterns. Events with 85%+ confidence are auto-staged in the Silent Queue. Events at 65–84% confidence appear as predictions for Rosa's review. No action is executed without approval.
            </p>
          </div>
          <div className="p-5" style={{ border: `1px solid ${GREEN_BORDER}`, background: GREEN_DIM }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={11} style={{ color: "rgba(16,185,129,0.55)" }} />
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(16,185,129,0.55)" }}>
                90-day horizon
              </p>
            </div>
            <p className="text-[11px] font-light leading-relaxed" style={{ color: CREAM_DIM }}>
              The timeline rolls forward continuously. The next 90 days are always visible — beyond 90 days, events appear on the extended calendar view. Rosa receives a weekly digest of the upcoming 30-day window each Monday.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
