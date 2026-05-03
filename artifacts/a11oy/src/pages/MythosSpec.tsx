import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, CodeBlock, StatusBadge, InfoRow } from '../components/ui';
import { MYTHOS_SPEC_KINDS, MYTHOS_SPEC_VERSION } from '../data/mythosDoctrine';


const SPEC_BASE = `https://a11oy.io/spec/mythos-doctrine/${MYTHOS_SPEC_VERSION}`;

export function MythosSpec() {
  const [active, setActive] = useState(MYTHOS_SPEC_KINDS[0].kind);
  const current = MYTHOS_SPEC_KINDS.find(k => k.kind === active) ?? MYTHOS_SPEC_KINDS[0];

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · OPEN SPEC"
        title="Mythos Doctrine Open Spec"
        subtitle={`Version ${MYTHOS_SPEC_VERSION} · CC-BY-4.0 · authored and operated by A11oy. Adopt the format; A11oy is one implementation among many.`}
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="VERSION" value={MYTHOS_SPEC_VERSION} sub="SemVer" accent="#c9b787" />
        <KpiCard label="ARTIFACT KINDS" value={MYTHOS_SPEC_KINDS.length} sub="discriminated union" accent="#c9b787" />
        <KpiCard label="LICENSE" value="CC-BY-4.0" sub="permissive, attribution" accent="#c9b787" />
        <KpiCard label="STATUS" value="ADOPT-OPEN" sub="external implementations welcome" accent="#c9b787" />
      </div>

      <Card className="mb-6">
        <SectionTitle>Spec endpoint</SectionTitle>
        <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
          Every emitted artifact carries an envelope with <code className="font-mono" style={{ color: '#c9b787' }}>specVersion</code>,{' '}
          <code className="font-mono" style={{ color: '#c9b787' }}>kind</code>, <code className="font-mono" style={{ color: '#c9b787' }}>id</code>,{' '}
          <code className="font-mono" style={{ color: '#c9b787' }}>issuedBy</code>, and <code className="font-mono" style={{ color: '#c9b787' }}>issuedAt</code>.
          Schemas are JSON Schema 2020-12. Companion TypeScript types are published alongside.
        </p>
        <CodeBlock language="bash">{`# JSON Schema for any kind
curl ${SPEC_BASE}/schemas/<kind>.json

# TypeScript companion types
import type { Constitution, SystemCard, RiskReport } from "@mythos-doctrine/spec/types";`}</CodeBlock>
      </Card>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ARTIFACT KINDS</div>
          {MYTHOS_SPEC_KINDS.map(k => (
            <button
              key={k.kind}
              onClick={() => setActive(k.kind)}
              className="text-left px-3 py-2 rounded text-xs font-mono"
              style={{
                backgroundColor: active === k.kind ? 'rgba(201,183,135,0.12)' : 'transparent',
                color: active === k.kind ? '#c9b787' : 'var(--color-a11oy-text-sub)',
                border: active === k.kind ? '1px solid rgba(201,183,135,0.3)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              {k.title}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base font-display font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{current.title}</span>
              <StatusBadge status="ok" label={current.kind} />
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>{current.purpose}</p>
            <InfoRow label="$schema" value={<span className="font-mono">{`${SPEC_BASE}/${current.schemaPath}`}</span>} />
            <InfoRow label="cites prior art" value={current.cite} />
          </Card>
          <Card>
            <SectionTitle>Live A11oy-emitted example</SectionTitle>
            <CodeBlock language="json">{JSON.stringify(current.example, null, 2)}</CodeBlock>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <SectionTitle>Adoption</SectionTitle>
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
          The spec is open public infrastructure. Adopt it; suggest changes; publish your own implementation. A11oy commits to (1) treating the spec as
          public infrastructure with a posted review window before MINOR/MAJOR releases, (2) maintaining backward compatibility per SemVer, (3) listing
          external implementations on this page when notified, and (4) auto-disclosing all CAVD records emitted by A11oy on the public Trust Portal after
          the embargo window.
        </p>
      </Card>
    </Layout>
  );
}
