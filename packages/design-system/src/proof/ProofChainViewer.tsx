/**
 * ProofChainViewer
 *
 * Renders the full retrieval proof chain for a single query:
 *  - Query text and strategy
 *  - Model/version provenance (embedding + reranker)
 *  - Ranked evidence items with per-item scores and confidence deltas
 *  - Overall confidence meter
 *  - Modality badges (text / screenshot / diagram / audio transcript)
 *
 * Phase 6 will apply visual polish; this version is functional-first.
 *
 * Types are defined inline to avoid adding a new dependency to the design-system.
 */

import { cn } from '../utils.js';
import { ConfidenceMeter } from './ConfidenceMeter.js';

// ─── Inline types (mirrors @szl-holdings/shared-contracts) ───────────────────

export type RetrievalModality = 'text' | 'screenshot' | 'diagram' | 'audio_transcript';
export type RetrievalStrategy = 'semantic' | 'keyword' | 'hybrid' | 'graph' | 'structured';

export interface RankedEvidenceItem {
  rank: number;
  chunkId: string;
  sourceId: string;
  sourceUri?: string;
  title?: string;
  content: string;
  modality: RetrievalModality;
  embeddingScore: number;
  rerankerScore: number;
  finalScore: number;
  confidenceDelta: number;
  retrievedAt: string;
  embeddingModel?: string;
  rerankerModel?: string;
}

export interface RetrievalProofChain {
  queryId: string;
  traceId?: string;
  query: string;
  strategy: RetrievalStrategy;
  modalities: RetrievalModality[];
  embeddingModel: string;
  embeddingProvider: string;
  rerankerModel: string;
  rerankerProvider: string;
  rankedEvidence: RankedEvidenceItem[];
  totalCandidatesBeforeRerank: number;
  totalCandidatesAfterRerank: number;
  overallConfidence: number;
  latencyMs: number;
  generatedAt: string;
}

// ─── Modality badge ───────────────────────────────────────────────────────────

const MODALITY_LABELS: Record<RetrievalModality, string> = {
  text: 'Text',
  screenshot: 'Screenshot',
  diagram: 'Diagram',
  audio_transcript: 'Audio',
};

const MODALITY_COLORS: Record<RetrievalModality, string> = {
  text: '#0ea5e9',
  screenshot: '#9b7cc8',
  diagram: '#c9a85c',
  audio_transcript: '#059669',
};

function ModalityBadge({ modality }: { modality: RetrievalModality }) {
  const bg = MODALITY_COLORS[modality];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: '#fff',
        background: bg,
        borderRadius: 3,
        padding: '1px 6px',
        whiteSpace: 'nowrap',
      }}
    >
      {MODALITY_LABELS[modality]}
    </span>
  );
}

// ─── Delta pill ───────────────────────────────────────────────────────────────

function DeltaPill({ delta }: { delta: number }) {
  const positive = delta >= 0;
  const sign = positive ? '+' : '';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: positive ? '#16a34a' : '#dc2626',
        background: positive ? '#dcfce7' : '#fee2e2',
        borderRadius: 3,
        padding: '1px 5px',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {sign}{(delta * 100).toFixed(1)}%
    </span>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score, color: barColor }: { score: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: '#e5e7eb',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, score * 100)).toFixed(1)}%`,
            background: barColor,
            borderRadius: 2,
            transition: 'width 200ms ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 10,
          color: '#6b7280',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 34,
          textAlign: 'right',
        }}
      >
        {(score * 100).toFixed(1)}
      </span>
    </div>
  );
}

// ─── Evidence row ─────────────────────────────────────────────────────────────

function EvidenceRow({ item, accentColor }: { item: RankedEvidenceItem; accentColor: string }) {
  const label = item.title ?? item.sourceId;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr',
        gap: '0 12px',
        padding: '10px 0',
        borderBottom: '1px solid #f3f4f6',
        alignItems: 'start',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 4,
          background: accentColor + '18',
          color: accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        {item.rank}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 260,
            }}
            title={label}
          >
            {label}
          </span>
          <ModalityBadge modality={item.modality} />
          <DeltaPill delta={item.confidenceDelta} />
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: '#6b7280',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.5,
          }}
        >
          {item.content.slice(0, 240)}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px', marginTop: 2 }}>
          <div>
            <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Embedding
            </div>
            <ScoreBar score={item.embeddingScore} color="#60a5fa" />
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Reranked
            </div>
            <ScoreBar score={item.rerankerScore} color={accentColor} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Model provenance row ─────────────────────────────────────────────────────

function ProvenancePill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#374151',
          background: '#f3f4f6',
          borderRadius: 4,
          padding: '2px 8px',
          fontFamily: 'monospace',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface ProofChainViewerProps {
  chain: RetrievalProofChain;
  accentColor?: string;
  maxItems?: number;
  className?: string;
  title?: string;
}

export function ProofChainViewer({
  chain,
  accentColor = '#c9a85c',
  maxItems = 10,
  className,
  title = 'Retrieval Proof Chain',
}: ProofChainViewerProps) {
  const visibleItems = chain.rankedEvidence.slice(0, maxItems);

  return (
    <div
      className={cn('proof-chain-viewer', className)}
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #f3f4f6',
          background: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 3,
              height: 16,
              background: accentColor,
              borderRadius: 2,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ConfidenceMeter
            value={Math.round(chain.overallConfidence * 100)}
            contradiction={false}
          />
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            {chain.latencyMs}ms
          </span>
        </div>
      </div>

      {/* Query */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Query
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
          {chain.query}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              background: '#f3f4f6',
              color: '#374151',
              borderRadius: 3,
              padding: '1px 6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {chain.strategy}
          </span>
          {chain.modalities.map((m: RetrievalModality) => (
            <ModalityBadge key={m} modality={m} />
          ))}
        </div>
      </div>

      {/* Model provenance */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid #f3f4f6',
          background: '#fafafa',
          flexWrap: 'wrap',
        }}
      >
        <ProvenancePill label="Embedding" value={`${chain.embeddingProvider}/${chain.embeddingModel}`} />
        <ProvenancePill label="Reranker" value={`${chain.rerankerProvider}/${chain.rerankerModel}`} />
        <ProvenancePill label="Candidates" value={`${chain.totalCandidatesBeforeRerank} → ${chain.totalCandidatesAfterRerank}`} />
        <ProvenancePill label="Generated" value={new Date(chain.generatedAt).toLocaleTimeString()} />
        {chain.traceId && <ProvenancePill label="Trace" value={chain.traceId.slice(0, 12) + '…'} />}
      </div>

      {/* Evidence list */}
      <div style={{ padding: '0 16px' }}>
        {visibleItems.length === 0 ? (
          <div
            style={{
              padding: '24px 0',
              textAlign: 'center',
              fontSize: 12,
              color: '#9ca3af',
            }}
          >
            No evidence retrieved for this query.
          </div>
        ) : (
          visibleItems.map((item: RankedEvidenceItem) => (
            <EvidenceRow key={item.chunkId} item={item} accentColor={accentColor} />
          ))
        )}
      </div>

      {/* Footer */}
      {chain.rankedEvidence.length > maxItems && (
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid #f3f4f6',
            background: '#fafafa',
            fontSize: 11,
            color: '#9ca3af',
            textAlign: 'center',
          }}
        >
          Showing {maxItems} of {chain.rankedEvidence.length} evidence items
        </div>
      )}
    </div>
  );
}
