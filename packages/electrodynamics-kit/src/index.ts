/**
 * @szl-holdings/electrodynamics-kit
 *
 * Precision-electromagnetics / motion-control / aerospace-navigation
 * primitives re-expressed against SZL Doctrine V6. See
 * docs/research/electrodynamics-synthesis-2026.md.
 *
 * Every module is pure (no I/O, no global state). Consumers (typically
 * the api-server electrodynamics route) emit the receipts on the
 * critical path; the package defines the receipt-class constants and
 * the validators that must succeed before a receipt is written.
 */

export * from './actuator-command.js';
export * from './device-lifecycle.js';
export * from './bus-budget.js';
export * from './mission-graph.js';
export * from './engagement-dosimetry.js';
export * from './swarm-consensus.js';
export * from './redundancy-envelope.js';
export * from './nav-state-fusion.js';
export * from './em-field-step.js';
export * from './sealed-capability.js';

export const ELECTRODYNAMICS_KIT_VERSION = '0.1.0' as const;

// ─── Receipt class constants (registered against szl-receipts namespace) ───

export const ACTUATOR_COMMAND_RECEIPT_CLASS = 'actuator.command.v1' as const;
export const DEVICE_LIFECYCLE_RECEIPT_CLASS = 'device.lifecycle.v1' as const;
export const BUS_DELIVERY_RECEIPT_CLASS = 'bus.delivery.v1' as const;
export const MISSION_GRAPH_RECEIPT_CLASS = 'mission.graph.v1' as const;
export const ENGAGEMENT_DOSIMETRY_RECEIPT_CLASS = 'engagement.dosimetry.v1' as const;
export const SWARM_CONSENSUS_RECEIPT_CLASS = 'swarm.consensus.v1' as const;
export const REDUNDANCY_MODE_TRANSITION_RECEIPT_CLASS =
  'redundancy.mode-transition.v1' as const;
export const NAVIGATION_STATE_FUSION_RECEIPT_CLASS = 'navigation.state-fusion.v1' as const;
export const EM_FIELD_STEP_RECEIPT_CLASS = 'em.field-step.v1' as const;
export const CAPABILITY_SEALED_RECEIPT_CLASS = 'capability.sealed.v1' as const;
export const RECOMMENDATION_LINEAGE_RECEIPT_CLASS = 'recommendation.lineage.v1' as const;
