import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, ChevronLeft, ChevronRight, Home, Plane, Wrench,
  Users, Star, CheckCircle, Clock, Shield, TrendingUp,
  Calendar,
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

type OutcomeCategory = "residence" | "travel" | "vendor" | "staff" | "maintenance" | "review";
type OutcomeImpact = "high" | "medium" | "standard";

type Outcome = {
  id: string;
  category: OutcomeCategory;
  icon: React.ElementType;
  title: string;
  outcome: string;
  detail: string;
  impact: OutcomeImpact;
  preventedIssue?: string;
};

type MonthReport = {
  month: string;
  year: number;
  period: string;
  intro: string;
  outcomes: Outcome[];
  stats: {
    actionsHandled: number;
    vendorInteractions: number;
    calendarUpdates: number;
    issuesPrevented: number;
  };
  closingNote: string;
};

const categoryConfig: Record<OutcomeCategory, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  residence: { color: GREEN, bg: GREEN_DIM, icon: Home, label: "Residence Operations" },
  travel: { color: "rgba(6,182,212,0.85)", bg: "rgba(6,182,212,0.07)", icon: Plane, label: "Travel & Lifestyle" },
  vendor: { color: "rgba(245,158,11,0.85)", bg: "rgba(245,158,11,0.07)", icon: Star, label: "Vendor Management" },
  staff: { color: "rgba(139,92,246,0.85)", bg: "rgba(139,92,246,0.07)", icon: Users, label: "Household Staff" },
  maintenance: { color: "rgba(6,182,212,0.7)", bg: "rgba(6,182,212,0.05)", icon: Wrench, label: "Maintenance" },
  review: { color: GOLD, bg: GOLD_DIM, icon: Calendar, label: "Engagement Cadence" },
};

const impactConfig: Record<OutcomeImpact, { label: string; color: string }> = {
  high: { label: "High impact", color: GREEN },
  medium: { label: "Medium impact", color: GOLD },
  standard: { label: "Standard ops", color: MUTED },
};

const reports: MonthReport[] = [
  {
    month: "March",
    year: 2026,
    period: "1–31 March 2026",
    intro: "March was a steady operational month. The system completed its seasonal review cycle, preparing for the summer transition. Seven action plans were auto-generated and approved, with no client involvement required. The household ran without incident across both properties.",
    stats: {
      actionsHandled: 7,
      vendorInteractions: 4,
      calendarUpdates: 6,
      issuesPrevented: 2,
    },
    outcomes: [
      {
        id: "o1",
        category: "residence",
        icon: Home,
        title: "Oxfordshire summer opening pre-planned",
        outcome: "Opening inspection booked with caretaker for mid-April. Pre-open checklist circulated to grounds and household team.",
        detail: "Action plan auto-generated from seasonal cadence signal (2-year Oxfordshire pattern). Approved and executed by Rosa. Client not involved.",
        impact: "high",
        preventedIssue: "Avoided late scheduling of inspection, which in 2024 led to a 2-week delay in estate readiness.",
      },
      {
        id: "o2",
        category: "vendor",
        icon: Star,
        title: "Summer vendor contracts confirmed — Oxfordshire",
        outcome: "Grounds maintenance, pool, and external cleaning contracts renewed for May–September 2026.",
        detail: "Outreach initiated in early March based on Anticipation Engine prediction. All three vendors confirmed by 21 March.",
        impact: "high",
        preventedIssue: "Avoided the 3-week pool maintenance gap that occurred in 2025 due to delayed contract renewal.",
      },
      {
        id: "o3",
        category: "staff",
        icon: Users,
        title: "Q2 Review session prepared and briefed",
        outcome: "March 31 review agenda prepared, venue confirmed (Mayfair), and briefing materials circulated to Rosa ahead of the session.",
        detail: "System flagged review preparation 3 weeks ahead based on engagement cadence pattern. Fully prepared without client input.",
        impact: "standard",
      },
      {
        id: "o4",
        category: "maintenance",
        icon: Wrench,
        title: "Mayfair plumbing inspection — minor fault resolved",
        outcome: "A slow kitchen tap fault identified during routine check was resolved by preferred plumber within 48 hours.",
        detail: "Issue flagged by Rosa during weekly walk-through. System had relevant plumber contact on file. Job completed without client awareness.",
        impact: "medium",
        preventedIssue: "Early resolution prevented potential water damage and disruption to the kitchen.",
      },
    ],
    closingNote: "The household operated smoothly throughout March. The system's proactive planning has set up April and May for a clean seasonal transition. No escalations required your attention this month.",
  },
  {
    month: "February",
    year: 2026,
    period: "1–28 February 2026",
    intro: "February focused on winter operational continuity and the early stages of annual planning. Six action plans were processed. One maintenance issue at Oxfordshire was identified and resolved before it could develop into a structural problem.",
    stats: {
      actionsHandled: 6,
      vendorInteractions: 5,
      calendarUpdates: 4,
      issuesPrevented: 1,
    },
    outcomes: [
      {
        id: "o5",
        category: "maintenance",
        icon: Wrench,
        title: "Oxfordshire roof drainage — preventative repair",
        outcome: "Blocked guttering on the east wing identified during winter inspection and cleared by specialist contractor.",
        detail: "Heritage Roofing attended 14 February. Issue escalated from caretaker's monthly inspection report. Arranged and overseen by Rosa.",
        impact: "high",
        preventedIssue: "Left unaddressed, blocked drainage would likely have caused water ingress during spring rainfall.",
      },
      {
        id: "o6",
        category: "residence",
        icon: Home,
        title: "Mayfair seasonal deep clean completed",
        outcome: "Full winter deep clean completed across Mayfair residence using fragrance-free products only.",
        detail: "Scheduled as part of the winter operations plan. Mrs. Chambers briefed and oversaw the specialist cleaning team.",
        impact: "standard",
      },
      {
        id: "o7",
        category: "vendor",
        icon: Star,
        title: "Heritage Heating annual service — both properties",
        outcome: "Annual boiler and heating system service completed at Mayfair (5 Feb) and Oxfordshire (12 Feb).",
        detail: "Pre-booked in May 2025 to secure preferred dates. Both systems passed service without issue.",
        impact: "standard",
      },
      {
        id: "o8",
        category: "review",
        icon: Calendar,
        title: "Q1 review session held — 3 February",
        outcome: "Quarterly review completed. Q1 operational summary delivered. Q2 priorities agreed.",
        detail: "Session held in Mayfair, 9:00 AM as scheduled. 2-hour format. All materials prepared in advance.",
        impact: "standard",
      },
    ],
    closingNote: "February was a productive month operationally. The early identification and resolution of the Oxfordshire drainage issue was the standout action — it avoided what would have been a costly problem in spring. The household enters March in excellent condition.",
  },
];

function OutcomeCard({ outcome }: { outcome: Outcome }) {
  const catCfg = categoryConfig[outcome.category];
  const impactCfg = impactConfig[outcome.impact];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ border: `1px solid ${CREAM_FAINT}`, background: "rgba(14,12,9,0.4)" }}
    >
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-7 h-7 flex items-center justify-center shrink-0"
            style={{ background: catCfg.bg }}
          >
            <catCfg.icon size={12} style={{ color: catCfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[8px] tracking-[0.18em] uppercase" style={{ color: catCfg.color }}>
                {catCfg.label}
              </span>
              <span
                className="text-[8px] tracking-[0.18em] uppercase px-1.5 py-0.5"
                style={{ color: impactCfg.color, background: "rgba(255,255,255,0.04)" }}
              >
                {impactCfg.label}
              </span>
            </div>
            <h4 className="text-[13px] font-light mb-2" style={{ color: CREAM, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {outcome.title}
            </h4>
            <div
              className="flex items-start gap-2 p-3 mb-2"
              style={{ background: GREEN_DIM, border: `1px solid ${GREEN_BORDER}` }}
            >
              <CheckCircle size={10} className="shrink-0 mt-0.5" style={{ color: GREEN }} />
              <p className="text-[11px] font-light leading-relaxed" style={{ color: CREAM }}>
                {outcome.outcome}
              </p>
            </div>
            <p className="text-[10px] font-light leading-relaxed mb-2" style={{ color: CREAM_DIM }}>
              {outcome.detail}
            </p>
            {outcome.preventedIssue && (
              <div className="flex items-start gap-2">
                <Shield size={9} className="shrink-0 mt-0.5" style={{ color: "rgba(245,158,11,0.7)" }} />
                <p className="text-[10px] font-light" style={{ color: "rgba(245,158,11,0.7)" }}>
                  {outcome.preventedIssue}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function OrchestrationReport() {
  usePageMeta({
    title: "Orchestration Report | Carlota Jo",
    description: "Monthly silent orchestration summary — what was handled on your behalf.",
    canonical: "https://szlholdings.com/carlota-jo/orchestration-report",
  });

  const [reportIndex, setReportIndex] = useState(0);
  const report = reports[reportIndex];

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
              <FileText size={15} style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-[9px] tracking-[0.32em] uppercase font-medium" style={{ color: "rgba(196,170,126,0.5)" }}>
                Silent Orchestration
              </p>
              <h1 className="text-xl font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                Orchestration Report
              </h1>
            </div>
          </div>

          <p className="text-[13px] font-light leading-relaxed max-w-2xl mb-6" style={{ color: CREAM_DIM }}>
            A monthly record of what was handled silently on your behalf — outcomes achieved, issues prevented, and operations maintained. Presented as results, not process.
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setReportIndex(Math.min(reports.length - 1, reportIndex + 1))}
                disabled={reportIndex >= reports.length - 1}
                className="p-2 transition-opacity disabled:opacity-30 hover:opacity-75"
                style={{ border: `1px solid ${CREAM_FAINT}`, color: MUTED }}
              >
                <ChevronLeft size={12} />
              </button>
              <div>
                <p className="text-[14px] font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                  {report.month} {report.year}
                </p>
                <p className="text-[9px] tracking-wider uppercase" style={{ color: MUTED }}>{report.period}</p>
              </div>
              <button
                onClick={() => setReportIndex(Math.max(0, reportIndex - 1))}
                disabled={reportIndex <= 0}
                className="p-2 transition-opacity disabled:opacity-30 hover:opacity-75"
                style={{ border: `1px solid ${CREAM_FAINT}`, color: MUTED }}
              >
                <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={9} style={{ color: MUTED }} />
              <span className="text-[9px] font-light" style={{ color: MUTED }}>Generated automatically</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 mb-8 lg:grid-cols-4">
          {[
            { label: "Actions handled", value: report.stats.actionsHandled, icon: CheckCircle, color: GREEN },
            { label: "Vendor interactions", value: report.stats.vendorInteractions, icon: Star, color: GOLD },
            { label: "Calendar updates", value: report.stats.calendarUpdates, icon: Calendar, color: "rgba(6,182,212,0.8)" },
            { label: "Issues prevented", value: report.stats.issuesPrevented, icon: Shield, color: "rgba(245,158,11,0.8)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-4 py-3"
              style={{ border: `1px solid ${CREAM_FAINT}`, background: "rgba(14,12,9,0.4)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={11} style={{ color: stat.color }} />
                <span className="text-[9px] tracking-wider uppercase" style={{ color: MUTED }}>{stat.label}</span>
              </div>
              <p className="text-[26px] font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-8 p-5" style={{ border: `1px solid ${GOLD_BORDER}`, background: GOLD_DIM }}>
          <p className="text-[9px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(196,170,126,0.55)" }}>
            This month
          </p>
          <p className="text-[13px] font-light leading-relaxed" style={{ color: CREAM_DIM, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {report.intro}
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={11} style={{ color: "rgba(196,170,126,0.55)" }} />
            <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(196,170,126,0.55)" }}>
              What was handled — {report.month} {report.year}
            </p>
          </div>
          <div className="space-y-3">
            {report.outcomes.map(outcome => (
              <OutcomeCard key={outcome.id} outcome={outcome} />
            ))}
          </div>
        </div>

        <div
          className="p-6"
          style={{
            border: `1px solid ${GOLD_BORDER}`,
            background: "rgba(14,12,9,0.6)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 flex items-center justify-center"
              style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
            >
              <span className="text-[9px] font-light" style={{ color: GOLD }}>R</span>
            </div>
            <div>
              <p className="text-[11px] font-light" style={{ color: CREAM }}>Rosa</p>
              <p className="text-[9px]" style={{ color: MUTED }}>Estate Advisor · Carlota Jo Advisory</p>
            </div>
          </div>
          <p className="text-[12px] font-light leading-relaxed italic" style={{ color: CREAM_DIM }}>
            "{report.closingNote}"
          </p>
        </div>

        <div className="mt-6 p-4 flex items-start gap-3" style={{ border: `1px solid ${CREAM_FAINT}` }}>
          <Shield size={10} className="shrink-0 mt-0.5" style={{ color: MUTED }} />
          <p className="text-[10px] font-light leading-relaxed" style={{ color: MUTED }}>
            This report is generated automatically at the end of each calendar month. It reflects only what was handled on your behalf — never process, cost, or vendor detail unless specifically requested. All vendor interactions were conducted under existing confidentiality protocols. Supporting documentation is available in your secure portal on request.
          </p>
        </div>
      </div>
    </div>
  );
}
