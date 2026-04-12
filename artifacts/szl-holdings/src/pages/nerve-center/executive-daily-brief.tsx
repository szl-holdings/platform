import { useState } from "react";
import { FileText, RefreshCw, ChevronDown, ChevronUp, Zap, AlertTriangle, TrendingUp, CheckCircle, Clock } from "lucide-react";

const DEMO_BRIEF = {
  date: "April 12, 2026",
  generatedAt: "06:00 UTC",
  headline: "Active situation across Vessels + Legal + Maritime Real Estate requires your decision today.",
  sections: [
    {
      id: "overnight",
      icon: "overnight",
      title: "What Changed Overnight",
      items: [
        { type: "critical", text: "Rotterdam port authority declared force majeure — 23 vessels affected, including MV Athena. Demurrage starts at 18:00 UTC." },
        { type: "high", text: "OFAC updated SDN list — 3 new vessel operator matches detected. Legal screening in progress for 2 active charter parties." },
        { type: "medium", text: "Ashworth estate appraisal completed — $4.2M valuation confirmed. Sale timeline now dependent on cargo certificate clearance." },
        { type: "info", text: "Alloy processed 247 workflows overnight. 14 anomalies flagged — 12 resolved autonomously, 2 escalated." },
      ],
    },
    {
      id: "decisions",
      icon: "decisions",
      title: "Needs Your Brain Today",
      items: [
        { type: "critical", text: "Port Authorization PR-2847: Approve to release MV Athena cargo. Each hour of delay costs $4,200. Decision window closes at 16:00 UTC." },
        { type: "high", text: "Vessel MV-332 sanctions flag: Proceed with charter party or initiate substitution clause? Legal recommends 4-hour review window." },
        { type: "medium", text: "Q2 fleet maintenance budget: $840K proposal for MV Atlantic refit. Standard cycle — recommend approval." },
      ],
    },
    {
      id: "developing",
      icon: "developing",
      title: "Developing Situations",
      items: [
        { type: "watch", text: "Cape Town Port Authority signals capacity constraints next week. 4 scheduled vessel calls may need rerouting via Durban." },
        { type: "watch", text: "EU shipping emissions regulation update expected Friday. PRISM compliance dashboard tracking 7 active charter obligations." },
        { type: "info", text: "Terra market: Amsterdam office vacancy rate improved 2.3% this week. Terra signaling potential acquisition opportunity — preliminary data available." },
      ],
    },
    {
      id: "autonomous",
      icon: "autonomous",
      title: "AI Acted Autonomously",
      items: [
        { type: "done", text: "Approved 3 routine invoice payments totaling $127,400 — within budget authority, no anomalies detected." },
        { type: "done", text: "Escalated 2 high-risk vendor requests to compliance team per Policy DG-2024-07." },
        { type: "done", text: "Updated 14 vessel tracking records and reconciled AIS discrepancies for MV Cape Town route." },
        { type: "done", text: "Generated and distributed Q1 fleet performance digest to 8 stakeholders at 06:00 UTC." },
      ],
    },
  ],
};

const ITEM_TYPE_CONFIG: Record<string, { color: string; icon: React.ReactNode; prefix: string }> = {
  critical: { color: "#ef4444", icon: <AlertTriangle className="w-3 h-3 shrink-0" />, prefix: "CRITICAL" },
  high: { color: "#f59e0b", icon: <AlertTriangle className="w-3 h-3 shrink-0" />, prefix: "HIGH" },
  medium: { color: "#3b82f6", icon: <Clock className="w-3 h-3 shrink-0" />, prefix: "MEDIUM" },
  watch: { color: "#a78bfa", icon: <TrendingUp className="w-3 h-3 shrink-0" />, prefix: "WATCH" },
  info: { color: "rgba(255,255,255,0.4)", icon: <FileText className="w-3 h-3 shrink-0" />, prefix: "INFO" },
  done: { color: "#10b981", icon: <CheckCircle className="w-3 h-3 shrink-0" />, prefix: "DONE" },
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  overnight: <Clock className="w-3.5 h-3.5" />,
  decisions: <Zap className="w-3.5 h-3.5" />,
  developing: <TrendingUp className="w-3.5 h-3.5" />,
  autonomous: <CheckCircle className="w-3.5 h-3.5" />,
};

function BriefSection({ section }: { section: typeof DEMO_BRIEF.sections[0] }) {
  const [open, setOpen] = useState(section.id === "decisions" || section.id === "overnight");
  const criticalCount = section.items.filter(i => i.type === "critical").length;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(10,14,24,0.8)" }}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/2 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: "#4B8BDB" }}>{SECTION_ICONS[section.icon]}</span>
        <span className="flex-1 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{section.title}</span>
        {criticalCount > 0 && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
            {criticalCount} critical
          </span>
        )}
        {open ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />}
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {section.items.map((item, i) => {
            const cfg = ITEM_TYPE_CONFIG[item.type] ?? ITEM_TYPE_CONFIG.info!;
            return (
              <div key={i} className="flex items-start gap-2.5 mt-2">
                <span style={{ color: cfg.color, marginTop: "1px" }}>{cfg.icon}</span>
                <div className="flex-1">
                  <span className="text-[8px] font-bold uppercase tracking-widest mr-2" style={{ color: cfg.color }}>{cfg.prefix}</span>
                  <span className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{item.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ExecutiveDailyBriefProps {
  collapsed?: boolean;
}

export function ExecutiveDailyBrief({ collapsed }: ExecutiveDailyBriefProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [expanded, setExpanded] = useState(!collapsed);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => setIsRegenerating(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <FileText className="w-3.5 h-3.5" style={{ color: "#4B8BDB" }} />
            <h3 className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>Executive Daily Brief</h3>
            <span className="text-[8px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(75,139,219,0.1)", color: "#4B8BDB", border: "1px solid rgba(75,139,219,0.2)" }}>EDB</span>
          </div>
          <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{DEMO_BRIEF.date} · Generated {DEMO_BRIEF.generatedAt}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1 text-[9px] px-2 py-1 rounded border transition-colors hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Generating..." : "Regenerate"}
          </button>
          <button onClick={() => setExpanded(e => !e)} className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <div className="rounded-xl p-3 border" style={{ background: "rgba(75,139,219,0.04)", borderColor: "rgba(75,139,219,0.12)" }}>
            <div className="text-[8px] uppercase tracking-widest mb-1" style={{ color: "rgba(75,139,219,0.5)" }}>Today's Headline</div>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{DEMO_BRIEF.headline}</p>
          </div>

          <div className="space-y-2">
            {DEMO_BRIEF.sections.map(section => (
              <BriefSection key={section.id} section={section} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
