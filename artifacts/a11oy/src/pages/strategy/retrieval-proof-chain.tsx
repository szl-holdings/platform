/**
 * Retrieval Proof-Chain Explorer
 *
 * Operator surface that runs a live two-stage retrieval query via the
 * /api/retrieval/proof-chain endpoint and displays the full proof chain:
 * ranked evidence, confidence deltas, and model provenance at each stage.
 *
 * Ships functional in Phase 4. Visual polish is deferred to Phase 6.
 */

import {
  ProofChainViewer,
  type RetrievalModality,
  type RetrievalProofChain,
} from '@szl-holdings/design-system/proof';
import { useState } from 'react';
import { ACCENT, apiUrl, fetchJson } from '../cognitive/shared';

const STRATEGIES = ['hybrid', 'semantic', 'keyword'] as const;
const MODALITY_OPTIONS: { value: RetrievalModality; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'screenshot', label: 'Screenshots' },
  { value: 'diagram', label: 'Diagrams' },
  { value: 'audio_transcript', label: 'Audio transcripts' },
];

export function RetrievalProofChainPage() {
  const [query, setQuery] = useState('retrieval pipeline embedding proof chain');
  const [strategy, setStrategy] = useState<string>('hybrid');
  const [selectedModalities, setSelectedModalities] = useState<RetrievalModality[]>(['text']);
  const [chain, setChain] = useState<RetrievalProofChain | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleModality(m: RetrievalModality) {
    setSelectedModalities((prev) =>
      prev.includes(m) ? (prev.length === 1 ? prev : prev.filter((x) => x !== m)) : [...prev, m],
    );
  }

  async function runRetrieval() {
    if (!query.trim()) return;
    setLoading(true);
    setChain(null);
    setError(null);

    try {
      const envelope = await fetchJson<{ data: { proofChain: RetrievalProofChain } }>(
        apiUrl('/retrieval/proof-chain'),
        {
          method: 'POST',
          body: JSON.stringify({
            query: query.trim(),
            strategy,
            modalities: selectedModalities,
            topK: 5,
          }),
        },
      );
      const proofChain = envelope.data?.proofChain;
      if (!proofChain) throw new Error('Response missing proofChain field');
      setChain(proofChain);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px', fontFamily: 'inherit' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div
            style={{
              width: 4,
              height: 20,
              background: ACCENT,
              borderRadius: 2,
              flexShrink: 0,
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '-0.02em',
            }}
          >
            Retrieval Proof Chain
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280', paddingLeft: 14 }}>
          Two-stage retrieval pipeline — embedding pass followed by reranker pass — with full
          provenance of sources, ranked evidence, and confidence deltas.
        </p>
      </div>

      {/* Query form */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <label
          style={{
            display: 'block',
            fontSize: 11,
            color: '#6b7280',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Query
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runRetrieval()}
            placeholder="Enter a question or search text…"
            style={{
              flex: 1,
              fontSize: 13,
              color: '#111827',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              padding: '8px 12px',
              outline: 'none',
            }}
          />
          <button
            onClick={runRetrieval}
            disabled={loading || !query.trim()}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              background: loading ? '#9ca3af' : ACCENT,
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 150ms',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Retrieving…' : 'Run Retrieval'}
          </button>
        </div>

        {/* Strategy + modality selectors */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: '#6b7280',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Strategy
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {STRATEGIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 4,
                    border: `1px solid ${strategy === s ? ACCENT : '#e5e7eb'}`,
                    background: strategy === s ? ACCENT + '18' : '#fff',
                    color: strategy === s ? ACCENT : '#374151',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: '#6b7280',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Modalities
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MODALITY_OPTIONS.map(({ value, label }) => {
                const active = selectedModalities.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => toggleModality(value)}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 4,
                      border: `1px solid ${active ? ACCENT : '#e5e7eb'}`,
                      background: active ? ACCENT + '18' : '#fff',
                      color: active ? ACCENT : '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '40px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            Running two-stage retrieval — embedding pass → reranker pass…
          </div>
          <div
            style={{
              marginTop: 12,
              height: 3,
              background: '#f3f4f6',
              borderRadius: 2,
              overflow: 'hidden',
              maxWidth: 320,
              margin: '12px auto 0',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '60%',
                background: ACCENT,
                borderRadius: 2,
                animation: 'pulse 1.2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '16px 20px',
            marginBottom: 16,
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}
          >
            Retrieval failed
          </div>
          <div style={{ fontSize: 12, color: '#ef4444', fontFamily: 'monospace' }}>
            {error}
          </div>
        </div>
      )}

      {/* Proof chain viewer */}
      {chain && !loading && (
        <ProofChainViewer
          chain={chain}
          accentColor={ACCENT}
          title="Retrieval Proof Chain"
          maxItems={10}
        />
      )}

      {/* Empty state */}
      {!chain && !loading && !error && (
        <div
          style={{
            background: '#fafafa',
            border: '1px dashed #e5e7eb',
            borderRadius: 8,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Run a retrieval query
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af', maxWidth: 400, margin: '0 auto' }}>
            Enter a question above and click Run Retrieval to see the two-stage pipeline in
            action — embedding pass followed by a reranker pass — with full evidence provenance.
          </div>
        </div>
      )}
    </div>
  );
}
