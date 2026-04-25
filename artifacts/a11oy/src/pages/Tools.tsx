import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { SEED_TOOLS } from '@workspace/a11oy-fabric';

const CATEGORY_COLORS: Record<string, string> = {
  'api-caller': '#06b6d4',
  'document-reader': '#3b82f6',
  'crm-query': '#f59e0b',
  'policy-checker': '#b08d52',
  'email-sender': '#8b5cf6',
  'slack-notify': '#6366f1',
  'pdf-generator': '#ec4899',
  'data-analyzer': '#10b981',
  'risk-scorer': '#ef4444',
  'approval-gateway': '#8b5cf6',
  'evidence-packager': '#b08d52',
  'twin-updater': '#06b6d4',
  'proof-issuer': '#b08d52',
  'mirror-eval-runner': '#6366f1',
  'knowledge-retriever': '#3b82f6',
};

const GOVERNANCE_COLORS: Record<string, string> = {
  'external-network': '#ef4444',
  'secret-access': '#f59e0b',
  'data-privacy-sensitive': '#8b5cf6',
  'pii-access': '#ef4444',
  'write-access': '#f59e0b',
  'approval-required': '#8b5cf6',
  'audit-logged': '#10b981',
  'rate-limited': '#9bacc4',
};

const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'Lyte Revenue', 'vessels-maritime': 'Vessels Maritime', 'terra-real-estate': 'Terra Real Estate',
  'aegis-defense': 'Aegis Defense', 'prism-counsel': 'Counsel', 'carlota-jo': 'Carlota Jo',
  'alloy-core': 'Alloy Core', 'global': 'Global',
};

const CATEGORIES = Array.from(new Set(SEED_TOOLS.map(t => t.category)));

export function Tools() {
  const [filterCat, setFilterCat] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = SEED_TOOLS.filter(t =>
    (filterCat === 'all' || t.category === filterCat) &&
    (filterVertical === 'all' || t.vertical === filterVertical)
  );

  const hasApprovalRequired = SEED_TOOLS.filter(t => t.governanceFlags.includes('approval-required'));
  const globalTools = SEED_TOOLS.filter(t => t.vertical === 'global');
  const verticals = Array.from(new Set(SEED_TOOLS.map(t => t.vertical)));

  const selectedTool = selected ? SEED_TOOLS.find(t => t.id === selected) : null;

  return (
    <Layout>
      <PageHeader
        label="TOOL REGISTRY"
        title="Operator Tool Registry"
        subtitle="Discrete, composable tools available to A11oy operators. Each tool has a defined input schema, output schema, and governance flags."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TOTAL TOOLS" value={SEED_TOOLS.length} sub="registered" accent="#10b981" />
        <KpiCard label="GLOBAL TOOLS" value={globalTools.length} sub="all verticals" accent="#3b82f6" />
        <KpiCard label="APPROVAL REQUIRED" value={hasApprovalRequired.length} sub="governance gated" accent="#8b5cf6" />
        <KpiCard label="CATEGORIES" value={CATEGORIES.length} sub="distinct types" accent="#b08d52" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterCat('all')}
            className="text-xs px-2.5 py-1 rounded font-mono"
            style={{ backgroundColor: filterCat === 'all' ? 'rgba(59,130,246,0.15)' : 'var(--color-a11oy-muted)', color: filterCat === 'all' ? '#3b82f6' : 'var(--color-a11oy-text-ghost)', border: filterCat === 'all' ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent', cursor: 'pointer' }}
          >
            All categories
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className="text-xs px-2.5 py-1 rounded font-mono"
              style={{ backgroundColor: filterCat === c ? `${CATEGORY_COLORS[c] ?? '#3b82f6'}20` : 'var(--color-a11oy-muted)', color: filterCat === c ? CATEGORY_COLORS[c] ?? '#3b82f6' : 'var(--color-a11oy-text-ghost)', border: 'none', cursor: 'pointer' }}
            >
              {c}
            </button>
          ))}
        </div>
        <select
          value={filterVertical}
          onChange={e => setFilterVertical(e.target.value)}
          className="text-xs rounded px-2 py-1 border"
          style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
        >
          <option value="all">All verticals</option>
          {verticals.map(v => <option key={v} value={v}>{VERTICAL_LABELS[v] ?? v}</option>)}
        </select>
        <span className="text-xs self-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{filtered.length} tools</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tool grid */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3 content-start">
          {filtered.map(t => {
            const catColor = CATEGORY_COLORS[t.category] ?? '#9bacc4';
            const isSelected = t.id === selected;
            return (
              <Card
                key={t.id}
                className="cursor-pointer transition-all"
                onClick={() => setSelected(isSelected ? null : t.id)}
                style={{ borderColor: isSelected ? '#3b82f6' : 'var(--color-a11oy-border)', backgroundColor: isSelected ? 'rgba(59,130,246,0.04)' : undefined } as React.CSSProperties}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{t.name}</div>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${catColor}18`, color: catColor }}>{t.category}</span>
                  </div>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                    {VERTICAL_LABELS[t.vertical] ?? t.vertical}
                  </span>
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{t.description}</p>
                <div className="flex flex-wrap gap-1">
                  {t.governanceFlags.slice(0, 3).map(flag => (
                    <span key={flag} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${GOVERNANCE_COLORS[flag] ?? '#9bacc4'}18`, color: GOVERNANCE_COLORS[flag] ?? '#9bacc4' }}>
                      {flag}
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-2 py-12 text-center text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No tools match the current filters.</div>
          )}
        </div>

        {/* Right: tool detail or stats */}
        <div className="flex flex-col gap-4">
          {selectedTool ? (
            <Card>
              <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>TOOL DETAIL</div>
              <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{selectedTool.name}</div>
              <div className="text-xs mb-3 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selectedTool.id}</div>
              <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedTool.description}</p>
              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div>
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CATEGORY</div>
                  <div style={{ color: CATEGORY_COLORS[selectedTool.category] ?? '#9bacc4' }}>{selectedTool.category}</div>
                </div>
                <div>
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>VERTICAL</div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{VERTICAL_LABELS[selectedTool.vertical] ?? selectedTool.vertical}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>INPUT SCHEMA</div>
                  <div className="font-mono p-2 rounded text-xs" style={{ backgroundColor: 'var(--color-a11oy-deep)', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)' }}>
                    {JSON.stringify(selectedTool.inputSchema, null, 1).slice(0, 120)}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>OUTPUT SCHEMA</div>
                  <div className="font-mono p-2 rounded text-xs" style={{ backgroundColor: 'var(--color-a11oy-deep)', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)' }}>
                    {JSON.stringify(selectedTool.outputSchema, null, 1).slice(0, 120)}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>GOVERNANCE FLAGS</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTool.governanceFlags.map(flag => (
                      <span key={flag} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${GOVERNANCE_COLORS[flag] ?? '#9bacc4'}18`, color: GOVERNANCE_COLORS[flag] ?? '#9bacc4', border: `1px solid ${GOVERNANCE_COLORS[flag] ?? '#9bacc4'}30` }}>
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CATEGORY BREAKDOWN</div>
              <div className="flex flex-col gap-2">
                {CATEGORIES.map(cat => {
                  const count = SEED_TOOLS.filter(t => t.category === cat).length;
                  const color = CATEGORY_COLORS[cat] ?? '#9bacc4';
                  return (
                    <div key={cat} className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{cat}</span>
                      <span className="font-mono" style={{ color }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Vertical coverage */}
          <div>
            <SectionTitle>By Vertical</SectionTitle>
            <div className="flex flex-col gap-2">
              {verticals.map(vertical => {
                const tools = SEED_TOOLS.filter(t => t.vertical === vertical);
                const flagged = tools.filter(t => t.governanceFlags.length > 0).length;
                return (
                  <Card key={vertical} className="text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{VERTICAL_LABELS[vertical] ?? vertical}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono" style={{ color: '#8b5cf6' }}>{flagged} gated</span>
                        <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{tools.length} total</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
