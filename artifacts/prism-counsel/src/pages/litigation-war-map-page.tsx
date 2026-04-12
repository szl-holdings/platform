import { useState } from "react";
import {
  Map, Calendar, AlertTriangle, FileText, Scale, Clock,
  ChevronRight, Target, Activity, Eye, Flag, TrendingUp,
  Zap, CheckCircle, XCircle, Users, ArrowRight
} from "lucide-react";

const ACCENT = "#c8a96e";
const BG = "#080c14";
const CARD = "#0c1220";
const BORDER = "rgba(255,255,255,0.06)";

type EventType = "filing" | "hearing" | "deadline" | "motion" | "discovery" | "deposition" | "mediation" | "trial" | "prediction";

interface TimelineEvent {
  id: string;
  date: string;
  label: string;
  type: EventType;
  party: "plaintiff" | "defendant" | "court" | "both";
  status: "completed" | "upcoming" | "overdue" | "predicted";
  description: string;
  significance: "critical" | "high" | "medium" | "low";
}

interface Matter {
  id: number;
  title: string;
  caseNumber: string;
  judge: string;
  opposingCounsel: string;
  stage: string;
  events: TimelineEvent[];
}

const MATTERS: Matter[] = [
  {
    id: 1,
    title: "Rodriguez v. National General Insurance",
    caseNumber: "2025-CV-04821",
    judge: "Hon. Patricia L. Moreno",
    opposingCounsel: "Davis & Hayes LLP",
    stage: "Discovery",
    events: [
      { id: "e1", date: "2025-09-15", label: "Complaint Filed", type: "filing", party: "plaintiff", status: "completed", description: "Initial complaint filed alleging negligence and bad faith delay.", significance: "high" },
      { id: "e2", date: "2025-10-20", label: "Answer & Affirmative Defenses", type: "filing", party: "defendant", status: "completed", description: "Defendant answered with 8 affirmative defenses including contributory negligence and pre-existing conditions.", significance: "medium" },
      { id: "e3", date: "2025-11-05", label: "Case Management Conference", type: "hearing", party: "court", status: "completed", description: "Judge Moreno set aggressive discovery schedule. Trial set for October 2026.", significance: "high" },
      { id: "e4", date: "2025-12-15", label: "Initial Disclosures Exchanged", type: "discovery", party: "both", status: "completed", description: "Both parties exchanged Rule 26 initial disclosures. Defendant identified 3 potential expert witnesses.", significance: "medium" },
      { id: "e5", date: "2026-01-30", label: "Motion to Compel — Discovery", type: "motion", party: "plaintiff", status: "completed", description: "Filed after defendant failed to produce claims file. Granted by Judge Moreno February 14.", significance: "high" },
      { id: "e6", date: "2026-02-28", label: "Plaintiff Deposition", type: "deposition", party: "defendant", status: "completed", description: "Client deposed for 4 hours. Davis & Hayes focused on treatment gaps and prior accident history.", significance: "high" },
      { id: "e7", date: "2026-04-30", label: "Expert Disclosure Deadline", type: "deadline", party: "plaintiff", status: "upcoming", description: "Must disclose retained expert witnesses with reports by this date. Accident reconstruction expert not yet retained.", significance: "critical" },
      { id: "e8", date: "2026-05-15", label: "Defendant Expert Disclosure", type: "deadline", party: "defendant", status: "upcoming", description: "Defense will disclose IME physician and likely an accident reconstructionist.", significance: "high" },
      { id: "e9", date: "2026-06-15", label: "Mandatory Mediation", type: "mediation", party: "court", status: "upcoming", description: "Judge Moreno ordered mandatory mediation. Mediator: Hon. Robert Walsh (ret.). Opening demand recommended: $135,000.", significance: "critical" },
      { id: "e10", date: "2026-07-31", label: "Discovery Cutoff", type: "deadline", party: "both", status: "upcoming", description: "All discovery must be completed by this date.", significance: "high" },
      { id: "e11", date: "2026-08-30", label: "Summary Judgment Motions Due", type: "motion", party: "defendant", status: "predicted", description: "AI prediction: 78% probability Davis & Hayes files partial SJ on pain and suffering damages given IME results.", significance: "high" },
      { id: "e12", date: "2026-10-20", label: "Trial", type: "trial", party: "court", status: "predicted", description: "Jury trial scheduled. Estimated 4-5 days. Backup date: December 2026.", significance: "critical" },
    ],
  },
  {
    id: 2,
    title: "Thompson v. Allstate Property & Casualty",
    caseNumber: "2026-CV-01122",
    judge: "Hon. James Rodriguez",
    opposingCounsel: "Marshall & Morris LLP",
    stage: "Pre-Trial",
    events: [
      { id: "f1", date: "2026-01-10", label: "Complaint Filed", type: "filing", party: "plaintiff", status: "completed", description: "Alleging first-party bad faith refusal to pay homeowners claim.", significance: "high" },
      { id: "f2", date: "2026-02-15", label: "Answer Filed", type: "filing", party: "defendant", status: "completed", description: "Allstate denied bad faith; asserted coverage exclusion for 'sudden and accidental' damage.", significance: "medium" },
      { id: "f3", date: "2026-03-01", label: "CMC & Scheduling Order", type: "hearing", party: "court", status: "completed", description: "Judge Rodriguez issued strict scheduling order. Missing any deadline will result in sanctions.", significance: "high" },
      { id: "f4", date: "2026-05-01", label: "Motion to Dismiss — Coverage", type: "motion", party: "defendant", status: "upcoming", description: "Predicted based on defense filing patterns in similar cases. 41% grant rate with Judge Rodriguez.", significance: "high" },
      { id: "f5", date: "2026-06-30", label: "Expert Disclosures", type: "deadline", party: "both", status: "upcoming", description: "Public adjuster expert required for bad faith damages calculation.", significance: "critical" },
      { id: "f6", date: "2026-09-15", label: "Summary Judgment", type: "motion", party: "defendant", status: "predicted", description: "High probability (82%) of SJ motion on bad faith standard given Judge Rodriguez's 47% SJ grant rate.", significance: "critical" },
    ],
  },
];

const EVENT_CONFIG: Record<EventType, { color: string; bg: string; label: string }> = {
  filing: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", label: "Filing" },
  hearing: { color: ACCENT, bg: "rgba(200,169,110,0.1)", label: "Hearing" },
  deadline: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Deadline" },
  motion: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", label: "Motion" },
  discovery: { color: "#14b8a6", bg: "rgba(20,184,166,0.1)", label: "Discovery" },
  deposition: { color: "#f97316", bg: "rgba(249,115,22,0.1)", label: "Deposition" },
  mediation: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Mediation" },
  trial: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Trial" },
  prediction: { color: "#64748b", bg: "rgba(100,116,139,0.1)", label: "Predicted" },
};

const SIGNIFICANCE_CONFIG = {
  critical: { dot: "#ef4444", size: "w-3 h-3" },
  high: { dot: "#f97316", size: "w-2.5 h-2.5" },
  medium: { dot: ACCENT, size: "w-2 h-2" },
  low: { dot: "#64748b", size: "w-1.5 h-1.5" },
};

const STATUS_CONFIG = {
  completed: { label: "Done", color: "#22c55e" },
  upcoming: { label: "Upcoming", color: ACCENT },
  overdue: { label: "Overdue", color: "#ef4444" },
  predicted: { label: "Predicted", color: "#64748b" },
};

function TimelineView({ matter }: { matter: Matter }) {
  const [selected, setSelected] = useState<string | null>(null);

  const sortedEvents = [...matter.events].sort((a, b) => a.date.localeCompare(b.date));
  const today = "2026-04-12";

  return (
    <div>
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="space-y-2 pl-14">
          {sortedEvents.map((event) => {
            const cfg = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.filing;
            const sigCfg = SIGNIFICANCE_CONFIG[event.significance];
            const statusCfg = STATUS_CONFIG[event.status];
            const isPast = event.date < today;
            const isPrediction = event.status === "predicted";

            return (
              <div
                key={event.id}
                className="relative cursor-pointer"
                onClick={() => setSelected(selected === event.id ? null : event.id)}
              >
                <div
                  className="absolute flex items-center justify-center"
                  style={{ left: -46, top: 8, width: 24, height: 24 }}
                >
                  <div
                    className={`rounded-full border-2 ${sigCfg.size}`}
                    style={{
                      background: isPrediction ? "rgba(100,116,139,0.15)" : cfg.bg,
                      borderColor: isPrediction ? "#374151" : cfg.color,
                      borderStyle: isPrediction ? "dashed" : "solid",
                      opacity: isPast ? 0.7 : 1,
                    }}
                  />
                </div>

                <div
                  className="rounded-lg border p-3 transition-all"
                  style={{
                    background: selected === event.id ? cfg.bg : "rgba(255,255,255,0.015)",
                    borderColor: selected === event.id ? cfg.color + "40" : BORDER,
                    opacity: isPast && !selected ? 0.7 : 1,
                    borderStyle: isPrediction ? "dashed" : "solid",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: cfg.color, background: cfg.bg }}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-200">{event.label}</span>
                      {isPrediction && (
                        <span className="text-[8px] font-medium px-1 py-0.5 rounded" style={{ color: "#64748b", background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.15)" }}>
                          AI PREDICTED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
                      <span className="text-[9px] font-mono text-slate-600">{event.date}</span>
                    </div>
                  </div>
                  {selected === event.id && (
                    <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">{event.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LitigationWarMapPage() {
  const [selectedMatter, setSelectedMatter] = useState(1);

  const matter = MATTERS.find((m) => m.id === selectedMatter) ?? MATTERS[0];
  const upcoming = matter.events.filter((e) => e.status === "upcoming").sort((a, b) => a.date.localeCompare(b.date));
  const critical = upcoming.filter((e) => e.significance === "critical");

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Map className="w-5 h-5" style={{ color: ACCENT }} />
          <h1 className="text-lg font-semibold text-slate-100">Litigation War Map</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium ml-1" style={{ background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}25` }}>
            ANIMATED BATTLE MAP
          </span>
        </div>
        <p className="text-xs text-slate-500">Full matter timeline with deadlines, filings, predicted next moves, and litigation progression</p>
      </div>

      <div className="flex gap-2">
        {MATTERS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMatter(m.id)}
            className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all text-left max-w-xs"
            style={{
              background: selectedMatter === m.id ? `${ACCENT}10` : "rgba(255,255,255,0.03)",
              color: selectedMatter === m.id ? ACCENT : "#64748b",
              border: `1px solid ${selectedMatter === m.id ? `${ACCENT}25` : BORDER}`,
            }}
          >
            <div className="font-semibold text-slate-300 text-[10px]">{m.caseNumber}</div>
            <div className="text-[9px] truncate">{m.title.split(" v. ")[0]} v. {m.title.split(" v. ")[1]?.slice(0, 20)}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Current Stage</div>
          <div className="text-base font-bold text-slate-100">{matter.stage}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{matter.judge}</div>
        </div>
        <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Critical Deadlines</div>
          <div className="text-2xl font-bold font-mono" style={{ color: critical.length > 0 ? "#ef4444" : "#22c55e" }}>{critical.length}</div>
          <div className="text-[10px] text-slate-500">In next 90 days</div>
        </div>
        <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Opposing Counsel</div>
          <div className="text-sm font-semibold text-slate-200">{matter.opposingCounsel}</div>
          <div className="text-[10px] text-slate-500">{matter.caseNumber}</div>
        </div>
      </div>

      {critical.length > 0 && (
        <div className="rounded-lg border p-4" style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-300">Critical Action Required</span>
          </div>
          <div className="space-y-2">
            {critical.map((e) => (
              <div key={e.id} className="flex items-start gap-2">
                <Flag className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-semibold text-slate-200">{e.label}</span>
                  <span className="text-[9px] text-slate-500 ml-2">{e.date}</span>
                  <p className="text-[9px] text-slate-400 mt-0.5">{e.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
        <div className="flex items-center gap-2 mb-5">
          <Map className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-sm font-semibold text-slate-100">Full Matter Timeline</span>
          <div className="ml-auto flex gap-3 text-[9px]">
            <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full border border-dashed border-slate-500" /> Predicted by AI</span>
            <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-400" /> Critical</span>
          </div>
        </div>
        <TimelineView matter={matter} />
      </div>
    </div>
  );
}
