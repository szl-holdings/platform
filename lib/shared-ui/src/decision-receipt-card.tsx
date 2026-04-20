import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Hash,
  Shield,
  User,
  XCircle,
} from 'lucide-react';
import * as React from 'react';

const BG = { surface: '#0b0f17', elevated: '#10141e', card: '#0e1320' };
const BORDER = { subtle: 'rgba(255,255,255,0.05)', muted: 'rgba(255,255,255,0.08)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.92)',
  secondary: 'rgba(255,255,255,0.58)',
  tertiary: 'rgba(255,255,255,0.32)',
  muted: 'rgba(255,255,255,0.16)',
};

const OUTCOME_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  approved: { color: '#4f9a6b', icon: <CheckCircle size={12} />, label: 'Approved' },
  rejected: { color: '#c45a4a', icon: <XCircle size={12} />, label: 'Rejected' },
  escalated: { color: '#c8953c', icon: <AlertTriangle size={12} />, label: 'Escalated' },
  executed: { color: '#4f9a6b', icon: <CheckCircle size={12} />, label: 'Executed' },
  deferred: { color: '#7c85a0', icon: <Clock size={12} />, label: 'Deferred' },
};

const RISK_COLORS: Record<string, string> = {
  P0: '#c45a4a',
  P1: '#c8953c',
  P2: '#d4a054',
  P3: '#4a90b8',
  P4: '#7c85a0',
  critical: '#c45a4a',
  high: '#c8953c',
  medium: '#d4a054',
  low: '#4f9a6b',
  negligible: '#7c85a0',
};

function formatTimestamp(ts: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(ts));
  } catch {
    return ts;
  }
}

function truncateHash(hash: string, chars = 16): string {
  return hash.length > chars ? `${hash.slice(0, chars)}…` : hash;
}

export interface AiRecommendation {
  recommendedAction: string;
  rationaleSummary: string;
  confidence: number;
  riskLevel?: string;
  modelRoute?: string;
  evidenceRefs?: Array<{ source: string; content: string; relevanceScore: number }>;
}

export interface Alternative {
  label: string;
  description?: string;
  riskLevel?: string;
}

export interface DecisionReceiptData {
  receiptId: string;
  domain: string;
  actionType: string;
  actionLabel: string;
  actorName?: string;
  actorRole?: string;
  timestamp: string;
  dataSnapshot?: Record<string, unknown>;
  aiRecommendation?: AiRecommendation | null;
  alternativesConsidered?: Alternative[];
  rationale?: string;
  outcome: string;
  riskLevel?: string;
  nonRepudiationHash: string;
  hashAlgorithm?: string;
  workflowId?: string;
  decisionId?: string;
}

export interface DecisionReceiptCardProps {
  receipt: DecisionReceiptData;
  compact?: boolean;
  onDownload?: (receipt: DecisionReceiptData) => void;
  accentColor?: string;
  className?: string;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[9px] uppercase tracking-widest font-mono mb-2"
        style={{ color: TEXT.muted }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function HashChip({ hash, algorithm = 'sha256' }: { hash: string; algorithm?: string }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded text-left w-full transition-colors hover:bg-white/[0.02]"
      style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
      title="Click to reveal full hash"
    >
      <Hash size={10} style={{ color: '#8b7ac8', flexShrink: 0 }} />
      <span className="font-mono text-[9px] break-all" style={{ color: '#8b7ac8' }}>
        {expanded ? hash : truncateHash(hash, 20)}
      </span>
      <span className="text-[8px] font-mono ml-auto flex-shrink-0" style={{ color: TEXT.muted }}>
        {algorithm.toUpperCase()} · {expanded ? 'hide' : 'reveal'}
      </span>
    </button>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? '#4f9a6b' : pct >= 50 ? '#c8953c' : '#c45a4a';
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono w-8 text-right" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

export function DecisionReceiptCard({
  receipt,
  compact = false,
  onDownload,
  accentColor = '#d4a054',
  className = '',
}: DecisionReceiptCardProps) {
  const [showSnapshot, setShowSnapshot] = React.useState(false);
  const [showEvidence, setShowEvidence] = React.useState(false);

  const outcomeConfig = OUTCOME_CONFIG[receipt.outcome] ?? {
    color: '#7c85a0',
    icon: <Shield size={12} />,
    label: receipt.outcome,
  };
  const riskColor = receipt.riskLevel
    ? (RISK_COLORS[receipt.riskLevel] ?? TEXT.tertiary)
    : TEXT.tertiary;
  const alternatives = receipt.alternativesConsidered ?? [];
  const evidenceRefs = receipt.aiRecommendation?.evidenceRefs ?? [];

  function handleDownload() {
    if (onDownload) {
      onDownload(receipt);
      return;
    }
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision-receipt-${receipt.receiptId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}
    >
      <div className="h-[3px]" style={{ background: outcomeConfig.color }} />

      <div
        className="px-4 py-3 flex items-start gap-3"
        style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className="text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded"
              style={{
                color: accentColor,
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}25`,
              }}
            >
              Decision Receipt
            </span>
            <span
              className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                color: outcomeConfig.color,
                background: `${outcomeConfig.color}14`,
                border: `1px solid ${outcomeConfig.color}28`,
              }}
            >
              {outcomeConfig.icon}
              {outcomeConfig.label}
            </span>
            {receipt.riskLevel && (
              <span
                className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded"
                style={{
                  color: riskColor,
                  background: `${riskColor}12`,
                  border: `1px solid ${riskColor}22`,
                }}
              >
                {receipt.riskLevel}
              </span>
            )}
          </div>
          <div className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>
            {receipt.actionLabel}
          </div>
          <div className="text-[9px] mt-0.5" style={{ color: TEXT.tertiary }}>
            {receipt.domain} · {receipt.actionType}
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1.5 rounded transition-colors hover:bg-white/[0.04]"
          style={{ border: `1px solid ${BORDER.muted}`, color: TEXT.tertiary, flexShrink: 0 }}
          title="Download receipt as JSON"
        >
          <Download size={10} />
          Export
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Section label="Actor">
            <div
              className="flex items-center gap-2 px-2.5 py-2 rounded"
              style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
            >
              <User size={12} style={{ color: TEXT.muted }} />
              <div>
                <div className="text-[10px] font-medium" style={{ color: TEXT.primary }}>
                  {receipt.actorName ?? 'Unknown'}
                </div>
                {receipt.actorRole && (
                  <div className="text-[8px]" style={{ color: TEXT.tertiary }}>
                    {receipt.actorRole}
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section label="Timestamp">
            <div
              className="flex items-center gap-2 px-2.5 py-2 rounded"
              style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
            >
              <Clock size={12} style={{ color: TEXT.muted }} />
              <div className="text-[9px] font-mono" style={{ color: TEXT.secondary }}>
                {formatTimestamp(receipt.timestamp)}
              </div>
            </div>
          </Section>
        </div>

        {receipt.rationale && (
          <Section label="Decision Rationale">
            <p
              className="text-[10px] leading-relaxed px-2.5 py-2 rounded"
              style={{
                color: TEXT.secondary,
                background: BG.elevated,
                border: `1px solid ${BORDER.subtle}`,
              }}
            >
              {receipt.rationale}
            </p>
          </Section>
        )}

        {receipt.aiRecommendation && (
          <Section label="AI Recommendation">
            <div
              className="rounded px-3 py-2.5 space-y-2"
              style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
            >
              <div className="text-[10px] font-medium" style={{ color: TEXT.primary }}>
                {receipt.aiRecommendation.recommendedAction}
              </div>
              <p className="text-[9px] leading-relaxed" style={{ color: TEXT.secondary }}>
                {receipt.aiRecommendation.rationaleSummary}
              </p>
              <div>
                <div className="text-[8px] mb-1" style={{ color: TEXT.muted }}>
                  AI Confidence
                </div>
                <ConfidenceBar value={receipt.aiRecommendation.confidence} />
              </div>
              {receipt.aiRecommendation.modelRoute && (
                <div className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                  Model: {receipt.aiRecommendation.modelRoute}
                </div>
              )}
              {evidenceRefs.length > 0 && (
                <button
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="flex items-center gap-1 text-[8px] font-mono"
                  style={{ color: TEXT.tertiary }}
                >
                  {showEvidence ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  {evidenceRefs.length} evidence source{evidenceRefs.length !== 1 ? 's' : ''}
                </button>
              )}
              {showEvidence &&
                evidenceRefs.map((ref, i) => (
                  <div
                    key={i}
                    className="rounded px-2 py-1.5"
                    style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[8px] font-mono" style={{ color: '#8b7ac8' }}>
                        {ref.source}
                      </span>
                      <span className="text-[7px] font-mono ml-auto" style={{ color: TEXT.muted }}>
                        rel. {Math.round(ref.relevanceScore * 100)}%
                      </span>
                    </div>
                    <p
                      className="text-[8px] leading-relaxed line-clamp-2"
                      style={{ color: TEXT.tertiary }}
                    >
                      {ref.content}
                    </p>
                  </div>
                ))}
            </div>
          </Section>
        )}

        {alternatives.length > 0 && (
          <Section label={`Alternatives Considered (${alternatives.length})`}>
            <div className="space-y-1.5">
              {alternatives.map((alt, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 px-2.5 py-2 rounded"
                  style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
                >
                  <span
                    className="text-[8px] font-mono w-4 flex-shrink-0 pt-0.5"
                    style={{ color: TEXT.muted }}
                  >
                    {i + 1}.
                  </span>
                  <div className="flex-1">
                    <div className="text-[9px] font-medium" style={{ color: TEXT.primary }}>
                      {alt.label}
                    </div>
                    {alt.description && (
                      <div className="text-[8px] mt-0.5" style={{ color: TEXT.tertiary }}>
                        {alt.description}
                      </div>
                    )}
                  </div>
                  {alt.riskLevel && (
                    <span
                      className="text-[7px] font-mono px-1 py-0.5 rounded flex-shrink-0"
                      style={{
                        color: RISK_COLORS[alt.riskLevel] ?? TEXT.muted,
                        background: `${RISK_COLORS[alt.riskLevel] ?? '#888'}12`,
                      }}
                    >
                      {alt.riskLevel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {!compact && receipt.dataSnapshot && Object.keys(receipt.dataSnapshot).length > 0 && (
          <Section label="Data Visible at Decision Time">
            <button
              onClick={() => setShowSnapshot(!showSnapshot)}
              className="flex items-center justify-between w-full px-2.5 py-2 rounded transition-colors hover:bg-white/[0.02]"
              style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
            >
              <span className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>
                {Object.keys(receipt.dataSnapshot).length} field
                {Object.keys(receipt.dataSnapshot).length !== 1 ? 's' : ''}
              </span>
              {showSnapshot ? (
                <ChevronUp size={10} style={{ color: TEXT.muted }} />
              ) : (
                <ChevronDown size={10} style={{ color: TEXT.muted }} />
              )}
            </button>
            {showSnapshot && (
              <div
                className="mt-1.5 rounded px-2.5 py-2"
                style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
              >
                <pre
                  className="text-[8px] font-mono leading-relaxed overflow-x-auto"
                  style={{ color: TEXT.secondary }}
                >
                  {JSON.stringify(receipt.dataSnapshot, null, 2)}
                </pre>
              </div>
            )}
          </Section>
        )}

        <Section label="Non-Repudiation Hash">
          <HashChip
            hash={receipt.nonRepudiationHash}
            algorithm={receipt.hashAlgorithm ?? 'sha256'}
          />
          <div className="mt-1.5 text-[8px] font-mono" style={{ color: TEXT.muted }}>
            Receipt ID: {receipt.receiptId}
            {receipt.workflowId && ` · Workflow: ${receipt.workflowId}`}
            {receipt.decisionId && ` · Decision: ${receipt.decisionId.slice(0, 8)}…`}
          </div>
        </Section>
      </div>
    </div>
  );
}

export function DecisionReceiptBadge({
  receiptId,
  outcome,
  onClick,
}: {
  receiptId: string;
  outcome: string;
  onClick?: () => void;
}) {
  const outcomeConfig = OUTCOME_CONFIG[outcome] ?? {
    color: '#7c85a0',
    icon: <Shield size={10} />,
    label: outcome,
  };
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-mono transition-colors hover:bg-white/[0.03]"
      style={{
        color: outcomeConfig.color,
        background: `${outcomeConfig.color}0e`,
        border: `1px solid ${outcomeConfig.color}22`,
      }}
      title={`Decision Receipt: ${receiptId}`}
    >
      <Shield size={9} />
      Receipt #{receiptId.slice(-6)}
    </button>
  );
}
