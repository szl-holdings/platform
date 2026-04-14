import { useState, useEffect } from "react";
import { motion as m } from "framer-motion";
import { Scale, FileText, Clock, AlertTriangle, BarChart3, Gavel, BookOpen, Shield, Eye, Activity, Target, Calendar } from "lucide-react";
import { ParticleField, PulseMetricCard, PulseThroughputChart, PulseHeader, PulseHealthGrid, PulseEventFeed, PulseFlowDiagram, PulseTechStack } from "@szl-holdings/shared-ui";

const AGENTS = [
  { name: "Lexis Legal", domain: "research" },
  { name: "Matter Tracker", domain: "matters" },
  { name: "Deadline Guard", domain: "deadlines" },
  { name: "Discovery Bot", domain: "discovery" },
  { name: "Compliance Scan", domain: "compliance" },
];

const EVENT_TYPES = [
  { type: "matter_update", messages: ["Matter #2847: motion filed", "Settlement conference scheduled", "Expert witness deposition complete"] },
  { type: "deadline_alert", messages: ["Filing deadline: 3 days — Reply Brief", "Discovery cutoff: April 28", "Statute of limitations: 60 days"] },
  { type: "discovery_progress", messages: ["Document review: 2,847/4,200 complete", "Privilege log updated: +12 entries", "ESI collection: 99% processed"] },
  { type: "compliance_check", messages: ["Court rule compliance verified", "Filing fee payment confirmed", "Service of process: acknowledged"] },
  { type: "research_insight", messages: ["Favorable precedent identified: Smith v. Jones", "Opposing counsel pattern: 72% settle pre-trial", "Judge analytics: motion grant rate 61%"] },
];

function MatterTimeline() {
  const matters = [
    { name: "Johnson v. Acme Corp", phase: "Discovery", progress: 65, risk: "medium", color: "#f59e0b" },
    { name: "In re: Block 42 LLC", phase: "Motions", progress: 40, risk: "low", color: "#3b82f6" },
    { name: "State v. Maritime Holdings", phase: "Trial Prep", progress: 85, risk: "high", color: "#ef4444" },
    { name: "DOE Regulatory Filing", phase: "Compliance", progress: 92, risk: "low", color: "#10b981" },
  ];
  return (
    <div className="space-y-3">
      {matters.map(matter => (
        <div key={matter.name} className="rounded-md p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>{matter.name}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${matter.color}15`, color: matter.color }}>{matter.risk} risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{matter.phase}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              <m.div className="h-full rounded-full" initial={{ width: 0 }}
                animate={{ width: `${matter.progress}%` }} transition={{ duration: 1.5 }}
                style={{ background: `linear-gradient(90deg, ${matter.color}60, ${matter.color})` }} />
            </div>
            <span className="text-[9px] tabular-nums font-medium" style={{ color: matter.color }}>{matter.progress}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PrismPulse() {
  const [docsReviewed, setDocsReviewed] = useState(2847);
  useEffect(() => { const t = setInterval(() => setDocsReviewed(p => p + Math.floor(Math.random() * 8)), 3000); return () => clearInterval(t); }, []);
  return (
    <div className="min-h-screen relative" style={{ background: "#070a10" }}>
      <ParticleField accentColor="#8b5cf6" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <PulseHeader title="Legal Matter Pulse" subtitle={`Case intelligence — ${docsReviewed.toLocaleString()} docs reviewed · 5 legal agents`} accentColor="#8b5cf6" />
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg overflow-hidden mb-5 p-3"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" style={{ color: "#8b5cf6" }} />
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Document Review Velocity</span></div>
            <span className="text-[10px] tabular-nums font-medium" style={{ color: "#8b5cf6" }}>{docsReviewed.toLocaleString()} reviewed</span>
          </div>
          <PulseThroughputChart color="#8b5cf6" />
        </m.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <PulseMetricCard label="Active Matters" value={18} icon={Scale} color="#8b5cf6" trend="4 high priority" delay={0} />
          <PulseMetricCard label="Docs Reviewed" value={docsReviewed} icon={FileText} color="#3b82f6" trend="+340 today" delay={80} />
          <PulseMetricCard label="Deadlines" value={12} icon={Calendar} color="#ef4444" trend="3 within 7 days" delay={160} />
          <PulseMetricCard label="Discovery" value={67} suffix="%" icon={Eye} color="#10b981" trend="On track" delay={240} />
          <PulseMetricCard label="Win Rate" value={78} suffix="%" icon={Target} color="#f59e0b" trend="+5% this year" delay={320} />
          <PulseMetricCard label="Compliance" value={100} suffix="%" icon={Shield} color="#d4a054" trend="All current" delay={400} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Gavel className="w-4 h-4" style={{ color: "#8b5cf6" }} /> Matter Status</h2>
            <MatterTimeline />
          </m.div>
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <BookOpen className="w-4 h-4" style={{ color: "#8b5cf6" }} /> Legal Event Stream</h2>
            <PulseEventFeed agents={AGENTS} eventTypes={EVENT_TYPES} />
          </m.div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Scale className="w-4 h-4" style={{ color: "#8b5cf6" }} /> Legal Operations Flow</h2>
            <PulseFlowDiagram flows={[
              { from: "Intake", to: "Matters", type: "Case Assignment", color: "#8b5cf6", intensity: 4 },
              { from: "Research", to: "Strategy", type: "Precedent Analysis", color: "#3b82f6", intensity: 3 },
              { from: "Discover", to: "Review", type: "ESI Processing", color: "#10b981", intensity: 5 },
              { from: "Motion", to: "Court", type: "Filing Submission", color: "#f59e0b", intensity: 2 },
              { from: "Settle", to: "Close", type: "Resolution Path", color: "#d4a054", intensity: 4 },
            ]} />
          </m.div>
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Activity className="w-4 h-4" style={{ color: "#10b981" }} /> Legal Ops Health</h2>
            <PulseHealthGrid items={[
              { name: "Document Review", load: 72, color: "#8b5cf6" },
              { name: "eDiscovery", load: 58, color: "#3b82f6" },
              { name: "Deadline Mgmt", load: 84, color: "#ef4444" },
              { name: "Filing System", load: 33, color: "#10b981" },
              { name: "Research DB", load: 45, color: "#f59e0b" },
              { name: "Billing", load: 28, color: "#d4a054" },
              { name: "Compliance", load: 15, color: "#06b6d4" },
              { name: "Court Rules", load: 42, color: "#ec4899" },
            ]} />
          </m.div>
        </div>
        <div className="mt-5"><PulseTechStack items={[
          { label: "Matters", value: "18", color: "#8b5cf6" },
          { label: "Docs", value: "2.8K", color: "#3b82f6" },
          { label: "Deadlines", value: "12", color: "#ef4444" },
          { label: "Win Rate", value: "78%", color: "#10b981" },
          { label: "Courts", value: "7", color: "#f59e0b" },
          { label: "Judges", value: "Analytics", color: "#d4a054" },
          { label: "Precedents", value: "DB", color: "#06b6d4" },
          { label: "Billing", value: "Live", color: "#64748b" },
        ]} title="Legal Architecture" /></div>
        <div className="text-center py-4 mt-4">
          <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.08)" }}>PRISM Counsel — Legal Matter Pulse</p>
        </div>
      </div>
    </div>
  );
}
