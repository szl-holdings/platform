/**
 * @deprecated `@szl-holdings/ui-command` is superseded by `@szl-holdings/design-system`.
 *
 * Migration guide:
 * - Cockpit primitives (DenseTable, TimelineLane, GraphCanvas, MapSurface, NarrativePanel)
 *   are now in `@szl-holdings/design-system/cockpit`.
 * - Proof-envelope components (EvidenceBadge, FreshnessChip, ConfidenceMeter,
 *   PolicyStateChip, AutonomyModeToggle, ProofEnvelope) are in `@szl-holdings/design-system/proof`.
 * - These components remain exported here for backwards compatibility but will be removed
 *   in a future major version. Migrate consumers to the new package before then.
 */

/**
 * @deprecated Use `@szl-holdings/design-system` cockpit primitives instead.
 * This component continues to work but will be removed in a future major version.
 */
export { KPIBlock, KPIGrid } from "./KPIBlock";

/**
 * @deprecated Use `TimelineLane` from `@szl-holdings/design-system/cockpit` instead.
 * This component continues to work but will be removed in a future major version.
 */
export { CausalTimeline } from "./CausalTimeline";

/**
 * @deprecated Use `ProofEnvelope` + `DenseTable` from `@szl-holdings/design-system` instead.
 * This component continues to work but will be removed in a future major version.
 */
export { RecommendationQueue } from "./RecommendationQueue";

/**
 * @deprecated Use `GraphCanvas` from `@szl-holdings/design-system/cockpit` instead.
 * This component continues to work but will be removed in a future major version.
 */
export { RiskHeatmap } from "./RiskHeatmap";

/**
 * @deprecated Use `DenseTable` from `@szl-holdings/design-system/cockpit` instead.
 * This component continues to work but will be removed in a future major version.
 */
export { ValueLedger } from "./ValueLedger";

/**
 * @deprecated Use `PolicyStateChip` + `AutonomyModeToggle` from `@szl-holdings/design-system/proof` instead.
 * This component continues to work but will be removed in a future major version.
 */
export { ActionControlPanel } from "./ActionControlPanel";

/**
 * @deprecated Use `NarrativePanel` + `ProofEnvelope` from `@szl-holdings/design-system` instead.
 * This component continues to work but will be removed in a future major version.
 */
export { ExecutiveSummary } from "./ExecutiveSummary";

/**
 * @deprecated Use `GraphCanvas` from `@szl-holdings/design-system/cockpit` instead.
 * This component continues to work but will be removed in a future major version.
 */
export { EntityGraph } from "./EntityGraph";

export type {
  CausalEvent,
  KPIMetric,
  Recommendation,
  RiskItem,
  OpportunityItem,
  ValueEntry,
  ActionItem,
  ActionStatus,
  Severity,
  Trend,
  RiskLevel,
} from "./types";
export type { GraphNode, GraphEdge } from "./EntityGraph";
export type { ExecSummaryConfig } from "./ExecutiveSummary";
