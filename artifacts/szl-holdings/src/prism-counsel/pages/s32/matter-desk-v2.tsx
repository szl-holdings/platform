import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft, Activity, FileText, Clock, DollarSign, TrendingUp,
  Eye, CheckSquare, Scale, AlertTriangle, Shield, MessageSquare,
  ChevronRight, CheckCircle, Building2, Globe, Download, Brain,
  HelpCircle, Zap, Users
} from "lucide-react";
import { DEMO_MATTERS, PILLAR_LABELS } from "../../data/demo-matters";
import { useMatterDesk, usePilotForecasts } from "../../hooks/use-prism-pilot";

const TABS = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "what-changed", label: "What Changed", icon: Activity },
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "evidence", label: "Evidence", icon: FileText },
  { key: "deadlines", label: "Deadlines", icon: Clock },
  { key: "money", label: "Money", icon: DollarSign },
  { key: "pressure", label: "Pressure", icon: TrendingUp },
  { key: "forecast", label: "Forecast", icon: TrendingUp },
  { key: "review", label: "Review", icon: Eye },
  { key: "signoff", label: "Sign-Off", icon: CheckSquare },
  { key: "audit", label: "Audit", icon: Shield },
];

const DEMO_DESK_DATA = {
  matter: { id: 1, title: "Rodriguez v. National General Insurance", caseNumber: "2025-CV-04821", status: "discovery", jurisdiction: "Miami-Dade County, FL", healthScore: 72 },
  lastChanges: [
    { type: "carrier_communication", title: "Reserve increase received", summary: "National General raised reserves from $15K to $28K — signals carrier is reassessing exposure", severity: "info", createdAt: new Date(Date.now() - 3600000).toISOString() },
    { type: "new_record", title: "Medical evaluation arrived", summary: "Independent orthopedic evaluation from Dr. Whitmore — findings consistent with treating physician", severity: "info", createdAt: new Date(Date.now() - 7200000).toISOString() },
    { type: "pressure_shift", title: "Carrier pressure increased", summary: "Carrier response lag now exceeds 21 days — above firm threshold. Settlement pressure rising.", severity: "warning", createdAt: new Date(Date.now() - 10800000).toISOString() },
    { type: "forecast_update", title: "Settlement probability improved", summary: "Likelihood of settlement before trial increased following reserve increase", severity: "info", createdAt: new Date(Date.now() - 14400000).toISOString() },
  ],
  worldContext: [
    { source: "Court data", signal: "Miami-Dade courts running 3-month trial delay — settlement window favorable", type: "venue" },
    { source: "Insurer behavior", signal: "National General increased reserves on 3 similar matters this quarter", type: "insurer" },
  ],
  missingEvidence: [
    { item: "Lost wage verification", severity: "high", action: "Follow up with employer — Acme Corp HR" },
    { item: "Records from Dr. Perez (spine specialist)", severity: "high", action: "Resend records request via certified mail" },
    { item: "Property damage appraisal", severity: "medium", action: "Request from claims adjuster" },
  ],
  pressureDimensions: [
    { label: "Deadline pressure", score: 65, movement: "rising", driver: "Interrogatory deadline in 2 days" },
    { label: "Carrier pressure", score: 58, movement: "rising", driver: "Response lag exceeds 21 days" },
    { label: "Evidence pressure", score: 52, movement: "falling", driver: "IME received and processed" },
    { label: "Settlement pressure", score: 62, movement: "rising", driver: "Mediation in 19 days" },
    { label: "Coverage pressure", score: 35, movement: "stable", driver: "Policy limits confirmed" },
    { label: "Lien pressure", score: 28, movement: "stable", driver: "No active liens" },
  ],
  recommendedActions: [
    { title: "Finalize interrogatory responses", description: "2-day deadline. 80% complete. Review and submit for sign-off.", impact: 0.95, minutes: 20 },
    { title: "Update demand based on reserve increase", description: "Reserve increase signals softening. Revise demand strategy.", impact: 0.88, minutes: 15 },
    { title: "Start mediation memo", description: "Mediation in 19 days. No memo drafted. Begin now.", impact: 0.85, minutes: 30 },
    { title: "Re-issue records request — Dr. Perez", description: "21 days outstanding. Send certified follow-up.", impact: 0.72, minutes: 5 },
  ],
};

export default function MatterDeskV2() {
  const params = useParams<{ id: string }>();
  const matterId = params.id ? parseInt(params.id) : 1;
  const [activeTab, setActiveTab] = useState("overview");
  const [showExplainer, setShowExplainer] = useState(false);

  const { data } = useMatterDesk(matterId);
  const demoMatter = DEMO_MATTERS.find(m => m.id === matterId) || DEMO_MATTERS[0];
  const desk = data ?? DEMO_DESK_DATA;
  const m = desk.matter;
  const isDemo = !data;

  const healthColor = (m.healthScore ?? 0) >= 70 ? "#4a90b8" : (m.healthScore ?? 0) >= 50 ? "#d4a054" : "#c45a4a";

  return (
    <div className="flex flex-col h-full max-w-[1200px] mx-auto" style={{ maxHeight: "calc(100vh - 120px)" }}>
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Link href="/prism-counsel/matters">
          <button className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Matters
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-100 truncate">{m.title}</h1>
            <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">{m.caseNumber}</span>
            {isDemo && <span className="px-1.5 py-0.5 text-[9px] font-mono bg-[#d4a054]/10 text-[#d4a054] rounded flex-shrink-0">DEMO</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-500">{m.jurisdiction}</span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] text-slate-500 capitalize">{m.status.replace("_", " ")}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setShowExplainer(!showExplainer)} className="text-slate-600 hover:text-slate-400 transition-colors">
            <HelpCircle className="w-4 h-4" />
          </button>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: healthColor }}>{m.healthScore}</div>
            <div className="text-[9px] text-slate-500 uppercase">Health</div>
          </div>
          <Link href={`/prism-counsel/prep?matter=${matterId}`}>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#8b7ac8]/10 text-[#8b7ac8] hover:bg-[#8b7ac8]/20 transition-colors border border-[#8b7ac8]/20">
              <Brain className="w-3 h-3" /> Prep
            </button>
          </Link>
          <Link href="/prism-counsel/word-export">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] transition-colors">
              <Download className="w-3 h-3" /> Export
            </button>
          </Link>
        </div>
      </div>

      {showExplainer && (
        <div className="mb-3 rounded border border-[#4a90b8]/20 p-3 text-[11px] text-slate-400 flex items-start gap-2 flex-shrink-0" style={{ background: "#0c1a2e" }}>
          <HelpCircle className="w-3 h-3 text-[#4a90b8] mt-0.5 flex-shrink-0" />
          <span>This is your unified matter workspace. <strong className="text-slate-300">Overview</strong> shows status and top actions. <strong className="text-slate-300">What Changed</strong> tracks recent developments. <strong className="text-slate-300">Evidence</strong> shows what's verified and what's missing. <strong className="text-slate-300">Money</strong> covers settlement range, damages, and liens. <strong className="text-slate-300">Sign-Off</strong> is where you approve actions before they execute.</span>
          <button onClick={() => setShowExplainer(false)} className="text-[#4a90b8] hover:underline ml-auto flex-shrink-0">Got it</button>
        </div>
      )}

      <div className="flex items-center gap-0 border-b border-white/[0.06] mb-4 flex-shrink-0 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors flex-shrink-0 ${
                activeTab === tab.key
                  ? "border-[#d4a054] text-slate-200"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && <OverviewTab desk={desk} matter={demoMatter} />}
        {activeTab === "what-changed" && <WhatChangedTab desk={desk} />}
        {activeTab === "timeline" && <TimelineTab matter={demoMatter} />}
        {activeTab === "evidence" && <EvidenceTab desk={desk} matter={demoMatter} />}
        {activeTab === "deadlines" && <DeadlinesTab matter={demoMatter} />}
        {activeTab === "money" && <MoneyTab matter={demoMatter} />}
        {activeTab === "pressure" && <PressureTab desk={desk} />}
        {activeTab === "forecast" && <ForecastTab matter={demoMatter} />}
        {activeTab === "review" && <ReviewTab matterId={matterId} />}
        {activeTab === "signoff" && <SignOffTab matterId={matterId} />}
        {activeTab === "audit" && <AuditTab matter={demoMatter} />}
      </div>
    </div>
  );
}

function OverviewTab({ desk, matter }: { desk: any; matter: any }) {
  const healthColor = (desk.matter.healthScore ?? 0) >= 70 ? "#4a90b8" : (desk.matter.healthScore ?? 0) >= 50 ? "#d4a054" : "#c45a4a";

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 space-y-4">
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Matter Readiness</h3>
          {matter?.readinessScores && Object.keys(matter.readinessScores).length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(matter.readinessScores).map(([k, v]) => {
                const score = v as number;
                const color = score >= 75 ? "#4a90b8" : score >= 50 ? "#d4a054" : "#c45a4a";
                return (
                  <div key={k} className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400">{PILLAR_LABELS[k] || k}</span>
                      <span className="text-sm font-bold font-mono" style={{ color }}>{score}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Posture", score: 72 },
                { label: "Readiness", score: 68 },
                { label: "Integrity", score: 81 },
                { label: "Strategy", score: 64 },
                { label: "Money", score: 59 },
                { label: "Governance", score: 88 },
              ].map(({ label, score }) => {
                const color = score >= 75 ? "#4a90b8" : score >= 50 ? "#d4a054" : "#c45a4a";
                return (
                  <div key={label} className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400">{label}</span>
                      <span className="text-sm font-bold font-mono" style={{ color }}>{score}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Outside-World Context</h3>
          {desk.worldContext ? (
            <div className="space-y-2">
              {desk.worldContext.map((ctx: any, i: number) => (
                <div key={i} className="flex items-start gap-2 py-1.5">
                  <Globe className="w-3 h-3 text-[#4a90b8] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500">{ctx.source}</div>
                    <div className="text-[11px] text-slate-300">{ctx.signal}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No outside-world signals available</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-[#d4a054]/20 p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-[#d4a054]" />
            <h3 className="text-xs font-semibold text-[#d4a054] uppercase tracking-wider">Recommended Actions</h3>
          </div>
          {(desk.recommendedActions || []).map((a: any, i: number) => (
            <div key={i} className="py-2 border-b border-white/[0.04] last:border-0">
              <div className="text-[11px] font-medium text-slate-200">{a.title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{a.description}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1 flex-1 bg-white/[0.06] rounded-full">
                  <div className="h-full bg-[#d4a054] rounded-full" style={{ width: `${a.impact * 100}%` }} />
                </div>
                <span className="text-[9px] text-slate-600 font-mono">{a.minutes}m</span>
              </div>
            </div>
          ))}
        </div>

        {matter && matter.deadlines?.length > 0 && (
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Upcoming Deadlines</h3>
            {matter.deadlines.slice(0, 4).map((d: any, i: number) => {
              const days = Math.ceil((new Date(d.date).getTime() - Date.now()) / 86400000);
              const color = days <= 7 ? "#c45a4a" : days <= 30 ? "#d4a054" : "#4a90b8";
              return (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[11px] text-slate-300 flex-1 truncate">{d.title}</span>
                  <span className="text-[10px] font-mono flex-shrink-0" style={{ color }}>{days}d</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WhatChangedTab({ desk }: { desk: any }) {
  return (
    <div className="space-y-3">
      {(desk.lastChanges || []).map((c: any, i: number) => (
        <div key={i} className="rounded-lg border border-white/[0.06] p-4 flex items-start gap-3" style={{ background: "#0c1220" }}>
          <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${c.severity === "warning" ? "bg-[#d4a054]" : c.severity === "critical" ? "bg-[#c45a4a]" : "bg-[#4a90b8]"}`} />
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-200">{c.title}</div>
            <p className="text-xs text-slate-400 mt-0.5">{c.summary}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500 capitalize">{c.type?.replace(/_/g, " ")}</span>
              <span className="text-[9px] text-slate-600">{timeAgo(c.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}
      {(!desk.lastChanges || desk.lastChanges.length === 0) && (
        <div className="text-center py-8">
          <CheckCircle className="w-6 h-6 text-[#4a90b8] mx-auto mb-2" />
          <p className="text-xs text-slate-400">No changes in the last 24 hours</p>
        </div>
      )}
    </div>
  );
}

function TimelineTab({ matter }: { matter: any }) {
  if (!matter) return <p className="text-xs text-slate-500">No timeline data available</p>;
  const events = [
    ...(matter.medicalTimeline || []).map((e: any) => ({ date: e.date, type: "medical", label: e.event, sub: e.provider })),
    ...(matter.offers || []).map((o: any) => ({ date: o.date, type: "offer", label: `${o.type.replace("_", " ")} — $${(o.amount/1000).toFixed(0)}K`, sub: o.source })),
    ...(matter.deadlines || []).map((d: any) => ({ date: d.date, type: "deadline", label: d.title, sub: d.type })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <h3 className="text-sm font-semibold text-slate-200 mb-4">Matter Timeline</h3>
      {events.length === 0 ? <p className="text-xs text-slate-500">No timeline events on record</p> : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-white/[0.06]" />
          {events.map((e, i) => (
            <div key={i} className="flex gap-3 mb-3 last:mb-0 relative">
              <div className={`w-2 h-2 rounded-full mt-1.5 z-10 flex-shrink-0 ml-3 ${e.type === "medical" ? "bg-[#4a90b8]" : e.type === "offer" ? "bg-[#d4a054]" : "bg-[#c45a4a]"}`} />
              <div className="flex-1 ml-2">
                <div className="text-[10px] text-slate-500 font-mono">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                <div className="text-xs text-slate-200 mt-0.5">{e.label}</div>
                <div className="text-[10px] text-slate-500">{e.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceTab({ desk, matter }: { desk: any; matter: any }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-[#4a90b8] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" /> Verified Evidence
        </h3>
        <div className="space-y-2">
          {["Police Report #2024-QN-4782", "MRI Report — Queens Medical (L4-L5 confirmed)", "IME — Dr. Whitmore (consistent findings)", "Reserve Increase Letter — National General", "PT Records — Queens PT Associates (ongoing)"].map((e, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <CheckCircle className="w-3 h-3 text-[#4a90b8] flex-shrink-0" />
              <span className="text-[11px] text-slate-300">{e}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[#c45a4a]/20 p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-[#c45a4a] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Missing Records
        </h3>
        <div className="space-y-3">
          {(desk.missingEvidence || []).map((m: any, i: number) => (
            <div key={i} className="py-2 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${m.severity === "high" ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
                <span className="text-[11px] text-slate-200">{m.item}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 ml-3">Action: {m.action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeadlinesTab({ matter }: { matter: any }) {
  if (!matter?.deadlines?.length) return <p className="text-xs text-slate-500 p-4">No deadlines on record</p>;
  return (
    <div className="space-y-2">
      {matter.deadlines.map((d: any, i: number) => {
        const days = Math.ceil((new Date(d.date).getTime() - Date.now()) / 86400000);
        const color = days <= 7 ? "#c45a4a" : days <= 30 ? "#d4a054" : "#4a90b8";
        return (
          <div key={i} className="rounded-lg border border-white/[0.06] p-4 flex items-center gap-4" style={{ background: "#0c1220" }}>
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: color + "15" }}>
              <Clock className="w-4 h-4" style={{ color }} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-200">{d.title}</div>
              <div className="text-[10px] text-slate-500">{d.type?.replace(/_/g, " ")}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-semibold" style={{ color }}>{days > 0 ? `${days} days` : "OVERDUE"}</div>
              <div className="text-[10px] text-slate-500">{new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MoneyTab({ matter }: { matter: any }) {
  if (!matter) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Settlement Range" value={matter.settlementHigh > 0 ? `$${(matter.settlementLow/1000).toFixed(0)}K–$${(matter.settlementHigh/1000).toFixed(0)}K` : "Not set"} sub={matter.settlementMid > 0 ? `Mid: $${(matter.settlementMid/1000).toFixed(0)}K` : ""} color="#d4a054" />
        <MetricCard label="Total Damages" value={matter.totalDamages > 0 ? `$${(matter.totalDamages/1000).toFixed(0)}K` : "N/A"} sub="Verified damages" color="#4a90b8" />
        <MetricCard label="Outstanding Liens" value={matter.totalLiens > 0 ? `$${(matter.totalLiens/1000).toFixed(1)}K` : "None"} sub="Reduces net recovery" color="#c45a4a" />
      </div>
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Offer & Reserve Trail</h3>
        {(matter.offers || []).length === 0 ? (
          <p className="text-xs text-slate-500">No offers on record</p>
        ) : matter.offers.map((o: any, i: number) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-[10px] text-slate-500 font-mono w-20">{new Date(o.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${o.type === "demand" ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#4a90b8]/10 text-[#4a90b8]"}`}>{o.type.replace("_", " ").toUpperCase()}</span>
            <span className="text-sm font-mono text-slate-200">${(o.amount/1000).toFixed(0)}K</span>
            <span className="text-[10px] text-slate-500">{o.source}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PressureTab({ desk }: { desk: any }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {(desk.pressureDimensions || []).map((p: any, i: number) => {
        const color = p.score > 60 ? "#c45a4a" : p.score > 40 ? "#d4a054" : "#4a90b8";
        return (
          <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-300">{p.label}</span>
              <span className={`text-[10px] ${p.movement === "rising" ? "text-[#c45a4a]" : p.movement === "falling" ? "text-[#4a90b8]" : "text-slate-500"}`}>
                {p.movement === "rising" ? "↑" : p.movement === "falling" ? "↓" : "→"}
              </span>
            </div>
            <div className="text-xl font-bold mb-1.5" style={{ color }}>{p.score}%</div>
            <div className="h-1.5 rounded-full bg-white/[0.06] mb-1.5">
              <div className="h-full rounded-full" style={{ width: `${p.score}%`, background: color }} />
            </div>
            <p className="text-[9px] text-slate-500">{p.driver}</p>
          </div>
        );
      })}
    </div>
  );
}

function ForecastTab({ matter }: { matter: any }) {
  if (!matter) return null;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Settlement Forecast</h3>
        {matter.settlementHigh > 0 ? (
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="text-center">
                <div className="text-xs text-slate-500">Conservative</div>
                <div className="text-sm font-mono text-slate-300">${(matter.settlementLow/1000).toFixed(0)}K</div>
              </div>
              <div className="flex-1 h-3 bg-white/[0.06] rounded-full relative">
                <div className="absolute h-full rounded-full" style={{ left: "15%", right: "10%", background: "linear-gradient(90deg, #d4a054, #4a90b8)", opacity: 0.4 }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#d4a054]" style={{ left: "50%" }} />
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">Aggressive</div>
                <div className="text-sm font-mono text-slate-300">${(matter.settlementHigh/1000).toFixed(0)}K</div>
              </div>
            </div>
            <div className="text-center text-xs text-slate-400">Best estimate: <span className="text-[#d4a054] font-mono font-semibold">${(matter.settlementMid/1000).toFixed(0)}K</span></div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No forecast data available</p>
        )}
      </div>
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <p className="text-[10px] text-slate-500">Forecasts are generated from comparable outcomes, medical trajectories, insurer behavior, and jurisdiction data. All forecasts require attorney review before informing strategy.</p>
      </div>
    </div>
  );
}

function ReviewTab({ matterId }: { matterId: number }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Review Queue — This Matter</h3>
        {[
          { title: "Reviewed Chronology", type: "chronology", status: "pending", unsupported: 1, contradictions: 0 },
          { title: "Partner Update Memo", type: "partner_update", status: "reviewed", unsupported: 0, contradictions: 0 },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
            <div className={`w-2 h-2 rounded-full ${r.status === "reviewed" ? "bg-[#4a90b8]" : "bg-[#d4a054]"}`} />
            <div className="flex-1">
              <div className="text-xs text-slate-200">{r.title}</div>
              <div className="text-[10px] text-slate-500 capitalize">{r.type.replace(/_/g, " ")} · {r.status}</div>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              {r.unsupported > 0 && <span className="text-[#d4a054]">{r.unsupported} unsupported</span>}
              {r.contradictions > 0 && <span className="text-[#c45a4a]">{r.contradictions} contradictions</span>}
              {r.unsupported === 0 && r.contradictions === 0 && <span className="text-[#4a90b8]">All clear</span>}
            </div>
            <Link href="/prism-counsel/review-before-send">
              <button className="px-2 py-0.5 rounded text-[10px] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] transition-colors">Review</button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignOffTab({ matterId }: { matterId: number }) {
  return (
    <div className="space-y-3">
      {[
        {
          title: "Chronology Export — Rodriguez",
          reason: "Chronology has been reviewed and source-verified. 4 statements supported at 95%+ confidence.",
          risk: "1 privilege warning (work product reference). 1 minor unsupported statement (vehicle count).",
          ifApproved: "Output marked safe to send. Export can be distributed to partner.",
          ifRejected: "Returns to reviewing attorney with feedback.",
          status: "pending",
        },
      ].map((s, i) => (
        <div key={i} className="rounded-lg border border-[#d4a054]/20 p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-200">{s.title}</h3>
            <span className="px-2 py-0.5 rounded text-[9px] bg-[#d4a054]/10 text-[#d4a054]">{s.status}</span>
          </div>
          <div className="rounded border border-white/[0.04] p-3 mb-3 text-xs text-slate-400" style={{ background: "#080c14" }}>
            {s.reason}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-2.5 rounded text-[10px]" style={{ background: "#080c14" }}>
              <div className="text-[#d4a054] font-semibold mb-1">Risk</div>
              <div className="text-slate-400">{s.risk}</div>
            </div>
            <div className="grid grid-rows-2 gap-2">
              <div className="p-2 rounded text-[10px] bg-[#4a90b8]/5 border border-[#4a90b8]/10">
                <div className="text-[#4a90b8] font-semibold mb-0.5">If Approved</div>
                <div className="text-slate-500">{s.ifApproved}</div>
              </div>
              <div className="p-2 rounded text-[10px] bg-[#c45a4a]/5 border border-[#c45a4a]/10">
                <div className="text-[#c45a4a] font-semibold mb-0.5">If Rejected</div>
                <div className="text-slate-500">{s.ifRejected}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button className="px-3 py-1.5 rounded text-xs border border-[#c45a4a]/30 text-[#c45a4a] hover:bg-[#c45a4a]/10 transition-colors">Reject</button>
            <button className="px-4 py-1.5 rounded text-xs bg-[#4a90b8]/15 text-[#4a90b8] border border-[#4a90b8]/30 hover:bg-[#4a90b8]/25 transition-colors flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3" /> Approve & Sign Off
            </button>
          </div>
        </div>
      ))}
      <div className="text-center py-4">
        <Link href="/prism-counsel/signoff-queue">
          <span className="text-xs text-[#d4a054] hover:underline cursor-pointer">View all pending sign-offs →</span>
        </Link>
      </div>
    </div>
  );
}

function AuditTab({ matter }: { matter: any }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <h3 className="text-sm font-semibold text-slate-200 mb-3">Audit Log</h3>
      <div className="space-y-2">
        {[
          { action: "Matter created", user: "System", date: matter?.filingDate || "2025-01-15", detail: "Initial intake completed" },
          { action: "Chronology exported", user: "Sarah Chen", date: "2026-03-28", detail: "Exported to partner review" },
          { action: "Demand approved", user: "James Whitfield", date: "2026-03-15", detail: "Counter-offer response approved at $95K" },
          { action: "AI output reviewed", user: "Sarah Chen", date: "2026-03-30", detail: "IME summary reviewed — no contradictions flagged" },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0 text-[11px]">
            <span className="text-slate-500 font-mono w-24 flex-shrink-0">{a.date}</span>
            <span className="text-slate-200 flex-1">{a.action}</span>
            <span className="text-slate-500">{a.user}</span>
            <span className="text-slate-600 text-[10px]">{a.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-lg font-semibold font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function timeAgo(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  return `${minutes}m ago`;
}
