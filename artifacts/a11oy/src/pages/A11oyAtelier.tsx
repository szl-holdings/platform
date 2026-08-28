import { type FormEvent, useEffect, useState } from 'react';
import { Layout } from '../components/layout';

const API = '/api/a11oy/v1/atelier';
const TENANT_ID = import.meta.env.VITE_A11OY_ATELIER_TENANT_ID ?? 'default';

interface ProviderHealth {
  provider: 'xai' | 'grok-build';
  model: string;
  configured: boolean;
  available: boolean;
  localOnly: boolean;
  evidenceState: 'OBSERVED' | 'UNAVAILABLE';
  reason: string;
}

interface HealthResponse {
  status: 'ready' | 'provider-unavailable';
  providers: ProviderHealth[];
  evidenceBoundary: string;
}

interface AtelierReceipt {
  receiptId: string;
  sessionId: string;
  provider: string;
  providerLabel: string;
  model: string;
  providerRequestId: string | null;
  evidenceState: string;
  ledgerEntryId: string | null;
  ledgerState: string;
  memoryState: string;
  localOnly: boolean;
  latencyMs: number;
  usage: Record<string, number>;
}

interface AskResponse {
  answer: string;
  disclosure: string;
  receipt: AtelierReceipt;
}

const palette = {
  bg: '#0a0a0a',
  panel: 'rgba(255,255,255,0.025)',
  panelStrong: 'rgba(255,255,255,0.045)',
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(201,183,135,0.35)',
  text: '#f5f5f5',
  dim: '#a0a0a0',
  muted: '#646464',
  gold: '#c9b787',
  teal: '#75b8ad',
  danger: '#ef8e8e',
};

function StatusDot({ available }: { available: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: available ? palette.teal : palette.muted,
        boxShadow: available ? `0 0 10px ${palette.teal}` : 'none',
      }}
    />
  );
}

function ReceiptRail({ receipt }: { receipt: AtelierReceipt }) {
  const rows = [
    ['Receipt', receipt.receiptId],
    ['Provider', `${receipt.providerLabel} / ${receipt.model}`],
    ['Provider request', receipt.providerRequestId ?? 'UNAVAILABLE'],
    ['Evidence', receipt.evidenceState],
    ['Proof Ledger', `${receipt.ledgerState} · ${receipt.ledgerEntryId ?? 'UNAVAILABLE'}`],
    ['Memory', receipt.memoryState],
    ['Runtime', receipt.localOnly ? 'LOCAL-ONLY' : 'API'],
    ['Latency', `${receipt.latencyMs} ms`],
    ['Tokens', String(receipt.usage.totalTokens ?? 'UNAVAILABLE')],
  ];
  return (
    <aside
      aria-label="Response receipt"
      style={{
        border: `1px solid ${palette.borderStrong}`,
        background: 'rgba(201,183,135,0.035)',
        borderRadius: 10,
        padding: '1rem',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: '0.16em', color: palette.gold, marginBottom: 12 }}>
        RECEIPT RAIL
      </div>
      {rows.map(([label, value]) => (
        <div
          key={label}
          style={{
            display: 'grid',
            gridTemplateColumns: '120px minmax(0,1fr)',
            gap: 12,
            padding: '0.45rem 0',
            borderTop: `1px solid ${palette.border}`,
            fontSize: 12,
          }}
        >
          <span style={{ color: palette.muted }}>{label}</span>
          <span style={{ color: palette.text, overflowWrap: 'anywhere' }}>{value}</span>
        </div>
      ))}
    </aside>
  );
}

export function A11oyAtelier() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'auto' | 'xai' | 'grok-build'>('auto');
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high'>('medium');
  const [sessionId, setSessionId] = useState<string>();
  const [health, setHealth] = useState<HealthResponse>();
  const [result, setResult] = useState<AskResponse>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'A11oy Atelier — Evidence-Bound Intelligence';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/health`, {
      signal: controller.signal,
      headers: { 'X-Tenant-Id': TENANT_ID },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Health check returned HTTP ${response.status}`);
        return (await response.json()) as HealthResponse;
      })
      .then(setHealth)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch(`${API}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT_ID },
        body: JSON.stringify({
          prompt: trimmed,
          provider,
          reasoningEffort,
          ...(sessionId ? { sessionId } : {}),
          capabilities: { tools: false, search: false, durableStorage: false, subagents: false },
        }),
      });
      const payload = (await response.json()) as AskResponse & { error?: string; code?: string };
      if (!response.ok)
        throw new Error(
          `${payload.error ?? `HTTP ${response.status}`} [${payload.code ?? 'ERROR'}]`,
        );
      setResult(payload);
      setSessionId(payload.receipt.sessionId);
      setPrompt('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div style={{ maxWidth: 1240, margin: '0 auto', color: palette.text }}>
        <header style={{ padding: '1.5rem 0 2rem', borderBottom: `1px solid ${palette.border}` }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: palette.gold }}>
            A11OY · AYLLU · FRONTIER NOW
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 4.5rem)',
              letterSpacing: '-0.055em',
              margin: '0.65rem 0 0',
            }}
          >
            A11oy Atelier
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.4rem)',
              color: palette.dim,
              margin: '0.4rem 0 0',
            }}
          >
            Evidence-Bound Intelligence
          </p>
          <p style={{ maxWidth: 720, color: palette.muted, lineHeight: 1.7, marginTop: '1.25rem' }}>
            Learn the pattern. Rebuild the expression. Receipt every decision. A11oy owns the
            policy, memory, orchestration, and evidence rail; inference providers remain explicit
            and replaceable.
          </p>
        </header>

        <section
          aria-label="Provider health"
          style={{ padding: '1.25rem 0', display: 'grid', gap: 10 }}
        >
          {(health?.providers ?? []).map((item) => (
            <div
              key={item.provider}
              style={{
                display: 'grid',
                gridTemplateColumns: '16px minmax(140px, 0.35fr) minmax(0, 1fr) auto',
                alignItems: 'center',
                gap: 10,
                border: `1px solid ${palette.border}`,
                background: palette.panel,
                padding: '0.75rem 0.9rem',
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              <StatusDot available={item.available} />
              <strong>{item.provider === 'xai' ? 'xAI API' : 'xAI Grok Build CLI'}</strong>
              <span style={{ color: palette.muted }}>{item.reason}</span>
              <span style={{ color: item.available ? palette.teal : palette.muted }}>
                {item.available ? 'AVAILABLE' : 'UNAVAILABLE'} {item.localOnly ? '· LOCAL' : ''}
              </span>
            </div>
          ))}
          {health ? (
            <div style={{ fontSize: 11, color: palette.muted }}>{health.evidenceBoundary}</div>
          ) : (
            <div style={{ fontSize: 12, color: palette.muted }}>
              Checking provider configuration…
            </div>
          )}
        </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 0.8fr)',
            gap: 18,
          }}
        >
          <main
            style={{
              border: `1px solid ${palette.border}`,
              background: palette.panel,
              borderRadius: 12,
              padding: '1.25rem',
            }}
          >
            <form onSubmit={submit}>
              <label
                htmlFor="atelier-prompt"
                style={{ display: 'block', fontSize: 12, color: palette.dim, marginBottom: 8 }}
              >
                Work with A11oy Atelier
              </label>
              <textarea
                id="atelier-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={7}
                maxLength={100_000}
                placeholder="Ask, analyze, synthesize, or draft…"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  border: `1px solid ${palette.border}`,
                  borderRadius: 9,
                  background: palette.bg,
                  color: palette.text,
                  padding: '1rem',
                  font: 'inherit',
                  lineHeight: 1.55,
                  boxSizing: 'border-box',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  alignItems: 'end',
                  marginTop: 12,
                }}
              >
                <label style={{ display: 'grid', gap: 5, fontSize: 11, color: palette.muted }}>
                  PROVIDER
                  <select
                    value={provider}
                    onChange={(event) => setProvider(event.target.value as typeof provider)}
                    style={{
                      padding: '0.55rem',
                      background: palette.bg,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 6,
                    }}
                  >
                    <option value="auto">Auto</option>
                    <option value="grok-build">Grok Build · local-only</option>
                    <option value="xai">xAI API</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 5, fontSize: 11, color: palette.muted }}>
                  REASONING
                  <select
                    value={reasoningEffort}
                    onChange={(event) =>
                      setReasoningEffort(event.target.value as typeof reasoningEffort)
                    }
                    style={{
                      padding: '0.55rem',
                      background: palette.bg,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 6,
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  style={{
                    marginLeft: 'auto',
                    padding: '0.65rem 1.2rem',
                    borderRadius: 999,
                    border: 'none',
                    color: palette.bg,
                    background: loading || !prompt.trim() ? palette.muted : palette.gold,
                    cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: 650,
                  }}
                >
                  {loading ? 'Routing…' : 'Ask Atelier'}
                </button>
              </div>
            </form>

            {error ? (
              <div
                role="alert"
                style={{
                  marginTop: 16,
                  border: `1px solid ${palette.danger}`,
                  color: palette.danger,
                  padding: '0.8rem',
                  borderRadius: 8,
                }}
              >
                {error}
              </div>
            ) : null}

            {result ? (
              <article
                aria-live="polite"
                style={{ marginTop: 22, borderTop: `1px solid ${palette.border}`, paddingTop: 20 }}
              >
                <div style={{ fontSize: 11, letterSpacing: '0.16em', color: palette.teal }}>
                  ATELIER RESPONSE
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.72, marginTop: 12 }}>
                  {result.answer}
                </div>
                <div
                  style={{
                    marginTop: 18,
                    padding: '0.8rem',
                    borderLeft: `2px solid ${palette.gold}`,
                    color: palette.muted,
                    fontSize: 11,
                    lineHeight: 1.6,
                  }}
                >
                  {result.disclosure}
                </div>
              </article>
            ) : null}
          </main>

          <div style={{ display: 'grid', alignContent: 'start', gap: 14 }}>
            {result ? (
              <ReceiptRail receipt={result.receipt} />
            ) : (
              <aside
                style={{
                  border: `1px solid ${palette.border}`,
                  background: palette.panelStrong,
                  borderRadius: 10,
                  padding: '1rem',
                  color: palette.muted,
                  fontSize: 12,
                  lineHeight: 1.65,
                }}
              >
                A receipt rail appears after each successful inference. Missing provider evidence
                remains unavailable—never silently promoted to a pass.
              </aside>
            )}
            <aside
              style={{ border: `1px solid ${palette.border}`, borderRadius: 10, padding: '1rem' }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  color: palette.gold,
                  marginBottom: 10,
                }}
              >
                POLICY GATES
              </div>
              {['Tools', 'Hosted search', 'Provider storage', 'Provider subagents'].map((label) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0',
                    borderTop: `1px solid ${palette.border}`,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: palette.dim }}>{label}</span>
                  <span style={{ color: palette.muted }}>DENY</span>
                </div>
              ))}
              <div style={{ marginTop: 10, color: palette.muted, fontSize: 11, lineHeight: 1.55 }}>
                First release is text-inference only. Future Ayllu council capabilities require
                explicit reviewed policy.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
}
