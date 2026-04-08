import { useState } from "react";
import {
  Wrench, TrendingUp, TrendingDown, CheckCircle, Clock, DollarSign,
  Star, AlertTriangle, BarChart3, Users
} from "lucide-react";
import { vendors, getVendorReliabilityScore, type VendorRecord } from "@/data/readiness-graph";

const ACCENT = "#40856a";

const DEMO_BADGE = (
  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-widest"
    style={{ background: "rgba(184,148,60,0.12)", color: "#b8943c", border: "1px solid rgba(184,148,60,0.2)" }}>
    Simulated Data
  </span>
);

function relTime(iso?: string) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

function ReliabilityBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono font-bold w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? ACCENT : score >= 65 ? "#b8943c" : "#c04a2a";
  const r = 24;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: 60, height: 60 }}>
      <svg width={60} height={60} viewBox="0 0 60 60" className="-rotate-90">
        <circle cx={30} cy={30} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
        <circle
          cx={30} cy={30} r={r} fill="none"
          stroke={color} strokeWidth={7}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold font-mono" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function VendorCard({ vendor }: { vendor: VendorRecord }) {
  const [expanded, setExpanded] = useState(false);
  const score = getVendorReliabilityScore(vendor);
  const scoreColor = score >= 80 ? ACCENT : score >= 65 ? "#b8943c" : "#c04a2a";
  const onTimeRate = Math.round((vendor.jobsOnTime / Math.max(1, vendor.jobsCompleted)) * 100);
  const onBudgetRate = Math.round((vendor.jobsOnBudget / Math.max(1, vendor.jobsCompleted)) * 100);

  return (
    <div className="rounded-xl border transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderColor: score >= 80 ? "rgba(64,133,106,0.15)" : score >= 65 ? "rgba(184,148,60,0.15)" : "rgba(192,74,42,0.15)",
      }}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-white/2 transition-colors rounded-xl"
      >
        <ScoreRing score={score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{vendor.name}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                color: scoreColor,
                background: `${scoreColor}12`,
              }}>
              {score >= 80 ? "Highly Reliable" : score >= 65 ? "Reliable" : "Use With Caution"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {vendor.specialty.map(s => (
              <span key={s} className="text-[9px] px-1.5 py-0.5 rounded capitalize"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}>
                {s.replace(/_/g, " ")}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4 text-[10px]">
            {[
              { label: "Jobs Done", value: vendor.jobsCompleted },
              { label: "On Time", value: `${onTimeRate}%`, color: onTimeRate >= 80 ? ACCENT : "#b8943c" },
              { label: "On Budget", value: `${onBudgetRate}%`, color: onBudgetRate >= 80 ? ACCENT : "#b8943c" },
              { label: "Avg Duration", value: `${vendor.avgDaysToComplete}d` },
            ].map(m => (
              <div key={m.label}>
                <div style={{ color: "rgba(255,255,255,0.3)" }}>{m.label}</div>
                <div className="font-bold font-mono mt-0.5" style={{ color: m.color ?? "rgba(255,255,255,0.8)" }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
          Last used: {relTime(vendor.lastUsed)}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                Performance Breakdown
              </div>
              {[
                { label: "On-Time Rate", value: onTimeRate, color: onTimeRate >= 80 ? ACCENT : "#b8943c" },
                { label: "On-Budget Rate", value: onBudgetRate, color: onBudgetRate >= 80 ? ACCENT : "#b8943c" },
                { label: "Cost Accuracy", value: Math.max(0, 100 - Math.round(vendor.avgCostVariancePct)), color: ACCENT },
              ].map(m => (
                <div key={m.label}>
                  <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{m.label}</div>
                  <ReliabilityBar value={m.value} color={m.color} />
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                Key Metrics
              </div>
              <div className="space-y-2">
                {[
                  { label: "Avg cost variance", value: `${vendor.avgCostVariancePct}%`, warn: vendor.avgCostVariancePct > 10 },
                  { label: "Avg days to complete", value: `${vendor.avgDaysToComplete}d` },
                  { label: "Jobs completed", value: vendor.jobsCompleted.toString() },
                  { label: "Last engagement", value: relTime(vendor.lastUsed) },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between text-xs">
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</span>
                    <span className="font-mono font-medium"
                      style={{ color: m.warn ? "#b8943c" : "rgba(255,255,255,0.75)" }}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {vendor.notes && (
            <div className="rounded-xl border p-3 text-xs"
              style={{ background: "rgba(255,255,255,0.01)", borderColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
              <span className="font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Notes: </span>
              {vendor.notes}
            </div>
          )}
          <div className="flex gap-2">
            <button className="text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-colors"
              style={{ background: ACCENT, color: "white" }}>
              Assign to Blocker
            </button>
            <button className="text-[10px] px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
              View History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const SORT_OPTIONS = ["reliability", "on_time", "on_budget", "jobs"] as const;
type SortOption = typeof SORT_OPTIONS[number];

const SORT_LABELS: Record<SortOption, string> = {
  reliability: "Reliability Score",
  on_time: "On-Time Rate",
  on_budget: "On-Budget Rate",
  jobs: "Jobs Completed",
};

export default function VendorReliabilityPage() {
  const [sort, setSort] = useState<SortOption>("reliability");
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");

  const allSpecialties = Array.from(new Set(vendors.flatMap(v => v.specialty))).sort();

  const filtered = vendors
    .filter(v => {
      const q = search.toLowerCase();
      if (q && !v.name.toLowerCase().includes(q) && !v.specialty.some(s => s.includes(q))) return false;
      if (specialtyFilter !== "all" && !v.specialty.includes(specialtyFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "reliability") return getVendorReliabilityScore(b) - getVendorReliabilityScore(a);
      if (sort === "on_time") return (b.jobsOnTime / Math.max(1, b.jobsCompleted)) - (a.jobsOnTime / Math.max(1, a.jobsCompleted));
      if (sort === "on_budget") return (b.jobsOnBudget / Math.max(1, b.jobsCompleted)) - (a.jobsOnBudget / Math.max(1, a.jobsCompleted));
      if (sort === "jobs") return b.jobsCompleted - a.jobsCompleted;
      return 0;
    });

  const avgScore = Math.round(vendors.reduce((s, v) => s + getVendorReliabilityScore(v), 0) / vendors.length);
  const topVendor = [...vendors].sort((a, b) => getVendorReliabilityScore(b) - getVendorReliabilityScore(a))[0];
  const highRisk = vendors.filter(v => getVendorReliabilityScore(v) < 65);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} style={{ color: ACCENT }} />
            <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Vendor Reliability Memory</h1>
            {DEMO_BADGE}
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Track which vendors clear blockers fastest, on time, and on budget — surfaced when assigning work
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Vendors Tracked", value: vendors.length.toString(), color: "rgba(255,255,255,0.8)" },
          { label: "Avg Reliability", value: `${avgScore}%`, color: avgScore >= 80 ? ACCENT : "#b8943c" },
          { label: "Top Performer", value: topVendor?.name.split(" ")[0] ?? "—", color: ACCENT },
          { label: "Use With Caution", value: highRisk.length.toString(), color: highRisk.length > 0 ? "#c04a2a" : ACCENT },
        ].map(m => (
          <div key={m.label} className="rounded-xl border p-4"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
            <div className="text-xl font-bold truncate" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search vendors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] bg-transparent text-xs rounded-lg px-3 py-2 outline-none"
          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
        />
        <select
          value={specialtyFilter}
          onChange={e => setSpecialtyFilter(e.target.value)}
          className="text-xs rounded-lg px-3 py-2 outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
        >
          <option value="all">All specialties</option>
          {allSpecialties.map(s => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className="text-[10px] px-2.5 py-1.5 rounded-lg transition-colors capitalize"
              style={{
                background: sort === s ? `${ACCENT}20` : "rgba(255,255,255,0.04)",
                color: sort === s ? ACCENT : "rgba(255,255,255,0.35)",
                border: `1px solid ${sort === s ? `${ACCENT}40` : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            No vendors match your filter.
          </div>
        ) : (
          filtered.map(v => <VendorCard key={v.id} vendor={v} />)
        )}
      </div>

      <div className="rounded-xl border p-5"
        style={{ background: "rgba(255,255,255,0.01)", borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            Reliability scores are calculated from actual job history: 40% on-time rate · 35% on-budget rate · 15% budget accuracy · 10% speed
          </span>
        </div>
      </div>
    </div>
  );
}
