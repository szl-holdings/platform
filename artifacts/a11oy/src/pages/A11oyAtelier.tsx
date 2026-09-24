import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Layout } from '../components/layout';

const API = '/api/a11oy/v1/atelier';
const TENANT_ID = import.meta.env.VITE_A11OY_ATELIER_TENANT_ID ?? 'default';
const SESSION_STORAGE_KEY = `a11oy.atelier.session-id.v1:${TENANT_ID}`;

function normalizeSessionId(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length <= 128 ? normalized : undefined;
}

function readStoredSessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return normalizeSessionId(window.sessionStorage.getItem(SESSION_STORAGE_KEY));
  } catch {
    return undefined;
  }
}

function storeSessionId(sessionId: string): boolean {
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    return true;
  } catch {
    return false;
  }
}

function forgetStoredSessionId(): void {
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // The in-memory session is still cleared when browser storage is unavailable.
  }
}

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
  continuity?: {
    backend: string;
    persistenceState:
      | 'IN_PROCESS_NON_DURABLE'
      | 'ENCRYPTED_LOCAL_DURABLE'
      | 'PENDING_RECOVERY'
      | 'UNAVAILABLE';
    durable: boolean;
    encryptionState: 'NONE' | 'ENCRYPTED_AT_REST' | 'UNAVAILABLE';
    evidenceState: 'OBSERVED' | 'UNAVAILABLE';
    retentionHours: number;
  };
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
  schemaVersion?: string;
  providerPromptSha256?: string;
  idempotencyKeyDigest?: string;
  requestDigest?: string;
  contextDigest?: string;
  capsuleDigest?: string | null;
  sequence?: number | null;
  priorCapsuleDigest?: string | null;
  persistenceState?:
    | 'PENDING_STATE_COMMIT'
    | 'COMMITTED_IN_PROCESS_NON_DURABLE'
    | 'COMMITTED_ENCRYPTED_LOCAL_DURABLE'
    | 'PENDING_RECOVERY'
    | 'UNAVAILABLE';
  stateRetentionExpiresAt?: string | null;
  stateDurable?: boolean;
  localOnly: boolean;
  latencyMs: number;
  usage: Record<string, number>;
}

interface AskResponse {
  answer: string;
  disclosure: string;
  receipt: AtelierReceipt;
  replayed?: boolean;
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
  const priorCapsule =
    receipt.priorCapsuleDigest === undefined
      ? 'UNAVAILABLE'
      : (receipt.priorCapsuleDigest ?? 'GENESIS');
  const stateDurable =
    receipt.stateDurable === undefined ? 'UNAVAILABLE' : receipt.stateDurable ? 'YES' : 'NO';
  const rows = [
    ['Receipt', receipt.receiptId],
    ['Turn Capsule', receipt.capsuleDigest ?? 'UNAVAILABLE'],
    ['Sequence', receipt.sequence == null ? 'UNAVAILABLE' : String(receipt.sequence)],
    ['Prior capsule', priorCapsule],
    ['Continuity', receipt.persistenceState ?? 'UNAVAILABLE'],
    ['State durable', stateDurable],
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
  const [resumeSessionId, setResumeSessionId] = useState(() => readStoredSessionId() ?? '');
  const [sessionNotice, setSessionNotice] = useState<string>();
  const [health, setHealth] = useState<HealthResponse>();
  const [result, setResult] = useState<AskResponse>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const pendingRetry = useRef<{ fingerprint: string; key: string; sessionId: string } | undefined>(
    undefined,
  );

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
      const requestFingerprint = JSON.stringify({
        prompt: trimmed,
        provider,
        reasoningEffort,
        sessionId: sessionId ?? null,
        capabilities: { tools: false, search: false, durableStorage: false, subagents: false },
      });
      const matchingRetry =
        pendingRetry.current?.fingerprint === requestFingerprint ? pendingRetry.current : undefined;
      const requestSessionId = sessionId ?? matchingRetry?.sessionId ?? crypto.randomUUID();
      const idempotencyKey = matchingRetry?.key ?? crypto.randomUUID();
      pendingRetry.current = {
        fingerprint: requestFingerprint,
        key: idempotencyKey,
        sessionId: requestSessionId,
      };
      const requestBody = {
        prompt: trimmed,
        provider,
        reasoningEffort,
        sessionId: requestSessionId,
        capabilities: { tools: false, search: false, durableStorage: false, subagents: false },
      };
      const response = await fetch(`${API}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': TENANT_ID,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ ...requestBody, idempotencyKey }),
      });
      const payload = (await response.json()) as AskResponse & { error?: string; code?: string };
      if (!response.ok)
        throw new Error(
          `${payload.error ?? `HTTP ${response.status}`} [${payload.code ?? 'ERROR'}]`,
        );
      const confirmedSessionId = normalizeSessionId(payload.receipt.sessionId);
      if (!confirmedSessionId) throw new Error('Atelier returned an invalid session identifier.');
      const replayed = response.headers.get('Idempotency-Replayed')?.toLowerCase() === 'true';
      setResult(replayed && payload.replayed !== true ? { ...payload, replayed: true } : payload);
      setSessionId(confirmedSessionId);
      setResumeSessionId(confirmedSessionId);
      setSessionNotice(
        storeSessionId(confirmedSessionId)
          ? 'Session confirmed and saved for this browser tab.'
          : 'Session confirmed, but tab storage is unavailable. Copy the session ID before leaving.',
      );
      setPrompt('');
      pendingRetry.current = undefined;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }

  function resumeSession() {
    const normalized = normalizeSessionId(resumeSessionId);
    if (!normalized) {
      setSessionNotice('Enter a session ID between 1 and 128 characters.');
      return;
    }
    pendingRetry.current = undefined;
    setSessionId(normalized);
    setResumeSessionId(normalized);
    setResult(undefined);
    setSessionNotice(
      storeSessionId(normalized)
        ? 'Session selected for the next request and saved for this browser tab.'
        : 'Session selected for the next request, but tab storage is unavailable.',
    );
  }

  function startNewSession() {
    pendingRetry.current = undefined;
    setSessionId(undefined);
    setResumeSessionId('');
    setResult(undefined);
    forgetStoredSessionId();
    setSessionNotice('New session selected. A session ID will be created with the next request.');
  }

  async function copySessionId() {
    if (!sessionId) return;
    try {
      await navigator.clipboard.writeText(sessionId);
      setSessionNotice('Session ID copied.');
    } catch {
      setSessionNotice(
        'Clipboard access was unavailable. Select and copy the session ID manually.',
      );
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
                {item.available ? 'CONFIGURED' : 'UNAVAILABLE'} {item.localOnly ? '· LOCAL' : ''}
              </span>
            </div>
          ))}
          {health ? (
            <>
              {health.continuity ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '16px minmax(140px, 0.35fr) minmax(0, 1fr) auto',
                    alignItems: 'center',
                    gap: 10,
                    border: `1px solid ${palette.borderStrong}`,
                    background: 'rgba(201,183,135,0.035)',
                    padding: '0.75rem 0.9rem',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  <StatusDot available={health.continuity.evidenceState === 'OBSERVED'} />
                  <strong>A11oy continuity</strong>
                  <span style={{ color: palette.muted }}>
                    {health.continuity.backend} · {health.continuity.encryptionState} ·{' '}
                    {health.continuity.retentionHours}h retention
                  </span>
                  <span style={{ color: health.continuity.durable ? palette.teal : palette.gold }}>
                    {health.continuity.persistenceState}
                  </span>
                </div>
              ) : null}
              <div style={{ fontSize: 11, color: palette.muted }}>{health.evidenceBoundary}</div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: palette.muted }}>
              Checking provider configuration…
            </div>
          )}
        </section>

        <section
          aria-label="Session continuity"
          style={{
            marginBottom: 18,
            border: `1px solid ${palette.border}`,
            background: palette.panel,
            borderRadius: 10,
            padding: '1rem',
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: '0.16em', color: palette.gold }}>
            SESSION CONTINUITY
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'end',
              marginTop: 12,
            }}
          >
            <label
              style={{
                display: 'grid',
                flex: '1 1 320px',
                gap: 5,
                fontSize: 11,
                color: palette.muted,
              }}
            >
              RESUME SESSION ID
              <input
                value={resumeSessionId}
                onChange={(event) => setResumeSessionId(event.target.value)}
                maxLength={128}
                autoComplete="off"
                spellCheck={false}
                aria-describedby="atelier-session-privacy"
                placeholder="Paste a previous session ID"
                style={{
                  padding: '0.6rem 0.7rem',
                  background: palette.bg,
                  color: palette.text,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 6,
                  font: 'inherit',
                }}
              />
            </label>
            <button
              type="button"
              onClick={resumeSession}
              disabled={loading || !normalizeSessionId(resumeSessionId)}
              style={{
                padding: '0.6rem 0.9rem',
                border: `1px solid ${palette.borderStrong}`,
                borderRadius: 6,
                background: palette.bg,
                color: palette.text,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Resume
            </button>
            <button
              type="button"
              onClick={startNewSession}
              disabled={loading}
              style={{
                padding: '0.6rem 0.9rem',
                border: `1px solid ${palette.border}`,
                borderRadius: 6,
                background: palette.bg,
                color: palette.text,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              New session
            </button>
          </div>
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <span style={{ color: palette.muted, fontSize: 11 }}>ACTIVE SESSION</span>
            <code style={{ color: palette.text, overflowWrap: 'anywhere' }}>
              {sessionId ?? 'Created with the next request'}
            </code>
            <button
              type="button"
              onClick={copySessionId}
              disabled={!sessionId}
              style={{
                padding: '0.45rem 0.75rem',
                border: `1px solid ${palette.border}`,
                borderRadius: 6,
                background: palette.bg,
                color: palette.text,
                cursor: sessionId ? 'pointer' : 'not-allowed',
              }}
            >
              Copy ID
            </button>
          </div>
          {sessionNotice ? (
            <div
              role="status"
              aria-live="polite"
              style={{ marginTop: 10, color: palette.teal, fontSize: 11 }}
            >
              {sessionNotice}
            </div>
          ) : null}
          <p
            id="atelier-session-privacy"
            style={{
              margin: '10px 0 0',
              color: palette.muted,
              fontSize: 11,
              lineHeight: 1.55,
            }}
          >
            Only the non-secret session ID is kept in this tab's session storage. It is not
            authentication. On a shared browser, choose New session before handing off the tab.
          </p>
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
                  {result.replayed ? 'ATELIER RESPONSE · IDEMPOTENT REPLAY' : 'ATELIER RESPONSE'}
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
