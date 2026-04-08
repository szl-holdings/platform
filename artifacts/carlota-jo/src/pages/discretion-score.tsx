import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle, Lock, ChevronRight } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CLIENT_GENOME } from "@/data/genome-data";

const GOLD = "rgba(196,170,126,1)";
const GOLD_DIM = "rgba(196,170,126,0.08)";
const GOLD_BORDER = "rgba(196,170,126,0.15)";
const CREAM = "rgba(244,237,224,0.88)";
const CREAM_DIM = "rgba(244,237,224,0.45)";
const CREAM_FAINT = "rgba(244,237,224,0.07)";
const MUTED = "rgba(244,237,224,0.25)";

type DiscretionLevel = 1 | 2 | 3 | 4 | 5;

type Interaction = {
  id: string;
  title: string;
  category: string;
  date: string;
  score: DiscretionLevel;
  restricted: boolean;
  summary: string;
  fullContent?: string;
};

const levelConfig: Record<DiscretionLevel, { label: string; color: string; bg: string; icon: React.ElementType; restriction: string }> = {
  1: { label: "Open", color: "rgba(16,185,129,0.8)", bg: "rgba(16,185,129,0.07)", icon: Eye, restriction: "Standard access" },
  2: { label: "Sensitive", color: "rgba(245,158,11,0.8)", bg: "rgba(245,158,11,0.07)", icon: Eye, restriction: "Rosa + client only" },
  3: { label: "Private", color: GOLD, bg: GOLD_DIM, icon: EyeOff, restriction: "Rosa only. Simplified client summary." },
  4: { label: "Confidential", color: "rgba(239,68,68,0.8)", bg: "rgba(239,68,68,0.07)", icon: Lock, restriction: "Restricted. No documentation shared." },
  5: { label: "Eyes Only", color: "rgba(239,68,68,0.95)", bg: "rgba(239,68,68,0.1)", icon: Lock, restriction: "Verbal communication only. No record." },
};

const interactions: Interaction[] = [
  {
    id: "i1",
    title: "Monthly Operations Summary — March 2026",
    category: "Reporting",
    date: "2026-03-31",
    score: 1,
    restricted: false,
    summary: "Routine operational summary covering March vendor performance, open actions, and upcoming priorities.",
    fullContent: "Full March summary with all operational details, vendor performance notes, and action log.",
  },
  {
    id: "i2",
    title: "Household staff conduct matter",
    category: "Staffing",
    date: "2026-03-18",
    score: 4,
    restricted: true,
    summary: "A conduct issue was identified and addressed. Matter resolved. No further action required.",
    fullContent: "[RESTRICTED — Full details not available in this view. Verbal briefing only.]",
  },
  {
    id: "i3",
    title: "Oxfordshire vendor replacement rationale",
    category: "Vendors",
    date: "2026-03-28",
    score: 2,
    restricted: false,
    summary: "Rationale for recommending vendor replacement, including performance assessment and candidate evaluation.",
    fullContent: "Detailed assessment of current groundskeeper performance over two seasons. Candidate profile: James Alderton, references reviewed. Recommendation: transition at end of current season.",
  },
  {
    id: "i4",
    title: "Security and access protocol update",
    category: "Security",
    date: "2026-03-10",
    score: 3,
    restricted: true,
    summary: "Access protocols updated. Key changes implemented. Rosa holds full record.",
    fullContent: "[RESTRICTED — Simplified summary only. Full protocol document held by Rosa.]",
  },
  {
    id: "i5",
    title: "Legal matter — property boundary",
    category: "Legal",
    date: "2026-02-14",
    score: 5,
    restricted: true,
    summary: "A legal matter relating to the Oxfordshire property was escalated to solicitors. Status: active.",
    fullContent: "[EYES ONLY — No documentation. Verbal updates only. No record in this system.]",
  },
  {
    id: "i6",
    title: "Q1 Review Session notes",
    category: "Engagement",
    date: "2026-01-06",
    score: 1,
    restricted: false,
    summary: "Quarterly review outcomes, agreed priorities for Q1 2026, and action items.",
    fullContent: "Full review notes including agreed priorities, action owners, and next review date.",
  },
  {
    id: "i7",
    title: "Medical appointment coordination",
    category: "Lifestyle",
    date: "2026-03-22",
    score: 4,
    restricted: true,
    summary: "Appointment coordinated. Details held confidentially.",
    fullContent: "[RESTRICTED — No documentation. Rosa holds details only.]",
  },
  {
    id: "i8",
    title: "Boiler repair — Mayfair",
    category: "Maintenance",
    date: "2026-04-03",
    score: 1,
    restricted: false,
    summary: "Boiler pressure fault identified and resolved. Vendor: Dawson & Hooper. No further action required.",
    fullContent: "Full incident report: fault identified 3 April, repaired 6 April. Root cause: worn pressure valve. Repair cost: £380. No further action.",
  },
];

function DiscretionMeter({ score }: { score: DiscretionLevel }) {
  return (
    <div className="flex items-center gap-0.5">
      {([1, 2, 3, 4, 5] as DiscretionLevel[]).map(level => {
        const cfg = levelConfig[level];
        return (
          <div
            key={level}
            className="w-3 h-3"
            style={{
              background: level <= score ? cfg.color : CREAM_FAINT,
              opacity: level <= score ? 1 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}

function InteractionRow({ interaction, onView }: { interaction: Interaction; onView: (i: Interaction) => void }) {
  const cfg = levelConfig[interaction.score];
  const Icon = cfg.icon;
  const d = new Date(interaction.date + "T12:00:00");

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full text-left flex items-start gap-4 py-4 transition-colors group"
      style={{ borderBottom: `1px solid ${CREAM_FAINT}` }}
      onClick={() => onView(interaction)}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = GOLD_DIM; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div
        className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: cfg.bg, border: `1px solid ${cfg.color}20` }}
      >
        <Icon size={12} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[8px] tracking-[0.18em] uppercase px-1.5 py-0.5"
            style={{ color: cfg.color, background: cfg.bg }}
          >
            {cfg.label}
          </span>
          <span className="text-[9px] tracking-wider uppercase" style={{ color: MUTED }}>
            {interaction.category}
          </span>
          {interaction.restricted && (
            <Lock size={9} style={{ color: MUTED }} />
          )}
        </div>
        <p className="text-[13px] font-light mb-1" style={{ color: CREAM }}>{interaction.title}</p>
        <p className="text-[11px] font-light leading-relaxed" style={{ color: CREAM_DIM }}>{interaction.summary}</p>
        <p className="text-[10px] mt-1" style={{ color: MUTED }}>
          {d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <DiscretionMeter score={interaction.score} />
        <ChevronRight size={12} style={{ color: MUTED }} className="group-hover:opacity-75 transition-opacity" />
      </div>
    </motion.button>
  );
}

export default function DiscretionScore() {
  usePageMeta({
    title: "Discretion Score | Carlota Jo",
    description: "Privacy and sensitivity scoring for client interactions, recommendations, and summaries.",
    canonical: "https://szlholdings.com/carlota-jo/discretion",
  });

  const [selected, setSelected] = useState<Interaction | null>(null);
  const [levelFilter, setLevelFilter] = useState<DiscretionLevel | "all">("all");

  const filtered = levelFilter === "all"
    ? interactions
    : interactions.filter(i => i.score === levelFilter);

  const distribution = ([1, 2, 3, 4, 5] as DiscretionLevel[]).map(level => ({
    level,
    count: interactions.filter(i => i.score === level).length,
  }));

  return (
    <div className="min-h-screen" style={{ background: "#0e0c09", color: CREAM }}>
      <div className="max-w-5xl mx-auto px-6 py-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 flex items-center justify-center" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
              <Shield size={15} style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-[9px] tracking-[0.32em] uppercase font-medium" style={{ color: "rgba(196,170,126,0.5)" }}>
                Intelligence Layer
              </p>
              <h1 className="text-xl font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                Discretion Score
              </h1>
            </div>
          </div>

          <p className="text-[13px] font-light leading-relaxed max-w-2xl mb-8" style={{ color: CREAM_DIM }}>
            Every interaction, recommendation, and summary is scored for privacy and sensitivity. High-discretion items receive restricted visibility, simplified client-facing summaries, and tighter access controls. Rosa manages access levels based on the Preference Genome and client instruction.
          </p>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {distribution.map(({ level, count }) => {
              const cfg = levelConfig[level];
              const Icon = cfg.icon;
              return (
                <button
                  key={level}
                  onClick={() => setLevelFilter(levelFilter === level ? "all" : level)}
                  className="p-3 text-left transition-all"
                  style={{
                    border: levelFilter === level ? `1px solid ${cfg.color}` : `1px solid ${CREAM_FAINT}`,
                    background: levelFilter === level ? cfg.bg : "transparent",
                  }}
                >
                  <div className="flex items-center gap-1 mb-2">
                    <Icon size={10} style={{ color: cfg.color }} />
                    <span className="text-[8px] tracking-wider uppercase" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <p className="text-[20px] font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                    {count}
                  </p>
                  <p className="text-[9px] font-light mt-0.5" style={{ color: MUTED }}>
                    {cfg.restriction}
                  </p>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setLevelFilter("all")}
            className="text-[10px] tracking-[0.15em] uppercase transition-opacity hover:opacity-75"
            style={{ color: MUTED, textDecoration: levelFilter !== "all" ? "underline" : "none" }}
          >
            {levelFilter !== "all" ? "Clear filter" : `Showing all ${interactions.length} interactions`}
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7" style={{ border: `1px solid ${GOLD_BORDER}`, background: "rgba(14,12,9,0.6)" }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${CREAM_FAINT}` }}>
              <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: MUTED }}>
                Interaction Log
              </p>
            </div>
            <div className="px-5">
              {filtered.map(interaction => (
                <InteractionRow
                  key={interaction.id}
                  interaction={interaction}
                  onView={setSelected}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full"
                style={{ border: `1px solid ${GOLD_BORDER}`, background: "rgba(14,12,9,0.6)" }}
              >
                <div className="px-5 py-4" style={{ borderBottom: `1px solid ${CREAM_FAINT}` }}>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: MUTED }}>Interaction Detail</p>
                    <button onClick={() => setSelected(null)} className="text-[10px] tracking-wider uppercase" style={{ color: MUTED }}>
                      ← Back
                    </button>
                  </div>
                </div>
                <div className="px-5 py-5">
                  {(() => {
                    const cfg = levelConfig[selected.score];
                    const Icon = cfg.icon;
                    return (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <Icon size={13} style={{ color: cfg.color }} />
                          <span className="text-[10px] tracking-[0.15em] uppercase" style={{ color: cfg.color }}>
                            {cfg.label} — Level {selected.score}
                          </span>
                        </div>
                        <h3 className="text-[16px] font-light mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                          {selected.title}
                        </h3>
                        <DiscretionMeter score={selected.score} />
                        <div className="mt-5 space-y-4">
                          <div>
                            <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: MUTED }}>Client-facing summary</p>
                            <div className="p-4" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
                              <p className="text-[12px] font-light leading-relaxed" style={{ color: CREAM_DIM }}>{selected.summary}</p>
                            </div>
                          </div>
                          {!selected.restricted && selected.fullContent && (
                            <div>
                              <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: MUTED }}>Full content (Rosa only)</p>
                              <div className="p-4" style={{ background: CREAM_FAINT, border: `1px solid ${CREAM_FAINT}` }}>
                                <p className="text-[12px] font-light leading-relaxed" style={{ color: CREAM_DIM }}>{selected.fullContent}</p>
                              </div>
                            </div>
                          )}
                          {selected.restricted && (
                            <div className="flex items-start gap-2 p-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                              <Lock size={12} style={{ color: "rgba(239,68,68,0.6)", marginTop: 1 }} />
                              <div>
                                <p className="text-[10px] tracking-[0.15em] uppercase mb-1" style={{ color: "rgba(239,68,68,0.6)" }}>Restricted</p>
                                <p className="text-[11px] font-light" style={{ color: CREAM_DIM }}>
                                  {cfg.restriction}. Full details not accessible via this interface.
                                </p>
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: MUTED }}>Access protocol</p>
                            <div className="flex items-start gap-2">
                              {selected.score >= 4 ? (
                                <AlertTriangle size={11} style={{ color: "rgba(239,68,68,0.6)", marginTop: 1 }} />
                              ) : (
                                <CheckCircle size={11} style={{ color: "rgba(16,185,129,0.6)", marginTop: 1 }} />
                              )}
                              <p className="text-[11px] font-light" style={{ color: CREAM_DIM }}>{cfg.restriction}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            ) : (
              <div
                className="h-full flex flex-col items-center justify-center py-16"
                style={{ border: `1px solid ${CREAM_FAINT}`, background: "rgba(14,12,9,0.3)" }}
              >
                <Shield size={24} style={{ color: MUTED, marginBottom: 12 }} />
                <p className="text-[12px] font-light text-center" style={{ color: MUTED }}>
                  Select an interaction to view its discretion detail and access protocol.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-5" style={{ border: `1px solid ${GOLD_BORDER}`, background: GOLD_DIM }}>
          <p className="text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: "rgba(196,170,126,0.55)" }}>
            Discretion routing — Genome baseline: Level {CLIENT_GENOME.discretionLevel}
          </p>
          <p className="text-[12px] font-light leading-relaxed mb-3" style={{ color: CREAM_DIM }}>
            {CLIENT_GENOME.name}'s Preference Genome specifies a baseline discretion threshold of Level {CLIENT_GENOME.discretionLevel} — items at or above this threshold are routed to restricted protocols by default. Individual items may be scored above or below based on category and content sensitivity.
          </p>
          <p className="text-[11px] font-light leading-relaxed" style={{ color: MUTED }}>
            Level 1–2: Standard access. Client summaries include full context. Level 3: Simplified summary to client; Rosa holds full record. Level 4: Restricted — no documentation shared; Rosa brief only. Level 5: Verbal only — no record in any system.
          </p>
        </div>
      </div>
    </div>
  );
}
