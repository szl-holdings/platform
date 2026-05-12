/**
 * Primitive 26 — Classification ladder.
 *
 * Source: J. Robert Oppenheimer Papers, Library of Congress, MSS35188,
 *   Series 15–17 (subject and general case files).
 *
 * UNCLASSIFIED < CONFIDENTIAL < SECRET < TOP_SECRET < RESTRICTED_DATA
 *
 * The ladder is monotone: a release at level L includes everything at
 * lower levels. Cross-level reads require either equal-or-higher
 * clearance OR an explicit downgrade order with citation.
 */

export type ClassLevel =
  | "UNCLASSIFIED"
  | "CONFIDENTIAL"
  | "SECRET"
  | "TOP_SECRET"
  | "RESTRICTED_DATA";

export const CLASS_RANK: Record<ClassLevel, number> = {
  UNCLASSIFIED: 0,
  CONFIDENTIAL: 1,
  SECRET: 2,
  TOP_SECRET: 3,
  RESTRICTED_DATA: 4,
};

import type { ClearanceLevel } from "./clearance-ledger.js";

const CLEARANCE_FOR_CLASS: Record<ClassLevel, ClearanceLevel> = {
  UNCLASSIFIED: "PUBLIC",
  CONFIDENTIAL: "CONFIDENTIAL",
  SECRET: "SECRET",
  TOP_SECRET: "TOP_SECRET",
  RESTRICTED_DATA: "RESTRICTED_DATA",
};

export interface DowngradeOrder {
  from: ClassLevel;
  to: ClassLevel;
  basisCitation: string;
  authorizedBy: string;
}

export interface ClassificationDecision {
  artifactId: string;
  declared: ClassLevel;
  effective: ClassLevel;
  downgrades: DowngradeOrder[];
  reason: string;
}

export function downgrade(
  artifactId: string,
  declared: ClassLevel,
  orders: DowngradeOrder[],
): ClassificationDecision {
  let effective = declared;
  const applied: DowngradeOrder[] = [];
  for (const o of orders) {
    if (CLASS_RANK[o.from] !== CLASS_RANK[effective]) {
      throw new Error(
        `Downgrade chain broken: order from=${o.from} but current effective=${effective}.`,
      );
    }
    if (CLASS_RANK[o.to] >= CLASS_RANK[o.from]) {
      throw new Error(`Downgrade must go strictly lower: ${o.from} → ${o.to}.`);
    }
    if (!o.basisCitation || !o.authorizedBy) {
      throw new Error("Each downgrade order requires basisCitation and authorizedBy.");
    }
    effective = o.to;
    applied.push(o);
  }
  return {
    artifactId,
    declared,
    effective,
    downgrades: applied,
    reason:
      applied.length === 0
        ? `No downgrades; effective level = declared (${declared}).`
        : `Downgraded ${applied.length} step(s): ${declared} → ${effective}.`,
  };
}

export function canRead(
  decision: ClassificationDecision,
  readerClearance: ClearanceLevel,
): boolean {
  const required = CLEARANCE_FOR_CLASS[decision.effective];
  return (
    (
      {
        NONE: 0,
        PUBLIC: 1,
        CONFIDENTIAL: 2,
        SECRET: 3,
        TOP_SECRET: 4,
        RESTRICTED_DATA: 5,
      } as Record<ClearanceLevel, number>
    )[readerClearance] >=
    (
      {
        NONE: 0,
        PUBLIC: 1,
        CONFIDENTIAL: 2,
        SECRET: 3,
        TOP_SECRET: 4,
        RESTRICTED_DATA: 5,
      } as Record<ClearanceLevel, number>
    )[required]
  );
}
