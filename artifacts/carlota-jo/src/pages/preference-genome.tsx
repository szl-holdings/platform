import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ChevronDown, ChevronUp, Edit3, Check, X, Star,
  Clock, MessageSquare, Coffee, Globe, Calendar, Shield,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CLIENT_GENOME, getHighConfidenceSignals } from "@/data/genome-data";
import { useGenome } from "@/context/GenomeContext";

const GOLD = "rgba(196,170,126,1)";
const GOLD_DIM = "rgba(196,170,126,0.08)";
const GOLD_BORDER = "rgba(196,170,126,0.15)";
const CREAM = "rgba(244,237,224,0.88)";
const CREAM_DIM = "rgba(244,237,224,0.45)";
const CREAM_FAINT = "rgba(244,237,224,0.08)";
const MUTED = "rgba(244,237,224,0.25)";

type GenomeSection = {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  preferences: GenomePref[];
};

type GenomePref = {
  key: string;
  label: string;
  value: string;
  confidence: "high" | "medium" | "low";
  source: string;
  lastUpdated: string;
};

const GENOME_INITIAL: GenomeSection[] = [
  {
    id: "routine",
    icon: Clock,
    label: "Daily Rhythm",
    color: "rgba(196,170,126,0.7)",
    preferences: [
      { key: "wake", label: "Wake time", value: "6:30 AM", confidence: "high", source: "Observed across 14 engagements", lastUpdated: "Mar 2026" },
      { key: "comms-start", label: "Communication window opens", value: "9:00 AM", confidence: "high", source: "Message pattern analysis", lastUpdated: "Mar 2026" },
      { key: "comms-end", label: "Communication window closes", value: "7:00 PM", confidence: "high", source: "Response pattern analysis", lastUpdated: "Mar 2026" },
      { key: "review", label: "Preferred review time", value: "Morning, before 10:00 AM", confidence: "medium", source: "Session scheduling history", lastUpdated: "Feb 2026" },
    ],
  },
  {
    id: "comms",
    icon: MessageSquare,
    label: "Communication Style",
    color: "rgba(139,92,246,0.7)",
    preferences: [
      { key: "length", label: "Summary length preference", value: "Brief — 3 key points maximum", confidence: "high", source: "Document review feedback", lastUpdated: "Mar 2026" },
      { key: "tone", label: "Preferred tone", value: "Direct, formal, no jargon", confidence: "high", source: "Explicit instruction, onboarding session", lastUpdated: "Feb 2026" },
      { key: "frequency", label: "Update frequency", value: "Weekly digest, urgent items same-day", confidence: "high", source: "Service plan, confirmed Mar 2026", lastUpdated: "Mar 2026" },
      { key: "medium", label: "Preferred medium", value: "Written summaries over calls", confidence: "medium", source: "Response pattern analysis", lastUpdated: "Jan 2026" },
    ],
  },
  {
    id: "tastes",
    icon: Star,
    label: "Tastes & Standards",
    color: "rgba(16,185,129,0.7)",
    preferences: [
      { key: "floral", label: "Floral arrangements", value: "White and ivory only — no bold colours", confidence: "high", source: "Explicit instruction, April 2025", lastUpdated: "Apr 2025" },
      { key: "catering", label: "Catering standard", value: "British sourcing preferred, no heavy sauces", confidence: "medium", source: "Observed at 3 events", lastUpdated: "Dec 2025" },
      { key: "housekeeping", label: "Housekeeping standard", value: "No scented products. Fragrance-free only.", confidence: "high", source: "Explicit instruction, onboarding", lastUpdated: "Feb 2026" },
      { key: "temperature", label: "Property temperature", value: "68–70°F / 20–21°C", confidence: "high", source: "Service plan specification", lastUpdated: "Feb 2026" },
    ],
  },
  {
    id: "sensitivities",
    icon: Shield,
    label: "Sensitivities & Discretion",
    color: "rgba(239,68,68,0.65)",
    preferences: [
      { key: "visitors", label: "Visitor access", value: "All vendors must confirm 48h in advance. No exceptions.", confidence: "high", source: "Explicit instruction", lastUpdated: "Feb 2026" },
      { key: "photography", label: "Photography on-site", value: "Prohibited without explicit written approval", confidence: "high", source: "Explicit instruction", lastUpdated: "Feb 2026" },
      { key: "staff-comms", label: "Staff communication protocol", value: "All staff to report to Rosa first. No direct client contact without prior arrangement.", confidence: "high", source: "Service plan", lastUpdated: "Feb 2026" },
      { key: "media", label: "Media & external presence", value: "No references to client or properties in any external communications", confidence: "high", source: "NDA & service plan", lastUpdated: "Feb 2026" },
    ],
  },
  {
    id: "cadence",
    icon: Calendar,
    label: "Seasonal Cadence",
    color: "rgba(245,158,11,0.7)",
    preferences: [
      { key: "summer", label: "Summer residence", value: "Oxfordshire Estate — May to September", confidence: "high", source: "Observed 2 consecutive years", lastUpdated: "Oct 2025" },
      { key: "winter", label: "Winter base", value: "Mayfair — October to April", confidence: "high", source: "Observed 2 consecutive years", lastUpdated: "Oct 2025" },
      { key: "travel", label: "Travel frequency", value: "International 4–6 times per year. Main destinations: New York, Monaco, Dubai.", confidence: "medium", source: "Session notes, travel coordination", lastUpdated: "Mar 2026" },
      { key: "festive", label: "Festive period", value: "Oxfordshire always. Family gathering — elevated staffing required.", confidence: "high", source: "Observed 2 consecutive years", lastUpdated: "Jan 2026" },
    ],
  },
  {
    id: "service",
    icon: Coffee,
    label: "Service Preferences",
    color: "rgba(6,182,212,0.7)",
    preferences: [
      { key: "vendors", label: "Vendor relationship style", value: "Rosa manages — client not to be contacted directly by vendors", confidence: "high", source: "Service plan", lastUpdated: "Feb 2026" },
      { key: "decisions", label: "Decision escalation threshold", value: "Items under £2,000 — Rosa decides. Above: brief summary for approval.", confidence: "high", source: "Engagement agreement", lastUpdated: "Feb 2026" },
      { key: "surprises", label: "Tolerance for surprises", value: "Zero. All changes to standard operations briefed in advance.", confidence: "high", source: "Explicit instruction, April 2025", lastUpdated: "Apr 2025" },
      { key: "language", label: "Reporting language", value: "British English. Metric + Imperial both acceptable.", confidence: "medium", source: "Document review feedback", lastUpdated: "Mar 2026" },
    ],
  },
];

const confidenceColors: Record<string, string> = {
  high: "rgba(16,185,129,0.75)",
  medium: "rgba(245,158,11,0.75)",
  low: "rgba(239,68,68,0.65)",
};

const confidenceLabels: Record<string, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

function PrefRow({ pref, onEdit }: { pref: GenomePref; onEdit: (pref: GenomePref) => void }) {
  return (
    <div
      className="flex items-start gap-4 py-4"
      style={{ borderBottom: `1px solid ${CREAM_FAINT}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[11px] tracking-[0.15em] uppercase" style={{ color: MUTED }}>{pref.label}</p>
          <span
            className="text-[8px] tracking-wider uppercase px-1.5 py-0.5"
            style={{ color: confidenceColors[pref.confidence], border: `1px solid ${confidenceColors[pref.confidence]}`, opacity: 0.8 }}
          >
            {confidenceLabels[pref.confidence]}
          </span>
        </div>
        <p className="text-[13px] font-light" style={{ color: CREAM }}>{pref.value}</p>
        <p className="text-[10px] mt-1 font-light" style={{ color: MUTED }}>
          {pref.source} · Updated {pref.lastUpdated}
        </p>
      </div>
      <button
        onClick={() => onEdit(pref)}
        className="shrink-0 p-1.5 transition-opacity hover:opacity-75"
        style={{ color: MUTED }}
      >
        <Edit3 size={12} />
      </button>
    </div>
  );
}

function SectionCard({
  section,
  onUpdatePref,
}: {
  section: GenomeSection;
  onUpdatePref: (key: string, newValue: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editingPref, setEditingPref] = useState<GenomePref | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleSave = () => {
    if (editingPref && editValue.trim()) {
      onUpdatePref(editingPref.key, editValue.trim());
    }
    setEditingPref(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ border: `1px solid ${GOLD_BORDER}`, background: "rgba(14,12,9,0.6)" }}
    >
      <button
        className="w-full flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: open ? `1px solid ${CREAM_FAINT}` : "none" }}
        onClick={() => setOpen(!open)}
      >
        <div
          className="w-7 h-7 flex items-center justify-center shrink-0"
          style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
        >
          <section.icon size={13} style={{ color: section.color }} />
        </div>
        <span className="flex-1 text-left text-[13px] font-light" style={{ color: CREAM }}>{section.label}</span>
        <span className="text-[10px] tracking-wider uppercase mr-2" style={{ color: MUTED }}>
          {section.preferences.length} signals
        </span>
        {open ? <ChevronUp size={13} style={{ color: MUTED }} /> : <ChevronDown size={13} style={{ color: MUTED }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-5"
          >
            {section.preferences.map((pref) => (
              <div key={pref.key}>
                {editingPref?.key === pref.key ? (
                  <div className="py-4" style={{ borderBottom: `1px solid ${CREAM_FAINT}` }}>
                    <p className="text-[11px] tracking-[0.15em] uppercase mb-2" style={{ color: MUTED }}>{pref.label}</p>
                    <div className="flex items-center gap-2">
                      <input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 text-[12px] font-light"
                        style={{
                          background: "rgba(244,237,224,0.05)",
                          border: `1px solid ${GOLD_BORDER}`,
                          color: CREAM,
                          outline: "none",
                        }}
                        autoFocus
                      />
                      <button onClick={handleSave} style={{ color: GOLD }}>
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingPref(null)} style={{ color: MUTED }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <PrefRow pref={pref} onEdit={(p) => { setEditingPref(p); setEditValue(p.value); }} />
                )}
              </div>
            ))}
            <div className="py-4">
              <button
                className="text-[10px] tracking-[0.15em] uppercase transition-opacity hover:opacity-75"
                style={{ color: MUTED }}
              >
                + Add preference signal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PreferenceGenome() {
  usePageMeta({
    title: "Preference Genome | Carlota Jo",
    description: "Client preference intelligence — routines, tastes, communication style, cadence, and sensitivities.",
    canonical: "https://szlholdings.com/carlota-jo/preference-genome",
  });

  const { updatePref: pushToGenomeContext, lastUpdated: contextLastUpdated } = useGenome();
  const [genomeData, setGenomeData] = useState<GenomeSection[]>(GENOME_INITIAL);

  const lastUpdated = contextLastUpdated;

  const updatePref = (sectionId: string, key: string, newValue: string) => {
    setGenomeData(prev =>
      prev.map(s =>
        s.id === sectionId
          ? {
              ...s,
              preferences: s.preferences.map(p =>
                p.key === key ? { ...p, value: newValue, lastUpdated: "Just now" } : p
              ),
            }
          : s
      )
    );
    pushToGenomeContext(key, newValue);
  };

  const totalSignals = genomeData.reduce((sum, s) => sum + s.preferences.length, 0);
  const highConf = getHighConfidenceSignals().length;

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
              <Brain size={15} style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-[9px] tracking-[0.32em] uppercase font-medium" style={{ color: "rgba(196,170,126,0.5)" }}>
                Intelligence Layer
              </p>
              <h1 className="text-xl font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                Preference Genome
              </h1>
            </div>
          </div>
          <p className="text-[13px] font-light leading-relaxed max-w-2xl mb-8" style={{ color: CREAM_DIM }}>
            A living record of what Rosa has learned about this client — their rhythms, standards, sensitivities, and communication preferences. Every signal here is used to contextualise service delivery, recommendations, and summaries.
          </p>

          <div className="flex items-center gap-6">
            {[
              { label: "Preference signals", value: totalSignals },
              { label: "High confidence", value: highConf },
              { label: "Sections", value: genomeData.length },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-[22px] font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                  {stat.value}
                </p>
                <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: MUTED }}>{stat.label}</p>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {lastUpdated && (
                <span className="text-[9px] tracking-wider uppercase px-2 py-1 mr-2" style={{ color: "rgba(16,185,129,0.75)", border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.06)" }}>
                  Updated {lastUpdated}
                </span>
              )}
              <Globe size={11} style={{ color: MUTED }} />
              <span className="text-[10px] font-light" style={{ color: MUTED }}>{CLIENT_GENOME.name} · {CLIENT_GENOME.status} client</span>
            </div>
          </div>
        </motion.div>

        <div className="space-y-3">
          {genomeData.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onUpdatePref={(key, val) => updatePref(section.id, key, val)}
            />
          ))}
        </div>

        <div className="mt-8 p-5" style={{ border: `1px solid ${GOLD_BORDER}`, background: GOLD_DIM }}>
          <p className="text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: "rgba(196,170,126,0.55)" }}>
            How the Genome is built
          </p>
          <p className="text-[12px] font-light leading-relaxed" style={{ color: CREAM_DIM }}>
            Preference signals are collected from explicit client instructions, session notes, observed patterns, and service plan specifications. Confidence levels reflect the strength and recency of the evidence. All signals are used when generating recommendations, summaries, and anticipation suggestions.
          </p>
        </div>
      </div>
    </div>
  );
}
