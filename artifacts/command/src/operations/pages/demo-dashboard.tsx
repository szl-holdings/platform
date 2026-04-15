import { useState } from "react";
import { Link } from "wouter";
import {
  Zap, AlertTriangle, CheckCircle2, Clock, TrendingDown, TrendingUp,
  Radio, Workflow, Shield, ChevronRight, Brain, BarChart3, Users,
  Activity, ArrowUpRight, RefreshCw, Target, Eye
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  demoSignals, demoPriorities, demoWorkflows, demoRoleSummaries, demoReadinessItems,
  type DemoSignal
} from "@lyte/lib/demo-seed";
import { varTrend, signalTrend, kpiCards, signals as businessSignals } from "@lyte/lib/business-data";
import { cn } from "@lyte/lib/utils";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e", panel: "#0e1219" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.06)", accent: "rgba(212,160,84,0.12)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };

const SEV_COLORS: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  critical: { text: "#c45a4a", bg: "rgba(196,90,74,0.08)", border: "rgba(196,90,74,0.2)", dot: "#c45a4a" },
  high: { text: "#c8953c", bg: "rgba(200,149,60,0.08)", border: "rgba(200,149,60,0.2)", dot: "#c8953c" },
  medium: { text: "#d4a054", bg: "rgba(212,160,84,0.08)", border: "rgba(212,160,84,0.2)", dot: "#d4a054" },
  low: { text: "#4a90b8", bg: "rgba(74,144,184,0.08)", border: "rgba(74,144,184,0.2)", dot: "#4a90b8" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) {
    const absDiff = -diff;
    const mins = Math.floor(absDiff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    return `in ${Math.floor(hrs / 24)}d`;
  }
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-md overflow-hidden", className)} style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>{children}</div>;
}

function PanelHead({ icon: Icon, title, right, accent }: { icon: React.ElementType; title: string; right?: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: accent ?? TEXT.tertiary }} />
        <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

function SevBadge({ sev }: { sev: string }) {
  const c = SEV_COLORS[sev] ?? SEV_COLORS.medium;
  return <span className="text-[8px] font-mono px-1.5 py-px rounded uppercase tracking-wider" style={{ color: c.text, background: c.bg, border: `1px solid ${c.border}` }}>{sev}</span>;
}

const ROLES = [
  { key: "executive", label: "Executive" },
  { key: "operator", label: "Operator" },
  { key: "manager", label: "Manager" },
  { key: "compliance", label: "Compliance" },
];

export default function DemoDashboard() {
  const [activeRole, setActiveRole] = useState<"executive" | "operator" | "manager" | "compliance">("executive");
  const summary = demoRoleSummaries[activeRole];
  const criticalSignals = demoSignals.filter(s => s.severity === "critical" && s.status === "active");
  const highSignals = demoSignals.filter(s => s.severity === "high" && s.status === "active");
  const topPriorities = demoPriorities.slice(0, 5);
  const stalledWorkflows = demoWorkflows.filter(w => w.status === "stalled").slice(0, 3);
  const readinessScore = Math.round(demoReadinessItems.reduce((a, i) => a + i.score, 0) / demoReadinessItems.length);
  const blockedItems = demoReadinessItems.filter(i => i.status === "blocked").length;

  return (
    <div className="p-4 max-w-[1400px] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Zap className="w-3.5 h-3.5" style={{ color: "#d4a054" }} />
            <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#d4a054" }}>Lyte — Business Observability</span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: TEXT.primary }}>Executive Command Dashboard</h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>Live operational signals — seeded demo data</p>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-md" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
          {ROLES.map(r => (
            <button
              key={r.key}
              onClick={() => setActiveRole(r.key as typeof activeRole)}
              className="text-[10px] px-2.5 py-1.5 rounded transition-all font-medium"
              style={{
                background: activeRole === r.key ? "rgba(212,160,84,0.12)" : "transparent",
                color: activeRole === r.key ? "#d4a054" : TEXT.secondary,
                border: activeRole === r.key ? "1px solid rgba(212,160,84,0.2)" : "1px solid transparent",
              }}
            >{r.label}</button>
          ))}
        </div>
      </div>

      <div className="rounded-md px-4 py-3" style={{ background: "rgba(196,90,74,0.06)", border: "1px solid rgba(196,90,74,0.15)" }}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#c45a4a" }} />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#c45a4a" }}>{summary.title}</span>
            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: TEXT.secondary }}>{summary.headline}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {summary.kpis.map((kpi, i) => {
          const c = SEV_COLORS[kpi.severity] ?? SEV_COLORS.medium;
          const isDown = kpi.trend.startsWith("-") || kpi.trend.includes("M");
          return (
            <Panel key={i}>
              <div className="px-3 py-3">
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: TEXT.muted }}>{kpi.label}</div>
                <div className="text-xl font-bold font-mono mb-1" style={{ color: c.text }}>{kpi.value}</div>
                <div className="flex items-center gap-1">
                  {isDown && kpi.severity !== "stable" ? <TrendingDown className="w-2.5 h-2.5" style={{ color: "#c45a4a" }} /> : <TrendingUp className="w-2.5 h-2.5" style={{ color: "#6b8f71" }} />}
                  <span className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>{kpi.trend}</span>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-3">
          <Panel>
            <PanelHead icon={Radio} title="Active Signals" accent="#c45a4a" right={
              <Link href="/signals" className="flex items-center gap-0.5 text-[9px] font-mono" style={{ color: TEXT.tertiary }}>All signals <ChevronRight className="w-2.5 h-2.5" /></Link>
            } />
            <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
              {[...criticalSignals, ...highSignals].slice(0, 6).map((sig) => {
                const c = SEV_COLORS[sig.severity];
                return (
                  <div key={sig.id} className="px-3 py-2.5 flex items-start gap-2.5 hover:bg-white/[0.02] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ background: c.dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-0.5">
                        <span className="text-[11px] font-medium leading-snug" style={{ color: TEXT.primary }}>{sig.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SevBadge sev={sig.severity} />
                        <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>{sig.source}</span>
                        <span className="text-[9px] font-mono ml-auto" style={{ color: TEXT.muted }}>{timeAgo(sig.detectedAt)}</span>
                      </div>
                    </div>
                    <div className="text-[9px] font-mono shrink-0 text-right" style={{ color: "#c45a4a" }}>{fmt(sig.valueAtRisk)}</div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <PanelHead icon={Target} title="Top Priorities" accent="#d4a054" right={
              <Link href="/priorities" className="flex items-center gap-0.5 text-[9px] font-mono" style={{ color: TEXT.tertiary }}>All priorities <ChevronRight className="w-2.5 h-2.5" /></Link>
            } />
            <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
              {topPriorities.map((pri) => {
                const urgColors: Record<string, string> = { immediate: "#c45a4a", today: "#c8953c", this_week: "#d4a054", next_week: "#4a90b8" };
                return (
                  <div key={pri.id} className="px-3 py-2.5 flex items-center gap-3">
                    <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0" style={{ background: "rgba(212,160,84,0.08)", color: "#d4a054", border: "1px solid rgba(212,160,84,0.15)" }}>
                      {pri.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium truncate" style={{ color: TEXT.primary }}>{pri.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px]" style={{ color: TEXT.muted }}>{pri.owner}</span>
                        <span className="text-[8px] px-1.5 py-px rounded capitalize" style={{ color: urgColors[pri.urgency], background: `${urgColors[pri.urgency]}14`, border: `1px solid ${urgColors[pri.urgency]}25` }}>
                          {pri.urgency.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="text-[9px] font-mono shrink-0" style={{ color: "#6b8f71" }}>{fmt(pri.valueProtected)}</div>
                    <div className="w-12 flex-shrink-0">
                      <div className="text-[7px] text-right mb-0.5 font-mono" style={{ color: TEXT.muted }}>Score</div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pri.totalScore}%`, background: "linear-gradient(90deg, #c8953c, #d4a054)" }} />
                      </div>
                      <div className="text-[7px] text-right mt-0.5 font-mono" style={{ color: TEXT.tertiary }}>{pri.totalScore}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel>
            <PanelHead icon={BarChart3} title="Value at Risk Trend" accent="#d4a054" />
            <div className="px-2 py-2">
              <div className="text-xl font-bold font-mono" style={{ color: "#c45a4a" }}>$17.6M</div>
              <div className="text-[9px] mb-2" style={{ color: TEXT.muted }}>Total value at risk — all active signals</div>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={varTrend} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                  <defs>
                    <linearGradient id="var-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c45a4a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c45a4a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 7, fill: "rgba(255,255,255,0.2)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, color: "#fff" }} formatter={(v: number) => [`$${v}M`, "VAR"]} />
                  <Area type="monotone" dataKey="amount" stroke="#c45a4a" strokeWidth={1.5} fill="url(#var-fill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <PanelHead icon={Workflow} title="Stalled Workflows" accent="#c8953c" right={
              <Link href="/workflows" className="flex items-center gap-0.5 text-[9px] font-mono" style={{ color: TEXT.tertiary }}>View all <ChevronRight className="w-2.5 h-2.5" /></Link>
            } />
            <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
              {stalledWorkflows.map((wf) => (
                <div key={wf.id} className="px-3 py-2.5">
                  <div className="text-[10px] font-medium mb-0.5 leading-snug" style={{ color: TEXT.primary }}>{wf.name}</div>
                  <div className="text-[9px] leading-snug mb-1" style={{ color: TEXT.muted }}>{wf.stallReason?.slice(0, 80)}...</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] px-1.5 py-px rounded" style={{ color: "#c45a4a", background: "rgba(196,90,74,0.1)", border: "1px solid rgba(196,90,74,0.2)" }}>STALLED</span>
                    <span className="text-[9px] font-mono" style={{ color: "#c45a4a" }}>{fmt(wf.valueAtRisk)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHead icon={Shield} title="Readiness Status" accent="#6b8f71" right={
              <Link href="/readiness" className="flex items-center gap-0.5 text-[9px] font-mono" style={{ color: TEXT.tertiary }}>Details <ChevronRight className="w-2.5 h-2.5" /></Link>
            } />
            <div className="px-3 py-3">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <div className="text-2xl font-bold font-mono" style={{ color: readinessScore >= 75 ? "#6b8f71" : readinessScore >= 50 ? "#d4a054" : "#c45a4a" }}>{readinessScore}%</div>
                  <div className="text-[9px]" style={{ color: TEXT.muted }}>Readiness Score</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: "#c45a4a" }}>{blockedItems}</div>
                  <div className="text-[9px]" style={{ color: TEXT.muted }}>Blocked Items</div>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${readinessScore}%`, background: "linear-gradient(90deg, #c45a4a, #d4a054, #6b8f71)" }} />
              </div>
              <div className="space-y-1">
                {demoReadinessItems.filter(i => i.status === "blocked").slice(0, 2).map(item => (
                  <div key={item.id} className="flex items-center gap-1.5 text-[9px]">
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" style={{ color: "#c45a4a" }} />
                    <span className="truncate" style={{ color: TEXT.secondary }}>{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Panel>
          <PanelHead icon={Activity} title="Signal Distribution" accent="#c8953c" />
          <div className="px-3 py-2">
            <ResponsiveContainer width="100%" height={70}>
              <AreaChart data={signalTrend} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                <XAxis dataKey="date" tick={{ fontSize: 7, fill: "rgba(255,255,255,0.2)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", fontSize: 9, color: "#fff" }} />
                <Area type="monotone" dataKey="critical" stroke="#c45a4a" strokeWidth={1} fill="rgba(196,90,74,0.1)" />
                <Area type="monotone" dataKey="high" stroke="#c8953c" strokeWidth={1} fill="rgba(200,149,60,0.08)" />
                <Area type="monotone" dataKey="medium" stroke="#d4a054" strokeWidth={1} fill="rgba(212,160,84,0.05)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-3 mt-1">
              {[["Critical", "#c45a4a", 3], ["High", "#c8953c", 5], ["Medium", "#d4a054", 4]].map(([l, c, v]) => (
                <div key={l as string} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: c as string }} />
                  <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{l} · {v}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHead icon={Brain} title="Top Recommendation" accent="#8b7ac8" right={
            <Link href="/recommendations" className="flex items-center gap-0.5 text-[9px] font-mono" style={{ color: TEXT.tertiary }}>All <ChevronRight className="w-2.5 h-2.5" /></Link>
          } />
          <div className="px-3 py-2.5">
            <div className="text-[10px] font-semibold leading-snug mb-1.5" style={{ color: TEXT.primary }}>Implement parallel legal review for deals &gt;$1M TCV</div>
            <div className="text-[9px] leading-relaxed mb-2" style={{ color: TEXT.secondary }}>
              Reduce approval latency from 14.2 days to 3.2 days. Estimated $1.8M Q1 impact protection.
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: "91%", background: "#8b7ac8" }} />
              </div>
              <span className="text-[8px] font-mono shrink-0" style={{ color: "#8b7ac8" }}>91% confidence</span>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHead icon={Eye} title="PRISM Score" accent="#d4a054" />
          <div className="px-3 py-2.5 grid grid-cols-5 gap-1">
            {[
              { key: "P", label: "Pulse", score: 72, color: "#d4a054" },
              { key: "R", label: "Risk", score: 41, color: "#c45a4a" },
              { key: "I", label: "Intel", score: 68, color: "#8b7ac8" },
              { key: "S", label: "Signals", score: 55, color: "#c8953c" },
              { key: "M", label: "Motion", score: 63, color: "#4a90b8" },
            ].map(p => (
              <div key={p.key} className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: `${p.color}12`, border: `2px solid ${p.color}30`, color: p.color }}>{p.key}</div>
                <div className="text-[9px] font-mono" style={{ color: p.color }}>{p.score}</div>
                <div className="text-[7px]" style={{ color: TEXT.muted }}>{p.label}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
