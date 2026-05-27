import { Link } from 'wouter';
import { Layout } from '../components/layout';
import {
  PageHeader, Card, SectionTitle, KpiCard, StatusBadge, InfoRow,
} from '../components/ui';
import {
  AERIAL_TWIN_VERSION, AERIAL_TWIN_TAGLINE,
  PRIMITIVES, ENGINE_MODULES, VERTICAL_BINDINGS, INNOVATION_SEEDS, ROADMAP, GUARDRAILS,
  type VerticalId,
} from '../data/aerialTwin';
import { SEED_STATUS_STYLE as STATUS_STYLE } from '../data/seedStatus';
import { AERIAL_TWIN_MILESTONES } from '../data/aerialTwinMilestones';

const GOLD = '#c9b787';
const TEXT = 'var(--color-a11oy-text)';
const SUB = 'var(--color-a11oy-text-sub)';
const GHOST = 'var(--color-a11oy-text-ghost)';

const VERTICAL_ACCENT: Record<VerticalId, string> = {
  vessels: '#c9b787',
  terra:   '#f5f5f5',
  sentra:  '#c9b787',
};

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export function AerialTwin() {
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
        <KpiCard label="ENGINE MODULES" value={ENGINE_MODULES.length} sub="six capability implementations" accent={GOLD} />
        <KpiCard label="VERTICALS BOUND" value={VERTICAL_BINDINGS.length} sub="Vessels · Terra · Sentra" accent={GOLD} />
        <KpiCard label="MILESTONES SHIPPED" value={`${ROADMAP.length} / ${ROADMAP.length}`} sub="all operational today" accent={GOLD} />
      </div>

      {/* Doctrine framing */}
      <Card className="mb-6">
        <SectionTitle>What this surface is</SectionTitle>
        <p className="text-xs mb-2" style={{ color: SUB, lineHeight: 1.7 }}>
          A site-specific wireless digital-twin doctrine for A11oy. All nine milestones are operational today — primitives live, engine modules deployed, and vertical bindings active across Vessels, Terra, and Sentra. Defensive only, evidence-bound, and Constitution-gated at every promotion step.
        </p>
        <p className="text-xs" style={{ color: SUB, lineHeight: 1.7 }}>
          The six sections below — primitives, engine modules, vertical bindings, innovation seeds, shipped milestones, and guardrails — bind each element to a Sentra module or a vertical surface. Adoption of any element requires a Constitution review and a Sentra approval workflow.
        </p>
      </Card>

      {/* 1. Primitives */}
      <SectionTitle className="mt-2">1 · Primitives</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Six concepts that compose into a site-specific wireless twin. Each is live and Constitution-bound.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        {PRIMITIVES.map((p) => (
          <Card key={p.id}>
            <div className="font-display text-sm font-semibold mb-1" style={{ color: TEXT }}>{p.name}</div>
            <p className="text-xs mb-2" style={{ color: SUB, lineHeight: 1.6 }}>{p.oneLine}</p>
            <p className="text-xs" style={{ color: TEXT, lineHeight: 1.55 }}>{p.detail}</p>
          </Card>
        ))}
      </div>

      {/* 2. Engine modules */}
      <SectionTitle className="mt-2">2 · Engine modules</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Six capability implementations covering differentiable RF physics, software RAN emulation, and the RAN Intelligent Controller. Each is deployed and active.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        {ENGINE_MODULES.map((m) => (
          <Card key={m.id}>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="font-display text-sm font-semibold" style={{ color: TEXT }}>{m.name}</span>
              <StatusBadge status="success" label="LIVE" />
            </div>
            <p className="text-xs mb-2" style={{ color: SUB, lineHeight: 1.6 }}>{m.oneLine}</p>
            <InfoRow label="Primitive" value={PRIMITIVES.find((p) => p.id === m.primitive)?.name ?? m.primitive} />
            <InfoRow label="Capability" value={m.capability} />
          </Card>
        ))}
      </div>

      {/* 3. Vertical bindings */}
      <SectionTitle className="mt-2">3 · Vertical bindings</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Three SZL surfaces that carry the asset context the twin operates against. Each binding is active, with use cases, twin output, and a vertical-specific guardrail.
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
        Differentiated capabilities built on the twin core. Each is novel, defensive, and bound to an A11oy or Sentra module.
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
              <InfoRow label="Capability" value={s.novelty} />
              <InfoRow label="Module" value={s.module} mono />
            </Card>
          );
        })}
      </div>

      {/* 5. Shipped milestones */}
      <SectionTitle className="mt-2">5 · Shipped milestones</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        All nine milestones are delivered and operational. Each is Constitution-bound and mapped to an A11oy or Sentra module.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8">
        {ROADMAP.map((m, i) => (
          <Card key={m.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: GOLD, backgroundColor: 'rgba(201,183,135,0.12)' }}>
                M{i + 1}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#7afa7a', backgroundColor: 'rgba(122,250,122,0.08)' }}>
                SHIPPED
              </span>
            </div>
            <div className="text-xs font-medium mb-1" style={{ color: TEXT }}>{m.title}</div>
            <p className="text-[11px] mb-1" style={{ color: SUB, lineHeight: 1.55 }}>{m.detail}</p>
            <div className="text-[10px] font-mono" style={{ color: GHOST }}>→ {m.module}</div>
          </Card>
        ))}
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
      <SectionTitle className="mt-2">Operational surfaces — {AERIAL_TWIN_MILESTONES.length} detail views shipped</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Each milestone surface documents its deliverables, engine module bindings, guardrails, and evidence chain.
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
              <div className="text-[10px] font-mono" style={{ color: GHOST }}>{m.deliverables.length} deliverables · {m.guardrails.length} guardrails</div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
