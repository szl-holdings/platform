import { useState } from 'react';
import { Layout } from '../components/layout';
import { motion } from 'framer-motion';

const T = {
  bg: '#0a0a0a',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
  accent: '#c9b787',
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  serif: "Georgia, 'Times New Roman', Times, serif",
};

type Availability = 'public' | 'internal' | 'draft';

interface Resource {
  id: string;
  title: string;
  category: string;
  description: string;
  availability: Availability;
  version: string | null;
  href: string | null;
  hrefLabel: string | null;
}

const RESOURCES: Resource[] = [
  {
    id: 'arch-overview',
    title: 'Architecture Overview',
    category: 'Document',
    description: 'The eleven blueprint components, seven governing principles, and nine implementation priorities that define the A11oy governed agentic layer.',
    availability: 'public',
    version: 'v1.0',
    href: '/a11oy/architecture',
    hrefLabel: 'Open Architecture page',
  },
  {
    id: 'platform-definition',
    title: 'Platform Definition',
    category: 'Document',
    description: 'What A11oy is, what it is not, how it differs from copilots and automation platforms, and the north star that governs its design decisions.',
    availability: 'public',
    version: 'v1.0',
    href: '/a11oy/about',
    hrefLabel: 'Open Platform Definition',
  },
  {
    id: 'applications-catalog',
    title: 'Applications Catalog',
    category: 'Document',
    description: 'All 12 governed applications with honest operational status, seven-principle tags, domain grouping, and registry profile IDs for the six AEEP-registered domains.',
    availability: 'public',
    version: null,
    href: '/a11oy/applications',
    hrefLabel: 'Open Applications Catalog',
  },
  {
    id: 'agentic-blueprint',
    title: 'Agentic AI Blueprint',
    category: 'Document',
    description: 'The canonical blueprint defining governed agentic OS design — seven principles, eleven components, eight implementation priorities, and positioning guidance.',
    availability: 'internal',
    version: 'v1.0',
    href: null,
    hrefLabel: null,
  },
  {
    id: 'mcp-readiness',
    title: 'MCP Readiness Assessment Framework',
    category: 'Document',
    description: 'Methodology for evaluating MCP gateway readiness: auth mode, write gate, approval depth, evidence chain, and connector trust scoring.',
    availability: 'draft',
    version: 'v0.7-draft',
    href: null,
    hrefLabel: null,
  },
  {
    id: 'pce-spec',
    title: 'Proof-Carrying Execution',
    category: 'Specification',
    description: 'Formal specification of the PCE contract format — hash algorithm, approval chain structure, verification protocol, and ledger append semantics.',
    availability: 'public',
    version: 'v1.0',
    href: '/a11oy/pce',
    hrefLabel: 'Open Proof Chain viewer',
  },
  {
    id: 'governance-spec',
    title: 'Governance Framework',
    category: 'Specification',
    description: 'Approval tier definitions, policy clause structure, covenant enforcement modes, override audit trails, and human-in-the-loop approval contracts.',
    availability: 'public',
    version: 'v1.0',
    href: '/a11oy/governance',
    hrefLabel: 'Open Governance page',
  },
  {
    id: 'covenant-policy',
    title: 'Covenant Policy Authoring Guide',
    category: 'Guide',
    description: 'Writing and deploying policy-as-code gates for governed execution. Approval tiers, policy clauses, enforcement modes, and override audit trails.',
    availability: 'internal',
    version: null,
    href: null,
    hrefLabel: null,
  },
  {
    id: 'guide-mcp',
    title: 'MCP Gateway Integration',
    category: 'Guide',
    description: 'Connecting external MCP servers through the A11oy containment firewall. Allowlists, egress rules, injection scanning, and consent gating.',
    availability: 'internal',
    version: null,
    href: null,
    hrefLabel: null,
  },
  {
    id: 'guide-vertical',
    title: 'Vertical Pack Development',
    category: 'Guide',
    description: 'Building a new vertical pack — signal schemas, forecast modules, recommendation contracts, and brief structure with proof-chain wiring.',
    availability: 'internal',
    version: null,
    href: null,
    hrefLabel: null,
  },
  {
    id: 'fabric-layer',
    title: 'Fabric Layer',
    category: 'SDK',
    description: 'The A11oy execution fabric — shared types, tool connectors, schema contracts, and Zod validators in @workspace/a11oy-fabric.',
    availability: 'public',
    version: '4.2.0',
    href: '/a11oy/fabric',
    hrefLabel: 'Open Fabric viewer',
  },
  {
    id: 'sdk-py',
    title: 'Python Vertical Pack SDK',
    category: 'SDK',
    description: 'Substrate recommendation contracts for all 12 verticals. Signal, forecast, recommendation, and brief modules with consistent proof-chain wiring.',
    availability: 'internal',
    version: '1.0.0',
    href: null,
    hrefLabel: null,
  },
  {
    id: 'api-fabric',
    title: 'Fabric API Reference',
    category: 'API',
    description: 'GET endpoints for signals, outcomes, actions, proof, governance, verticals, fabric, and workcells. Phase 1 Foundation.',
    availability: 'internal',
    version: 'v1',
    href: null,
    hrefLabel: null,
  },
  {
    id: 'api-runtime',
    title: 'Runtime API Reference',
    category: 'API',
    description: 'POST endpoints for signals, approvals, workcells, tool execution, eval runs, and PCE gate. Phase 2 Runtime.',
    availability: 'internal',
    version: 'v2',
    href: null,
    hrefLabel: null,
  },
];

const CATEGORIES = ['All', 'Document', 'Specification', 'Guide', 'SDK', 'API'];

const AVAILABILITY_META: Record<Availability, { color: string; label: string }> = {
  public:   { color: '#c9b787', label: 'Public' },
  internal: { color: '#5e5e5e', label: 'Internal' },
  draft:    { color: '#8a8a8a', label: 'Draft' },
};

const CAT_ICONS: Record<string, string> = {
  Document: '▣', Specification: '◆', Guide: '◉', SDK: '⬟', API: '⬡',
};

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function ResourcesHub() {
  const [category, setCategory] = useState('All');

  const filtered = category === 'All' ? RESOURCES : RESOURCES.filter(r => r.category === category);

  const grouped = CATEGORIES
    .filter(c => c !== 'All')
    .map(cat => ({
      cat,
      items: filtered.filter(r => r.category === cat),
    }))
    .filter(g => g.items.length > 0);

  const publicCount = RESOURCES.filter(r => r.availability === 'public').length;

  return (
    <Layout>
      <div style={{ paddingBottom: '4rem' }}>
        <div style={{ padding: '3rem 0 2.5rem', borderBottom: `1px solid ${T.border}`, marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 1.25rem' }}>Resources</p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontFamily: T.serif, fontWeight: 400, letterSpacing: '-0.03em', color: T.text, lineHeight: 1.1, margin: '0 0 1rem' }}>
            Architecture, Guides & References
          </h1>
          <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, maxWidth: '64ch', margin: 0 }}>
            {publicCount} public resources link directly — no email gates, no forms.
            Internal and draft resources are labeled honestly.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {CATEGORIES.map(cat => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '0.4rem 0.875rem', borderRadius: 6,
                  fontSize: '0.75rem', fontFamily: T.mono, fontWeight: 500,
                  border: `1px solid ${isActive ? 'rgba(201,183,135,0.3)' : T.border}`,
                  background: isActive ? 'rgba(201,183,135,0.1)' : 'rgba(255,255,255,0.03)',
                  color: isActive ? T.accent : T.textDim,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                }}
              >
                {cat !== 'All' && CAT_ICONS[cat] && <span>{CAT_ICONS[cat]}</span>}
                {cat}
              </button>
            );
          })}
        </div>

        {grouped.map(({ cat, items }) => (
          <div key={cat} style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <span style={{ color: T.accent, fontSize: '0.875rem' }}>{CAT_ICONS[cat]}</span>
              <span style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.textMuted }}>
                {cat}s
              </span>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1px', background: T.border, borderRadius: 12, overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}>
              {items.map((resource, i) => {
                const am = AVAILABILITY_META[resource.availability];
                return (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.45, delay: i * 0.04, ease }}
                    style={{
                      padding: '1.5rem', background: T.bg,
                      display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: T.text, letterSpacing: '-0.015em' }}>
                        {resource.title}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600,
                          letterSpacing: '0.12em', textTransform: 'uppercase',
                          padding: '0.2rem 0.5rem', borderRadius: 4,
                          color: am.color, background: `${am.color}18`,
                        }}>{am.label}</span>
                        {resource.version && (
                          <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted }}>{resource.version}</span>
                        )}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>
                      {resource.description}
                    </p>

                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: `1px solid ${T.border}` }}>
                      {resource.availability === 'public' && resource.href ? (
                        <a
                          href={resource.href}
                          style={{
                            fontSize: '0.75rem', fontFamily: T.mono,
                            color: T.accent, textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                          }}
                        >
                          → {resource.hrefLabel}
                        </a>
                      ) : resource.availability === 'draft' ? (
                        <span style={{ fontSize: '0.75rem', fontFamily: T.mono, color: T.textDim }}>
                          ○ In preparation
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontFamily: T.mono, color: T.textMuted }}>
                          ⊙ Internal reference
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{
          padding: '1.5rem', borderRadius: 10,
          background: 'rgba(201,183,135,0.04)',
          border: '1px solid rgba(201,183,135,0.12)',
          marginTop: '1rem',
        }}>
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
            Resources marked <strong style={{ color: T.accent }}>Public</strong> open directly in the platform — no email gates, no forms.{' '}
            <strong style={{ color: T.textDim }}>Internal</strong> resources are operational references not yet available for external distribution.{' '}
            <strong style={{ color: T.textDim }}>Draft</strong> resources are in preparation and will be published when ready.
          </p>
        </div>
      </div>
    </Layout>
  );
}
