import { Activity, AlertTriangle, CheckCircle, GitCommit, Layers, RefreshCw, Server, TrendingDown } from "lucide-react";
import { useDeployments, useDriftSummary, useExecutiveBrief } from "../lib/api";

function StatusDot({ status }: { status: "healthy" | "degraded" | "critical" }) {
  const color = status === "healthy" ? "#4eca8b" : status === "degraded" ? "#c8a84b" : "#e05050";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}80` }} />;
}

function severityColor(s: "info" | "warning" | "critical"): string {
  return s === "critical" ? "#e05050" : s === "warning" ? "#e08c40" : "#5090e8";
}

function deploymentColor(s: string): string {
  switch (s) {
    case "active": return "#4eca8b";
    case "deploying": return "#5090e8";
    case "rolled-back": return "#c8a84b";
    case "failed": return "#e05050";
    default: return "#7a8295";
  }
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="section-card" style={{ padding: 18, ...style }}>{children}</div>
  );
}

function SectionHeader({ icon, title, subtitle, right }: { icon: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        <h2 style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pulse-text-muted)" }}>{title}</h2>
        {subtitle && <span style={{ fontSize: "0.7rem", color: "var(--pulse-text-muted)" }}>· {subtitle}</span>}
      </div>
      {right}
    </div>
  );
}

export default function SystemHealth() {
  const briefQ = useExecutiveBrief();
  const driftQ = useDriftSummary();
  const deployQ = useDeployments("production");

  const brief = briefQ.data;
  const drift = driftQ.data;
  const deploys = deployQ.data;

  const refreshAll = () => {
    briefQ.refetch();
    driftQ.refetch();
    deployQ.refetch();
  };

  return (
    <div style={{ padding: "28px 28px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--pulse-text)", marginBottom: 6 }}>System Health</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--pulse-text-muted)" }}>
            Cross-domain executive briefing, model/data drift, and live deployment registry
          </p>
        </div>
        <button
          onClick={refreshAll}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 6,
            background: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.3)",
            color: "var(--pulse-gold)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
          }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Executive briefing */}
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader
          icon={<Activity size={14} color="var(--pulse-gold)" />}
          title="Executive Briefing"
          subtitle={brief ? `Generated ${new Date(brief.generatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : undefined}
          right={brief && (
            <div style={{ display: "flex", gap: 14, fontSize: "0.72rem", color: "var(--pulse-text-dim)" }}>
              <span><strong style={{ color: "var(--pulse-text)" }}>{brief.totalEntities}</strong> entities</span>
              <span><strong style={{ color: "var(--pulse-text)" }}>{brief.totalEdges}</strong> edges</span>
              <span><strong style={{ color: "var(--pulse-text)" }}>{brief.crossDomainLinks}</strong> cross-domain</span>
              <span><strong style={{ color: "#4eca8b" }}>{Math.round(brief.overallHealthScore * 100)}%</strong> health</span>
            </div>
          )}
        />
        {briefQ.isLoading && <div style={{ color: "var(--pulse-text-muted)", fontSize: "0.85rem" }}>Loading executive briefing…</div>}
        {briefQ.error && <div style={{ color: "#e05050", fontSize: "0.85rem" }}>Failed to load executive briefing.</div>}
        {brief && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 14 }}>
              {brief.domains.map((d) => (
                <div key={d.domain} style={{
                  padding: 12, borderRadius: 6,
                  background: "rgba(0,0,0,0.2)", border: "1px solid var(--pulse-border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--pulse-text)", textTransform: "capitalize" }}>{d.domain}</div>
                    <span style={{ fontSize: "0.7rem", color: d.healthScore >= 0.85 ? "#4eca8b" : d.healthScore >= 0.6 ? "#c8a84b" : "#e05050" }}>
                      {Math.round(d.healthScore * 100)}%
                    </span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--pulse-text-muted)", lineHeight: 1.45 }}>
                    {d.entityCount} entities · {d.activeCount} active · {d.edgeCount} edges
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--pulse-text-muted)", marginTop: 4 }}>
                    Avg confidence {(d.avgConfidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
            {brief.alerts.length > 0 && (
              <div style={{ borderTop: "1px solid var(--pulse-border)", paddingTop: 12 }}>
                <div style={{ fontSize: "0.68rem", color: "var(--pulse-text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Alerts</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {brief.alerts.map((a, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 8,
                      padding: "8px 10px", borderRadius: 4,
                      background: `${severityColor(a.severity)}10`,
                      borderLeft: `2px solid ${severityColor(a.severity)}`,
                    }}>
                      <AlertTriangle size={12} color={severityColor(a.severity)} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ fontSize: "0.78rem", color: "var(--pulse-text)" }}>
                        <strong style={{ textTransform: "capitalize", marginRight: 6 }}>{a.domain}:</strong>
                        {a.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Drift */}
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader
          icon={<TrendingDown size={14} color="var(--pulse-gold)" />}
          title="Data & Model Drift"
          subtitle={drift ? `Measured ${new Date(drift.measuredAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : undefined}
          right={drift && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem" }}>
              <StatusDot status={drift.status} />
              <span style={{ color: "var(--pulse-text)", fontWeight: 600, textTransform: "capitalize" }}>{drift.status}</span>
              <span style={{ color: "var(--pulse-text-muted)" }}>·</span>
              <span style={{ color: "var(--pulse-text-dim)" }}>Score {drift.overallDriftScore.toFixed(3)}</span>
            </div>
          )}
        />
        {driftQ.isLoading && <div style={{ color: "var(--pulse-text-muted)", fontSize: "0.85rem" }}>Loading drift report…</div>}
        {driftQ.error && <div style={{ color: "#e05050", fontSize: "0.85rem" }}>Failed to load drift report.</div>}
        {drift && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ color: "var(--pulse-text-muted)", textAlign: "left", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--pulse-border)" }}>Domain</th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--pulse-border)" }}>Status</th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--pulse-border)" }}>Drift Score</th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--pulse-border)" }}>Confidence</th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--pulse-border)" }}>Stale 24h</th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--pulse-border)" }}>Entities</th>
                  </tr>
                </thead>
                <tbody>
                  {drift.domains.map((d) => {
                    const stale24 = d.freshnessWindows.find((w) => w.windowHours === 24);
                    return (
                      <tr key={d.domain} style={{ color: "var(--pulse-text)" }}>
                        <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--pulse-border)", textTransform: "capitalize", fontWeight: 500 }}>{d.domain}</td>
                        <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--pulse-border)" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <StatusDot status={d.status} />
                            <span style={{ textTransform: "capitalize", fontSize: "0.75rem" }}>{d.status}</span>
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--pulse-border)", fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem" }}>{d.driftScore.toFixed(3)}</td>
                        <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--pulse-border)" }}>{(d.avgConfidence * 100).toFixed(0)}%</td>
                        <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--pulse-border)" }}>{stale24 ? `${stale24.stalePercent}%` : "—"}</td>
                        <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--pulse-border)", color: "var(--pulse-text-dim)" }}>{d.totalEntities}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {drift.topAlerts.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: "0.68rem", color: "var(--pulse-text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Top Drift Alerts</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {drift.topAlerts.map((a, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 8,
                      padding: "8px 10px", borderRadius: 4,
                      background: `${severityColor(a.severity)}10`,
                      borderLeft: `2px solid ${severityColor(a.severity)}`,
                    }}>
                      <AlertTriangle size={12} color={severityColor(a.severity)} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ fontSize: "0.78rem", color: "var(--pulse-text)" }}>
                        <strong style={{ textTransform: "capitalize", marginRight: 6 }}>{a.domain}:</strong>
                        {a.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Deployments */}
      <Card>
        <SectionHeader
          icon={<Server size={14} color="var(--pulse-gold)" />}
          title="Production Deployments"
          subtitle={deploys ? `${deploys.count} active in ${deploys.environment}` : undefined}
        />
        {deployQ.isLoading && <div style={{ color: "var(--pulse-text-muted)", fontSize: "0.85rem" }}>Loading deployments…</div>}
        {deployQ.error && <div style={{ color: "#e05050", fontSize: "0.85rem" }}>Failed to load deployments.</div>}
        {deploys && deploys.deployments.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 12px", color: "var(--pulse-text-muted)", fontSize: "0.82rem" }}>
            <Layers size={14} />
            No active deployments registered yet. Register one via <code style={{ background: "rgba(0,0,0,0.2)", padding: "1px 6px", borderRadius: 3 }}>POST /deployments</code>.
          </div>
        )}
        {deploys && deploys.deployments.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {deploys.deployments.map((d) => (
              <div key={`${d.appId}-${d.deployedAt}`} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: "12px 14px", borderRadius: 6,
                background: "rgba(0,0,0,0.2)", border: "1px solid var(--pulse-border)",
                borderLeft: `3px solid ${deploymentColor(d.status)}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <CheckCircle size={12} color={deploymentColor(d.status)} />
                    <span style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--pulse-text)" }}>{d.appName}</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", color: "var(--pulse-gold-dim)", padding: "1px 6px", borderRadius: 3, background: "rgba(200,168,75,0.08)" }}>v{d.version}</span>
                    <span style={{ fontSize: "0.68rem", color: deploymentColor(d.status), textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>{d.status}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: "0.7rem", color: "var(--pulse-text-muted)" }}>
                    <span>{d.environment}</span>
                    <span>·</span>
                    <span>by {d.deployedBy}</span>
                    <span>·</span>
                    <span>{new Date(d.deployedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
                    {d.commitSha && <><span>·</span><span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "JetBrains Mono, monospace" }}><GitCommit size={10} />{d.commitSha.slice(0, 7)}</span></>}
                  </div>
                  {d.notes && <div style={{ fontSize: "0.7rem", color: "var(--pulse-text-dim)", marginTop: 4 }}>{d.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
