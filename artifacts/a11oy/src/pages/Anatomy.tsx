/**
 * A11oy /anatomy — Ouroboros 7-chakra anatomy viewer (read-only).
 *
 * Renders, in canonical root→crown order, one section per chakra:
 *   – PDF embedded (vendored under /anatomy/<name>.pdf)
 *   – PNG fallback (vendored under /anatomy/<name>.png)
 *   – LinkedIn explainer text from anatomy-citations.json
 *   – Footer with the canonical DOI for that figure
 *
 * Drift detection (real, not cosmetic):
 *   – On load the page fetches every expected file from VENDOR.json,
 *     recomputes the bundle sha256 in-browser using
 *         sha256( sorted (filename || NUL || bytes || NUL) )
 *     and compares the result to `VENDOR.json::upstream_sha`.
 *   – If upstream_sha is all-zero, the bundle is "unvendored" and the
 *     viewer says so explicitly.
 *   – If the recomputed hash differs, the viewer shows a "DRIFT" banner
 *     and refuses to claim parity with the upstream publication.
 *
 * The bundle itself is owned upstream and is never modified or
 * regenerated here.
 */
import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/layout';
import { Card, PageHeader, SectionTitle } from '../components/ui';
import citations from '../data/anatomy-citations.json';
import agentAnatomy from '../data/agent-anatomy.json';
import chakraProse from '../data/chakra-prose.json';

interface AgentFigure {
  slug: string;
  order: number;
  title: string;
  description: string;
  illustrates: string;
  pdf: string;
  png: string;
}

interface ChakraProseEntry {
  leader: string;
  result: string;
}

const CHAKRA_PROSE_KEYS: Record<string, string> = {
  root: 'chakra_1_root',
  sacral: 'chakra_2_sacral',
  solar: 'chakra_3_solar',
  heart: 'chakra_4_heart',
  throat: 'chakra_5_throat',
  third_eye: 'chakra_6_third_eye',
  crown: 'chakra_7_crown',
};

interface ChakraCitation {
  name: string;
  order: number;
  title: string;
  doi: string;
  pdf: string;
  png: string;
  linkedin: string;
}

interface VendorMeta {
  upstream_sha: string;
  vendored_at: string | null;
  vendored_by: string | null;
  bundle_kind: string;
  expected_files: string[];
  drift_detection: {
    algorithm: string;
    expected_hash: string;
    note: string;
  };
}

type IntegrityState =
  | { kind: 'checking' }
  | { kind: 'unvendored'; missing: string[] }
  | { kind: 'drift'; computed: string; expected: string; missing: string[] }
  | { kind: 'ok'; computed: string };

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const GOLD = '#c9b787';
const ZERO_SHA = '0'.repeat(64);

function assetUrl(p: string): string {
  return `${BASE}${p}`;
}

async function fetchBytes(url: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

function toHex(buf: ArrayBuffer): string {
  const arr = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < arr.length; i++) out += arr[i]!.toString(16).padStart(2, '0');
  return out;
}

async function computeBundleHash(
  files: string[],
): Promise<{ hash: string; missing: string[] }> {
  // Concatenate sorted (filename || NUL || bytes || NUL); sha256 the whole thing.
  const ordered = [...files].sort();
  const parts: Uint8Array[] = [];
  const missing: string[] = [];
  const NUL = new Uint8Array([0]);
  const enc = new TextEncoder();
  for (const fname of ordered) {
    const bytes = await fetchBytes(assetUrl(`/anatomy/${fname}`));
    if (!bytes) {
      missing.push(fname);
      continue;
    }
    parts.push(enc.encode(fname));
    parts.push(NUL);
    parts.push(bytes);
    parts.push(NUL);
  }
  let totalLen = 0;
  for (const p of parts) totalLen += p.length;
  const buf = new Uint8Array(totalLen);
  let off = 0;
  for (const p of parts) {
    buf.set(p, off);
    off += p.length;
  }
  if (!crypto?.subtle) {
    // Without SubtleCrypto we cannot prove parity — return a sentinel that
    // never matches a real sha256, so the drift banner stays up.
    return { hash: 'subtle-crypto-unavailable', missing };
  }
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return { hash: toHex(digest), missing };
}

async function probeAsset(url: string): Promise<boolean> {
  // Some static hosts / proxies do not implement HEAD reliably; fall back
  // to a bytes-range GET so a missing asset is reported honestly.
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (head.ok) return true;
    if (head.status !== 405 && head.status !== 501) return false;
  } catch {
    // fall through to GET probe
  }
  try {
    const get = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
    return get.ok;
  } catch {
    return false;
  }
}

// ---------- LIVE AMARU OPERATIONAL STATE ----------
// Pulled from the read-only Amaru sidecar proxy on the api-server
// (artifacts/api-server/src/routes/amaru-proxy.ts → services/amaru, port 6810).
// Only the auth-allowlisted endpoints are used so the page works without a
// session: /state, /tripwires, /overwatch/snapshot, /scheduler/wiring.

type Fetched<T> =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; status?: number }
  | { kind: 'ok'; data: T };

function useAmaru<T>(path: string, intervalMs = 15_000): Fetched<T> {
  const [state, setState] = useState<Fetched<T>>({ kind: 'loading' });
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const r = await fetch(path, { credentials: 'include', cache: 'no-store' });
        const text = await r.text();
        if (!r.ok) {
          if (!cancelled) setState({ kind: 'error', status: r.status, message: text.slice(0, 240) });
          return;
        }
        const data = JSON.parse(text) as T;
        if (!cancelled) setState({ kind: 'ok', data });
      } catch (err) {
        if (!cancelled) setState({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    }
    void tick();
    const id = window.setInterval(tick, intervalMs);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [path, intervalMs]);
  return state;
}

interface TripwireItem { id: string; title: string; status: 'pass' | 'warn' | 'trip' | string; detail?: string }
interface TripwiresPayload { summary: { pass: number; warn: number; trip: number; total: number }; tripwires: TripwireItem[] }
interface StatePayload {
  chakras?: string[];
  last_evaluation?: Record<string, unknown>;
  scheduler_ticks?: number;
  receipts?: number;
  bus?: { publishes?: number; failures?: number };
}
interface OverwatchInvariant { id: string; title: string; status: string; value: number | null; threshold: number | null; detail: string }
interface OverwatchPayload { panel_version: string; thesis_kernel_hash: string; thesis_brain_hash: string; read_only: boolean; invariants: OverwatchInvariant[] }
interface WiringEdge { src: string; dst: string; role: string }
interface WiringPayload { chakras: string[]; edges: WiringEdge[]; shape: string }

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'pass' ? '#4ea672'
      : status === 'warn' ? '#d4a23a'
      : status === 'trip' ? '#c04848'
      : status === 'reserved' ? '#6a6a6a'
      : '#8a8a8a';
  return (
    <span
      aria-label={status}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: 999,
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}66`,
      }}
    />
  );
}

function LiveOpsPanel() {
  const tw = useAmaru<TripwiresPayload>('/api/amaru/tripwires', 10_000);
  const st = useAmaru<StatePayload>('/api/amaru/state', 10_000);
  const ow = useAmaru<OverwatchPayload>('/api/amaru/overwatch/snapshot', 15_000);
  const wi = useAmaru<WiringPayload>('/api/amaru/scheduler/wiring', 30_000);

  return (
    <Card className="mb-6">
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: GOLD }}>
          Live operational state — services/amaru (read-only)
        </div>
        <div className="text-[10px] font-mono" style={{ color: '#666' }}>
          polling /api/amaru/{`{state,tripwires,overwatch/snapshot,scheduler/wiring}`}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="border rounded p-3" style={{ borderColor: 'rgba(201,183,135,0.18)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="text-[10px] font-mono uppercase" style={{ color: '#888' }}>chakras registered</div>
          <div className="text-2xl font-mono" style={{ color: GOLD }}>
            {st.kind === 'ok' ? (st.data.chakras?.length ?? 0) : '—'}
            <span className="text-xs ml-1" style={{ color: '#666' }}>/ 7</span>
          </div>
        </div>
        <div className="border rounded p-3" style={{ borderColor: 'rgba(201,183,135,0.18)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="text-[10px] font-mono uppercase" style={{ color: '#888' }}>receipts (append-only)</div>
          <div className="text-2xl font-mono" style={{ color: GOLD }}>
            {st.kind === 'ok' ? (st.data.receipts ?? 0) : '—'}
          </div>
        </div>
        <div className="border rounded p-3" style={{ borderColor: 'rgba(201,183,135,0.18)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="text-[10px] font-mono uppercase" style={{ color: '#888' }}>scheduler ticks</div>
          <div className="text-2xl font-mono" style={{ color: GOLD }}>
            {st.kind === 'ok' ? (st.data.scheduler_ticks ?? 0) : '—'}
          </div>
        </div>
        <div className="border rounded p-3" style={{ borderColor: 'rgba(201,183,135,0.18)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="text-[10px] font-mono uppercase" style={{ color: '#888' }}>bus publishes / failures</div>
          <div className="text-2xl font-mono" style={{ color: GOLD }}>
            {st.kind === 'ok' ? `${st.data.bus?.publishes ?? 0} / ${st.data.bus?.failures ?? 0}` : '—'}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <div className="text-[10px] font-mono uppercase mb-2" style={{ color: '#888' }}>
            HUKLLA tripwires —{' '}
            {tw.kind === 'ok'
              ? `${tw.data.summary.pass} pass · ${tw.data.summary.warn} warn · ${tw.data.summary.trip} trip / ${tw.data.summary.total}`
              : tw.kind === 'loading' ? 'loading…' : `unreachable${tw.status ? ` (${tw.status})` : ''}`}
          </div>
          <div className="space-y-1">
            {tw.kind === 'ok' && tw.data.tripwires.map((t) => (
              <div key={t.id} className="flex items-center gap-2 font-mono text-[11px]" style={{ color: '#bbb' }}>
                <StatusDot status={t.status} />
                <span style={{ color: '#888' }}>{t.id}</span>
                <span style={{ color: '#ddd' }}>{t.title}</span>
                <span style={{ color: '#666', marginLeft: 'auto' }}>{t.detail}</span>
              </div>
            ))}
            {tw.kind === 'error' && <div className="text-[11px] font-mono text-red-400">amaru sidecar unreachable: {tw.message || 'no detail'}</div>}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase mb-2" style={{ color: '#888' }}>
            R0513 OVERWATCH —{' '}
            {ow.kind === 'ok'
              ? `kernel ${ow.data.thesis_kernel_hash} · brain ${ow.data.thesis_brain_hash} · ${ow.data.read_only ? 'read-only' : 'mutable'}`
              : ow.kind === 'loading' ? 'loading…' : `unreachable${ow.status ? ` (${ow.status})` : ''}`}
          </div>
          <div className="space-y-1">
            {ow.kind === 'ok' && ow.data.invariants.map((iv) => (
              <div key={iv.id} className="flex items-center gap-2 font-mono text-[11px]" style={{ color: '#bbb' }}>
                <StatusDot status={iv.status} />
                <span style={{ color: '#888' }}>{iv.id}</span>
                <span style={{ color: '#ddd' }}>{iv.title}</span>
                <span style={{ color: '#666', marginLeft: 'auto' }}>
                  {iv.value !== null ? `${iv.value}` : '—'}
                  {iv.threshold !== null ? ` / ${iv.threshold}` : ''}
                </span>
              </div>
            ))}
            {ow.kind === 'error' && <div className="text-[11px] font-mono text-red-400">amaru sidecar unreachable: {ow.message || 'no detail'}</div>}
          </div>
        </div>
      </div>

      {wi.kind === 'ok' && (
        <div className="mt-5">
          <div className="text-[10px] font-mono uppercase mb-2" style={{ color: '#888' }}>
            Chakana wiring — shape: {wi.data.shape}
          </div>
          <div className="font-mono text-[11px] flex flex-wrap gap-x-2 gap-y-1" style={{ color: '#ddd' }}>
            {wi.data.edges.map((e, i) => (
              <span key={`${e.src}-${e.dst}-${i}`}>
                {e.src}
                <span style={{ color: e.role === 'ouroboros' ? GOLD : '#666' }}>
                  {e.role === 'ouroboros' ? ' ↻ ' : ' → '}
                </span>
                {e.dst}
                {i < wi.data.edges.length - 1 ? <span style={{ color: '#333' }}>{'  ·  '}</span> : null}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function AnatomyFigure({ citation }: { citation: ChakraCitation }) {
  const [pdfOk, setPdfOk] = useState<boolean | null>(null);
  const [pngOk, setPngOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    probeAsset(assetUrl(citation.pdf)).then((ok) => !cancelled && setPdfOk(ok));
    probeAsset(assetUrl(citation.png)).then((ok) => !cancelled && setPngOk(ok));
    return () => {
      cancelled = true;
    };
  }, [citation.pdf, citation.png]);

  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-a11oy-border)' }}>
      {pdfOk ? (
        <object
          data={assetUrl(citation.pdf)}
          type="application/pdf"
          width="100%"
          height={520}
          aria-label={`${citation.title} — PDF figure`}
        >
          {pngOk ? (
            <img src={assetUrl(citation.png)} alt={citation.title} style={{ width: '100%', display: 'block' }} />
          ) : (
            <div className="p-6 text-xs font-mono" style={{ color: '#8a8a8a' }}>
              Figure not yet vendored. The PDF and PNG land here when the
              upstream bundle is published and pinned (see VENDOR.json).
            </div>
          )}
        </object>
      ) : pngOk ? (
        <img src={assetUrl(citation.png)} alt={citation.title} style={{ width: '100%', display: 'block' }} />
      ) : (
        <div
          className="p-6 text-xs font-mono flex items-center justify-center"
          style={{ color: '#8a8a8a', minHeight: 200, backgroundColor: 'rgba(201,183,135,0.04)' }}
        >
          Figure not yet vendored — read the citation below.
        </div>
      )}
    </div>
  );
}

function ChakraProsePanel({ chakraName }: { chakraName: string }) {
  const [open, setOpen] = useState(false);
  const key = CHAKRA_PROSE_KEYS[chakraName];
  const entry = key ? (chakraProse as Record<string, ChakraProseEntry>)[key] : undefined;
  if (!entry) return null;
  return (
    <Card className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[10px] font-mono uppercase flex items-center gap-2"
        style={{ color: GOLD }}
      >
        <span>{open ? '▾' : '▸'}</span>
        Upstream chakra prose — leader.md + result.md
      </button>
      {open && (
        <div className="mt-3 grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase mb-1" style={{ color: '#8a8a8a' }}>
              leader.md
            </div>
            <pre
              className="text-[11px] whitespace-pre-wrap font-mono"
              style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.55 }}
            >
              {entry.leader}
            </pre>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase mb-1" style={{ color: '#8a8a8a' }}>
              result.md
            </div>
            <pre
              className="text-[11px] whitespace-pre-wrap font-mono"
              style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.55 }}
            >
              {entry.result}
            </pre>
          </div>
        </div>
      )}
    </Card>
  );
}

function AgentAnatomyFigure({ figure }: { figure: AgentFigure }) {
  const [pdfOk, setPdfOk] = useState<boolean | null>(null);
  const [pngOk, setPngOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    probeAsset(assetUrl(figure.pdf)).then((ok) => !cancelled && setPdfOk(ok));
    probeAsset(assetUrl(figure.png)).then((ok) => !cancelled && setPngOk(ok));
    return () => {
      cancelled = true;
    };
  }, [figure.pdf, figure.png]);

  return (
    <section id={`agent-${figure.slug}`} className="scroll-mt-24">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-xs font-mono" style={{ color: GOLD }}>{`0${figure.order}`.slice(-2)}</span>
        <h3 className="text-lg font-display font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>
          {figure.title}
        </h3>
      </div>
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-a11oy-border)' }}>
        {pdfOk ? (
          <object data={assetUrl(figure.pdf)} type="application/pdf" width="100%" height={520} aria-label={`${figure.title} — PDF`}>
            {pngOk ? (
              <img src={assetUrl(figure.png)} alt={figure.title} style={{ width: '100%', display: 'block' }} />
            ) : (
              <div className="p-6 text-xs font-mono" style={{ color: '#8a8a8a' }}>Figure unavailable.</div>
            )}
          </object>
        ) : pngOk ? (
          <img src={assetUrl(figure.png)} alt={figure.title} style={{ width: '100%', display: 'block' }} />
        ) : (
          <div className="p-6 text-xs font-mono" style={{ color: '#8a8a8a' }}>Figure unavailable.</div>
        )}
      </div>
      <Card className="mt-3">
        <p className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
          {figure.description}
        </p>
        <div className="text-[11px] font-mono mt-2" style={{ color: '#8a8a8a' }}>
          Illustrates: {figure.illustrates}
        </div>
      </Card>
      <div className="mt-2 text-[11px] font-mono flex flex-wrap items-center gap-3" style={{ color: '#8a8a8a' }}>
        <a href={assetUrl(figure.pdf)} target="_blank" rel="noreferrer" style={{ color: GOLD }}>PDF</a>
        <span>·</span>
        <a href={assetUrl(figure.png)} target="_blank" rel="noreferrer" style={{ color: GOLD }}>PNG</a>
      </div>
    </section>
  );
}

export default function AnatomyPage() {
  const [vendor, setVendor] = useState<VendorMeta | null>(null);
  const [integrity, setIntegrity] = useState<IntegrityState>({ kind: 'checking' });
  const chakras = useMemo(
    () => [...(citations.chakras as ChakraCitation[])].sort((a, b) => a.order - b.order),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(assetUrl('/anatomy/VENDOR.json'), { cache: 'no-store' });
        if (!r.ok) throw new Error('VENDOR.json missing');
        const v = (await r.json()) as VendorMeta;
        if (cancelled) return;
        setVendor(v);

        const { hash, missing } = await computeBundleHash(v.expected_files);
        if (cancelled) return;

        const expected = v.upstream_sha;
        if (expected === ZERO_SHA) {
          setIntegrity({ kind: 'unvendored', missing });
        } else if (hash !== expected) {
          setIntegrity({ kind: 'drift', computed: hash, expected, missing });
        } else {
          setIntegrity({ kind: 'ok', computed: hash });
        }
      } catch {
        if (!cancelled) setIntegrity({ kind: 'unvendored', missing: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout>
      <PageHeader
        label="OUROBOROS ANATOMY"
        title="7-chakra anatomy — read-only viewer"
        subtitle="Vendored mirror of the upstream published anatomy bundle. Root → crown. No annotations, no comments, no regeneration."
        status={integrity.kind === 'ok' ? 'LIVE' : integrity.kind === 'drift' ? 'WARN' : 'ROADMAP'}
      />

      {integrity.kind === 'unvendored' && (
        <div
          className="mb-6 rounded-lg border p-4 text-xs font-mono"
          style={{
            backgroundColor: 'rgba(245,245,245,0.04)',
            borderColor: 'rgba(201,183,135,0.3)',
            color: '#c9b787',
          }}
        >
          <div className="font-semibold mb-1">Bundle is UNVENDORED.</div>
          <div style={{ color: '#8a8a8a' }}>
            The 14 anatomy binaries from the upstream published Ouroboros
            thesis have not been pinned in this repo yet. The viewer below
            shows graceful fallbacks. Drop the upstream binaries into{' '}
            <code>artifacts/a11oy/public/anatomy/</code> and pin{' '}
            <code>VENDOR.json::upstream_sha</code> to clear this banner.
            {integrity.missing.length > 0 && (
              <>
                {' '}
                Missing: {integrity.missing.length} of{' '}
                {vendor?.expected_files.length ?? '?'} files.
              </>
            )}
          </div>
        </div>
      )}

      {integrity.kind === 'drift' && (
        <div
          className="mb-6 rounded-lg border p-4 text-xs font-mono"
          style={{
            backgroundColor: 'rgba(245,80,80,0.06)',
            borderColor: 'rgba(245,80,80,0.3)',
            color: '#ff8a8a',
          }}
        >
          <div className="font-semibold mb-1">DRIFT — vendored bundle does not match upstream pin.</div>
          <div style={{ color: '#8a8a8a' }}>
            Expected sha256: <code>{integrity.expected.slice(0, 16)}…</code>
            <br />
            Computed sha256: <code>{integrity.computed.slice(0, 16)}…</code>
            {integrity.missing.length > 0 && (
              <>
                <br />Missing files ({integrity.missing.length}):{' '}
                <code>{integrity.missing.join(', ')}</code>
              </>
            )}
            <br />
            Re-vendor from the upstream publication and re-pin{' '}
            <code>VENDOR.json::upstream_sha</code> to clear this banner.
          </div>
        </div>
      )}

      {integrity.kind === 'ok' && (
        <div
          className="mb-6 rounded-lg border p-3 text-xs font-mono"
          style={{
            backgroundColor: 'rgba(201,183,135,0.08)',
            borderColor: 'rgba(201,183,135,0.3)',
            color: GOLD,
          }}
        >
          Bundle integrity verified — sha256 <code>{integrity.computed.slice(0, 16)}…</code> matches upstream pin.
        </div>
      )}

      <Card className="mb-8">
        <div className="grid sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <div className="text-[10px] uppercase mb-1" style={{ color: '#8a8a8a' }}>Bundle source</div>
            <div style={{ color: '#e6e6e6' }}>upstream Ouroboros thesis</div>
          </div>
          <div>
            <div className="text-[10px] uppercase mb-1" style={{ color: '#8a8a8a' }}>Upstream sha256</div>
            <div style={{ color: '#e6e6e6' }}>
              {vendor?.upstream_sha === ZERO_SHA
                ? 'unpinned'
                : vendor?.upstream_sha
                  ? `${vendor.upstream_sha.slice(0, 12)}…`
                  : '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase mb-1" style={{ color: '#8a8a8a' }}>Vendored at</div>
            <div style={{ color: '#e6e6e6' }}>{vendor?.vendored_at ?? '—'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase mb-1" style={{ color: '#8a8a8a' }}>Bundle kind</div>
            <div style={{ color: '#e6e6e6' }}>{vendor?.bundle_kind ?? '—'}</div>
          </div>
        </div>
        <div className="text-[11px] mt-3" style={{ color: '#8a8a8a' }}>
          Policy: read-only mirror. The bundle is owned upstream; regeneration
          and edits happen there, never here.
        </div>
      </Card>

      <LiveOpsPanel />

      <SectionTitle>Sections (root → crown)</SectionTitle>
      <nav className="flex flex-wrap gap-2 mb-8">
        {chakras.map((c) => (
          <a
            key={c.name}
            href={`#anatomy-${c.name}`}
            className="text-xs font-mono px-3 py-1 rounded border"
            style={{
              borderColor: 'rgba(201,183,135,0.25)',
              color: GOLD,
              backgroundColor: 'rgba(201,183,135,0.06)',
            }}
          >
            {c.order}. {c.title.split(' — ')[0]}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-10">
        {chakras.map((c) => (
          <section key={c.name} id={`anatomy-${c.name}`} className="scroll-mt-24">
            <div className="mb-4 flex items-baseline gap-3 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: GOLD }}>
                Chakra {c.order} · {c.name}
              </span>
              <h3 className="text-lg font-medium" style={{ color: 'var(--color-a11oy-text)' }}>
                {c.title}
              </h3>
            </div>

            <details className="mb-4">
              <summary
                className="text-[10px] font-mono uppercase cursor-pointer select-none"
                style={{ color: '#8a8a8a', letterSpacing: '0.2em' }}
              >
                Show vendored schematic (PDF / PNG)
              </summary>
              <div className="mt-3">
                <AnatomyFigure citation={c} />
              </div>
            </details>

            <Card className="mt-4">
              <div className="text-[10px] font-mono uppercase mb-2" style={{ color: '#8a8a8a' }}>
                LinkedIn explainer
              </div>
              <p className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
                {c.linkedin}
              </p>
            </Card>

            <ChakraProsePanel chakraName={c.name} />

            <div
              className="mt-3 text-[11px] font-mono flex flex-wrap items-center gap-3"
              style={{ color: '#8a8a8a' }}
            >
              <span>Cite:</span>
              <a
                href={`https://doi.org/${c.doi}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: GOLD, textDecoration: 'underline' }}
              >
                doi:{c.doi}
              </a>
              <span>·</span>
              <a href={assetUrl(c.pdf)} target="_blank" rel="noreferrer" style={{ color: GOLD }}>
                PDF
              </a>
              <span>·</span>
              <a href={assetUrl(c.png)} target="_blank" rel="noreferrer" style={{ color: GOLD }}>
                PNG
              </a>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16">
        <SectionTitle>Companion bundle — SZL Agent Anatomy (8 figures)</SectionTitle>
        <p className="text-sm mb-4" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
          Vendored from <a href="https://github.com/szl-holdings/ouroboros-thesis" target="_blank" rel="noreferrer" style={{ color: GOLD }}>szl-holdings/ouroboros-thesis</a>
          {' '}— <code>docs/anatomy/figures/</code>. Author: Lutar, Stephen P. · SZL Holdings · CC-BY-4.0.
          Concept DOI:{' '}
          <a href={`https://doi.org/${(agentAnatomy as { concept_doi: string }).concept_doi}`} target="_blank" rel="noreferrer" style={{ color: GOLD }}>
            doi:{(agentAnatomy as { concept_doi: string }).concept_doi}
          </a>.
        </p>
        <nav className="flex flex-wrap gap-2 mb-8">
          {((agentAnatomy as { figures: AgentFigure[] }).figures).map((f) => (
            <a
              key={f.slug}
              href={`#agent-${f.slug}`}
              className="text-xs font-mono px-3 py-1 rounded border"
              style={{
                borderColor: 'rgba(201,183,135,0.25)',
                color: GOLD,
                backgroundColor: 'rgba(201,183,135,0.06)',
              }}
            >
              {f.order}. {f.title.split(' — ')[0]}
            </a>
          ))}
        </nav>
        <div className="flex flex-col gap-10">
          {((agentAnatomy as { figures: AgentFigure[] }).figures).map((f) => (
            <AgentAnatomyFigure key={f.slug} figure={f} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
