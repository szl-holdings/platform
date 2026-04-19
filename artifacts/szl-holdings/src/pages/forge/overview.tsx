import { useState } from "react";
import { ForgeShell, Card, Section, SeverityPill, StatusPill, useForgeQuery, tableStyle, thStyle, tdStyle } from "./_shared";
import { apiRequest } from "@/lib/api";

interface SubmitResponse {
  success: boolean;
  data?: { executionId?: string; status?: string };
  error?: string;
  message?: string;
}

function SubmitExecutionPanel() {
  const [agentSlug, setAgentSlug] = useState("");
  const [envTier, setEnvTier] = useState<"dev" | "sandbox" | "staging" | "production">("sandbox");
  const [inputJson, setInputJson] = useState('{\n  "task": ""\n}');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ executionId?: string; status?: string } | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0a0e14", color: "#e7eaf0",
    border: "1px solid #1f2937", borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!agentSlug.trim()) {
      setError("Agent slug is required.");
      return;
    }
    let parsedInput: unknown;
    try {
      parsedInput = JSON.parse(inputJson);
    } catch {
      setError("Input must be valid JSON.");
      return;
    }
    setPending(true);
    try {
      const res = await apiRequest<SubmitResponse>("POST", "/api/forge/submit", {
        agentSlug: agentSlug.trim(),
        envTier,
        input: parsedInput,
      });
      const data = res.data ?? {};
      setResult({ executionId: data.executionId, status: data.status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Section title="Submit execution">
      <form onSubmit={onSubmit} data-testid="form-forge-submit" style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", maxWidth: 720 }}>
        <div style={{ gridColumn: "1 / span 1" }}>
          <label style={labelStyle}>Agent slug</label>
          <input
            data-testid="input-forge-agent-slug"
            value={agentSlug}
            onChange={(e) => setAgentSlug(e.target.value)}
            placeholder="legal-risk-v3"
            style={inputStyle}
          />
        </div>
        <div style={{ gridColumn: "2 / span 1" }}>
          <label style={labelStyle}>Env tier</label>
          <select
            data-testid="select-forge-env-tier"
            value={envTier}
            onChange={(e) => setEnvTier(e.target.value as typeof envTier)}
            style={inputStyle}
          >
            {(["dev", "sandbox", "staging", "production"] as const).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div style={{ gridColumn: "1 / span 2" }}>
          <label style={labelStyle}>Input (JSON)</label>
          <textarea
            data-testid="input-forge-input-json"
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            rows={5}
            style={{ ...inputStyle, fontFamily: "monospace" }}
          />
        </div>
        <div style={{ gridColumn: "1 / span 2", display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="submit"
            data-testid="button-forge-submit"
            disabled={pending}
            style={{
              background: "#d4a054", color: "#0a0e14", border: "none", borderRadius: 6,
              padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.6 : 1,
            }}
          >
            {pending ? "Submitting…" : "Submit execution"}
          </button>
          {error && <span data-testid="text-forge-submit-error" style={{ color: "#fca5a5", fontSize: 12 }}>{error}</span>}
          {result && (
            <span data-testid="text-forge-submit-success" style={{ color: "#86efac", fontSize: 12 }}>
              Queued execution{result.executionId ? ` ${result.executionId}` : ""}
              {result.status ? ` (${result.status})` : ""}
            </span>
          )}
        </div>
      </form>
    </Section>
  );
}

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
      <SubmitExecutionPanel />
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
