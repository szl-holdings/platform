import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Calendar, ArrowLeft, ChevronRight, Users, FileText, CheckCircle2,
  Clock, AlertCircle, Plus, X, Download, BookOpen, Target,
  MessageSquare, Archive, Send, ChevronDown, Edit3,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

type MeetingStatus = "upcoming" | "in_progress" | "completed" | "cancelled";
type ActionStatus = "open" | "in_progress" | "completed" | "overdue";

type ActionItem = {
  id: string;
  description: string;
  owner: string;
  dueDate: string;
  status: ActionStatus;
  meetingId: string;
  company: string;
};

type BoardMeeting = {
  id: string;
  company: string;
  companyColor: string;
  type: "board" | "observer" | "committee" | "annual";
  date: string;
  time: string;
  location: string;
  status: MeetingStatus;
  attendees: string[];
  agenda: string[];
  materials: { name: string; status: "ready" | "pending" | "missing" }[];
  resolutions: { id: string; title: string; status: "adopted" | "tabled" | "rejected" }[];
  notes?: string;
  recordingAvailable: boolean;
};

const MEETINGS: BoardMeeting[] = [
  {
    id: "m1", company: "Vessels", companyColor: "#4a90b8", type: "board",
    date: "Apr 22, 2026", time: "10:00 AM EST", location: "Video — Zoom",
    status: "upcoming", recordingAvailable: false,
    attendees: ["S. Lutar (Observer)", "J. Moreira (CEO)", "K. Singh (CFO)", "A. Peters (Lead Investor)", "M. Chen (Independent)"],
    agenda: [
      "Q1 2026 Financial Review & KPIs",
      "Fleet expansion — Series A use of proceeds update",
      "Key hires: CTO & VP Sales pipeline",
      "Strategic partnership update — Port of Rotterdam",
      "2026 annual operating plan revision",
      "Next financing — bridge timeline review",
    ],
    materials: [
      { name: "Q1 2026 Board Package — Financials.pdf", status: "ready" },
      { name: "KPI Dashboard — Apr 2026.xlsx", status: "ready" },
      { name: "Strategic Update Deck.pptx", status: "pending" },
      { name: "Draft Budget Revision FY2026.xlsx", status: "missing" },
    ],
    resolutions: [],
    notes: "",
  },
  {
    id: "m2", company: "Aegis", companyColor: "#c45a4a", type: "board",
    date: "Apr 18, 2026", time: "2:00 PM EST", location: "Video — Zoom",
    status: "completed", recordingAvailable: true,
    attendees: ["S. Lutar (Observer)", "D. Ramirez (CEO)", "L. Park (CTO)", "R. Okonkwo (Lead Investor)", "T. Harrington (Independent)"],
    agenda: [
      "Q1 2026 Financial Review",
      "Government contract pipeline — DoD certification update",
      "Security operations expansion — new SOC facility",
      "Key hire: CISO",
      "Board resolution: Series A extension approval",
    ],
    materials: [
      { name: "Q1 2026 Board Package.pdf", status: "ready" },
      { name: "DoD Certification Status Update.pdf", status: "ready" },
      { name: "CISO Candidate Brief.pdf", status: "ready" },
      { name: "Series A Extension Term Sheet.pdf", status: "ready" },
    ],
    resolutions: [
      { id: "r1", title: "Approve Series A extension — $2M bridge at same valuation", status: "adopted" },
      { id: "r2", title: "Authorize CISO hire at executive compensation band", status: "adopted" },
      { id: "r3", title: "Approve new SOC facility lease — Austin, TX", status: "tabled" },
    ],
    notes: "Strong Q1. Bridge approved unanimously. SOC facility tabled pending additional vendor bids.",
  },
  {
    id: "m3", company: "Terra", companyColor: "#c8953c", type: "board",
    date: "Apr 15, 2026", time: "11:00 AM EST", location: "In-Person — SZL HQ",
    status: "completed", recordingAvailable: false,
    attendees: ["S. Lutar (Board Observer)", "P. Nguyen (CEO)", "Y. Adeyemi (CFO)", "C. Markus (Lead Investor)"],
    agenda: [
      "Q1 2026 Financials — revenue recognition review",
      "AVM model accuracy benchmarking",
      "Enterprise sales — 3 LOIs under negotiation",
      "Fund II follow-on consideration",
    ],
    materials: [
      { name: "Q1 2026 Board Package.pdf", status: "ready" },
      { name: "AVM Accuracy Report — Q1.pdf", status: "ready" },
      { name: "Enterprise Pipeline Update.pptx", status: "ready" },
    ],
    resolutions: [
      { id: "r4", title: "Approve Q1 2026 financial statements for LP reporting", status: "adopted" },
      { id: "r5", title: "Authorize enterprise deal — ELC Realty Group ($180K ARR)", status: "adopted" },
    ],
    notes: "Strong revenue recognition quarter. Enterprise deals closing Q2. Follow-on deferred to next meeting.",
  },
  {
    id: "m4", company: "Lyte", companyColor: "#6aaa72", type: "committee",
    date: "May 5, 2026", time: "9:00 AM EST", location: "Video — Google Meet",
    status: "upcoming", recordingAvailable: false,
    attendees: ["S. Lutar (Observer)", "A. Osei (CEO)", "B. Kowalski (CTO)"],
    agenda: [
      "Q1 2026 Product & Engineering Review",
      "Audience genome model — v3 rollout timeline",
      "Infrastructure cost optimization",
      "Content creator partnership expansion",
    ],
    materials: [
      { name: "Q1 Product Review Deck.pptx", status: "pending" },
      { name: "Infra Cost Analysis.xlsx", status: "pending" },
    ],
    resolutions: [],
    notes: "",
  },
];

const ACTION_ITEMS: ActionItem[] = [
  { id: "a1", description: "Draft Series A extension docs — fully executed copies to SZL by Apr 25", owner: "Aegis Legal", dueDate: "Apr 25, 2026", status: "in_progress", meetingId: "m2", company: "Aegis" },
  { id: "a2", description: "Send CISO offer letter pending board authorization", owner: "Aegis HR", dueDate: "Apr 22, 2026", status: "open", meetingId: "m2", company: "Aegis" },
  { id: "a3", description: "Provide 3 additional SOC facility vendor bids for next meeting", owner: "Aegis COO", dueDate: "May 15, 2026", status: "open", meetingId: "m2", company: "Aegis" },
  { id: "a4", description: "Finalize ELC Realty enterprise contract — legal review complete", owner: "Terra Legal", dueDate: "Apr 30, 2026", status: "in_progress", meetingId: "m3", company: "Terra" },
  { id: "a5", description: "Prepare Draft Budget Revision FY2026 for Vessels board package", owner: "Vessels CFO", dueDate: "Apr 20, 2026", status: "overdue", meetingId: "m1", company: "Vessels" },
  { id: "a6", description: "Submit Q1 financial statements to SZL for LP reporting consolidation", owner: "Terra CFO", dueDate: "Apr 18, 2026", status: "completed", meetingId: "m3", company: "Terra" },
  { id: "a7", description: "Share Port of Rotterdam LOI draft for SZL review", owner: "Vessels CEO", dueDate: "Apr 28, 2026", status: "open", meetingId: "m1", company: "Vessels" },
];

const RESOLUTIONS_ARCHIVE = [
  { id: "res-001", company: "Aegis", date: "Apr 18, 2026", title: "Approve Series A extension — $2M bridge at same valuation", status: "adopted" },
  { id: "res-002", company: "Aegis", date: "Apr 18, 2026", title: "Authorize CISO hire at executive compensation band", status: "adopted" },
  { id: "res-003", company: "Terra", date: "Apr 15, 2026", title: "Approve Q1 2026 financial statements for LP reporting", status: "adopted" },
  { id: "res-004", company: "Terra", date: "Apr 15, 2026", title: "Authorize enterprise deal — ELC Realty Group ($180K ARR)", status: "adopted" },
  { id: "res-005", company: "Vessels", date: "Feb 10, 2026", title: "Approve bridge financing — $1.5M convertible note", status: "adopted" },
  { id: "res-006", company: "Lyte", date: "Jan 20, 2026", title: "Approve equity option grant pool expansion to 12%", status: "adopted" },
];

const STATUS_STYLES: Record<MeetingStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: "Upcoming", color: "#d4a054", bg: "#d4a054" },
  in_progress: { label: "In Progress", color: "#6aaa72", bg: "#6aaa72" },
  completed: { label: "Completed", color: "#4a90b8", bg: "#4a90b8" },
  cancelled: { label: "Cancelled", color: "#c45a4a", bg: "#c45a4a" },
};

const ACTION_STYLES: Record<ActionStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "#d4a054" },
  in_progress: { label: "In Progress", color: "#4a90b8" },
  completed: { label: "Completed", color: "#6aaa72" },
  overdue: { label: "Overdue", color: "#c45a4a" },
};

export default function BoardMeetingsPage() {
  const __pageMeta = usePageMeta({
    title: "Board Meeting Manager — SZL Holdings Fund",
    description: "Schedule board meetings, distribute materials, track action items, and maintain a board resolution archive.",
    canonical: "https://szlholdings.com/fund/board-meetings",
  });

  const [tab, setTab] = useState<"meetings" | "actions" | "archive">("meetings");
  const [selectedMeeting, setSelectedMeeting] = useState<BoardMeeting | null>(null);
  const [actionFilter, setActionFilter] = useState<ActionStatus | "all">("all");

  const openActions = ACTION_ITEMS.filter(a => a.status === "open" || a.status === "overdue").length;
  const overdueActions = ACTION_ITEMS.filter(a => a.status === "overdue").length;
  const upcomingMeetings = MEETINGS.filter(m => m.status === "upcoming").length;
  const completedMeetings = MEETINGS.filter(m => m.status === "completed").length;

  const filteredActions = ACTION_ITEMS.filter(a => actionFilter === "all" || a.status === actionFilter);

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#080b10] text-white">
        <SiteNav />
        <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
  
            <div className="flex items-center gap-3 mb-6">
              <Link href="/fund">
                <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence
                </button>
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-white/20" />
              <span className="text-xs text-white/60">Board Meeting Manager</span>
            </div>
  
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8b7ac8]/15">
                    <Calendar className="h-3.5 w-3.5 text-[#8b7ac8]" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b7ac8]">Governance Command</span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Board Meeting Manager</h1>
                <p className="text-white/50 text-sm max-w-xl">
                  Schedule meetings, generate and distribute board materials, track action items, and maintain a resolution archive.
                </p>
              </div>
              <button className="flex items-center gap-2 rounded-xl bg-[#8b7ac8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#8b7ac8]/90 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Schedule Meeting
              </button>
            </div>
  
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "Upcoming Meetings", value: String(upcomingMeetings), icon: Calendar, color: "#d4a054", sub: "Next 30 days" },
                { label: "Completed (YTD)", value: String(completedMeetings), icon: CheckCircle2, color: "#6aaa72", sub: "This year" },
                { label: "Open Actions", value: String(openActions), icon: Target, color: "#4a90b8", sub: `${overdueActions} overdue` },
                { label: "Resolutions Filed", value: String(RESOLUTIONS_ARCHIVE.length), icon: Archive, color: "#8b7ac8", sub: "All time" },
              ].map(item => (
                <div key={item.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20" style={{ color: item.color }}>
                      <item.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-white">{item.value}</div>
                  <div className="text-xs text-white/40 mt-1">{item.label}</div>
                  {overdueActions > 0 && item.label === "Open Actions" ? (
                    <div className="text-[10px] text-[#c45a4a] mt-0.5">{item.sub}</div>
                  ) : (
                    <div className="text-[10px] text-white/25 mt-0.5">{item.sub}</div>
                  )}
                </div>
              ))}
            </div>
  
            <div className="flex gap-1 mb-6">
              {(["meetings", "actions", "archive"] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setSelectedMeeting(null); }}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize transition ${tab === t ? "bg-white/[0.08] text-white" : "text-white/35 hover:text-white/60"}`}>
                  {t === "meetings" ? "Board Meetings" : t === "actions" ? "Action Items" : "Resolution Archive"}
                </button>
              ))}
            </div>
  
            <AnimatePresence mode="wait">
              {tab === "meetings" && !selectedMeeting && (
                <m.div key="meetings-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {MEETINGS.map((meeting, i) => {
                    const s = STATUS_STYLES[meeting.status];
                    const materialReady = meeting.materials.filter(m => m.status === "ready").length;
                    const materialTotal = meeting.materials.length;
                    return (
                      <m.div key={meeting.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <button onClick={() => setSelectedMeeting(meeting)} className="w-full text-left">
                          <div className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20 flex-shrink-0" style={{ color: meeting.companyColor }}>
                              <Calendar className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-white">{meeting.company} — {meeting.type === "board" ? "Board Meeting" : meeting.type === "committee" ? "Committee Meeting" : meeting.type === "annual" ? "Annual Meeting" : "Observer Call"}</span>
                                <span className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                                  style={{ color: s.color, borderColor: `${s.color}30`, background: `${s.color}12` }}>
                                  {s.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-white/40">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{meeting.date} · {meeting.time}</span>
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{meeting.attendees.length} attendees</span>
                                <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{materialReady}/{materialTotal} materials ready</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {meeting.resolutions.length > 0 && (
                                <span className="text-[10px] text-[#6aaa72] border border-[#6aaa72]/30 rounded-full px-2 py-0.5">{meeting.resolutions.length} resolutions</span>
                              )}
                              <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                            </div>
                          </div>
                        </button>
                      </m.div>
                    );
                  })}
                </m.div>
              )}
  
              {tab === "meetings" && selectedMeeting && (
                <m.div key="meeting-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <button onClick={() => setSelectedMeeting(null)} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 mb-5 transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Meetings
                  </button>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-5">
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h2 className="text-lg font-semibold text-white">{selectedMeeting.company} — {selectedMeeting.type === "board" ? "Board Meeting" : "Committee Meeting"}</h2>
                            <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                              <span>{selectedMeeting.date} · {selectedMeeting.time}</span>
                              <span>{selectedMeeting.location}</span>
                            </div>
                          </div>
                          <span className="rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]"
                            style={{ color: STATUS_STYLES[selectedMeeting.status].color, borderColor: `${STATUS_STYLES[selectedMeeting.status].color}30`, background: `${STATUS_STYLES[selectedMeeting.status].color}12` }}>
                            {STATUS_STYLES[selectedMeeting.status].label}
                          </span>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 mb-2">Agenda</div>
                          <div className="space-y-1.5">
                            {selectedMeeting.agenda.map((item, i) => (
                              <div key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                                <span className="text-[10px] font-semibold text-white/25 mt-1 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                        {selectedMeeting.notes && (
                          <div className="mt-5 pt-4 border-t border-white/[0.06]">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 mb-2">Meeting Notes</div>
                            <p className="text-sm text-white/60">{selectedMeeting.notes}</p>
                          </div>
                        )}
                      </div>
  
                      {selectedMeeting.resolutions.length > 0 && (
                        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="h-4 w-4 text-[#6aaa72]" />
                            <span className="text-sm font-semibold text-white">Resolutions</span>
                          </div>
                          <div className="space-y-2">
                            {selectedMeeting.resolutions.map(r => (
                              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                                <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${r.status === "adopted" ? "text-[#6aaa72]" : r.status === "tabled" ? "text-[#d4a054]" : "text-[#c45a4a]"}`} />
                                <span className="text-sm text-white flex-1">{r.title}</span>
                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${r.status === "adopted" ? "text-[#6aaa72]" : r.status === "tabled" ? "text-[#d4a054]" : "text-[#c45a4a]"}`}>
                                  {r.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
  
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 mb-3">Attendees</div>
                        <div className="space-y-2">
                          {selectedMeeting.attendees.map((a, i) => (
                            <div key={i} className="text-xs text-white/60">{a}</div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Board Materials</div>
                          <button className="text-[10px] text-[#d4a054] hover:text-[#d4a054]/80 font-semibold">Send All</button>
                        </div>
                        <div className="space-y-2">
                          {selectedMeeting.materials.map((mat, i) => (
                            <div key={i} className="flex items-center gap-2">
                              {mat.status === "ready" ? <CheckCircle2 className="h-3.5 w-3.5 text-[#6aaa72] flex-shrink-0" />
                                : mat.status === "pending" ? <Clock className="h-3.5 w-3.5 text-[#d4a054] flex-shrink-0" />
                                : <AlertCircle className="h-3.5 w-3.5 text-[#c45a4a] flex-shrink-0" />}
                              <span className="text-xs text-white/60 flex-1 truncate">{mat.name}</span>
                            </div>
                          ))}
                        </div>
                        {selectedMeeting.status === "completed" && selectedMeeting.recordingAvailable && (
                          <div className="mt-3 pt-3 border-t border-white/[0.06]">
                            <button className="flex items-center gap-1.5 text-xs text-[#4a90b8] hover:text-[#4a90b8]/80">
                              <Download className="h-3.5 w-3.5" /> Download Recording
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </m.div>
              )}
  
              {tab === "actions" && (
                <m.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center gap-2 mb-5">
                    {(["all", "open", "in_progress", "overdue", "completed"] as const).map(s => (
                      <button key={s} onClick={() => setActionFilter(s)}
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${actionFilter === s ? "bg-[#8b7ac8] text-white" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>
                        {s === "all" ? "All" : s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
                    <div className="divide-y divide-white/[0.04]">
                      {filteredActions.map((action, i) => {
                        const as = ACTION_STYLES[action.status];
                        return (
                          <m.div key={action.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white mb-1">{action.description}</div>
                              <div className="flex items-center gap-3 text-[11px] text-white/40">
                                <span>{action.company}</span>
                                <span>Owner: {action.owner}</span>
                                <span>Due: {action.dueDate}</span>
                              </div>
                            </div>
                            <span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] flex-shrink-0"
                              style={{ color: as.color, borderColor: `${as.color}30`, background: `${as.color}12` }}>
                              {as.label}
                            </span>
                          </m.div>
                        );
                      })}
                    </div>
                  </div>
                </m.div>
              )}
  
              {tab === "archive" && (
                <m.div key="archive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                      <Archive className="h-4 w-4 text-[#8b7ac8]" />
                      <span className="text-sm font-semibold text-white">Board Resolution Archive</span>
                      <span className="ml-auto text-[10px] text-white/30">{RESOLUTIONS_ARCHIVE.length} resolutions</span>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      {RESOLUTIONS_ARCHIVE.map((res) => (
                        <div key={res.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                          <CheckCircle2 className="h-4 w-4 text-[#6aaa72] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white">{res.title}</div>
                            <div className="flex items-center gap-3 text-[11px] text-white/40 mt-0.5">
                              <span>{res.company}</span>
                              <span>{res.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-semibold uppercase text-[#6aaa72]">{res.status}</span>
                            <button className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                              <Download className="h-3.5 w-3.5 text-white/40" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
  
          </m.div>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
