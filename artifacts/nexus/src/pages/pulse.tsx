import { useState, useEffect } from "react";
import { motion as m } from "framer-motion";
import { Network, GitBranch, Layers, Activity, BarChart3, Brain, Combine, Zap, Eye, Workflow, Orbit, Target } from "lucide-react";
import { ParticleField, PulseMetricCard, PulseThroughputChart, PulseHeader, PulseHealthGrid, PulseEventFeed, PulseFlowDiagram, PulseTechStack } from "@szl-holdings/shared-ui";

const AGENTS = [
  { name: "Nexus Fusion", domain: "correlation" },
  { name: "Pattern Weaver", domain: "patterns" },
  { name: "Timeline Agent", domain: "timeline" },
  { name: "Swarm Intel", domain: "swarm" },
  { name: "Canvas Bot", domain: "canvas" },
];

const EVENT_TYPES = [
  { type: "correlation_found", messages: ["3-domain correlation: Aegis→Vessels→Terra", "Temporal pattern: 72h lag between signals", "Causal chain identified: 4 hops"] },
  { type: "fusion_event", messages: ["Cross-domain insight synthesized", "Multi-modal data fused: text + geospatial", "Signal amplification: 3x confidence boost"] },
  { type: "swarm_activity", messages: ["5-agent swarm converged on hypothesis", "Consensus reached: 94% agreement", "Dissenting agent: Muse — alternative view logged"] },
  { type: "canvas_update", messages: ["Room 'Maritime-Legal' updated: 12 nodes", "New artifact linked to correlation #847", "Timeline: 3 events auto-positioned"] },
  { type: "pattern_match", messages: ["Recurring pattern: quarterly compliance gaps", "Cross-domain anomaly: shipping + real estate", "Weak signal amplified via multi-hop"] },
];

function CorrelationWeb() {
  const domains = ["Aegis", "Vessels", "Terra", "Lyte", "CJ", "PRISM"];
  const colors = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#c4a265", "#8b5cf6"];
  const [activeLinks, setActiveLinks] = useState<{ from: number; to: number; id: number }[]>([]);
  useEffect(() => {
    const t = setInterval(() => {
      const from = Math.floor(Math.random() * domains.length);
      let to = Math.floor(Math.random() * domains.length);
      while (to === from) to = Math.floor(Math.random() * domains.length);
      setActiveLinks(prev => [...prev.filter(l => Date.now() - l.id < 4000), { from, to, id: Date.now() }].slice(-6));
    }, 1200);
    return () => clearInterval(t);
  }, []);
  const cx = 120, cy = 120, r = 80;
  const positions = domains.map((_, i) => ({
    x: cx + r * Math.cos((i * 2 * Math.PI) / domains.length - Math.PI / 2),
    y: cy + r * Math.sin((i * 2 * Math.PI) / domains.length - Math.PI / 2),
  }));
  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[240px] mx-auto">
      <circle cx={cx} cy={cy} r={r + 10} fill="none" stroke="rgba(236,72,153,0.06)" strokeWidth="1" strokeDasharray="3 3" />
      {activeLinks.map(link => (
        <line key={link.id} x1={positions[link.from].x} y1={positions[link.from].y}
          x2={positions[link.to].x} y2={positions[link.to].y}
          stroke={colors[link.from]} strokeWidth="1.5" opacity="0.4" strokeDasharray="4 4">
          <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.8s" repeatCount="indefinite" />
        </line>
      ))}
      {positions.map((pos, i) => (
        <g key={domains[i]}>
          <circle cx={pos.x} cy={pos.y} r="18" fill={`${colors[i]}10`} stroke={colors[i]} strokeWidth="1" />
          <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle" fill={colors[i]} fontSize="7" fontWeight="700" fontFamily="system-ui">{domains[i]}</text>
        </g>
      ))}
      <circle cx={cx} cy={cy} r="14" fill="rgba(236,72,153,0.1)" stroke="#ec4899" strokeWidth="1">
        <animate attributeName="r" values="12;16;12" dur="3s" repeatCount="indefinite" />
      </circle>
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill="#ec4899" fontSize="6" fontWeight="800" fontFamily="system-ui">NXS</text>
    </svg>
  );
}

export default function NexusPulse() {
  const [correlations, setCorrelations] = useState(487);
  useEffect(() => { const t = setInterval(() => setCorrelations(p => p + Math.floor(Math.random() * 2)), 4000); return () => clearInterval(t); }, []);
  return (
    <div className="min-h-screen relative" style={{ background: "#070a10" }}>
      <ParticleField accentColor="#ec4899" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <PulseHeader title="Fusion Intelligence Pulse" subtitle={`Cross-domain synthesis — ${correlations} correlations · 5 fusion agents`} accentColor="#ec4899" />
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg overflow-hidden mb-5 p-3"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" style={{ color: "#ec4899" }} />
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Correlation Density</span></div>
            <span className="text-[10px] tabular-nums font-medium" style={{ color: "#ec4899" }}>{correlations} active</span>
          </div>
          <PulseThroughputChart color="#ec4899" />
        </m.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <PulseMetricCard label="Correlations" value={correlations} icon={Combine} color="#ec4899" trend="+12 today" delay={0} />
          <PulseMetricCard label="Domains Linked" value={6} icon={Network} color="#3b82f6" trend="Full coverage" delay={80} />
          <PulseMetricCard label="Canvas Rooms" value={24} icon={Layers} color="#10b981" trend="3 active sessions" delay={160} />
          <PulseMetricCard label="Swarm Agents" value={5} icon={Orbit} color="#8b5cf6" trend="All converged" delay={240} />
          <PulseMetricCard label="Patterns" value={147} icon={GitBranch} color="#f59e0b" trend="+8 this week" delay={320} />
          <PulseMetricCard label="Confidence" value={94} suffix="%" icon={Target} color="#d4a054" trend="High reliability" delay={400} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Network className="w-4 h-4" style={{ color: "#ec4899" }} /> Correlation Web</h2>
            <CorrelationWeb />
          </m.div>
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Brain className="w-4 h-4" style={{ color: "#ec4899" }} /> Fusion Stream</h2>
            <PulseEventFeed agents={AGENTS} eventTypes={EVENT_TYPES} />
          </m.div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Combine className="w-4 h-4" style={{ color: "#ec4899" }} /> Fusion Flow</h2>
            <PulseFlowDiagram flows={[
              { from: "Domains", to: "Ingest", type: "Multi-Source Collection", color: "#ec4899", intensity: 5 },
              { from: "Correlate", to: "Pattern", type: "Cross-Domain Match", color: "#3b82f6", intensity: 4 },
              { from: "Swarm", to: "Consensus", type: "Multi-Agent Reasoning", color: "#8b5cf6", intensity: 4 },
              { from: "Canvas", to: "Artifact", type: "Visual Synthesis", color: "#10b981", intensity: 3 },
              { from: "Insight", to: "Action", type: "Intelligence → Decision", color: "#d4a054", intensity: 5 },
            ]} />
          </m.div>
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Activity className="w-4 h-4" style={{ color: "#10b981" }} /> Fusion Health</h2>
            <PulseHealthGrid items={[
              { name: "Correlation Engine", load: 72, color: "#ec4899" },
              { name: "Pattern Matcher", load: 58, color: "#3b82f6" },
              { name: "Swarm Network", load: 45, color: "#8b5cf6" },
              { name: "Canvas Renderer", load: 33, color: "#10b981" },
              { name: "Timeline DB", load: 41, color: "#f59e0b" },
              { name: "Multi-Modal", load: 67, color: "#d4a054" },
              { name: "Artifact Store", load: 29, color: "#06b6d4" },
              { name: "Signal Bus", load: 54, color: "#64748b" },
            ]} />
          </m.div>
        </div>
        <div className="mt-5"><PulseTechStack items={[
          { label: "Domains", value: "6", color: "#ec4899" },
          { label: "Correlations", value: "487", color: "#3b82f6" },
          { label: "Rooms", value: "24", color: "#10b981" },
          { label: "Patterns", value: "147", color: "#f59e0b" },
          { label: "Swarm", value: "5", color: "#8b5cf6" },
          { label: "Confidence", value: "94%", color: "#d4a054" },
          { label: "Multi-Modal", value: "Active", color: "#06b6d4" },
          { label: "Timeline", value: "Live", color: "#64748b" },
        ]} title="Fusion Architecture" /></div>
        <div className="text-center py-4 mt-4">
          <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.08)" }}>Nexus — Cross-Domain Fusion Intelligence Pulse</p>
        </div>
      </div>
    </div>
  );
}
