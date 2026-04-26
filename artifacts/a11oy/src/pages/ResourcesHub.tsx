import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, KpiCard, Card, SectionTitle } from '../components/ui';

const RESOURCES = [
  { id: 'sdk-ts', title: 'TypeScript SDK', category: 'SDK', description: '@workspace/a11oy-fabric — shared types, seed data, schema contracts, and Zod validators for the A11oy execution fabric.', status: 'available', version: '4.2.0' },
  { id: 'sdk-py', title: 'Python Vertical Pack SDK', category: 'SDK', description: 'services/verticals/contracts.py — substrate recommendation contracts for all 12 verticals. Signal, forecast, recommendation, and brief modules.', status: 'available', version: '1.0.0' },
  { id: 'api-fabric', title: 'Fabric API Reference', category: 'API', description: 'Phase 1 Foundation — GET /a11oy/signals, /outcomes, /actions, /proof, /governance, /verticals, /fabric, /workcells.', status: 'available', version: '1.0' },
  { id: 'api-runtime', title: 'Runtime API Reference', category: 'API', description: 'Phase 2 Runtime — POST /a11oy/signals, /actions/:id/approve, /workcells, /tools/:id/run, /evals/run, PCE gate.', status: 'available', version: '2.0' },
  { id: 'api-sovereign', title: 'Sovereign API Reference', category: 'API', description: 'Phase 3 Sovereign — multi-tenant orchestration, model routing, eval lab, connector firewall, boardroom mode.', status: 'available', version: '3.0' },
  { id: 'api-public', title: 'Public API Reference', category: 'API', description: 'Unauthenticated read-only — GET /api/public/a11oy/constellation, /applications, /architecture, /resources.', status: 'available', version: '1.0' },
  { id: 'api-internal', title: 'Internal API Reference', category: 'API', description: 'Authenticated operational — GET /api/internal/a11oy/readiness, /mcp/readiness, /verticals/health, /storage/status.', status: 'available', version: '1.0' },
  { id: 'guide-pce', title: 'Proof-Carrying Execution Guide', category: 'Guide', description: 'How PCE contracts bind every workcell to its evidence chain, approval record, and cryptographic output hash.', status: 'available', version: null },
  { id: 'guide-covenant', title: 'Covenant Policy Authoring', category: 'Guide', description: 'Writing and deploying policy-as-code gates for governed execution. Approval tiers, policy clauses, enforcement modes.', status: 'available', version: null },
  { id: 'guide-mcp', title: 'MCP Gateway Integration', category: 'Guide', description: 'Connecting external MCP servers through the A11oy containment firewall. Allowlists, egress rules, injection scanning.', status: 'available', version: null },
  { id: 'guide-vertical', title: 'Vertical Pack Development', category: 'Guide', description: 'Building a new vertical pack — signals.py, forecast.py, recommendations.py, brief.py structure and contracts.', status: 'available', version: null },
  { id: 'guide-storage', title: 'Storage Provider Registry', category: 'Guide', description: 'Configuring retention policies, storage modes (database, object-store, local-cache, disabled), and TTL categories.', status: 'available', version: null },
  { id: 'pub-whitepaper', title: 'Governed AI Operating System', category: 'Publication', description: 'Architecture overview, competitive differentiation, and proof-chain design rationale. Board-ready format.', status: 'draft', version: 'v0.9-draft' },
  { id: 'pub-pce-spec', title: 'PCE Specification v1.0', category: 'Publication', description: 'Formal specification of the Proof-Carrying Execution contract format, hash algorithm, and verification protocol.', status: 'available', version: '1.0' },
  { id: 'pub-mcp-readiness', title: 'MCP Readiness Assessment Framework', category: 'Publication', description: 'Methodology for evaluating MCP gateway readiness: auth mode, write gate, approval depth, evidence chain.', status: 'draft', version: 'v0.7-draft' },
];

const CATEGORIES = ['All', 'SDK', 'API', 'Guide', 'Publication'];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  available: { bg: 'rgba(201,183,135,0.12)', color: '#c9b787' },
  draft:     { bg: 'rgba(138,138,138,0.12)', color: '#8a8a8a' },
};

const CAT_ICONS: Record<string, string> = {
  SDK: '⬟', API: '◆', Guide: '◉', Publication: '▣',
};

export function ResourcesHub() {
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = RESOURCES.filter(r =>
    (category === 'All' || r.category === category) &&
    (statusFilter === 'all' || r.status === statusFilter)
  );

  return (
    <Layout>
      <PageHeader
        label="RESOURCES"
        title="Documentation & SDK References"
        subtitle="Everything you need to build on, integrate with, and extend the A11oy governed execution fabric — from TypeScript types to formal specifications."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="TOTAL RESOURCES" value={RESOURCES.length} sub="available" accent="#c9b787" />
        <KpiCard label="SDKS" value={RESOURCES.filter(r => r.category === 'SDK').length} sub="packages" accent="#c9b787" />
        <KpiCard label="API REFS" value={RESOURCES.filter(r => r.category === 'API').length} sub="endpoints documented" accent="#c9b787" />
        <KpiCard label="GUIDES" value={RESOURCES.filter(r => r.category === 'Guide').length} sub="integration guides" accent="#8a8a8a" />
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="flex gap-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1 rounded text-xs font-mono transition-all flex items-center gap-1"
              style={{
                background: category === cat ? 'rgba(201,183,135,0.15)' : 'rgba(255,255,255,0.04)',
                color: category === cat ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
                border: `1px solid ${category === cat ? 'rgba(201,183,135,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {cat !== 'All' && <span>{CAT_ICONS[cat]}</span>}
              {cat}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <div className="flex gap-1">
          {['all', 'available', 'draft'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1 rounded text-xs font-mono transition-all"
              style={{
                background: statusFilter === s ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                color: statusFilter === s ? 'var(--color-a11oy-text)' : 'var(--color-a11oy-text-ghost)',
                border: `1px solid ${statusFilter === s ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >{s.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {CATEGORIES.filter(cat => cat !== 'All').map(cat => {
        const items = filtered.filter(r => r.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="mb-8">
            <SectionTitle>{CAT_ICONS[cat]} {cat}s</SectionTitle>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(resource => {
                const ss = STATUS_STYLES[resource.status] ?? STATUS_STYLES.draft;
                return (
                  <Card key={resource.id} className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{resource.title}</span>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: ss.bg, color: ss.color }}>{resource.status}</span>
                        {resource.version && (
                          <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{resource.version}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{resource.description}</p>
                    <button
                      className="mt-auto text-xs font-mono text-left transition-colors"
                      style={{ color: 'rgba(201,183,135,0.5)', cursor: 'default' }}
                    >
                      {resource.status === 'draft' ? '○ Draft — coming soon' : '→ View reference'}
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </Layout>
  );
}
