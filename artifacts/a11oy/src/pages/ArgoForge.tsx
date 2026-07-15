import { Layout } from '../components/layout';
import {
  PageHeader, Card, SectionTitle, KpiCard, StatusBadge, InfoRow,
} from '../components/ui';
import {
  ARGO_TAGLINE, ARGO_VERSION, ARGO_CITATIONS,
  DOCTRINE_PILLARS, CAPABILITY_SEEDS, ALIGNMENT_MATRIX,
  type CapabilitySeed, type SeedStatus, type ConstellationTarget,
  type RoadmapPhase, type SeedSourceKind,
} from '../data/argoForge';

const GOLD = '#c9b787';
const SUB = 'var(--color-a11oy-text-sub)';
const TEXT = 'var(--color-a11oy-text)';
const GHOST = 'var(--color-a11oy-text-ghost)';

const STATUS_STYLE: Record<SeedStatus, { color: string; bg: string; label: string }> = {
  observed:  { color: '#5e5e5e', bg: 'rgba(94,94,94,0.12)',     label: 'OBSERVED' },
  distilled: { color: '#c9b787', bg: 'rgba(201,183,135,0.10)',  label: 'DISTILLED' },
  adoptable: { color: GOLD,      bg: 'rgba(201,183,135,0.18)',  label: 'ADOPTABLE' },
  piloted:   { color: '#f5f5f5', bg: 'rgba(245,245,245,0.10)',  label: 'PILOTED' },
};

const TARGET_STYLE: Record<ConstellationTarget, { color: string; bg: string }> = {
  A11oy:  { color: GOLD,      bg: 'rgba(201,183,135,0.10)' },
  TENAX: { color: '#f5f5f5', bg: 'rgba(245,245,245,0.08)' },
  Psyche: { color: '#c9b787', bg: 'rgba(201,183,135,0.06)' },
  Argo:   { color: '#5e5e5e', bg: 'rgba(94,94,94,0.12)' },
};

const SOURCE_KIND_META: Record<SeedSourceKind, { title: string; subtitle: string; chip: string }> = {
  'open-source': {
    title: 'Open-Source Primitives',
    subtitle:
      'Studied with-knowledge-of from the public ei-grad / Andrew Grigorev repository index. No code copied; design patterns distilled.',
    chip: 'OSS',
  },
  'public-research': {
    title: 'Frontier Methods (public research)',
    subtitle:
      'Reimplemented from first principles using only public Anthropic research, system cards, and the OpenMythos independent reconstruction. No leaks, no scraped weights.',
    chip: 'RESEARCH',
  },
};

const PHASE_LABEL: Record<RoadmapPhase, string> = {
  '0\u20136':  'Months 0–6 · MVP',
  '7\u201312': 'Months 7–12 · Layering',
  '13\u201324': 'Months 13–24 · Hardening',
};

function SeedCard({ seed }: { seed: CapabilitySeed }) {
  const ss = STATUS_STYLE[seed.status];
  const ts = TARGET_STYLE[seed.evolves];
  const skMeta = SOURCE_KIND_META[seed.sourceKind];
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-mono text-xs px-2 py-0.5 rounded"
            style={{ color: ts.color, backgroundColor: ts.bg }}
          >
            {seed.evolves.toUpperCase()}
          </span>
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded"
            style={{ color: ss.color, backgroundColor: ss.bg }}
          >
            {ss.label}
          </span>
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded"
            style={{
              color: GHOST,
              border: '1px solid rgba(255,255,255,0.10)',
              backgroundColor: 'rgba(255,255,255,0.02)',
            }}
            title={`Source kind: ${seed.sourceKind}`}
          >
            {skMeta.chip}
          </span>
        </div>
        <span className="font-mono text-[10px]" style={{ color: GHOST }}>
          {PHASE_LABEL[seed.phase]}
        </span>
      </div>

      <h3 className="text-base font-display font-semibold mb-1" style={{ color: TEXT }}>
        {seed.name}
      </h3>
      <p className="text-xs leading-relaxed mb-3" style={{ color: SUB }}>
        {seed.oneLine}
      </p>

      <div
        className="rounded p-2.5 mb-3 text-xs"
        style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,183,135,0.10)' }}
      >
        <div className="font-mono text-[10px] mb-1" style={{ color: GOLD }}>PRIMITIVE</div>
        <div style={{ color: SUB }}>{seed.primitive}</div>
      </div>

      <div className="space-y-1.5 mb-3">
        <InfoRow label="Evolves" value={<span style={{ color: TEXT }}>{seed.evolvesAgent}</span>} />
        <InfoRow
          label="Guardrail"
          value={<span style={{ color: SUB }}>{seed.defensiveGuardrail}</span>}
        />
      </div>

      <a
        href={seed.source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded transition-colors hover:opacity-80"
        style={{
          color: GOLD,
          backgroundColor: 'rgba(201,183,135,0.06)',
          border: '1px solid rgba(201,183,135,0.18)',
        }}
      >
        <span style={{ color: GHOST }}>source ·</span>
        <span>{seed.source.repo}</span>
        <span style={{ color: GHOST }}>· {seed.source.lang}</span>
      </a>
    </Card>
  );
}

export function ArgoForge() {
  const total = CAPABILITY_SEEDS.length;
  const adoptable = CAPABILITY_SEEDS.filter(s => s.status === 'adoptable' || s.status === 'piloted').length;
  const oss = CAPABILITY_SEEDS.filter(s => s.sourceKind === 'open-source').length;
  const research = CAPABILITY_SEEDS.filter(s => s.sourceKind === 'public-research').length;
  const targets = new Set(CAPABILITY_SEEDS.map(s => s.evolves)).size;

  // Group seeds by source kind first, then by constellation target
  const bySourceKind: Record<SeedSourceKind, CapabilitySeed[]> = {
    'open-source':     CAPABILITY_SEEDS.filter(s => s.sourceKind === 'open-source'),
    'public-research': CAPABILITY_SEEDS.filter(s => s.sourceKind === 'public-research'),
  };

  const groupByTarget = (seeds: CapabilitySeed[]): Record<ConstellationTarget, CapabilitySeed[]> => ({
    A11oy:  seeds.filter(s => s.evolves === 'A11oy'),
    TENAX: seeds.filter(s => s.evolves === 'TENAX'),
    Psyche: seeds.filter(s => s.evolves === 'Psyche'),
    Argo:   seeds.filter(s => s.evolves === 'Argo'),
  });

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · ARGO FIELD INTELLIGENCE FORGE"
        title="Argo — External Signal Forge"
        subtitle={ARGO_TAGLINE}
        status="GATED"
      />

      {/* Persistent defensive-only banner */}
      <div
        className="mb-5 px-3 py-2 rounded border flex items-center gap-2 text-xs flex-wrap"
        style={{
          borderColor: 'rgba(245,245,245,0.20)',
          backgroundColor: 'rgba(245,245,245,0.03)',
          color: SUB,
        }}
        role="note"
        aria-label="Defensive use boundary"
      >
        <span
          className="font-mono px-1.5 py-0.5 rounded"
          style={{ color: '#f5f5f5', backgroundColor: 'rgba(245,245,245,0.10)' }}
        >
          DEFENSIVE-ONLY
        </span>
        <span>
          External primitives studied with-knowledge-of, not adopted as code · CFAA compliant ·
          public-input only · TENAX approval gates every adoption · Cerberus enforces hard boundaries.
        </span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Capability Seeds" value={total} sub="distilled this cycle" accent={GOLD} />
        <KpiCard label="Ready to Adopt" value={adoptable} sub="adoptable + piloted" accent={GOLD} trend="up" />
        <KpiCard label="OSS · Research" value={`${oss} · ${research}`} sub="primitives · methods" accent="#f5f5f5" />
        <KpiCard label="Constellations Touched" value={targets} sub="A11oy · TENAX · Psyche" accent={GOLD} />
      </div>

      {/* DOCTRINE PILLARS */}
      <Card className="mb-6" style={{ borderColor: 'rgba(201,183,135,0.30)' }}>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: GOLD }}>DOCTRINE FLOOR</div>
            <h2 className="text-lg font-display font-semibold" style={{ color: TEXT }}>
              Every seed is filtered through these constraints, in this order.
            </h2>
            <p className="text-xs mt-1" style={{ color: SUB }}>
              No seed enters the constellation without satisfying at least one pillar and violating none.
            </p>
          </div>
          <span
            className="font-mono text-xs px-2 py-1 rounded"
            style={{ backgroundColor: 'rgba(201,183,135,0.12)', color: GOLD }}
          >
            v{ARGO_VERSION}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DOCTRINE_PILLARS.map(p => (
            <div
              key={p.id}
              className="rounded p-3"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(201,183,135,0.12)',
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
                <h3 className="text-sm font-display font-semibold" style={{ color: TEXT }}>
                  {p.pillar}
                </h3>
                <span className="font-mono text-[10px]" style={{ color: GHOST }}>
                  {p.citation}
                </span>
              </div>
              <p
                className="text-xs italic mb-2 pl-2"
                style={{ color: SUB, borderLeft: '2px solid rgba(201,183,135,0.30)' }}
              >
                “{p.quote}”
              </p>
              <div className="text-[11px] font-mono" style={{ color: GOLD }}>
                ENFORCED BY · <span style={{ color: SUB }}>{p.enforcedBy}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* CAPABILITY SEED GALLERY — by source kind, then constellation */}
      <SectionTitle>Capability Seeds — by Source Kind</SectionTitle>
      <p className="text-xs mb-5 -mt-3" style={{ color: SUB }}>
        Two tracks of distillation. Open-source primitives are concrete patterns lifted from public
        repositories. Frontier methods are higher-order practices reimplemented from first principles
        using only public research. Each card shows the agent it strengthens and the defensive
        guardrail required for adoption.
      </p>

      {(['open-source', 'public-research'] as SeedSourceKind[]).map(sk => {
        const seeds = bySourceKind[sk];
        if (seeds.length === 0) return null;
        const meta = SOURCE_KIND_META[sk];
        const grouped = groupByTarget(seeds);

        return (
          <div
            key={sk}
            className="mb-8 rounded p-4"
            style={{
              border: '1px solid rgba(201,183,135,0.14)',
              backgroundColor: 'rgba(255,255,255,0.015)',
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
              <h3 className="text-base font-display font-semibold" style={{ color: TEXT }}>
                {meta.title}
              </h3>
              <span
                className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  color: GHOST,
                  border: '1px solid rgba(255,255,255,0.10)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
              >
                {meta.chip} · {seeds.length} seed{seeds.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs mb-4" style={{ color: SUB }}>{meta.subtitle}</p>

            {(['TENAX', 'A11oy', 'Psyche', 'Argo'] as ConstellationTarget[]).map(target => {
              const targetSeeds = grouped[target];
              if (targetSeeds.length === 0) return null;
              const ts = TARGET_STYLE[target];
              return (
                <div key={target} className="mb-5 last:mb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="font-mono text-xs px-2 py-0.5 rounded"
                      style={{ color: ts.color, backgroundColor: ts.bg, border: `1px solid ${ts.color}40` }}
                    >
                      {target.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono" style={{ color: GHOST }}>
                      {targetSeeds.length} seed{targetSeeds.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {targetSeeds.map(s => <SeedCard key={s.id} seed={s} />)}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ALIGNMENT MATRIX */}
      <SectionTitle>Doctrine Alignment Matrix</SectionTitle>
      <p className="text-xs mb-4 -mt-3" style={{ color: SUB }}>
        Mapping each TENAX defensive capability (executive summary §1) to the seeds that satisfy it.
        Gaps signal where the next forge cycle should focus.
      </p>
      <Card className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">
              TENAX capability to capability-seed alignment matrix
            </caption>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(201,183,135,0.20)' }}>
                <th scope="col" className="text-left font-mono py-2 pr-4" style={{ color: GOLD }}>CAPABILITY</th>
                <th scope="col" className="text-left font-mono py-2 pr-4" style={{ color: GOLD }}>SATISFIED BY</th>
                <th scope="col" className="text-left font-mono py-2" style={{ color: GOLD }}>COVERAGE</th>
              </tr>
            </thead>
            <tbody>
              {ALIGNMENT_MATRIX.map((row, idx) => (
                <tr
                  key={row.capability}
                  style={{ borderBottom: idx === ALIGNMENT_MATRIX.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
                >
                  <th scope="row" className="text-left font-normal py-2.5 pr-4" style={{ color: TEXT }}>{row.capability}</th>
                  <td className="py-2.5 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {row.satisfiedBy.map(seedId => {
                        const seed = CAPABILITY_SEEDS.find(s => s.id === seedId);
                        if (!seed) return null;
                        return (
                          <span
                            key={seedId}
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              color: GOLD,
                              backgroundColor: 'rgba(201,183,135,0.08)',
                              border: '1px solid rgba(201,183,135,0.18)',
                            }}
                          >
                            {seed.name}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-2.5">
                    <StatusBadge
                      status={row.satisfiedBy.length >= 2 ? 'ok' : 'warn'}
                      label={row.satisfiedBy.length >= 2 ? 'COVERED' : 'PARTIAL'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ROADMAP MAPPING */}
      <SectionTitle>Roadmap Insertion</SectionTitle>
      <p className="text-xs mb-4 -mt-3" style={{ color: SUB }}>
        Where each seed enters the 24-month TENAX plan. MVP first, hardening last.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {(['0\u20136', '7\u201312', '13\u201324'] as RoadmapPhase[]).map(phase => {
          const phaseSeeds = CAPABILITY_SEEDS.filter(s => s.phase === phase);
          return (
            <Card key={phase}>
              <div className="text-xs font-mono mb-2" style={{ color: GOLD }}>
                {PHASE_LABEL[phase]}
              </div>
              {phaseSeeds.length === 0 ? (
                <div className="text-xs italic" style={{ color: GHOST }}>None scheduled</div>
              ) : (
                <ul className="space-y-1.5">
                  {phaseSeeds.map(s => (
                    <li key={s.id} className="text-xs flex items-start gap-2">
                      <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: GOLD }} />
                      <div>
                        <span style={{ color: TEXT }}>{s.name}</span>
                        <span className="block text-[10px] font-mono mt-0.5" style={{ color: GHOST }}>
                          {s.evolves} · {s.evolvesAgent}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {/* CITATIONS */}
      <SectionTitle>Citations</SectionTitle>
      <Card>
        <ul className="space-y-2 text-xs">
          {ARGO_CITATIONS.map(c => (
            <li key={c.url} className="flex items-start gap-2">
              <span
                className="font-mono text-[10px] px-1.5 py-0.5 rounded mt-0.5"
                style={{
                  color: c.kind === 'standard' ? '#f5f5f5' : c.kind === 'doctrine' ? GOLD : '#5e5e5e',
                  backgroundColor:
                    c.kind === 'standard' ? 'rgba(245,245,245,0.08)' :
                    c.kind === 'doctrine' ? 'rgba(201,183,135,0.10)' :
                    'rgba(94,94,94,0.12)',
                }}
              >
                {c.kind.toUpperCase()}
              </span>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: TEXT }}
              >
                {c.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-[11px] mt-3 pt-3" style={{ color: GHOST, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          External code is studied for design patterns; frontier methods are reimplemented from first
          principles. Adoption requires TENAX approval and a provenance entry in the Cerberus
          Evidence Vault. No leaked weights, no scraped private data, no offensive workflows.
        </p>
      </Card>
    </Layout>
  );
}
