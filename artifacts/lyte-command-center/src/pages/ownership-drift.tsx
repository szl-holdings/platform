import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { GitBranch, AlertTriangle, Clock, Users, ChevronDown, ChevronUp, Shield, ExternalLink } from "lucide-react";
import { driftItems, driftHistory, type DriftItem } from "@/data/seed";

function ProofBadge({ ref: proofRef }: { ref: string }) {
  return (
    <span className="proof-badge">
      <Shield className="w-2.5 h-2.5" />
      {proofRef}
    </span>
  );
}

function StatusPill({ status }: { status: DriftItem["status"] }) {
  if (status === "critical") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono status-critical">CRITICAL</span>;
  if (status === "warn") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono status-warn">WARNING</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono status-info">MONITOR</span>;
}

function DriftCard({ item }: { item: DriftItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`cockpit-panel transition-all ${item.status === "critical" ? "border-red-500/20" : item.status === "warn" ? "border-amber-500/20" : ""}`}>
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-amber-500/3 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${
          item.status === "critical" ? "bg-red-500/10 border border-red-500/20" :
          item.status === "warn" ? "bg-amber-500/10 border border-amber-500/20" :
          "bg-sky-500/10 border border-sky-500/20"
        }`}>
          <GitBranch className={`w-4 h-4 ${
            item.status === "critical" ? "text-red-400" :
            item.status === "warn" ? "text-amber-400" : "text-sky-400"
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-amber-100">{item.title}</p>
              <p className="text-[10px] font-mono text-amber-400/50 mt-0.5">{item.program} · {item.team}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusPill status={item.status} />
              {expanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-400/40" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400/40" />}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-[11px] text-amber-400/60">
              <Clock className="w-3 h-3" />
              <span className="font-mono">{item.staleDays}d stalled</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-400/60">
              <Users className="w-3 h-3" />
              <span>{item.owners.length} named owners</span>
            </div>
            <ProofBadge ref={item.proofRef} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-amber-500/8 space-y-4">
          {/* Impact */}
          <div className="rounded bg-amber-500/5 border border-amber-500/15 p-3">
            <p className="text-[10px] font-mono text-amber-400/50 mb-1">BUSINESS IMPACT</p>
            <p className="text-xs text-amber-100/75">{item.impact}</p>
          </div>

          {/* Owners */}
          <div>
            <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-2">Named Owners</p>
            <div className="flex flex-wrap gap-2">
              {item.owners.map(owner => (
                <span key={owner} className="text-[11px] px-2.5 py-1 rounded border border-amber-500/15 bg-amber-500/5 text-amber-200/70">
                  {owner}
                </span>
              ))}
            </div>
          </div>

          {/* Evidence */}
          <div>
            <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-2">Evidence Trail</p>
            <ul className="space-y-1.5">
              {item.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-mono text-amber-500/40 w-3 shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="text-xs text-amber-100/60">{e}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Last activity + proof */}
          <div className="flex items-center justify-between pt-2 border-t border-amber-500/8">
            <span className="text-[10px] text-amber-400/40 font-mono">Last activity: {item.lastActivity}</span>
            <ProofBadge ref={item.proofRef} />
          </div>
        </div>
      )}
    </div>
  );
}

interface DriftTooltipEntry {
  value: number;
}

interface DriftTooltipProps {
  active?: boolean;
  payload?: DriftTooltipEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: DriftTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0d1520] border border-amber-500/20 rounded px-3 py-2 text-xs shadow-xl">
        <p className="text-amber-400/60 font-mono mb-1">{label}</p>
        <p className="text-amber-300 font-mono">{payload[0].value} drift items</p>
      </div>
    );
  }
  return null;
};

export default function OwnershipDriftPage() {
  const [filter, setFilter] = useState<"all" | "critical" | "warn" | "info">("all");

  const filtered = filter === "all" ? driftItems : driftItems.filter(d => d.status === filter);
  const critical = driftItems.filter(d => d.status === "critical").length;
  const warn = driftItems.filter(d => d.status === "warn").length;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-4 h-4 text-amber-400" />
          <h1 className="text-xl font-display font-bold text-amber-50">Ownership Drift</h1>
        </div>
        <p className="text-sm text-amber-100/50">Work stalled because responsibility is unclear or contested — with evidence per stall.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Drift Items", value: driftItems.length, sub: "active", color: "amber" },
          { label: "Critical", value: critical, sub: "act today", color: "red" },
          { label: "Warning", value: warn, sub: "monitor", color: "amber" },
          { label: "Days (avg stall)", value: Math.round(driftItems.reduce((a, b) => a + b.staleDays, 0) / driftItems.length), sub: "avg stall", color: "amber" },
        ].map(kpi => (
          <div key={kpi.label} className="cockpit-panel p-4">
            <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-1">{kpi.label}</p>
            <p className={`text-2xl font-mono font-bold ${kpi.color === "red" ? "text-red-400" : "text-amber-300"}`}>{kpi.value}</p>
            <p className="text-[10px] text-amber-400/40">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="cockpit-panel p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-amber-100">Drift Trend — 4 Weeks</p>
            <p className="text-[10px] text-amber-400/45">Unresolved ownership gaps over time</p>
          </div>
          <span className="proof-badge"><Shield className="w-2.5 h-2.5" />ALLOY-SENSOR</span>
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={driftHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="driftGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(245,158,11,0.4)", fontFamily: "JetBrains Mono" }} />
              <YAxis tick={{ fontSize: 9, fill: "rgba(245,158,11,0.4)", fontFamily: "JetBrains Mono" }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={1.5} fill="url(#driftGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter + list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-amber-100">{filtered.length} Drift Items</p>
          <div className="flex items-center gap-1.5">
            {(["all", "critical", "warn", "info"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                  filter === f
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : "text-amber-400/40 hover:text-amber-300 border border-transparent"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filtered.map(item => <DriftCard key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  );
}
