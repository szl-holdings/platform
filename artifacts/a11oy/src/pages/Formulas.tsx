/**
 * A11oy /formulas — Formula Codex.
 *
 * Renders the canonical formula registry with provenance, parameters,
 * recent invocations, version history, and the ROSIE tuning queue.
 *
 * Source: docs/audits/formulas.md, lib/formulas/src/registry.ts.
 */
import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, KpiCard } from '../components/ui';

const GOLD = '#c9b787';

interface Provenance {
  thesisDoc: string;
  thesisSection: string;
  thesisVersion: string;
  equation: string;
  intent: string;
  citations?: string[];
}
interface Param {
  name: string;
  description: string;
  default: number;
  range?: [number, number];
  units?: string;
}
interface FormulaSummary {
  id: string;
  name: string;
  domain: string;
  version: string;
  description: string;
  provenance: Provenance;
  parameters: Param[];
  consumers: string[];
  inputShape: string;
  outputShape: string;
}
interface Catalog {
  total: number;
  byDomain: Record<string, number>;
  entries: FormulaSummary[];
}
interface Invocation {
  formulaId: string;
  version: string;
  ts: string;
  inputHash: string;
  outputHash: string;
  caller?: string;
  durationMs: number;
}
interface Proposal {
  id: number;
  formulaId: string;
  fromVersion: string;
  parameter: string;
  oldValue: number;
  newValue: number;
  proposalScore: number;
  rationale: string;
  status: string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: number;
  decidedByName?: string;
  decisionNote?: string;
}

const DOMAIN_COLOR: Record<string, string> = {
  invariant: '#a78bfa',
  routing: '#22d3ee',
  optimization: '#34d399',
  risk: '#f87171',
  governance: '#c9b787',
  scoring: '#fbbf24',
  evolution: '#f472b6',
};

export default function Formulas() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [invocations, setInvocations] = useState<Invocation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/a11oy/formulas/catalog').then((r) => r.json()),
      fetch('/api/a11oy/formulas/proposals').then((r) => r.json()),
    ])
      .then(([cat, props]) => {
        if (cancelled) return;
        if (cat?.ok && cat.data) {
          setCatalog(cat.data as Catalog);
          setActiveId((cat.data as Catalog).entries[0]?.id ?? null);
        } else setError(cat?.error?.message ?? 'Failed to load catalog.');
        if (props?.ok && props.data) setProposals(props.data.proposals ?? []);
      })
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    fetch(`/api/a11oy/formulas/invocations/${activeId}?limit=20`)
      .then((r) => r.json())
      .then((j) => !cancelled && j?.ok && setInvocations(j.data.results ?? []))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const filtered = useMemo(() => {
    if (!catalog) return [];
    return activeDomain ? catalog.entries.filter((e) => e.domain === activeDomain) : catalog.entries;
  }, [catalog, activeDomain]);

  const active = useMemo(
    () => catalog?.entries.find((e) => e.id === activeId) ?? null,
    [catalog, activeId],
  );

  return (
    <Layout>
      <PageHeader
        title="Formulas — Canonical Codex"
        eyebrow="A11oy / Codex"
        description="Every scoring, governance, risk, routing, and evolution formula in the platform — sourced from the V10 thesis, instrumented end-to-end, governed by ROSIE."
      />

      {error && (
        <Card>
          <div style={{ color: '#f87171', padding: 12 }}>Error: {error}</div>
        </Card>
      )}

      {catalog && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Total formulas" value={String(catalog.total)} />
          <KpiCard label="Domains" value={String(Object.keys(catalog.byDomain).length)} />
          <KpiCard label="Pending tunings" value={String(proposals.filter((p) => p.status === 'pending').length)} />
          <KpiCard label="Recent invocations" value={String(invocations.length)} />
        </div>
      )}

      {catalog && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <button
            onClick={() => setActiveDomain(null)}
            style={chipStyle(activeDomain === null)}
          >
            All ({catalog.total})
          </button>
          {Object.entries(catalog.byDomain).map(([dom, n]) => (
            <button
              key={dom}
              onClick={() => setActiveDomain(dom)}
              style={chipStyle(activeDomain === dom, DOMAIN_COLOR[dom])}
            >
              {dom} ({n})
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <Card>
          <div style={{ padding: 8, maxHeight: 600, overflowY: 'auto' }}>
            {filtered.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveId(f.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  marginBottom: 4,
                  background: f.id === activeId ? 'rgba(201,183,135,0.12)' : 'transparent',
                  border: `1px solid ${f.id === activeId ? GOLD : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 6,
                  color: '#e5e7eb',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                data-testid={`formula-row-${f.id}`}
              >
                <div style={{ color: GOLD, fontWeight: 600 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                  {f.id} · v{f.version} · <span style={{ color: DOMAIN_COLOR[f.domain] ?? GOLD }}>{f.domain}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div>
          {active ? (
            <FormulaDetail formula={active} invocations={invocations} />
          ) : (
            <Card>
              <div style={{ padding: 24, color: '#9ca3af' }}>Select a formula to view details.</div>
            </Card>
          )}
        </div>
      </div>

      {proposals.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Card>
            <div style={{ padding: 16 }}>
              <h3 style={{ color: GOLD, marginBottom: 12 }}>ROSIE tuning queue</h3>
              <table style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: 6 }}>Formula</th>
                    <th style={{ padding: 6 }}>Param</th>
                    <th style={{ padding: 6 }}>Old → New</th>
                    <th style={{ padding: 6 }}>Score</th>
                    <th style={{ padding: 6 }}>Status</th>
                    <th style={{ padding: 6 }}>Decided by</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p) => {
                    const decidedLabel =
                      p.status === 'pending'
                        ? '—'
                        : p.decidedByName ??
                          (p.decidedBy ? `user #${p.decidedBy}` : 'system');
                    return (
                      <tr key={p.id} data-testid={`proposal-${p.id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: 6, color: '#e5e7eb' }}>{p.formulaId}</td>
                        <td style={{ padding: 6 }}>{p.parameter}</td>
                        <td style={{ padding: 6 }}>{p.oldValue} → <span style={{ color: GOLD }}>{p.newValue}</span></td>
                        <td style={{ padding: 6 }}>{p.proposalScore.toFixed(3)}</td>
                        <td style={{ padding: 6, color: p.status === 'pending' ? '#fbbf24' : p.status === 'approved' ? '#34d399' : '#9ca3af' }}>{p.status}</td>
                        <td
                          style={{ padding: 6, color: p.status === 'pending' ? '#6b7280' : '#cbd5e1' }}
                          data-testid={`proposal-${p.id}-decider`}
                          title={p.decidedAt ? new Date(p.decidedAt).toLocaleString() : undefined}
                        >
                          {decidedLabel}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}

function chipStyle(active: boolean, color = GOLD): React.CSSProperties {
  return {
    background: active ? `${color}22` : 'transparent',
    border: `1px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
    color: active ? color : '#9ca3af',
    padding: '6px 12px',
    borderRadius: 999,
    fontSize: 12,
    cursor: 'pointer',
  };
}

function FormulaDetail({ formula, invocations }: { formula: FormulaSummary; invocations: Invocation[] }) {
  return (
    <Card>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>{formula.id}</div>
            <h2 style={{ color: GOLD, margin: '4px 0' }} data-testid="formula-name">{formula.name}</h2>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>
              v{formula.version} · <span style={{ color: DOMAIN_COLOR[formula.domain] ?? GOLD }}>{formula.domain}</span>
            </div>
          </div>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              padding: 12,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(201,183,135,0.2)',
              borderRadius: 6,
              color: GOLD,
              fontSize: 13,
            }}
            data-testid="formula-equation"
          >
            {formula.provenance.equation}
          </div>
        </div>

        <p style={{ color: '#cbd5e1', marginTop: 12 }}>{formula.description}</p>

        <Section title="Provenance">
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>
            <div><b style={{ color: GOLD }}>Thesis:</b> {formula.provenance.thesisDoc} {formula.provenance.thesisSection} ({formula.provenance.thesisVersion})</div>
            <div style={{ marginTop: 6 }}><b style={{ color: GOLD }}>Intent:</b> {formula.provenance.intent}</div>
            {formula.provenance.citations && formula.provenance.citations.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <b style={{ color: GOLD }}>Citations:</b>
                <ul style={{ margin: '4px 0 0 18px', color: '#9ca3af' }}>
                  {formula.provenance.citations.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>

        <Section title={`Parameters (${formula.parameters.length})`}>
          {formula.parameters.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af' }}>No tunable parameters.</div>
          ) : (
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#9ca3af', textAlign: 'left' }}>
                  <th style={{ padding: 4 }}>Name</th>
                  <th style={{ padding: 4 }}>Default</th>
                  <th style={{ padding: 4 }}>Range</th>
                  <th style={{ padding: 4 }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {formula.parameters.map((p) => (
                  <tr key={p.name} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: 4, color: GOLD }}>{p.name}</td>
                    <td style={{ padding: 4 }}>{p.default}</td>
                    <td style={{ padding: 4, color: '#9ca3af' }}>{p.range ? `[${p.range[0]}, ${p.range[1]}]` : '—'}</td>
                    <td style={{ padding: 4, color: '#cbd5e1' }}>{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="I/O shape">
          <div style={{ fontSize: 13, fontFamily: 'ui-monospace, monospace', color: '#cbd5e1' }}>
            <div><b style={{ color: GOLD }}>in:</b> {formula.inputShape}</div>
            <div><b style={{ color: GOLD }}>out:</b> {formula.outputShape}</div>
          </div>
        </Section>

        <Section title={`Consumers (${formula.consumers.length})`}>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#9ca3af' }}>
            {formula.consumers.map((c) => (
              <li key={c} style={{ fontFamily: 'ui-monospace, monospace' }}>{c}</li>
            ))}
          </ul>
        </Section>

        <Section title={`Recent invocations (${invocations.length})`}>
          {invocations.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af' }}>No invocations recorded yet.</div>
          ) : (
            <table style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr style={{ color: '#9ca3af', textAlign: 'left' }}>
                  <th style={{ padding: 4 }}>When</th>
                  <th style={{ padding: 4 }}>Caller</th>
                  <th style={{ padding: 4 }}>Input → Output</th>
                  <th style={{ padding: 4 }}>Latency</th>
                </tr>
              </thead>
              <tbody>
                {invocations.map((inv, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: 4 }}>{new Date(inv.ts).toLocaleTimeString()}</td>
                    <td style={{ padding: 4, color: '#cbd5e1' }}>{inv.caller ?? '—'}</td>
                    <td style={{ padding: 4, fontFamily: 'ui-monospace, monospace', color: GOLD }}>
                      {inv.inputHash} → {inv.outputHash}
                    </td>
                    <td style={{ padding: 4 }}>{inv.durationMs.toFixed(2)} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <h4 style={{ color: GOLD, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h4>
      {children}
    </div>
  );
}
