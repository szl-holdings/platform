import { useState } from "react";
import { Link } from "wouter";
import {
  Activity, AlertTriangle, CheckCircle2, ChevronRight,
  Clock, Eye, Globe, Heart, Radio, Shield, TrendingDown,
  TrendingUp, Zap, BarChart3, Users, FileText, ArrowUpRight,
  Target, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e", panel: "#0e1219" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.06)", accent: "rgba(45,212,191,0.12)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const ELECTRIC = "#2dd4bf";
const ELECTRIC_DIM = "rgba(45,212,191,0.12)";

type PackStatus = "healthy" | "degraded" | "warning" | "offline";

interface PackSignal {
  pack: string;
  label: string;
  color: string;
  status: PackStatus;
  health: number;
  openItems: number;
  criticalCount: number;
  lastSignal: string;
  riskValue: string;
  trend: "up" | "down" | "stable";
}

const PACK_SIGNALS: PackSignal[] = [
  {
    pack: "PRISM",
    label: "Portfolio Intelligence",
    color: "#d4a054",
    status: "warning",
    health: 71,
    openItems: 14,
    criticalCount: 3,
    lastSignal: "4m ago",
    riskValue: "$5.03M",
    trend: "down",
  },
  {
    pack: "Terra",
    label: "Real Estate Intelligence",
    color: "#a07848",
    status: "healthy",
    health: 88,
    openItems: 6,
    criticalCount: 0,
    lastSignal: "11m ago",
    riskValue: "$1.2M",
    trend: "stable",
  },
  {
    pack: "Vessels",
    label: "Fleet Command",
    color: "#38bdf8",
    status: "degraded",
    health: 52,
    openItems: 21,
    criticalCount: 5,
    lastSignal: "2m ago",
    riskValue: "$8.7M",
    trend: "down",
  },
  {
    pack: "Aegis",
    label: "Defense & Intelligence",
    color: "#4f6ef7",
    status: "healthy",
    health: 94,
    openItems: 3,
    criticalCount: 0,
    lastSignal: "28m ago",
    riskValue: "$0.4M",
    trend: "up",
  },
];

const PRESSURE_ITEMS = [
  { pack: "Vessels", title: "Fleet ETA compliance gap — 3 vessels outside SLA", severity: "critical", age: "6h", impact: "$2.1M" },
  { pack: "PRISM", title: "Ownership conflict detected in accounts receivable", severity: "high", age: "14h", impact: "$890K" },
  { pack: "Vessels", title: "Fuel surcharge approval chain stalled", severity: "high", age: "22h", impact: "$450K" },
  { pack: "PRISM", title: "Executive approval pending — Q2 pricing revision", severity: "high", age: "31h", impact: "$1.2M" },
  { pack: "Terra", title: "Lease renewal document missing signature block", severity: "medium", age: "2d", impact: "$320K" },
];

const MOVEMENT_ITEMS = [
  { pack: "Aegis", title: "Security posture audit completed — 94% score", type: "milestone", time: "1h ago" },
  { pack: "Terra", title: "Portfolio appraisal cycle closed — 6 assets reviewed", type: "completion", time: "3h ago" },
  { pack: "PRISM", title: "Q1 executive digest generated and distributed", type: "completion", time: "5h ago" },
  { pack: "Vessels", title: "Vessel M/V Meridian departed — Cape Town bound", type: "event", time: "7h ago" },
  { pack: "Aegis", title: "Threat brief updated — 3 new indicators catalogued", type: "milestone", time: "9h ago" },
];

const PENDING_APPROVALS = [
  { id: "A-1041", title: "Q2 pricing revision — PRISM portfolio", requestedBy: "Operations", age: "31h", urgency: "high" },
  { id: "A-1038", title: "Fuel surcharge rate increase — Vessels fleet", requestedBy: "Fleet Ops", age: "22h", urgency: "high" },
  { id: "A-1033", title: "Terra asset refinancing — Building 7A", requestedBy: "Finance", age: "4d", urgency: "medium" },
  { id: "A-1029", title: "New vendor onboarding — security services", requestedBy: "Aegis", age: "6d", urgency: "low" },
];

function statusColor(s: PackStatus) {
  return s === "healthy" ? "#22c55e" : s === "warning" ? "#d4a054" : s === "degraded" ? "#c45a4a" : "#6b7280";
}

function statusLabel(s: PackStatus) {
  return s === "healthy" ? "Healthy" : s === "warning" ? "Warning" : s === "degraded" ? "Degraded" : "Offline";
}

function SeverityBadge({ sev }: { sev: string }) {
  const cfg: Record<string, { fg: string; bg: string }> = {
    critical: { fg: "#c45a4a", bg: "rgba(196,90,74,0.09)" },
    high: { fg: "#c8953c", bg: "rgba(200,149,60,0.09)" },
    medium: { fg: "#d4a054", bg: "rgba(212,160,84,0.09)" },
    low: { fg: TEXT.tertiary, bg: "rgba(255,255,255,0.04)" },
  };
  const c = cfg[sev] ?? cfg.medium;
  return (
    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ color: c.fg, background: c.bg }}>
      {sev}
    </span>
  );
}

function PackCard({ p }: { p: PackSignal }) {
  const sc = statusColor(p.status);
  const TrendIcon = p.trend === "up" ? TrendingUp : p.trend === "down" ? TrendingDown : Activity;
  return (
    <div className="rounded-md p-3.5 flex flex-col gap-2.5 relative overflow-hidden transition-all hover:border-opacity-30" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${p.color}60, ${p.color}20)` }} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold tracking-wider" style={{ color: p.color }}>{p.pack}</span>
            <span className="w-1 h-1 rounded-full" style={{ background: sc }} />
            <span className="text-[8px]" style={{ color: sc }}>{statusLabel(p.status)}</span>
          </div>
          <p className="text-[9px]" style={{ color: TEXT.secondary }}>{p.label}</p>
        </div>
        <TrendIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: p.trend === "up" ? "#22c55e" : p.trend === "down" ? "#c45a4a" : TEXT.tertiary }} />
      </div>

      <div className="relative h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${p.health}%`, background: `linear-gradient(90deg, ${p.color}80, ${p.color})` }} />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { k: "Health", v: `${p.health}%`, c: p.health > 75 ? "#22c55e" : p.health > 50 ? "#d4a054" : "#c45a4a" },
          { k: "Open", v: String(p.openItems), c: p.openItems > 15 ? "#c45a4a" : TEXT.secondary },
          { k: "Critical", v: String(p.criticalCount), c: p.criticalCount > 0 ? "#c45a4a" : "#22c55e" },
        ].map(r => (
          <div key={r.k} className="rounded p-1.5 text-center" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
            <div className="text-[11px] font-mono font-semibold" style={{ color: r.c }}>{r.v}</div>
            <div className="text-[7px] uppercase tracking-widest mt-0.5" style={{ color: TEXT.muted }}>{r.k}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[8px]">
        <span style={{ color: TEXT.tertiary }}>Risk Value <span className="font-mono" style={{ color: "#c8953c" }}>{p.riskValue}</span></span>
        <span style={{ color: TEXT.muted }}>Signal {p.lastSignal}</span>
      </div>
    </div>
  );
}

export default function ExecutiveCommandPage() {
  const [tab, setTab] = useState<"pressure" | "movement">("pressure");

  const totalRisk = PACK_SIGNALS.reduce((sum, p) => {
    const v = parseFloat(p.riskValue.replace(/[$M]/g, ""));
    return sum + (p.riskValue.includes("M") ? v : v / 1000);
  }, 0);

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ELECTRIC }} />
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: ELECTRIC }}>Executive Command</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>Portfolio Health Overview</h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>Aggregated signals across all intelligence packs — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="rounded px-2.5 py-1.5 text-center" style={{ background: ELECTRIC_DIM, border: `1px solid rgba(45,212,191,0.18)` }}>
            <div className="text-[11px] font-mono font-bold" style={{ color: ELECTRIC }}>{PENDING_APPROVALS.length}</div>
            <div className="text-[7px] uppercase tracking-wider" style={{ color: "rgba(45,212,191,0.55)" }}>Pending Approvals</div>
          </div>
          <div className="rounded px-2.5 py-1.5 text-center" style={{ background: "rgba(196,90,74,0.08)", border: `1px solid rgba(196,90,74,0.14)` }}>
            <div className="text-[11px] font-mono font-bold" style={{ color: "#c45a4a" }}>${totalRisk.toFixed(1)}M</div>
            <div className="text-[7px] uppercase tracking-wider" style={{ color: "rgba(196,90,74,0.55)" }}>At Risk</div>
          </div>
        </div>
      </div>

      {/* Portfolio Health — Pack Status Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[9px] font-medium uppercase tracking-widest" style={{ color: TEXT.muted }}>Pack Signal Summary</span>
          <span className="text-[8px]" style={{ color: TEXT.tertiary }}>Updated live</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {PACK_SIGNALS.map(p => <PackCard key={p.pack} p={p} />)}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Packs", value: "4", sub: "All reporting", icon: Layers, color: ELECTRIC },
          { label: "Healthy", value: String(PACK_SIGNALS.filter(p => p.status === "healthy").length), sub: "of 4 packs", icon: Heart, color: "#22c55e" },
          { label: "Open Signals", value: String(PACK_SIGNALS.reduce((s, p) => s + p.openItems, 0)), sub: "across portfolio", icon: Radio, color: "#d4a054" },
          { label: "Critical Items", value: String(PACK_SIGNALS.reduce((s, p) => s + p.criticalCount, 0)), sub: "require attention", icon: AlertTriangle, color: "#c45a4a" },
        ].map(k => (
          <div key={k.label} className="rounded-md p-3 flex items-center gap-3" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: `${k.color}12` }}>
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
            </div>
            <div>
              <div className="text-base font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
              <div className="text-[9px]" style={{ color: TEXT.secondary }}>{k.label}</div>
              <div className="text-[8px]" style={{ color: TEXT.tertiary }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pressure Board + Movement Board (tabs) */}
      <div className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-0" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
          {(["pressure", "movement"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest transition-colors"
              style={{
                color: tab === t ? TEXT.primary : TEXT.tertiary,
                borderBottom: tab === t ? `2px solid ${ELECTRIC}` : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {t === "pressure" ? "Pressure Board" : "Movement Board"}
            </button>
          ))}
          <div className="ml-auto px-3">
            <Link href={tab === "pressure" ? "/blocker-board" : "/movement-board"}>
              <span className="text-[8px] flex items-center gap-1" style={{ color: TEXT.tertiary }}>
                View all <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>

        <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as any}>
          {tab === "pressure"
            ? PRESSURE_ITEMS.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="w-12 shrink-0">
                    <span className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded" style={{ color: PACK_SIGNALS.find(p => p.pack === item.pack)?.color ?? TEXT.tertiary, background: `${PACK_SIGNALS.find(p => p.pack === item.pack)?.color ?? "#fff"}12` }}>
                      {item.pack}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] truncate" style={{ color: TEXT.primary }}>{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <SeverityBadge sev={item.severity} />
                      <span className="text-[8px] flex items-center gap-1" style={{ color: TEXT.muted }}>
                        <Clock className="w-2.5 h-2.5" /> {item.age}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-mono font-medium" style={{ color: "#c8953c" }}>{item.impact}</span>
                    <div className="text-[7px] uppercase" style={{ color: TEXT.muted }}>impact</div>
                  </div>
                </div>
              ))
            : MOVEMENT_ITEMS.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="w-12 shrink-0">
                    <span className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded" style={{ color: PACK_SIGNALS.find(p => p.pack === item.pack)?.color ?? TEXT.tertiary, background: `${PACK_SIGNALS.find(p => p.pack === item.pack)?.color ?? "#fff"}12` }}>
                      {item.pack}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] truncate" style={{ color: TEXT.primary }}>{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] px-1.5 py-0.5 rounded capitalize" style={{
                        color: item.type === "milestone" ? ELECTRIC : item.type === "completion" ? "#22c55e" : TEXT.secondary,
                        background: item.type === "milestone" ? ELECTRIC_DIM : item.type === "completion" ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
                      }}>{item.type}</span>
                    </div>
                  </div>
                  <span className="text-[8px] shrink-0" style={{ color: TEXT.muted }}>{item.time}</span>
                </div>
              ))
          }
        </div>
      </div>

      {/* Approval Overwatch */}
      <div className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: ELECTRIC }} />
            <span className="text-[11px] font-medium" style={{ color: TEXT.primary }}>Approval Overwatch</span>
            <span className="w-4 h-4 rounded text-[8px] font-mono flex items-center justify-center" style={{ background: "rgba(196,90,74,0.12)", color: "#c45a4a" }}>{PENDING_APPROVALS.length}</span>
          </div>
          <Link href="/approvals">
            <span className="text-[9px] flex items-center gap-1" style={{ color: TEXT.tertiary }}>
              Full console <ArrowUpRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
        <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as any}>
          {PENDING_APPROVALS.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
              <span className="text-[8px] font-mono shrink-0" style={{ color: TEXT.tertiary }}>{a.id}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] truncate" style={{ color: TEXT.secondary }}>{a.title}</p>
                <span className="text-[8px]" style={{ color: TEXT.muted }}>{a.requestedBy}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <SeverityBadge sev={a.urgency} />
                <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{a.age}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { href: "/blocker-board", label: "Blocker Board", icon: AlertTriangle, color: "#c45a4a" },
          { href: "/digest", label: "Digest Center", icon: FileText, color: "#d4a054" },
          { href: "/approvals", label: "Approvals", icon: CheckCircle2, color: ELECTRIC },
          { href: "/trust-audit", label: "Trust & Audit", icon: Shield, color: "#8b7ac8" },
        ].map(link => (
          <Link key={link.href} href={link.href}>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer hover:border-opacity-30 transition-all" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
              <link.icon className="w-3.5 h-3.5 shrink-0" style={{ color: link.color }} />
              <span className="text-[10px] font-medium" style={{ color: TEXT.secondary }}>{link.label}</span>
              <ChevronRight className="w-3 h-3 ml-auto" style={{ color: TEXT.muted }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
