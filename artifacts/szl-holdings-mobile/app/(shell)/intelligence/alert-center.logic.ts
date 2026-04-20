/**
 * Pure logic extracted from the Alert Center screen.
 * Imported by both the screen and its tests so regressions are caught.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type BriefingSeverity = "info" | "warning" | "critical";

export interface FusionSignalLike {
  id: string;
  severity: Severity;
}

export interface ApprovalLike {
  id: number;
  status: string;
  priority: string;
}

export interface DomainSnapshotLike {
  domain: string;
  healthScore: number;
  staleFraction: number;
}

export interface BriefingResponseLike {
  domains: DomainSnapshotLike[];
  alerts: Array<{ domain: string; message: string; severity: BriefingSeverity }>;
}

export const ENDPOINTS = {
  signals: "/api/cortex/intelligence-feed",
  escalations: "/api/approvals?status=escalated",
  briefing: "/api/briefings",
} as const;

export const SEV_COLORS: Record<Severity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#3b82f6",
  info: "#6b7280",
};

export function filterCriticalSignals<T extends FusionSignalLike>(signals: T[]): T[] {
  return signals.filter((s) => s.severity === "critical" || s.severity === "high");
}

export function normalizeApprovals<T>(raw: { data: T[] } | T[] | undefined): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return (raw as { data: T[] }).data ?? [];
}

export function synthesizeStaleDomainAlerts(
  brief: BriefingResponseLike | undefined,
): Array<{ domain: string; message: string; severity: "warning" | "critical" }> {
  if (!brief) return [];
  return brief.domains
    .filter((d) => d.staleFraction > 0.3)
    .map((d) => ({
      domain: d.domain,
      message: `${Math.round(d.staleFraction * 100)}% of ${d.domain} entities are stale. Health score: ${Math.round(d.healthScore * 100)}%`,
      severity: d.staleFraction > 0.7 ? ("critical" as const) : ("warning" as const),
    }));
}

export function computeTabBadges(
  criticalSignals: readonly FusionSignalLike[],
  escalations: readonly ApprovalLike[],
  worldModelAlerts: ReadonlyArray<{ severity: BriefingSeverity }>,
): { signals: number; escalations: number; worldModel: number } {
  return {
    signals: criticalSignals.length,
    escalations: escalations.length,
    worldModel: worldModelAlerts.filter((a) => a.severity === "critical").length,
  };
}
