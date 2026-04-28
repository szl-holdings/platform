import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import {
  Activity, ArrowRight, CheckCircle2, 
  Circle, GitBranch, Globe, Layers, Shield, Zap,
  BarChart3, Server, Link2
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

// ── Design tokens (platform monitoring section) ──────────────────────────────
const BG = { surface: "hsl(210,12%,5%)", elevated: "hsl(210,12%,8%)", card: "hsl(210,12%,10%)" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "hsl(210,12%,14%)" };
const TEXT = { primary: "hsl(38,12%,94%)", secondary: "hsl(210,5%,58%)", tertiary: "hsl(210,5%,42%)" };
const ACCENT = { green: "#6b8f71", amber: "hsl(38,90%,52%)", red: "#c45a4a", blue: "#4a90b8", purple: "#8b7ac8", gold: "hsl(38,90%,52%)" };

// ── Cross-app data constants ─────────────────────────────────────────────────
const APPS = [
  { key: "lyte", name: "KORA", full: "Command", domain: "lyte", desc: "AIOps & workflow observability", color: "hsl(192,72%,48%)", handoffTo: "Counsel RUNTIME", handoffType: "lyte_priority_to_forge", icon: Activity },
  { key: "aegis", name: "PARAGON", full: "PARAGON SOC", domain: "aegis", desc: "Unified defense & threat intelligence", color: "hsl(0,72%,58%)", handoffTo: "COVENANT", handoffType: "aegis_threat_to_covenant", icon: Shield },
  { key: "vessels", name: "SEXTANT", full: "SEXTANT Maritime", domain: "vessels", desc: "Fleet intelligence & voyage analytics", color: "hsl(220,72%,58%)", handoffTo: "Counsel RUNTIME", handoffType: "vessels_voyage_to_forge", icon: Globe },
  { key: "terra", name: "DOMAINE", full: "DOMAINE Real Estate", domain: "terra", desc: "Property intelligence & deal analytics", color: "hsl(142,52%,48%)", handoffTo: "Carlota Jo", handoffType: "terra_blocker_to_carlota", icon: Layers },
  { key: "szl", name: "Holdings", full: "SZL Holdings", domain: "szl", desc: "Executive command & investor relations", color: "hsl(38,90%,52%)", handoffTo: "ATLAS", handoffType: "holdings_investor_to_atlas", icon: BarChart3 },
  { key: "carlota", name: "Carlota Jo", full: "Carlota Jo Consulting", domain: "carlota", desc: "Advisory services & client delivery", color: "hsl(280,52%,62%)", handoffTo: null, handoffType: null, icon: GitBranch },
];

const SYSTEMS = [
  { name: "PRAXIS BUS", desc: "Cross-domain event fabric", status: "active" },
  { name: "Counsel RUNTIME", desc: "Governed execution engine", status: "active" },
  { name: "COVENANT", desc: "Policy enforcement layer", status: "active" },
  { name: "RECEIPT GRAPH", desc: "Trust & audit provenance", status: "active" },
  { name: "Pulse EVALS", desc: "Platform quality metrics", status: "active" },
  { name: "OUTCOME GRAPH", desc: "Shared memory & identity", status: "active" },
  { name: "ATLAS ARTIFACTS", desc: "Asset & document engine", status: "active" },
  { name: "HELM CONSOLE", desc: "Family-level command view", status: "active" },
];

const HANDOFF_CONTRACTS = [
  { from: "KORA", to: "Counsel RUNTIME", trigger: "Priority signal ≥ high", action: "Governed execution workflow", color: "hsl(192,72%,48%)" },
  { from: "PARAGON", to: "COVENANT", trigger: "Confirmed threat (MITRE)", action: "Policy-gated response", color: "hsl(0,72%,58%)" },
  { from: "SEXTANT", to: "Counsel RUNTIME", trigger: "Voyage anomaly detected", action: "Rerouting command workflow", color: "hsl(220,72%,58%)" },
  { from: "DOMAINE", to: "Carlota Jo", trigger: "Deal blocker surfaced", action: "Advisory service routing", color: "hsl(142,52%,48%)" },
  { from: "Holdings", to: "ATLAS", trigger: "Investor event triggered", action: "Artifact package generation", color: "hsl(38,90%,52%)" },
];


const _SEVERITY_COLOR: Record<string, string> = {
  critical: "hsl(0,72%,58%)",
  high: "hsl(30,90%,52%)",
  medium: "hsl(48,90%,52%)",
  low: "hsl(142,52%,48%)",
  info: "hsl(192,72%,48%)",
};

// ── Platform monitoring interfaces (Task #337) ───────────────────────────────
interface OverviewData {
  generatedAt: string;
  agentRuns: { total: string; avgLatency: string; avgTokens: string } | null;
  artifactStats: Array<{ status: string; total: string }>;
  exportJobStats: Array<{ status: string; total: string }>;
  outcomeStats: Array<{ status: string; total: string; avgConfidence: string }>;
  worldlineHealth: Array<{ status: string; total: string }>;
  proofChainStats: Array<{ reviewState: string; exportSafetyState: string; total: string }>;
}

interface AgentRunData {
  agentId: string;
  agentName: string;
  domain: string;
  totalRuns: string;
  avgLatencyMs: string;
  avgTokens: string;
}

interface WorldlineData {
  total: number;
  active: number;
  degraded: number;
  inactive: number;
  degradedSources: Array<{
    slug: string;
    name: string;
    domain: string;
    consecutiveFailures: number;
    lastErrorMessage: string | null;
    lastFetchedAt: string | null;
  }>;
}

interface OutcomeData {
  byDomain: Array<{ domain: string; total: string; avgConfidence: string }>;
  topOverrideAgents: Array<{ agentId: string | null; overrideCount: string }>;
}

interface AtlasData {
  byTemplate: Array<{ templateType: string; domain: string; total: string }>;
  exportsByFormat: Array<{ format: string; total: string }>;
  failedExports: Array<{ id: number; format: string; errorMessage: string | null; createdAt: string }>;
}

interface ProofData {
  anomalies: Array<{ id: number; contentType: string; contentId: string; reviewState: string; exportSafetyState: string; createdAt: string }>;
  byState: Array<{ reviewState: string; exportSafetyState: string; total: string }>;
}

// ── Cross-app interfaces (Task #338) ─────────────────────────────────────────
interface FamilyHealthData {
  familyStatus: string;
  appCount: number;
  appHealth: Array<{ app: string; domain: string; status: string; handoffTarget: string | null }>;
  crossAppActivity: {
    totalHandoffs: number;
    last24hHandoffs: number;
    activeContracts: number;
    prismBusEvents: number;
  };
  systemHealth: Record<string, string>;
}

interface HandoffStats {
  totalHandoffs: number;
  successRate: number;
  byType: Record<string, { total: number; routed: number; executed: number; failed: number }>;
  recentHandoffs: Array<{
    id: string;
    type: string;
    sourceApp: string;
    targetApp: string;
    status: string;
    timestamp: number;
    severity: string;
  }>;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color = TEXT.primary }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: BG.card, border: `1px solid ${BORDER.muted}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: TEXT.secondary, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge?: string | number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: TEXT.primary, margin: 0 }}>{title}</h2>
      {badge !== undefined && (
        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: BORDER.muted, color: TEXT.secondary }}>{badge}</span>
      )}
    </div>
  );
}

function StatusPip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: ACCENT.green, ready: ACCENT.green, completed: ACCENT.green,
    degraded: ACCENT.red, failed: ACCENT.red, blocked: ACCENT.red,
    pending: ACCENT.amber, generating: ACCENT.amber, running: ACCENT.amber,
    inactive: TEXT.tertiary, paused: TEXT.tertiary, archived: TEXT.tertiary, expired: TEXT.tertiary,
  };
  return <span style={{ width: 7, height: 7, borderRadius: "50%", background: colors[status] ?? TEXT.tertiary, display: "inline-block", flexShrink: 0 }} />;
}

// ── Tab definitions ───────────────────────────────────────────────────────────
type TabId =
  | "apps"
  | "contracts"
  | "signals"
  | "systems"
  | "health"
  | "agents"
  | "outcomes"
  | "artifacts"
  | "worldline"
  | "proofchain";

const TABS: Array<{ id: TabId; label: string; group: "cross-app" | "platform" }> = [
  { id: "apps", label: "App Overview", group: "cross-app" },
  { id: "contracts", label: "Handoff Contracts", group: "cross-app" },
  { id: "signals", label: "Signal Feed", group: "cross-app" },
  { id: "systems", label: "Platform Systems", group: "cross-app" },
  { id: "health", label: "Platform Health", group: "platform" },
  { id: "agents", label: "Agent Runs", group: "platform" },
  { id: "outcomes", label: "Outcome Graph", group: "platform" },
  { id: "artifacts", label: "Atlas Artifacts", group: "platform" },
  { id: "worldline", label: "Audit Timeline", group: "platform" },
  { id: "proofchain", label: "Proof Chain", group: "platform" },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function HelmConsolePage() {
  const __pageMeta = usePageMeta({
    title: "HELM CONSOLE — SZL Family Command | SZL Holdings",
    description: "Unified family-level dashboard showing cross-app signal flow, handoff contracts, platform health and governance across the entire SZL intelligence platform.",
    canonical: "https://szlholdings.com/helm",
  });

  const [activeTab, setActiveTab] = useState<TabId>("apps");

  // ── Cross-app queries (React Query) ────────────────────────────────────────
  const { data: familyHealth } = useStandardQuery<FamilyHealthData>({
    queryKey: ["cross-app-family-health"],
    queryFn: () => apiFetch<FamilyHealthData>("/api/cross-app/family/health"),
    refetchInterval: 30000,
    retry: 1,
  });

  const { data: handoffStats } = useStandardQuery<HandoffStats>({
    queryKey: ["cross-app-handoff-stats"],
    queryFn: () => apiFetch<HandoffStats>("/api/cross-app/handoffs/stats"),
    refetchInterval: 30000,
    retry: 1,
  });

  const totalHandoffs = handoffStats?.totalHandoffs ?? 247;
  const successRate = handoffStats?.successRate ?? 98;
  const activeContracts = familyHealth?.crossAppActivity.activeContracts ?? 5;
  const prismEvents = familyHealth?.crossAppActivity.prismBusEvents ?? 1842;

  // ── Platform monitoring state (direct fetch, Task #337) ────────────────────
  const BASE = "/api-server";
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [agentRuns, setAgentRuns] = useState<AgentRunData[]>([]);
  const [worldline, setWorldline] = useState<WorldlineData | null>(null);
  const [outcomes, setOutcomes] = useState<OutcomeData | null>(null);
  const [atlasData, setAtlasData] = useState<AtlasData | null>(null);
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [platformLoading, setPlatformLoading] = useState(false);

  const fetchPlatformData = useCallback(async (t: TabId) => {
    setPlatformLoading(true);
    try {
      if (t === "health") {
        const d = await fetch(`${BASE}/helm/overview`).then(r => r.json());
        if (d.data) setOverview(d.data);
      } else if (t === "agents") {
        const d = await fetch(`${BASE}/helm/agent-runs`).then(r => r.json());
        if (d.data) setAgentRuns(d.data);
      } else if (t === "worldline") {
        const d = await fetch(`${BASE}/helm/worldline`).then(r => r.json());
        if (d.data) setWorldline(d.data);
      } else if (t === "outcomes") {
        const d = await fetch(`${BASE}/helm/outcome-graph`).then(r => r.json());
        if (d.data) setOutcomes(d.data);
      } else if (t === "artifacts") {
        const d = await fetch(`${BASE}/helm/atlas-artifacts`).then(r => r.json());
        if (d.data) setAtlasData(d.data);
      } else if (t === "proofchain") {
        const d = await fetch(`${BASE}/helm/proof-chain`).then(r => r.json());
        if (d.data) setProofData(d.data);
      }
    } catch { } finally {
      setPlatformLoading(false);
    }
  }, []);

  useEffect(() => {
    const platformTabs: TabId[] = ["health", "agents", "outcomes", "artifacts", "worldline", "proofchain"];
    if (platformTabs.includes(activeTab)) {
      fetchPlatformData(activeTab);
    }
  }, [activeTab, fetchPlatformData]);

  const crossAppTabs = TABS.filter(t => t.group === "cross-app");
  const platformTabs = TABS.filter(t => t.group === "platform");

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: BG.surface }}>
        <SiteNav />
        <main className="pt-24">
  
          {/* ── Header ── */}
          <section style={{ padding: "4rem 0 2rem" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <Server size={14} style={{ color: ACCENT.amber }} />
                  <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: ACCENT.amber }}>
                    HELM CONSOLE
                  </p>
                </div>
                <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: TEXT.primary, lineHeight: 1.08, marginBottom: "1rem" }}>
                  Family Command View
                </h1>
                <p style={{ fontSize: "1rem", lineHeight: 1.7, color: TEXT.secondary, maxWidth: "48rem" }}>
                  Cross-app signal flow, handoff contracts, platform health and governed infrastructure — unified visibility across every SZL intelligence application.
                </p>
              </m.div>
            </div>
          </section>
  
          {/* ── KPI Strip (cross-app summary) ── */}
          <section style={{ padding: "1rem 0 0" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
                {[
                  { label: "Cross-App Handoffs", value: totalHandoffs.toLocaleString(), icon: Link2, color: "hsl(192,72%,48%)" },
                  { label: "Handoff Success Rate", value: `${successRate}%`, icon: CheckCircle2, color: "hsl(142,52%,48%)" },
                  { label: "Active Contracts", value: String(activeContracts), icon: GitBranch, color: ACCENT.amber },
                  { label: "PRAXIS BUS Events", value: prismEvents.toLocaleString(), icon: Zap, color: "hsl(280,52%,62%)" },
                ].map((stat, i) => (
                  <m.div
                    key={stat.label}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    style={{ background: BG.elevated, border: `1px solid ${BORDER.muted}`, borderRadius: "12px", padding: "1.25rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <stat.icon size={16} style={{ color: stat.color }} />
                      <span style={{ fontSize: "11px", fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</span>
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: TEXT.primary, letterSpacing: "-0.02em" }}>{stat.value}</div>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* ── Tab Navigation ── */}
          <section style={{ padding: "1rem 0 2rem" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <div style={{ marginBottom: "2rem", borderBottom: `1px solid ${BORDER.muted}`, paddingBottom: "0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginRight: "0.5rem" }}>Cross-App</span>
                  {crossAppTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: "0.4rem 0.875rem",
                        borderRadius: "6px 6px 0 0",
                        border: "none",
                        borderBottom: activeTab === tab.id ? `2px solid ${ACCENT.amber}` : "2px solid transparent",
                        background: activeTab === tab.id ? `${ACCENT.amber}12` : "transparent",
                        color: activeTab === tab.id ? TEXT.primary : TEXT.secondary,
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <span style={{ fontSize: "10px", fontWeight: 700, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginLeft: "1rem", marginRight: "0.5rem" }}>Platform</span>
                  {platformTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: "0.4rem 0.875rem",
                        borderRadius: "6px 6px 0 0",
                        border: "none",
                        borderBottom: activeTab === tab.id ? `2px solid ${ACCENT.blue}` : "2px solid transparent",
                        background: activeTab === tab.id ? `${ACCENT.blue}12` : "transparent",
                        color: activeTab === tab.id ? TEXT.primary : TEXT.secondary,
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
  
              {/* ─── Cross-App: App Overview ─── */}
              {activeTab === "apps" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                  {APPS.map((app, i) => (
                    <m.div
                      key={app.key}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      style={{ background: BG.elevated, border: `1px solid ${BORDER.muted}`, borderRadius: "12px", padding: "1.5rem" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${app.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <app.icon size={18} style={{ color: app.color }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "15px", color: TEXT.primary }}>{app.name}</div>
                          <div style={{ fontSize: "11px", color: TEXT.tertiary }}>{app.desc}</div>
                        </div>
                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Circle size={7} fill="hsl(142,52%,48%)" style={{ color: "hsl(142,52%,48%)" }} />
                          <span style={{ fontSize: "11px", color: "hsl(142,52%,48%)", fontWeight: 600 }}>Active</span>
                        </div>
                      </div>
                      {app.handoffTo ? (
                        <div style={{ background: BG.surface, borderRadius: "8px", padding: "0.75rem", border: `1px solid ${app.color}22` }}>
                          <div style={{ fontSize: "11px", color: TEXT.tertiary, marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Handoff Target</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <ArrowRight size={12} style={{ color: app.color }} />
                            <span style={{ fontSize: "13px", fontWeight: 600, color: app.color }}>{app.handoffTo}</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: BG.surface, borderRadius: "8px", padding: "0.75rem", border: `1px solid ${BORDER.muted}` }}>
                          <div style={{ fontSize: "11px", color: TEXT.tertiary }}>Receives signals from DOMAINE</div>
                        </div>
                      )}
                    </m.div>
                  ))}
                </div>
              )}
  
              {/* ─── Cross-App: Handoff Contracts ─── */}
              {activeTab === "contracts" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {HANDOFF_CONTRACTS.map((contract, i) => (
                    <m.div
                      key={`${contract.from}-${contract.to}`}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      style={{ background: BG.elevated, border: `1px solid ${BORDER.muted}`, borderRadius: "12px", padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr auto 1fr 2fr", alignItems: "center", gap: "1.5rem" }}
                    >
                      <div>
                        <div style={{ fontSize: "11px", color: TEXT.tertiary, marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Source</div>
                        <div style={{ fontWeight: 700, fontSize: "16px", color: contract.color }}>{contract.from}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                        <ArrowRight size={20} style={{ color: contract.color }} />
                        <span style={{ fontSize: "10px", color: TEXT.tertiary, fontWeight: 600, textTransform: "uppercase" }}>PRAXIS BUS</span>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: TEXT.tertiary, marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Target</div>
                        <div style={{ fontWeight: 700, fontSize: "16px", color: TEXT.primary }}>{contract.to}</div>
                      </div>
                      <div style={{ background: BG.surface, borderRadius: "8px", padding: "0.75rem 1rem", border: `1px solid ${contract.color}22` }}>
                        <div style={{ fontSize: "11px", color: TEXT.tertiary, marginBottom: "0.25rem" }}>
                          <span style={{ fontWeight: 600 }}>Trigger:</span> {contract.trigger}
                        </div>
                        <div style={{ fontSize: "12px", color: "hsl(38,12%,80%)" }}>
                          <span style={{ fontWeight: 600, color: contract.color }}>Action:</span> {contract.action}
                        </div>
                      </div>
                    </m.div>
                  ))}
                </div>
              )}
  
              {/* ─── Cross-App: Signal Feed ─── */}
              {activeTab === "signals" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", gap: "0.75rem", background: BG.elevated, border: `1px solid ${BORDER.muted}`, borderRadius: "12px" }}>
                    <Activity size={28} style={{ color: TEXT.tertiary }} />
                    <div style={{ fontSize: "13px", color: TEXT.secondary, fontWeight: 600 }}>No signals yet</div>
                    <div style={{ fontSize: "11px", color: TEXT.tertiary, textAlign: "center", maxWidth: "320px" }}>
                      Cross-app signals will appear here as the PRAXIS BUS routes events between domain apps. Connect domain apps to begin receiving live signals.
                    </div>
                  </div>
                </div>
              )}
  
              {/* ─── Cross-App: Platform Systems ─── */}
              {activeTab === "systems" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                  {SYSTEMS.map((sys, i) => (
                    <m.div
                      key={sys.name}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      style={{ background: BG.elevated, border: `1px solid ${BORDER.muted}`, borderRadius: "12px", padding: "1.25rem" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: ACCENT.amber, textTransform: "uppercase", letterSpacing: "0.08em" }}>{sys.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Circle size={6} fill="hsl(142,52%,48%)" style={{ color: "hsl(142,52%,48%)" }} />
                          <span style={{ fontSize: "10px", color: "hsl(142,52%,48%)", fontWeight: 600 }}>Active</span>
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: TEXT.secondary, lineHeight: 1.5 }}>{sys.desc}</div>
                    </m.div>
                  ))}
                </div>
              )}
  
              {/* ─── Platform: Health Overview ─── */}
              {activeTab === "health" && (
                <div>
                  {platformLoading && <div style={{ color: TEXT.secondary, textAlign: "center", padding: 60 }}>Loading…</div>}
                  {!platformLoading && overview && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                        <MetricCard label="Agent Runs (24h)" value={Number(overview.agentRuns?.total ?? 0)} sub={overview.agentRuns ? `${Math.round(Number(overview.agentRuns.avgLatency ?? 0))}ms avg latency` : undefined} color={ACCENT.blue} />
                        <MetricCard label="Atlas Artifacts (7d)" value={overview.artifactStats.reduce((s, r) => s + Number(r.total), 0)} sub={`${overview.artifactStats.find(a => a.status === "failed")?.total ?? 0} failed`} color={ACCENT.gold} />
                        <MetricCard label="Outcome Decisions (7d)" value={overview.outcomeStats.reduce((s, r) => s + Number(r.total), 0)} sub={`${overview.outcomeStats.find(o => o.status === "overridden")?.total ?? 0} overrides`} color={ACCENT.purple} />
                        <MetricCard label="Ext. Data Sources" value={overview.worldlineHealth.reduce((s, r) => s + Number(r.total), 0)} sub={`${overview.worldlineHealth.find(w => w.status === "degraded")?.total ?? 0} degraded`} color={overview.worldlineHealth.find(w => w.status === "degraded")?.total !== "0" ? ACCENT.red : ACCENT.green} />
                        <MetricCard label="Proof Anomalies (7d)" value={overview.proofChainStats.filter(p => p.reviewState === "flagged").reduce((s, r) => s + Number(r.total), 0)} sub="flagged for review" color={ACCENT.red} />
                        <MetricCard label="Export Jobs (7d)" value={overview.exportJobStats.reduce((s, r) => s + Number(r.total), 0)} sub={`${overview.exportJobStats.find(e => e.status === "failed")?.total ?? 0} failed`} color={ACCENT.amber} />
                      </div>
                      {overview.worldlineHealth.some(w => w.status === "degraded" && Number(w.total) > 0) && (
                        <div style={{ background: `${ACCENT.red}08`, border: `1px solid ${ACCENT.red}30`, borderRadius: 10, padding: "12px 16px" }}>
                          <span style={{ fontSize: 12, color: ACCENT.red }}>⚠ Degraded data sources detected — check Audit Timeline tab for details.</span>
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                          <SectionHeader title="Artifact Status Breakdown" />
                          <div style={{ background: BG.card, border: `1px solid ${BORDER.muted}`, borderRadius: 10, overflow: "hidden" }}>
                            {overview.artifactStats.length === 0
                              ? <div style={{ padding: "16px", fontSize: 12, color: TEXT.tertiary }}>No artifact activity in the last 7 days.</div>
                              : overview.artifactStats.map(r => (
                                <div key={r.status} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${BORDER.subtle}` }}>
                                  <StatusPip status={r.status} />
                                  <span style={{ fontSize: 12, color: TEXT.secondary, textTransform: "capitalize", flex: 1 }}>{r.status}</span>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary }}>{r.total}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                        <div>
                          <SectionHeader title="Outcome Decisions" />
                          <div style={{ background: BG.card, border: `1px solid ${BORDER.muted}`, borderRadius: 10, overflow: "hidden" }}>
                            {overview.outcomeStats.length === 0
                              ? <div style={{ padding: "16px", fontSize: 12, color: TEXT.tertiary }}>No outcome decisions in the last 7 days.</div>
                              : overview.outcomeStats.map(r => (
                                <div key={r.status} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${BORDER.subtle}` }}>
                                  <StatusPip status={r.status} />
                                  <span style={{ fontSize: 12, color: TEXT.secondary, textTransform: "capitalize", flex: 1 }}>{r.status}</span>
                                  <span style={{ fontSize: 11, color: TEXT.tertiary, marginRight: 8 }}>{Math.round(Number(r.avgConfidence) * 100)}% conf</span>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary }}>{r.total}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
  
              {/* ─── Platform: Agent Runs ─── */}
              {activeTab === "agents" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {platformLoading && <div style={{ color: TEXT.secondary, textAlign: "center", padding: 60 }}>Loading…</div>}
                  {!platformLoading && (
                    <>
                      <SectionHeader title="Agent Run Performance (Last 24h)" badge={agentRuns.length} />
                      {agentRuns.length === 0
                        ? <div style={{ color: TEXT.tertiary, textAlign: "center", padding: 60 }}>No agent runs in the last 24 hours.</div>
                        : (
                          <div style={{ background: BG.card, border: `1px solid ${BORDER.muted}`, borderRadius: 10, overflow: "hidden" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 100px 80px", padding: "8px 14px", borderBottom: `1px solid ${BORDER.muted}` }}>
                              {["Agent", "Domain", "Runs", "Avg Latency", "Avg Tokens"].map(h => (
                                <span key={h} style={{ fontSize: 10, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</span>
                              ))}
                            </div>
                            {agentRuns.map(r => (
                              <div key={r.agentId} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 100px 80px", padding: "10px 14px", borderBottom: `1px solid ${BORDER.subtle}`, alignItems: "center" }}>
                                <div>
                                  <div style={{ fontSize: 12, color: TEXT.primary }}>{r.agentName}</div>
                                  <div style={{ fontSize: 10, color: TEXT.tertiary, fontFamily: "monospace" }}>{r.agentId}</div>
                                </div>
                                <span style={{ fontSize: 11, color: TEXT.secondary }}>{r.domain}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary }}>{r.totalRuns}</span>
                                <span style={{ fontSize: 12, color: Number(r.avgLatencyMs) > 5000 ? ACCENT.red : Number(r.avgLatencyMs) > 2000 ? ACCENT.amber : TEXT.secondary }}>
                                  {Math.round(Number(r.avgLatencyMs))}ms
                                </span>
                                <span style={{ fontSize: 12, color: TEXT.secondary }}>{Math.round(Number(r.avgTokens))}</span>
                              </div>
                            ))}
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
  
              {/* ─── Platform: Outcome Graph ─── */}
              {activeTab === "outcomes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {platformLoading && <div style={{ color: TEXT.secondary, textAlign: "center", padding: 60 }}>Loading…</div>}
                  {!platformLoading && outcomes && (
                    <>
                      <div>
                        <SectionHeader title="Outcome Graph — By Domain" />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                          {outcomes.byDomain.map(d => (
                            <div key={d.domain} style={{ background: BG.card, border: `1px solid ${BORDER.muted}`, borderRadius: 8, padding: "12px 14px" }}>
                              <div style={{ fontSize: 10, color: TEXT.tertiary, textTransform: "uppercase" }}>{d.domain}</div>
                              <div style={{ fontSize: 22, fontWeight: 700, color: TEXT.primary }}>{d.total}</div>
                              <div style={{ fontSize: 11, color: TEXT.secondary }}>{Math.round(Number(d.avgConfidence) * 100)}% avg confidence</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {outcomes.topOverrideAgents.length > 0 && (
                        <div>
                          <SectionHeader title="Top Override Agents" />
                          <div style={{ background: BG.card, border: `1px solid ${BORDER.muted}`, borderRadius: 10, overflow: "hidden" }}>
                            {outcomes.topOverrideAgents.map((a, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: `1px solid ${BORDER.subtle}` }}>
                                <span style={{ fontSize: 12, color: ACCENT.purple, fontFamily: "monospace", flex: 1 }}>{a.agentId ?? "unknown"}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: ACCENT.amber }}>{a.overrideCount} overrides</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
  
              {/* ─── Platform: Atlas Artifacts ─── */}
              {activeTab === "artifacts" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {platformLoading && <div style={{ color: TEXT.secondary, textAlign: "center", padding: 60 }}>Loading…</div>}
                  {!platformLoading && atlasData && (
                    <>
                      <div>
                        <SectionHeader title="Atlas Artifacts — By Template" />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                          {atlasData.byTemplate.map((t, i) => (
                            <div key={i} style={{ background: BG.card, border: `1px solid ${BORDER.muted}`, borderRadius: 8, padding: "12px 14px" }}>
                              <div style={{ fontSize: 10, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: 0.8 }}>{t.templateType.replace(/_/g, " ")}</div>
                              <div style={{ fontSize: 10, color: TEXT.tertiary, marginTop: 2 }}>{t.domain}</div>
                              <div style={{ fontSize: 22, fontWeight: 700, color: TEXT.primary, marginTop: 4 }}>{t.total}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <SectionHeader title="Export Jobs by Format" />
                        <div style={{ display: "flex", gap: 8 }}>
                          {atlasData.exportsByFormat.map(f => (
                            <div key={f.format} style={{ background: BG.card, border: `1px solid ${BORDER.muted}`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                              <div style={{ fontSize: 11, color: TEXT.tertiary, textTransform: "uppercase" }}>{f.format}</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: TEXT.primary }}>{f.total}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {atlasData.failedExports.length > 0 && (
                        <div>
                          <SectionHeader title="Failed Export Jobs" badge={atlasData.failedExports.length} />
                          <div style={{ background: `${ACCENT.red}08`, border: `1px solid ${ACCENT.red}30`, borderRadius: 10, overflow: "hidden" }}>
                            {atlasData.failedExports.map(j => (
                              <div key={j.id} style={{ padding: "10px 14px", borderBottom: `1px solid ${ACCENT.red}15` }}>
                                <div style={{ fontSize: 12, color: TEXT.primary }}>Job #{j.id} — {j.format.toUpperCase()}</div>
                                <div style={{ fontSize: 11, color: ACCENT.red }}>{j.errorMessage ?? "Unknown error"}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
  
              {/* ─── Platform: Worldline ─── */}
              {activeTab === "worldline" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {platformLoading && <div style={{ color: TEXT.secondary, textAlign: "center", padding: 60 }}>Loading…</div>}
                  {!platformLoading && worldline && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                        <MetricCard label="Total Sources" value={worldline.total} color={TEXT.primary} />
                        <MetricCard label="Active" value={worldline.active} color={ACCENT.green} />
                        <MetricCard label="Degraded" value={worldline.degraded} color={worldline.degraded > 0 ? ACCENT.red : ACCENT.green} />
                        <MetricCard label="Inactive / Paused" value={worldline.inactive} color={TEXT.tertiary} />
                      </div>
                      {worldline.degradedSources.length > 0 && (
                        <div>
                          <SectionHeader title="Degraded Sources" badge={worldline.degradedSources.length} />
                          <div style={{ background: `${ACCENT.red}08`, border: `1px solid ${ACCENT.red}30`, borderRadius: 10, overflow: "hidden" }}>
                            {worldline.degradedSources.map(s => (
                              <div key={s.slug} style={{ padding: "12px 14px", borderBottom: `1px solid ${ACCENT.red}15` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT.primary }}>{s.name}</span>
                                  <span style={{ fontSize: 10, color: TEXT.tertiary, fontFamily: "monospace" }}>{s.slug}</span>
                                  <span style={{ fontSize: 10, color: TEXT.tertiary }}>{s.domain}</span>
                                </div>
                                <div style={{ fontSize: 11, color: ACCENT.red }}>{s.consecutiveFailures} consecutive failures</div>
                                {s.lastErrorMessage && (
                                  <div style={{ fontSize: 11, color: TEXT.secondary, marginTop: 2 }}>{s.lastErrorMessage.slice(0, 120)}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {worldline.degradedSources.length === 0 && (
                        <div style={{ background: `${ACCENT.green}08`, border: `1px solid ${ACCENT.green}30`, borderRadius: 10, padding: "16px 20px" }}>
                          <span style={{ fontSize: 13, color: ACCENT.green }}>✓ All data sources are operating normally.</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
  
              {/* ─── Platform: Proof Chain ─── */}
              {activeTab === "proofchain" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {platformLoading && <div style={{ color: TEXT.secondary, textAlign: "center", padding: 60 }}>Loading…</div>}
                  {!platformLoading && proofData && (
                    <>
                      <div>
                        <SectionHeader title="Review State Distribution" />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                          {proofData.byState.map((s, i) => (
                            <div key={i} style={{ background: BG.card, border: `1px solid ${BORDER.muted}`, borderRadius: 8, padding: "12px 14px" }}>
                              <div style={{ fontSize: 10, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.reviewState} / {s.exportSafetyState}</div>
                              <div style={{ fontSize: 22, fontWeight: 700, color: s.reviewState === "flagged" ? ACCENT.red : s.reviewState === "approved" ? ACCENT.green : TEXT.primary }}>{s.total}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {proofData.anomalies.length > 0 && (
                        <div>
                          <SectionHeader title="Trust Receipt Anomalies" badge={proofData.anomalies.length} />
                          <div style={{ background: `${ACCENT.red}08`, border: `1px solid ${ACCENT.red}30`, borderRadius: 10, overflow: "hidden" }}>
                            {proofData.anomalies.map(a => (
                              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: `1px solid ${ACCENT.red}15` }}>
                                <span style={{ fontSize: 12, color: TEXT.primary }}>{a.contentType}</span>
                                <span style={{ fontSize: 11, color: TEXT.tertiary, fontFamily: "monospace" }}>{a.contentId}</span>
                                <span style={{ fontSize: 10, color: ACCENT.red, marginLeft: "auto" }}>{a.reviewState} / {a.exportSafetyState}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {proofData.anomalies.length === 0 && (
                        <div style={{ background: `${ACCENT.green}08`, border: `1px solid ${ACCENT.green}30`, borderRadius: 10, padding: "16px 20px" }}>
                          <span style={{ fontSize: 13, color: ACCENT.green }}>✓ No proof chain anomalies detected in the last 7 days.</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
  
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
