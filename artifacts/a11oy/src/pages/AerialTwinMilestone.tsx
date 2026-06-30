import { useRoute, Link } from 'wouter';
import { Layout } from '../components/layout';
import {
  PageHeader, Card, SectionTitle, KpiCard, StatusBadge, InfoRow,
} from '../components/ui';
import { getMilestonePack, AERIAL_TWIN_MILESTONES } from '../data/aerialTwinMilestones';

const GOLD = '#c9b787';
const TEXT = 'var(--color-a11oy-text)';
const SUB = 'var(--color-a11oy-text-sub)';
const GHOST = 'var(--color-a11oy-text-ghost)';

const base = (import.meta.env.BASE_URL || '/a11oy/').replace(/\/$/, '');

const PHASE_LABEL: Record<string, string> = {
  '0–6':   'PHASE 1 · Months 0–6 · Foundation',
  '7–12':  'PHASE 2 · Months 7–12 · Reinforcement',
  '13–24': 'PHASE 3 · Months 13–24 · Hardening',
};

export function AerialTwinMilestone() {
  const [, params] = useRoute(`${base}/aerial-twin/:milestone`);
  const slug = params?.milestone ?? '';
  const pack = getMilestonePack(slug);

  if (!pack) {
    return (
      <Layout>
        <PageHeader
          label="DOCTRINE · AERIAL TWIN"
          title="Milestone not found"
          subtitle={`No operational surface registered for "${slug}".`}
          status="ROADMAP"
        />
        <Card>
          <p className="text-xs mb-3" style={{ color: SUB, lineHeight: 1.6 }}>
            The eight Aerial Twin operational surfaces live under <span className="font-mono" style={{ color: GOLD }}>{base}/aerial-twin/&lt;slug&gt;</span>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {AERIAL_TWIN_MILESTONES.map((m) => (
              <Link key={m.slug} href={`${base}/aerial-twin/${m.slug}`} className="block text-xs px-3 py-2 rounded" style={{ color: GOLD, border: '1px solid rgba(201,183,135,0.18)' }}>
                Milestone {m.number} · {m.title}
              </Link>
            ))}
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        label={`DOCTRINE · AERIAL TWIN · MILESTONE ${pack.number}`}
        title={pack.title}
        subtitle={`${pack.tagline} · ${PHASE_LABEL[pack.phase] ?? pack.phase}`}
        status="APPROVED"
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {pack.kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} accent={GOLD} />
        ))}
      </div>

      {/* Doctrine */}
      <Card className="mb-6">
        <SectionTitle>Doctrine</SectionTitle>
        <p className="text-xs" style={{ color: SUB, lineHeight: 1.7 }}>{pack.doctrine}</p>
      </Card>

      {/* Deliverables */}
      <SectionTitle className="mt-2">Deliverables</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Each deliverable is bound to a Sentra or A11oy module and required for milestone acceptance.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        {pack.deliverables.map((d) => (
          <Card key={d.id}>
            <div className="font-display text-sm font-semibold mb-1" style={{ color: TEXT }}>{d.name}</div>
            <p className="text-xs mb-2" style={{ color: SUB, lineHeight: 1.6 }}>{d.oneLine}</p>
            <p className="text-xs mb-2" style={{ color: TEXT, lineHeight: 1.55 }}>{d.detail}</p>
            <div
              className="text-[11px] px-2 py-1.5 rounded"
              style={{
                color: GOLD,
                backgroundColor: 'rgba(201,183,135,0.06)',
                border: '1px solid rgba(201,183,135,0.18)',
                lineHeight: 1.5,
              }}
            >
              <span className="font-mono uppercase tracking-wide mr-1" style={{ fontSize: 9 }}>Module</span>
              {d.module}
            </div>
          </Card>
        ))}
      </div>

      {/* OSS distillations */}
      <SectionTitle className="mt-2">Distilled from the open-source leaders</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        Each card names what we took from the public repository and what we changed to make it ours.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        {pack.oss.map((o) => (
          <Card key={`${o.leader}-${o.repo}`}>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold" style={{ color: TEXT }}>{o.leader}</span>
                <StatusBadge status="info" label={o.license} />
              </div>
              <a
                href={o.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px]"
                style={{ color: GOLD }}
              >
                {o.repo}
              </a>
            </div>
            <InfoRow label="Concept taken" value={o.conceptTaken} />
            <InfoRow label="Our reimplementation" value={o.ourReimplementation} />
          </Card>
        ))}
      </div>

      {/* Guardrails */}
      <SectionTitle className="mt-2">Guardrails</SectionTitle>
      <p className="text-xs mb-3" style={{ color: SUB }}>
        None of these can be bypassed by an in-context instruction. Each layer is owned by a named module.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {pack.guardrails.map((g) => (
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

      {/* Related milestones */}
      {pack.related.length > 0 && (
        <>
          <SectionTitle className="mt-2">Related operational surfaces</SectionTitle>
          <Card className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {pack.related.map((slug) => {
                const r = getMilestonePack(slug);
                if (!r) return null;
                return (
                  <Link key={slug} href={`${base}/aerial-twin/${r.slug}`} className="block text-xs px-3 py-2 rounded" style={{ color: GOLD, border: '1px solid rgba(201,183,135,0.18)' }}>
                    <span className="font-mono text-[10px] mr-1" style={{ color: GHOST }}>M{r.number}</span>
                    {r.title}
                  </Link>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* Citations */}
      <SectionTitle className="mt-2">Citations</SectionTitle>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          {pack.citations.map((c) => (
            <div key={c.tag} className="flex gap-2 py-1.5 text-[11px]" style={{ color: SUB, lineHeight: 1.5 }}>
              <span className="font-mono shrink-0" style={{ color: GOLD }}>[{c.tag}]</span>
              <span>{c.source}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Back to doctrine */}
      <div className="mt-6">
        <Link href={`${base}/aerial-twin`}>
          <a className="text-xs font-mono" style={{ color: GOLD }}>← Back to Aerial Twin doctrine</a>
        </Link>
      </div>
    </Layout>
  );
}
