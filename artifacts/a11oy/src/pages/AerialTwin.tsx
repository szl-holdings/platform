import { Link } from 'wouter';
import { Layout } from '../components/layout';
import {
  PageHeader, Card, SectionTitle, KpiCard, StatusBadge, InfoRow,
} from '../components/ui';
import {
  AERIAL_TWIN_VERSION, AERIAL_TWIN_TAGLINE,
  PRIMITIVES, OPEN_SOURCE_LEADERS, VERTICAL_BINDINGS, INNOVATION_SEEDS, ROADMAP, GUARDRAILS, AERIAL_TWIN_CITATIONS,
  type SeedStatus, type RoadmapPhase, type VerticalId,
} from '../data/aerialTwin';
import { AERIAL_TWIN_MILESTONES } from '../data/aerialTwinMilestones';

const GOLD = '#c9b787';
const TEXT = 'var(--color-a11oy-text)';
const SUB = 'var(--color-a11oy-text-sub)';
const GHOST = 'var(--color-a11oy-text-ghost)';

const STATUS_STYLE: Record<SeedStatus, { color: string; bg: string; label: string }> = {
  observed:  { color: '#5e5e5e', bg: 'rgba(94,94,94,0.12)',     label: 'OBSERVED' },
  distilled: { color: '#c9b787', bg: 'rgba(201,183,135,0.10)',  label: 'DISTILLED' },
  adoptable: { color: GOLD,      bg: 'rgba(201,183,135,0.18)',  label: 'ADOPTABLE' },
  piloted:   { color: '#f5f5f5', bg: 'rgba(245,245,245,0.10)',  label: 'PILOTED' },
};

const VERTICAL_ACCENT: Record<VerticalId, string> = {
  vessels: '#c9b787',
  terra:   '#f5f5f5',
  tenax:  '#c9b787',
};

const PHASE_LABEL: Record<RoadmapPhase, string> = {
  '0–6':   'Months 0–6 · Foundation',
  '7–12':  'Months 7–12 · Reinforcement',
  '13–24': 'Months 13–24 · Hardening',
};

const base = (import.meta.env.BASE_URL || '/a11oy/').replace(/\/$/, '');

export function AerialTwin() {
  const phases: RoadmapPhase[] = ['0–6', '7–12', '13–24'];

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · AERIAL TWIN"
        title="Aerial Twin"
        subtitle={`${AERIAL_TWIN_TAGLINE} · v${AERIAL_TWIN_VERSION}`}
        status="GATED"
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="PRIMITIVES" value={PRIMITIVES.length} sub="ray-trace → AI-RAN" accent={GOLD} />
        <KpiCard label="OSS LEADERS" value={OPEN_SOURCE_LEADERS.length} sub="public anchors we ground on" accent={GOLD} />
        <KpiCard label="VERTICALS BOUND" value={VERTICAL_BINDINGS.length} sub="Vessels · Terra · TENAX" accent={GOLD} />
        <KpiCard label="INNOVATION SEEDS" value={INNOVATION_SEEDS.length} sub="what we add" accent={GOLD} />
      </div>

      {/* Doctrine framing */}
      <Card className="mb-6">
        <SectionTitle>What this surface is</SectionTitle>
        <p className="text-xs mb-2" style={{ color: SUB, lineHeight: 1.7 }}>
          A site-specific wireless digital-twin doctrine for A11oy. Distilled from the public NVIDIA Aerial Digital Twin overview and grounded in the public open-source leaders for differentiable RF physics, software RAN, and the RAN Intelligent Controller. No leaked spectrum captures, no scraped proprietary scenes, no live emission.
        </p>
        <p className="text-xs" style={{ color: SUB, lineHeight: 1.7 }}>
          The seven sections below — primitives, OSS leaders, vertical bindings, innovation seeds, phased roadmap, guardrails, and citations — bind each element to a TENAX module or a vertical surface. Adoption of any element requires a Constitution review and a TENAX approval workflow.
        </p>
      </Card>

      {/* 1. Primitives */}
      <SectionTitle className="mt-2">1 · Primitives</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Six concepts that compose into a site-specific wireless twin. Each is grounded in a public source, never in a proprietary integration we do not have.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        {PRIMITIVES.map((p) => (
          <Card key={p.id}>
            <div className="font-display text-sm font-semibold mb-1" style={{ color: TEXT }}>{p.name}</div>
            <p className="text-xs mb-2" style={{ color: SUB, lineHeight: 1.6 }}>{p.oneLine}</p>
            <p className="text-xs mb-2" style={{ color: TEXT, lineHeight: 1.55 }}>{p.detail}</p>
            <div
              className="text-[11px] px-2 py-1.5 rounded"
              style={{
                color: GOLD,
                backgroundColor: 'rgba(201,183,135,0.06)',
                border: '1px solid rgba(201,183,135,0.18)',
                lineHeight: 1.5,
              }}
            >
              <span className="font-mono uppercase tracking-wide mr-1" style={{ fontSize: 9 }}>Grounded in</span>
              {p.groundedIn}
            </div>
          </Card>
        ))}
      </div>

      {/* 2. Open-source leaders */}
      <SectionTitle className="mt-2">2 · Open-source leaders we ground on</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Six public repositories that own the state of the art for differentiable RF physics, software RAN, and the RAN Intelligent Controller. Each is studied with-knowledge-of, then distilled into our pattern.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        {OPEN_SOURCE_LEADERS.map((l) => (
          <Card key={l.id}>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold" style={{ color: TEXT }}>{l.name}</span>
                <StatusBadge status="info" label={l.license} />
              </div>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px]"
                style={{ color: GOLD }}
              >
                {l.org}
              </a>
            </div>
            <p className="text-xs mb-2" style={{ color: SUB, lineHeight: 1.6 }}>{l.oneLine}</p>
            <InfoRow label="Primitive" value={PRIMITIVES.find((p) => p.id === l.primitive)?.name ?? l.primitive} />
            <InfoRow label="Distillation" value={l.distillation} />
          </Card>
        ))}
      </div>

      {/* 3. Vertical bindings */}
      <SectionTitle className="mt-2">3 · Vertical bindings</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Three SZL surfaces that already carry the asset context the twin needs. Each binding pairs use cases with the twin output and a vertical-specific guardrail.
      </p>
      <div className="grid grid-cols-1 gap-3 mb-8">
        {VERTICAL_BINDINGS.map((v) => {
          const accent = VERTICAL_ACCENT[v.id];
          return (
            <Card key={v.id}>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <span
                  className="font-mono text-[11px] px-1.5 py-0.5 rounded"
                  style={{ color: accent, backgroundColor: `${accent}18`, border: `1px solid ${accent}30` }}
                >
                  {v.vertical}
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: SUB, lineHeight: 1.6 }}>{v.context}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wide mb-1.5" style={{ color: GHOST }}>Use cases</div>
                  <ul className="space-y-1">
                    {v.useCases.map((uc) => (
                      <li key={uc} className="text-xs flex gap-2" style={{ color: TEXT, lineHeight: 1.5 }}>
                        <span className="shrink-0" style={{ color: GOLD }}>·</span>
                        <span>{uc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wide mb-1.5" style={{ color: GHOST }}>Twin output</div>
                  <p className="text-xs mb-3" style={{ color: TEXT, lineHeight: 1.55 }}>{v.twinOutput}</p>
                  <div
                    className="text-[11px] px-2 py-1.5 rounded"
                    style={{
                      color: GOLD,
                      backgroundColor: 'rgba(201,183,135,0.06)',
                      border: '1px solid rgba(201,183,135,0.18)',
                      lineHeight: 1.5,
                    }}
                  >
                    <span className="font-mono uppercase tracking-wide mr-1" style={{ fontSize: 9 }}>Guardrail</span>
                    {v.guardrail}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 4. Innovation seeds */}
      <SectionTitle className="mt-2">4 · Innovation seeds</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        What we add on top of the upstream brief. Each seed is novel, defensive, and bound to an A11oy or TENAX module.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        {INNOVATION_SEEDS.map((s) => {
          const ss = STATUS_STYLE[s.status];
          return (
            <Card key={s.id}>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <span className="font-display text-sm font-semibold" style={{ color: TEXT }}>{s.name}</span>
                <span
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                  style={{ color: ss.color, backgroundColor: ss.bg }}
                >
                  {ss.label}
                </span>
              </div>
              <p className="text-xs mb-2" style={{ color: SUB, lineHeight: 1.6 }}>{s.oneLine}</p>
              <InfoRow label="Novelty" value={s.novelty} />
              <InfoRow label="Module" value={s.module} mono />
            </Card>
          );
        })}
      </div>

      {/* 5. Phased roadmap */}
      <SectionTitle className="mt-2">5 · Phased roadmap</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        The 0–24 month plan. Every milestone is testable, Constitution-bound, and mapped onto an A11oy or TENAX module.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8">
        {phases.map((phase) => {
          const items = ROADMAP.filter((m) => m.phase === phase);
          return (
            <Card key={phase}>
              <div className="text-xs font-mono uppercase tracking-wide mb-3" style={{ color: GOLD }}>
                {PHASE_LABEL[phase]}
              </div>
              <div className="space-y-3">
                {items.map((m) => (
                  <div key={m.id} className="pb-3 border-b last:border-b-0 last:pb-0" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                    <div className="text-xs font-medium mb-1" style={{ color: TEXT }}>{m.title}</div>
                    <p className="text-[11px] mb-1" style={{ color: SUB, lineHeight: 1.55 }}>{m.detail}</p>
                    <div className="text-[10px] font-mono" style={{ color: GHOST }}>→ {m.module}</div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 6. Guardrails */}
      <SectionTitle className="mt-2">6 · Guardrails</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Five layers specific to the RF / twin surface. None can be bypassed by an in-context instruction.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {GUARDRAILS.map((g) => (
          <Card key={g.layer}>
            <div className="font-mono text-xs uppercase tracking-wide mb-2" style={{ color: GOLD }}>{g.layer}</div>
            <p className="text-xs mb-2" style={{ color: TEXT, lineHeight: 1.55 }}>{g.control}</p>
            <div className="text-[11px]" style={{ color: GHOST, lineHeight: 1.5 }}>
              <span className="font-mono uppercase mr-1" style={{ fontSize: 9 }}>Enforced by</span>
              {g.enforcedBy}
            </div>
          </Card>
        ))}
      </div>

      {/* Operational surfaces hub */}
      <SectionTitle className="mt-2">Operational surfaces — all 8 milestones delivered</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Each milestone is a full surface with deliverables, OSS distillations, guardrails, and citations.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {AERIAL_TWIN_MILESTONES.map((m) => (
          <Link key={m.slug} href={`${base}/aerial-twin/${m.slug}`} className="block">
            <Card className="h-full cursor-pointer" style={{ borderColor: 'rgba(201,183,135,0.25)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: GOLD, backgroundColor: 'rgba(201,183,135,0.12)' }}>
                  M{m.number}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#7afa7a', backgroundColor: 'rgba(122,250,122,0.08)' }}>
                  DELIVERED
                </span>
              </div>
              <div className="text-xs font-medium mb-1" style={{ color: TEXT }}>{m.title}</div>
              <div className="text-[10px] font-mono" style={{ color: GHOST }}>{m.phase} months · {m.deliverables.length} deliverables</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* 7. Citations */}
      <SectionTitle className="mt-2">Citations</SectionTitle>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          {AERIAL_TWIN_CITATIONS.map((c) => (
            <div key={c.tag} className="flex gap-2 py-1.5 text-[11px]" style={{ color: SUB, lineHeight: 1.5 }}>
              <span className="font-mono shrink-0" style={{ color: GOLD }}>[{c.tag}]</span>
              <span>{c.source}</span>
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  );
}
