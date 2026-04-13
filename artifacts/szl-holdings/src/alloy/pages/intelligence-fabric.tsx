import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import {
  Network, Brain, GitBranch, Activity, Search, Zap, RefreshCw, BarChart2,
  Shield, CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown,
  Layers, Database, Target, ChevronRight, Clock, Cpu, Eye, Filter,
  FileText, Link, Hash, Star, Box, Package, Play,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@szl-holdings/shared-ui/utils";

const S = {
  page: {
    padding: "1.5rem",
    maxWidth: "1400px",
    margin: "0 auto",
  } as React.CSSProperties,
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    gap: "1rem",
  } as React.CSSProperties,
  title: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "hsl(38,8%,92%)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  } as React.CSSProperties,
  subtitle: {
    fontSize: "0.8rem",
    color: "hsl(214,7%,55%)",
    marginTop: "0.2rem",
  } as React.CSSProperties,
  grid: (cols = 4) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: "1rem",
    marginBottom: "1.5rem",
  } as React.CSSProperties),
  card: {
    background: "hsla(214,16%,8%,0.95)",
    border: "1px solid hsla(0,0%,100%,0.07)",
    borderRadius: "8px",
    padding: "1.25rem",
  } as React.CSSProperties,
  statCard: {
    background: "hsla(214,16%,8%,0.95)",
    border: "1px solid hsla(0,0%,100%,0.07)",
    borderRadius: "8px",
    padding: "1rem 1.25rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  },
  statLabel: { fontSize: "0.75rem", color: "hsl(214,7%,55%)", textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  statValue: { fontSize: "1.5rem", fontWeight: 700, color: "hsl(38,8%,92%)" },
  sectionTitle: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "hsl(38,8%,80%)",
    marginBottom: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  } as React.CSSProperties,
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "1rem",
  } as React.CSSProperties,
  badge: (color: string) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    background: color,
    color: "hsl(38,8%,92%)",
  }),
  btn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.45rem 0.875rem",
    background: "hsla(0,0%,100%,0.06)",
    border: "1px solid hsla(0,0%,100%,0.1)",
    borderRadius: "6px",
    color: "hsl(38,8%,90%)",
    fontSize: "0.8rem",
    cursor: "pointer",
  } as React.CSSProperties,
  tableRow: {
    display: "grid",
    gap: "0.5rem",
    padding: "0.75rem",
    borderRadius: "6px",
    background: "hsla(0,0%,100%,0.03)",
    marginBottom: "0.4rem",
    fontSize: "0.82rem",
    color: "hsl(38,8%,85%)",
  } as React.CSSProperties,
  input: {
    flex: 1,
    padding: "0.5rem 0.75rem",
    background: "hsla(0,0%,100%,0.05)",
    border: "1px solid hsla(0,0%,100%,0.1)",
    borderRadius: "6px",
    color: "hsl(38,8%,90%)",
    fontSize: "0.85rem",
    outline: "none",
  } as React.CSSProperties,
};

const riskColor: Record<string, string> = {
  critical: "hsla(0,80%,50%,0.25)",
  high: "hsla(20,80%,50%,0.25)",
  medium: "hsla(45,80%,50%,0.25)",
  low: "hsla(120,60%,50%,0.25)",
  informational: "hsla(210,60%,50%,0.25)",
};

const gradeColor: Record<string, string> = {
  A: "hsla(120,60%,45%,0.25)",
  B: "hsla(180,60%,45%,0.25)",
  C: "hsla(45,80%,45%,0.25)",
  D: "hsla(20,80%,45%,0.25)",
  F: "hsla(0,80%,45%,0.25)",
};

function Spinner() {
  return <div style={{ display: "flex", justifyContent: "center", padding: "3rem", color: "hsl(214,7%,55%)" }}><RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }} /></div>;
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem", color: "hsl(214,7%,45%)" }}>
      <Icon size={32} style={{ margin: "0 auto 0.75rem" }} />
      <p style={{ fontSize: "0.85rem" }}>{text}</p>
    </div>
  );
}

// ─── Knowledge Graph Page ────────────────────────────────────────────────────

export function KnowledgeGraphPage() {
  const [query, setQuery] = useState("");
  const [extractContent, setExtractContent] = useState("");
  const [extractDomain, setExtractDomain] = useState("general");
  const [view, setView] = useState<"stats" | "query" | "extract">("stats");
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<any>({
    queryKey: ["kg-stats"],
    queryFn: () => apiFetch("/api/alloy/intelligence/knowledge-graph/stats?orgId=1"),
  });

  const queryMutation = useMutation({
    mutationFn: (q: string) => apiFetch("/api/alloy/intelligence/knowledge-graph/query", {
      method: "POST",
      body: JSON.stringify({ query: q, maxHops: 3, orgId: 1 }),
    }),
  });

  const extractMutation = useMutation({
    mutationFn: () => apiFetch("/api/alloy/intelligence/knowledge-graph/extract", {
      method: "POST",
      body: JSON.stringify({ content: extractContent, domain: extractDomain, orgId: 1, sourceSystem: "ui" }),
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kg-stats"] }); refetchStats(); },
  });

  const s = stats?.data ?? stats ?? {};
  const domains = s.domains ?? {};
  const entityTypes = s.entityTypes ?? {};

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}><Network size={20} /> Knowledge Graph Explorer</h1>
          <div style={S.subtitle}>Cross-domain entity fabric with multi-hop graph traversal</div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["stats", "query", "extract"] as const).map(v => (
            <button key={v} style={{ ...S.btn, background: view === v ? "hsla(38,80%,60%,0.15)" : "hsla(0,0%,100%,0.04)", borderColor: view === v ? "hsla(38,80%,60%,0.3)" : "hsla(0,0%,100%,0.08)" }} onClick={() => setView(v)}>
              {v === "stats" ? <BarChart2 size={14} /> : v === "query" ? <Search size={14} /> : <Database size={14} />}
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <button style={S.btn} onClick={() => refetchStats()}><RefreshCw size={14} /></button>
        </div>
      </div>

      {view === "stats" && (
        <>
          {statsLoading ? <Spinner /> : (
            <>
              <div style={S.grid(4)}>
                {[
                  { label: "Total Entities", value: s.totalEntities ?? 0, icon: Network },
                  { label: "Total Links", value: s.totalLinks ?? 0, icon: Link },
                  { label: "Cross-Domain Links", value: s.crossDomainLinks ?? 0, icon: GitBranch },
                  { label: "Active Domains", value: Object.keys(domains).length, icon: Layers },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} style={S.statCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={S.statLabel}>{label}</span>
                      <Icon size={16} style={{ color: "hsl(214,7%,45%)" }} />
                    </div>
                    <div style={S.statValue}>{value.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div style={S.row}>
                <div style={S.card}>
                  <div style={S.sectionTitle}><Layers size={14} /> Entities by Domain</div>
                  {Object.entries(domains).length === 0 ? (
                    <EmptyState icon={Network} text="No entities extracted yet" />
                  ) : (
                    Object.entries(domains).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([domain, count]) => (
                      <div key={domain} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
                        <span style={{ fontSize: "0.82rem", color: "hsl(38,8%,80%)" }}>{domain}</span>
                        <span style={{ fontSize: "0.82rem", color: "hsl(214,7%,55%)", fontWeight: 600 }}>{(count as number).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
                <div style={S.card}>
                  <div style={S.sectionTitle}><Hash size={14} /> Entity Type Distribution</div>
                  {Object.entries(entityTypes).length === 0 ? (
                    <EmptyState icon={Box} text="No entity types yet" />
                  ) : (
                    Object.entries(entityTypes).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([type, count]) => (
                      <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
                        <span style={{ fontSize: "0.82rem", color: "hsl(38,8%,80%)", textTransform: "capitalize" }}>{type.replace(/_/g, " ")}</span>
                        <span style={{ fontSize: "0.82rem", color: "hsl(214,7%,55%)", fontWeight: 600 }}>{(count as number).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {view === "query" && (
        <div style={S.card}>
          <div style={S.sectionTitle}><Search size={14} /> Multi-Hop Graph Query</div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              style={S.input}
              placeholder="e.g. Which vessels are linked to sanctioned entities?"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && query && queryMutation.mutate(query)}
            />
            <button
              style={{ ...S.btn, background: "hsla(38,80%,60%,0.15)", borderColor: "hsla(38,80%,60%,0.3)" }}
              onClick={() => query && queryMutation.mutate(query)}
              disabled={queryMutation.isPending}
            >
              {queryMutation.isPending ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={14} />}
              Query
            </button>
          </div>
          {queryMutation.isPending && <Spinner />}
          {(queryMutation.data as any) && (() => {
            const r = (queryMutation.data as any)?.data ?? queryMutation.data as any;
            return (
              <div>
                <div style={{ ...S.card, background: "hsla(120,30%,15%,0.3)", borderColor: "hsla(120,60%,50%,0.2)", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.85rem", color: "hsl(38,8%,90%)", lineHeight: 1.6 }}>{r.summary}</div>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.8rem", color: "hsl(214,7%,55%)" }}>{r.nodes?.length ?? 0} nodes traversed</span>
                  <span style={{ fontSize: "0.8rem", color: "hsl(214,7%,55%)" }}>{r.edges?.length ?? 0} edges explored</span>
                  <span style={{ fontSize: "0.8rem", color: "hsl(214,7%,55%)" }}>{r.hops} max hops</span>
                  {r.domainsReached?.map((d: string) => (
                    <span key={d} style={S.badge("hsla(210,60%,50%,0.2)")}>{d}</span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {view === "extract" && (
        <div style={S.card}>
          <div style={S.sectionTitle}><Database size={14} /> Extract Entities & Triples</div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <select
              value={extractDomain}
              onChange={e => setExtractDomain(e.target.value)}
              style={{ ...S.input, flex: "0 0 160px" }}
            >
              {["general", "maritime", "defense", "legal", "real_estate", "consulting"].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <textarea
            style={{ ...S.input, display: "block", width: "100%", minHeight: "150px", resize: "vertical", fontFamily: "inherit", marginBottom: "0.75rem" }}
            placeholder="Paste text content to extract entities and triples from..."
            value={extractContent}
            onChange={e => setExtractContent(e.target.value)}
          />
          <button
            style={{ ...S.btn, background: "hsla(38,80%,60%,0.15)", borderColor: "hsla(38,80%,60%,0.3)" }}
            onClick={() => extractMutation.mutate()}
            disabled={extractMutation.isPending || !extractContent}
          >
            {extractMutation.isPending ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Brain size={14} />}
            Extract Entities
          </button>
          {(extractMutation.data as any) && (() => {
            const r = (extractMutation.data as any)?.data ?? extractMutation.data as any;
            return (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                  <span style={S.badge("hsla(120,60%,50%,0.2)")}>{r.entities?.length ?? 0} entities</span>
                  <span style={S.badge("hsla(210,60%,50%,0.2)")}>{r.triples?.length ?? 0} triples</span>
                  <span style={{ fontSize: "0.8rem", color: "hsl(214,7%,55%)" }}>{r.latencyMs}ms</span>
                </div>
                {r.entities?.slice(0, 8).map((e: any, i: number) => (
                  <div key={i} style={{ ...S.tableRow, gridTemplateColumns: "1fr auto auto" }}>
                    <span style={{ fontWeight: 600 }}>{e.name}</span>
                    <span style={S.badge("hsla(210,60%,50%,0.2)")}>{e.entityType}</span>
                    <span style={{ color: "hsl(214,7%,55%)" }}>{(e.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Eval Scorecard Page ─────────────────────────────────────────────────────

export function EvalScorecardPage() {
  const [selectedAgent, setSelectedAgent] = useState("szl-orchestrator");
  const [agentInput, setAgentInput] = useState("szl-orchestrator");

  const { data: dashboard, isLoading: dashLoading, refetch: refetchDash } = useQuery<any>({
    queryKey: ["eval-dashboard"],
    queryFn: () => apiFetch("/api/alloy/intelligence/eval/dashboard"),
  });

  const { data: scorecard, isLoading: scorecardLoading, refetch: refetchScore } = useQuery<any>({
    queryKey: ["eval-scorecard", selectedAgent],
    queryFn: () => apiFetch(`/api/alloy/intelligence/eval/scorecard/${encodeURIComponent(selectedAgent)}`),
    enabled: !!selectedAgent,
  });

  const d = dashboard?.data ?? dashboard ?? {};
  const sc = scorecard?.data ?? scorecard ?? {};

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}><BarChart2 size={20} /> Eval Scorecards</h1>
          <div style={S.subtitle}>Agent performance tracking with precision/recall/F1 and drift detection</div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            style={{ ...S.input, width: "220px" }}
            placeholder="Agent ID..."
            value={agentInput}
            onChange={e => setAgentInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") setSelectedAgent(agentInput); }}
          />
          <button style={S.btn} onClick={() => { setSelectedAgent(agentInput); refetchScore(); }}>
            <Search size={14} />
          </button>
          <button style={S.btn} onClick={() => { refetchDash(); refetchScore(); }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {dashLoading ? <Spinner /> : (
        <div style={S.grid(4)}>
          {[
            { label: "Eval Runs (30d)", value: d.totalEvalRuns ?? 0, icon: Activity },
            { label: "Active Agents", value: d.activeAgents ?? 0, icon: Brain },
            { label: "Platform Pass Rate", value: `${((d.avgPlatformPassRate ?? 0) * 100).toFixed(1)}%`, icon: CheckCircle },
            { label: "Critical Drift Alerts", value: d.criticalDriftAlerts ?? 0, icon: AlertTriangle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={S.statCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={S.statLabel}>{label}</span>
                <Icon size={16} style={{ color: "hsl(214,7%,45%)" }} />
              </div>
              <div style={S.statValue}>{value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      <div style={S.row}>
        <div style={S.card}>
          <div style={S.sectionTitle}><Star size={14} /> Agent Leaderboard</div>
          {(d.agentScores ?? []).map((a: any) => (
            <div
              key={a.agentId}
              onClick={() => { setSelectedAgent(a.agentId); setAgentInput(a.agentId); }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", borderRadius: "6px", marginBottom: "0.3rem", cursor: "pointer", background: selectedAgent === a.agentId ? "hsla(38,80%,60%,0.08)" : "hsla(0,0%,100%,0.02)", border: `1px solid ${selectedAgent === a.agentId ? "hsla(38,80%,60%,0.2)" : "transparent"}` }}
            >
              <span style={{ fontSize: "0.82rem", color: "hsl(38,8%,85%)", fontFamily: "monospace" }}>{a.agentId}</span>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "hsl(214,7%,55%)" }}>{(a.score * 100).toFixed(1)}%</span>
                <span style={S.badge(gradeColor[a.grade] ?? "hsla(0,0%,50%,0.2)")}>{a.grade}</span>
              </div>
            </div>
          ))}
          {(d.agentScores ?? []).length === 0 && <EmptyState icon={BarChart2} text="No eval data yet — run an eval to populate" />}
        </div>

        <div style={S.card}>
          <div style={S.sectionTitle}><Shield size={14} /> Agent Scorecard: {selectedAgent}</div>
          {scorecardLoading ? <Spinner /> : (
            <div>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                {[
                  { label: "Overall Score", value: `${((sc.overallScore ?? 0) * 100).toFixed(1)}%` },
                  { label: "Grade", value: sc.grade ?? "N/A" },
                  { label: "Drift Alerts", value: sc.driftAlerts?.length ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} style={S.statCard}>
                    <span style={S.statLabel}>{label}</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "hsl(38,8%,92%)" }}>{value}</span>
                  </div>
                ))}
              </div>

              {sc.precisionRecallMetrics && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={S.sectionTitle}><Target size={13} /> Precision / Recall / F1</div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {[
                      ["Precision", sc.precisionRecallMetrics.precision],
                      ["Recall", sc.precisionRecallMetrics.recall],
                      ["F1 Score", sc.precisionRecallMetrics.f1],
                    ].map(([l, v]: any) => (
                      <div key={l} style={S.statCard}>
                        <span style={S.statLabel}>{l}</span>
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: "hsl(38,8%,92%)" }}>{(v * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sc.driftAlerts?.length > 0 && (
                <div>
                  <div style={S.sectionTitle}><AlertTriangle size={13} /> Drift Alerts</div>
                  {sc.driftAlerts.map((a: any, i: number) => (
                    <div key={i} style={{ ...S.tableRow, background: a.severity === "critical" ? "hsla(0,80%,50%,0.08)" : "hsla(45,80%,50%,0.08)", gridTemplateColumns: "1fr auto auto" }}>
                      <span>{a.metric} degraded by {(Math.abs(a.delta) * 100).toFixed(1)}%</span>
                      <span style={{ color: a.direction === "degraded" ? "hsl(0,80%,60%)" : "hsl(120,60%,60%)" }}>
                        {a.direction === "degraded" ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                      </span>
                      <span style={S.badge(a.severity === "critical" ? "hsla(0,80%,50%,0.25)" : "hsla(45,80%,50%,0.25)")}>{a.severity}</span>
                    </div>
                  ))}
                </div>
              )}

              {(sc.trend ?? []).length > 0 && (
                <div>
                  <div style={S.sectionTitle}><Activity size={13} /> Performance Trend (last {sc.trend.length} runs)</div>
                  <div style={{ display: "flex", gap: "0.3rem", alignItems: "flex-end", height: "60px" }}>
                    {sc.trend.slice(-20).map((t: any, i: number) => (
                      <div key={i} title={`${t.date}: ${(t.passRate * 100).toFixed(1)}%`} style={{ flex: 1, background: t.passRate >= 0.8 ? "hsla(120,60%,50%,0.5)" : t.passRate >= 0.6 ? "hsla(45,80%,50%,0.5)" : "hsla(0,80%,50%,0.5)", borderRadius: "2px 2px 0 0", height: `${Math.max(4, t.passRate * 60)}px` }} />
                    ))}
                  </div>
                </div>
              )}
              {(sc.trend ?? []).length === 0 && <EmptyState icon={BarChart2} text="No trend data yet for this agent" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Enrichment Trace Page ───────────────────────────────────────────────────

export function EnrichmentTracePage() {
  const [domainFilter, setDomainFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const { data: reports, isLoading, refetch } = useQuery<any>({
    queryKey: ["enrichment-reports", domainFilter, riskFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "30" });
      if (domainFilter) params.set("domain", domainFilter);
      if (riskFilter) params.set("riskLevel", riskFilter);
      return apiFetch(`/api/alloy/intelligence/enrichment/reports?${params}`);
    },
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["enrichment-stats"],
    queryFn: () => apiFetch("/api/alloy/intelligence/enrichment/stats"),
  });

  const s = stats?.data ?? stats ?? {};
  const rs = (reports?.data ?? reports ?? []) as any[];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}><Zap size={20} /> Signal Enrichment Traces</h1>
          <div style={S.subtitle}>Autonomous enrichment loop with MITRE ATT&CK, IMO taxonomy mapping</div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} style={{ ...S.input, width: "130px" }}>
            <option value="">All Domains</option>
            {["maritime", "defense", "legal", "real_estate", "consulting"].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{ ...S.input, width: "130px" }}>
            <option value="">All Risk Levels</option>
            {["critical", "high", "medium", "low", "informational"].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button style={S.btn} onClick={() => refetch()}><RefreshCw size={14} /></button>
        </div>
      </div>

      <div style={S.grid(4)}>
        {[
          { label: "Total Reports", value: s.totalReports ?? 0, icon: FileText },
          { label: "Avg Confidence", value: `${((s.avgConfidence ?? 0) * 100).toFixed(1)}%`, icon: Target },
          { label: "Avg Tokens/Report", value: s.avgTokensPerReport ?? 0, icon: Cpu },
          { label: "Domains Active", value: Object.keys(s.reportsByDomain ?? {}).length, icon: Layers },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} style={S.statCard}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={S.statLabel}>{label}</span>
              <Icon size={16} style={{ color: "hsl(214,7%,45%)" }} />
            </div>
            <div style={S.statValue}>{typeof value === "number" ? value.toLocaleString() : value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "1rem" }}>
        <div style={S.card}>
          <div style={S.sectionTitle}><Zap size={14} /> Enrichment Reports</div>
          {isLoading ? <Spinner /> : rs.length === 0 ? (
            <EmptyState icon={Zap} text="No enrichment reports yet" />
          ) : (
            rs.map((r: any) => (
              <div
                key={r.reportId}
                onClick={() => setSelected(selected?.reportId === r.reportId ? null : r)}
                style={{ ...S.tableRow, gridTemplateColumns: "1fr auto auto", cursor: "pointer", background: selected?.reportId === r.reportId ? "hsla(38,80%,60%,0.08)" : "hsla(0,0%,100%,0.03)", border: `1px solid ${selected?.reportId === r.reportId ? "hsla(38,80%,60%,0.2)" : "transparent"}` }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.15rem" }}>{r.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "hsl(214,7%,55%)" }}>{r.domain} · {r.enrichmentSteps?.length ?? 0} steps · {r.totalTokensUsed} tokens</div>
                </div>
                <span style={S.badge(riskColor[r.riskLevel] ?? "hsla(0,0%,50%,0.2)")}>{r.riskLevel}</span>
                <span style={{ fontSize: "0.75rem", color: "hsl(214,7%,55%)" }}>{(r.confidenceScore * 100).toFixed(0)}%</span>
              </div>
            ))
          )}
        </div>

        {selected && (
          <div style={S.card}>
            <div style={S.sectionTitle}><Eye size={14} /> {selected.title}</div>
            <div style={{ fontSize: "0.82rem", color: "hsl(38,8%,80%)", marginBottom: "1rem", lineHeight: 1.6 }}>{selected.executiveSummary}</div>

            {selected.taxonomyMapping && Object.entries(selected.taxonomyMapping).length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={S.sectionTitle}><Hash size={13} /> Taxonomy Mapping</div>
                {Object.entries(selected.taxonomyMapping).map(([tax, cats]: [string, any]) => (
                  <div key={tax} style={{ marginBottom: "0.5rem" }}>
                    <div style={{ fontSize: "0.75rem", color: "hsl(214,7%,55%)", marginBottom: "0.25rem" }}>{tax}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {cats.map((c: string) => <span key={c} style={S.badge("hsla(210,60%,50%,0.2)")}>{c}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={S.sectionTitle}><ChevronRight size={13} /> Enrichment Steps</div>
            {selected.enrichmentSteps?.map((step: any) => (
              <div key={step.stepId} style={{ ...S.tableRow, gridTemplateColumns: "1fr auto" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.15rem", fontSize: "0.78rem" }}>{step.action}</div>
                  {step.findings && <div style={{ fontSize: "0.73rem", color: "hsl(214,7%,55%)" }}>{step.findings}</div>}
                </div>
                <span style={{ fontSize: "0.73rem", color: "hsl(214,7%,55%)" }}>{step.tokensUsed > 0 ? `${step.tokensUsed}t` : ""}</span>
              </div>
            ))}

            {selected.analystRecommendations?.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <div style={S.sectionTitle}><Target size={13} /> Analyst Recommendations</div>
                {selected.analystRecommendations.map((r: string, i: number) => (
                  <div key={i} style={{ fontSize: "0.82rem", color: "hsl(38,8%,80%)", padding: "0.3rem 0", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>· {r}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PTC Logs Page ───────────────────────────────────────────────────────────

export function PtcLogsPage() {
  const [agentFilter, setAgentFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const { data: scripts, isLoading, refetch } = useQuery<any>({
    queryKey: ["ptc-scripts", agentFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "30" });
      if (agentFilter) params.set("agentId", agentFilter);
      return apiFetch(`/api/alloy/intelligence/ptc/scripts?${params}`);
    },
  });

  const { data: ptcStats } = useQuery<any>({
    queryKey: ["ptc-stats"],
    queryFn: () => apiFetch("/api/alloy/intelligence/ptc/stats"),
  });

  const s = ptcStats?.data ?? ptcStats ?? {};
  const ss = (scripts?.data ?? scripts ?? []) as any[];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}><Cpu size={20} /> PTC Execution Logs</h1>
          <div style={S.subtitle}>Programmatic tool calling — parallel execution plans & round-trip optimization</div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            style={{ ...S.input, width: "180px" }}
            placeholder="Filter by agent..."
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
          />
          <button style={S.btn} onClick={() => refetch()}><RefreshCw size={14} /></button>
        </div>
      </div>

      <div style={S.grid(4)}>
        {[
          { label: "Total Scripts", value: s.totalScripts ?? 0, icon: FileText },
          { label: "Round-Trips Saved", value: s.totalRoundTripsEliminated ?? 0, icon: Zap },
          { label: "Avg Optimization", value: `${((s.avgOptimizationRatio ?? 0)).toFixed(1)}×`, icon: TrendingUp },
          { label: "Tools Used", value: s.toolUsageRanking?.length ?? 0, icon: Package },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} style={S.statCard}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={S.statLabel}>{label}</span>
              <Icon size={16} style={{ color: "hsl(214,7%,45%)" }} />
            </div>
            <div style={S.statValue}>{typeof value === "number" ? value.toLocaleString() : value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "1rem" }}>
        <div style={S.card}>
          <div style={S.sectionTitle}><Cpu size={14} /> PTC Scripts</div>
          {isLoading ? <Spinner /> : ss.length === 0 ? (
            <EmptyState icon={Cpu} text="No PTC scripts yet — scripts are generated when AI agents plan parallel tool calls" />
          ) : (
            ss.map((script: any) => (
              <div
                key={script.scriptId}
                onClick={() => setSelected(selected?.scriptId === script.scriptId ? null : script)}
                style={{ ...S.tableRow, gridTemplateColumns: "1fr auto auto auto", cursor: "pointer", background: selected?.scriptId === script.scriptId ? "hsla(38,80%,60%,0.08)" : "hsla(0,0%,100%,0.03)", border: `1px solid ${selected?.scriptId === script.scriptId ? "hsla(38,80%,60%,0.2)" : "transparent"}` }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.15rem", fontSize: "0.82rem" }}>{script.taskDescription.slice(0, 60)}{script.taskDescription.length > 60 ? "..." : ""}</div>
                  <div style={{ fontSize: "0.73rem", color: "hsl(214,7%,55%)" }}>{script.agentId} · {script.toolsUsed?.length ?? 0} tools · {script.latencyMs}ms</div>
                </div>
                <span style={S.badge(script.status === "completed" ? "hsla(120,60%,50%,0.2)" : script.status === "failed" ? "hsla(0,80%,50%,0.2)" : "hsla(210,60%,50%,0.2)")}>{script.status}</span>
                <span style={{ fontSize: "0.78rem", color: "hsl(120,60%,60%)" }}>-{script.roundTripsEliminated} trips</span>
                <span style={{ fontSize: "0.73rem", color: "hsl(214,7%,55%)" }}>{script.createdAt.split("T")[0]}</span>
              </div>
            ))
          )}
        </div>

        {selected && (
          <div style={S.card}>
            <div style={S.sectionTitle}><Eye size={14} /> Script Details</div>
            <div style={{ fontSize: "0.85rem", color: "hsl(38,8%,85%)", marginBottom: "1rem" }}>{selected.taskDescription}</div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <span style={S.badge("hsla(120,60%,50%,0.2)")}>{selected.roundTripsEliminated} trips eliminated</span>
              <span style={S.badge("hsla(210,60%,50%,0.2)")}>{selected.toolsUsed?.length ?? 0} tools</span>
              <span style={{ fontSize: "0.78rem", color: "hsl(214,7%,55%)" }}>{selected.latencyMs}ms</span>
            </div>

            {selected.toolsUsed?.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={S.sectionTitle}><Package size={13} /> Tools Used</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {selected.toolsUsed.map((t: string) => <span key={t} style={S.badge("hsla(210,60%,50%,0.15)")}>{t}</span>)}
                </div>
              </div>
            )}

            <div style={S.sectionTitle}><FileText size={13} /> Generated Execution Plan</div>
            <pre style={{ fontSize: "0.73rem", color: "hsl(214,7%,65%)", background: "hsla(0,0%,0%,0.3)", padding: "0.75rem", borderRadius: "6px", overflow: "auto", maxHeight: "200px", whiteSpace: "pre-wrap" }}>
              {selected.generatedCode || "No code generated"}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Context Monitor Page ────────────────────────────────────────────────────

export function ContextMonitorPage() {
  const [agentId, setAgentId] = useState("szl-orchestrator");
  const [agentInput, setAgentInput] = useState("szl-orchestrator");
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState("observation");
  const queryClient = useQueryClient();

  const { data: notes, isLoading: notesLoading, refetch: refetchNotes } = useQuery<any>({
    queryKey: ["context-notes", agentId],
    queryFn: () => apiFetch(`/api/alloy/intelligence/context/notes?agentId=${encodeURIComponent(agentId)}&limit=20`),
    enabled: !!agentId,
  });

  const { data: ctxStats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["context-stats", agentId],
    queryFn: () => apiFetch(`/api/alloy/intelligence/context/stats/${encodeURIComponent(agentId)}`),
    enabled: !!agentId,
  });

  const writeMutation = useMutation({
    mutationFn: () => apiFetch("/api/alloy/intelligence/context/notes", {
      method: "POST",
      body: JSON.stringify({ agentId, category: noteCategory, content: noteContent }),
    }),
    onSuccess: () => {
      setNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["context-notes", agentId] });
      queryClient.invalidateQueries({ queryKey: ["context-stats", agentId] });
      refetchNotes();
    },
  });

  const ns = (notes?.data ?? notes ?? []) as any[];
  const cs = ctxStats?.data ?? ctxStats ?? {};

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}><Brain size={20} /> Context Engineering Monitor</h1>
          <div style={S.subtitle}>Persistent cross-session notes, context compaction stats, and token savings</div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            style={{ ...S.input, width: "200px" }}
            placeholder="Agent ID..."
            value={agentInput}
            onChange={e => setAgentInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") setAgentId(agentInput); }}
          />
          <button style={S.btn} onClick={() => setAgentId(agentInput)}><Search size={14} /></button>
          <button style={S.btn} onClick={() => refetchNotes()}><RefreshCw size={14} /></button>
        </div>
      </div>

      {statsLoading ? null : (
        <div style={S.grid(4)}>
          {[
            { label: "Total Notes", value: cs.totalNotes ?? 0, icon: FileText },
            { label: "Compaction Events", value: cs.compactionEvents ?? 0, icon: Layers },
            { label: "Avg Token Savings", value: `${cs.avgTokenSavingsPerCompaction ?? 0}`, icon: Zap },
            { label: "Note Categories", value: Object.keys(cs.notesByCategory ?? {}).length, icon: Hash },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={S.statCard}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={S.statLabel}>{label}</span>
                <Icon size={16} style={{ color: "hsl(214,7%,45%)" }} />
              </div>
              <div style={S.statValue}>{typeof value === "number" ? value.toLocaleString() : value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={S.row}>
        <div style={S.card}>
          <div style={S.sectionTitle}><FileText size={14} /> Write Context Note</div>
          <select value={noteCategory} onChange={e => setNoteCategory(e.target.value)} style={{ ...S.input, display: "block", width: "100%", marginBottom: "0.5rem" }}>
            {["observation", "decision", "entity", "task", "insight"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea
            style={{ ...S.input, display: "block", width: "100%", minHeight: "100px", resize: "vertical", fontFamily: "inherit", marginBottom: "0.5rem" }}
            placeholder="Write a persistent context note that will be recalled across sessions..."
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
          />
          <button
            style={{ ...S.btn, background: "hsla(38,80%,60%,0.15)", borderColor: "hsla(38,80%,60%,0.3)" }}
            onClick={() => writeMutation.mutate()}
            disabled={writeMutation.isPending || !noteContent}
          >
            {writeMutation.isPending ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Brain size={14} />}
            Write Note
          </button>

          {cs.notesByCategory && Object.keys(cs.notesByCategory).length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <div style={S.sectionTitle}><Hash size={13} /> Notes by Category</div>
              {Object.entries(cs.notesByCategory).map(([cat, cnt]) => (
                <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
                  <span style={{ fontSize: "0.82rem", color: "hsl(38,8%,80%)", textTransform: "capitalize" }}>{cat}</span>
                  <span style={{ fontSize: "0.82rem", color: "hsl(214,7%,55%)" }}>{cnt as number}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={S.card}>
          <div style={S.sectionTitle}><Clock size={14} /> Context Notes for {agentId}</div>
          {notesLoading ? <Spinner /> : ns.length === 0 ? (
            <EmptyState icon={Brain} text="No context notes yet for this agent" />
          ) : (
            ns.map((note: any) => (
              <div key={note.noteId} style={{ ...S.tableRow, gridTemplateColumns: "auto 1fr auto" }}>
                <span style={S.badge(
                  note.category === "decision" ? "hsla(210,60%,50%,0.2)" :
                  note.category === "entity" ? "hsla(120,60%,50%,0.2)" :
                  note.category === "insight" ? "hsla(280,60%,50%,0.2)" :
                  "hsla(0,0%,50%,0.2)"
                )}>{note.category}</span>
                <div>
                  <div style={{ fontSize: "0.82rem", color: "hsl(38,8%,85%)", marginBottom: "0.2rem" }}>{note.content.slice(0, 120)}{note.content.length > 120 ? "..." : ""}</div>
                  {note.entities?.length > 0 && (
                    <div style={{ fontSize: "0.73rem", color: "hsl(214,7%,55%)" }}>Entities: {note.entities.join(", ")}</div>
                  )}
                </div>
                <span style={{ fontSize: "0.73rem", color: "hsl(214,7%,45%)" }}>
                  {(note.importance * 10).toFixed(0)}/10
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
