import { useRoute } from "wouter";
import { ForgeShell, Section, Card, useForgeQuery, tableStyle, thStyle, tdStyle, SeverityPill, StatusPill } from "./_shared";

interface AgentDetail {
  agent: { id: string; slug: string; name: string; description: string | null; domain: string; riskTier: string; currentEnv: string; status: string; activeVersionId: string | null };
  versions: Array<{ id: string; version: number; modelId: string | null; evalsPassed: boolean; observabilityHookConfigured: boolean; provenanceComplete: boolean; createdAt: string; notes: string | null }>;
  promotions: Array<{ id: string; fromEnv: string; toEnv: string; status: string; createdAt: string; blockers: Array<{ code: string; message: string }> }>;
  drift: Array<{ id: string; severity: string; dimension: string; driftScore: string; detectedAt: string; remediation: string | null }>;
  rollbacks: Array<{ id: string; envTier: string; reason: string; createdAt: string }>;
}

export default function ForgeAgentDetailPage() {
  const [, params] = useRoute("/forge/agents/:id");
  const id = params?.id ?? "";
  const { data, isLoading, error } = useForgeQuery<AgentDetail>(`agent:${id}`, `/api/forge/agents/${id}`);

  return (
    <ForgeShell title={data?.agent.name ?? "Agent"} subtitle={data?.agent.description ?? undefined}>
      {isLoading && <div style={{ color: "#9ca3af" }}>Loading…</div>}
      {error && <div style={{ color: "#fca5a5" }}>{(error as Error).message}</div>}
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <Card title="Domain" value={data.agent.domain} />
            <Card title="Risk tier" value={data.agent.riskTier} accent={data.agent.riskTier === "executive" ? "#fca5a5" : "#fbbf24"} />
            <Card title="Current env" value={data.agent.currentEnv} accent="#93c5fd" />
            <Card title="Versions" value={data.versions.length} accent="#86efac" />
          </div>

          <Section title="Version history">
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>v</th><th style={thStyle}>Model</th><th style={thStyle}>Evals</th><th style={thStyle}>Observability</th><th style={thStyle}>Provenance</th><th style={thStyle}>Active</th><th style={thStyle}>Created</th></tr></thead>
              <tbody>{data.versions.map(v => (
                <tr key={v.id}>
                  <td style={tdStyle}>v{v.version}</td>
                  <td style={tdStyle}><code style={{ fontSize: 11 }}>{v.modelId?.slice(0, 8) ?? "—"}</code></td>
                  <td style={tdStyle}>{v.evalsPassed ? "✓" : "—"}</td>
                  <td style={tdStyle}>{v.observabilityHookConfigured ? "✓" : "—"}</td>
                  <td style={tdStyle}>{v.provenanceComplete ? "✓" : "—"}</td>
                  <td style={tdStyle}>{v.id === data.agent.activeVersionId ? "★ active" : ""}</td>
                  <td style={tdStyle}>{new Date(v.createdAt).toLocaleString()}</td>
                </tr>))}</tbody>
            </table>
          </Section>

          <Section title="Recent promotions">
            {data.promotions.length === 0 ? <div style={{ color: "#6b7280" }}>None yet.</div> : (
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>From → To</th><th style={thStyle}>Status</th><th style={thStyle}>Blockers</th><th style={thStyle}>When</th></tr></thead>
                <tbody>{data.promotions.map(p => (
                  <tr key={p.id}>
                    <td style={tdStyle}>{p.fromEnv} → {p.toEnv}</td>
                    <td style={tdStyle}><StatusPill value={p.status} /></td>
                    <td style={tdStyle}>{(p.blockers ?? []).map(b => b.code).join(", ") || "—"}</td>
                    <td style={tdStyle}>{new Date(p.createdAt).toLocaleString()}</td>
                  </tr>))}</tbody>
              </table>
            )}
          </Section>

          <Section title="Drift events">
            {data.drift.length === 0 ? <div style={{ color: "#6b7280" }}>No drift recorded.</div> : (
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Severity</th><th style={thStyle}>Dimension</th><th style={thStyle}>Score</th><th style={thStyle}>Remediation</th><th style={thStyle}>When</th></tr></thead>
                <tbody>{data.drift.map(d => (
                  <tr key={d.id}>
                    <td style={tdStyle}><SeverityPill value={d.severity} /></td>
                    <td style={tdStyle}>{d.dimension}</td>
                    <td style={tdStyle}>{Number(d.driftScore).toFixed(1)}</td>
                    <td style={tdStyle}>{d.remediation ?? "—"}</td>
                    <td style={tdStyle}>{new Date(d.detectedAt).toLocaleString()}</td>
                  </tr>))}</tbody>
              </table>
            )}
          </Section>

          <Section title="Rollbacks">
            {data.rollbacks.length === 0 ? <div style={{ color: "#6b7280" }}>No rollbacks recorded.</div> : (
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Env</th><th style={thStyle}>Reason</th><th style={thStyle}>When</th></tr></thead>
                <tbody>{data.rollbacks.map(r => (
                  <tr key={r.id}>
                    <td style={tdStyle}>{r.envTier}</td>
                    <td style={tdStyle}>{r.reason}</td>
                    <td style={tdStyle}>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>))}</tbody>
              </table>
            )}
          </Section>
        </>
      )}
    </ForgeShell>
  );
}
