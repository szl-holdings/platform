import { useCallback, useEffect, useState } from 'react';
import { color, v } from '../tokens/index.js';
import { cn } from '../utils.js';
import { type AutonomyMode, AutonomyModeToggle } from './AutonomyModeToggle.js';
import { ConfidenceMeter } from './ConfidenceMeter.js';
import { EvidenceBadge, type EvidenceSource } from './EvidenceBadge.js';
import { FreshnessChip } from './FreshnessChip.js';
import { type PolicyState, PolicyStateChip } from './PolicyStateChip.js';

export interface AutonomyDecision {
  policyState: PolicyState;
  policyReason?: string;
  disposition: 'execute' | 'queue' | 'draft' | 'block';
  mode: AutonomyMode;
}

export interface ProofEnvelopeProps {
  /** The recommendation or AI-output card content */
  children: React.ReactNode;
  evidence: EvidenceSource[];
  timestamp: string | Date | null | undefined;
  confidence: number;
  contradiction?: boolean;
  policyState: PolicyState;
  policyReason?: string;
  autonomyMode: AutonomyMode;
  onAutonomyChange?: (mode: AutonomyMode) => void;
  readOnlyAutonomy?: boolean;
  /** Optional title bar above children */
  title?: string;
  /** Optional accent color for the left border (per-product) */
  accentColor?: string;
  className?: string;
  /**
   * Domain identifier (e.g. "vessels.routing", "holdings.deal-scoring").
   * When set, mode changes PATCH /api/alloy/autonomy-mode and the resulting
   * policy decision is surfaced via the policy chip.
   */
  domain?: string;
  /** Override base URL for the autonomy endpoint (used by tests / non-web hosts). */
  autonomyEndpoint?: string;
  /** Suggested action label, sent to the evaluator for human-readable reasons. */
  actionLabel?: string;
}

const DEFAULT_AUTONOMY_ENDPOINT = '/api/alloy/autonomy-mode';

async function patchAutonomyMode(
  endpoint: string,
  domain: string,
  mode: AutonomyMode,
): Promise<AutonomyDecision | null> {
  try {
    const res = await fetch(endpoint, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, mode }),
    });
    if (!res.ok) {
      // 401/403/etc — surface a degraded reason but don't crash the UI.
      return {
        policyState: 'blocked',
        policyReason: `Autonomy mode change rejected (${res.status}). Mode not persisted.`,
        disposition: 'block',
        mode,
      };
    }
    const json = (await res.json()) as { data?: { decision?: AutonomyDecision } };
    return json?.data?.decision ?? null;
  } catch (err) {
    return {
      policyState: 'blocked',
      policyReason: `Could not reach Alloy autonomy service — mode not persisted (${(err as Error).message}).`,
      disposition: 'block',
      mode,
    };
  }
}

export function ProofEnvelope({
  children,
  evidence,
  timestamp,
  confidence,
  contradiction,
  policyState,
  policyReason,
  autonomyMode,
  onAutonomyChange,
  readOnlyAutonomy,
  title,
  accentColor = color.accent.blue,
  className,
  domain,
  autonomyEndpoint = DEFAULT_AUTONOMY_ENDPOINT,
  actionLabel,
}: ProofEnvelopeProps) {
  const [liveDecision, setLiveDecision] = useState<AutonomyDecision | null>(null);
  const [pending, setPending] = useState(false);

  // Reset overlay when caller-supplied policy changes (e.g. new envelope mount).
  useEffect(() => {
    setLiveDecision(null);
  }, [policyState, policyReason]);

  const handleChange = useCallback(
    async (mode: AutonomyMode) => {
      onAutonomyChange?.(mode);
      if (!domain) return;
      setPending(true);
      const decision = await patchAutonomyMode(autonomyEndpoint, domain, mode);
      if (decision) setLiveDecision(decision);
      setPending(false);
    },
    [onAutonomyChange, domain, autonomyEndpoint],
  );

  const effectivePolicyState = liveDecision?.policyState ?? policyState;
  const effectivePolicyReason =
    liveDecision?.policyReason ??
    policyReason ??
    (actionLabel && liveDecision?.disposition === 'execute'
      ? `Cleared to execute: ${actionLabel}`
      : undefined);

  return (
    <div
      style={{
        borderColor: v.borderDefault,
        backgroundColor: v.bgSurface,
        borderLeftColor: accentColor,
        borderLeftWidth: 2,
      }}
      className={cn('rounded-xl border shadow-lg overflow-hidden', className)}
      data-autonomy-pending={pending ? 'true' : undefined}
      data-autonomy-domain={domain}
    >
      {title && (
        <div style={{ borderColor: v.borderSubtle }} className="border-b px-4 py-2.5">
          <h3 style={{ color: v.textPrimary }} className="text-sm font-semibold">
            {title}
          </h3>
        </div>
      )}

      <div className="px-4 py-3">{children}</div>

      <div style={{ borderColor: v.borderSubtle }} className="border-t px-4 py-2.5 bg-black/30">
        <div className="flex flex-wrap items-center gap-3">
          <EvidenceBadge sources={evidence} />
          <FreshnessChip timestamp={timestamp} showAbsolute />
          <ConfidenceMeter
            value={confidence}
            {...(contradiction !== undefined ? { contradiction } : {})}
            label="Confidence"
            variant="compact"
          />
          <PolicyStateChip
            state={effectivePolicyState}
            {...(effectivePolicyReason !== undefined ? { reason: effectivePolicyReason } : {})}
          />
          <div className="ml-auto">
            <AutonomyModeToggle
              value={autonomyMode}
              onChange={handleChange}
              readOnly={readOnlyAutonomy || pending}
              variant="compact"
            />
          </div>
        </div>
        {liveDecision?.policyReason && (
          <div
            style={{ color: v.textSecondary }}
            className="mt-2 text-[11px] leading-snug"
            role="status"
            aria-live="polite"
          >
            <span style={{ color: v.textMuted }} className="font-semibold uppercase tracking-wide">
              Alloy:
            </span>{' '}
            {liveDecision.policyReason}
          </div>
        )}
      </div>
    </div>
  );
}
