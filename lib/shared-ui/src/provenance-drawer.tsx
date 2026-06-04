import React, { useState } from 'react';

export interface ProvenanceDrawerEnvelope {
  runId: string;
  agentId: string;
  domain: string;
  model: string;
  provider: string;
  promptHash: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimateUsd: number;
  confidence: number;
  latencyMs: number;
  sources: Array<{
    sourceId: string;
    sourceUri?: string;
    title?: string;
    score?: number;
    retrievedAt: string;
  }>;
  governanceVerdict: 'allowed' | 'blocked';
  generatedAt: string;
}

export interface ProvenanceDrawerProps {
  envelope: ProvenanceDrawerEnvelope | null;
  open: boolean;
  onClose: () => void;
  className?: string;
  accentColor?: string;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#22c55e',
  medium: '#eab308',
  low: '#ef4444',
};

function confidenceTier(c: number): 'high' | 'medium' | 'low' {
  if (c >= 80) return 'high';
  if (c >= 50) return 'medium';
  return 'low';
}

function formatCost(usd: number): string {
  if (usd < 0.001) return '<$0.001';
  return `$${usd.toFixed(4)}`;
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ProvenanceBadge({
  envelope,
  onClick,
  className = '',
}: {
  envelope: ProvenanceDrawerEnvelope | null;
  onClick?: () => void;
  className?: string;
}) {
  if (!envelope) return null;
  const tier = confidenceTier(envelope.confidence);
  const color = CONFIDENCE_COLORS[tier] ?? '#94a3b8';

  return (
    <button
      onClick={onClick}
      className={className}
      title="View AI provenance"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 8px',
        fontSize: 11,
        fontFamily: 'monospace',
        background: 'rgba(30,41,59,0.8)',
        border: `1px solid ${color}40`,
        borderRadius: 4,
        color: '#e2e8f0',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ color, fontWeight: 600 }}>{envelope.confidence}%</span>
      <span style={{ opacity: 0.6 }}>
        {envelope.model} · {formatLatency(envelope.latencyMs)}
      </span>
      {envelope.sources.length > 0 && (
        <span style={{ opacity: 0.5 }}>
          · {envelope.sources.length} source{envelope.sources.length !== 1 ? 's' : ''}
        </span>
      )}
    </button>
  );
}

export function ProvenanceDrawer({
  envelope,
  open,
  onClose,
  accentColor = '#60a5fa',
}: ProvenanceDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'cost'>('overview');

  if (!open || !envelope) return null;

  const tier = confidenceTier(envelope.confidence);
  const tierColor = CONFIDENCE_COLORS[tier] ?? '#94a3b8';

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'sources' as const, label: `Sources (${envelope.sources.length})` },
    { id: 'cost' as const, label: 'Cost' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        background: '#0f172a',
        borderLeft: `1px solid ${accentColor}30`,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        color: '#e2e8f0',
        fontSize: 13,
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            AI Provenance
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, fontFamily: 'monospace', marginTop: 2 }}>
            {envelope.runId}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 18,
            padding: 4,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? `2px solid ${accentColor}` : '2px solid transparent',
              color: activeTab === t.id ? accentColor : '#64748b',
              fontSize: 12,
              fontWeight: activeTab === t.id ? 600 : 400,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Row label="Agent" value={`${envelope.agentId} (${envelope.domain})`} />
            <Row label="Model" value={`${envelope.model} / ${envelope.provider}`} />
            <Row label="Prompt Hash" value={envelope.promptHash} mono />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#64748b', width: 100, flexShrink: 0 }}>Confidence</span>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: '#1e293b',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${envelope.confidence}%`,
                    height: '100%',
                    background: tierColor,
                    borderRadius: 4,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <span style={{ fontWeight: 600, color: tierColor, minWidth: 40, textAlign: 'right' }}>
                {envelope.confidence}%
              </span>
            </div>
            <Row label="Latency" value={formatLatency(envelope.latencyMs)} />
            <Row label="Governance" value={envelope.governanceVerdict.toUpperCase()} />
            <Row label="Generated" value={new Date(envelope.generatedAt).toLocaleString()} />
          </div>
        )}

        {activeTab === 'sources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {envelope.sources.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: 32 }}>
                No sources cited for this response.
              </div>
            ) : (
              envelope.sources.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    background: '#1e293b',
                    borderRadius: 6,
                    borderLeft: `3px solid ${accentColor}`,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {s.title ?? s.sourceId}
                  </div>
                  {s.sourceUri && (
                    <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {s.sourceUri}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, opacity: 0.5 }}>
                    {s.score != null && <span>Score: {(s.score * 100).toFixed(0)}%</span>}
                    <span>Retrieved: {new Date(s.retrievedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'cost' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Row label="Prompt Tokens" value={envelope.promptTokens.toLocaleString()} />
            <Row label="Completion Tokens" value={envelope.completionTokens.toLocaleString()} />
            <Row label="Total Tokens" value={envelope.totalTokens.toLocaleString()} />
            <Row label="Estimated Cost" value={formatCost(envelope.costEstimateUsd)} />
            <Row label="Model" value={envelope.model} />
            <Row label="Provider" value={envelope.provider} />
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
      <span style={{ color: '#64748b', width: 100, flexShrink: 0, fontSize: 12 }}>{label}</span>
      <span
        style={{
          fontWeight: 500,
          fontFamily: mono ? 'monospace' : 'inherit',
          fontSize: mono ? 11 : 13,
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default ProvenanceDrawer;
