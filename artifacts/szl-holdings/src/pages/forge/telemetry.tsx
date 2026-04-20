import {
  Card,
  ForgeShell,
  Section,
  StatusPill,
  tableStyle,
  tdStyle,
  thStyle,
  useForgeQuery,
} from './_shared';

interface Telemetry {
  total: number;
  successes: number;
  failures: number;
  escalations: number;
  overrides: number;
  policyDenials: number;
  successRate: number;
  escalationRate: number;
  overrideRate: number;
  toolFailureRate: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  valueAtRiskProtectedUsd: number;
}
interface ExecRun {
  id: string;
  agentId: string;
  envTier: string;
  status: string;
  outcome: string | null;
  latencyMs: number | null;
  toolCalls: number;
  toolFailures: number;
  humanOverride: boolean;
  policyOutcome: string | null;
  valueAtRiskUsd: string | null;
  startedAt: string;
}

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtUsd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function ForgeTelemetryPage() {
  const summary = useForgeQuery<Telemetry>('telemetry', '/api/forge/telemetry/summary');
  const runs = useForgeQuery<ExecRun[]>('executions', '/api/forge/executions?limit=50');

  return (
    <ForgeShell
      title="Telemetry"
      subtitle="Runtime observability, SLOs, escalations, and value-at-risk protected."
    >
      {summary.data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Card title="Total executions" value={summary.data.total} />
            <Card title="Success rate" value={fmtPct(summary.data.successRate)} accent="#86efac" />
            <Card
              title="Escalation rate"
              value={fmtPct(summary.data.escalationRate)}
              accent="#fbbf24"
            />
            <Card
              title="Override rate"
              value={fmtPct(summary.data.overrideRate)}
              accent="#c4b5fd"
            />
          </div>
          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
            }}
          >
            <Card title="Latency p50" value={`${summary.data.latencyP50Ms} ms`} accent="#93c5fd" />
            <Card title="Latency p95" value={`${summary.data.latencyP95Ms} ms`} accent="#93c5fd" />
            <Card
              title="Tool failure rate"
              value={fmtPct(summary.data.toolFailureRate)}
              accent="#fca5a5"
            />
            <Card
              title="VaR protected"
              value={fmtUsd(summary.data.valueAtRiskProtectedUsd)}
              accent="#d4a054"
            />
          </div>
        </>
      )}

      <Section title="Recent runs">
        {runs.data && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Agent</th>
                <th style={thStyle}>Env</th>
                <th style={thStyle}>Outcome</th>
                <th style={thStyle}>Latency</th>
                <th style={thStyle}>Tools</th>
                <th style={thStyle}>Policy</th>
                <th style={thStyle}>VaR</th>
                <th style={thStyle}>When</th>
              </tr>
            </thead>
            <tbody>
              {runs.data.map((r) => (
                <tr key={r.id}>
                  <td style={tdStyle}>
                    <StatusPill value={r.status} />
                  </td>
                  <td style={tdStyle}>
                    <code style={{ fontSize: 11 }}>{r.agentId.slice(0, 8)}</code>
                  </td>
                  <td style={tdStyle}>{r.envTier}</td>
                  <td style={tdStyle}>{r.outcome ?? '—'}</td>
                  <td style={tdStyle}>{r.latencyMs ?? '—'} ms</td>
                  <td style={tdStyle}>
                    {r.toolCalls}/{r.toolFailures} fail
                  </td>
                  <td style={tdStyle}>{r.policyOutcome ?? '—'}</td>
                  <td style={tdStyle}>
                    {r.valueAtRiskUsd ? fmtUsd(Number(r.valueAtRiskUsd)) : '—'}
                  </td>
                  <td style={tdStyle}>{new Date(r.startedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </ForgeShell>
  );
}
