import { useState, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { apiFetch } from "@szl-holdings/shared-ui";

const BG = { surface: "#0c1018", elevated: "#10141e", card: "#111620" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" };
const ACCENT = { green: "#6b8f71", amber: "#c8953c", red: "#c45a4a", blue: "#4a90b8", purple: "#8b7ac8", gold: "#b8975a" };

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

type TabId = "overview" | "agents" | "outcomes" | "artifacts" | "worldline" | "proofchain";

const VALID_TABS: TabId[] = ["overview", "agents", "outcomes", "artifacts", "worldline", "proofchain"];

export default function HelmConsolePage() {
  const [, routeParams] = useRoute("/helm/:tab");
  const initialTab = routeParams?.tab && VALID_TABS.includes(routeParams.tab as TabId) ? (routeParams.tab as TabId) : "overview";
  const [tab, setTab] = useState<TabId>(initialTab);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [agentRuns, setAgentRuns] = useState<AgentRunData[]>([]);
  const [worldline, setWorldline] = useState<WorldlineData | null>(null);
  const [outcomes, setOutcomes] = useState<OutcomeData | null>(null);
  const [atlasData, setAtlasData] = useState<AtlasData | null>(null);
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState(false);

  const BASE = "/api-server";

  const fetchData = useCallback(async (t: TabId) => {
    setLoading(true);
    try {
      if (t === "overview") {
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
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(tab); }, [tab, fetchData]);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "agents", label: "Agent Runs" },
    { id: "outcomes", label: "Outcome Graph" },
    { id: "artifacts", label: "Atlas Artifacts" },
    { id: "worldline", label: "Worldline" },
    { id: "proofchain", label: "Proof Chain" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG.surface, color: TEXT.primary, padding: "24px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, background: `${ACCENT.gold}18`, border: `1px solid ${ACCENT.gold}40`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎛️</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>HELM Console</h1>
            <p style={{ fontSize: 12, color: TEXT.secondary, margin: 0 }}>Operator control plane — platform health, intelligence, and governance</p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={() => fetchData(tab)}
              style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${BORDER.muted}`, background: BG.elevated, color: TEXT.secondary, fontSize: 12, cursor: "pointer" }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${BORDER.muted}`, paddingBottom: 0 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 16px", borderRadius: "6px 6px 0 0", border: "none",
                borderBottom: tab === t.id ? `2px solid ${ACCENT.gold}` : "2px solid transparent",
                background: tab === t.id ? `${ACCENT.gold}08` : "none",
                color: tab === t.id ? TEXT.primary : TEXT.secondary,
                fontSize: 12, cursor: "pointer", transition: "all 0.15s",
              }}
            >{t.label}</button>
          ))}
        </div>

        {loading && (
          <div style={{ color: TEXT.secondary, textAlign: "center", padding: 60 }}>Loading…</div>
        )}

        {!loading && tab === "overview" && overview && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
              <MetricCard
                label="Agent Runs (24h)"
                value={Number(overview.agentRuns?.total ?? 0)}
                sub={overview.agentRuns ? `${Math.round(Number(overview.agentRuns.avgLatency ?? 0))}ms avg latency` : undefined}
                color={ACCENT.blue}
              />
              <MetricCard
                label="Atlas Artifacts (7d)"
                value={overview.artifactStats.reduce((s, r) => s + Number(r.total), 0)}
                sub={`${overview.artifactStats.find(a => a.status === "failed")?.total ?? 0} failed`}
                color={ACCENT.gold}
              />
              <MetricCard
                label="Outcome Decisions (7d)"
                value={overview.outcomeStats.reduce((s, r) => s + Number(r.total), 0)}
                sub={`${overview.outcomeStats.find(o => o.status === "overridden")?.total ?? 0} overrides`}
                color={ACCENT.purple}
              />
              <MetricCard
                label="Worldline Sources"
                value={overview.worldlineHealth.reduce((s, r) => s + Number(r.total), 0)}
                sub={`${overview.worldlineHealth.find(w => w.status === "degraded")?.total ?? 0} degraded`}
                color={overview.worldlineHealth.find(w => w.status === "degraded")?.total !== "0" ? ACCENT.red : ACCENT.green}
              />
              <MetricCard
                label="Proof Anomalies (7d)"
                value={overview.proofChainStats.filter(p => p.reviewState === "flagged").reduce((s, r) => s + Number(r.total), 0)}
                sub="flagged for review"
                color={ACCENT.red}
              />
              <MetricCard
                label="Export Jobs (7d)"
                value={overview.exportJobStats.reduce((s, r) => s + Number(r.total), 0)}
                sub={`${overview.exportJobStats.find(e => e.status === "failed")?.total ?? 0} failed`}
                color={ACCENT.amber}
              />
            </div>

            {overview.worldlineHealth.some(w => w.status === "degraded" && Number(w.total) > 0) && (
              <div style={{ background: `${ACCENT.red}08`, border: `1px solid ${ACCENT.red}30`, borderRadius: 10, padding: "12px 16px" }}>
                <span style={{ fontSize: 12, color: ACCENT.red }}>⚠ Degraded data sources detected — check Worldline tab for details.</span>
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
                        <span style={{ fontSize: 11, color: TEXT.tertiary, marginRight: 8 }}>
                          {Math.round(Number(r.avgConfidence) * 100)}% conf
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary }}>{r.total}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && tab === "agents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
          </div>
        )}

        {!loading && tab === "outcomes" && outcomes && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
          </div>
        )}

        {!loading && tab === "artifacts" && atlasData && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
          </div>
        )}

        {!loading && tab === "worldline" && worldline && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
          </div>
        )}

        {!loading && tab === "proofchain" && proofData && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
          </div>
        )}
      </div>
    </div>
  );
}
