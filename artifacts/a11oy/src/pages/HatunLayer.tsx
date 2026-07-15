import { Layout } from '../components/layout';
import {
  PageHeader, Card, SectionTitle, KpiCard, StatusBadge, InfoRow,
} from '../components/ui';
import {
  HATUN_LAYER_VERSION, HATUN_LAYER_TAGLINE,
  ORCHESTRATION_STEPS, SCANNERS, RL_PIPELINE, GUARDRAILS, ROADMAP, MODEL_REFERENCES, HATUN_LAYER_CITATIONS,
  type LoopActor, type ScannerSurface, type RoadmapPhase,
} from '../data/hatunLayer';

const GOLD = '#c9b787';
const TEXT = 'var(--color-a11oy-text)';
const SUB = 'var(--color-a11oy-text-sub)';
const GHOST = 'var(--color-a11oy-text-ghost)';

const ACTOR_STYLE: Record<LoopActor, { color: string; bg: string }> = {
  A11oy:    { color: GOLD,      bg: 'rgba(201,183,135,0.10)' },
  TENAX:   { color: '#f5f5f5', bg: 'rgba(245,245,245,0.08)' },
  Human:    { color: '#c9b787', bg: 'rgba(201,183,135,0.06)' },
  External: { color: '#5e5e5e', bg: 'rgba(94,94,94,0.12)' },
};

const SURFACE_LABEL: Record<ScannerSurface, string> = {
  'source-code':   'Source code',
  'dependencies':  'Dependencies',
  'containers':    'Containers',
  'iac':           'Infrastructure-as-code',
  'secrets':       'Secrets',
};

const PHASE_LABEL: Record<RoadmapPhase, string> = {
  '0–6':   'Months 0–6 · Foundation',
  '7–12':  'Months 7–12 · Reinforcement',
  '13–24': 'Months 13–24 · Hardening',
};

function ActorChip({ actor }: { actor: LoopActor }) {
  const s = ACTOR_STYLE[actor];
  return (
    <span
      className="font-mono text-[10px] px-1.5 py-0.5 rounded"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {actor.toUpperCase()}
    </span>
  );
}

export function HatunLayer() {
  const phases: RoadmapPhase[] = ['0–6', '7–12', '13–24'];

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · DEFENSIVE LAYER"
        title="Hatun Layer"
        subtitle={`${HATUN_LAYER_TAGLINE} · v${HATUN_LAYER_VERSION}`}
        status="GATED"
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="ORCHESTRATION STEPS" value={ORCHESTRATION_STEPS.length} sub="A11oy ↔ TENAX loop" accent={GOLD} />
        <KpiCard label="SCANNERS" value={SCANNERS.length} sub="public, defensively licensed" accent={GOLD} />
        <KpiCard label="GUARDRAIL LAYERS" value={GUARDRAILS.length} sub="input → audit → provenance" accent={GOLD} />
        <KpiCard label="ROADMAP MILESTONES" value={ROADMAP.length} sub="0–24 month plan" accent={GOLD} />
      </div>

      {/* Doctrine framing card */}
      <Card className="mb-6">
        <SectionTitle>What this surface is</SectionTitle>
        <p className="text-xs mb-2" style={{ color: SUB, lineHeight: 1.7 }}>
          The Hatun Layer codifies how A11oy and TENAX compose into a defensive AI layer when frontier models become a force multiplier
          on both sides of the asymmetry. It is a static doctrine surface, not a live runtime. Every claim here resolves to public research,
          official tool documentation, or a first-principle reconstruction. No leaks, no scraped weights, no telemetry.
        </p>
        <p className="text-xs" style={{ color: SUB, lineHeight: 1.7 }}>
          The five sections below — orchestration loop, scanner toolchain, RL pipeline, guardrails, and phased roadmap — mirror
          the executive-summary architecture and bind each element to a TENAX module. Adoption of any element requires a Constitution
          review and a TENAX approval workflow.
        </p>
      </Card>

      {/* 1. Orchestration loop */}
      <SectionTitle className="mt-2">1 · Orchestration loop</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        The ten-step A11oy ↔ TENAX interaction. Each step is constrained by a guardrail; no step can side-step the queue.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        {ORCHESTRATION_STEPS.map((s) => (
          <Card key={s.step}>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[11px] px-1.5 py-0.5 rounded"
                  style={{ color: GOLD, backgroundColor: 'rgba(201,183,135,0.12)' }}
                >
                  STEP {String(s.step).padStart(2, '0')}
                </span>
                <ActorChip actor={s.from} />
                <span className="font-mono text-[10px]" style={{ color: GHOST }}>→</span>
                <ActorChip actor={s.to} />
              </div>
              <span className="font-mono text-[10px]" style={{ color: GHOST }}>{s.action}</span>
            </div>
            <p className="text-xs mb-2" style={{ color: TEXT, lineHeight: 1.55 }}>{s.detail}</p>
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
              {s.guardrail}
            </div>
          </Card>
        ))}
      </div>

      {/* 2. Scanner toolchain */}
      <SectionTitle className="mt-2">2 · Scanner toolchain</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Six public, defensively-licensed tools the orchestration layer composes. Each is bound to a TENAX module and a stated guardrail.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        {SCANNERS.map((sc) => (
          <Card key={sc.id}>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold" style={{ color: TEXT }}>{sc.name}</span>
                <StatusBadge status="info" label={SURFACE_LABEL[sc.surface]} />
              </div>
              <span className="font-mono text-[10px]" style={{ color: GHOST }}>{sc.license}</span>
            </div>
            <p className="text-xs mb-2" style={{ color: SUB, lineHeight: 1.6 }}>{sc.oneLine}</p>
            <InfoRow label="Primitive" value={sc.primitive} />
            <InfoRow label="Source" value={
              <a href={sc.source.url} target="_blank" rel="noopener noreferrer" className="font-mono" style={{ color: GOLD }}>
                {sc.source.org}/{sc.source.repo}
              </a>
            } />
            <InfoRow label="Language" value={sc.source.lang} mono />
            <InfoRow label="TENAX binding" value={sc.sentraBinding} />
            <div
              className="text-[11px] px-2 py-1.5 rounded mt-2"
              style={{
                color: GOLD,
                backgroundColor: 'rgba(201,183,135,0.06)',
                border: '1px solid rgba(201,183,135,0.18)',
                lineHeight: 1.5,
              }}
            >
              <span className="font-mono uppercase tracking-wide mr-1" style={{ fontSize: 9 }}>Guardrail</span>
              {sc.guardrail}
            </div>
          </Card>
        ))}
      </div>

      {/* 3. RL pipeline */}
      <SectionTitle className="mt-2">3 · RL pipeline</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Public-research formulation: state, action, reward, regime, human feedback, and the safety constraints that sit outside the loop.
      </p>
      <Card className="mb-8">
        <div className="space-y-1">
          {RL_PIPELINE.map((axis) => (
            <div key={axis.id} className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <div>
                <div className="text-xs font-mono uppercase tracking-wide" style={{ color: GOLD }}>{axis.axis}</div>
                <div className="text-[10px] mt-1 font-mono" style={{ color: GHOST }}>{axis.citation}</div>
              </div>
              <div className="text-xs" style={{ color: TEXT, lineHeight: 1.6 }}>{axis.detail}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Guardrails */}
      <SectionTitle className="mt-2">4 · Guardrails stack</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Six layers, every model action passes through them. None can be bypassed by an in-context instruction.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {GUARDRAILS.map((g) => (
          <Card key={g.layer}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs uppercase tracking-wide" style={{ color: GOLD }}>{g.layer}</span>
            </div>
            <p className="text-xs mb-2" style={{ color: TEXT, lineHeight: 1.55 }}>{g.control}</p>
            <div className="text-[11px]" style={{ color: GHOST, lineHeight: 1.5 }}>
              <span className="font-mono uppercase mr-1" style={{ fontSize: 9 }}>Enforced by</span>
              {g.enforcedBy}
            </div>
          </Card>
        ))}
      </div>

      {/* 5. Roadmap */}
      <SectionTitle className="mt-2">5 · Phased roadmap</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        The 0–24 month plan from the executive summary, mapped onto TENAX modules. Every milestone is testable and Constitution-bound.
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

      {/* 6. Public model references */}
      <SectionTitle className="mt-2">6 · Public model references</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Candidates routed through the A11oy Model Router when customer policy permits. Public access only — no claim of integration with proprietary endpoints we do not have.
      </p>
      <Card className="mb-8">
        <div className="space-y-1">
          {MODEL_REFERENCES.map((m) => (
            <div key={m.id} className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <div>
                <div className="text-xs font-medium" style={{ color: TEXT }}>{m.family}</div>
                <p className="text-[11px] mt-0.5" style={{ color: SUB, lineHeight: 1.5 }}>{m.strengths}</p>
                <div className="text-[10px] font-mono mt-1" style={{ color: GHOST }}>{m.access}</div>
              </div>
              <div className="text-[10px] font-mono sm:text-right" style={{ color: GHOST }}>{m.contextWindow}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. Citations */}
      <SectionTitle className="mt-2">Citations</SectionTitle>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          {HATUN_LAYER_CITATIONS.map((c) => (
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
