import { PulseMetricCard, PulseThroughputChart, PulseHeader, PulseHealthGrid, PulseEventFeed, PulseFlowDiagram, PulseTechStack } from "@szl-holdings/shared-ui/pulse";
import { useState, useEffect } from "react";
import { motion as m } from "framer-motion";
import { Activity, Zap, AlertTriangle, CheckCircle, Clock, BarChart3, Workflow, Bell, Cpu, Eye, Gauge, ArrowUpRight } from "lucide-react";
import { ParticleField } from "@szl-holdings/shared-ui/pulse";
import { PulseBriefingPanel } from "@szl-holdings/shared-ui/pulse-briefing-panel";

const AGENTS = [
  { name: "Lyte Observer", domain: "signals" },
  { name: "Blocker Hunter", domain: "blockers" },
  { name: "Action Router", domain: "actions" },
  { name: "Priority Engine", domain: "priorities" },
  { name: "Workflow Bot", domain: "workflows" },
  { name: "Digest Writer", domain: "reports" },
];

const EVENT_TYPES = [
  { type: "signal_processed", messages: ["Cross-domain correlation identified", "Anomaly baseline recalibrated", "Priority signal elevated to P1"] },
  { type: "blocker_detected", messages: ["Deployment blocker: CI pipeline stall", "Resource contention: API server", "Dependency conflict resolved"] },
  { type: "action_routed", messages: ["Action dispatched to Aegis team", "Alloy workflow triggered automatically", "Manual approval requested"] },
  { type: "priority_shift", messages: ["Priority matrix recalculated", "3 items promoted to critical", "Weekly digest priorities locked"] },
  { type: "workflow_executed", messages: ["Alloy gate: approval auto-granted", "5-step workflow completed in 4.2s", "Template instantiated: incident response"] },
  { type: "self_healing", messages: ["Service auto-restarted: API gateway", "Memory pressure resolved: GC cycle", "Circuit breaker reset: external API"] },
];

function SignalWaterfall() {
  const [signals, setSignals] = useState<{ id: number; level: number; color: string; label: string }[]>([]);
  useEffect(() => {
    const t = setInterval(() => {
      setSignals(prev => {
        const next = [...prev.filter(s => Date.now() - s.id < 6000)];
        const colors = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];
        const labels = ["Signal", "Alert", "Action", "Blocker", "Workflow"];
        const idx = Math.floor(Math.random() * colors.length);
        next.push({ id: Date.now(), level: Math.random() * 80 + 10, color: colors[idx], label: labels[idx] });
        return next.slice(-12);
      });
    }, 800);
    return () => clearInterval(t);
  }, []);
  return (
    <svg viewBox="0 0 400 100" className="w-full h-24">
      {signals.map((s, i) => {
        const x = (i / Math.max(signals.length - 1, 1)) * 380 + 10;
        return (
          <g key={s.id}>
            <rect x={x - 6} y={100 - s.level} width="12" height={s.level} rx="2"
              fill={s.color} opacity="0.4">
              <animate attributeName="opacity" from="0.6" to="0.2" dur="3s" fill="freeze" />
            </rect>
            <text x={x} y={96} textAnchor="middle" fill={s.color} fontSize="4" fontFamily="system-ui">{s.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function LytePulse() {
  const [signalCount, setSignalCount] = useState(3421);
  useEffect(() => { const t = setInterval(() => setSignalCount(p => p + Math.floor(Math.random() * 5)), 2000); return () => clearInterval(t); }, []);
  return (
    <div className="min-h-screen relative" style={{ background: "#070a10" }}>
      <ParticleField accentColor="#f59e0b" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <PulseHeader title="AIOps Pulse" subtitle={`Observability command — ${signalCount.toLocaleString()} signals processed · 6 ops agents`} accentColor="#f59e0b" />
        <div style={{ marginBottom: 20 }}>
          <PulseBriefingPanel domain="platform" />
        </div>
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg overflow-hidden mb-5 p-3"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Signal Processing Rate</span></div>
            <span className="text-[10px] tabular-nums font-medium" style={{ color: "#f59e0b" }}>{signalCount.toLocaleString()} / hr</span>
          </div>
          <PulseThroughputChart color="#f59e0b" />
        </m.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <PulseMetricCard label="Signals/hr" value={signalCount} icon={Activity} color="#f59e0b" trend="+23% throughput" delay={0} />
          <PulseMetricCard label="Active Blockers" value={3} icon={AlertTriangle} color="#ef4444" trend="−2 resolved today" delay={80} />
          <PulseMetricCard label="Actions Queued" value={47} icon={Zap} color="#3b82f6" trend="12 auto-routed" delay={160} />
          <PulseMetricCard label="Workflows" value={89} icon={Workflow} color="#8b5cf6" trend="7 running now" delay={240} />
          <PulseMetricCard label="Avg Response" value={2} suffix=".4s" icon={Clock} color="#06b6d4" trend="−0.8s improvement" delay={320} />
          <PulseMetricCard label="Self-Healed" value={142} icon={CheckCircle} color="#10b981" trend="98% auto-resolved" delay={400} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Gauge className="w-4 h-4" style={{ color: "#f59e0b" }} /> Signal Waterfall</h2>
            <SignalWaterfall />
          </m.div>
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Eye className="w-4 h-4" style={{ color: "#f59e0b" }} /> Ops Event Stream</h2>
            <PulseEventFeed agents={AGENTS} eventTypes={EVENT_TYPES} />
          </m.div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Zap className="w-4 h-4" style={{ color: "#f59e0b" }} /> Operations Flow</h2>
            <PulseFlowDiagram flows={[
              { from: "Ingest", to: "Signals", type: "Data Normalization", color: "#f59e0b", intensity: 5 },
              { from: "Detect", to: "Prioritize", type: "Anomaly → Priority", color: "#ef4444", intensity: 4 },
              { from: "Route", to: "Action", type: "Auto-Dispatch", color: "#3b82f6", intensity: 3 },
              { from: "Execute", to: "Verify", type: "Alloy Workflow", color: "#8b5cf6", intensity: 4 },
              { from: "Heal", to: "Report", type: "Self-Recovery → Digest", color: "#10b981", intensity: 3 },
            ]} />
          </m.div>
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Activity className="w-4 h-4" style={{ color: "#10b981" }} /> System Health</h2>
            <PulseHealthGrid items={[
              { name: "Signal Pipeline", load: 67, color: "#f59e0b" },
              { name: "Action Queue", load: 45, color: "#3b82f6" },
              { name: "Alloy Engine", load: 52, color: "#d4a054" },
              { name: "Event Bus", load: 38, color: "#10b981" },
              { name: "Priority Engine", load: 73, color: "#ef4444" },
              { name: "Digest Writer", load: 29, color: "#8b5cf6" },
              { name: "Self-Healing", load: 15, color: "#06b6d4" },
              { name: "API Gateway", load: 58, color: "#ec4899" },
            ]} />
          </m.div>
        </div>
        <div className="mt-5"><PulseTechStack items={[
          { label: "Signals", value: "3.4K/h", color: "#f59e0b" },
          { label: "Agents", value: "6", color: "#3b82f6" },
          { label: "Workflows", value: "89", color: "#8b5cf6" },
          { label: "Self-Heal", value: "98%", color: "#10b981" },
          { label: "MTTR", value: "2.4s", color: "#06b6d4" },
          { label: "Alloy", value: "Active", color: "#d4a054" },
          { label: "Blockers", value: "3", color: "#ef4444" },
          { label: "Actions", value: "47", color: "#ec4899" },
        ]} title="AIOps Architecture" /></div>
        <div className="text-center py-4 mt-4">
          <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.08)" }}>Command — AIOps Pulse</p>
        </div>
      </div>
    </div>
  );
}
