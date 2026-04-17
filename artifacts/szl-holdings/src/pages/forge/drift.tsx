import { ForgeShell, Section, Card, useForgeQuery, tableStyle, thStyle, tdStyle, SeverityPill } from "./_shared";

interface DriftSummary {
  totalEvents: number;
  bySeverity: Record<string, number>;
  byDimension: Record<string, number>;
  heatmap: Record<string, Record<string, { score: number; severity: string }>>;
}
interface DriftEvent {
  id: string; agentId: string; envId: string; detectedAt: string;
  driftScore: string; severity: string; dimension: string; remediation: string | null;
}

export default function ForgeDriftPage() {
  const summary = useForgeQuery<DriftSummary>("drift-summary", "/api/forge/drift/summary");
  const events = useForgeQuery<DriftEvent[]>("drift-events", "/api/forge/drift/events?limit=50");

  return (
    <ForgeShell title="Drift" subtitle="Model · prompt · tool · data · config drift across every environment.">
      {summary.data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {(["none", "low", "medium", "high", "critical"] as const).map(s => (
              <Card key={s} title={s} value={summary.data!.bySeverity[s] ?? 0} accent={s === "critical" ? "#fca5a5" : s === "high" ? "#fbbf24" : "#93c5fd"} />
            ))}
          </div>

          <Section title="By dimension">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
              {Object.entries(summary.data.byDimension).map(([d, n]) => (
                <Card key={d} title={d} value={n} accent="#4a90b8" />
              ))}
            </div>
          </Section>
        </>
      )}

      <Section title="Recent drift events">
        {events.data && (
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Severity</th><th style={thStyle}>Agent</th><th style={thStyle}>Env</th><th style={thStyle}>Dimension</th><th style={thStyle}>Score</th><th style={thStyle}>Remediation</th><th style={thStyle}>When</th></tr></thead>
            <tbody>{events.data.map(e => (
              <tr key={e.id}>
                <td style={tdStyle}><SeverityPill value={e.severity} /></td>
                <td style={tdStyle}><code style={{ fontSize: 11 }}>{e.agentId.slice(0, 8)}</code></td>
                <td style={tdStyle}><code style={{ fontSize: 11 }}>{e.envId.slice(0, 8)}</code></td>
                <td style={tdStyle}>{e.dimension}</td>
                <td style={tdStyle}>{Number(e.driftScore).toFixed(1)}</td>
                <td style={tdStyle}>{e.remediation ?? "—"}</td>
                <td style={tdStyle}>{new Date(e.detectedAt).toLocaleString()}</td>
              </tr>))}</tbody>
          </table>
        )}
      </Section>
    </ForgeShell>
  );
}
