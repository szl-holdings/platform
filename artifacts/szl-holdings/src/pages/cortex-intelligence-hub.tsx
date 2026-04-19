import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";
import {
  Brain, GitBranch, RefreshCw, Zap, FileText,
  AlertTriangle, Network, BookOpen, CheckCircle, Clock,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { apiRequest } from "@/lib/api";
import { CortexIntelligenceFeed, type IntelligenceSignal } from "@szl-holdings/shared-ui/cortex-intelligence-feed";
import { CortexEntityGraph, type EntityGraphNode, type EntityGraphEdge } from "@szl-holdings/shared-ui/cortex-entity-graph";
import { CortexActionDrafts, type ActionDraft } from "@szl-holdings/shared-ui/cortex-action-drafts";
import { CortexWhatIf, type WhatIfResult } from "@szl-holdings/shared-ui/cortex-what-if";

const ACCENT = "#c9a84c";

type HubTab = "feed" | "graph" | "drafts" | "whatif" | "briefing";

const TABS: Array<{ key: HubTab; label: string; icon: React.ElementType }> = [
  { key: "feed", label: "Intelligence Feed", icon: Zap },
  { key: "graph", label: "Entity Graph", icon: Network },
  { key: "drafts", label: "Action Drafts", icon: FileText },
  { key: "whatif", label: "What-If", icon: GitBranch },
  { key: "briefing", label: "Daily Briefing", icon: BookOpen },
];

interface FeedResponse {
  signals: IntelligenceSignal[];
  stats: { total: number; active: number; critical: number; high: number; domainsAffected: string[] };
}

interface GraphResponse {
  nodes: EntityGraphNode[];
  edges: EntityGraphEdge[];
  meta: {
    totalNodes: number;
    totalEdges: number;
    domain: string;
    sinceHours: number | null;
    minRisk: number;
    graphStats: { totalEntities: number; totalRelationships: number };
  };
}

interface DraftsResponse {
  drafts: ActionDraft[];
  total: number;
  pendingCount: number;
}

interface BriefingSignal {
  domain: string;
  level: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  summary: string;
  timestamp: string;
}

interface Briefing {
  id: number;
  briefingDate: string;
  headline: string;
  executiveSummary: string;
  signals: BriefingSignal[];
  domainScores: Record<string, number>;
  totalAlerts: number;
  criticalCount: number;
  highCount: number;
  overallHealth: string;
  generatedAt: string;
  isPublished: boolean;
}

interface BriefingResponse {
  briefing: Briefing;
  cached: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#10b981",
  info: "#64748b",
};

const HEALTH_COLORS: Record<string, string> = {
  nominal: "#10b981",
  elevated: "#eab308",
  degraded: "#f97316",
  critical: "#ef4444",
};

export default function CortexIntelligenceHub() {
  const [activeTab, setActiveTab] = useState<HubTab>("feed");
  const [graphDomain, setGraphDomain] = useState<string | undefined>(undefined);
  const [graphSinceHours, setGraphSinceHours] = useState<number | undefined>(undefined);
  const [graphMinRisk, setGraphMinRisk] = useState(0);
  const qc = useQueryClient();

  const feedQuery = useStandardQuery<FeedResponse>({
    queryKey: ["cortex-intelligence-feed"],
    queryFn: () => apiRequest<FeedResponse>("GET", "/api/cortex/intelligence-feed"),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const graphQuery = useStandardQuery<GraphResponse>({
    queryKey: ["cortex-entity-graph", graphDomain, graphSinceHours, graphMinRisk],
    queryFn: () => {
      const params = new URLSearchParams();
      if (graphDomain) params.set("domain", graphDomain);
      if (graphSinceHours) params.set("since", String(graphSinceHours));
      if (graphMinRisk > 0) params.set("minRisk", String(graphMinRisk / 100));
      const qs = params.toString();
      return apiRequest<GraphResponse>("GET", `/api/cortex/entity-graph${qs ? `?${qs}` : ""}`);
    },
    staleTime: 60000,
  });

  const draftsQuery = useStandardQuery<DraftsResponse>({
    queryKey: ["cortex-action-drafts"],
    queryFn: () => apiRequest<DraftsResponse>("GET", "/api/cortex/action-drafts"),
    refetchInterval: 30000,
  });

  const briefingQuery = useStandardQuery<BriefingResponse>({
    queryKey: ["cortex-briefing-today"],
    queryFn: () => apiRequest<BriefingResponse>("GET", "/api/cortex/briefing/today"),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === "briefing",
  });

  const generateDraftsMutation = useStandardMutation({
    mutationFn: async (signal: IntelligenceSignal) =>
      apiRequest("POST", "/api/cortex/action-drafts/generate", {
        alertId: signal.id,
        alertTitle: signal.title,
        severity: signal.severity,
        affectedDomains: signal.affectedDomains,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cortex-action-drafts"] });
      qc.invalidateQueries({ queryKey: ["cortex-intelligence-feed"] });
      setActiveTab("drafts");
    },
  });

  const approveDraftMutation = useStandardMutation({
    mutationFn: (draftId: string) =>
      apiRequest("POST", `/api/cortex/action-drafts/${draftId}/approve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cortex-action-drafts"] }),
  });

  const dismissDraftMutation = useStandardMutation({
    mutationFn: (draftId: string) =>
      apiRequest("POST", `/api/cortex/action-drafts/${draftId}/dismiss`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cortex-action-drafts"] }),
  });

  const handleWhatIfQuery = useCallback(async (query: string): Promise<WhatIfResult> => {
    return apiRequest<WhatIfResult>("POST", "/api/cortex/whatif", { query });
  }, []);

  const signals = feedQuery.data?.signals ?? [];
  const stats = feedQuery.data?.stats;
  const pendingCount = draftsQuery.data?.pendingCount ?? 0;
  const briefing = briefingQuery.data?.briefing;

  return (
    <div style={{ minHeight: "100vh", background: "#060609", color: "#ffffff", fontFamily: "system-ui, sans-serif" }}>
      <SiteNav />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Brain size={20} color={ACCENT} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
                CORTEX Intelligence Hub
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: "#ffffff60" }}>
                Cross-domain fusion engine · Palantir-style entity graph · Autonomous action layer · Daily briefing
              </p>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              {stats?.critical != null && stats.critical > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#ef4444", background: "#ef444415", border: "1px solid #ef444440", borderRadius: 6, padding: "5px 10px" }}>
                  <AlertTriangle size={12} />
                  {stats.critical} CRITICAL
                </div>
              )}
              {pendingCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: ACCENT, background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`, borderRadius: 6, padding: "5px 10px" }}>
                  <FileText size={12} />
                  {pendingCount} drafts pending
                </div>
              )}
              <button
                onClick={() => { feedQuery.refetch(); draftsQuery.refetch(); graphQuery.refetch(); briefingQuery.refetch(); }}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#ffffff70", background: "transparent", border: "1px solid #ffffff15", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 20 }}>
            {[
              { label: "Active Signals", value: stats?.active ?? "—", color: "#ffffff" },
              { label: "Critical", value: stats?.critical ?? "—", color: "#ef4444" },
              { label: "High", value: stats?.high ?? "—", color: "#f97316" },
              { label: "Drafts Pending", value: pendingCount, color: ACCENT },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#ffffff06", border: "1px solid #ffffff10", borderRadius: 8, padding: "12px 16px" }}>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "#ffffff50", letterSpacing: "0.05em" }}>{label.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </m.div>

        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #ffffff12", marginBottom: 24 }}>
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            const badge = key === "drafts" ? pendingCount : key === "feed" ? (stats?.active ?? 0) : 0;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", background: "transparent", border: "none", borderBottom: `2px solid ${isActive ? ACCENT : "transparent"}`, color: isActive ? ACCENT : "#ffffff60", cursor: "pointer", fontSize: 13, fontWeight: 600, letterSpacing: "0.01em", transition: "color 0.15s, border-color 0.15s" }}
              >
                <Icon size={14} />
                {label}
                {badge > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8, background: isActive ? `${ACCENT}30` : "#ffffff15", color: isActive ? ACCENT : "#ffffff60" }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <m.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {activeTab === "feed" && (
              <CortexIntelligenceFeed
                signals={signals}
                stats={stats}
                accentColor={ACCENT}
                loading={feedQuery.isLoading}
                onGenerateDrafts={(signal) => generateDraftsMutation.mutate(signal)}
                onAcknowledge={async (id) => {
                  await apiRequest("POST", `/api/fusion/alerts/${id}/acknowledge`, {});
                  feedQuery.refetch();
                }}
              />
            )}

            {activeTab === "graph" && (
              <div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#ffffff80", lineHeight: 1.6 }}>
                  Force-directed entity relationship graph showing cross-domain connections. Filter by domain, entity type, time window, and risk threshold. Click any node to inspect.
                </p>
                <CortexEntityGraph
                  nodes={graphQuery.data?.nodes ?? []}
                  edges={graphQuery.data?.edges ?? []}
                  meta={graphQuery.data?.meta}
                  accentColor={ACCENT}
                  height={500}
                  loading={graphQuery.isLoading}
                  filterDomain={graphDomain}
                  onFilterDomain={setGraphDomain}
                  sinceHours={graphSinceHours}
                  onSinceHoursChange={setGraphSinceHours}
                  minRisk={graphMinRisk}
                  onMinRiskChange={setGraphMinRisk}
                />
              </div>
            )}

            {activeTab === "drafts" && (
              <div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#ffffff80", lineHeight: 1.6 }}>
                  When CORTEX detects a cross-domain correlation, it autonomously drafts appropriate responses — legal holds, LP notifications, insurance claims, route changes — and queues them for your one-click approval. All approvals are persisted with a governance audit trail. No action is taken without human sign-off.
                </p>
                <CortexActionDrafts
                  drafts={draftsQuery.data?.drafts ?? []}
                  pendingCount={pendingCount}
                  accentColor={ACCENT}
                  loading={draftsQuery.isLoading}
                  onApprove={(id) => approveDraftMutation.mutateAsync(id).then(() => undefined)}
                  onDismiss={(id) => dismissDraftMutation.mutateAsync(id).then(() => undefined)}
                />
              </div>
            )}

            {activeTab === "whatif" && (
              <div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#ffffff80", lineHeight: 1.6 }}>
                  Ask CORTEX any hypothetical scenario and it traces projected impact across all connected domains — maritime routes, legal obligations, insurance exposure, and portfolio value — using the cross-domain entity graph and historical pattern library.
                </p>
                <CortexWhatIf accentColor={ACCENT} onQuery={handleWhatIfQuery} />
              </div>
            )}

            {activeTab === "briefing" && (
              <div>
                {briefingQuery.isLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#ffffff50", fontSize: 14, padding: "40px 0" }}>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                    Generating CORTEX intelligence briefing...
                  </div>
                ) : briefing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: "#ffffff06", border: "1px solid #ffffff12", borderRadius: 10, padding: "20px 24px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                        <BookOpen size={18} color={ACCENT} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#ffffff40", letterSpacing: "0.1em" }}>
                            EXECUTIVE BRIEFING — {briefing.briefingDate}
                            {briefingQuery.data?.cached && " (CACHED)"}
                          </p>
                          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#ffffff", lineHeight: 1.3 }}>
                            {briefing.headline}
                          </h2>
                        </div>
                        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                            color: HEALTH_COLORS[briefing.overallHealth] ?? "#ffffff",
                            background: `${HEALTH_COLORS[briefing.overallHealth] ?? "#ffffff"}20`,
                            border: `1px solid ${HEALTH_COLORS[briefing.overallHealth] ?? "#ffffff"}40`,
                            letterSpacing: "0.05em",
                          }}>
                            {briefing.overallHealth.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                        {[
                          { label: "Total Alerts", value: briefing.totalAlerts, icon: AlertTriangle, color: "#ffffff" },
                          { label: "Critical", value: briefing.criticalCount, icon: AlertTriangle, color: "#ef4444" },
                          { label: "High", value: briefing.highCount, icon: CheckCircle, color: "#f97316" },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ background: "#ffffff05", borderRadius: 8, padding: "10px 14px" }}>
                            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color }}>{value}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#ffffff40", letterSpacing: "0.05em" }}>{label.toUpperCase()}</p>
                          </div>
                        ))}
                      </div>

                      <p style={{ margin: "0 0 16px", fontSize: 14, color: "#ffffff90", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                        {briefing.executiveSummary}
                      </p>

                      {Object.keys(briefing.domainScores).length > 0 && (
                        <div>
                          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#ffffff40", letterSpacing: "0.1em" }}>DOMAIN HEALTH SCORES</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {Object.entries(briefing.domainScores).map(([domain, score]) => {
                              const color = score >= 80 ? "#10b981" : score >= 50 ? "#eab308" : "#ef4444";
                              return (
                                <div key={domain} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 6 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                                  <span style={{ fontSize: 11, color: "#ffffff70", fontWeight: 600 }}>{domain}</span>
                                  <span style={{ fontSize: 11, color, fontWeight: 700 }}>{score}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {briefing.signals.length > 0 && (
                      <div style={{ background: "#ffffff06", border: "1px solid #ffffff12", borderRadius: 10, padding: "20px 24px" }}>
                        <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#ffffff40", letterSpacing: "0.1em" }}>
                          TOP SIGNALS
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {briefing.signals.map((sig, i) => {
                            const color = SEVERITY_COLORS[sig.level] ?? "#6b7280";
                            return (
                              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 6 }} />
                                <div>
                                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "#ffffff" }}>{sig.title}</p>
                                  <p style={{ margin: 0, fontSize: 12, color: "#ffffff60", lineHeight: 1.5 }}>{sig.summary}</p>
                                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.05em" }}>{sig.level.toUpperCase()}</span>
                                    <span style={{ fontSize: 10, color: "#ffffff40" }}>·</span>
                                    <span style={{ fontSize: 10, color: "#ffffff40" }}>{sig.domain}</span>
                                    <span style={{ fontSize: 10, color: "#ffffff40" }}>·</span>
                                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#ffffff40" }}>
                                      <Clock size={9} />{new Date(sig.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: "#ffffff50", fontSize: 14 }}>No briefing available yet.</p>
                )}
              </div>
            )}
          </m.div>
        </AnimatePresence>
      </div>

      <SiteFooter />
    </div>
  );
}
