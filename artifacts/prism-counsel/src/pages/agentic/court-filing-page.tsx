import { useState } from "react";
import { Gavel, Clock, Calendar, FileText, AlertTriangle, CheckCircle, MapPin, ChevronRight, Bell, ArrowRight, Shield, Users, Star, Eye } from "lucide-react";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";
const PRISM_RED = "#b85a4a";

interface DocketEntry {
  id: string;
  matter: string;
  court: string;
  judge: string;
  caseNumber: string;
  filings: { title: string; dueDate: string; status: "filed" | "drafting" | "review" | "overdue"; filedDate?: string }[];
  deadlines: { description: string; date: string; daysRemaining: number; priority: "critical" | "high" | "normal" }[];
  judicialPreferences: string[];
  proceduralNotes: string[];
}

const DOCKETS: DocketEntry[] = [
  {
    id: "DOC-2024-001",
    matter: "Martinez v. Pinnacle Freight LLC",
    court: "U.S. District Court — Southern District of New York",
    judge: "Hon. Margaret A. Kessler",
    caseNumber: "1:24-cv-01247-MAK",
    filings: [
      { title: "Motion for Summary Judgment", dueDate: "2024-03-25", status: "drafting" },
      { title: "Expert Witness Designation", dueDate: "2024-03-18", status: "review" },
      { title: "Response to Interrogatories (Set 2)", dueDate: "2024-03-12", status: "filed", filedDate: "2024-03-11" },
      { title: "Joint Pretrial Statement", dueDate: "2024-04-15", status: "drafting" },
    ],
    deadlines: [
      { description: "Expert designation due", date: "2024-03-18", daysRemaining: 3, priority: "critical" },
      { description: "Summary judgment briefing", date: "2024-03-25", daysRemaining: 10, priority: "high" },
      { description: "Pretrial conference", date: "2024-04-02", daysRemaining: 18, priority: "normal" },
      { description: "Joint pretrial statement", date: "2024-04-15", daysRemaining: 31, priority: "normal" },
    ],
    judicialPreferences: [
      "Strict page limits — 25 pages for motions, no exceptions",
      "Requires joint letter briefs before filing discovery motions",
      "Prefers tabular exhibit lists with Bates range references",
      "14-day notice period for all non-emergency applications",
      "Strongly favors stipulated facts — dislikes unnecessary disputes",
    ],
    proceduralNotes: [
      "ECF filing required — no paper copies unless ordered",
      "Courtesy copies to chambers within 24 hours of e-filing",
      "All exhibits must be OCR-searchable",
      "Individual motion practice rules posted on court website (Rev. Jan 2024)",
    ],
  },
  {
    id: "DOC-2024-002",
    matter: "Chen v. Harbor Point Insurance",
    court: "U.S. District Court — Eastern District of New York",
    judge: "Hon. Robert T. Franklin",
    caseNumber: "2:24-cv-00892-RTF",
    filings: [
      { title: "Motion to Compel Production", dueDate: "2024-03-20", status: "review" },
      { title: "Amended Complaint", dueDate: "2024-03-15", status: "filed", filedDate: "2024-03-14" },
      { title: "Opposition to Motion to Dismiss", dueDate: "2024-03-28", status: "drafting" },
    ],
    deadlines: [
      { description: "Motion to compel deadline", date: "2024-03-20", daysRemaining: 5, priority: "high" },
      { description: "Opposition to MTD", date: "2024-03-28", daysRemaining: 13, priority: "high" },
      { description: "Oral argument on MTD", date: "2024-04-10", daysRemaining: 26, priority: "normal" },
    ],
    judicialPreferences: [
      "Encourages meet-and-confer before any discovery motions",
      "Prefers mediation — will order it if parties don't voluntarily engage",
      "Allows up to 30 pages on dispositive motions",
      "Skeptical of delay tactics — expects prompt case progression",
    ],
    proceduralNotes: [
      "ECF filing; no paper copies needed",
      "Telephonic conferences available upon request",
      "All depositions must be noticed 14 days in advance",
    ],
  },
];

const statusColor = (s: string) => s === "filed" ? "#22c55e" : s === "review" ? PRISM_GOLD : s === "drafting" ? PRISM_BLUE : "#ef4444";
const priorityColor = (p: string) => p === "critical" ? "#ef4444" : p === "high" ? "#f59e0b" : PRISM_BLUE;

export default function CourtFilingPage() {
  const [selected, setSelected] = useState(DOCKETS[0]);

  const totalDeadlines = DOCKETS.reduce((s, d) => s + d.deadlines.length, 0);
  const urgentDeadlines = DOCKETS.reduce((s, d) => s + d.deadlines.filter(dl => dl.daysRemaining <= 7).length, 0);

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white tracking-tight">Court Filing & Docket Intelligence</h1>
          <p className="text-[11px] text-white/30 mt-1">Automated filing preparation, deadline management, and judicial preference analysis</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Dockets", value: DOCKETS.length.toString(), icon: Gavel, color: PRISM_GOLD },
            { label: "Pending Filings", value: DOCKETS.reduce((s, d) => s + d.filings.filter(f => f.status !== "filed").length, 0).toString(), icon: FileText, color: PRISM_BLUE },
            { label: "Upcoming Deadlines", value: totalDeadlines.toString(), icon: Calendar, color: "white" },
            { label: "Urgent (≤7 days)", value: urgentDeadlines.toString(), icon: AlertTriangle, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                <span className="text-[9px] uppercase tracking-wider text-white/25">{s.label}</span>
              </div>
              <p className="text-2xl font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          {DOCKETS.map(d => (
            <button key={d.id} onClick={() => setSelected(d)} aria-label={`Select docket ${d.matter}`}
              className={`flex-1 text-left rounded-xl border p-4 transition ${selected.id === d.id ? "border-white/[0.12] bg-white/[0.04]" : "border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03]"}`}>
              <span className="text-[9px] font-mono text-white/20">{d.caseNumber}</span>
              <p className="text-sm font-medium text-white mt-0.5">{d.matter}</p>
              <p className="text-[10px] text-white/30">{d.court}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Filing Status</h3>
              <div className="space-y-2">
                {selected.filings.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
                    <div className="h-4 w-4 rounded flex items-center justify-center" style={{ background: statusColor(f.status) + "20" }}>
                      {f.status === "filed" ? <CheckCircle className="h-3 w-3" style={{ color: "#22c55e" }} /> :
                       f.status === "review" ? <Eye className="h-3 w-3" style={{ color: PRISM_GOLD }} /> :
                       <FileText className="h-3 w-3" style={{ color: PRISM_BLUE }} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-medium text-white">{f.title}</p>
                      <p className="text-[9px] text-white/25">{f.status === "filed" ? `Filed ${f.filedDate}` : `Due ${f.dueDate}`}</p>
                    </div>
                    <span className="text-[9px] font-semibold rounded-full px-2 py-0.5" style={{ background: statusColor(f.status) + "15", color: statusColor(f.status) }}>
                      {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Deadline Calendar</h3>
              <div className="space-y-2">
                {selected.deadlines.map((dl, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
                    <div className="w-12 text-center">
                      <p className="text-lg font-bold" style={{ color: priorityColor(dl.priority) }}>{dl.daysRemaining}</p>
                      <p className="text-[8px] uppercase text-white/20">days</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-medium text-white">{dl.description}</p>
                      <p className="text-[9px] text-white/25">{dl.date}</p>
                    </div>
                    <span className="text-[8px] uppercase font-bold tracking-wider rounded px-1.5 py-0.5" style={{ background: priorityColor(dl.priority) + "15", color: priorityColor(dl.priority) }}>
                      {dl.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Gavel className="h-3.5 w-3.5" style={{ color: PRISM_GOLD }} />
                <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Judicial Preferences</h3>
              </div>
              <p className="text-[11px] font-medium text-white mb-3">{selected.judge}</p>
              <div className="space-y-1.5">
                {selected.judicialPreferences.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-white/[0.015] border border-white/[0.04] px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: PRISM_GOLD }} />
                    <span className="text-[9px] text-white/40 leading-relaxed">{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Procedural Requirements</h3>
              <div className="space-y-1.5">
                {selected.proceduralNotes.map((n, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-white/[0.015] border border-white/[0.04] px-3 py-2">
                    <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: PRISM_BLUE }} />
                    <span className="text-[9px] text-white/40 leading-relaxed">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
