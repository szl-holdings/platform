import { cn } from "../utils";
import { EvidenceBadge, type EvidenceSource } from "./EvidenceBadge";
import { FreshnessChip } from "./FreshnessChip";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { PolicyStateChip, type PolicyState } from "./PolicyStateChip";
import { AutonomyModeToggle, type AutonomyMode } from "./AutonomyModeToggle";

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
}: ProofEnvelopeProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#243040] bg-[#0d1520]",
        "shadow-[0_4px_12px_rgba(0,0,0,0.6)]",
        "overflow-hidden",
        className
      )}
      style={{ borderLeftColor: accentColor, borderLeftWidth: 2 }}
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
          <PolicyStateChip state={policyState} reason={policyReason} />
          <div className="ml-auto">
            <AutonomyModeToggle
              value={autonomyMode}
              onChange={onAutonomyChange}
              readOnly={readOnlyAutonomy}
              variant="compact"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
