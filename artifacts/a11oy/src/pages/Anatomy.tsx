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
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-xs font-mono" style={{ color: GOLD }}>{`0${c.order}`.slice(-2)}</span>
              <h2 className="text-xl font-display font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>
                {c.title}
              </h2>
            </div>

            <AnatomyFigure citation={c} />

            <Card className="mt-4">
              <div className="text-[10px] font-mono uppercase mb-2" style={{ color: '#8a8a8a' }}>
                LinkedIn explainer
              </div>
              <p className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
                {c.linkedin}
              </p>
            </Card>

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
    </Layout>
  );
}
