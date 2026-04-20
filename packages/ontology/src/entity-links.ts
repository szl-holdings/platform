/**
 * Entity link type definitions for the SZL Holdings platform.
 *
 * Entity links describe typed relationships between entities. Every link
 * carries directionality, confidence, and a freshness stamp.
 *
 * Source of truth: ontology.md § Entity Links
 */

import type { Domain } from './domains.js';
import type { EntityType, FreshnessLevel } from './entities.js';
import type { EvidenceRef } from './evidence.js';

// ---------------------------------------------------------------------------
// Link Types
// ---------------------------------------------------------------------------

export const ENTITY_LINK_TYPES = [
  'triggers', // signal → recommendation
  'supports', // evidence → recommendation or action
  'approved_by', // action → approval
  'part_of', // voyage → vessel; matter → engagement
  'related_to', // generic association
  'caused_by', // outcome ← action
  'escalated_to', // approval → higher approver
  'supersedes', // new recommendation → old recommendation
  'correlated_with', // cross-domain signal correlation
  'owned_by', // deal → org; matter → client
  'assigned_to', // action → agent or user
  'derived_from', // entity derived from another (e.g. snapshot)
  'blocks', // policy decision blocks an action
  'resolves', // action resolves an incident or matter
] as const;

export type EntityLinkType = (typeof ENTITY_LINK_TYPES)[number];

// ---------------------------------------------------------------------------
// Entity Link Shape
// ---------------------------------------------------------------------------

/**
 * A typed relationship between two entities.
 *
 * Links carry confidence and freshness because the relationship itself
 * may be inferred (e.g. cross-domain correlation) and may decay over time.
 */
export interface EntityLink {
  id: string;
  fromEntityType: EntityType;
  fromEntityId: string;
  toEntityType: EntityType;
  toEntityId: string;
  linkType: EntityLinkType;
  confidence: number; // 0..1 — certainty of the relationship
  freshness: FreshnessLevel;
  orgId: string;
  domain: Domain;
  correlationId?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  evidence?: EvidenceRef[] | undefined;
  metadata?: Record<string, unknown> | undefined;
}

// ---------------------------------------------------------------------------
// Link Direction Semantics
// ---------------------------------------------------------------------------

export const LINK_TYPE_DESCRIPTIONS: Record<EntityLinkType, string> = {
  triggers: 'The source signal triggered creation of the target recommendation or workflow',
  supports: 'The source evidence supports the validity of the target recommendation or action',
  approved_by: 'The source action was approved by the target approval decision',
  part_of: 'The source entity is a component of the target container entity',
  related_to: 'Generic association — the source and target are operationally related',
  caused_by: 'The source outcome was caused by the target action',
  escalated_to: 'The source approval was escalated to the target approver or role',
  supersedes: 'The source recommendation or policy supersedes the target (which is now stale)',
  correlated_with: 'The source and target signals are correlated across domains',
  owned_by: 'The source entity is owned or controlled by the target org or counterparty',
  assigned_to: 'The source action or workflow step is assigned to the target agent or user',
  derived_from: 'The source entity was derived from or is a snapshot of the target',
  blocks: 'The source policy decision or approval is blocking the target action',
  resolves: 'The source action or decision resolves the target incident, matter, or issue',
};

export function isEntityLinkType(value: unknown): value is EntityLinkType {
  return ENTITY_LINK_TYPES.includes(value as EntityLinkType);
}
