import {
  type AtelierProofweaveApiResponse,
  type AtelierProofweaveRequest,
  verifyAtelierProofweaveResponse,
} from '@szl-holdings/a11oy-atelier/proofweave-verifier';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Layout } from '../components/layout';

const API = '/api/a11oy/v1/atelier';
const TENANT_ID = import.meta.env.VITE_A11OY_ATELIER_TENANT_ID ?? 'default';
const SESSION_STORAGE_KEY = `a11oy.atelier.session-id.v1:${TENANT_ID}`;
const PENDING_RETRY_STORAGE_KEY = `a11oy.atelier.pending-retry.v1:${TENANT_ID}`;
const PENDING_RETRY_TTL_MS = 24 * 60 * 60 * 1000;

interface PendingRetry {
  fingerprintSha256: string;
  key: string;
  sessionId: string;
  createdAt: number;
}

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

function readPendingRetry(): PendingRetry | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = window.sessionStorage.getItem(PENDING_RETRY_STORAGE_KEY);
    if (!stored) return undefined;
    const value = JSON.parse(stored) as Partial<PendingRetry>;
    if (
      typeof value.fingerprintSha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(value.fingerprintSha256) ||
      typeof value.key !== 'string' ||
      !/^[a-f0-9-]{36}$/.test(value.key) ||
      !normalizeSessionId(value.sessionId) ||
      typeof value.createdAt !== 'number' ||
      !Number.isFinite(value.createdAt) ||
      value.createdAt > Date.now()
    ) {
      forgetPendingRetry();
      return undefined;
    }
    return value as PendingRetry;
  } catch {
    return undefined;
  }
}

function storePendingRetry(value: PendingRetry): boolean {
  try {
    window.sessionStorage.setItem(PENDING_RETRY_STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function forgetPendingRetry(): void {
  try {
    window.sessionStorage.removeItem(PENDING_RETRY_STORAGE_KEY);
  } catch {
    // The in-memory retry remains scoped to this mounted page.
  }
}

async function fingerprintRequest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const BROWSER_ACTIONS_BLOCK_REASON =
  'Browser actions are disabled outside a loopback-only local development origin because A11oy Atelier does not yet have an authenticated server-side session or BFF. Runtime evidence is UNKNOWN. Provider API keys remain server-side and are never accepted from the browser.';

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
  if (normalized === 'localhost' || normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
    return true;
  }
  const octets = normalized.split('.');
  return (
    octets.length === 4 &&
    octets[0] === '127' &&
    octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255)
  );
}

export function resolveAtelierBrowserBoundary(
  localDevelopment: boolean,
  hostname = typeof window === 'undefined' ? 'localhost' : window.location.hostname,
) {
  return localDevelopment && isLoopbackHostname(hostname)
    ? ({ actionsEnabled: true, scope: 'LOCAL_DEVELOPMENT_ONLY' } as const)
    : ({
        actionsEnabled: false,
        evidenceClass: 'BLOCKED',
        runtimeEvidenceClass: 'UNKNOWN',
        reason: BROWSER_ACTIONS_BLOCK_REASON,
      } as const);
}

const BROWSER_BOUNDARY = resolveAtelierBrowserBoundary(
  import.meta.env.DEV,
  typeof window === 'undefined' ? '' : window.location.hostname,
);

interface ProviderHealth {
  provider: 'xai' | 'grok-build';
  model: string;
  configured: boolean;
  available: boolean;
  localOnly: boolean;
  evidenceState: 'MEASURED' | 'UNAVAILABLE';
  reason: string;
}

interface HealthResponse {
  status: 'partial';
  providers: ProviderHealth[];
  inference: {
    configurationState: 'CONFIGURED_OR_LOCAL_EXECUTABLE_MEASURED' | 'UNAVAILABLE';
    runtimeEvidenceClass: 'UNKNOWN';
  };
  proofweave?: {
    compiler: { available: boolean; mode: 'DETERMINISTIC_COMPILE_ONLY' };
    planExecution: false;
    planPersistence: 'IN_PROCESS_NOT_STORED';
    evidenceClass: 'SIMULATED';
    operationalState: 'DEMO';
    planExternalWrites: false;
    providerNativeSubagents: false;
    providerDurableStorage: false;
    auditLedger: {
      appendSideEffect: true;
      backendState: 'CONFIGURATION_DEPENDENT';
      durablePersistenceEvidenceClass: 'UNKNOWN';
      tenantAttributionEvidenceClass: 'DECLARED';
    };
  };
  continuity?: {
    backend: string;
    persistenceState:
      | 'IN_PROCESS_NON_DURABLE'
      | 'ENCRYPTED_LOCAL_DURABLE'
      | 'PENDING_RECOVERY'
      | 'UNAVAILABLE';
    durable: boolean;
    encryptionState: 'NONE' | 'ENCRYPTED_AT_REST' | 'UNAVAILABLE';
    evidenceState: 'MEASURED' | 'UNAVAILABLE';
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

type ProofweaveClaimKind = 'FACT' | 'INFERENCE' | 'RECOMMENDATION';
type ProofweavePlanResponse = AtelierProofweaveApiResponse;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export async function validateProofweavePlanResponse(
  value: unknown,
  request: AtelierProofweaveRequest,
  tenantId: string,
): Promise<ProofweavePlanResponse> {
  return verifyAtelierProofweaveResponse(value, { request, tenantId });
}

const palette = {
  bg: '#0a0a0a',
  panel: 'rgba(255,255,255,0.025)',
  panelStrong: 'rgba(255,255,255,0.045)',
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(201,183,135,0.35)',
  text: '#f5f5f5',
  dim: '#a0a0a0',
  muted: '#858585',
  gold: '#c9b787',
  teal: '#75b8ad',
  danger: '#ef8e8e',
};

function ConfigurationDot({ measured }: { measured: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: measured ? palette.gold : palette.muted,
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
    [
      'Evidence ledger append',
      `${receipt.ledgerState} · ${receipt.ledgerEntryId ?? 'UNAVAILABLE'}`,
    ],
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
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.16em',
          color: palette.gold,
          marginBottom: 12,
        }}
      >
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
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high' | 'xhigh'>(
    'medium',
  );
  const [sessionId, setSessionId] = useState<string>();
  const [initialPendingRetry] = useState(() => readPendingRetry());
  const [resumeSessionId, setResumeSessionId] = useState(
    () => readStoredSessionId() ?? initialPendingRetry?.sessionId ?? '',
  );
  const [sessionNotice, setSessionNotice] = useState<string | undefined>(() => {
    if (!initialPendingRetry) return undefined;
    return Date.now() - initialPendingRetry.createdAt >= PENDING_RETRY_TTL_MS
      ? 'An earlier turn is unconfirmed and its safe retry window has expired. Do not resend it automatically.'
      : 'An earlier turn is unconfirmed. Re-enter the same prompt and settings to retry safely; the prompt is not stored in this tab.';
  });
  const [health, setHealth] = useState<HealthResponse>();
  const [result, setResult] = useState<AskResponse>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [weaveObjective, setWeaveObjective] = useState('');
  const [weaveClaim, setWeaveClaim] = useState('');
  const [weaveClaimKind, setWeaveClaimKind] = useState<ProofweaveClaimKind>('INFERENCE');
  const [weavePlan, setWeavePlan] = useState<ProofweavePlanResponse>();
  const [weaveError, setWeaveError] = useState<string>();
  const [weaveLoading, setWeaveLoading] = useState(false);
  const browserActionsBlocked = !BROWSER_BOUNDARY.actionsEnabled;
  const proofweaveSubmitDisabled =
    browserActionsBlocked || weaveLoading || !weaveObjective.trim() || !weaveClaim.trim();
  const askSubmitDisabled = browserActionsBlocked || loading || !prompt.trim();
  const pendingRetry = useRef<PendingRetry | undefined>(initialPendingRetry);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'A11oy Atelier — Evidence-Bound Intelligence';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    if (!BROWSER_BOUNDARY.actionsEnabled) return;

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
    if (!BROWSER_BOUNDARY.actionsEnabled) {
      setResult(undefined);
      setError(`BLOCKED — ${BROWSER_BOUNDARY.reason}`);
      return;
    }
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(undefined);
    try {
      const requestFingerprint = JSON.stringify({
        prompt: trimmed,
        provider,
        reasoningEffort,
        capabilities: { tools: false, search: false, durableStorage: false, subagents: false },
      });
      const fingerprintSha256 = await fingerprintRequest(requestFingerprint);
      if (
        pendingRetry.current &&
        Date.now() - pendingRetry.current.createdAt >= PENDING_RETRY_TTL_MS
      ) {
        setError(
          'The pending retry window expired. Do not resend it automatically; choose New session only if you intend a new provider request.',
        );
        return;
      }
      if (pendingRetry.current && pendingRetry.current.fingerprintSha256 !== fingerprintSha256) {
        setError(
          'An earlier turn is unconfirmed. Retry with the same prompt, provider, and reasoning effort, or explicitly choose New session.',
        );
        return;
      }
      const matchingRetry = pendingRetry.current;
      const requestSessionId = sessionId ?? matchingRetry?.sessionId ?? crypto.randomUUID();
      const idempotencyKey = matchingRetry?.key ?? crypto.randomUUID();
      pendingRetry.current = {
        fingerprintSha256,
        key: idempotencyKey,
        sessionId: requestSessionId,
        createdAt: matchingRetry?.createdAt ?? Date.now(),
      };
      if (!storePendingRetry(pendingRetry.current)) {
        setSessionNotice(
          'Tab storage is unavailable. Keep this tab open: a reload would lose the safe retry key.',
        );
      }
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
      const payload = (await response.json()) as AskResponse & {
        error?: string;
        code?: string;
      };
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
      forgetPendingRetry();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }

  async function compileProofweave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!BROWSER_BOUNDARY.actionsEnabled) {
      setWeavePlan(undefined);
      setWeaveError(`BLOCKED — ${BROWSER_BOUNDARY.reason}`);
      return;
    }
    const objective = weaveObjective.trim();
    const claim = weaveClaim.trim();
    if (!objective || !claim || weaveLoading) return;
    setWeaveLoading(true);
    setWeaveError(undefined);
    setWeavePlan(undefined);
    try {
      const request: AtelierProofweaveRequest = {
        objective,
        claims: [{ claimId: 'claim-1', statement: claim, kind: weaveClaimKind }],
        materials: [],
        budget: {
          maxWorkcells: 5,
          maxProviderCalls: 6,
          maxSourceFetches: 16,
          maxTotalTokens: 50_000,
          maxEstimatedCostUsd: 5,
          maxWallTimeMs: 300_000,
        },
        requestedCapabilities: {
          readWeb: false,
          readGitHub: false,
          externalWrites: false,
          providerNativeSubagents: false,
          providerDurableStorage: false,
        },
        outputFormat: 'TECHNICAL_REPORT',
      };
      const response = await fetch(`${API}/proofweave/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': TENANT_ID,
        },
        body: JSON.stringify(request),
      });
      const responseText = await response.text();
      let payload: unknown;
      try {
        payload = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error('Invalid JSON response [ATELIER_RESPONSE_INVALID_JSON]');
      }
      if (!response.ok) {
        const errorPayload = asRecord(payload);
        throw new Error(
          (typeof errorPayload.error === 'string'
            ? errorPayload.error
            : `HTTP ${String(response.status)}`) +
            ' [' +
            (typeof errorPayload.code === 'string' ? errorPayload.code : 'ERROR') +
            ']',
        );
      }
      setWeavePlan(await validateProofweavePlanResponse(payload, request, TENANT_ID));
    } catch (reason) {
      setWeaveError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setWeaveLoading(false);
    }
  }

  function resumeSession() {
    const normalized = normalizeSessionId(resumeSessionId);
    if (!normalized) {
      setSessionNotice('Enter a session ID between 1 and 128 characters.');
      return;
    }
    if (pendingRetry.current?.sessionId !== normalized) {
      pendingRetry.current = undefined;
      forgetPendingRetry();
    }
    setSessionId(normalized);
    setResumeSessionId(normalized);
    setResult(undefined);
    setSessionNotice(
      storeSessionId(normalized)
        ? pendingRetry.current
          ? 'Session selected. The unconfirmed turn still requires the same prompt and settings for a safe retry.'
          : 'Session selected for the next request and saved for this browser tab.'
        : 'Session selected for the next request, but tab storage is unavailable.',
    );
  }

  function startNewSession() {
    pendingRetry.current = undefined;
    forgetPendingRetry();
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
        <header
          style={{
            padding: '1.5rem 0 2rem',
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.2em',
              color: palette.gold,
            }}
          >
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
          <p
            style={{
              maxWidth: 720,
              color: palette.muted,
              lineHeight: 1.7,
              marginTop: '1.25rem',
            }}
          >
            Learn the pattern. Rebuild the expression. Receipt every decision. A11oy owns the
            policy, memory, orchestration, and evidence rail; inference providers remain explicit
            and replaceable.
          </p>
        </header>

        <section
          aria-label="Provider health"
          style={{ padding: '1.25rem 0', display: 'grid', gap: 10 }}
        >
          {browserActionsBlocked ? (
            <div
              role="status"
              style={{
                display: 'grid',
                gap: 6,
                border: `1px solid ${palette.borderStrong}`,
                background: 'rgba(201,183,135,0.035)',
                padding: '0.9rem',
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              <strong style={{ color: palette.gold }}>BLOCKED · RUNTIME UNKNOWN</strong>
              <span style={{ color: palette.muted }}>{BROWSER_BOUNDARY.reason}</span>
            </div>
          ) : null}
          {!browserActionsBlocked && health ? (
            <>
              {health.providers.map((item) => (
                <div
                  key={item.provider}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '16px minmax(180px, 0.4fr) minmax(0, 1fr) auto',
                    alignItems: 'center',
                    gap: 10,
                    border: `1px solid ${palette.border}`,
                    background: palette.panel,
                    padding: '0.75rem 0.9rem',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  <ConfigurationDot measured={item.evidenceState === 'MEASURED'} />
                  <strong>
                    {item.provider === 'xai' ? 'xAI API' : 'xAI Grok Build CLI'} · {item.model}
                  </strong>
                  <span style={{ color: palette.muted }}>{item.reason}</span>
                  <span style={{ color: item.available ? palette.gold : palette.muted }}>
                    {item.available ? 'CONFIGURED' : 'UNAVAILABLE'}
                    {item.localOnly ? ' · LOCAL' : ''}
                  </span>
                </div>
              ))}
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
                  <ConfigurationDot measured={health.continuity.evidenceState === 'MEASURED'} />
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
              <div style={{ fontSize: 11, color: palette.muted, display: 'grid', gap: 4 }}>
                <span>INFERENCE RUNTIME {health.inference.runtimeEvidenceClass}</span>
                <span>{health.evidenceBoundary}</span>
              </div>
            </>
          ) : !browserActionsBlocked ? (
            <div style={{ fontSize: 12, color: palette.muted }}>
              Checking provider configuration…
            </div>
          ) : null}
        </section>

        <section
          aria-labelledby="proofweave-heading"
          style={{
            border: `1px solid ${palette.borderStrong}`,
            background: 'rgba(201,183,135,0.025)',
            borderRadius: 12,
            padding: '1.25rem',
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  color: palette.gold,
                }}
              >
                ATELIER PROOFWEAVE
              </div>
              <h2 id="proofweave-heading" style={{ margin: '0.45rem 0 0', fontSize: '1.5rem' }}>
                Pattern → Cut → Stitch → Fitting → Label
              </h2>
              <p
                style={{
                  maxWidth: 760,
                  color: palette.muted,
                  lineHeight: 1.65,
                  margin: '0.65rem 0 0',
                }}
              >
                Compile a bounded research pattern and initial claim graph. Plan compilation does
                not execute providers, fetch sources, or perform plan-execution writes. The API
                separately dispatches audit metadata to an EvidenceLedger backend whose durability
                evidence remains UNKNOWN; automated review is never represented as human approval.
              </p>
            </div>
            <span
              style={{
                border: `1px solid ${palette.border}`,
                borderRadius: 999,
                color: health?.proofweave?.compiler.available ? palette.teal : palette.muted,
                padding: '0.45rem 0.75rem',
                fontSize: 11,
              }}
            >
              {health?.proofweave?.compiler.available
                ? 'COMPILER MEASURED'
                : 'COMPILER HEALTH UNAVAILABLE'}
            </span>
          </div>

          <form onSubmit={compileProofweave} style={{ marginTop: 18 }}>
            <label
              htmlFor="proofweave-objective"
              style={{
                display: 'block',
                fontSize: 12,
                color: palette.dim,
                marginBottom: 8,
              }}
            >
              Research or decision objective
            </label>
            <textarea
              id="proofweave-objective"
              value={weaveObjective}
              onChange={(event) => setWeaveObjective(event.target.value)}
              rows={3}
              maxLength={100_000}
              placeholder="Define the question, decision, or recommendation the claim graph must examine."
              style={{
                width: '100%',
                resize: 'vertical',
                border: `1px solid ${palette.border}`,
                borderRadius: 9,
                background: palette.bg,
                color: palette.text,
                padding: '0.9rem',
                font: 'inherit',
                lineHeight: 1.55,
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                gap: 10,
                marginTop: 10,
              }}
            >
              <label
                style={{
                  display: 'grid',
                  gap: 6,
                  fontSize: 12,
                  color: palette.dim,
                }}
              >
                Claim statement
                <textarea
                  id="proofweave-claim"
                  value={weaveClaim}
                  onChange={(event) => setWeaveClaim(event.target.value)}
                  rows={2}
                  maxLength={100_000}
                  placeholder="State one proposition to evaluate; keep the objective separate."
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    border: `1px solid ${palette.border}`,
                    borderRadius: 9,
                    background: palette.bg,
                    color: palette.text,
                    padding: '0.8rem',
                    font: 'inherit',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
              </label>
              <label
                style={{
                  display: 'grid',
                  alignContent: 'start',
                  gap: 6,
                  fontSize: 12,
                  color: palette.dim,
                }}
              >
                Claim kind
                <select
                  value={weaveClaimKind}
                  onChange={(event) => setWeaveClaimKind(event.target.value as ProofweaveClaimKind)}
                  style={{
                    minHeight: 44,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 9,
                    background: palette.bg,
                    color: palette.text,
                    padding: '0.65rem',
                  }}
                >
                  <option value="FACT">Fact</option>
                  <option value="INFERENCE">Inference</option>
                  <option value="RECOMMENDATION">Recommendation</option>
                </select>
              </label>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 10,
                marginTop: 10,
              }}
            >
              <span style={{ color: palette.muted, fontSize: 11 }}>
                {browserActionsBlocked
                  ? 'BLOCKED · PRODUCTION BROWSER RUNTIME UNKNOWN'
                  : 'SIMULATED · COMPILE ONLY · IN-PROCESS NOT STORED'}
              </span>
              <button
                type="submit"
                disabled={proofweaveSubmitDisabled}
                style={{
                  minHeight: 44,
                  marginLeft: 'auto',
                  padding: '0.65rem 1.2rem',
                  borderRadius: 999,
                  border: 'none',
                  color: palette.bg,
                  background: proofweaveSubmitDisabled ? palette.muted : palette.gold,
                  cursor: proofweaveSubmitDisabled ? 'not-allowed' : 'pointer',
                  fontWeight: 650,
                }}
              >
                {browserActionsBlocked
                  ? 'BLOCKED — server session required'
                  : weaveLoading
                    ? 'Compiling…'
                    : 'Compile Proofweave'}
              </button>
            </div>
          </form>

          {weaveError ? (
            <div
              role="alert"
              style={{
                marginTop: 14,
                border: `1px solid ${palette.danger}`,
                color: palette.danger,
                padding: '0.8rem',
                borderRadius: 8,
              }}
            >
              {weaveError}
            </div>
          ) : null}

          {weavePlan ? (
            <article aria-live="polite" style={{ marginTop: 20 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 8,
                }}
              >
                {[
                  ['Evidence class', weavePlan.evidenceClass],
                  ['Operational', weavePlan.operationalState],
                  ['Execution', weavePlan.executionState],
                  ['Plan persistence', weavePlan.persistenceState],
                  ['Review', `${weavePlan.review.reviewType} · ${weavePlan.review.reviewState}`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      border: `1px solid ${palette.border}`,
                      background: palette.panel,
                      borderRadius: 8,
                      padding: '0.75rem',
                    }}
                  >
                    <div style={{ color: palette.muted, fontSize: 10 }}>{label.toUpperCase()}</div>
                    <div style={{ color: palette.dim, fontSize: 12, marginTop: 4 }}>{value}</div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 8,
                  marginTop: 10,
                }}
              >
                {weavePlan.stages.map((stage) => (
                  <div
                    key={stage.stageId}
                    style={{
                      border: `1px solid ${palette.border}`,
                      background: palette.bg,
                      borderRadius: 8,
                      padding: '0.8rem',
                    }}
                  >
                    <div style={{ color: palette.gold, fontSize: 11 }}>
                      {String(stage.order).padStart(2, '0')} · {stage.name}
                    </div>
                    <div
                      style={{
                        color: palette.text,
                        fontSize: 12,
                        marginTop: 6,
                      }}
                    >
                      {stage.role}
                    </div>
                    <div
                      style={{
                        color: palette.muted,
                        fontSize: 10,
                        marginTop: 5,
                      }}
                    >
                      {stage.executionState}
                    </div>
                    <div
                      style={{
                        color: palette.muted,
                        fontSize: 11,
                        lineHeight: 1.5,
                        marginTop: 6,
                      }}
                    >
                      {stage.description}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr)',
                  gap: 6,
                  borderTop: `1px solid ${palette.border}`,
                  marginTop: 14,
                  paddingTop: 12,
                  fontSize: 11,
                  color: palette.muted,
                  overflowWrap: 'anywhere',
                }}
              >
                <span>OBJECTIVE {weavePlan.objective}</span>
                <span>WEAVE {weavePlan.weaveId}</span>
                <span>PLAN SHA-256 {weavePlan.planSha256}</span>
                <span>
                  EVIDENCE LEDGER APPEND {weavePlan.ledger.appendState} · {weavePlan.ledger.entryId}
                </span>
                <span>
                  LEDGER BACKEND {weavePlan.ledger.backendState} · DURABILITY{' '}
                  {weavePlan.ledger.durablePersistenceEvidenceClass}
                </span>
                <span>TENANT ATTRIBUTION {weavePlan.tenantAttributionEvidenceClass}</span>
                <span>
                  HUMAN APPROVAL {weavePlan.review.humanApprovalState} · AUTOMATED REVIEW{' '}
                  {weavePlan.review.reviewState}
                </span>
              </div>
              <ul
                style={{
                  color: palette.muted,
                  fontSize: 11,
                  lineHeight: 1.55,
                  paddingLeft: 18,
                }}
              >
                {weavePlan.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </article>
          ) : null}
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
            This tab stores the session ID and, while a turn is unconfirmed, a prompt-free retry
            key. Neither is authentication. On a shared browser, choose New session before handing
            off the tab.
          </p>
        </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 18,
          }}
        >
          <section
            aria-label="Atelier query workspace"
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
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: palette.dim,
                  marginBottom: 8,
                }}
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
                <label
                  style={{
                    display: 'grid',
                    gap: 5,
                    fontSize: 11,
                    color: palette.muted,
                  }}
                >
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
                <label
                  style={{
                    display: 'grid',
                    gap: 5,
                    fontSize: 11,
                    color: palette.muted,
                  }}
                >
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
                    <option value="xhigh">Extra high</option>
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={askSubmitDisabled}
                  style={{
                    marginLeft: 'auto',
                    padding: '0.65rem 1.2rem',
                    borderRadius: 999,
                    border: 'none',
                    color: palette.bg,
                    background: askSubmitDisabled ? palette.muted : palette.gold,
                    cursor: askSubmitDisabled ? 'not-allowed' : 'pointer',
                    fontWeight: 650,
                  }}
                >
                  {browserActionsBlocked
                    ? 'BLOCKED — server session required'
                    : loading
                      ? 'Routing…'
                      : 'Ask Atelier'}
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
                style={{
                  marginTop: 22,
                  borderTop: `1px solid ${palette.border}`,
                  paddingTop: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.16em',
                    color: palette.teal,
                  }}
                >
                  {result.replayed ? 'ATELIER RESPONSE · IDEMPOTENT REPLAY' : 'ATELIER RESPONSE'}
                </div>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.72,
                    marginTop: 12,
                  }}
                >
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
          </section>

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
              style={{
                border: `1px solid ${palette.border}`,
                borderRadius: 10,
                padding: '1rem',
              }}
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
              <div
                style={{
                  marginTop: 10,
                  color: palette.muted,
                  fontSize: 11,
                  lineHeight: 1.55,
                }}
              >
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
