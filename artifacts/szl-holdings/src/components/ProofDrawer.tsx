import { AnimatePresence, m } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  Fingerprint,
  User,
} from 'lucide-react';
import { useState } from 'react';

const BORDER = 'hsla(0,0%,100%,0.07)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const TEXT = 'hsl(38,8%,94%)';
const TEXT_SEC = 'hsl(214,7%,60%)';
const TEXT_FAINT = 'hsl(214,7%,38%)';
const LYTE = 'hsl(192,72%,48%)';
const MONO = 'var(--font-mono)';
const GREEN = 'hsl(142,60%,48%)';
const YELLOW = 'hsl(48,90%,52%)';
const RED = 'hsl(0,72%,54%)';

export type ReviewState =
  | 'unreviewed'
  | 'human_reviewed'
  | 'peer_reviewed'
  | 'rejected'
  | 'approved';

export type ExportSafety = 'safe' | 'pending_review' | 'restricted' | 'blocked';

export interface ProofRecord {
  id: string;
  sourceSystem: string;
  sourceDomain: string;
  signalType: string;
  confidence: number;
  model?: string;
  modelVersion?: string;
  prompt?: string;
  reviewState: ReviewState;
  reviewedBy?: string;
  reviewedAt?: string;
  exportSafety: ExportSafety;
  policyChecks: Array<{ label: string; passed: boolean; note?: string }>;
  chainLinks: Array<{
    id: string;
    event: string;
    actor: string;
    timestamp: string;
    hash: string;
  }>;
  metadata?: Record<string, string>;
}

interface ProofDrawerProps {
  proof: ProofRecord;
  defaultOpen?: boolean;
  compact?: boolean;
  className?: string;
}

const REVIEW_LABELS: Record<ReviewState, { label: string; color: string }> = {
  unreviewed: { label: 'Unreviewed', color: YELLOW },
  human_reviewed: { label: 'Human reviewed', color: GREEN },
  peer_reviewed: { label: 'Peer reviewed', color: GREEN },
  rejected: { label: 'Rejected', color: RED },
  approved: { label: 'Approved', color: GREEN },
};

const EXPORT_LABELS: Record<ExportSafety, { label: string; color: string }> = {
  safe: { label: 'Safe to export', color: GREEN },
  pending_review: { label: 'Pending review', color: YELLOW },
  restricted: { label: 'Restricted', color: YELLOW },
  blocked: { label: 'Blocked', color: RED },
};

function ProofBadge({
  value,
  map,
}: {
  value: string;
  map: Record<string, { label: string; color: string }>;
}) {
  const info = map[value] ?? { label: value, color: TEXT_FAINT };
  return (
    <span
      style={{
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontFamily: MONO,
        padding: '2px 6px',
        borderRadius: 3,
        background: `${info.color}15`,
        border: `1px solid ${info.color}25`,
        color: info.color,
      }}
    >
      {info.label}
    </span>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 0.85 ? GREEN : value >= 0.7 ? YELLOW : RED;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div
        style={{
          flex: 1,
          height: 3,
          borderRadius: 2,
          background: 'hsla(0,0%,100%,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{ height: '100%', width: `${value * 100}%`, background: color, borderRadius: 2 }}
        />
      </div>
      <span
        style={{
          fontSize: '0.6875rem',
          fontFamily: MONO,
          fontWeight: 700,
          color,
          minWidth: '2.5rem',
          textAlign: 'right',
        }}
      >
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function ChainEntry({ link, isLast }: { link: ProofRecord['chainLinks'][0]; isLast: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: LYTE,
            flexShrink: 0,
            marginTop: '4px',
          }}
        />
        {!isLast && <div style={{ width: 1, flex: 1, background: BORDER, margin: '4px 0' }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: TEXT }}>{link.event}</span>
          <span style={{ fontSize: '0.6rem', fontFamily: MONO, color: TEXT_FAINT }}>
            {link.timestamp}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '0.6875rem', color: TEXT_FAINT }}>
            <User size={9} style={{ display: 'inline', marginRight: '3px' }} />
            {link.actor}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Fingerprint size={9} style={{ color: TEXT_FAINT }} />
          <span style={{ fontSize: '0.6rem', fontFamily: MONO, color: TEXT_FAINT }}>
            {link.hash}
          </span>
          <button
            onClick={() => navigator.clipboard?.writeText(link.hash).catch(() => {})}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginLeft: '2px',
            }}
            title="Copy hash"
          >
            <Copy size={9} style={{ color: TEXT_FAINT }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProofDrawer({ proof, defaultOpen = false, compact = false }: ProofDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [activeSection, setActiveSection] = useState<'summary' | 'chain' | 'policy' | 'metadata'>(
    'summary',
  );

  const _reviewInfo = REVIEW_LABELS[proof.reviewState];
  const _exportInfo = EXPORT_LABELS[proof.exportSafety];
  const allPolicyPassed = proof.policyChecks.every((p) => p.passed);
  const failedPolicies = proof.policyChecks.filter((p) => !p.passed);

  return (
    <div
      style={{
        borderRadius: '8px',
        border: `1px solid ${open ? `${LYTE}25` : BORDER}`,
        background: SURFACE,
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Header / toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: compact ? '0.625rem 0.875rem' : '0.875rem 1.125rem',
          background: open ? 'hsla(192,72%,48%,0.06)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: compact ? 20 : 24,
            height: compact ? 20 : 24,
            borderRadius: 4,
            background: `${LYTE}15`,
            border: `1px solid ${LYTE}25`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FileCheck size={compact ? 10 : 12} style={{ color: LYTE }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: compact ? '0.6875rem' : '0.75rem',
                fontFamily: MONO,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: LYTE,
              }}
            >
              Proof Drawer
            </span>
            <span style={{ fontSize: '0.575rem', fontFamily: MONO, color: TEXT_FAINT }}>
              {proof.id}
            </span>
          </div>
          {!compact && (
            <div
              style={{
                display: 'flex',
                gap: '0.375rem',
                marginTop: '0.25rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <ProofBadge value={proof.reviewState} map={REVIEW_LABELS} />
              <ProofBadge value={proof.exportSafety} map={EXPORT_LABELS} />
              {!allPolicyPassed && (
                <span
                  style={{
                    fontSize: '0.575rem',
                    fontFamily: MONO,
                    fontWeight: 700,
                    color: YELLOW,
                    background: `${YELLOW}12`,
                    border: `1px solid ${YELLOW}22`,
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  {failedPolicies.length} policy gate{failedPolicies.length > 1 ? 's' : ''} failed
                </span>
              )}
              <span style={{ fontSize: '0.6rem', fontFamily: MONO, color: TEXT_FAINT }}>
                {proof.sourceSystem} · {(proof.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
          )}
        </div>
        {open ? (
          <ChevronUp size={14} style={{ color: TEXT_FAINT, flexShrink: 0 }} />
        ) : (
          <ChevronDown size={14} style={{ color: TEXT_FAINT, flexShrink: 0 }} />
        )}
      </button>

      {/* Expanded panel */}
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: `1px solid ${BORDER}` }}>
              {/* Sub-tabs */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}` }}>
                {(['summary', 'chain', 'policy', 'metadata'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSection(tab)}
                    style={{
                      padding: '0.5rem 0.875rem',
                      border: 'none',
                      borderBottom: `2px solid ${activeSection === tab ? LYTE : 'transparent'}`,
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.6875rem',
                      fontWeight: activeSection === tab ? 700 : 500,
                      fontFamily: MONO,
                      color: activeSection === tab ? LYTE : TEXT_FAINT,
                      textTransform: 'capitalize',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div style={{ padding: '1rem 1.125rem' }}>
                {activeSection === 'summary' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {[
                      { label: 'Source system', value: proof.sourceSystem },
                      { label: 'Source domain', value: proof.sourceDomain },
                      { label: 'Signal type', value: proof.signalType.replace(/_/g, ' ') },
                    ].map((row) => (
                      <div
                        key={row.label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.375rem 0',
                          borderBottom: `1px solid ${BORDER}`,
                        }}
                      >
                        <span
                          style={{ fontSize: '0.6875rem', color: TEXT_FAINT, fontFamily: MONO }}
                        >
                          {row.label}
                        </span>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: TEXT_SEC }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.375rem 0',
                        borderBottom: `1px solid ${BORDER}`,
                      }}
                    >
                      <span style={{ fontSize: '0.6875rem', color: TEXT_FAINT, fontFamily: MONO }}>
                        Confidence
                      </span>
                      <div style={{ width: '60%', display: 'flex', alignItems: 'center' }}>
                        <ConfidenceMeter value={proof.confidence} />
                      </div>
                    </div>
                    {proof.model && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.375rem 0',
                          borderBottom: `1px solid ${BORDER}`,
                        }}
                      >
                        <span
                          style={{ fontSize: '0.6875rem', color: TEXT_FAINT, fontFamily: MONO }}
                        >
                          Model
                        </span>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: TEXT_SEC,
                            fontFamily: MONO,
                          }}
                        >
                          {proof.model}
                          {proof.modelVersion ? ` / ${proof.modelVersion}` : ''}
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.375rem 0',
                        borderBottom: `1px solid ${BORDER}`,
                      }}
                    >
                      <span style={{ fontSize: '0.6875rem', color: TEXT_FAINT, fontFamily: MONO }}>
                        Review state
                      </span>
                      <ProofBadge value={proof.reviewState} map={REVIEW_LABELS} />
                    </div>
                    {proof.reviewedBy && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.375rem 0',
                          borderBottom: `1px solid ${BORDER}`,
                        }}
                      >
                        <span
                          style={{ fontSize: '0.6875rem', color: TEXT_FAINT, fontFamily: MONO }}
                        >
                          Reviewed by
                        </span>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: TEXT_SEC }}>
                          {proof.reviewedBy} · {proof.reviewedAt}
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.375rem 0',
                      }}
                    >
                      <span style={{ fontSize: '0.6875rem', color: TEXT_FAINT, fontFamily: MONO }}>
                        Export safety
                      </span>
                      <ProofBadge value={proof.exportSafety} map={EXPORT_LABELS} />
                    </div>
                  </div>
                )}

                {activeSection === 'chain' && (
                  <div>
                    <p
                      style={{
                        fontSize: '0.625rem',
                        fontFamily: MONO,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: TEXT_FAINT,
                        marginBottom: '0.875rem',
                      }}
                    >
                      Immutable Attribution Chain — {proof.chainLinks.length} events
                    </p>
                    {proof.chainLinks.map((link, i) => (
                      <ChainEntry
                        key={link.id}
                        link={link}
                        isLast={i === proof.chainLinks.length - 1}
                      />
                    ))}
                  </div>
                )}

                {activeSection === 'policy' && (
                  <div>
                    <p
                      style={{
                        fontSize: '0.625rem',
                        fontFamily: MONO,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: TEXT_FAINT,
                        marginBottom: '0.875rem',
                      }}
                    >
                      Covenant Policy Checks — {proof.policyChecks.filter((p) => p.passed).length}/
                      {proof.policyChecks.length} passed
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {proof.policyChecks.map((check, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 5,
                            background: check.passed
                              ? 'hsla(142,60%,48%,0.07)'
                              : 'hsla(0,72%,54%,0.07)',
                            border: `1px solid ${check.passed ? 'hsla(142,60%,48%,0.15)' : 'hsla(0,72%,54%,0.15)'}`,
                          }}
                        >
                          {check.passed ? (
                            <CheckCircle2
                              size={12}
                              style={{ color: GREEN, flexShrink: 0, marginTop: '1px' }}
                            />
                          ) : (
                            <AlertTriangle
                              size={12}
                              style={{ color: RED, flexShrink: 0, marginTop: '1px' }}
                            />
                          )}
                          <div>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: check.passed ? TEXT_SEC : TEXT,
                              }}
                            >
                              {check.label}
                            </span>
                            {check.note && (
                              <p
                                style={{
                                  fontSize: '0.6875rem',
                                  color: TEXT_FAINT,
                                  margin: '0.1rem 0 0',
                                  lineHeight: 1.4,
                                }}
                              >
                                {check.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'metadata' && proof.metadata && (
                  <div>
                    <p
                      style={{
                        fontSize: '0.625rem',
                        fontFamily: MONO,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: TEXT_FAINT,
                        marginBottom: '0.875rem',
                      }}
                    >
                      Signal Metadata
                    </p>
                    {Object.entries(proof.metadata).map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.375rem 0',
                          borderBottom: `1px solid ${BORDER}`,
                        }}
                      >
                        <span
                          style={{ fontSize: '0.6875rem', color: TEXT_FAINT, fontFamily: MONO }}
                        >
                          {k}
                        </span>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: TEXT_SEC }}>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action row */}
                <div
                  style={{
                    marginTop: '0.875rem',
                    paddingTop: '0.875rem',
                    borderTop: `1px solid ${BORDER}`,
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {proof.reviewState === 'unreviewed' && (
                    <button
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: 5,
                        background: `${LYTE}15`,
                        border: `1px solid ${LYTE}25`,
                        cursor: 'pointer',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: LYTE,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <Eye size={11} /> Mark reviewed
                    </button>
                  )}
                  {proof.exportSafety === 'safe' && (
                    <button
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: 5,
                        background: 'transparent',
                        border: `1px solid ${BORDER}`,
                        cursor: 'pointer',
                        fontSize: '0.6875rem',
                        color: TEXT_SEC,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <Download size={11} /> Export
                    </button>
                  )}
                  <button
                    style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: 5,
                      background: 'transparent',
                      border: `1px solid ${BORDER}`,
                      cursor: 'pointer',
                      fontSize: '0.6875rem',
                      color: TEXT_FAINT,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <ExternalLink size={11} /> View in Proof Chain
                  </button>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const SAMPLE_PROOF_RECORD: ProofRecord = {
  id: 'PCH-SF1-20260416',
  sourceSystem: 'Aegis SOC Feed',
  sourceDomain: 'PARAGON',
  signalType: 'threat_intelligence',
  confidence: 0.94,
  model: 'gpt-4o-mini',
  modelVersion: '2025-07-01',
  reviewState: 'unreviewed',
  exportSafety: 'pending_review',
  policyChecks: [
    { label: 'Role: ops_analyst — permitted', passed: true },
    { label: 'Domain: Aegis — in scope', passed: true },
    { label: 'Action: recommend_isolation — permitted', passed: true },
    { label: 'Human-in-loop gate: required before execution', passed: true },
    {
      label: 'Review state: must be human_reviewed before export',
      passed: false,
      note: 'Export blocked until review complete',
    },
    { label: 'Export safety: no PII in output', passed: true },
  ],
  chainLinks: [
    {
      id: 'c1',
      event: 'Signal ingested from Aegis threat feed',
      actor: 'System / Prism Bus',
      timestamp: '16 Apr 2026 08:14:22',
      hash: 'sha256:a3f7b2c1d...',
    },
    {
      id: 'c2',
      event: 'Signal correlated with IMPERIUM drift event',
      actor: 'System / Signal Fusion',
      timestamp: '16 Apr 2026 08:14:24',
      hash: 'sha256:9e1d4f2a8...',
    },
    {
      id: 'c3',
      event: 'AI recommendation generated with evidence lineage',
      actor: 'Model: gpt-4o-mini',
      timestamp: '16 Apr 2026 08:14:27',
      hash: 'sha256:b4e8f3c6d...',
    },
    {
      id: 'c4',
      event: 'Policy check passed — escalated to SOC Lead',
      actor: 'System / Covenant Policy',
      timestamp: '16 Apr 2026 08:14:29',
      hash: 'sha256:c2a9d1f7e...',
    },
  ],
  metadata: {
    'Signal ID': 'SIG-20260416-001',
    'MITRE Technique': 'T1071.001',
    'Affected asset': 'auth-svc (prod)',
    'SLA window': '2h',
    'Correlation ID': 'CORR-SF1-SF6',
  },
};
