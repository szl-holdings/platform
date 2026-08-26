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

type Availability = 'source' | 'internal' | 'draft';

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
    description:
      'A source view of the eleven blueprint components, seven governing principles, and implementation priorities. It documents intended architecture; it is not evidence of a deployed runtime.',
    availability: 'source',
    version: 'source',
    href: '/a11oy/architecture',
    hrefLabel: 'Open Architecture page',
  },
  {
    id: 'platform-definition',
    title: 'Platform Definition',
    category: 'Document',
    description:
      'An internal definition artifact covering intended product boundaries, positioning, and design principles. No externally available resource is claimed here.',
    availability: 'internal',
    version: null,
    href: null,
    hrefLabel: null,
  },
  {
    id: 'applications-catalog',
    title: 'Applications Catalog',
    category: 'Document',
    description:
      'An internal catalog concept for governed applications, status labels, and domain groupings. This card does not claim operational applications or registry completeness.',
    availability: 'internal',
    version: null,
    href: null,
    hrefLabel: null,
  },
  {
    id: 'agentic-blueprint',
    title: 'Agentic AI Blueprint',
    category: 'Document',
    description:
      'An internal blueprint describing proposed governed-agent design principles, components, implementation priorities, and positioning guidance.',
    availability: 'internal',
    version: 'v1.0',
    href: null,
    hrefLabel: null,
  },
  {
    id: 'mcp-readiness',
    title: 'MCP Readiness Assessment Framework',
    category: 'Document',
    description:
      'A draft methodology for evaluating MCP gateway readiness across auth mode, write gates, approval depth, evidence boundaries, and connector trust.',
    availability: 'draft',
    version: 'v0.7-draft',
    href: null,
    hrefLabel: null,
  },
  {
    id: 'pce-spec',
    title: 'Proof-Carrying Execution',
    category: 'Specification',
    description:
      'A design-stage outline for a proof-carrying execution contract. No external verification service, immutable ledger, or deployed append path is claimed.',
    availability: 'draft',
    version: 'v0.1-demo',
    href: null,
    hrefLabel: null,
  },
  {
    id: 'governance-spec',
    title: 'Governance Framework',
    category: 'Specification',
    description:
      'A source-backed governance demo showing approval tiers, policy fixtures, and seeded decisions. It does not execute or verify external actions.',
    availability: 'source',
    version: 'demo source',
    href: '/a11oy/governance',
    hrefLabel: 'Open Governance page',
  },
  {
    id: 'covenant-policy',
    title: 'Covenant Policy Authoring Guide',
    category: 'Guide',
    description:
      'An internal authoring reference for proposed policy-as-code gates, approval tiers, enforcement modes, and override audit trails.',
    availability: 'internal',
    version: null,
    href: null,
    hrefLabel: null,
  },
  {
    id: 'guide-mcp',
    title: 'MCP Gateway Integration',
    category: 'Guide',
    description:
      'An internal design guide for proposed MCP containment boundaries, allowlists, egress rules, injection scanning, and consent gating.',
    availability: 'internal',
    version: null,
    href: null,
    hrefLabel: null,
  },
  {
    id: 'guide-vertical',
    title: 'Vertical Pack Development',
    category: 'Guide',
    description:
      'An internal design guide for signal schemas, forecast fixtures, recommendation contracts, and proof-boundary conventions in a vertical pack.',
    availability: 'internal',
    version: null,
    href: null,
    hrefLabel: null,
  },
  {
    id: 'fabric-layer',
    title: 'Fabric Layer',
    category: 'SDK',
    description:
      'A source viewer for shared types, connector boundaries, schema contracts, and validators in @workspace/a11oy-fabric. Displayed contracts are not proof of deployed connectors.',
    availability: 'source',
    version: 'source',
    href: '/a11oy/fabric',
    hrefLabel: 'Open Fabric viewer',
  },
  {
    id: 'sdk-py',
    title: 'Python Vertical Pack SDK',
    category: 'SDK',
    description:
      'An internal SDK concept for signal, forecast, recommendation, and brief contracts. External package availability is not claimed.',
    availability: 'internal',
    version: null,
    href: null,
    hrefLabel: null,
  },
  {
    id: 'api-fabric',
    title: 'Fabric API Reference',
    category: 'API',
    description:
      'An internal route-contract reference for proposed signal, outcome, action, proof, governance, fabric, and Workcell reads. It is not external endpoint evidence.',
    availability: 'internal',
    version: null,
    href: null,
    hrefLabel: null,
  },
  {
    id: 'api-runtime',
    title: 'Runtime API Reference',
    category: 'API',
    description:
      'An internal route-contract reference for proposed approvals, Workcell actions, tool execution, evaluations, and proof gates. No deployed write API is claimed.',
    availability: 'internal',
    version: null,
    href: null,
    hrefLabel: null,
  },
];

const CATEGORIES = ['All', 'Document', 'Specification', 'Guide', 'SDK', 'API'];

const AVAILABILITY_META: Record<Availability, { color: string; label: string }> = {
  source: { color: '#c9b787', label: 'Source' },
  internal: { color: '#5e5e5e', label: 'Internal only' },
  draft: { color: '#8a8a8a', label: 'Draft' },
};

const CAT_ICONS: Record<string, string> = {
  Document: '▣',
  Specification: '◆',
  Guide: '◉',
  SDK: '⬟',
  API: '⬡',
};

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function ResourcesHub() {
  const [category, setCategory] = useState('All');

  const filtered =
    category === 'All' ? RESOURCES : RESOURCES.filter((r) => r.category === category);

  const grouped = CATEGORIES.filter((c) => c !== 'All')
    .map((cat) => ({
      cat,
      items: filtered.filter((r) => r.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const sourceCount = RESOURCES.filter((r) => r.availability === 'source').length;

  return (
    <Layout>
      <main id="main-content" tabIndex={-1} style={{ paddingBottom: '4rem', outline: 'none' }}>
        <div
          style={{
            padding: '3rem 0 2.5rem',
            borderBottom: `1px solid ${T.border}`,
            marginBottom: '2.5rem',
          }}
        >
          <p
            style={{
              fontSize: '0.625rem',
              fontFamily: T.mono,
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: T.textMuted,
              margin: '0 0 1.25rem',
            }}
          >
            Resources
          </p>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontFamily: T.serif,
              fontWeight: 400,
              letterSpacing: '-0.03em',
              color: T.text,
              lineHeight: 1.1,
              margin: '0 0 1rem',
            }}
          >
            Architecture, Guides & References
          </h1>
          <p
            style={{
              fontSize: '1.0625rem',
              lineHeight: 1.7,
              color: T.textDim,
              maxWidth: '64ch',
              margin: 0,
            }}
          >
            {sourceCount} source-backed views link directly. Internal and draft references remain
            unavailable and are labeled without implying deployment or public distribution.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={isActive}
                style={{
                  padding: '0.4rem 0.875rem',
                  borderRadius: 6,
                  minWidth: 44,
                  minHeight: 44,
                  fontSize: '0.75rem',
                  fontFamily: T.mono,
                  fontWeight: 500,
                  border: `1px solid ${isActive ? 'rgba(201,183,135,0.3)' : T.border}`,
                  background: isActive ? 'rgba(201,183,135,0.1)' : 'rgba(255,255,255,0.03)',
                  color: isActive ? T.accent : T.textDim,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                marginBottom: '1rem',
              }}
            >
              <span style={{ color: T.accent, fontSize: '0.875rem' }}>{CAT_ICONS[cat]}</span>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: T.mono,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: T.textMuted,
                }}
              >
                {cat}s
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1px',
                background: T.border,
                borderRadius: 12,
                overflow: 'hidden',
                border: `1px solid ${T.border}`,
              }}
            >
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
                      padding: '1.5rem',
                      background: T.bg,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: T.text,
                          letterSpacing: '-0.015em',
                        }}
                      >
                        {resource.title}
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '0.25rem',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.5625rem',
                            fontFamily: T.mono,
                            fontWeight: 600,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 4,
                            color: am.color,
                            background: `${am.color}18`,
                          }}
                        >
                          {am.label}
                        </span>
                        {resource.version && (
                          <span
                            style={{
                              fontSize: '0.5625rem',
                              fontFamily: T.mono,
                              color: T.textMuted,
                            }}
                          >
                            {resource.version}
                          </span>
                        )}
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: '0.8125rem',
                        lineHeight: 1.65,
                        color: T.textDim,
                        margin: 0,
                      }}
                    >
                      {resource.description}
                    </p>

                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '0.5rem',
                        borderTop: `1px solid ${T.border}`,
                      }}
                    >
                      {resource.availability === 'source' && resource.href ? (
                        <a
                          href={resource.href}
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: T.mono,
                            color: T.accent,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            minWidth: 44,
                            minHeight: 44,
                          }}
                        >
                          → {resource.hrefLabel}
                        </a>
                      ) : resource.availability === 'draft' ? (
                        <span style={{ fontSize: '0.75rem', fontFamily: T.mono, color: T.textDim }}>
                          ○ In preparation
                        </span>
                      ) : (
                        <span
                          style={{ fontSize: '0.75rem', fontFamily: T.mono, color: T.textMuted }}
                        >
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

        <div
          style={{
            padding: '1.5rem',
            borderRadius: 10,
            background: 'rgba(201,183,135,0.04)',
            border: '1px solid rgba(201,183,135,0.12)',
            marginTop: '1rem',
          }}
        >
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
            Resources marked <strong style={{ color: T.accent }}>Source</strong> open a checked-in
            explanatory or deterministic demo view.{' '}
            <strong style={{ color: T.textDim }}>Internal only</strong> identifies design material
            with no external resource linked. <strong style={{ color: T.textDim }}>Draft</strong>{' '}
            means the contract is still being shaped; publication, deployment, and operational
            availability are not claimed.
          </p>
        </div>
      </main>
    </Layout>
  );
}
