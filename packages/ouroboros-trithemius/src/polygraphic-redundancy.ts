/**
 * Primitive 56 — Polygraphic redundancy
 *
 * Trithemius's Polygraphiae expanded a single plaintext into
 * multiple parallel cipher renderings. Operationalised: any
 * critical message must be transmitted across >= 3 independent
 * symbolic systems; reception is accepted only if a quorum of
 * decodings agree.
 */

export interface SymbolicRendering {
  systemId: string;
  decoded: string;
}

export interface PolygraphicReceipt {
  systems: number;
  required: number;
  quorumValue: string | null;
  agreementCount: number;
  passes: boolean;
  rationale: string;
}

export function checkPolygraphic(
  renderings: SymbolicRendering[],
  required = 3,
  quorumFraction = 2 / 3,
): PolygraphicReceipt {
  const distinctSystems = new Set(renderings.map((r) => r.systemId)).size;
  if (distinctSystems < required) {
    return {
      systems: distinctSystems,
      required,
      quorumValue: null,
      agreementCount: 0,
      passes: false,
      rationale: `under-redundant: ${distinctSystems} systems < ${required} required`,
    };
  }
  // Tally decoded values across DISTINCT systems (one vote per system, first seen).
  const seenSystems = new Set<string>();
  const tally = new Map<string, number>();
  for (const r of renderings) {
    if (seenSystems.has(r.systemId)) continue;
    seenSystems.add(r.systemId);
    tally.set(r.decoded, (tally.get(r.decoded) ?? 0) + 1);
  }
  let bestVal: string | null = null;
  let bestCount = 0;
  for (const [v, c] of tally) {
    if (c > bestCount) {
      bestCount = c;
      bestVal = v;
    }
  }
  const quorumThreshold = Math.ceil(distinctSystems * quorumFraction);
  const passes = bestCount >= quorumThreshold;
  return {
    systems: distinctSystems,
    required,
    quorumValue: passes ? bestVal : null,
    agreementCount: bestCount,
    passes,
    rationale: passes
      ? `quorum reached: ${bestCount} of ${distinctSystems} systems agree`
      : `no quorum: best agreement ${bestCount} below ${quorumThreshold} required`,
  };
}
