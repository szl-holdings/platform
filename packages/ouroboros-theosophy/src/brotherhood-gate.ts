/**
 * Primitive 49 — Universal-brotherhood gate
 *
 * Theosophical Society Object 1: "to form a nucleus of the Universal
 * Brotherhood of Humanity, without distinction of race, creed, sex,
 * caste, or colour." Operationalised as a non-discrimination gate:
 * a routing decision must not vary across protected attributes when
 * non-protected inputs are equal.
 */

export interface DecisionRecord<T> {
  protectedAttrs: Record<string, string>;
  nonProtectedKey: string;
  decision: T;
}

export interface BrotherhoodAudit<T> {
  groupedByNonProtected: Record<string, T[]>;
  violations: { key: string; distinct: T[] }[];
  passes: boolean;
}

export function auditBrotherhood<T>(
  records: DecisionRecord<T>[],
): BrotherhoodAudit<T> {
  const grouped: Record<string, T[]> = {};
  for (const r of records) {
    grouped[r.nonProtectedKey] ||= [];
    grouped[r.nonProtectedKey].push(r.decision);
  }
  const violations: { key: string; distinct: T[] }[] = [];
  for (const [key, decisions] of Object.entries(grouped)) {
    const distinct = [...new Set(decisions)];
    if (distinct.length > 1) {
      violations.push({ key, distinct });
    }
  }
  return {
    groupedByNonProtected: grouped,
    violations,
    passes: violations.length === 0,
  };
}
