import { useCallback, useEffect, useState } from "react";
import { cn } from "../utils";
import { EvidenceBadge, type EvidenceSource } from "./EvidenceBadge";
import { FreshnessChip } from "./FreshnessChip";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { PolicyStateChip, type PolicyState } from "./PolicyStateChip";
import { AutonomyModeToggle, type AutonomyMode } from "./AutonomyModeToggle";

export interface AutonomyDecision {
  policyState: PolicyState;
  policyReason?: string;
  disposition: "execute" | "queue" | "draft" | "block";
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

const DEFAULT_AUTONOMY_ENDPOINT = "/api/alloy/autonomy-mode";

async function patchAutonomyMode(
  endpoint: string,
  domain: string,
  mode: AutonomyMode,
): Promise<AutonomyDecision | null> {
  try {
    const res = await fetch(endpoint, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, mode }),
    });
    if (!res.ok) {
      // 401/403/etc — surface a degraded reason but don't crash the UI.
      return {
        policyState: "blocked",
        policyReason: `Autonomy mode change rejected (${res.status}). Mode not persisted.`,
        disposition: "block",
        mode,
      };
    }
    const json = (await res.json()) as { data?: { decision?: AutonomyDecision } };
    return json?.data?.decision ?? null;
  } catch (err) {
    return {
      policyState: "blocked",
      policyReason: `Could not reach Alloy autonomy service — mode not persisted (${(err as Error).message}).`,
      disposition: "block",
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
  accentColor = "#00d4ff",
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
    liveDecision?.policyReason ?? policyReason ??
    (actionLabel && liveDecision?.disposition === "execute"
      ? `Cleared to execute: ${actionLabel}`
      : undefined);

  return (
    <div
      className={cn(
        "rounded-xl border border-[#243040] bg-[#0d1520]",
        "shadow-[0_4px_12px_rgba(0,0,0,0.6)]",
        "overflow-hidden",
        className
      )}
      style={{ borderLeftColor: accentColor, borderLeftWidth: 2 }}
      data-autonomy-pending={pending ? "true" : undefined}
      data-autonomy-domain={domain}
    >
      {title && (
        <div className="border-b border-[#1a2535] px-4 py-2.5">
          <h3 className="text-sm font-semibold text-[#c8d8e8]">{title}</h3>
        </div>
      )}

      <div className="px-4 py-3">{children}</div>

      <div className="border-t border-[#1a2535] bg-[#060b12]/50 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <EvidenceBadge sources={evidence} />
          <FreshnessChip timestamp={timestamp} showAbsolute />
          <ConfidenceMeter
            value={confidence}
            contradiction={contradiction}
            label="Confidence"
            variant="compact"
          />
          <PolicyStateChip state={effectivePolicyState} reason={effectivePolicyReason} />
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
            className="mt-2 text-[11px] leading-snug text-[#7a99b8]"
            role="status"
            aria-live="polite"
          >
            <span className="font-semibold uppercase tracking-wide text-[#4a6070]">
              Alloy:
            </span>{" "}
            {liveDecision.policyReason}
          </div>
        )}
      </div>
    </div>
  );
}
