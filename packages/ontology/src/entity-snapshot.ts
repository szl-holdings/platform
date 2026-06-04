/**
 * Entity snapshot type definitions for the SZL Holdings platform.
 *
 * An entity snapshot captures the full state of an entity at a specific
 * point in time. Snapshots are used by the Proof Chain, Replay Core, and
 * the Learning loop to reconstruct context and enable deterministic replay.
 *
 * RULE: Snapshots must freeze policyVersion and simulationRef at capture
 * time. An auditor must be able to reconstruct the exact policy text and
 * simulation parameters that shaped any decision — years after the fact.
 *
 * Source of truth: ontology.md § Entity Snapshots
 */

import type { Domain } from './domains.js';
import type { BaseEntity, EntityType } from './entities.js';

// ---------------------------------------------------------------------------
// Snapshot Reasons
// ---------------------------------------------------------------------------

export const SNAPSHOT_REASONS = [
  'pre_action', // captured before a consequential action
  'post_action', // captured after a consequential action
  'scheduled', // periodic freshness check / world model refresh
  'triggered', // triggered by a signal or event
  'replay', // captured for incident replay
  'calibration', // captured to feed the learning loop
] as const;

export type SnapshotReason = (typeof SNAPSHOT_REASONS)[number];

// ---------------------------------------------------------------------------
// Entity Snapshot Shape
// ---------------------------------------------------------------------------

/**
 * A point-in-time snapshot of an entity's full state.
 *
 * The `entity` field carries the complete entity object as it existed
 * at `capturedAt`. The `policyVersion` and `simulationRef` fields freeze
 * the governance context so that decisions can be replayed deterministically.
 */
export interface EntitySnapshot<T extends BaseEntity = BaseEntity> {
  snapshotId: string;
  entityType: EntityType;
  entityId: string;
  orgId: string;
  domain: Domain;
  capturedAt: Date;
  capturedBy: 'system' | 'agent' | 'human';
  reason: SnapshotReason;
  entity: T;
  policyVersion: string; // frozen policy version at capture time
  simulationRef?: string | undefined; // linked Monte Carlo simulation run ID
  correlationId?: string | undefined; // correlation ID of the triggering signal/action
  metadata?: Record<string, unknown> | undefined;
}

// ---------------------------------------------------------------------------
// Snapshot Bundle (for cross-entity replay)
// ---------------------------------------------------------------------------

/**
 * A bundle of snapshots captured together at a decision point.
 * Used by Replay Core and the Learning loop to reconstruct the full
 * world state as it existed when a decision was made.
 */
export interface SnapshotBundle {
  bundleId: string;
  correlationId: string;
  orgId: string;
  capturedAt: Date;
  reason: SnapshotReason;
  snapshots: Array<EntitySnapshot<BaseEntity>>;
  policyVersion: string;
  simulationRef?: string | undefined;
}

export function isSnapshotReason(value: unknown): value is SnapshotReason {
  return SNAPSHOT_REASONS.includes(value as SnapshotReason);
}
