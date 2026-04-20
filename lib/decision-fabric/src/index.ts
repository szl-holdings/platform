/**
 * @szl-holdings/decision-fabric
 *
 * Unifying layer above the canonical primitives (Outcome Graph, Proof Chain,
 * Covenant Policy, Prism Bus, Workflow Engine, Monte Carlo, Approvals). Adds:
 *
 *   • Cross-signal correlation index   → correlation.ts
 *   • Decision records + memory        → decision-records.ts
 *   • Workflow 360 timeline view       → workflow-360.ts
 *   • Entity-centric investigation     → entity-investigation.ts
 *   • Recommendation→outcome trace     → traceability.ts
 *   • Approval & policy bottlenecks    → bottlenecks.ts
 *   • Pattern retrieval + playbooks    → patterns.ts
 *   • Learning loop calibration        → learning-loop.ts
 */

export * from './bottlenecks';
export type {
  TemporallyCorrelatedEvent,
  TemporalProximityOptions,
} from './correlation';
export * from './correlation';
export * from './decision-records';
export * from './entity-investigation';
export * from './learning-loop';
export * from './patterns';
export * from './traceability';
export * from './workflow-360';
