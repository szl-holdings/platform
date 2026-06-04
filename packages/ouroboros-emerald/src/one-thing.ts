/**
 * Primitive 38 — One-Thing identity (substance preservation)
 *
 * Emerald Tablet: "all things have been and arose from one
 * by the mediation of one." Operationalised as a substance-id
 * preservation check across transformations: every output must
 * trace back to a declared origin substance, and the conserved
 * quantity (mass / count / hash-trail) must match.
 */

export interface SubstanceTrace {
  originId: string;
  conserved: number;       // e.g. mass, token count
  transformations: string[]; // ordered list of named ops
}

export interface OneThingReceipt {
  originId: string;
  preTotal: number;
  postTotal: number;
  driftAbs: number;
  driftRel: number;
  tolerance: number;
  preserved: boolean;
  rationale: string;
}

export function checkOneThing(
  pre: SubstanceTrace,
  post: SubstanceTrace,
  tolerance = 1e-9,
): OneThingReceipt {
  if (pre.originId !== post.originId) {
    return {
      originId: pre.originId,
      preTotal: pre.conserved,
      postTotal: post.conserved,
      driftAbs: NaN,
      driftRel: NaN,
      tolerance,
      preserved: false,
      rationale: `origin mismatch: ${pre.originId} -> ${post.originId}`,
    };
  }
  const driftAbs = Math.abs(post.conserved - pre.conserved);
  const denom = Math.max(Math.abs(pre.conserved), 1e-12);
  const driftRel = driftAbs / denom;
  const preserved = driftRel <= tolerance;
  return {
    originId: pre.originId,
    preTotal: pre.conserved,
    postTotal: post.conserved,
    driftAbs,
    driftRel,
    tolerance,
    preserved,
    rationale: preserved
      ? "one-thing identity preserved: conserved quantity within tolerance"
      : "one-thing violated: substance not conserved across transformations",
  };
}
