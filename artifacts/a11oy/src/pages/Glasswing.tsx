import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusBadge, CodeBlock } from '../components/ui';
import { GLASSWING_PANELS, GLASSWING_POSTURE } from '../data/mythosDoctrine';

const CATEGORY_LABEL: Record<string, string> = {
  reasoning: 'Reasoning',
  tools: 'Tools',
  state: 'State',
  governance: 'Governance',
};

export function Glasswing() {
  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · GLASSWING MODE"
        title="Glasswing Mode"
        subtitle="A read-only transparency console. Reconstructed from the snapshot fingerprint. Every console open is itself a proof-ledger entry."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="PANELS" value={GLASSWING_PANELS.length} sub="reconstructed live" accent="#c9b787" />
        <KpiCard label="POSTURE" value="READ-ONLY" sub="cannot mutate" accent="#c9b787" />
        <KpiCard label="ACCESS LOG" value="proof-anchored" sub="every open audited" accent="#c9b787" />
        <KpiCard label="PII" value="redacted" sub="at the rendering layer" accent="#c9b787" />
      </div>

      <Card className="mb-6">
        <SectionTitle>Posture</SectionTitle>
        <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
          {GLASSWING_POSTURE.scope} Enabled for: <span style={{ color: 'var(--color-a11oy-text)' }}>{GLASSWING_POSTURE.enabledFor}</span>
        </p>
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-mono mb-1.5" style={{ color: '#c9b787' }}>GUARANTEES</div>
            <ul className="text-xs flex flex-col gap-1">
              {GLASSWING_POSTURE.guarantees.map((g, i) => (
                <li key={i} className="flex gap-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  <span style={{ color: '#c9b787' }}>✓</span><span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-mono mb-1.5" style={{ color: '#8a8a8a' }}>EXCLUSIONS</div>
            <ul className="text-xs flex flex-col gap-1">
              {GLASSWING_POSTURE.exclusions.map((e, i) => (
                <li key={i} className="flex gap-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  <span style={{ color: '#8a8a8a' }}>·</span><span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <SectionTitle>Console Panels (sample workcell)</SectionTitle>
      <div className="grid lg:grid-cols-2 gap-4">
        {GLASSWING_PANELS.map(p => (
          <Card key={p.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787' }}>
                {CATEGORY_LABEL[p.category]}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{p.title}</span>
              <StatusBadge status="ok" label="read-only" />
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{p.description}</p>
            <CodeBlock language="trace">{p.exampleSnippet}</CodeBlock>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
