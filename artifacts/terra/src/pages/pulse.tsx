import { useState, useEffect } from "react";
import { motion as m } from "framer-motion";
import { Building, DollarSign, TrendingUp, MapPin, BarChart3, Home, Activity, Eye, Target, Briefcase, PieChart, ArrowUpRight } from "lucide-react";
import { ParticleField, PulseMetricCard, PulseThroughputChart, PulseHeader, PulseHealthGrid, PulseEventFeed, PulseFlowDiagram, PulseTechStack } from "@szl-holdings/shared-ui";
import { PulseBriefingPanel } from "@szl-holdings/shared-ui/pulse-briefing-panel";

const AGENTS = [
  { name: "Market Analyst", domain: "market" },
  { name: "Deal Scorer", domain: "deals" },
  { name: "Distress Engine", domain: "distress" },
  { name: "Comp Analyzer", domain: "valuations" },
  { name: "Pipeline Bot", domain: "pipeline" },
];

const EVENT_TYPES = [
  { type: "deal_scored", messages: ["Industrial portfolio: 87/100 score", "Mixed-use opportunity flagged", "Cap rate 7.2% — above threshold"] },
  { type: "distress_signal", messages: ["Foreclosure filing: 42 Oak Ave", "Tax lien detected: Block 3, Lot 12", "Loan maturity approaching: Q3 2026"] },
  { type: "market_update", messages: ["Median price: +3.2% YoY in Sector 7", "Inventory down 12% — seller's market", "New construction permits: +8% MoM"] },
  { type: "comp_analysis", messages: ["3 comparable sales identified", "Price/sqft: $285 — 15% below market", "Absorption rate: 4.2 months"] },
  { type: "pipeline_move", messages: ["Deal moved to Due Diligence", "Offer accepted: 123 Main St", "Closing scheduled: April 28, 2026"] },
];

function DealPipeline() {
  const stages = [
    { name: "Sourced", count: 47, color: "#64748b" },
    { name: "Qualified", count: 23, color: "#3b82f6" },
    { name: "Diligence", count: 8, color: "#f59e0b" },
    { name: "Under Contract", count: 4, color: "#10b981" },
    { name: "Closed", count: 12, color: "#d4a054" },
  ];
  const maxCount = Math.max(...stages.map(s => s.count));
  return (
    <div className="space-y-2">
      {stages.map(stage => (
        <div key={stage.name} className="flex items-center gap-3">
          <div className="w-24 text-right"><span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{stage.name}</span></div>
          <div className="flex-1 h-6 rounded overflow-hidden relative" style={{ background: "rgba(255,255,255,0.03)" }}>
            <m.div className="absolute inset-y-0 left-0 rounded" initial={{ width: 0 }}
              animate={{ width: `${(stage.count / maxCount) * 100}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              style={{ background: `linear-gradient(90deg, ${stage.color}40, ${stage.color})` }} />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.5)" }}>{stage.count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TerraPulse() {
  const [dealVolume, setDealVolume] = useState(142);
  useEffect(() => { const t = setInterval(() => setDealVolume(p => p + Math.floor(Math.random() * 2)), 5000); return () => clearInterval(t); }, []);
  return (
    <div className="min-h-screen relative" style={{ background: "#070a10" }}>
      <ParticleField accentColor="#10b981" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <PulseHeader title="Terra Market Pulse" subtitle={`Real estate intelligence — ${dealVolume} active deals · 5 analysis agents`} accentColor="#10b981" />
        <div style={{ marginBottom: 20 }}>
          <PulseBriefingPanel domain="real_estate" />
        </div>
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg overflow-hidden mb-5 p-3"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Deal Flow Volume</span></div>
            <span className="text-[10px] tabular-nums font-medium" style={{ color: "#10b981" }}>{dealVolume} deals / mo</span>
          </div>
          <PulseThroughputChart color="#10b981" />
        </m.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <PulseMetricCard label="Active Deals" value={dealVolume} icon={Briefcase} color="#10b981" trend="+8% this month" delay={0} />
          <PulseMetricCard label="Portfolio Value" value={287} suffix="M" icon={DollarSign} color="#d4a054" trend="+$12M this quarter" delay={80} />
          <PulseMetricCard label="Properties" value={1247} icon={Building} color="#3b82f6" trend="847 monitored" delay={160} />
          <PulseMetricCard label="Distress Signals" value={34} icon={Target} color="#ef4444" trend="7 actionable" delay={240} />
          <PulseMetricCard label="Markets" value={18} icon={MapPin} color="#8b5cf6" trend="3 new sectors" delay={320} />
          <PulseMetricCard label="Avg Cap Rate" value={6} suffix=".8%" icon={PieChart} color="#f59e0b" trend="+0.3 from Q4" delay={400} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <TrendingUp className="w-4 h-4" style={{ color: "#10b981" }} /> Deal Pipeline</h2>
            <DealPipeline />
          </m.div>
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Eye className="w-4 h-4" style={{ color: "#10b981" }} /> Market Intelligence Stream</h2>
            <PulseEventFeed agents={AGENTS} eventTypes={EVENT_TYPES} />
          </m.div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Home className="w-4 h-4" style={{ color: "#10b981" }} /> Market Data Flow</h2>
            <PulseFlowDiagram flows={[
              { from: "MLS", to: "Comps", type: "Listing Ingestion", color: "#10b981", intensity: 5 },
              { from: "Distress", to: "Deals", type: "Foreclosure Alerts", color: "#ef4444", intensity: 3 },
              { from: "Market", to: "Score", type: "Valuation Models", color: "#3b82f6", intensity: 4 },
              { from: "Due Dil", to: "Legal", type: "Title & Lien Search", color: "#8b5cf6", intensity: 2 },
              { from: "Close", to: "Portfolio", type: "Asset Integration", color: "#d4a054", intensity: 4 },
            ]} />
          </m.div>
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Activity className="w-4 h-4" style={{ color: "#10b981" }} /> Market Health</h2>
            <PulseHealthGrid items={[
              { name: "NYC Metro", load: 72, color: "#10b981" },
              { name: "South FL", load: 58, color: "#3b82f6" },
              { name: "LA Basin", load: 45, color: "#f59e0b" },
              { name: "Chicago", load: 33, color: "#06b6d4" },
              { name: "Dallas", load: 67, color: "#d4a054" },
              { name: "Phoenix", load: 81, color: "#8b5cf6" },
              { name: "Industrial", load: 54, color: "#ec4899" },
              { name: "Multifamily", load: 42, color: "#ef4444" },
            ]} />
          </m.div>
        </div>
        <div className="mt-5"><PulseTechStack items={[
          { label: "MLS Feeds", value: "18", color: "#10b981" },
          { label: "Properties", value: "1.2K", color: "#3b82f6" },
          { label: "Comps DB", value: "47K", color: "#f59e0b" },
          { label: "Markets", value: "18", color: "#d4a054" },
          { label: "Distress", value: "Live", color: "#ef4444" },
          { label: "Valuations", value: "ML", color: "#8b5cf6" },
          { label: "Pipeline", value: "CRM", color: "#06b6d4" },
          { label: "Reports", value: "Auto", color: "#64748b" },
        ]} title="Real Estate Stack" /></div>
        <div className="text-center py-4 mt-4">
          <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.08)" }}>Terra — Real Estate Intelligence — Market Pulse</p>
        </div>
      </div>
    </div>
  );
}
