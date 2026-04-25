import { ClipboardCheck, FileText, Layers, Sliders, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface SavedRiskRunMetric {
  id: string;
  label: string;
  format?: string;
  mean: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  min: number;
  max: number;
  stdDev: number;
}

export interface SavedRiskRunSensitivity {
  inputId: string;
  label: string;
  impact: number;
}

export interface SavedRiskRunInput {
  id: string;
  label: string;
  unit?: string;
  format?: string;
  distribution: unknown;
}

export interface SavedRiskRun {
  evidenceId: string;
  scenarioId: string;
  scenarioVersion?: string;
  scenarioTitle: string;
  domain: string;
  iterations: number;
  validIterations: number;
  durationMs: number;
  metrics: SavedRiskRunMetric[];
  sensitivities: SavedRiskRunSensitivity[];
  inputs: SavedRiskRunInput[];
  savedAt: string;
  savedBy?: string;
  tenant?: string;
  note?: string;
}

const STORAGE_KEY_PREFIX = 'szl.risk-evidence';
const MAX_RUNS_PER_DOMAIN = 200;

const READ_EVENT = 'szl-risk-evidence:changed';

function storageKey(domain: string): string {
  return `${STORAGE_KEY_PREFIX}.${domain}`;
}

function safeRead(domain: string): SavedRiskRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(domain));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedRiskRun[];
  } catch {
    return [];
  }
}

function safeWrite(domain: string, runs: SavedRiskRun[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      storageKey(domain),
      JSON.stringify(runs.slice(0, MAX_RUNS_PER_DOMAIN)),
    );
    window.dispatchEvent(new CustomEvent(READ_EVENT, { detail: { domain } }));
  } catch {
    /* quota exceeded — ignore */
  }
}

function mergeRuns(...lists: SavedRiskRun[][]): SavedRiskRun[] {
  const byId = new Map<string, SavedRiskRun>();
  for (const list of lists) {
    for (const run of list) {
      const existing = byId.get(run.evidenceId);
      // Prefer the most recent savedAt when duplicates collide.
      if (!existing || existing.savedAt < run.savedAt) {
        byId.set(run.evidenceId, run);
      }
    }
  }
  return Array.from(byId.values()).sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

// ── Backend sync ─────────────────────────────────────────────────────────────
//
// The API endpoint lives at /api/risk-evidence (see
// artifacts/api-server/src/routes/risk-evidence.ts) and is public/unauth like
// the rest of the Terra/Vessels demo surfaces. localStorage stays in place as
// an offline cache so the page still renders cited runs when the API is
// briefly unreachable, but the API is the source of truth across browsers
// and devices.

const API_BASE = '/api/risk-evidence';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1));
}

async function fetchFreshCsrfToken(): Promise<void> {
  try {
    await fetch('/api/csrf-token', { method: 'GET', credentials: 'include' });
  } catch {
    // best-effort
  }
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const method = ((init?.method ?? 'GET') as string).toUpperCase();
  const needsCsrf = CSRF_MUTATING_METHODS.has(method);
  let csrfRetried = false;

  const doFetch = async (): Promise<unknown> => {
    const csrfToken = needsCsrf ? readCsrfTokenFromCookie() : null;
    const res = await fetch(url, {
      credentials: 'include',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(needsCsrf && csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
        ...init?.headers,
      },
    });
    if (!res.ok) {
      if (res.status === 403 && !csrfRetried) {
        const body = await res.json().catch(() => null) as { code?: string } | null;
        const code = body?.code;
        if (code === 'CSRF_TOKEN_MISSING' || code === 'CSRF_TOKEN_MISMATCH') {
          csrfRetried = true;
          await fetchFreshCsrfToken();
          return doFetch();
        }
      }
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  };

  return doFetch();
}

export async function fetchRiskRunEvidence(domain: string): Promise<SavedRiskRun[]> {
  try {
    const body = (await fetchJson(`${API_BASE}/${encodeURIComponent(domain)}`)) as {
      runs?: SavedRiskRun[];
    };
    const remote = Array.isArray(body?.runs) ? body.runs : [];
    const local = safeRead(domain);
    const merged = mergeRuns(remote, local);
    safeWrite(domain, merged);
    return merged;
  } catch {
    return safeRead(domain).sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
  }
}

export async function fetchRiskRunEvidenceById(evidenceId: string): Promise<SavedRiskRun | null> {
  try {
    const body = (await fetchJson(
      `${API_BASE}/by-id/${encodeURIComponent(evidenceId)}`,
    )) as SavedRiskRun;
    if (body && typeof body === 'object' && typeof body.evidenceId === 'string') return body;
    return null;
  } catch {
    return null;
  }
}

export function listRiskRunEvidence(domain: string): SavedRiskRun[] {
  return safeRead(domain).sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export async function saveRiskRunEvidence(
  domain: string,
  run: Omit<SavedRiskRun, 'evidenceId' | 'savedAt'> & { evidenceId?: string; savedAt?: string },
): Promise<SavedRiskRun> {
  const evidenceId =
    run.evidenceId ??
    `RSK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  const savedAt = run.savedAt ?? new Date().toISOString();
  const optimistic: SavedRiskRun = { ...run, evidenceId, savedAt };

  // Always update the local cache first so the UI reflects the save instantly
  // — even when offline.
  const existing = safeRead(domain);
  safeWrite(domain, [optimistic, ...existing.filter((r) => r.evidenceId !== evidenceId)]);

  try {
    const body = (await fetchJson(`${API_BASE}/${encodeURIComponent(domain)}`, {
      method: 'POST',
      body: JSON.stringify(optimistic),
    })) as SavedRiskRun;
    if (body && typeof body === 'object' && typeof body.evidenceId === 'string') {
      // Reconcile cache with server-canonical record (may have a different
      // evidenceId or savedAt if the server reassigned them).
      const after = safeRead(domain).filter(
        (r) => r.evidenceId !== optimistic.evidenceId && r.evidenceId !== body.evidenceId,
      );
      safeWrite(domain, [body, ...after]);
      return body;
    }
  } catch {
    // Offline / API unreachable — keep the optimistic local record. The next
    // successful fetchRiskRunEvidence() call will reconcile if/when the
    // server sees this run (typically because the operator re-saved while
    // online), and the localStorage copy ensures the lender briefing
    // export still has the data even if the server lookup misses.
  }
  return optimistic;
}

export async function deleteRiskRunEvidence(domain: string, evidenceId: string): Promise<void> {
  const existing = safeRead(domain);
  safeWrite(
    domain,
    existing.filter((r) => r.evidenceId !== evidenceId),
  );
  try {
    await fetchJson(
      `${API_BASE}/${encodeURIComponent(domain)}/${encodeURIComponent(evidenceId)}`,
      { method: 'DELETE' },
    );
  } catch {
    /* offline — local cache already updated */
  }
}

export function useRiskRunEvidence(domain: string): SavedRiskRun[] {
  const [runs, setRuns] = useState<SavedRiskRun[]>(() => listRiskRunEvidence(domain));
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const refreshLocal = () => setRuns(listRiskRunEvidence(domain));
    refreshLocal();
    // Background fetch from the API to merge in runs that other browsers /
    // devices have saved.
    fetchRiskRunEvidence(domain)
      .then((merged) => {
        if (mounted.current) setRuns(merged);
      })
      .catch(() => {
        /* ignore — local cache already shown */
      });

    if (typeof window === 'undefined') return;
    const onCustom = (evt: Event) => {
      const detail = (evt as CustomEvent<{ domain?: string }>).detail;
      if (!detail?.domain || detail.domain === domain) refreshLocal();
    };
    const onStorage = (evt: StorageEvent) => {
      if (evt.key === storageKey(domain)) refreshLocal();
    };
    const onFocus = () => {
      fetchRiskRunEvidence(domain)
        .then((merged) => {
          if (mounted.current) setRuns(merged);
        })
        .catch(() => {
          /* ignore */
        });
    };
    window.addEventListener(READ_EVENT, onCustom);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener(READ_EVENT, onCustom);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, [domain]);
  return runs;
}

export function useRiskRunEvidenceMulti(domains: readonly string[]): SavedRiskRun[] {
  const _key = domains.join('|');
  const read = useCallback((): SavedRiskRun[] => {
    const all = domains.flatMap((d) => listRiskRunEvidence(d));
    return all.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domains.flatMap]);
  const [runs, setRuns] = useState<SavedRiskRun[]>(() => read());
  useEffect(() => {
    const refresh = () => setRuns(read());
    refresh();
    if (typeof window === 'undefined') return;
    const onCustom = (evt: Event) => {
      const detail = (evt as CustomEvent<{ domain?: string }>).detail;
      if (!detail?.domain || domains.includes(detail.domain)) refresh();
    };
    const onStorage = (evt: StorageEvent) => {
      if (evt.key && domains.some((d) => evt.key === storageKey(d))) refresh();
    };
    window.addEventListener(READ_EVENT, onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(READ_EVENT, onCustom);
      window.removeEventListener('storage', onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [read, domains.some, domains.includes]);
  return runs;
}

function formatValue(value: number, format?: string): string {
  if (!Number.isFinite(value)) return '—';
  if (format === 'currency') {
    const abs = Math.abs(value);
    if (abs >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  }
  if (format === 'percentage') return `${value.toFixed(1)}%`;
  if (format === 'years') return `${value.toFixed(1)}y`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function describeDistribution(d: unknown): string {
  if (!d || typeof d !== 'object') return '—';
  const dist = d as Record<string, unknown>;
  const type = dist.type as string | undefined;
  switch (type) {
    case 'normal':
      return `Normal(μ=${dist.mean}, σ=${dist.stdDev})`;
    case 'log_normal':
      return `LogNormal(μ=${dist.mean}, σ=${dist.stdDev})`;
    case 'uniform':
      return `Uniform(${dist.min} – ${dist.max})`;
    case 'triangular':
      return `Triangular(${dist.min}, mode=${dist.mode}, ${dist.max})`;
    case 'beta':
      return `Beta(α=${dist.alpha}, β=${dist.beta})`;
    case 'poisson':
      return `Poisson(λ=${dist.lambda})`;
    case 'constant':
      return `Constant(${dist.value})`;
    case 'custom':
      return `Custom`;
    default:
      return type ?? '—';
  }
}

interface SaveRiskRunButtonProps {
  domain: string;
  build: () => Omit<SavedRiskRun, 'evidenceId' | 'savedAt'> | null;
  disabled?: boolean;
  accentColor?: string;
  className?: string;
}

export function SaveRiskRunButton({
  domain,
  build,
  disabled,
  accentColor = '#7a99b8',
  className,
}: SaveRiskRunButtonProps) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const payload = build();
    if (!payload) return;
    const note =
      typeof window !== 'undefined'
        ? window.prompt('Optional note (cited on the evidence record):', '')
        : '';
    setSaving(true);
    try {
      const record = await saveRiskRunEvidence(domain, {
        ...payload,
        ...(note?.trim() ? { note: note.trim() } : {}),
      });
      setSavedId(record.evidenceId);
      window.setTimeout(() => setSavedId(null), 4000);
    } finally {
      setSaving(false);
    }
  }, [build, domain]);

  return (
    <button
      type="button"
      onClick={() => {
        void handleSave();
      }}
      disabled={disabled || saving}
      className={`flex items-center gap-1.5 text-[11px] font-medium rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50 ${className ?? ''}`}
      style={{
        background: `${accentColor}15`,
        color: accentColor,
        border: `1px solid ${accentColor}30`,
      }}
      aria-label="Save run as evidence"
      title="Save this Monte Carlo run as a cited proof envelope on the Decision Theater"
    >
      {savedId ? <ClipboardCheck className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
      {savedId ? `Saved ${savedId}` : saving ? 'Saving…' : 'Save run as evidence'}
    </button>
  );
}

interface RiskRunDetailModalProps {
  run: SavedRiskRun;
  accentColor?: string;
  onClose: () => void;
}

export function RiskRunDetailModal({
  run: open,
  accentColor = '#7a99b8',
  onClose,
}: RiskRunDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full max-h-full overflow-auto rounded-xl border p-5"
        style={{ background: '#0d1520', borderColor: 'rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[10px] font-mono mb-1" style={{ color: accentColor }}>
              {open.evidenceId}
            </div>
            <h3 className="text-sm font-semibold text-white">{open.scenarioTitle}</h3>
            <div className="text-[10px] mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {open.scenarioId}
              {open.scenarioVersion ? `@${open.scenarioVersion}` : ''} · {open.domain} ·{' '}
              {open.iterations.toLocaleString()} iter · {open.validIterations.toLocaleString()}{' '}
              valid · {open.durationMs.toFixed(0)}ms
            </div>
            <div
              className="text-[10px] mt-0.5 font-mono"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Saved {new Date(open.savedAt).toLocaleString()}
              {open.savedBy ? ` · ${open.savedBy}` : ''}
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {open.note && (
          <p className="text-[12px] mb-4 italic" style={{ color: 'rgba(255,255,255,0.6)' }}>
            “{open.note}”
          </p>
        )}

        <div className="mb-4">
          <h4
            className="text-[10px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Output Percentiles
          </h4>
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <table className="w-full text-[11px]">
              <thead
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}
              >
                <tr>
                  <th className="text-left px-2 py-1.5">Output</th>
                  <th className="text-right px-2 py-1.5">P5</th>
                  <th className="text-right px-2 py-1.5">P50</th>
                  <th className="text-right px-2 py-1.5">P95</th>
                  <th className="text-right px-2 py-1.5">Mean</th>
                  <th className="text-right px-2 py-1.5">σ</th>
                </tr>
              </thead>
              <tbody>
                {open.metrics.map((m) => (
                  <tr
                    key={m.id}
                    className="border-t"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <td className="px-2 py-1.5 text-white">{m.label}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-white/80">
                      {formatValue(m.p5, m.format)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-white">
                      {formatValue(m.p50, m.format)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-white/80">
                      {formatValue(m.p95, m.format)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-white/80">
                      {formatValue(m.mean, m.format)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-white/60">
                      {formatValue(m.stdDev, m.format)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-4">
          <h4
            className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            <Layers className="w-3 h-3" /> Top Sensitivities
          </h4>
          <ul className="space-y-1">
            {open.sensitivities.slice(0, 6).map((s) => (
              <li key={s.inputId} className="flex items-center gap-2 text-[11px]">
                <span className="flex-1 truncate text-white/70">{s.label}</span>
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, s.impact * 100))}%`,
                      background: accentColor,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-white">
                  {(s.impact * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4
            className="text-[10px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Input Distributions
          </h4>
          <ul className="space-y-1">
            {open.inputs.map((inp) => (
              <li key={inp.id} className="flex items-start gap-2 text-[11px]">
                <span className="w-44 truncate text-white/70">{inp.label}</span>
                <span className="font-mono text-white/80 break-all">
                  {describeDistribution(inp.distribution)}
                  {inp.unit ? ` ${inp.unit}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface RiskEvidenceListProps {
  domain: string;
  domainLabel?: string;
  accentColor?: string;
  emptyHint?: string;
  className?: string;
}

export function RiskEvidenceList({
  domain,
  domainLabel,
  accentColor = '#7a99b8',
  emptyHint,
  className,
}: RiskEvidenceListProps) {
  const runs = useRiskRunEvidence(domain);
  const [openId, setOpenId] = useState<string | null>(null);

  const open = useMemo(() => runs.find((r) => r.evidenceId === openId) ?? null, [runs, openId]);

  if (runs.length === 0) {
    return (
      <div
        className={`rounded-xl border p-4 ${className ?? ''}`}
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Sliders className="w-3.5 h-3.5" style={{ color: accentColor }} />
          <h4
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Cited Risk Simulations{domainLabel ? ` — ${domainLabel}` : ''}
          </h4>
        </div>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {emptyHint ??
            'No simulation runs cited yet. Use "Save run as evidence" on the Risk Simulation page to attach percentile bands and sensitivities to a decision.'}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 ${className ?? ''}`}
      style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sliders className="w-3.5 h-3.5" style={{ color: accentColor }} />
        <h4
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          Cited Risk Simulations{domainLabel ? ` — ${domainLabel}` : ''}
        </h4>
        <span className="text-[10px] font-mono ml-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {runs.length}
        </span>
      </div>
      <ul className="space-y-2">
        {runs.map((run) => {
          const primary = run.metrics[0];
          return (
            <li
              key={run.evidenceId}
              className="rounded-lg border p-3"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: `${accentColor}15`, color: accentColor }}
                    >
                      {run.evidenceId}
                    </span>
                    <span className="text-[11px] font-semibold text-white truncate">
                      {run.scenarioTitle}
                    </span>
                  </div>
                  <div
                    className="text-[10px] mt-1 font-mono"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    Scenario {run.scenarioId}
                    {run.scenarioVersion ? `@${run.scenarioVersion}` : ''} ·{' '}
                    {run.iterations.toLocaleString()} iter ·{' '}
                    {new Date(run.savedAt).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </div>
                  {primary && (
                    <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {primary.label} · P50 {formatValue(primary.p50, primary.format)} · P5–P95{' '}
                      {formatValue(primary.p5, primary.format)} →{' '}
                      {formatValue(primary.p95, primary.format)}
                    </div>
                  )}
                  {run.note && (
                    <div
                      className="text-[11px] mt-1 italic"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      “{run.note}”
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenId(run.evidenceId)}
                    className="text-[10px] px-2 py-1 rounded-md"
                    style={{
                      background: `${accentColor}15`,
                      color: accentColor,
                      border: `1px solid ${accentColor}30`,
                    }}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void deleteRiskRunEvidence(domain, run.evidenceId);
                    }}
                    className="text-[10px] p-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5"
                    aria-label="Delete cited run"
                    title="Delete cited run"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {open && (
        <RiskRunDetailModal run={open} accentColor={accentColor} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}

interface ScenarioCitedRiskRunsProps {
  /**
   * Optional scenarioId to filter cited risk runs. When omitted, all runs across the
   * given domains are listed (useful for live mode where a single canonical scenario
   * isn't pinned).
   */
  scenarioId?: string;
  /** Domains to scan (defaults to ["terra", "vessels"]). */
  domains?: readonly string[];
  /** Heading shown above the list. */
  title?: string;
  accentColor?: string;
  emptyHint?: string;
  className?: string;
}

export function ScenarioCitedRiskRuns({
  scenarioId,
  domains = ['terra', 'vessels'],
  title,
  accentColor = '#14b8a6',
  emptyHint,
  className,
}: ScenarioCitedRiskRunsProps) {
  const allRuns = useRiskRunEvidenceMulti(domains);
  const runs = useMemo(
    () => (scenarioId ? allRuns.filter((r) => r.scenarioId === scenarioId) : allRuns),
    [allRuns, scenarioId],
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const open = useMemo(() => runs.find((r) => r.evidenceId === openId) ?? null, [runs, openId]);

  const heading =
    title ?? (scenarioId ? `Cited Risk Simulations · ${scenarioId}` : 'Cited Risk Simulations');

  return (
    <div
      className={`rounded-xl border p-4 ${className ?? ''}`}
      style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
      data-testid="dt-cited-risk-runs"
      data-scenario-id={scenarioId}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sliders className="w-3.5 h-3.5" style={{ color: accentColor }} />
        <h4
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          {heading}
        </h4>
        <span className="text-[10px] font-mono ml-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {runs.length}
        </span>
      </div>

      {runs.length === 0 ? (
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {emptyHint ??
            (scenarioId
              ? `No simulation runs cited for scenario ${scenarioId}. Save a run from the Terra or Vessels Risk Simulation page to attach percentile bands and sensitivities to this proof envelope.`
              : 'No simulation runs cited yet across Terra or Vessels.')}
        </p>
      ) : (
        <ul className="space-y-2">
          {runs.map((run) => {
            const primary = run.metrics[0];
            return (
              <li
                key={`${run.domain}-${run.evidenceId}`}
                className="rounded-lg border p-3"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: `${accentColor}15`, color: accentColor }}
                      >
                        {run.evidenceId}
                      </span>
                      <span
                        className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: 'rgba(255,255,255,0.55)',
                        }}
                      >
                        {run.domain}
                      </span>
                      <span className="text-[11px] font-semibold text-white truncate">
                        {run.scenarioTitle}
                      </span>
                    </div>
                    <div
                      className="text-[10px] mt-1 font-mono"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      Scenario {run.scenarioId}
                      {run.scenarioVersion ? `@${run.scenarioVersion}` : ''} ·{' '}
                      {run.iterations.toLocaleString()} iter ·{' '}
                      {new Date(run.savedAt).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </div>
                    {primary && (
                      <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        {primary.label} · P50 {formatValue(primary.p50, primary.format)} · P5–P95{' '}
                        {formatValue(primary.p5, primary.format)} →{' '}
                        {formatValue(primary.p95, primary.format)}
                      </div>
                    )}
                    {run.note && (
                      <div
                        className="text-[11px] mt-1 italic"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        “{run.note}”
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setOpenId(run.evidenceId)}
                      className="text-[10px] px-2 py-1 rounded-md"
                      style={{
                        background: `${accentColor}15`,
                        color: accentColor,
                        border: `1px solid ${accentColor}30`,
                      }}
                      data-testid={`dt-cited-risk-run-view-${run.evidenceId}`}
                    >
                      View
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <RiskRunDetailModal run={open} accentColor={accentColor} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
