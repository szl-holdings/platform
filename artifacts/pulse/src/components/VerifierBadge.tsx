import { AlertTriangle, CheckCircle2, Clock, } from 'lucide-react';

export type VerifierStatus = 'passed' | 'revision_required' | 'pending';

const STATUS_CONFIG: Record<
  VerifierStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  passed: {
    label: 'Verifier Passed',
    color: '#4eca8b',
    bg: 'rgba(78,202,139,0.08)',
    icon: <CheckCircle2 size={11} />,
  },
  revision_required: {
    label: 'Revision Required',
    color: '#e8855b',
    bg: 'rgba(232,133,91,0.08)',
    icon: <AlertTriangle size={11} />,
  },
  pending: {
    label: 'Verification Pending',
    color: '#a0aec0',
    bg: 'rgba(160,174,192,0.08)',
    icon: <Clock size={11} />,
  },
};

interface VerifierBadgeProps {
  status: VerifierStatus;
  feedback?: string | null;
  compact?: boolean;
}

export function VerifierBadge({ status, feedback, compact = false }: VerifierBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <div style={{ display: 'inline-block' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: compact ? '2px 7px' : '4px 10px',
          borderRadius: 5,
          background: config.bg,
          border: `1px solid ${config.color}35`,
          color: config.color,
          fontSize: compact ? '0.6rem' : '0.67rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {config.icon}
        <span>{config.label}</span>
      </div>
      {!compact && feedback && (
        <div
          style={{
            marginTop: 5,
            padding: '5px 8px',
            borderRadius: 4,
            background: 'rgba(232,133,91,0.06)',
            border: '1px solid rgba(232,133,91,0.2)',
            fontSize: '0.67rem',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: '#e8855b', fontWeight: 600 }}>Verifier: </span>
          {feedback}
        </div>
      )}
    </div>
  );
}

interface AutonomyTierBadgeProps {
  tier: string;
}

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  'human-approval-mandatory': { label: 'Human Approval Required', color: '#e53e3e' },
  'human-in-the-loop': { label: 'Human in the Loop', color: '#e8855b' },
  'supervised-autonomy': { label: 'Supervised Autonomy', color: '#c8a84b' },
  'full-autonomy': { label: 'Full Autonomy', color: '#4eca8b' },
};

export function AutonomyTierBadge({ tier }: AutonomyTierBadgeProps) {
  const config = TIER_CONFIG[tier] ?? { label: tier, color: '#888' };
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 5,
        background: `${config.color}10`,
        border: `1px solid ${config.color}35`,
        color: config.color,
        fontSize: '0.63rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {config.label}
    </div>
  );
}
