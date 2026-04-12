import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ChevronRight, ChevronDown, CheckCircle, Clock, AlertCircle,
  Thermometer, Plane, Calendar, Home, Package, Sparkles, X, Cpu, ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CLIENT_GENOME, getCadencePref, getCommsPref } from "@/data/genome-data";

const GOLD = "rgba(196,170,126,1)";
const GOLD_DIM = "rgba(196,170,126,0.08)";
const GOLD_BORDER = "rgba(196,170,126,0.15)";
const CREAM = "rgba(244,237,224,0.88)";
const CREAM_DIM = "rgba(244,237,224,0.45)";
const CREAM_FAINT = "rgba(244,237,224,0.07)";
const MUTED = "rgba(244,237,224,0.25)";

type Urgency = "immediate" | "this-week" | "this-month" | "seasonal";

type Suggestion = {
  id: string;
  title: string;
  category: string;
  urgency: Urgency;
  icon: React.ElementType;
  summary: string;
  reasoning: string[];
  suggestedAction: string;
  dismissed?: boolean;
  acted?: boolean;
};

const urgencyConfig: Record<Urgency, { label: string; color: string; bg: string }> = {
  immediate: { label: "Act now", color: "rgba(239,68,68,0.85)", bg: "rgba(239,68,68,0.08)" },
  "this-week": { label: "This week", color: GOLD, bg: GOLD_DIM },
  "this-month": { label: "This month", color: "rgba(6,182,212,0.8)", bg: "rgba(6,182,212,0.07)" },
  seasonal: { label: "Seasonal prep", color: "rgba(139,92,246,0.8)", bg: "rgba(139,92,246,0.07)" },
};

const suggestions: Suggestion[] = [
  {
    id: "s1",
    title: "Schedule Oxfordshire opening inspection",
    category: "Residence Operations",
    urgency: "this-week",
    icon: Home,
    summary: "Based on the client's established pattern, Oxfordshire opens in May. An inspection and staff briefing should be scheduled now — typically 3–4 weeks ahead.",
    reasoning: [
      "Client has transitioned to Oxfordshire in early May for 2 consecutive years (2024, 2025).",
      "Last year's opening inspection was scheduled 26 days in advance.",
      "Current date: April 8 — opening window is 3–4 weeks away.",
      "2025 opening required minor remediation work (heating system) discovered during inspection.",
    ],
    suggestedAction: "Schedule inspection for week of April 14–18. Confirm Oxfordshire caretaker availability.",
  },
  {
    id: "s2",
    title: "Review and extend summer vendor contracts",
    category: "Vendor Management",
    urgency: "this-week",
    icon: Package,
    summary: "Seasonal vendor arrangements at Oxfordshire — grounds, pool, external cleaning — typically require renewal in April. Last year two vendors were unavailable due to delayed confirmation.",
    reasoning: [
      "Oxfordshire vendors (landscaping, pool maintenance, external cleaning) are seasonal — confirmed on an annual basis.",
      "In 2025, delays in contract renewal led to a 3-week service gap for pool maintenance.",
      "Typical lead time to confirm availability: 2–3 weeks.",
      "Current date creates an immediate action window to avoid repeat gap.",
    ],
    suggestedAction: "Reach out to Oxfordshire grounds, pool, and external cleaning vendors this week to confirm summer availability and renew arrangements.",
  },
  {
    id: "s3",
    title: "Pre-book New York travel support — likely June visit",
    category: "Travel & Lifestyle",
    urgency: "this-month",
    icon: Plane,
    summary: "Client historically travels to New York once or twice per year, with a strong pattern of a June visit. Preferred suite at The Carlyle books 8–10 weeks out.",
    reasoning: [
      "Client visited New York in June 2023, June 2024, and July 2025.",
      "Preferred accommodation (The Carlyle) has limited availability — books 8–10 weeks in advance.",
      "Typical visit duration: 5–7 days. Itinerary preferences include private dining, gallery visits, and a standing appointment with Dr. Marcus Reid.",
      "Early booking allows preferred suite to be secured.",
    ],
    suggestedAction: "Confirm June travel intent at next session. Pre-block preferred dates at The Carlyle and place a tentative hold on Dr. Reid's calendar.",
  },
  {
    id: "s4",
    title: "Summer staffing review — Mayfair winter staff",
    category: "Household Systems",
    urgency: "this-month",
    icon: Home,
    summary: "With the seasonal transition approaching, Mayfair will move to reduced summer staffing. The client's winter housekeeper has historically taken leave in July–August — a replacement protocol should be confirmed.",
    reasoning: [
      "Mayfair winter housekeeper (Mrs. Chambers) took 6 weeks leave in July–August in both 2024 and 2025.",
      "No confirmed cover arrangement exists for this period in 2026.",
      "Minimum standard requires daily operations to continue uninterrupted.",
      "Last year a temporary arrangement was made at short notice — higher cost and lower standard.",
    ],
    suggestedAction: "Confirm Mrs. Chambers' 2026 leave dates. Identify and brief preferred temporary cover by end of April.",
  },
  {
    id: "s5",
    title: "Annual heating system service — both properties",
    category: "Maintenance",
    urgency: "seasonal",
    icon: Thermometer,
    summary: "Annual heating system servicing is typically due in autumn (September–October) before winter season. Early scheduling avoids the October bottleneck when engineers are in high demand.",
    reasoning: [
      "Both properties require annual boiler and heating system service.",
      "Preferred engineer (Heritage Heating, London) has a 4–6 week lead time in September.",
      "In 2024, late scheduling resulted in a service date in late November — after the season started.",
      "Early booking (May–June) secures preferred September dates.",
    ],
    suggestedAction: "Contact Heritage Heating in May to pre-book September service dates for both Mayfair and Oxfordshire.",
  },
  {
    id: "s6",
    title: "Q3 review session — schedule now",
    category: "Engagement Cadence",
    urgency: "this-month",
    icon: Calendar,
    summary: "The quarterly review is due in early July. Based on client's preferred morning schedule and preference for London venue, scheduling should begin 6–8 weeks ahead.",
    reasoning: [
      "Engagement agreement specifies quarterly review sessions.",
      "Previous reviews were held in the first week of the quarter (Q2 review: April 7, Q1 review: January 6).",
      "Client is typically abroad in late June (Monaco trip pattern) — early July works best.",
      "Client prefers morning slots before 10:00 AM.",
    ],
    suggestedAction: "Propose July 6 or 7, 9:00 AM, London (Mayfair). Confirm by end of April.",
  },
];

function ReasoningExpand({ reasoning }: { reasoning: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase mb-2 transition-opacity hover:opacity-80"
        style={{ color: MUTED }}
        onClick={() => setOpen(!open)}
      >
        <Sparkles size={10} style={{ color: "rgba(196,170,126,0.45)" }} />
        Why is Rosa suggesting this?
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
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
            <div className="space-y-2 pb-3">
              {reasoning.map((r, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-[9px] mt-0.5 shrink-0" style={{ color: "rgba(196,170,126,0.4)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[11px] font-light leading-relaxed" style={{ color: CREAM_DIM }}>
                    {r}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onDismiss,
  onAct,
}: {
  suggestion: Suggestion;
  onDismiss: (id: string) => void;
  onAct: (id: string) => void;
}) {
  const u = urgencyConfig[suggestion.urgency];

  if (suggestion.dismissed) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: suggestion.acted ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      style={{ border: `1px solid ${GOLD_BORDER}`, background: "rgba(14,12,9,0.55)" }}
    >
      <div className="px-5 pt-4 pb-1">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5" style={{ background: u.bg, border: `1px solid rgba(255,255,255,0.04)` }}>
            <suggestion.icon size={13} style={{ color: u.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[8px] tracking-[0.2em] uppercase px-1.5 py-0.5"
                style={{ color: u.color, background: u.bg }}
              >
                {u.label}
              </span>
              <span className="text-[9px] tracking-wider uppercase" style={{ color: MUTED }}>
                {suggestion.category}
              </span>
            </div>
            <h3 className="text-[14px] font-light mb-2" style={{ color: CREAM, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {suggestion.title}
            </h3>
            <p className="text-[12px] font-light leading-relaxed mb-3" style={{ color: CREAM_DIM }}>
              {suggestion.summary}
            </p>
          </div>
          <button
            onClick={() => onDismiss(suggestion.id)}
            className="shrink-0 p-1 transition-opacity hover:opacity-75"
            style={{ color: MUTED }}
          >
            <X size={12} />
          </button>
        </div>

        <ReasoningExpand reasoning={suggestion.reasoning} />
      </div>

      <div
        className="flex items-center justify-between px-5 py-3 mt-1"
        style={{ borderTop: `1px solid ${CREAM_FAINT}` }}
      >
        <p className="text-[11px] font-light italic" style={{ color: CREAM_DIM, maxWidth: "60%" }}>
          {suggestion.suggestedAction}
        </p>
        <button
          onClick={() => onAct(suggestion.id)}
          disabled={suggestion.acted}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase transition-all"
          style={{
            background: suggestion.acted ? "rgba(16,185,129,0.12)" : GOLD_DIM,
            border: suggestion.acted ? "1px solid rgba(16,185,129,0.2)" : `1px solid ${GOLD_BORDER}`,
            color: suggestion.acted ? "rgba(16,185,129,0.75)" : GOLD,
          }}
        >
          {suggestion.acted ? <CheckCircle size={10} /> : <CheckCircle size={10} />}
          {suggestion.acted ? "Noted" : "Mark actioned"}
        </button>
      </div>
    </motion.div>
  );
}

export default function AnticipationEngine() {
  usePageMeta({
    title: "Anticipation Engine | Carlota Jo",
    description: "Pattern-based anticipation of client needs before they arise — seasonal, travel, lifecycle, and operational.",
    canonical: "https://szlholdings.com/carlota-jo/anticipation",
  });

  const [items, setItems] = useState(suggestions);
  const [filter, setFilter] = useState<Urgency | "all">("all");

  const dismiss = (id: string) => setItems(prev => prev.map(s => s.id === id ? { ...s, dismissed: true } : s));
  const act = (id: string) => setItems(prev => prev.map(s => s.id === id ? { ...s, acted: true } : s));

  const filtered = items.filter(s => !s.dismissed && (filter === "all" || s.urgency === filter));

  const counts = {
    immediate: items.filter(s => !s.dismissed && s.urgency === "immediate").length,
    "this-week": items.filter(s => !s.dismissed && s.urgency === "this-week").length,
    "this-month": items.filter(s => !s.dismissed && s.urgency === "this-month").length,
    seasonal: items.filter(s => !s.dismissed && s.urgency === "seasonal").length,
  };

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
              <Zap size={15} style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-[9px] tracking-[0.32em] uppercase font-medium" style={{ color: "rgba(196,170,126,0.5)" }}>
                Intelligence Layer
              </p>
              <h1 className="text-xl font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                Anticipation Engine
              </h1>
            </div>
          </div>

          <p className="text-[13px] font-light leading-relaxed max-w-2xl mb-8" style={{ color: CREAM_DIM }}>
            Pattern-based predictions of what this client is likely to need before they ask. Each suggestion includes its reasoning — the evidence, patterns, and logic behind the recommendation. Rosa reviews and acts on these before they become issues.
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {([["all", "All", items.filter(s => !s.dismissed).length], ["immediate", "Act now", counts.immediate], ["this-week", "This week", counts["this-week"]], ["this-month", "This month", counts["this-month"]], ["seasonal", "Seasonal", counts.seasonal]] as [Urgency | "all", string, number][]).map(([key, label, count]) => (
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
            {filtered.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onDismiss={dismiss}
                onAct={act}
              />
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <CheckCircle size={24} style={{ color: MUTED, margin: "0 auto 12px" }} />
              <p className="text-[13px] font-light" style={{ color: MUTED }}>
                No active suggestions for this filter. Anticipation Engine is monitoring.
              </p>
            </motion.div>
          )}
        </div>

        <div
          className="mt-8 p-5 flex items-start gap-4"
          style={{ border: `1px solid rgba(16,185,129,0.2)`, background: "rgba(16,185,129,0.05)" }}
        >
          <div
            className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <Cpu size={14} style={{ color: "rgba(16,185,129,0.85)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(16,185,129,0.65)" }}>
              Silent Orchestration — Active
            </p>
            <p className="text-[12px] font-light leading-relaxed mb-3" style={{ color: CREAM_DIM }}>
              Predictions are now converted into fully-formed action plans automatically — vendor communications drafted, calendar entries staged, staff schedules adjusted. Rosa approves with one tap.
            </p>
            <Link
              href="/silent-queue"
              className="inline-flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.15em] uppercase transition-opacity hover:opacity-80"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "rgba(16,185,129,0.9)" }}
            >
              <Cpu size={10} />
              Open Silent Queue
              <ArrowRight size={10} />
            </Link>
          </div>
        </div>

        <div className="mt-4 p-5" style={{ border: `1px solid ${GOLD_BORDER}`, background: GOLD_DIM }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={11} style={{ color: "rgba(196,170,126,0.55)" }} />
            <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(196,170,126,0.55)" }}>
              Active Genome signals informing suggestions
            </p>
          </div>
          <div className="space-y-2 mb-3">
            {[
              getCadencePref("summer"),
              getCadencePref("travel"),
              getCadencePref("festive"),
              getCommsPref("frequency"),
            ].filter(Boolean).map(pref => pref && (
              <div key={pref.key} className="flex items-start gap-2">
                <span className="text-[9px] mt-0.5 shrink-0" style={{ color: "rgba(196,170,126,0.4)" }}>→</span>
                <p className="text-[11px] font-light" style={{ color: CREAM_DIM }}>
                  <span style={{ color: "rgba(196,170,126,0.7)" }}>{pref.label}:</span>{" "}{pref.value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[11px] font-light leading-relaxed" style={{ color: CREAM_DIM }}>
            Genome signals are cross-referenced with lifecycle event triggers (property transitions, quarterly review cycles) and observed seasonal patterns. {CLIENT_GENOME.name} has {CLIENT_GENOME.defaultTone === "formal-brief" ? "a preference for brief, direct communication" : "a detailed communication preference"} — suggestions are phrased accordingly.
          </p>
        </div>
      </div>
    </div>
  );
}
