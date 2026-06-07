import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader } from '../components/ui';

interface KnowledgeCollection {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  chunkCount: number;
  embeddingModel: string;
  lastIngested: number;
  sizeBytes: number;
  vertical: string;
}

interface RetrievalStep {
  id: string;
  type: 'query_rewrite' | 'retrieve' | 'rerank' | 'filter' | 'synthesize' | 'verify';
  label: string;
  detail: string;
  durationMs: number;
  resultCount?: number;
  confidence?: number;
}

interface RagQuery {
  id: string;
  query: string;
  answer: string;
  steps: RetrievalStep[];
  sources: { title: string; uri: string; score: number; chunk: string }[];
  totalLatencyMs: number;
  tokensUsed: number;
  proofId: string;
}

const COLLECTIONS: KnowledgeCollection[] = [
  { id: 'kc-1', name: 'Governance Policies', description: 'All covenant policies, constitution, compliance frameworks', documentCount: 847, chunkCount: 12340, embeddingModel: 'BAAI/bge-m3', lastIngested: Date.now() - 3600000, sizeBytes: 234000000, vertical: 'Governance' },
  { id: 'kc-2', name: 'Deal Intelligence', description: 'Deal memos, approval chains, revenue forecasts, pipeline data', documentCount: 2341, chunkCount: 45600, embeddingModel: 'BAAI/bge-m3', lastIngested: Date.now() - 1800000, sizeBytes: 567000000, vertical: 'Revenue' },
  { id: 'kc-3', name: 'Security Findings', description: 'Vulnerability reports, threat intel, incident post-mortems', documentCount: 1567, chunkCount: 23400, embeddingModel: 'BAAI/bge-m3', lastIngested: Date.now() - 7200000, sizeBytes: 345000000, vertical: 'Security' },
  { id: 'kc-4', name: 'Agent Execution History', description: 'Workcell traces, proof packets, agent decision logs', documentCount: 8934, chunkCount: 134500, embeddingModel: 'BAAI/bge-m3', lastIngested: Date.now() - 900000, sizeBytes: 1230000000, vertical: 'Operations' },
  { id: 'kc-5', name: 'Maritime Intelligence', description: 'Vessel positions, port schedules, compliance records, sanctions data', documentCount: 4567, chunkCount: 67800, embeddingModel: 'BAAI/bge-m3', lastIngested: Date.now() - 14400000, sizeBytes: 890000000, vertical: 'Maritime' },
  { id: 'kc-6', name: 'Legal Corpus', description: 'Case law, filings, contract templates, regulatory updates', documentCount: 3456, chunkCount: 89000, embeddingModel: 'BAAI/bge-m3', lastIngested: Date.now() - 28800000, sizeBytes: 678000000, vertical: 'Legal' },
];

const DEMO_QUERY: RagQuery = {
  id: 'rq-1',
  query: 'What is the current approval chain policy for deals exceeding $1M, and have there been any recent violations?',
  answer: `Based on the governance corpus and recent execution history, here is the current state:

**Active Policy: COV-APPROVAL-3**
Deals exceeding $1M require explicit human approval from a designated approver at VP level or above. Automated escalation is permitted but automated approval is blocked.

**Recent Violations (Last 30 Days):**
1. **WC-0491 (Vantex Acquisition)** — Approval chain void since March 11. Primary approver departed with no fallback delegate. 3 automated escalation attempts were correctly blocked by the policy. Revenue exposure: $4.2M.

2. **WC-0523 (Stratford Expansion)** — Near-violation flagged. Approver responded 6 hours past SLA but within the 24h grace window. No policy breach, but workflow health impact noted.

**Recommendation:** Configure fallback delegates for all approval chains to prevent future void states. The Vantex situation would have been avoided with a single delegate assignment.`,
  steps: [
    { id: 's-1', type: 'query_rewrite', label: 'Query Understanding', detail: 'Decomposed into 2 sub-queries: (1) approval chain policy for >$1M deals, (2) recent violations/breaches', durationMs: 45, confidence: 0.97 },
    { id: 's-2', type: 'retrieve', label: 'Vector Retrieval', detail: 'Searched Governance Policies collection — top 20 chunks retrieved with bge-m3 embeddings', durationMs: 89, resultCount: 20 },
    { id: 's-3', type: 'retrieve', label: 'Graph Lookup', detail: 'Queried knowledge graph for COV-APPROVAL-* policies linked to deal entities', durationMs: 56, resultCount: 7 },
    { id: 's-4', type: 'retrieve', label: 'Execution History', detail: 'Searched Agent Execution History for workcells with covenant violations in last 30 days', durationMs: 112, resultCount: 34 },
    { id: 's-5', type: 'rerank', label: 'Cross-Encoder Reranking', detail: 'Re-ranked 61 passages using cross-encoder — kept top 12 above 0.7 threshold', durationMs: 78, resultCount: 12, confidence: 0.92 },
    { id: 's-6', type: 'filter', label: 'Policy Compliance Filter', detail: 'Filtered results through covenant compliance checker — removed 2 stale policies', durationMs: 23, resultCount: 10 },
    { id: 's-7', type: 'synthesize', label: 'Answer Generation', detail: 'Synthesized answer from 10 verified passages with citation tracking', durationMs: 890, confidence: 0.94 },
    { id: 's-8', type: 'verify', label: 'Proof Verification', detail: 'Created proof packet PP-31204 — all claims verified against source documents', durationMs: 134, confidence: 0.91 },
  ],
  sources: [
    { title: 'COV-APPROVAL-3 Policy Document', uri: 'a11oy://governance/policies/cov-approval-3', score: 0.97, chunk: 'Section 4.2: Any deal with estimated value exceeding $1,000,000 USD requires explicit human approval from a designated approver...' },
    { title: 'WC-0491 Execution Trace', uri: 'a11oy://workcells/wc-0491/trace', score: 0.94, chunk: 'Step 7 — Approval gate reached. Primary approver David Chen (VP Sales) not found in active directory...' },
    { title: 'Covenant Enforcement Log', uri: 'a11oy://governance/enforcement/2026-04', score: 0.91, chunk: 'April 2026: 3 escalation attempts blocked by COV-APPROVAL-3 for WC-0491. Automated approval bypass denied...' },
    { title: 'WC-0523 Execution Trace', uri: 'a11oy://workcells/wc-0523/trace', score: 0.88, chunk: 'Approval received at T+6h02m. SLA threshold: 6h. Grace window: 24h. Status: within grace, no violation...' },
  ],
  totalLatencyMs: 1427,
  tokensUsed: 3456,
  proofId: 'PP-31204',
};

const MEMORY_TIERS = [
  { name: 'Chronicle', description: 'Permanent organizational narrative', size: '12.4 GB', entries: '234K', retention: 'Forever', icon: '📜' },
  { name: 'Episodic', description: 'Replayable session history', size: '8.7 GB', entries: '89K', retention: '90 days', icon: '🎬' },
  { name: 'Semantic', description: 'Embedded knowledge vectors', size: '34.2 GB', entries: '372K', retention: 'Until superseded', icon: '🧠' },
  { name: 'Working', description: 'Active session context', size: '456 MB', entries: '2.1K', retention: 'Session', icon: '⚡' },
  { name: 'Procedural', description: 'Learned agent workflows', size: '2.1 GB', entries: '12K', retention: 'Until deprecated', icon: '🔧' },
];

function StepPill({ step }: { step: RetrievalStep }) {
  const colorMap: Record<RetrievalStep['type'], string> = {
    query_rewrite: '#8b5cf6',
    retrieve: '#3b82f6',
    rerank: '#f59e0b',
    filter: '#ef4444',
    synthesize: '#22c55e',
    verify: '#c9b787',
  };
  const c = colorMap[step.type];
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${c}15`, border: `1px solid ${c}30` }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{step.label}</span>
          <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>{step.durationMs}ms</span>
          {step.resultCount !== undefined && (
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>{step.resultCount} results</span>
          )}
          {step.confidence !== undefined && (
            <span className="text-[10px] px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: 'rgba(34,197,94,0.7)' }}>
              {(step.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{step.detail}</p>
      </div>
    </div>
  );
}

export function AgenticRag() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'collections' | 'memory'>('pipeline');
  const [expandedSource, setExpandedSource] = useState<number | null>(null);

  const totalDocs = COLLECTIONS.reduce((s, c) => s + c.documentCount, 0);
  const totalChunks = COLLECTIONS.reduce((s, c) => s + c.chunkCount, 0);
  const totalSize = COLLECTIONS.reduce((s, c) => s + c.sizeBytes, 0);

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader
          label="KNOWLEDGE"
          title="Agentic RAG"
          subtitle="Multi-step retrieval, reasoning, and synthesis with governed knowledge"
          status="LIVE"
        />

        <div className="flex gap-1 mb-6">
          {(['pipeline', 'collections', 'memory'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-colors capitalize"
              style={{
                backgroundColor: activeTab === tab ? 'rgba(201,183,135,0.1)' : 'transparent',
                color: activeTab === tab ? '#c9b787' : 'rgba(255,255,255,0.4)',
              }}
            >
              {tab === 'pipeline' ? 'RAG Pipeline' : tab === 'collections' ? 'Knowledge Collections' : 'Memory Fabric'}
            </button>
          ))}
        </div>

        {activeTab === 'pipeline' && (
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Query</div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{DEMO_QUERY.query}</p>
              </div>

              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Agentic Pipeline — {DEMO_QUERY.steps.length} steps · {DEMO_QUERY.totalLatencyMs}ms total</div>
                <div className="pl-3" style={{ borderLeft: '2px solid rgba(201,183,135,0.1)' }}>
                  {DEMO_QUERY.steps.map((step) => (
                    <StepPill key={step.id} step={step} />
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Synthesized Answer</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: 'rgba(34,197,94,0.6)' }}>
                    verified · {DEMO_QUERY.proofId}
                  </span>
                </div>
                <div
                  className="text-sm leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                  dangerouslySetInnerHTML={{
                    __html: DEMO_QUERY.answer
                      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:rgba(255,255,255,0.95)">$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }}
                />
                <div className="flex items-center gap-4 mt-4 pt-3 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span>{DEMO_QUERY.totalLatencyMs}ms latency</span>
                  <span>{DEMO_QUERY.tokensUsed.toLocaleString()} tokens</span>
                  <span>{DEMO_QUERY.sources.length} sources cited</span>
                </div>
              </div>
            </div>

            <div className="w-80 flex-shrink-0">
              <div className="sticky top-6">
                <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Sources ({DEMO_QUERY.sources.length})</div>
                <div className="flex flex-col gap-2">
                  {DEMO_QUERY.sources.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setExpandedSource(expandedSource === i ? null : i)}
                      className="w-full p-3 rounded-lg text-left transition-colors"
                      style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${expandedSource === i ? 'rgba(201,183,135,0.15)' : 'rgba(255,255,255,0.06)'}` }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{src.title}</span>
                        <span className="text-[10px] font-mono ml-2 flex-shrink-0" style={{ color: 'rgba(34,197,94,0.6)' }}>
                          {(src.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-[10px] font-mono truncate" style={{ color: 'rgba(201,183,135,0.4)' }}>{src.uri}</div>
                      {expandedSource === i && (
                        <div className="mt-2 p-2 rounded text-[10px] leading-relaxed" style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)' }}>
                          {src.chunk}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-3 rounded-lg" style={{ backgroundColor: 'rgba(201,183,135,0.03)', border: '1px solid rgba(201,183,135,0.08)' }}>
                  <div className="text-[10px] font-semibold mb-2" style={{ color: '#c9b787' }}>What makes this Agentic</div>
                  <div className="space-y-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <p><strong style={{ color: 'rgba(255,255,255,0.6)' }}>Multi-step retrieval</strong> — queries are decomposed, routed to multiple collections, and iteratively refined.</p>
                    <p><strong style={{ color: 'rgba(255,255,255,0.6)' }}>Self-correcting</strong> — if initial retrieval is insufficient, the agent autonomously broadens or narrows its search.</p>
                    <p><strong style={{ color: 'rgba(255,255,255,0.6)' }}>Knowledge graph + vectors</strong> — hybrid retrieval combining semantic similarity with structured relationships.</p>
                    <p><strong style={{ color: 'rgba(255,255,255,0.6)' }}>Governed synthesis</strong> — every answer carries a proof packet linking claims to source documents.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="grid grid-cols-2 gap-4">
            {COLLECTIONS.map((c) => (
              <div key={c.id} className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{c.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: 'rgba(201,183,135,0.6)' }}>
                    {c.vertical}
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Documents', value: c.documentCount.toLocaleString() },
                    { label: 'Chunks', value: c.chunkCount.toLocaleString() },
                    { label: 'Size', value: `${(c.sizeBytes / 1e6).toFixed(0)} MB` },
                    { label: 'Model', value: c.embeddingModel },
                  ].map((m, i) => (
                    <div key={i}>
                      <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{m.label}</div>
                      <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'memory' && (
          <div>
            <div className="grid grid-cols-5 gap-3 mb-6">
              {MEMORY_TIERS.map((t) => (
                <div key={t.name} className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{t.name}</div>
                  <div className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.description}</div>
                  <div className="text-lg font-semibold" style={{ color: '#c9b787' }}>{t.size}</div>
                  <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{t.entries} entries</div>
                  <div className="text-[10px] mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>TTL: {t.retention}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(201,183,135,0.03)', border: '1px solid rgba(201,183,135,0.08)' }}>
              <h4 className="text-xs font-semibold mb-3" style={{ color: '#c9b787' }}>Memory Fabric Architecture</h4>
              <div className="grid grid-cols-3 gap-6 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <div>
                  <div className="font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Ingestion Pipeline</div>
                  <p>Documents flow through chunking (recursive, semantic, or sliding window), embedding (bge-m3), and indexing (HNSW + IVF). Metadata is extracted and linked to the knowledge graph.</p>
                </div>
                <div>
                  <div className="font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Retrieval Strategy</div>
                  <p>Hybrid retrieval combines dense vectors (cosine similarity), sparse BM25, and knowledge graph traversal. Results are re-ranked with a cross-encoder before synthesis.</p>
                </div>
                <div>
                  <div className="font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Governed Provenance</div>
                  <p>Every retrieved passage carries provenance metadata — source document, ingestion timestamp, freshness score, sensitivity level, and retention policy.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
