/**
 * Gauß Class Number — Primitive 19.
 *
 * Source: Gauß Nachlass, Cod. Ms. Gauß, "Mathematik 07–10 — Über
 * Klassenanzahl"; the original definition appears in Disquisitiones
 * Arithmeticae (1801), §223–§307. Gauß defined the form-class number
 * h(d) — the count of equivalence classes of binary quadratic forms
 * of discriminant d under SL₂(ℤ) action.
 *
 * For an imaginary quadratic discriminant d < 0 the class number is
 * the cardinality of the set of *reduced* forms a x² + b x y + c y²
 * with discriminant d = b² − 4ac, a, b, c ∈ ℤ, gcd(a,b,c) = 1,
 * subject to the reduction inequalities:
 *
 *     |b| ≤ a ≤ c        and (if |b| = a or a = c) b ≥ 0.
 *
 * In Ouroboros: a witness set induces a partition of trust-equivalence
 * classes. The class-number primitive turns "how many distinct
 * equivalence classes do my witnesses really resolve?" into a finite
 * integer invariant. Where the runtime needs a hard discreteness
 * receipt (rather than a continuous score), this returns one.
 *
 * The function is exact for any d in the range supported by JavaScript
 * integer arithmetic, |d| ≤ 2^53. We enumerate all reduced forms; for
 * |d| ≤ 10⁶ this is fast.
 */

export interface ClassNumberReport {
  readonly discriminant: number;
  readonly classNumber: number;
  /** All reduced forms (a, b, c) — useful as an audit witness. */
  readonly reducedForms: ReadonlyArray<readonly [number, number, number]>;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Compute the form class number h(d) for a negative fundamental
 * discriminant d. Throws if d is not a valid discriminant
 * (must be < 0 and ≡ 0 or 1 (mod 4)).
 */
export function classNumber(d: number): ClassNumberReport {
  if (!Number.isInteger(d)) {
    throw new Error("gauss.classNumber: d must be an integer");
  }
  if (d >= 0) {
    throw new Error(
      "gauss.classNumber: this implementation handles negative discriminants only",
    );
  }
  const dMod4 = ((d % 4) + 4) % 4;
  if (dMod4 !== 0 && dMod4 !== 1) {
    throw new Error("gauss.classNumber: d must be ≡ 0 or 1 (mod 4)");
  }
  if (d < -1e7) {
    throw new Error("gauss.classNumber: |d| > 1e7 not supported (enumeration is too slow)");
  }

  const reduced: Array<readonly [number, number, number]> = [];
  // |b| ≤ a ≤ √(|d|/3)
  const aMax = Math.floor(Math.sqrt(Math.abs(d) / 3));
  for (let a = 1; a <= aMax; a++) {
    for (let b = -a; b <= a; b++) {
      // 4ac = b² − d   ⇒ c integer requires (b² − d) divisible by 4a.
      const num = b * b - d;
      if (num % (4 * a) !== 0) continue;
      const c = num / (4 * a);
      if (c < a) continue;
      if (gcd(gcd(a, b), c) !== 1) continue;
      // Boundary rule: if |b| = a or a = c, require b ≥ 0
      if ((Math.abs(b) === a || a === c) && b < 0) continue;
      reduced.push([a, b, c]);
    }
  }

  return {
    discriminant: d,
    classNumber: reduced.length,
    reducedForms: reduced,
  };
}

/**
 * Reduce a class-number report to a Lutar axis fraction in [0, 1].
 *
 * Given an expected ceiling K of equivalence classes that a healthy
 * witness graph should produce, the axis is
 *
 *   K_axis = max(0, 1 − (h − 1) / K)
 *
 * h = 1 (one trust class) gives K_axis = 1; growing class number bleeds
 * the axis linearly to 0 once h reaches K + 1. Clamp to [0, 1].
 */
export function classNumberAxis(report: ClassNumberReport, expectedCeiling = 8): number {
  if (!Number.isFinite(expectedCeiling) || expectedCeiling < 1) {
    throw new Error("classNumberAxis: expectedCeiling must be ≥ 1");
  }
  const t = 1 - (report.classNumber - 1) / expectedCeiling;
  return Math.max(0, Math.min(1, t));
}
