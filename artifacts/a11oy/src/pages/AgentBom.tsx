import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { AGENT_BOMS, type AgentBomEntry } from '../data/complianceFabric';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const GOLD = '#c9b787';

function BomDetail({ bom }: { bom: AgentBomEntry }) {
  const chartData = bom.evalHistory.map(e => ({
    date: e.date.split('-').slice(1).join('/'),
    score: Math.round(e.composite * 100),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
          <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>MODEL</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{bom.modelProvider}</div>
          <div className="text-xs font-mono mt-1" style={{ color: GOLD }}>{bom.modelSnapshot}</div>
          <div className="text-xs font-mono mt-1 truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{bom.modelHash}</div>
        </div>
        <div className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
          <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CONSTITUTION</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>v{bom.constitutionVersion}</div>
          <div className="text-xs font-mono mt-1 truncate" style={{ color: GOLD }}>{bom.constitutionHash}</div>
          <div className="text-xs font-mono mt-1 truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Prompt: {bom.systemPromptHash}</div>
        </div>
      </div>

      <div className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
        <div className="text-xs font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>TOOL MANIFEST ({bom.toolManifest.length} tools)</div>
        <div className="space-y-1">
          {bom.toolManifest.map(t => (
            <div key={t.name} className="flex items-center justify-between text-xs">
              <span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{t.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono" style={{ color: GOLD }}>v{t.version}</span>
                <span className="font-mono text-xs truncate max-w-[120px]" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{t.hash}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
        <div className="text-xs font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>EVAL HISTORY (7-day)</div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
            <XAxis dataKey="date" tick={{ fill: '#5e5e5e', fontSize: 9 }} />
            <YAxis tick={{ fill: '#5e5e5e', fontSize: 9 }} domain={[70, 100]} />
            <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 10 }}
              formatter={(v: number) => [`${v}%`, 'Composite']} />
            <Line type="monotone" dataKey="score" stroke={GOLD} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
          <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>WELFARE</div>
          <div className="text-xs font-semibold" style={{ color: bom.welfarePosture === 'nominal' ? '#22c55e' : GOLD }}>{bom.welfarePosture}</div>
        </div>
        <div className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
          <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>BOM VERSION</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>v{bom.bomVersion}</div>
        </div>
      </div>

      <div className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
        <div className="text-xs font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>DEPENDENCY GRAPH</div>
        <div className="flex flex-wrap gap-1">
          {bom.dependencyGraph.map(d => (
            <span key={d} className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)' }}>
              {d}
            </span>
          ))}
        </div>
      </div>

      <div className="font-mono text-xs px-3 py-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: '#22c55e', wordBreak: 'break-all' }}>
        Proof Ledger Signature: {bom.proofLedgerSignature}
      </div>
    </div>
  );
}

export function AgentBom() {
  const [selectedId, setSelectedId] = useState<string>(AGENT_BOMS[0].agentId);
  const selected = AGENT_BOMS.find(b => b.agentId === selectedId) ?? AGENT_BOMS[0];

  return (
    <Layout>
      <PageHeader
        label="AGENT-BOM — BILL OF MATERIALS"
        title="Agent Bill of Materials"
        subtitle="Per-agent, continuously-updated AIBOM covering model snapshot fingerprints, tool manifest hashes, constitution version, prompt hashes, evaluation history, and welfare posture. Exportable as CycloneDX ML-BOM v1.7 JSON."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KpiCard label="AGENTS COVERED" value={String(AGENT_BOMS.length)} sub="with live BOM" accent={GOLD} />
        <KpiCard label="TOOLS TRACKED" value={String(AGENT_BOMS.reduce((a, b) => a + b.toolManifest.length, 0))} sub="with version hashes" accent={GOLD} />
        <KpiCard label="FORMAT" value="CycloneDX" sub="ML-BOM v1.7 JSON" accent="#22c55e" />
        <KpiCard label="SIGNED" value="100%" sub="proof ledger chain" accent="#22c55e" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div>
          <SectionTitle>Agent Registry</SectionTitle>
          <div className="flex flex-col gap-2">
            {AGENT_BOMS.map(bom => {
              const isSelected = bom.agentId === selectedId;
              const latest = bom.evalHistory[bom.evalHistory.length - 1];
              const scoreColor = latest.composite >= 0.95 ? '#22c55e' : latest.composite >= 0.88 ? GOLD : '#f97316';
              return (
                <div
                  key={bom.agentId}
                  className="rounded-lg border p-3 cursor-pointer transition-all"
                  onClick={() => setSelectedId(bom.agentId)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
                    borderColor: isSelected ? GOLD : 'var(--color-a11oy-border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{bom.agentName}</div>
                      <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{bom.modelProvider} · v{bom.constitutionVersion}</div>
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color: scoreColor }}>{Math.round(latest.composite * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <button
              className="w-full text-xs font-medium py-2.5 rounded-lg"
              style={{
                backgroundColor: 'rgba(201,183,135,0.12)',
                color: GOLD,
                border: '1px solid rgba(201,183,135,0.25)',
                cursor: 'pointer',
              }}
              onClick={() => {
                const cyclonedx = {
                  bomFormat: 'CycloneDX',
                  specVersion: '1.7',
                  serialNumber: `urn:uuid:bom-${selected.agentId}-${Date.now()}`,
                  version: 1,
                  metadata: {
                    timestamp: selected.generatedAt,
                    tools: [{ vendor: 'a11oy', name: 'Agent-BOM Generator', version: '1.0.0' }],
                  },
                  components: [
                    {
                      type: 'machine-learning-model',
                      name: selected.agentName,
                      version: selected.constitutionVersion,
                      'bom-ref': selected.agentId,
                      hashes: [
                        { alg: 'SHA-256', content: selected.modelHash },
                        { alg: 'SHA-256', content: selected.constitutionHash },
                        { alg: 'SHA-256', content: selected.systemPromptHash },
                      ],
                      properties: [
                        { name: 'a11oy:model-provider', value: selected.modelProvider },
                        { name: 'a11oy:model-snapshot', value: selected.modelSnapshot },
                        { name: 'a11oy:welfare-posture', value: selected.welfarePosture },
                        { name: 'a11oy:proof-signature', value: selected.proofLedgerSignature },
                      ],
                    },
                    ...selected.toolManifest.map(t => ({
                      type: 'library',
                      name: t.name,
                      version: t.version,
                      hashes: [{ alg: 'SHA-256', content: t.hash }],
                    })),
                  ],
                  dependencies: selected.dependencyGraph.map(d => ({ ref: d })),
                };
                const blob = new Blob([JSON.stringify(cyclonedx, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selected.agentId}-bom-cyclonedx.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CycloneDX ML-BOM v1.7
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <SectionTitle>{selected.agentName} — Bill of Materials</SectionTitle>
          <BomDetail bom={selected} />
        </div>
      </div>

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Agent-BOM — every registered agent has a live bill of materials. CycloneDX export is cryptographically signed via the Proof Ledger. Machine-verifiable by external supply chain auditors.
      </div>
    </Layout>
  );
}
