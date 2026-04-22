import React, { useState } from 'react';

export type ProvenanceSourceClass =
  | 'human_authored'
  | 'llm_generated'
  | 'llm_summarized'
  | 'system_computed'
  | 'external_feed'
  | 'sensor_data'
  | 'hybrid';

export type ProofReviewState = 'unreviewed' | 'approved' | 'flagged' | 'retracted';
export type ProofExportSafetyState = 'safe' | 'restricted' | 'pending_review' | 'blocked';

export interface ProofInputSource {
  type: string;
  id: string;
  label?: string;
}

export interface ProofPanelData {
  proofId?: number | string;
  contentId?: string;
  contentType?: string;
  sourceClass: ProvenanceSourceClass;
  confidenceScore?: number;
  modelId?: string | null;
  modelProvider?: string | null;
  modelVersion?: string | null;
  modelLane?: string | null;
  reviewState: ProofReviewState;
  exportSafetyState: ProofExportSafetyState;
  reviewedBy?: string | null;
  reviewedAt?: string | Date | null;
  reviewNote?: string | null;
  generatedAt?: string | Date;
  serviceAttribution?: string | null;
  actorAttribution?: string | null;
  inputSources?: ProofInputSource[];
  contradictionMarkers?: string[];
  lineage?: Array<{ label: string; sourceClass: ProvenanceSourceClass; at?: string }>;
  metadata?: Record<string, unknown>;
}

export interface ProofPanelProps {
  proof: ProofPanelData;
  variant?: 'inline' | 'drawer' | 'badge';
  accentColor?: string;
  className?: string;
  onReview?: (state: ProofReviewState) => void | Promise<void>;
  showActions?: boolean;
}

const SOURCE_LABELS: Record<ProvenanceSourceClass, string> = {
  human_authored: 'Human Authored',
  llm_generated: 'AI Generated',
  llm_summarized: 'AI Summarized',
  system_computed: 'System Computed',
  external_feed: 'External Feed',
  sensor_data: 'Sensor Data',
  hybrid: 'Hybrid',
};

const SOURCE_ICONS: Record<ProvenanceSourceClass, string> = {
  human_authored: '👤',
  llm_generated: '🤖',
  llm_summarized: '🤖',
  system_computed: '⚙️',
  external_feed: '📡',
  sensor_data: '📊',
  hybrid: '🔀',
};

const REVIEW_CONFIG: Record<ProofReviewState, { label: string; color: string; icon: string }> = {
  unreviewed: { label: 'Pending Review', color: '#c8953c', icon: '⏳' },
  approved: { label: 'Approved', color: '#6b8f71', icon: '✓' },
  flagged: { label: 'Flagged', color: '#ef4444', icon: '⚑' },
  retracted: { label: 'Retracted', color: '#9ca3af', icon: '✕' },
};

const EXPORT_CONFIG: Record<
  ProofExportSafetyState,
  { label: string; color: string; icon: string; description: string }
> = {
  safe: {
    label: 'Export Safe',
    color: '#6b8f71',
    icon: '✓',
    description: 'Cleared for external distribution',
  },
  restricted: {
    label: 'Internal Only',
    color: '#c8953c',
    icon: '⚠',
    description: 'Restricted — internal use only',
  },
  pending_review: {
    label: 'Pending Review',
    color: '#4a90b8',
    icon: '⏳',
    description: 'Requires human review before export',
  },
  blocked: {
    label: 'Export Blocked',
    color: '#ef4444',
    icon: '🚫',
    description: 'Blocked — flagged or retracted content',
  },
};

const BG = {
  surface: 'rgba(255,255,255,0.02)',
  elevated: 'rgba(255,255,255,0.03)',
  header: 'rgba(255,255,255,0.04)',
};
const BORDER = { subtle: 'rgba(255,255,255,0.06)', muted: 'rgba(255,255,255,0.08)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
};

function timeAgo(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const color = pct >= 80 ? '#6b8f71' : pct >= 55 ? '#c8953c' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 3,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 2,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          minWidth: 30,
          textAlign: 'right',
          fontFamily: 'monospace',
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        color: TEXT.tertiary,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 5,
      }}
    >
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        padding: '3px 0',
      }}
    >
      <span style={{ fontSize: 11, color: TEXT.secondary, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: 11,
          color: TEXT.primary,
          fontFamily: mono ? 'monospace' : undefined,
          textAlign: 'right',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 200,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function ProofPanelBadge({
  proof,
  accentColor = '#8b5cf6',
}: {
  proof: ProofPanelData;
  accentColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const review = REVIEW_CONFIG[proof.reviewState];
  const _exportCfg = EXPORT_CONFIG[proof.exportSafetyState];
  const pct = Math.round((proof.confidenceScore ?? 0.5) * 100);
  const confColor = pct >= 80 ? '#6b8f71' : pct >= 55 ? '#c8953c' : '#ef4444';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 8px',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid rgba(255,255,255,0.08)`,
          borderRadius: 5,
          cursor: 'pointer',
          fontSize: 10,
          color: TEXT.secondary,
          fontFamily: 'monospace',
        }}
      >
        <span style={{ fontSize: 9 }}>{SOURCE_ICONS[proof.sourceClass]}</span>
        <span>{SOURCE_LABELS[proof.sourceClass]}</span>
        <span style={{ color: confColor }}>· {pct}%</span>
        <span style={{ color: review.color }}>{review.icon}</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            background: '#0f1219',
            border: `1px solid ${BORDER.muted}`,
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            minWidth: 280,
          }}
        >
          <ProofPanelInline proof={proof} accentColor={accentColor} />
        </div>
      )}
    </div>
  );
}

function ProofPanelInline({
  proof,
  accentColor = '#8b5cf6',
  onReview,
  showActions,
}: {
  proof: ProofPanelData;
  accentColor?: string;
  onReview?: (s: ProofReviewState) => void | Promise<void>;
  showActions?: boolean;
}) {
  const review = REVIEW_CONFIG[proof.reviewState];
  const exportCfg = EXPORT_CONFIG[proof.exportSafetyState];
  const [reviewLoading, setReviewLoading] = useState(false);

  return (
    <div style={{ padding: 14, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingBottom: 10,
          borderBottom: `1px solid ${BORDER.subtle}`,
        }}
      >
        <span style={{ fontSize: 16 }}>{SOURCE_ICONS[proof.sourceClass]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: TEXT.primary, fontSize: 12 }}>
            {SOURCE_LABELS[proof.sourceClass]}
          </div>
          {proof.serviceAttribution && (
            <div style={{ fontSize: 10, color: TEXT.tertiary, fontFamily: 'monospace' }}>
              {proof.serviceAttribution}
            </div>
          )}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: review.color,
            background: `${review.color}18`,
            padding: '2px 7px',
            borderRadius: 4,
          }}
        >
          {review.icon} {review.label}
        </span>
      </div>

      {/* Confidence */}
      {proof.confidenceScore !== undefined && (
        <div>
          <SectionLabel>Confidence</SectionLabel>
          <ConfidenceBar value={proof.confidenceScore} />
        </div>
      )}

      {/* Model Attribution */}
      {(proof.modelId || proof.modelProvider) && (
        <div>
          <SectionLabel>Model Provenance</SectionLabel>
          {proof.modelProvider && <Row label="Provider" value={proof.modelProvider} />}
          {proof.modelId && <Row label="Model" value={proof.modelId} mono />}
          {proof.modelVersion && <Row label="Version" value={proof.modelVersion} mono />}
          {proof.modelLane && <Row label="Lane" value={proof.modelLane} />}
        </div>
      )}

      {/* Actor Attribution */}
      {(proof.actorAttribution || proof.reviewedBy) && (
        <div>
          <SectionLabel>Actor Attribution</SectionLabel>
          {proof.actorAttribution && <Row label="Generated by" value={proof.actorAttribution} />}
          {proof.reviewedBy && <Row label="Reviewed by" value={proof.reviewedBy} />}
          {proof.reviewedAt && <Row label="Reviewed" value={timeAgo(proof.reviewedAt)} />}
          {proof.reviewNote && (
            <div
              style={{
                marginTop: 4,
                padding: '4px 8px',
                background: BG.elevated,
                borderRadius: 5,
                fontSize: 11,
                color: TEXT.secondary,
                fontStyle: 'italic',
              }}
            >
              "{proof.reviewNote}"
            </div>
          )}
        </div>
      )}

      {/* Generated At */}
      {proof.generatedAt && <Row label="Generated" value={timeAgo(proof.generatedAt)} />}

      {/* Input Sources / Lineage */}
      {proof.inputSources && proof.inputSources.length > 0 && (
        <div>
          <SectionLabel>Source Lineage ({proof.inputSources.length})</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {proof.inputSources.map((src, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: TEXT.secondary,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: accentColor,
                    opacity: 0.5,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: TEXT.primary }}>{src.label ?? src.id}</span>
                <span style={{ color: TEXT.tertiary, fontSize: 10 }}>[{src.type}]</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lineage chain */}
      {proof.lineage && proof.lineage.length > 0 && (
        <div>
          <SectionLabel>Derivation Chain</SectionLabel>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              paddingLeft: 8,
              borderLeft: `2px solid ${accentColor}40`,
            }}
          >
            {proof.lineage.map((l, i) => (
              <div
                key={i}
                style={{
                  fontSize: 10,
                  color: TEXT.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span>{SOURCE_ICONS[l.sourceClass]}</span>
                <span>{l.label}</span>
                {l.at && <span style={{ color: TEXT.tertiary }}>· {timeAgo(l.at)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contradiction Markers */}
      {proof.contradictionMarkers && proof.contradictionMarkers.length > 0 && (
        <div
          style={{
            padding: '6px 10px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.18)',
            borderRadius: 6,
          }}
        >
          <SectionLabel>⚠ Contradiction Markers</SectionLabel>
          {proof.contradictionMarkers.map((m, i) => (
            <div key={i} style={{ fontSize: 11, color: '#ef8a8a' }}>
              • {m}
            </div>
          ))}
        </div>
      )}

      {/* Export Safety */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 10px',
          background: `${exportCfg.color}10`,
          border: `1px solid ${exportCfg.color}28`,
          borderRadius: 6,
        }}
      >
        <span style={{ color: exportCfg.color, fontSize: 13 }}>{exportCfg.icon}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: exportCfg.color }}>
            {exportCfg.label}
          </div>
          <div style={{ fontSize: 10, color: TEXT.tertiary }}>{exportCfg.description}</div>
        </div>
      </div>

      {/* Review Actions */}
      {showActions && onReview && proof.reviewState === 'unreviewed' && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            paddingTop: 4,
            borderTop: `1px solid ${BORDER.subtle}`,
          }}
        >
          <button
            disabled={reviewLoading}
            onClick={async () => {
              setReviewLoading(true);
              await onReview('approved');
              setReviewLoading(false);
            }}
            style={{
              flex: 1,
              padding: '6px 0',
              background: '#6b8f7120',
              border: '1px solid #6b8f7140',
              borderRadius: 5,
              color: '#6b8f71',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ✓ Approve
          </button>
          <button
            disabled={reviewLoading}
            onClick={async () => {
              setReviewLoading(true);
              await onReview('flagged');
              setReviewLoading(false);
            }}
            style={{
              flex: 1,
              padding: '6px 0',
              background: '#ef444420',
              border: '1px solid #ef444440',
              borderRadius: 5,
              color: '#ef4444',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ⚑ Flag
          </button>
        </div>
      )}
    </div>
  );
}

export function ProofPanel({
  proof,
  variant = 'inline',
  accentColor = '#8b5cf6',
  className,
  onReview,
  showActions,
}: ProofPanelProps) {
  if (variant === 'badge') {
    return <ProofPanelBadge proof={proof} accentColor={accentColor} />;
  }

  const containerStyle: React.CSSProperties = {
    background: BG.surface,
    border: `1px solid ${BORDER.subtle}`,
    borderRadius: 10,
    overflow: 'hidden',
  };

  if (variant === 'drawer') {
    return (
      <div className={className} style={{ ...containerStyle, maxWidth: 320 }}>
        <div
          style={{
            padding: '10px 14px',
            background: BG.header,
            borderBottom: `1px solid ${BORDER.subtle}`,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Proof Chain
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 9,
              color: TEXT.tertiary,
              fontFamily: 'monospace',
            }}
          >
            {proof.proofId ? `#${proof.proofId}` : ''}
          </span>
        </div>
        <ProofPanelInline
          proof={proof}
          accentColor={accentColor}
          {...(onReview !== undefined ? { onReview } : {})}
          {...(showActions !== undefined ? { showActions } : {})}
        />
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      <div
        style={{
          padding: '8px 12px',
          background: BG.header,
          borderBottom: `1px solid ${BORDER.subtle}`,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: TEXT.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          🔐 Proof Chain
        </span>
        {proof.proofId && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 9,
              color: TEXT.tertiary,
              fontFamily: 'monospace',
            }}
          >
            #{proof.proofId}
          </span>
        )}
      </div>
      <ProofPanelInline
        proof={proof}
        accentColor={accentColor}
        {...(onReview !== undefined ? { onReview } : {})}
        {...(showActions !== undefined ? { showActions } : {})}
      />
    </div>
  );
}

export function ProofPanelRow({
  proof,
  accentColor = '#8b5cf6',
}: {
  proof: ProofPanelData;
  accentColor?: string;
}) {
  const review = REVIEW_CONFIG[proof.reviewState];
  const export_ = EXPORT_CONFIG[proof.exportSafetyState];
  const pct = Math.round((proof.confidenceScore ?? 0.5) * 100);
  const confColor = pct >= 80 ? '#6b8f71' : pct >= 55 ? '#c8953c' : '#ef4444';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 10px',
        background: BG.surface,
        border: `1px solid ${BORDER.subtle}`,
        borderRadius: 7,
        fontSize: 11,
      }}
    >
      <span style={{ fontSize: 13 }}>{SOURCE_ICONS[proof.sourceClass]}</span>
      <span style={{ color: TEXT.secondary, flexShrink: 0 }}>
        {SOURCE_LABELS[proof.sourceClass]}
      </span>
      {proof.modelId && (
        <span style={{ color: TEXT.tertiary, fontFamily: 'monospace', fontSize: 10 }}>
          {proof.modelId}
        </span>
      )}
      <span
        style={{ marginLeft: 'auto', color: confColor, fontWeight: 700, fontFamily: 'monospace' }}
      >
        {pct}%
      </span>
      <span style={{ color: review.color, fontSize: 10, fontWeight: 600 }}>
        {review.icon} {review.label}
      </span>
      <span style={{ color: export_.color, fontSize: 10 }}>{export_.icon}</span>
    </div>
  );
}
