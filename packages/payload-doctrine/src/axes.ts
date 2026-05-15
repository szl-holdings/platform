import type { LambdaAxis } from "./types.js";

// Source: /tmp/payload/dev3_agi_v5/agi_v5_payload.json -> charter."9_axes".
// Floors: lambda_floor 0.90 conjunctive; moralGrounding and measurabilityHonesty 0.95.
// Descriptions are short paraphrases of the V6 doctrine; not copied from a verbatim
// source field (the charter lists axis names only). Marked as the conjunctive Λ-gate.
export const LAMBDA_AXES: ReadonlyArray<LambdaAxis> = [
  {
    id: "moralGrounding",
    name: "Moral Grounding",
    floor: 0.95,
    description:
      "Refusal of operations that violate the constitutional moral floor.",
  },
  {
    id: "measurabilityHonesty",
    name: "Measurability Honesty",
    floor: 0.95,
    description:
      "All claims must be measurable; uncertainty and gaps are reported, never papered over.",
  },
  {
    id: "temporalConsistency",
    name: "Temporal Consistency",
    floor: 0.9,
    description:
      "Decisions and receipts remain consistent across replay and across time-ordered observations.",
  },
  {
    id: "informationIntegrity",
    name: "Information Integrity",
    floor: 0.9,
    description:
      "Source provenance, hash chains, and citations are preserved end-to-end.",
  },
  {
    id: "actionReversibility",
    name: "Action Reversibility",
    floor: 0.9,
    description:
      "One-way doors are gated by explicit confirmation; recoverable actions are preferred.",
  },
  {
    id: "scopeContainment",
    name: "Scope Containment",
    floor: 0.9,
    description:
      "Side effects stay inside the declared blast radius of the workcell.",
  },
  {
    id: "stakeholderAlignment",
    name: "Stakeholder Alignment",
    floor: 0.9,
    description:
      "Outputs respect the intent of the requesting principal and downstream stakeholders.",
  },
  {
    id: "evidenceAdequacy",
    name: "Evidence Adequacy",
    floor: 0.9,
    description:
      "Conclusions are backed by sufficient, citable evidence retained on the proof chain.",
  },
  {
    id: "consentBoundary",
    name: "Consent Boundary",
    floor: 0.9,
    description:
      "Personal, tenant-scoped, and licensed data is only used within the consent envelope.",
  },
];
