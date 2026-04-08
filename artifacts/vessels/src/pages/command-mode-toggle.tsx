import { useState } from "react";
import {
  Anchor, Ship, AlertTriangle, DollarSign, TrendingUp,
  BarChart3, ChevronRight, CheckCircle2,
  Navigation, Briefcase
} from "lucide-react";

const ACCENT = "hsl(205 70% 50%)";

type CommandMode = "captain" | "executive";

const DEMO_FLEET_STATUS = {
  vessels: [
    { name: "MV NOVA ATLAS", status: "at_sea", heading: 225, speed: "12.4 kn", eta: "Singapore · 3d 14h", cargo: "Iron ore 45,000t", issue: "Engine inspection overdue", issueLevel: "critical" },
    { name: "CV STELLARIS", status: "at_sea", heading: 88, speed: "18.2 kn", eta: "Singapore · 14h", cargo: "Containers 8,200 TEU", issue: "Port congestion on arrival", issueLevel: "high" },
    { name: "MT BOREAL SEA", status: "at_sea", heading: 302, speed: "14.1 kn", eta: "Rotterdam · 6h", cargo: "Crude oil 120,000t", issue: "Sulphur cert expired", issueLevel: "critical" },
    { name: "LNG ARTEMIS", status: "anchored", heading: 0, speed: "0.0 kn", eta: "Awaiting berth · 4h", cargo: "LNG 75,000m³", issue: null, issueLevel: null },
    { name: "MV CAPE MERIDIAN", status: "at_sea", heading: 65, speed: "13.6 kn", eta: "Los Angeles · 2d", cargo: "General cargo 12,000t", issue: "BWTS fault", issueLevel: "high" },
    { name: "MT PACIFIC HERALD", status: "in_port", heading: 0, speed: "0.0 kn", eta: "Discharging · est. 18h", cargo: "Diesel 85,000t", issue: null, issueLevel: null },
  ],
  portfolio: {
    activeRevenue: 8_420_000,
    margin: 2_140_000,
    marginPct: 25.4,
    delayExposure: 1_140_000,
    tcEquivalent: 31_200,
    fleetUtil: 84,
    criticalIssues: 2,
    highIssues: 3,
    scheduleAtRisk: 3,
  },
};

const STATUS_COLOR: Record<string, { text: string; dot: string; label: string }> = {
  at_sea: { text: "#22c55e", dot: "#22c55e", label: "At sea" },
  anchored: { text: "#f59e0b", dot: "#f59e0b", label: "Anchored" },
  in_port: { text: "#0ea5e9", dot: "#0ea5e9", label: "In port" },
  maintenance: { text: "#ef4444", dot: "#ef4444", label: "Maintenance" },
};

const ISSUE_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
};

function CaptainVesselCard({ vessel }: { vessel: typeof DEMO_FLEET_STATUS.vessels[0] }) {
  const sc = STATUS_COLOR[vessel.status];
  const [actioned, setActioned] = useState(false);

  return (
    <div className="rounded-xl border p-4" style={{
      background: vessel.issueLevel === "critical" ? "#ef444408" : "rgba(255,255,255,0.02)",
      borderColor: vessel.issueLevel === "critical" ? "#ef444430" : vessel.issueLevel === "high" ? "#f9731625" : "rgba(255,255,255,0.06)",
    }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Ship size={16} style={{ color: sc.text }} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{vessel.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
              <span className="text-[10px]" style={{ color: sc.text }}>{sc.label}</span>
              {vessel.status === "at_sea" && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                  <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>{vessel.speed}</span>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                  <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>HDG {vessel.heading}°</span>
                </>
              )}
            </div>
          </div>
        </div>
        {vessel.issue && (
          <span className="text-[9px] px-2 py-0.5 rounded-full" style={{
            background: `${ISSUE_COLOR[vessel.issueLevel ?? "medium"]}15`,
            color: ISSUE_COLOR[vessel.issueLevel ?? "medium"],
            border: `1px solid ${ISSUE_COLOR[vessel.issueLevel ?? "medium"]}30`,
          }}>
            {vessel.issueLevel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="text-[9px] uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>ETA / Status</div>
          <div className="text-[11px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{vessel.eta}</div>
        </div>
        <div className="rounded p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="text-[9px] uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>Cargo</div>
          <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{vessel.cargo}</div>
        </div>
      </div>

      {vessel.issue && (
        <div className="rounded-lg p-2.5 mb-3" style={{
          background: `${ISSUE_COLOR[vessel.issueLevel ?? "medium"]}10`,
          border: `1px solid ${ISSUE_COLOR[vessel.issueLevel ?? "medium"]}25`,
        }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={12} style={{ color: ISSUE_COLOR[vessel.issueLevel ?? "medium"] }} />
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.75)" }}>{vessel.issue}</span>
          </div>
        </div>
      )}

      {vessel.issue && !actioned && (
        <div className="flex gap-2">
          <button
            onClick={() => setActioned(true)}
            className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(14,165,233,0.12)", color: ACCENT, border: "1px solid rgba(14,165,233,0.2)" }}
          >
            <CheckCircle2 size={11} />
            Acknowledge
          </button>
          <button className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Navigation size={11} />
            Navigate to
          </button>
        </div>
      )}
      {actioned && (
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#22c55e" }}>
          <CheckCircle2 size={11} />
          Acknowledged
        </div>
      )}
    </div>
  );
}

function ExecutivePortfolioView({ data }: { data: typeof DEMO_FLEET_STATUS.portfolio }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Revenue", value: `$${(data.activeRevenue / 1e6).toFixed(1)}M`, sub: "fleet-wide active voyages", color: "#22c55e", icon: DollarSign },
          { label: "Portfolio Margin", value: `${data.marginPct.toFixed(1)}%`, sub: `$${(data.margin / 1e6).toFixed(1)}M net`, color: "#0ea5e9", icon: TrendingUp },
          { label: "Fleet TCE", value: `$${(data.tcEquivalent / 1000).toFixed(1)}K/d`, sub: "avg per vessel/day", color: "#a78bfa", icon: BarChart3 },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={14} style={{ color: m.color }} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</span>
              </div>
              <div className="text-2xl font-bold font-display" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-5" style={{ background: "#ef444408", borderColor: "#ef444425" }}>
          <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#ef444480" }}>Strategic risk exposure</div>
          <div className="space-y-3">
            {[
              { label: "Critical issues requiring action", value: data.criticalIssues, color: "#ef4444" },
              { label: "High priority watch items", value: data.highIssues, color: "#f97316" },
              { label: "Schedules at risk (>12h delay)", value: data.scheduleAtRisk, color: "#f59e0b" },
              { label: "Delay cost exposure", value: `$${(data.delayExposure / 1000).toFixed(0)}K`, color: "#f97316" },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>{r.label}</span>
                <span className="text-sm font-bold font-mono" style={{ color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Fleet utilization breakdown</div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Utilization</span>
              <span className="text-lg font-bold" style={{ color: data.fleetUtil >= 85 ? "#22c55e" : data.fleetUtil >= 70 ? "#f59e0b" : "#ef4444" }}>{data.fleetUtil}%</span>
            </div>
            <div className="h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: `${data.fleetUtil}%`, background: "linear-gradient(90deg,#22c55e,#0ea5e9)" }} />
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: "At sea / active", value: "6 vessels" },
              { label: "In port / loading", value: "1 vessel" },
              { label: "Maintenance hold", value: "0 vessels" },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between text-[11px]">
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{r.label}</span>
                <span className="font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="text-[10px] uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>Board-level fleet summary</div>
        <div className="grid grid-cols-2 gap-4 text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>
          {[
            "6 vessels operating — 84% fleet utilization against commercial targets",
            "2 critical compliance issues require action before end of day — engine cert and sulphur cert",
            "Delay cost exposure of $1.14M is concentrated in 3 voyages with correctable paths",
            "Portfolio margin of 25.4% is tracking above Q2 budget (target: 22%)",
            "LNG spot rate opportunity exists for ARTEMIS post-charter — +18% vs current TC rate",
            "Singapore congestion will resolve with pre-dawn berth timing — no material P&L impact",
          ].map((point, i) => (
            <div key={i} className="flex items-start gap-2">
              <ChevronRight size={12} style={{ color: "rgba(14,165,233,0.4)", marginTop: 2, flexShrink: 0 }} />
              <span>{point}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CommandModeTogglePage() {
  const [mode, setMode] = useState<CommandMode>("executive");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "rgba(255,255,255,0.95)" }}>Command Mode</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Same fleet data — two views for different decisions
          </p>
        </div>

        <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.10)" }}>
          <button
            onClick={() => setMode("captain")}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all"
            style={{
              background: mode === "captain" ? "hsl(205 70% 38% / 0.20)" : "rgba(255,255,255,0.02)",
              color: mode === "captain" ? ACCENT : "rgba(255,255,255,0.4)",
              borderRight: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Anchor size={14} />
            Captain Mode
          </button>
          <button
            onClick={() => setMode("executive")}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all"
            style={{
              background: mode === "executive" ? "hsl(205 70% 38% / 0.20)" : "rgba(255,255,255,0.02)",
              color: mode === "executive" ? ACCENT : "rgba(255,255,255,0.4)",
            }}
          >
            <Briefcase size={14} />
            Executive Mode
          </button>
        </div>
      </div>

      <div className="rounded-xl border px-4 py-3 flex items-start gap-3" style={{
        background: mode === "captain" ? "rgba(14,165,233,0.04)" : "rgba(139,92,246,0.04)",
        borderColor: mode === "captain" ? "rgba(14,165,233,0.15)" : "rgba(139,92,246,0.15)",
      }}>
        {mode === "captain" ? (
          <>
            <Anchor size={16} style={{ color: ACCENT, flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="text-[11px] font-semibold mb-0.5" style={{ color: ACCENT }}>Captain Mode</div>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                Operational detail and action buttons — course, speed, ETA, cargo, vessel-level issues with one-click acknowledge and navigate actions.
              </div>
            </div>
          </>
        ) : (
          <>
            <Briefcase size={16} style={{ color: "#a78bfa", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="text-[11px] font-semibold mb-0.5" style={{ color: "#a78bfa" }}>Executive Mode</div>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                Portfolio risk, cost impact, and strategic decisions — margin performance, TCE, utilization, and board-level narrative. No operational noise.
              </div>
            </div>
          </>
        )}
      </div>

      {mode === "captain" && (
        <div className="space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
            Fleet operational status · {DEMO_FLEET_STATUS.vessels.length} vessels
          </div>
          <div className="grid grid-cols-2 gap-3">
            {DEMO_FLEET_STATUS.vessels.map(v => (
              <CaptainVesselCard key={v.name} vessel={v} />
            ))}
          </div>

          <div className="rounded-xl border p-4" style={{ background: "rgba(14,165,233,0.04)", borderColor: "rgba(14,165,233,0.12)" }}>
            <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "rgba(14,165,233,0.5)" }}>Pending actions</div>
            <div className="space-y-2">
              {[
                { vessel: "MT BOREAL SEA", action: "File emergency sulphur certificate — Rotterdam Port Authority · 2h window", priority: "critical" },
                { vessel: "MV NOVA ATLAS", action: "Book Singapore dry dock slot · Lloyd's Register inspection required", priority: "critical" },
                { vessel: "CV STELLARIS", action: "Pre-file customs single window · arrival 06:00 local for tide advantage", priority: "high" },
                { vessel: "MV CAPE MERIDIAN", action: "Repair BWTS UV lamp from spares · file USCG exemption as backup", priority: "high" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{
                    background: ISSUE_COLOR[a.priority] + "15",
                    color: ISSUE_COLOR[a.priority],
                    border: `1px solid ${ISSUE_COLOR[a.priority]}30`,
                  }}>{a.priority}</span>
                  <div>
                    <div className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>{a.vessel}</div>
                    <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.75)" }}>{a.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "executive" && (
        <ExecutivePortfolioView data={DEMO_FLEET_STATUS.portfolio} />
      )}
    </div>
  );
}
