/**
 * OrchestrationTraces — reliquary surface for the per-run
 * sequence-pipeline trace emitted by `@szl/a11oy-runtime`
 * `runOrchestration`. Each row joins per-stage `pipeline.stage.v1`
 * artefacts to the Λ verdict receipt id.
 */
import { useCallback, useEffect, useState } from 'react';

const API = '/api';
const GOLD = '#c9b787';

interface StageRow {
  stageName: string;
  stageOrdinal: number;
  receiptClass: string;
  inputsHash: string;
  paramsHash: string;
  outputsHash: string;
}

interface TraceRow {
  pipelineId: string;
  startedAt: string;
  finishedAt: string;
  decision: 'allow' | 'deny' | 'escalate';
  lambdaReceiptId: string;
  lambdaScore: number;
  vertical: string;
  action: string;
  stages: StageRow[];
  published: boolean;
}

const DECISION_COLOR: Record<TraceRow['decision'], string> = {
  allow: '#34d399',
  deny: '#c45a4a',
  escalate: '#c8953c',
};

function short(h: string): string {
  return h.slice(0, 10) + '…';
}

export function OrchestrationTraces() {
  const [rows, setRows] = useState<TraceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/a11oy/orchestration-traces?limit=16`);
      const j = await r.json();
      setRows((j.data as TraceRow[]) ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const seed = async () => {
    setSeeding(true);
    try {
      await fetch(`${API}/a11oy/orchestration-traces/seed`, { method: 'POST' });
      await load();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div
      style={{
        background: '#0a0a0a',
        minHeight: '100vh',
        color: '#e2e8f0',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: 4,
            color: GOLD,
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Reliquary
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              Orchestration Traces
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Sequence-pipeline traces (drift → evaluate → approve → publish) joined to the
              Λ verdict receipt.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={load}
              style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#94a3b8',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={seed}
              disabled={seeding}
              style={{
                padding: '6px 14px',
                background: 'rgba(201,183,135,0.15)',
                border: `1px solid ${GOLD}44`,
                borderRadius: 6,
                color: GOLD,
                fontSize: 12,
                cursor: seeding ? 'not-allowed' : 'pointer',
              }}
            >
              {seeding ? 'Seeding…' : 'Seed Demo Trace'}
            </button>
          </div>
        </div>

        {loading && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: '#475569',
              background: '#111',
              border: '1px solid #1e293b',
              borderRadius: 8,
            }}
          >
            Loading orchestration traces…
          </div>
        )}
        {error && !loading && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: '#ef4444',
              background: '#111',
              border: '1px solid #1e293b',
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: '#475569',
              background: '#111',
              border: '1px solid #1e293b',
              borderRadius: 8,
            }}
          >
            No orchestration traces recorded yet. Use "Seed Demo Trace" to populate.
          </div>
        )}

        {rows.map((row) => (
          <div
            key={row.pipelineId}
            style={{
              background: '#111',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
                  {row.action}
                  <span
                    style={{
                      marginLeft: 8,
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      color: DECISION_COLOR[row.decision],
                      background: `${DECISION_COLOR[row.decision]}22`,
                    }}
                  >
                    {row.decision.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  vertical={row.vertical} · Λ={row.lambdaScore.toFixed(3)} · published=
                  {row.published ? 'yes' : 'no'}
                </div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 2, fontFamily: 'monospace' }}>
                  pipeline={short(row.pipelineId)} · receipt={short(row.lambdaReceiptId)}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setExpanded(expanded === row.pipelineId ? null : row.pipelineId)
                }
                style={{
                  alignSelf: 'flex-start',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  color: '#94a3b8',
                  fontSize: 11,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                {expanded === row.pipelineId ? 'Hide stages' : 'Stages'}
              </button>
            </div>

            {expanded === row.pipelineId && (
              <table
                style={{
                  width: '100%',
                  marginTop: 12,
                  fontSize: 11,
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    {['Stage', 'Receipt', 'Inputs', 'Params', 'Outputs'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '6px 8px',
                          color: '#64748b',
                          fontWeight: 500,
                          fontSize: 10,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {row.stages.map((s) => (
                    <tr key={s.stageName} style={{ borderBottom: '1px solid #0f172a' }}>
                      <td style={{ padding: '6px 8px', color: '#f1f5f9' }}>
                        {s.stageOrdinal}. {s.stageName}
                      </td>
                      <td style={{ padding: '6px 8px', color: '#94a3b8' }}>
                        {s.receiptClass}
                      </td>
                      <td
                        style={{
                          padding: '6px 8px',
                          color: '#64748b',
                          fontFamily: 'monospace',
                        }}
                      >
                        {short(s.inputsHash)}
                      </td>
                      <td
                        style={{
                          padding: '6px 8px',
                          color: '#64748b',
                          fontFamily: 'monospace',
                        }}
                      >
                        {short(s.paramsHash)}
                      </td>
                      <td
                        style={{
                          padding: '6px 8px',
                          color: '#64748b',
                          fontFamily: 'monospace',
                        }}
                      >
                        {short(s.outputsHash)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
