import { ForgeShell, Card, Section, SeverityPill, StatusPill, useForgeQuery, tableStyle, thStyle, tdStyle } from "./_shared";

interface OverviewData {
  totals: { agents: number; executions: number; promotions: number; drift: number; rollbacks: number };
  byEnv: Record<string, number>;
  byRisk: Record<string, number>;
  driftStatus: { healthy: number; drifting: number; critical: number };
  promotionQueue: Array<{ id: string; agentId: string; fromEnv: string; toEnv: string; status: string; createdAt: string }>;
  recentFailures: Array<{ id: string; agentId: string; envTier: string; outcome: string | null; startedAt: string }>;
  recentRollbacks: Array<{ id: string; agentId: string; envTier: string; reason: string; createdAt: string }>;
}

export default function ForgeOverviewPage() {
  const { data, isLoading, error } = useForgeQuery<OverviewData>("overview", "/api/forge/overview");

  return (
    <ForgeShell title="Forge — Overview" subtitle="AI runtime, agent factory, and governed promotion pipeline">
      {isLoading && <div style={{ color: "#9ca3af" }}>Loading…</div>}
      {error && <div style={{ color: "#fca5a5" }}>Failed to load overview: {(error as Error).message}</div>}
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            <Card title="Agents" value={data.totals.agents} />
            <Card title="Executions (1k recent)" value={data.totals.executions} accent="#4a90b8" />
            <Card title="Promotions" value={data.totals.promotions} accent="#86efac" />
            <Card title="Drift events" value={data.totals.drift} accent="#fbbf24" />
            <Card title="Rollbacks" value={data.totals.rollbacks} accent="#fca5a5" />
          </div>

          <Section title="Agents by environment">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {Object.entries(data.byEnv).map(([env, n]) => (
                <Card key={env} title={env} value={n} accent={env === "production" ? "#fca5a5" : env === "staging" ? "#fbbf24" : "#93c5fd"} />
              ))}
            </div>
          </Section>

          <Section title="Drift status">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <Card title="Healthy" value={data.driftStatus.healthy} accent="#86efac" />
              <Card title="Drifting" value={data.driftStatus.drifting} accent="#fbbf24" />
              <Card title="Critical" value={data.driftStatus.critical} accent="#fca5a5" />
            </div>
          </Section>

          <Section title="Promotion queue">
            {data.promotionQueue.length === 0 ? <div style={{ color: "#6b7280" }}>No pending promotions.</div> : (
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Agent</th><th style={thStyle}>From → To</th><th style={thStyle}>Status</th><th style={thStyle}>Requested</th></tr></thead>
                <tbody>{data.promotionQueue.slice(0, 10).map(p => (
                  <tr key={p.id}>
                    <td style={tdStyle}><code style={{ fontSize: 11 }}>{p.agentId.slice(0, 8)}</code></td>
                    <td style={tdStyle}>{p.fromEnv} → {p.toEnv}</td>
                    <td style={tdStyle}><StatusPill value={p.status} /></td>
                    <td style={tdStyle}>{new Date(p.createdAt).toLocaleString()}</td>
                  </tr>))}</tbody>
              </table>
            )}
          </Section>

          <Section title="Recent failures">
            {data.recentFailures.length === 0 ? <div style={{ color: "#6b7280" }}>No recent failures.</div> : (
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Agent</th><th style={thStyle}>Env</th><th style={thStyle}>Outcome</th><th style={thStyle}>When</th></tr></thead>
                <tbody>{data.recentFailures.map(r => (
                  <tr key={r.id}>
                    <td style={tdStyle}><code style={{ fontSize: 11 }}>{r.agentId.slice(0, 8)}</code></td>
                    <td style={tdStyle}><SeverityPill value={r.envTier === "production" ? "critical" : "medium"} /></td>
                    <td style={tdStyle}>{r.outcome ?? "—"}</td>
                    <td style={tdStyle}>{new Date(r.startedAt).toLocaleString()}</td>
                  </tr>))}</tbody>
              </table>
            )}
          </Section>
        </>
      )}
    </ForgeShell>
  );
}
