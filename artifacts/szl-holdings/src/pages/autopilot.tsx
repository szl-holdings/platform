import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, BarChart3, BookOpen, Brain,
  Building, CheckCircle2, ChevronDown, ChevronRight, Circle, Clock, Cpu,
  Globe, Layers, Lightbulb, Radio, RefreshCw, Shield, Ship, Sparkles, Target,
  ThumbsDown, ThumbsUp, TrendingDown, TrendingUp, Users, Zap, X,
} from "lucide-react";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { cn } from "@/lib/utils";
import { MicroFeedbackWidget } from "@szl-holdings/shared-ui/micro-feedback-widget";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "x-requested-with": "XMLHttpRequest" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const body = await res.json();
  return body.data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type MaturityLevel = "missing" | "stub" | "functional" | "polished" | "best-in-class";
type DriftSeverity = "critical" | "warning" | "info";
type FeatureTrend = "rising" | "stable" | "declining" | "dead";
type PlaybookStatus = "not-started" | "in-progress" | "complete";

// ─── Static Data ─────────────────────────────────────────────────────────────

const APPS = [
  { id: "aegis", name: "PARAGON", icon: Shield, accent: "#6366f1" },
  { id: "terra", name: "DOMAINE", icon: Building, accent: "#4d7c0f" },
  { id: "vessels", name: "SEXTANT", icon: Ship, accent: "#3b82f6" },
  { id: "lyte", name: "KORA", icon: Zap, accent: "#f59e0b" },
  { id: "carlota", name: "Carlota Jo", icon: Globe, accent: "#c2a55a" },
  { id: "prism", name: "PRAXIS", icon: Brain, accent: "#a855f7" },
];

const CAPABILITY_CATEGORIES = [
  "Authentication",
  "Dashboard",
  "AI Copilot",
  "Real-Time Data",
  "Export / PDF",
  "Notifications",
  "Search",
  "Analytics",
  "Mobile",
  "Webhooks",
  "Multi-Tenant",
  "Audit Logs",
];

const GENOME: Record<string, Record<string, MaturityLevel>> = {};

const MATURITY_META: Record<MaturityLevel, { label: string; color: string; bg: string; score: number }> = {
  "missing":      { label: "Missing",       color: "#374151", bg: "hsla(220,15%,15%,0.4)",    score: 0 },
  "stub":         { label: "Stub",          color: "#92400e", bg: "hsla(30,80%,20%,0.4)",      score: 1 },
  "functional":   { label: "Functional",    color: "#1d4ed8", bg: "hsla(220,72%,22%,0.5)",     score: 2 },
  "polished":     { label: "Polished",      color: "#065f46", bg: "hsla(160,60%,18%,0.5)",     score: 3 },
  "best-in-class":{ label: "Best-in-Class", color: "#7c3aed", bg: "hsla(265,70%,22%,0.5)",     score: 4 },
};

const DRIFT_ALERTS = [
  { id: "d1", severity: "critical" as DriftSeverity, app: "Carlota Jo", metric: "Data Freshness", detail: "Real-time feed last updated 3h 42m ago — exceeds 1hr threshold.", recommendation: "Reconnect the CRM sync pipeline and add a freshness watchdog to alert at >30m stale.", timestamp: "4 min ago" },
  { id: "d2", severity: "warning" as DriftSeverity, app: "DOMAINE", metric: "API Latency", detail: "/api/terra/distress-engine P95 at 2.4s — 20% above 2s threshold.", recommendation: "Add a DB index on distress_score + borough. Current query does a full table scan.", timestamp: "11 min ago" },
  { id: "d3", severity: "warning" as DriftSeverity, app: "PRAXIS", metric: "Webhooks", detail: "Webhooks capability rated Stub — no production delivery confirmed in 7 days.", recommendation: "Implement PRISM outbound webhook dispatch using the existing webhook-engine lib.", timestamp: "2 hr ago" },
  { id: "d4", severity: "info" as DriftSeverity, app: "PARAGON", metric: "Bundle Size", detail: "Main bundle grew 8.3% this week (1.24MB → 1.34MB). Approaching 10% threshold.", recommendation: "Code-split the MITRE ATT&CK matrix — it's 280KB and loaded eagerly on all routes.", timestamp: "6 hr ago" },
  { id: "d5", severity: "info" as DriftSeverity, app: "Carlota Jo", metric: "Webhooks", detail: "Webhooks capability listed as Missing — no implementation found.", recommendation: "Use the shared webhook-engine to add outbound hooks for client milestone events.", timestamp: "1 day ago" },
];

const FEATURE_USAGE = [
  { app: "KORA", feature: "AI Signal Summarizer", uses: 1420, trend: "rising" as FeatureTrend, delta: "+34%" },
  { app: "PARAGON", feature: "Threat Feed Dashboard", uses: 980, trend: "rising" as FeatureTrend, delta: "+18%" },
  { app: "SEXTANT", feature: "Voyage Economics", uses: 762, trend: "stable" as FeatureTrend, delta: "+2%" },
  { app: "DOMAINE", feature: "Distress Engine", uses: 640, trend: "rising" as FeatureTrend, delta: "+21%" },
  { app: "KORA", feature: "APM Trace Explorer", uses: 430, trend: "stable" as FeatureTrend, delta: "-1%" },
  { app: "PARAGON", feature: "MITRE ATT&CK Map", uses: 290, trend: "declining" as FeatureTrend, delta: "-14%" },
  { app: "PRAXIS", feature: "Matter Timeline", uses: 210, trend: "stable" as FeatureTrend, delta: "+5%" },
  { app: "DOMAINE", feature: "Ownership Graph", uses: 180, trend: "declining" as FeatureTrend, delta: "-22%" },
  { app: "Carlota Jo", feature: "Estate Report PDF", uses: 94, trend: "stable" as FeatureTrend, delta: "+3%" },
  { app: "PARAGON", feature: "Adversary Emulation Wizard", uses: 28, trend: "dead" as FeatureTrend, delta: "-61%" },
  { app: "KORA", feature: "SCIM Provisioning UI", uses: 12, trend: "dead" as FeatureTrend, delta: "-40%" },
  { app: "SEXTANT", feature: "Charter Rate Benchmarks", uses: 8, trend: "dead" as FeatureTrend, delta: "-73%" },
];

const FEEDBACK_SIGNALS = [
  { app: "KORA", feature: "AI Signal Summarizer", thumbsUp: 142, thumbsDown: 9, topComment: "Saves me 20 minutes every morning. Keep it." },
  { app: "SEXTANT", feature: "Voyage Economics", thumbsUp: 89, thumbsDown: 4, topComment: "The fuel cost estimator is accurate now." },
  { app: "DOMAINE", feature: "Distress Engine", thumbsUp: 76, thumbsDown: 12, topComment: "Would love filtering by borough on the map." },
  { app: "PARAGON", feature: "Threat Feed Dashboard", thumbsUp: 61, thumbsDown: 3, topComment: "Clean. The priority scoring is spot on." },
  { app: "PRAXIS", feature: "Matter Timeline", thumbsUp: 44, thumbsDown: 7, topComment: "Timeline needs event grouping by date." },
  { app: "Carlota Jo", feature: "Estate Report PDF", thumbsUp: 38, thumbsDown: 2, topComment: "Client loved the layout. Very professional." },
  { app: "PARAGON", feature: "Adversary Emulation Wizard", thumbsUp: 6, thumbsDown: 18, topComment: "Confusing UX — 3 steps to get to the actual config." },
];

const PERF_BUDGETS = [
  { app: "KORA", bundleBudgetKB: 800, bundleActualKB: 734, latencyBudgetMs: 1500, latencyActualMs: 820, ttiMs: 1100 },
  { app: "PARAGON", bundleBudgetKB: 900, bundleActualKB: 1340, latencyBudgetMs: 2000, latencyActualMs: 1740, ttiMs: 1800 },
  { app: "SEXTANT", bundleBudgetKB: 700, bundleActualKB: 610, latencyBudgetMs: 1800, latencyActualMs: 1020, ttiMs: 1300 },
  { app: "DOMAINE", bundleBudgetKB: 850, bundleActualKB: 790, latencyBudgetMs: 2000, latencyActualMs: 2420, ttiMs: 2600 },
  { app: "PRAXIS", bundleBudgetKB: 650, bundleActualKB: 490, latencyBudgetMs: 1500, latencyActualMs: 1100, ttiMs: 1400 },
  { app: "Carlota Jo", bundleBudgetKB: 500, bundleActualKB: 380, latencyBudgetMs: 1200, latencyActualMs: 940, ttiMs: 1100 },
];

const PLAYBOOKS = [
  { id: "p1", domain: "Carlota Jo", name: "Client Onboarding", steps: 8, completionRate: 84, avgDurationMin: 22, status: "complete" as PlaybookStatus, lastRun: "2 days ago", bottleneck: "Step 4: Contract sign-off (avg 6 min)" },
  { id: "p2", domain: "PARAGON", name: "Incident Response", steps: 12, completionRate: 91, avgDurationMin: 41, status: "complete" as PlaybookStatus, lastRun: "14 hr ago", bottleneck: "Step 7: Escalation approval (avg 11 min)" },
  { id: "p3", domain: "SEXTANT", name: "Vessel Inspection", steps: 6, completionRate: 77, avgDurationMin: 18, status: "in-progress" as PlaybookStatus, lastRun: "4 hr ago", bottleneck: "Step 5: Photo upload (avg 4 min)" },
  { id: "p4", domain: "DOMAINE", name: "Property Due Diligence", steps: 10, completionRate: 68, avgDurationMin: 55, status: "in-progress" as PlaybookStatus, lastRun: "1 day ago", bottleneck: "Step 6: Ownership verification (avg 18 min)" },
  { id: "p5", domain: "PRAXIS", name: "Matter Intake", steps: 7, completionRate: 88, avgDurationMin: 14, status: "complete" as PlaybookStatus, lastRun: "6 hr ago", bottleneck: "Step 3: Conflict check (avg 3 min)" },
  { id: "p6", domain: "SZL Holdings", name: "LP Quarterly Update", steps: 9, completionRate: 55, avgDurationMin: 90, status: "not-started" as PlaybookStatus, lastRun: "Never", bottleneck: "Not yet run — template ready" },
];

const COMPETITIVE_RADAR = [
  {
    app: "PARAGON",
    accent: "#6366f1",
    competitors: ["CrowdStrike", "Palo Alto", "SentinelOne"],
    axes: ["SOC Command", "Threat Intel", "MSP Ops", "AI Integration", "API Coverage", "UX Quality"],
    us:        [90, 75, 88, 92, 80, 85],
    competitor: [95, 90, 70, 60, 85, 80],
    weHave: ["Unified SOC+MSP+AI in one surface", "Agentic cortex", "Client management"],
    theyHave: ["Broader threat intel feeds", "MDR services", "Larger partner ecosystem"],
  },
  {
    app: "DOMAINE",
    accent: "#4d7c0f",
    competitors: ["CoStar", "ATTOM", "PropStream"],
    axes: ["Distress Engine", "NYC Depth", "Deal Pipeline", "Map UX", "Data Freshness", "AI Insights"],
    us:        [92, 88, 80, 85, 70, 82],
    competitor: [60, 55, 50, 75, 95, 40],
    weHave: ["Multi-factor distress scoring", "Ownership graph", "AI-driven signals"],
    theyHave: ["National data coverage", "Historical depth >10yr", "Broader integrations"],
  },
];

const NEXT_BEST_ACTIONS = [
  {
    rank: 1,
    title: "Fix Carlota Jo real-time data pipeline",
    app: "Carlota Jo",
    accent: "#c2a55a",
    why: "Feed stale >3hr (Drift alert critical). Feedback NPS neutral. No usage growth possible with stale data.",
    effort: "Low",
    impact: "High",
    signals: ["Drift: data freshness critical", "Usage: stale data blocks growth", "Genome: Real-Time rated Stub"],
  },
  {
    rank: 2,
    title: "Code-split Aegis bundle (MITRE ATT&CK module)",
    app: "PARAGON",
    accent: "#6366f1",
    why: "Bundle at 1.34MB vs 900KB budget. MITRE module is 280KB loaded eagerly. User feedback on Adversary Wizard is negative — simplify UX simultaneously.",
    effort: "Medium",
    impact: "High",
    signals: ["Budget: bundle 49% over", "Feedback: Adversary Wizard 6↑ / 18↓", "Usage: declining -61%"],
  },
  {
    rank: 3,
    title: "Add Terra distress engine borough filter",
    app: "DOMAINE",
    accent: "#4d7c0f",
    why: "Top user feedback request. Usage rising +21% but would accelerate with this UX improvement. Competitive gap vs CoStar on map UX.",
    effort: "Low",
    impact: "Medium",
    signals: ["Feedback: top request from 12 users", "Usage: rising +21%", "Radar: map UX gap vs CoStar"],
  },
  {
    rank: 4,
    title: "Implement PRISM & Carlota Jo webhooks",
    app: "PRISM + Carlota Jo",
    accent: "#a855f7",
    why: "Both rated Stub/Missing in Genome. Competitors all support webhook delivery. Blocks enterprise integrations.",
    effort: "Low",
    impact: "Medium",
    signals: ["Genome: Webhooks missing/stub", "Competitive: all 3 competitors support webhooks", "Drift: attention card open 7d"],
  },
  {
    rank: 5,
    title: "Fix Terra API latency (distress engine index)",
    app: "DOMAINE",
    accent: "#4d7c0f",
    why: "P95 at 2.4s vs 2s budget. Full table scan identified. Straightforward index fix. Unlocks perception of speed for rising user base.",
    effort: "Low",
    impact: "High",
    signals: ["Drift: API latency warning", "Budget: latency 21% over", "Usage: 640 weekly, rising"],
  },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.5rem 1rem",
        fontSize: "12px",
        fontWeight: 600,
        borderRadius: "0.5rem",
        border: "1px solid",
        borderColor: active ? "hsla(265,70%,60%,0.4)" : "hsla(0,0%,100%,0.06)",
        background: active ? "hsla(265,70%,60%,0.12)" : "hsla(0,0%,100%,0.02)",
        color: active ? "hsl(265,70%,80%)" : "hsl(210,5%,52%)",
        cursor: "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "hsla(0,0%,100%,0.025)",
      border: "1px solid hsla(0,0%,100%,0.06)",
      borderRadius: "0.875rem",
      padding: "1.25rem",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,38%)", marginBottom: "0.75rem" }}>
      {children}
    </p>
  );
}

function EffortBadge({ effort }: { effort: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    Low: { bg: "hsla(160,60%,18%,0.6)", color: "#10b981" },
    Medium: { bg: "hsla(38,80%,18%,0.6)", color: "#f59e0b" },
    High: { bg: "hsla(0,60%,18%,0.6)", color: "#f43f5e" },
  };
  const c = colors[effort] || colors.Medium;
  return (
    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: c.bg, color: c.color }}>
      {effort} effort
    </span>
  );
}

// ─── Tab: Ecosystem Genome ────────────────────────────────────────────────────

function GenomeTab() {
  const [hovered, setHovered] = useState<{ app: string; cap: string } | null>(null);

  const { data: genomeApi } = useStandardQuery({
    queryKey: ["autopilot", "genome"],
    queryFn: () => apiFetch<{ genome: Record<string, Record<string, MaturityLevel>>; score: number; gaps: number; bestInClass: number; capabilities: number }>("/autopilot/genome"),
    staleTime: 60_000,
  });

  const activeGenome = genomeApi?.genome ?? GENOME;

  const liveApps = useMemo(() =>
    genomeApi?.genome
      ? APPS.filter(a => a.id in genomeApi.genome)
      : APPS,
    [genomeApi]
  );

  const totalScore = useMemo(() => {
    if (genomeApi?.score !== undefined) return genomeApi.score;
    let total = 0;
    let max = 0;
    Object.values(activeGenome).forEach(appCaps => {
      Object.values(appCaps).forEach(level => {
        total += MATURITY_META[level as MaturityLevel]?.score ?? 0;
        max += 4;
      });
    });
    return max > 0 ? Math.round((total / max) * 100) : 0;
  }, [activeGenome, genomeApi]);

  const gapCount = useMemo(() =>
    genomeApi?.gaps ?? Object.values(activeGenome).flatMap(a => Object.values(a)).filter(l => l === "missing" || l === "stub").length,
    [activeGenome, genomeApi]
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Genome Score", value: `${totalScore}%`, sub: "weighted maturity", color: "#7c3aed" },
          { label: "Capabilities", value: `${liveApps.length * CAPABILITY_CATEGORIES.length}`, sub: "mapped data points", color: "#3b82f6" },
          { label: "Gaps Found", value: `${gapCount}`, sub: "missing or stub", color: "#f43f5e" },
          { label: "Best-in-Class", value: `${genomeApi?.bestInClass ?? Object.values(activeGenome).flatMap(a => Object.values(a)).filter(l => l === "best-in-class").length}`, sub: "capabilities", color: "#10b981" },
        ].map(m => (
          <Card key={m.label}>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.375rem" }}>{m.label}</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color, letterSpacing: "-0.02em" }}>{m.value}</p>
            <p style={{ fontSize: "11px", color: "hsl(210,5%,48%)" }}>{m.sub}</p>
          </Card>
        ))}
      </div>

      <Card>
        <SectionLabel>Capability Genome — Maturity Heatmap</SectionLabel>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontSize: "10px", fontWeight: 600, color: "hsl(210,5%,40%)", whiteSpace: "nowrap" }}>Capability</th>
                {liveApps.map(app => (
                  <th key={app.id} style={{ textAlign: "center", padding: "0.5rem 0.5rem", fontSize: "10px", fontWeight: 600, color: app.accent, whiteSpace: "nowrap" }}>
                    {app.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPABILITY_CATEGORIES.map((cap, ci) => (
                <tr key={cap} style={{ borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
                  <td style={{ padding: "0.5rem 0.75rem", fontSize: "11.5px", color: "hsl(210,5%,62%)", whiteSpace: "nowrap" }}>{cap}</td>
                  {liveApps.map(app => {
                    const level = activeGenome[app.id]?.[cap] ?? "missing";
                    const meta = MATURITY_META[level];
                    const isHov = hovered?.app === app.id && hovered?.cap === cap;
                    return (
                      <td key={app.id} style={{ textAlign: "center", padding: "0.35rem 0.5rem" }}>
                        <div
                          onMouseEnter={() => setHovered({ app: app.id, cap })}
                          onMouseLeave={() => setHovered(null)}
                          title={`${app.name} · ${cap}: ${meta.label}`}
                          style={{
                            display: "inline-block",
                            width: "80px",
                            padding: "3px 6px",
                            borderRadius: "4px",
                            background: meta.bg,
                            fontSize: "9px",
                            fontWeight: 600,
                            color: meta.color,
                            cursor: "default",
                            transform: isHov ? "scale(1.08)" : "scale(1)",
                            transition: "transform 0.1s ease",
                            border: `1px solid ${meta.color}30`,
                          }}
                        >
                          {meta.label}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", gap: "1.25rem", marginTop: "1rem", flexWrap: "wrap" }}>
          {(Object.entries(MATURITY_META) as [MaturityLevel, typeof MATURITY_META[MaturityLevel]][]).map(([level, meta]) => (
            <div key={level} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: meta.bg, border: `1px solid ${meta.color}40` }} />
              <span style={{ fontSize: "10px", color: "hsl(210,5%,48%)" }}>{meta.label}</span>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
        <MicroFeedbackWidget featureId="capability-genome" featureName="Capability Genome Heatmap" app="szl-holdings" compact prompt="Is this genome map useful?" />
      </div>
    </div>
  );
}

// ─── Tab: Drift Detection ─────────────────────────────────────────────────────

function DriftTab() {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data: driftApi } = useStandardQuery({
    queryKey: ["autopilot", "drift-alerts"],
    queryFn: () => apiFetch<{ alerts: typeof DRIFT_ALERTS }>("/autopilot/drift-alerts"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const allAlerts = driftApi?.alerts ?? DRIFT_ALERTS;
  const visible = allAlerts.filter(a => !dismissed.includes(a.id));

  const SMAP: Record<DriftSeverity, { color: string; bg: string; label: string }> = {
    critical: { color: "#f43f5e", bg: "hsla(350,80%,15%,0.6)", label: "Critical" },
    warning:  { color: "#f59e0b", bg: "hsla(38,80%,14%,0.6)", label: "Warning" },
    info:     { color: "#60a5fa", bg: "hsla(214,72%,14%,0.6)", label: "Info" },
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "hsl(38,12%,90%)" }}>Drift Detection Engine</p>
          <p style={{ fontSize: "12px", color: "hsl(210,5%,50%)" }}>{visible.length} active attention cards — auto-cleared when thresholds normalize</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["critical", "warning", "info"] as DriftSeverity[]).map(s => {
            const count = visible.filter(a => a.severity === s).length;
            return (
              <span key={s} style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: SMAP[s].bg, color: SMAP[s].color }}>
                {count} {SMAP[s].label}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {visible.map(alert => {
          const s = SMAP[alert.severity];
          return (
            <m.div
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: s.bg,
                border: `1px solid ${s.color}25`,
                borderLeft: `3px solid ${s.color}`,
                borderRadius: "0.75rem",
                padding: "1rem 1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: s.color }}>{s.label.toUpperCase()}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "hsl(38,12%,88%)" }}>{alert.app}</span>
                    <span style={{ fontSize: "10px", color: "hsl(210,5%,44%)" }}>·</span>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "hsl(210,5%,52%)" }}>{alert.metric}</span>
                    <span style={{ fontSize: "10px", color: "hsl(210,5%,36%)", marginLeft: "auto" }}>{alert.timestamp}</span>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "hsl(38,12%,78%)", marginBottom: "0.625rem", lineHeight: 1.5 }}>{alert.detail}</p>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <Lightbulb size={11} style={{ color: "#f59e0b", marginTop: "2px", flexShrink: 0 }} />
                    <p style={{ fontSize: "11.5px", color: "hsl(38,40%,62%)", lineHeight: 1.5 }}>{alert.recommendation}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDismissed(d => [...d, alert.id])}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(210,5%,38%)", padding: "2px", flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            </m.div>
          );
        })}
        {visible.length === 0 && (
          <Card style={{ textAlign: "center", padding: "3rem" }}>
            <CheckCircle2 size={32} style={{ color: "#10b981", margin: "0 auto 0.75rem" }} />
            <p style={{ fontSize: "14px", fontWeight: 600, color: "hsl(38,12%,88%)" }}>All systems within thresholds</p>
            <p style={{ fontSize: "12px", color: "hsl(210,5%,50%)" }}>No drift detected across API latency, bundle size, data freshness, or error rates.</p>
          </Card>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
        <MicroFeedbackWidget featureId="drift-detection" featureName="Drift Detection Engine" app="szl-holdings" compact prompt="Are these drift alerts actionable?" />
      </div>
    </div>
  );
}

// ─── Tab: Feature Usage Intelligence ─────────────────────────────────────────

function UsageTab() {
  const TREND_META: Record<FeatureTrend, { icon: React.ElementType; color: string; label: string }> = {
    rising:   { icon: TrendingUp,   color: "#10b981", label: "Rising" },
    stable:   { icon: Activity,     color: "#60a5fa", label: "Stable" },
    declining:{ icon: TrendingDown, color: "#f59e0b", label: "Declining" },
    dead:     { icon: Radio,        color: "#6b7280", label: "Dead" },
  };

  const { data: usageApi } = useStandardQuery({
    queryKey: ["autopilot", "feature-usage"],
    queryFn: () => apiFetch<{ features: typeof FEATURE_USAGE; windowDays: number }>("/autopilot/feature-usage"),
    staleTime: 120_000,
  });

  const activeUsage = usageApi?.features ?? FEATURE_USAGE;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {(["rising", "stable", "declining", "dead"] as FeatureTrend[]).map(t => {
          const meta = TREND_META[t];
          const count = activeUsage.filter(f => f.trend === t).length;
          const Icon = meta.icon;
          return (
            <Card key={t} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${meta.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={16} style={{ color: meta.color }} />
              </div>
              <div>
                <p style={{ fontSize: "1.25rem", fontWeight: 700, color: meta.color, letterSpacing: "-0.02em" }}>{count}</p>
                <p style={{ fontSize: "10px", color: "hsl(210,5%,48%)" }}>{meta.label} features</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <SectionLabel>Feature Value Leaderboard — Weekly Interactions</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {activeUsage.map((f, i) => {
            const meta = TREND_META[f.trend];
            const Icon = meta.icon;
            const maxUses = activeUsage[0]?.uses ?? 1;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.625rem 0", borderBottom: i < activeUsage.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "hsl(210,5%,30%)", width: "20px", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div>
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "hsl(38,12%,88%)" }}>{f.feature}</span>
                      <span style={{ fontSize: "10px", color: "hsl(210,5%,44%)", marginLeft: "0.5rem" }}>{f.app}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: meta.color }}>{f.delta}</span>
                      <Icon size={12} style={{ color: meta.color }} />
                      <span style={{ fontSize: "11px", color: "hsl(210,5%,48%)" }}>{f.uses.toLocaleString()} uses</span>
                    </div>
                  </div>
                  <div style={{ height: "4px", background: "hsla(0,0%,100%,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(f.uses / maxUses) * 100}%`, background: meta.color, borderRadius: "2px", opacity: 0.7 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: User Signal Dashboard ───────────────────────────────────────────────

function FeedbackTab() {
  const { data: feedbackApi } = useStandardQuery({
    queryKey: ["autopilot", "feedback-signals"],
    queryFn: () => apiFetch<{ signals: typeof FEEDBACK_SIGNALS }>("/autopilot/feedback-signals"),
    staleTime: 60_000,
  });
  const activeFeedback = feedbackApi?.signals ?? FEEDBACK_SIGNALS;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Signals", value: `${activeFeedback.reduce((a, f) => a + f.thumbsUp + f.thumbsDown, 0)}`, color: "#7c3aed" },
          { label: "Positive Rate", value: `${activeFeedback.reduce((a, f) => a + f.thumbsUp + f.thumbsDown, 0) > 0 ? Math.round(activeFeedback.reduce((a, f) => a + f.thumbsUp, 0) / activeFeedback.reduce((a, f) => a + f.thumbsUp + f.thumbsDown, 0) * 100) : 0}%`, color: "#10b981" },
          { label: "Features Covered", value: `${activeFeedback.length}`, color: "#60a5fa" },
        ].map(m => (
          <Card key={m.label}>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.375rem" }}>{m.label}</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color, letterSpacing: "-0.02em" }}>{m.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <SectionLabel>User Signal Dashboard — Feedback per Feature</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[...activeFeedback].sort((a, b) => (b.thumbsUp - b.thumbsDown) - (a.thumbsUp - a.thumbsDown)).map((f, i) => {
            const total = f.thumbsUp + f.thumbsDown;
            const posRate = Math.round((f.thumbsUp / total) * 100);
            const sentiment = posRate >= 80 ? "#10b981" : posRate >= 60 ? "#f59e0b" : "#f43f5e";
            return (
              <div key={i} style={{ padding: "0.875rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "0.625rem", border: "1px solid hsla(0,0%,100%,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,88%)" }}>{f.feature}</span>
                    <span style={{ fontSize: "10px", color: "hsl(210,5%,44%)", marginLeft: "0.5rem" }}>{f.app}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <ThumbsUp size={12} style={{ color: "#10b981" }} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#10b981" }}>{f.thumbsUp}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <ThumbsDown size={12} style={{ color: "#f43f5e" }} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#f43f5e" }}>{f.thumbsDown}</span>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: sentiment, padding: "2px 8px", borderRadius: "20px", background: `${sentiment}18` }}>{posRate}% positive</span>
                  </div>
                </div>
                <div style={{ height: "5px", background: "hsla(0,0%,100%,0.06)", borderRadius: "3px", overflow: "hidden", marginBottom: "0.5rem" }}>
                  <div style={{ height: "100%", width: `${posRate}%`, background: sentiment, borderRadius: "3px" }} />
                </div>
                {f.topComment && (
                  <p style={{ fontSize: "11px", color: "hsl(210,5%,52%)", fontStyle: "italic" }}>
                    "{f.topComment}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Performance Budget ──────────────────────────────────────────────────

function BudgetTab() {
  const { data: budgetApi } = useStandardQuery({
    queryKey: ["autopilot", "performance-budgets"],
    queryFn: () => apiFetch<{ budgets: typeof PERF_BUDGETS }>("/autopilot/performance-budgets"),
    staleTime: 120_000,
  });
  const activeBudgets = budgetApi?.budgets ?? PERF_BUDGETS;

  function BudgetGauge({ label, actual, budget, unit }: { label: string; actual: number; budget: number; unit: string }) {
    const pct = Math.min((actual / budget) * 100, 150);
    const over = actual > budget;
    const color = over ? "#f43f5e" : pct > 80 ? "#f59e0b" : "#10b981";
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontSize: "11px", color: "hsl(210,5%,52%)" }}>{label}</span>
          <span style={{ fontSize: "11px", fontWeight: 600, color }}>
            {actual}{unit} / {budget}{unit} {over ? "🔴" : ""}
          </span>
        </div>
        <div style={{ height: "6px", background: "hsla(0,0%,100%,0.06)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: "3px" }} />
        </div>
      </div>
    );
  }

  const overBudget = activeBudgets.filter(b => b.bundleActualKB > b.bundleBudgetKB || b.latencyActualMs > b.latencyBudgetMs);

  return (
    <div>
      {overBudget.length > 0 && (
        <div style={{ padding: "0.875rem 1.25rem", background: "hsla(350,80%,15%,0.4)", border: "1px solid hsla(350,80%,35%,0.2)", borderRadius: "0.75rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <AlertTriangle size={16} style={{ color: "#f43f5e", flexShrink: 0 }} />
          <p style={{ fontSize: "12.5px", color: "hsl(38,12%,82%)" }}>
            <strong style={{ color: "#f43f5e" }}>{overBudget.map(b => b.app).join(", ")}</strong> exceed their performance budgets and require attention.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
        {activeBudgets.map(b => {
          const bundleOver = b.bundleActualKB > b.bundleBudgetKB;
          const latencyOver = b.latencyActualMs > b.latencyBudgetMs;
          const hasIssue = bundleOver || latencyOver;
          return (
            <Card key={b.app} style={{ borderColor: hasIssue ? "hsla(350,80%,35%,0.25)" : "hsla(0,0%,100%,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,90%)" }}>{b.app}</p>
                {hasIssue
                  ? <span style={{ fontSize: "9px", fontWeight: 700, color: "#f43f5e", padding: "2px 7px", borderRadius: "20px", background: "hsla(350,80%,15%,0.6)" }}>OVER BUDGET</span>
                  : <span style={{ fontSize: "9px", fontWeight: 700, color: "#10b981", padding: "2px 7px", borderRadius: "20px", background: "hsla(160,60%,15%,0.6)" }}>ON BUDGET</span>
                }
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <BudgetGauge label="Bundle Size" actual={b.bundleActualKB} budget={b.bundleBudgetKB} unit="KB" />
                <BudgetGauge label="API Latency (P95)" actual={b.latencyActualMs} budget={b.latencyBudgetMs} unit="ms" />
                <BudgetGauge label="Time to Interactive" actual={b.ttiMs} budget={b.latencyBudgetMs * 1.4} unit="ms" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Workflow Playbooks ──────────────────────────────────────────────────

function PlaybooksTab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: playbooksApi } = useStandardQuery({
    queryKey: ["autopilot", "playbooks"],
    queryFn: () => apiFetch<{ playbooks: typeof PLAYBOOKS }>("/autopilot/playbooks"),
    staleTime: 120_000,
  });
  const activePlaybooks = playbooksApi?.playbooks ?? PLAYBOOKS;

  const STATUS_META: Record<PlaybookStatus, { color: string; label: string }> = {
    "complete":     { color: "#10b981", label: "Complete" },
    "in-progress":  { color: "#f59e0b", label: "In Progress" },
    "not-started":  { color: "#6b7280", label: "Not Started" },
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {activePlaybooks.map(p => {
          const sm = STATUS_META[p.status];
          const isOpen = expanded === p.id;
          return (
            <Card key={p.id}>
              <div
                onClick={() => setExpanded(isOpen ? null : p.id)}
                style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 700, color: "hsl(38,12%,90%)" }}>{p.name}</p>
                    <span style={{ fontSize: "10px", color: "hsl(210,5%,44%)" }}>{p.domain}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontSize: "10px", color: sm.color, fontWeight: 600 }}>{sm.label}</span>
                    <span style={{ fontSize: "10px", color: "hsl(210,5%,44%)" }}>{p.steps} steps</span>
                    <span style={{ fontSize: "10px", color: "hsl(210,5%,44%)" }}>avg {p.avgDurationMin}min</span>
                    <span style={{ fontSize: "10px", color: "hsl(210,5%,44%)" }}>last run: {p.lastRun}</span>
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <p style={{ fontSize: "18px", fontWeight: 700, color: p.completionRate >= 80 ? "#10b981" : p.completionRate >= 60 ? "#f59e0b" : "#f43f5e" }}>{p.completionRate}%</p>
                  <p style={{ fontSize: "9px", color: "hsl(210,5%,40%)" }}>completion</p>
                </div>
                {isOpen ? <ChevronDown size={14} style={{ color: "hsl(210,5%,40%)", flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: "hsl(210,5%,40%)", flexShrink: 0 }} />}
              </div>

              {isOpen && (
                <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid hsla(0,0%,100%,0.05)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <p style={{ fontSize: "10px", fontWeight: 600, color: "hsl(210,5%,38%)", marginBottom: "0.375rem" }}>BOTTLENECK</p>
                      <p style={{ fontSize: "12px", color: "#f59e0b" }}>{p.bottleneck}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "10px", fontWeight: 600, color: "hsl(210,5%,38%)", marginBottom: "0.375rem" }}>COMPLETION RATE</p>
                      <div style={{ height: "8px", background: "hsla(0,0%,100%,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p.completionRate}%`, background: p.completionRate >= 80 ? "#10b981" : "#f59e0b", borderRadius: "4px" }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                    <button style={{ fontSize: "11px", fontWeight: 600, padding: "6px 14px", borderRadius: "6px", background: "hsla(265,70%,60%,0.15)", border: "1px solid hsla(265,70%,60%,0.25)", color: "#a78bfa", cursor: "pointer" }}>
                      Run Playbook
                    </button>
                    <button style={{ fontSize: "11px", fontWeight: 600, padding: "6px 14px", borderRadius: "6px", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.06)", color: "hsl(210,5%,60%)", cursor: "pointer" }}>
                      View Steps
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Competitive Radar ───────────────────────────────────────────────────

function RadarTab() {
  const [selected, setSelected] = useState(0);

  const { data: radarApi } = useStandardQuery({
    queryKey: ["autopilot", "competitive-radar"],
    queryFn: () => apiFetch<{ radar: typeof COMPETITIVE_RADAR }>("/autopilot/competitive-radar"),
    staleTime: 300_000,
  });
  const activeRadar = radarApi?.radar ?? COMPETITIVE_RADAR;
  const app = activeRadar[selected] ?? activeRadar[0];

  const SIZE = 220;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 90;
  const n = app.axes.length;

  function polarToXY(angle: number, r: number) {
    const a = (angle - 90) * (Math.PI / 180);
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
  }

  function buildPath(values: number[]) {
    return values.map((v, i) => {
      const { x, y } = polarToXY((360 / n) * i, (v / 100) * R);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ") + " Z";
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {activeRadar.map((r, i) => (
          <TabButton key={r.app} active={selected === i} onClick={() => setSelected(i)}>
            {r.app}
          </TabButton>
        ))}
        <span style={{ fontSize: "11px", color: "hsl(210,5%,40%)", alignSelf: "center", marginLeft: "0.5rem" }}>
          + {APPS.length - activeRadar.length} more apps (radar pending)
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.5rem", alignItems: "start" }}>
        <Card style={{ textAlign: "center" }}>
          <svg width={SIZE} height={SIZE}>
            {[0.25, 0.5, 0.75, 1].map(scale => (
              <polygon
                key={scale}
                points={Array.from({ length: n }, (_, i) => {
                  const { x, y } = polarToXY((360 / n) * i, R * scale);
                  return `${x},${y}`;
                }).join(" ")}
                fill="none"
                stroke="hsla(0,0%,100%,0.07)"
                strokeWidth="1"
              />
            ))}
            {Array.from({ length: n }, (_, i) => {
              const { x, y } = polarToXY((360 / n) * i, R);
              return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="hsla(0,0%,100%,0.06)" strokeWidth="1" />;
            })}
            <path d={buildPath(app.competitor)} fill="hsla(210,80%,60%,0.08)" stroke="#3b82f6" strokeWidth="1.5" />
            <path d={buildPath(app.us)} fill={`${app.accent}22`} stroke={app.accent} strokeWidth="2" />
            {app.axes.map((axis, i) => {
              const { x, y } = polarToXY((360 / n) * i, R + 20);
              return (
                <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="hsl(210,5%,52%)" fontSize="8" fontFamily="system-ui">
                  {axis}
                </text>
              );
            })}
          </svg>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.25rem", marginTop: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <div style={{ width: "10px", height: "2px", background: app.accent, borderRadius: "1px" }} />
              <span style={{ fontSize: "10px", color: "hsl(210,5%,50%)" }}>Us</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <div style={{ width: "10px", height: "2px", background: "#3b82f6", borderRadius: "1px" }} />
              <span style={{ fontSize: "10px", color: "hsl(210,5%,50%)" }}>Avg competitor</span>
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Card>
            <SectionLabel>Competitors</SectionLabel>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {app.competitors.map(c => (
                <span key={c} style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", color: "hsl(210,5%,60%)" }}>{c}</span>
              ))}
            </div>
          </Card>
          <Card>
            <SectionLabel>We Have — They Don't</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {app.weHave.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <CheckCircle2 size={12} style={{ color: "#10b981", marginTop: "2px", flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "hsl(38,12%,80%)" }}>{item}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionLabel>They Have — We Don't</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {app.theyHave.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <Circle size={12} style={{ color: "#f43f5e", marginTop: "2px", flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "hsl(210,5%,58%)" }}>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Next Best Action Panel ───────────────────────────────────────────────────

function NextBestActionPanel() {
  const [open, setOpen] = useState(true);

  const { data: nbaApi } = useStandardQuery({
    queryKey: ["autopilot", "next-best-actions"],
    queryFn: () => apiFetch<{ actions: typeof NEXT_BEST_ACTIONS }>("/autopilot/next-best-actions"),
    staleTime: 300_000,
  });
  const activeActions = nbaApi?.actions ?? NEXT_BEST_ACTIONS;

  return (
    <Card style={{ marginBottom: "1.5rem", borderColor: "hsla(265,70%,60%,0.2)" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "hsla(265,70%,60%,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={15} style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "hsl(38,12%,92%)" }}>Next Best Action Prescriptor</p>
            <p style={{ fontSize: "11px", color: "hsl(210,5%,50%)" }}>Top 5 highest-impact improvements — ranked by genome, drift, usage & feedback signals</p>
          </div>
        </div>
        {open ? <ChevronDown size={14} style={{ color: "hsl(210,5%,40%)" }} /> : <ChevronRight size={14} style={{ color: "hsl(210,5%,40%)" }} />}
      </div>

      {open && (
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {activeActions.map((a, i) => (
            <m.div
              key={a.rank}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                background: "hsla(0,0%,100%,0.02)",
                border: "1px solid hsla(0,0%,100%,0.05)",
                borderLeft: `3px solid ${a.accent}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `${a.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "12px", fontWeight: 700, color: a.accent }}>
                  {a.rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.375rem" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,92%)" }}>{a.title}</p>
                    <span style={{ fontSize: "10px", color: a.accent, padding: "1px 6px", borderRadius: "20px", background: `${a.accent}14`, fontWeight: 600 }}>{a.app}</span>
                    <EffortBadge effort={a.effort} />
                    <span style={{ fontSize: "10px", fontWeight: 600, color: a.impact === "High" ? "#10b981" : "#f59e0b" }}>Impact: {a.impact}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "hsl(210,5%,56%)", lineHeight: 1.5, marginBottom: "0.5rem" }}>{a.why}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {a.signals.map((s, j) => (
                      <span key={j} style={{ fontSize: "9px", fontWeight: 600, padding: "2px 7px", borderRadius: "4px", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.06)", color: "hsl(210,5%,48%)" }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </m.div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.25rem" }}>
            <MicroFeedbackWidget featureId="next-best-action" featureName="Next Best Action Prescriptor" app="szl-holdings" compact prompt="Were these recommendations helpful?" />
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Tab: Forge Client Satisfaction Engine ────────────────────────────────────

const FORGE_CLIENTS = [
  { name: "SZL Holdings",   app: "szl-holdings",   nps: 72, csat: 91, responseRate: 84, trend: "up"   as const },
  { name: "Aegis Security", app: "aegis",           nps: 68, csat: 88, responseRate: 76, trend: "up"   as const },
  { name: "Terra RE",       app: "terra",           nps: 54, csat: 79, responseRate: 61, trend: "flat" as const },
  { name: "Vessels Fleet",  app: "vessels",         nps: 61, csat: 83, responseRate: 70, trend: "up"   as const },
  { name: "Lyte AIOps",     app: "lyte",            nps: 44, csat: 72, responseRate: 55, trend: "down" as const },
  { name: "Carlota Jo",     app: "carlota",         nps: 58, csat: 81, responseRate: 68, trend: "flat" as const },
  { name: "Counsel",  app: "prism",           nps: 77, csat: 93, responseRate: 88, trend: "up"   as const },
];

const FORGE_FEEDBACK = [
  { client: "SZL Holdings",   app: "szl-holdings",   rating: 5, comment: "The genome heatmap is a game-changer. We now know exactly what to prioritize.", date: "2026-04-10" },
  { client: "Counsel",  app: "prism",           rating: 5, comment: "AI-assisted contract review cut our turnaround from 3 days to 4 hours.",        date: "2026-04-09" },
  { client: "Aegis Security", app: "aegis",           rating: 4, comment: "Threat feed integration is solid. Would love geofencing for alert routing.",      date: "2026-04-08" },
  { client: "Carlota Jo",     app: "carlota",         rating: 4, comment: "Client portal is clean but we need offline sync for field visits.",               date: "2026-04-07" },
  { client: "Vessels Fleet",  app: "vessels",         rating: 4, comment: "AIS tracking accuracy improved a lot. Dark vessel detection is impressive.",      date: "2026-04-06" },
  { client: "Terra RE",       app: "terra",           rating: 3, comment: "Property scoring works well but the dashboard is slow with 500+ listings.",       date: "2026-04-05" },
  { client: "Lyte AIOps",     app: "lyte",            rating: 3, comment: "Alert volume is too high — we're experiencing fatigue. Needs smarter grouping.",  date: "2026-04-04" },
];

const NPS_PROMOTERS = 42;
const NPS_PASSIVES  = 24;
const NPS_DETRACTORS = 11;
const NPS_TOTAL = NPS_PROMOTERS + NPS_PASSIVES + NPS_DETRACTORS;
const PORTFOLIO_NPS = Math.round(((NPS_PROMOTERS - NPS_DETRACTORS) / NPS_TOTAL) * 100);

function ForgeTab() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const displayed = selectedApp
    ? FORGE_FEEDBACK.filter(f => f.app === selectedApp)
    : FORGE_FEEDBACK;

  const avgCsat = Math.round(FORGE_CLIENTS.reduce((a, c) => a + c.csat, 0) / FORGE_CLIENTS.length);
  const avgResponse = Math.round(FORGE_CLIENTS.reduce((a, c) => a + c.responseRate, 0) / FORGE_CLIENTS.length);

  const npsColor = PORTFOLIO_NPS >= 70 ? "#10b981" : PORTFOLIO_NPS >= 50 ? "#f59e0b" : "#f43f5e";
  const csatColor = avgCsat >= 85 ? "#10b981" : avgCsat >= 70 ? "#f59e0b" : "#f43f5e";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Portfolio NPS",    value: `${PORTFOLIO_NPS}`,    sub: "net promoter score",   color: npsColor },
          { label: "Avg CSAT",         value: `${avgCsat}%`,         sub: "customer satisfaction", color: csatColor },
          { label: "Avg Response Rate",value: `${avgResponse}%`,     sub: "survey completion",    color: "#60a5fa" },
          { label: "Clients Tracked",  value: `${FORGE_CLIENTS.length}`, sub: "active accounts", color: "#a78bfa" },
        ].map(m => (
          <Card key={m.label}>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.375rem" }}>{m.label}</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color, letterSpacing: "-0.02em" }}>{m.value}</p>
            <p style={{ fontSize: "11px", color: "hsl(210,5%,48%)" }}>{m.sub}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <Card>
          <SectionLabel>NPS Breakdown</SectionLabel>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "1.5rem", marginBottom: "0.75rem" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "2.25rem", fontWeight: 800, color: npsColor, lineHeight: 1 }}>{PORTFOLIO_NPS}</p>
              <p style={{ fontSize: "10px", color: "hsl(210,5%,44%)", marginTop: "2px" }}>NPS Score</p>
            </div>
            <div style={{ flex: 1 }}>
              {[
                { label: "Promoters",  count: NPS_PROMOTERS,  pct: Math.round((NPS_PROMOTERS / NPS_TOTAL) * 100),  color: "#10b981" },
                { label: "Passives",   count: NPS_PASSIVES,   pct: Math.round((NPS_PASSIVES / NPS_TOTAL) * 100),   color: "#f59e0b" },
                { label: "Detractors", count: NPS_DETRACTORS, pct: Math.round((NPS_DETRACTORS / NPS_TOTAL) * 100), color: "#f43f5e" },
              ].map(seg => (
                <div key={seg.label} style={{ marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ fontSize: "11px", color: seg.color, fontWeight: 600 }}>{seg.label}</span>
                    <span style={{ fontSize: "11px", color: "hsl(210,5%,52%)" }}>{seg.count} ({seg.pct}%)</span>
                  </div>
                  <div style={{ height: "5px", background: "hsla(0,0%,100%,0.06)", borderRadius: "3px" }}>
                    <div style={{ height: "100%", width: `${seg.pct}%`, background: seg.color, borderRadius: "3px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: "10px", color: "hsl(210,5%,40%)", borderTop: "1px solid hsla(0,0%,100%,0.05)", paddingTop: "0.5rem" }}>
            Industry benchmark: SaaS NPS ≥ 40 = Good · ≥ 70 = Excellent
          </p>
        </Card>

        <Card>
          <SectionLabel>CSAT by Client</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[...FORGE_CLIENTS].sort((a, b) => b.csat - a.csat).map(client => {
              const color = client.csat >= 85 ? "#10b981" : client.csat >= 70 ? "#f59e0b" : "#f43f5e";
              const TrendIcon = client.trend === "up" ? TrendingUp : client.trend === "down" ? TrendingDown : Activity;
              const trendColor = client.trend === "up" ? "#10b981" : client.trend === "down" ? "#f43f5e" : "#f59e0b";
              return (
                <div key={client.app} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "11px", color: "hsl(38,12%,80%)", minWidth: "110px", fontWeight: 500 }}>{client.name}</span>
                  <div style={{ flex: 1, height: "6px", background: "hsla(0,0%,100%,0.06)", borderRadius: "3px" }}>
                    <div style={{ height: "100%", width: `${client.csat}%`, background: color, borderRadius: "3px" }} />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color, minWidth: "36px", textAlign: "right" }}>{client.csat}%</span>
                  <TrendIcon size={12} style={{ color: trendColor, flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <SectionLabel>Recent Client Feedback</SectionLabel>
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
            <TabButton active={selectedApp === null} onClick={() => setSelectedApp(null)}>All</TabButton>
            {FORGE_CLIENTS.map(c => (
              <TabButton key={c.app} active={selectedApp === c.app} onClick={() => setSelectedApp(c.app === selectedApp ? null : c.app)}>
                {c.name.split(" ")[0]}
              </TabButton>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {displayed.map((f, i) => {
            const ratingColor = f.rating >= 5 ? "#10b981" : f.rating >= 4 ? "#60a5fa" : "#f59e0b";
            return (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{ padding: "0.875rem", borderRadius: "0.625rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,88%)" }}>{f.client}</span>
                    <span style={{ fontSize: "10px", color: "hsl(210,5%,44%)", marginLeft: "0.5rem" }}>{f.date}</span>
                  </div>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <div key={si} style={{ width: "8px", height: "8px", borderRadius: "50%", background: si < f.rating ? ratingColor : "hsla(0,0%,100%,0.1)" }} />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: "12px", color: "hsl(210,5%,60%)", lineHeight: 1.6, fontStyle: "italic" }}>"{f.comment}"</p>
              </m.div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionLabel>Satisfaction Action Items</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {FORGE_CLIENTS.filter(c => c.nps < 60 || c.csat < 80).map((c, i) => {
            const urgency = c.nps < 50 ? "#f43f5e" : "#f59e0b";
            return (
              <div key={i} style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", background: `${urgency}08`, border: `1px solid ${urgency}20`, display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <AlertTriangle size={13} style={{ color: urgency, marginTop: "1px", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "hsl(38,12%,88%)", marginBottom: "2px" }}>
                    {c.name} — NPS {c.nps} · CSAT {c.csat}%
                  </p>
                  <p style={{ fontSize: "11px", color: "hsl(210,5%,54%)", lineHeight: 1.5 }}>
                    {c.nps < 50
                      ? "Schedule an immediate check-in call. NPS below 50 signals churn risk — identify blockers before next billing cycle."
                      : "Review latest feedback comments and schedule a product roadmap alignment session."}
                  </p>
                </div>
              </div>
            );
          })}
          {FORGE_CLIENTS.filter(c => c.nps < 60 || c.csat < 80).length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <CheckCircle2 size={28} style={{ color: "#10b981", margin: "0 auto 0.5rem" }} />
              <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,88%)" }}>All clients above satisfaction thresholds</p>
            </div>
          )}
        </div>
      </Card>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
        <MicroFeedbackWidget featureId="forge-satisfaction" featureName="Forge Client Satisfaction Engine" app="szl-holdings" compact prompt="Is this satisfaction data helpful?" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "genome",    label: "Capability Genome",     icon: Layers },
  { id: "drift",     label: "Drift Detection",        icon: AlertTriangle },
  { id: "usage",     label: "Feature Usage",          icon: BarChart3 },
  { id: "feedback",  label: "User Signals",           icon: ThumbsUp },
  { id: "budget",    label: "Performance Budget",     icon: Target },
  { id: "playbooks", label: "Workflow Playbooks",     icon: BookOpen },
  { id: "radar",     label: "Competitive Radar",      icon: Radio },
  { id: "forge",     label: "Forge Satisfaction",     icon: Users },
];

export default function AutopilotPage() {
  const __pageMeta = usePageMeta({
    title: "Ecosystem Autopilot — SZL Holdings",
    description: "Self-diagnosing capability genome, drift detection, feedback loops, and next-best-action prescriptor for the SZL ecosystem.",
    canonical: "https://szlholdings.com/autopilot",
  });

  const [activeTab, setActiveTab] = useState("genome");
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();

  const retryUnlessAuth = (failureCount: number, error: unknown) => {
    const msg = error instanceof Error ? error.message : "";
    if (/^4\d\d\s/.test(msg)) return false;
    return failureCount < 2;
  };

  const { data: summary, isError: summaryError } = useStandardQuery({
    queryKey: ["autopilot", "summary"],
    queryFn: () => apiFetch<{ genomeScore: number; gaps: number; bestInClass: number; capabilities: number; scheduledJobsActive: number }>("/autopilot/summary"),
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: retryUnlessAuth,
  });

  const { data: driftSummary, isError: driftError } = useStandardQuery({
    queryKey: ["autopilot", "drift-alerts"],
    queryFn: () => apiFetch<{ alerts: Array<{ severity: string }> }>("/autopilot/drift-alerts"),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: retryUnlessAuth,
  });

  const criticalCount = driftSummary?.alerts.filter(a => a.severity === "critical").length
    ?? DRIFT_ALERTS.filter(a => a.severity === "critical").length;

  const showSignInNotice = !authLoading && !isAuthenticated && (summaryError || driftError);

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main className="pt-24">
          <section style={{ padding: "3rem 0 2rem" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(265,60%,62%)", marginBottom: "0.5rem" }}>
                  Ecosystem Autopilot
                </p>
                <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.1, marginBottom: "0.75rem", fontFamily: "var(--font-display)" }}>
                  Self-diagnosing. Self-prescribing.<br />Always improving.
                </h1>
                <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(210,5%,56%)", maxWidth: "42rem" }}>
                  The Autopilot maps every capability across every app, detects when things drift, aggregates user feedback, and tells you exactly what to build next. The ecosystem tells you how it's doing — you just act on it.
                </p>
              </m.div>
  
              {showSignInNotice && (
                <m.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  role="status"
                  style={{
                    marginTop: "1.75rem",
                    padding: "0.75rem 1rem",
                    background: "hsla(214,72%,14%,0.55)",
                    border: "1px solid hsla(214,72%,55%,0.25)",
                    borderRadius: "0.625rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <Lightbulb size={14} style={{ color: "#60a5fa", flexShrink: 0 }} />
                  <span style={{ fontSize: "12.5px", color: "hsl(38,12%,82%)", lineHeight: 1.5 }}>
                    Sign in to see live ecosystem stats. Anonymous visitors see placeholder values.
                  </span>
                  <button
                    type="button"
                    onClick={login}
                    style={{
                      marginLeft: "auto",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      padding: "0.4rem 0.85rem",
                      borderRadius: "0.375rem",
                      background: "hsla(214,72%,55%,0.18)",
                      color: "#93c5fd",
                      border: "1px solid hsla(214,72%,55%,0.35)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    Sign in
                    <ArrowRight size={11} />
                  </button>
                </m.div>
              )}
  
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginTop: "2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                <div style={{ padding: "0.5rem 1rem", background: "hsla(265,70%,60%,0.1)", border: "1px solid hsla(265,70%,60%,0.2)", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Sparkles size={12} style={{ color: "#a78bfa" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#a78bfa" }}>Autopilot Active</span>
                </div>
                <div style={{ padding: "0.5rem 1rem", background: "hsla(160,60%,15%,0.4)", border: "1px solid hsla(160,60%,35%,0.2)", borderRadius: "0.5rem" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#10b981" }}>
                    Genome score: {summary?.genomeScore ?? "—"}%
                  </span>
                </div>
                <div style={{ padding: "0.5rem 1rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "0.5rem" }}>
                  <span style={{ fontSize: "11px", color: "hsl(210,5%,52%)" }}>
                    {summary?.scheduledJobsActive ?? "—"} scheduled jobs active · Weekly briefing: Mondays 08:00 UTC
                  </span>
                </div>
                <div style={{ padding: "0.5rem 1rem", background: "hsla(350,80%,15%,0.4)", border: "1px solid hsla(350,80%,35%,0.2)", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <AlertTriangle size={11} style={{ color: "#f43f5e" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#f43f5e" }}>
                    {criticalCount} critical drift alerts
                  </span>
                </div>
              </m.div>
  
              <NextBestActionPanel />
  
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <Icon size={11} />
                        {tab.label}
                      </span>
                    </TabButton>
                  );
                })}
              </div>
  
              <AnimatePresence mode="wait">
                <m.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {activeTab === "genome"    && <GenomeTab />}
                  {activeTab === "drift"     && <DriftTab />}
                  {activeTab === "usage"     && <UsageTab />}
                  {activeTab === "feedback"  && <FeedbackTab />}
                  {activeTab === "budget"    && <BudgetTab />}
                  {activeTab === "playbooks" && <PlaybooksTab />}
                  {activeTab === "radar"     && <RadarTab />}
                  {activeTab === "forge"     && <ForgeTab />}
                </m.div>
              </AnimatePresence>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
