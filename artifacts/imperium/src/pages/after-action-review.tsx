import React, { useState } from "react";
import { BookOpen, CheckCircle, AlertTriangle, Clock, Shield, Cpu, MessageSquare, Activity, ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import { AAR_RECORDS, type AARRecord, type AAREvent } from "@/lib/strategic-data";
import { cn } from "@/lib/utils";

const DOMAIN_CONFIG = {
  SECURITY: { color: "#ef4444" },
  OPERATIONAL: { color: "#fb923c" },
  MARKET: { color: "#60a5fa" },
  LEGAL: { color: "#a78bfa" },
};

const OUTCOME_CONFIG = {
  SUCCESS: { color: "#4ade80", label: "SUCCESS" },
  PARTIAL: { color: "#fb923c", label: "PARTIAL" },
  FAILURE: { color: "#ef4444", label: "FAILURE" },
};

const EVENT_CONFIG = {
  DECISION: { color: "#c9a227", icon: TrendingUp },
  ACTION: { color: "#60a5fa", icon: Activity },
  INCIDENT: { color: "#ef4444", icon: AlertTriangle },
  ESCALATION: { color: "#fb923c", icon: AlertTriangle },
  RESOLUTION: { color: "#4ade80", icon: CheckCircle },
};

const CATEGORY_ICONS = {
  PROCESS: Activity,
  TECHNOLOGY: Cpu,
  COMMUNICATION: MessageSquare,
  SECURITY: Shield,
  RESOURCE: Clock,
};

const PRIORITY_COLORS = {
  CRITICAL: "#ef4444",
  HIGH: "#fb923c",
  MEDIUM: "#facc15",
  LOW: "#4ade80",
};

function TimelineEvent({ event }: { event: AAREvent }) {
  const cfg = EVENT_CONFIG[event.type];
  const Icon = cfg.icon;
  const timeStr = event.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = event.timestamp.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="flex gap-3 pb-4 relative">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10"
          style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}50` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 w-px mt-1" style={{ backgroundColor: "rgba(255,255,255,0.05)", minHeight: "16px" }} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-[10px] text-slate-500">{dateStr} {timeStr}</span>
          <span className="px-1.5 py-0.5 rounded font-mono text-[8px] tracking-widest border"
            style={{ color: cfg.color, borderColor: `${cfg.color}30`, background: `${cfg.color}10` }}>
            {event.type}
          </span>
        </div>
        <div className="text-xs text-slate-300 font-semibold mb-0.5">{event.actor}</div>
        <div className="text-[11px] text-slate-400">{event.action}</div>
        <div className="text-[10px] text-slate-600 mt-0.5 italic">{event.outcome}</div>
      </div>
    </div>
  );
}

function AARCard({ record }: { record: AARRecord }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "lessons" | "improvements">("timeline");
  const domainCfg = DOMAIN_CONFIG[record.domain];
  const outcomeCfg = OUTCOME_CONFIG[record.outcome];
  const implementedLessons = record.lessonsLearned.filter((l) => l.implemented).length;
  const completedImprovements = record.improvementTracking.filter((i) => i.complete).length;

  return (
    <div className="imperial-card rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left hover:bg-white/2 transition-all">
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
            style={{ backgroundColor: outcomeCfg.color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-display text-sm tracking-[0.08em] font-bold text-slate-200">{record.operationName}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border"
                  style={{ color: domainCfg.color, borderColor: `${domainCfg.color}30`, background: `${domainCfg.color}10` }}>
                  {record.domain}
                </span>
                <span className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border"
                  style={{ color: outcomeCfg.color, borderColor: `${outcomeCfg.color}30`, background: `${outcomeCfg.color}10` }}>
                  {outcomeCfg.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500">
              <span>{record.dateOccurred.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span>Duration: {record.duration}</span>
              <span>Commander: {record.commander}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px]">
              <span className="text-slate-500">{record.lessonsLearned.length} lessons · {implementedLessons} implemented</span>
              <span className="text-slate-500">{completedImprovements}/{record.improvementTracking.length} improvements complete</span>
            </div>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5">
          <div className="px-4 pt-3 pb-2">
            <p className="text-xs text-slate-400 leading-relaxed italic">{record.executiveSummary}</p>
          </div>

          <div className="flex border-b border-white/5">
            {(["timeline", "lessons", "improvements"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("px-4 py-2 font-mono text-[10px] tracking-widest transition-all border-b-2",
                  activeTab === tab ? "border-gold text-gold" : "border-transparent text-slate-500 hover:text-slate-400")}>
                {tab === "timeline" ? "TIMELINE" : tab === "lessons" ? "LESSONS LEARNED" : "IMPROVEMENTS"}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === "timeline" && (
              <div>
                {record.timeline.map((event, i) => (
                  <TimelineEvent key={i} event={event} />
                ))}
              </div>
            )}

            {activeTab === "lessons" && (
              <div className="space-y-3">
                {record.lessonsLearned.map((lesson) => {
                  const Icon = CATEGORY_ICONS[lesson.category];
                  const priorityColor = PRIORITY_COLORS[lesson.priority];
                  return (
                    <div key={lesson.id} className="rounded-lg p-3 border border-white/8 bg-white/2">
                      <div className="flex items-start gap-2 mb-2">
                        <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: priorityColor }} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-1.5 py-0.5 rounded font-mono text-[8px] tracking-widest border"
                              style={{ color: priorityColor, borderColor: `${priorityColor}30`, background: `${priorityColor}10` }}>
                              {lesson.priority}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{lesson.category}</span>
                            {lesson.implemented && (
                              <span className="flex items-center gap-1 text-[9px] text-green-400">
                                <CheckCircle className="w-3 h-3" /> IMPLEMENTED
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300 font-semibold mb-1">{lesson.finding}</div>
                          <div className="text-[11px] text-slate-400">
                            <span className="text-slate-500 font-mono">REC: </span>{lesson.recommendation}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "improvements" && (
              <div className="space-y-2">
                {record.improvementTracking.map((item, i) => {
                  const daysLeft = Math.ceil((item.dueDate.getTime() - Date.now()) / 86400000);
                  return (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                      <div className={cn("w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                        item.complete ? "bg-green-400/20 border border-green-400/40" : "bg-white/5 border border-white/15")}>
                        {item.complete && <CheckCircle className="w-3 h-3 text-green-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-300">{item.item}</div>
                        <div className="text-[10px] text-slate-500">{item.owner}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {item.complete ? (
                          <span className="text-[10px] text-green-400 font-mono">DONE</span>
                        ) : (
                          <span className="text-[10px] font-mono" style={{ color: daysLeft < 14 ? "#fb923c" : "#94a3b8" }}>
                            {daysLeft > 0 ? `${daysLeft}d left` : "OVERDUE"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AfterActionReview() {
  const totalLessons = AAR_RECORDS.flatMap((r) => r.lessonsLearned).length;
  const implementedLessons = AAR_RECORDS.flatMap((r) => r.lessonsLearned).filter((l) => l.implemented).length;
  const improvements = AAR_RECORDS.flatMap((r) => r.improvementTracking);
  const completedImprovements = improvements.filter((i) => i.complete).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="w-5 h-5" style={{ color: "#c9a227" }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            After-Action Review System
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Structured post-operation analysis — timeline reconstruction · decision audit trail · lessons learned · improvement tracking
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Operations Reviewed", value: AAR_RECORDS.length, color: "#c9a227", icon: BookOpen },
          { label: "Lessons Captured", value: totalLessons, color: "#60a5fa", icon: Activity },
          { label: "Lessons Implemented", value: `${implementedLessons}/${totalLessons}`, color: implementedLessons === totalLessons ? "#4ade80" : "#fb923c", icon: CheckCircle },
          { label: "Improvements Done", value: `${completedImprovements}/${improvements.length}`, color: completedImprovements === improvements.length ? "#4ade80" : "#fb923c", icon: TrendingUp },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="imperial-card rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <div className="font-mono text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {AAR_RECORDS.map((record) => (
          <AARCard key={record.id} record={record} />
        ))}
      </div>
    </div>
  );
}
