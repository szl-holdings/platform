/**
 * anatomy/ — T14 Anatomy (composed body) thesis. DATA, not code.
 *
 * Backing (PARTIAL): the organ→module mapping from
 * szl/audit_.../ANATOMY_TO_MODULES + cross_repo_mining/ANATOMY_BACKING.md.
 * This module exports the mapping as data (no behavior to fake). Statuses are
 * copied verbatim from the anatomy-alive harness evidence, not asserted.
 */

export type OrganStatus = "BACKED" | "WIRE-ISOLATED" | "PARTIAL";

export interface Organ {
  readonly organ: string;
  readonly product: string;
  readonly status: OrganStatus;
  readonly note: string;
}

/** The composed-body organ map (source: MINING_REPORT.md §1 anatomy verdict). */
export const ANATOMY: readonly Organ[] = [
  { organ: "BRAIN", product: "amaru", status: "BACKED", note: "7-chakra scheduler + memory" },
  { organ: "HEART", product: "a11oy gates", status: "BACKED", note: "policy gates" },
  { organ: "BLOOD", product: "yawar", status: "BACKED", note: "receipt bus (best-effort publish — see HONEST_GAPS)" },
  { organ: "SKELETON", product: "a11oy", status: "BACKED", note: "substrate packages" },
  { organ: "NERVOUS", product: "otel/vsp-otel", status: "BACKED", note: "signed OTel exporter (span injection STAGED)" },
  { organ: "IMMUNE", product: "sentra", status: "WIRE-ISOLATED", note: "code present, no sibling calls it at runtime" },
  { organ: "WIRES", product: "uds-mesh", status: "PARTIAL", note: "schemas/bundles exist; default runtime calls do not" },
  { organ: "COMPOSED", product: "szl", status: "PARTIAL", note: "anatomy-alive harness ties organs but L7 NOT-YET-WIRED" },
] as const;

/** Return the organ record for a product, or undefined. */
export function organFor(product: string): Organ | undefined {
  return ANATOMY.find((o) => o.product === product);
}
