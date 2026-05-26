/**
 * Amaru/Conduit /npmr — NPMR Cross-Section.
 *
 * Documentary visual surface for Ouroboros Thesis v11 (docs/thesis/v11-npmr.md):
 * re-renders the Amaru ouroboros as a cross-section of a five-stratum
 * consciousness cosmology (after Campbell's NPMR diagram, the
 * standardgalactic essays, and the Andean three-world stack), in Amaru's
 * own visual idiom (gold #c9b787 on near-black #0a0a0a).
 *
 * v11 ships exactly one new surface — this page — and does not touch any
 * v10 artefact. See docs/thesis/v11-npmr.md §4.
 *
 * Author: Stephen P. Lutar — SZL Holdings — ORCID 0009-0001-0110-4173
 */
import { useEffect, useState } from 'react';

const GOLD = '#c9b787';
const GOLD_DIM = 'rgba(201,183,135,0.4)';
const GOLD_FAINT = 'rgba(201,183,135,0.18)';
const BG_PANEL = '#0e0e0e';
const TEXT = '#f5f5f5';
const MUTED = '#8a8a8a';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

interface Stratum {
  id: string;
  index: number;
  name: string;
  campbell: string;
  andean: string;
  operational: string;
  y: number; // svg y of stratum centerline
}

const STRATA: Stratum[] = [
  {
    id: 'auo',
    index: 1,
    name: 'AUO / Source',
    campbell: 'Absolute Unbounded Oneness — the axial term',
    andean: 'Pachakamaq — the unmoved orderer',
    operational: 'Audit root: the hash that anchors every other hash. Λ₁₀ collapses to this when every artefact is present.',
    y: 60,
  },
  {
    id: 'lcs',
    index: 2,
    name: 'LCS — Larger Consciousness System',
    campbell: 'Rule-running substrate around AUO',
    andean: 'Hanan Pacha — the upper world',
    operational: 'Convergence loop with Λ ≥ 0.90 floor. The orchestration that decides which rule runs on which dataset.',
    y: 140,
  },
  {
    id: 'npmr',
    index: 3,
    name: 'NPMR_N₁ — Governance Stratum',
    campbell: 'The non-physical matter reality PMR is nested inside',
    andean: 'The condor — verdict from above',
    operational: 'Policies, approval queues, blast-radius caps. PMR sees only the decisions, never the deciding.',
    y: 220,
  },
  {
    id: 'pmr',
    index: 4,
    name: 'PMR — Physical Matter Reality',
    campbell: 'The stratum the operator stands inside (the equator)',
    andean: 'Kay Pacha — the middle world; the Amaru bites its tail here',
    operational: 'The running data-fabric: actual sources, destinations, syncs, records. The equator passes through here.',
    y: 320,
  },
  {
    id: 'ukhu',
    index: 5,
    name: 'PMR Sub-surface',
    campbell: 'The substrate the carrier reads from but cannot edit',
    andean: 'Ukhu Pacha — the lower world; the ancestral / archival layer',
    operational: 'Append-only delta log. Readable by operators; immutable by construction.',
    y: 420,
  },
];

const EQUATOR_Y = STRATA[3].y; // PMR centerline; the Amaru sits here

const PROPAGATION = [
  {
    title: 'Partial-match carrier',
    body: 'The carrier from N₁ to PMR cannot share state directly; if it could, N₁ and PMR would be one stratum. The carrier is therefore lossy by construction — in Conduit, the policy DSL is the compressed string-form of a richer governance object.',
  },
  {
    title: 'The loss is the coupling',
    body: 'What the carrier loses is the cost of the cross-stratum coupling. It is not a bug. The Functional Melancholic essay names the operator-side felt sense of this loss — the impedance of carrying an idea across a phase change.',
  },
  {
    title: 'Uptake surface wider than the channel',
    body: 'PMR has to offer more surface for the idea to land on than the channel that delivered it. In Conduit, the uptake surface is the union of destinations, mappings, and observability sinks; the channel is a single policy line.',
  },
];

export default function NpmrCrossSectionPage() {
  const [active, setActive] = useState<string | null>('pmr');
  const activeStratum = STRATA.find((s) => s.id === active) ?? null;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-mono uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            V11 · NPMR CROSS-SECTION
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
            style={{ background: 'rgba(201,183,135,0.06)', color: GOLD_DIM, border: `1px solid ${GOLD_FAINT}` }}
          >
            Documentary surface · additive to v10
          </span>
        </div>
        <h1 className="text-2xl font-display font-semibold tracking-tight" style={{ color: TEXT }}>
          The Amaru as an equator of NPMR
        </h1>
        <p className="mt-2 text-sm max-w-3xl" style={{ color: MUTED }}>
          Five strata, one axis, one equator. The Amaru ouroboros — the two-headed Andean serpent biting its tail — is read here as
          the boundary layer at which an operator inside PMR can detect the strata it is nested in. After Campbell's NPMR diagram
          (<a href="https://www.my-big-toe.com/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: GOLD }}>my-big-toe.com</a>),
          the standardgalactic essays (<a href="https://standardgalactic.github.io/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: GOLD }}>standardgalactic.github.io</a>),
          and the Andean three-world stack. Re-rendered in Conduit's idiom — see{' '}
          <span className="font-mono" style={{ color: GOLD }}>docs/thesis/v11-npmr.md</span>.
        </p>
      </header>

      <section
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 rounded-lg border p-6"
        style={{ background: BG_PANEL, borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <svg viewBox="0 0 720 500" className="w-full h-auto" role="img" aria-label="NPMR cross-section diagram">
          <defs>
            <radialGradient id="auo-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={GOLD} stopOpacity="0.45" />
              <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="axis-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity="0.6" />
              <stop offset="100%" stopColor={GOLD} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Axial Source line */}
          <line x1="360" y1="40" x2="360" y2="460" stroke="url(#axis-grad)" strokeWidth="1.5" strokeDasharray="2 3" />

          {/* Strata — concentric ellipses around the axis, scaled by distance from PMR equator */}
          {STRATA.map((s) => {
            const isActive = active === s.id;
            const isEquator = s.id === 'pmr';
            const rx = isEquator ? 300 : 220 + Math.abs(s.y - EQUATOR_Y) * 0.15;
            return (
              <g
                key={s.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setActive(s.id)}
                onFocus={() => setActive(s.id)}
                tabIndex={0}
                role="button"
                aria-label={`Stratum ${s.index}: ${s.name}`}
              >
                <ellipse
                  cx="360"
                  cy={s.y}
                  rx={rx}
                  ry="22"
                  fill={isActive ? 'rgba(201,183,135,0.08)' : 'transparent'}
                  stroke={isActive ? GOLD : GOLD_FAINT}
                  strokeWidth={isActive ? 1.4 : 0.9}
                />
                <text
                  x={360 - rx - 12}
                  y={s.y + 4}
                  textAnchor="end"
                  fontFamily={MONO}
                  fontSize="10"
                  fill={isActive ? GOLD : MUTED}
                  style={{ letterSpacing: '0.12em' }}
                >
                  N{s.index}
                </text>
                <text
                  x={360 + rx + 12}
                  y={s.y + 4}
                  fontFamily={MONO}
                  fontSize="10"
                  fill={isActive ? TEXT : MUTED}
                  style={{ letterSpacing: '0.1em' }}
                >
                  {s.name}
                </text>
                {/* Coupling tick to the stratum above */}
                {s.index > 1 && (
                  <line
                    x1="360"
                    y1={STRATA[s.index - 2].y + 22}
                    x2="360"
                    y2={s.y - 22}
                    stroke={GOLD_FAINT}
                    strokeWidth="1"
                  />
                )}
              </g>
            );
          })}

          {/* AUO node at top of axis */}
          <circle cx="360" cy="40" r="28" fill="url(#auo-glow)" />
          <circle cx="360" cy="40" r="6" fill={GOLD} />
          <text x="360" y="20" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={GOLD} style={{ letterSpacing: '0.2em' }}>
            SOURCE
          </text>

          {/* The Amaru — ouroboros at the equator (PMR) */}
          <g>
            <ellipse
              cx="360"
              cy={EQUATOR_Y}
              rx="300"
              ry="22"
              fill="none"
              stroke={GOLD}
              strokeWidth="2.2"
            />
            {/* Two heads biting */}
            <circle cx="60" cy={EQUATOR_Y} r="6" fill={GOLD} />
            <circle cx="660" cy={EQUATOR_Y} r="6" fill={GOLD} />
            <text x="360" y={EQUATOR_Y - 32} textAnchor="middle" fontFamily={MONO} fontSize="10" fill={GOLD} style={{ letterSpacing: '0.18em' }}>
              AMARU · EQUATOR
            </text>
          </g>

          {/* Idea-propagation arrows from N1 (governance) down to PMR */}
          <g opacity="0.7">
            {[280, 360, 440].map((x, i) => (
              <g key={i}>
                <line
                  x1={x}
                  y1={STRATA[2].y + 22}
                  x2={x}
                  y2={EQUATOR_Y - 22}
                  stroke={GOLD_DIM}
                  strokeWidth="1"
                  markerEnd="url(#arrow)"
                />
              </g>
            ))}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill={GOLD_DIM} />
              </marker>
            </defs>
          </g>

          {/* Sub-surface dotted return up the axis */}
          <line
            x1="358"
            y1={STRATA[4].y - 22}
            x2="358"
            y2={EQUATOR_Y + 22}
            stroke={GOLD_FAINT}
            strokeWidth="1"
            strokeDasharray="2 3"
          />
        </svg>

        <aside className="space-y-4">
          <div
            className="text-[10px] font-mono uppercase tracking-[0.18em]"
            style={{ color: GOLD }}
          >
            Hover or focus a stratum
          </div>
          {activeStratum ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold" style={{ color: TEXT }}>
                N{activeStratum.index} — {activeStratum.name}
              </div>
              <Row label="Campbell (NPMR)" value={activeStratum.campbell} />
              <Row label="Andean (Amaru)" value={activeStratum.andean} />
              <Row label="Operational (Conduit)" value={activeStratum.operational} />
            </div>
          ) : (
            <div className="text-xs" style={{ color: MUTED }}>
              Select a stratum to read its three names: Campbell's NPMR label, the Andean term, and the operational reading in Conduit.
            </div>
          )}
        </aside>
      </section>

      <section
        className="rounded-lg border p-6"
        style={{ background: BG_PANEL, borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: TEXT }}>
          How ideas propagate across the equator
        </h2>
        <p className="mt-2 text-xs max-w-3xl" style={{ color: MUTED }}>
          The three primitives below are the operational reading of the
          standardgalactic syllabus piece <span className="font-mono" style={{ color: GOLD }}>01 — How Ideas Work</span>{' '}
          (<a href="https://standardgalactic.github.io/syllabus/01_how_ideas_work.pdf" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: GOLD }}>PDF</a>),
          applied to the boundary between the governance stratum (N₁) and PMR.
        </p>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROPAGATION.map((p, i) => (
            <div
              key={p.title}
              className="rounded-md p-4"
              style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="mt-2 text-sm font-semibold" style={{ color: TEXT }}>
                {p.title}
              </div>
              <div className="mt-2 text-xs leading-relaxed" style={{ color: MUTED }}>
                {p.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className="rounded-lg border p-6"
        style={{ background: BG_PANEL, borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: TEXT }}>
          What v11 is — and is not
        </h2>
        <ul className="mt-3 space-y-2 text-xs" style={{ color: MUTED }}>
          <li>
            <span style={{ color: GOLD }}>Is —</span> a documentary reading of the Amaru ouroboros as a cross-section of a layered
            cosmology, in the vocabulary Campbell, standardgalactic, and the Andean lineage already share.
          </li>
          <li>
            <span style={{ color: GOLD }}>Is not —</span> a new Lutar formula. v11 introduces no L-term. Λ₁₀ from v10 remains the
            family's audit scalar; v11 ships exactly this one visual surface.
          </li>
          <li>
            <span style={{ color: GOLD }}>Is not —</span> a claim about Campbell's physics, Andean metaphysics, or the historical figure
            of Abraxas. v11 borrows their vocabulary because it already names the structure we are working with.
          </li>
        </ul>
        <div className="mt-4 text-[10px] font-mono" style={{ color: GOLD }}>
          docs/thesis/v11-npmr.md · additive to v10 · operational via /api/ouroboros/npmr/*
        </div>
      </section>

      <Kappa11Panel />
    </div>
  );
}

/**
 * Live κ₁₁ panel — calls POST /api/ouroboros/npmr/kappa. Operator-supplied
 * inputs only; no fake telemetry. Falls back to a clearly-labelled local
 * compute if the API isn't reachable so the surface stays informative
 * even when the api-server workflow is down.
 */
interface Kappa11Response {
  kappa11: number;
  components: { carrierFidelity: number; uptakeRatio: number; lossCoherence: number };
  healthyBand: { lower: number; upper: number };
  bandVerdict: 'below_band' | 'in_band' | 'above_band';
  interpretation: string;
  formula: string;
}

function Kappa11Panel() {
  const [written, setWritten] = useState('policy.retention,policy.pii_mask,policy.region_lock');
  const [enforced, setEnforced] = useState('policy.retention,policy.pii_mask');
  const [channelWidth, setChannelWidth] = useState('1');
  const [surfaceWidth, setSurfaceWidth] = useState('3');
  const [samples, setSamples] = useState('0.4,0.5,0.6,0.45,0.55');
  const [bandLower, setBandLower] = useState('0.1');
  const [bandUpper, setBandUpper] = useState('0.6');
  const [result, setResult] = useState<Kappa11Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'api' | 'fallback' | null>(null);

  const parseList = (s: string) =>
    s.split(',').map((x) => x.trim()).filter((x) => x.length > 0);
  const parseNums = (s: string) =>
    parseList(s).map((x) => Number(x)).filter((n) => Number.isFinite(n) && n >= 0);

  async function compute() {
    setLoading(true);
    setError(null);
    const body = {
      carrier: { written: parseList(written), enforced: parseList(enforced) },
      uptake: { channelWidth: Number(channelWidth), surfaceWidth: Number(surfaceWidth) },
      loss: { samples: parseNums(samples) },
      healthyBand: { lower: Number(bandLower), upper: Number(bandUpper) },
    };
    try {
      const r = await fetch('/api/ouroboros/npmr/kappa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json: Kappa11Response = await r.json();
      setResult(json);
      setSource('api');
    } catch (e) {
      // Local fallback — same formula, clearly labelled.
      try {
        const w = new Set(body.carrier.written);
        const en = new Set(body.carrier.enforced);
        if (w.size === 0) throw new Error('carrier.written must be non-empty');
        let hit = 0;
        w.forEach((x) => { if (en.has(x)) hit += 1; });
        const carrierFidelity = hit / w.size;
        if (!(body.uptake.channelWidth > 0)) throw new Error('channelWidth must be > 0');
        const uptakeRatio = Math.min(1, body.uptake.surfaceWidth / body.uptake.channelWidth);
        if (body.loss.samples.length === 0) throw new Error('loss.samples must be non-empty');
        const mean = body.loss.samples.reduce((a, b) => a + b, 0) / body.loss.samples.length;
        if (!(mean > 0)) throw new Error('loss.samples mean must be > 0');
        const variance = body.loss.samples.reduce((a, b) => a + (b - mean) ** 2, 0) / body.loss.samples.length;
        const lossCoherence = 1 / (1 + variance / (mean * mean));
        const kappa11 = 1 - carrierFidelity * uptakeRatio * lossCoherence;
        const band = body.healthyBand;
        const bandVerdict: Kappa11Response['bandVerdict'] =
          kappa11 < band.lower ? 'below_band' : kappa11 > band.upper ? 'above_band' : 'in_band';
        setResult({
          kappa11,
          components: { carrierFidelity, uptakeRatio, lossCoherence },
          healthyBand: band,
          bandVerdict,
          interpretation:
            bandVerdict === 'in_band'
              ? 'κ₁₁ within healthy band — equator permeable but not collapsed.'
              : bandVerdict === 'below_band'
              ? 'κ₁₁ below band — strata effectively collapsed.'
              : 'κ₁₁ above band — equator opaque, ideas not landing.',
          formula:
            'κ₁₁ = 1 − carrierFidelity · uptakeRatio · lossCoherence (local compute)',
        });
        setSource('fallback');
      } catch (inner) {
        setError((inner as Error).message);
        setResult(null);
        setSource(null);
      }
    } finally {
      setLoading(false);
    }
  }

  // Compute once on mount with the example inputs so the panel is informative immediately.
  useEffect(() => {
    void compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verdictColor = (v: Kappa11Response['bandVerdict']) =>
    v === 'in_band' ? '#5fb96a' : v === 'below_band' ? '#c9b787' : '#e07a7a';

  return (
    <section
      className="rounded-lg border p-6"
      style={{ background: BG_PANEL, borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-semibold" style={{ color: TEXT }}>
          κ₁₁ — Coupling Coefficient (live)
        </h2>
        <div className="text-[10px] font-mono uppercase tracking-[0.18em]" style={{ color: GOLD }}>
          POST /api/ouroboros/npmr/kappa
        </div>
      </div>
      <p className="mt-2 text-xs max-w-3xl" style={{ color: MUTED }}>
        κ₁₁ = 1 − carrierFidelity · uptakeRatio · lossCoherence. Operator-supplied inputs only; nothing is invented. See{' '}
        <span className="font-mono" style={{ color: GOLD }}>docs/thesis/v11-npmr.md §5</span>.
      </p>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Policies written (comma-sep ids)" value={written} onChange={setWritten} />
        <Field label="Policies enforced (comma-sep ids)" value={enforced} onChange={setEnforced} />
        <Field label="Channel width (sender)" value={channelWidth} onChange={setChannelWidth} />
        <Field label="Uptake surface width (receiver)" value={surfaceWidth} onChange={setSurfaceWidth} />
        <Field label="Loss samples (comma-sep, non-neg)" value={samples} onChange={setSamples} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Band lower" value={bandLower} onChange={setBandLower} />
          <Field label="Band upper" value={bandUpper} onChange={setBandUpper} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => void compute()}
          disabled={loading}
          className="px-3 py-1.5 rounded text-xs font-mono uppercase tracking-[0.18em] transition-colors"
          style={{
            background: loading ? 'transparent' : GOLD,
            color: loading ? GOLD : '#0a0a0a',
            border: `1px solid ${GOLD}`,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Computing…' : 'Compute κ₁₁'}
        </button>
        {source && (
          <span className="text-[10px] font-mono uppercase tracking-[0.18em]" style={{ color: MUTED }}>
            source: {source === 'api' ? 'live api' : 'local fallback (api unreachable)'}
          </span>
        )}
      </div>

      {error && (
        <div className="mt-4 text-xs font-mono" style={{ color: '#e07a7a' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-6">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em]" style={{ color: MUTED }}>
              κ₁₁
            </div>
            <div
              className="mt-1 text-4xl font-display font-semibold tabular-nums"
              style={{ color: verdictColor(result.bandVerdict) }}
            >
              {result.kappa11.toFixed(3)}
            </div>
            <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.18em]" style={{ color: verdictColor(result.bandVerdict) }}>
              {result.bandVerdict.replace('_', ' ')}
            </div>
            <div className="mt-1 text-[10px]" style={{ color: MUTED }}>
              band [{result.healthyBand.lower}, {result.healthyBand.upper}]
            </div>
          </div>
          <div className="space-y-3">
            <Row label="Carrier fidelity (N₁ → PMR)" value={result.components.carrierFidelity.toFixed(3)} />
            <Row label="Uptake ratio (LCS → N₁)" value={result.components.uptakeRatio.toFixed(3)} />
            <Row label="Loss coherence (PMR → sub-surface)" value={result.components.lossCoherence.toFixed(3)} />
            <Row label="Interpretation" value={result.interpretation} />
            <Row label="Formula" value={result.formula} />
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-[10px] font-mono uppercase tracking-[0.18em]" style={{ color: MUTED }}>
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded px-2 py-1.5 text-xs font-mono"
        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', color: TEXT }}
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em]" style={{ color: MUTED }}>
        {label}
      </div>
      <div className="mt-1 text-xs leading-relaxed" style={{ color: TEXT }}>
        {value}
      </div>
    </div>
  );
}
