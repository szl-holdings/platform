/**
 * Egyptian-fraction parser / canonicalizer used by the Λ-operator.
 *
 * Accepts strings of the form `"p/q"` or sums `"a/b+c/d+..."` and returns
 * an exact rational `{ p, q }` (bigint numerator/denominator, q > 0,
 * gcd(p, q) = 1). `canonicalizeEgyptian` expresses any 0 ≤ p/q ≤ 1 as a
 * greedy Fibonacci–Sylvester sum of distinct unit fractions.
 */

export interface Fraction {
  p: bigint;
  q: bigint;
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

function reduce(f: Fraction): Fraction {
  if (f.q === 0n) throw new Error('lambda-math: fraction denominator is zero');
  let p = f.p;
  let q = f.q;
  if (q < 0n) {
    p = -p;
    q = -q;
  }
  const g = gcd(p < 0n ? -p : p, q);
  if (g === 0n) return { p: 0n, q: 1n };
  return { p: p / g, q: q / g };
}

function add(a: Fraction, b: Fraction): Fraction {
  return reduce({ p: a.p * b.q + b.p * a.q, q: a.q * b.q });
}

function sub(a: Fraction, b: Fraction): Fraction {
  return reduce({ p: a.p * b.q - b.p * a.q, q: a.q * b.q });
}

const ATOM = /^\s*(-?\d+)\s*(?:\/\s*(\d+)\s*)?$/;

function parseAtom(s: string): Fraction {
  const m = s.match(ATOM);
  if (!m) throw new Error(`lambda-math: malformed fraction atom "${s}"`);
  const p = BigInt(m[1]!);
  const q = m[2] !== undefined ? BigInt(m[2]) : 1n;
  if (q === 0n) throw new Error(`lambda-math: zero denominator in "${s}"`);
  return reduce({ p, q });
}

/**
 * Parse `"1/3"`, `"1/3+1/12"`, `"2"`, or a plain number into an exact
 * rational `{ p, q }`. Whitespace tolerated. Negative atoms allowed
 * (`"-1/4"`), though the caller is expected to keep weights ≥ 0.
 */
export function parseEgyptianFraction(input: string | number): Fraction {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      throw new Error(`lambda-math: non-finite weight ${input}`);
    }
    // Convert to rational without losing IEEE-754 precision for clean
    // integers and simple decimals.
    if (Number.isInteger(input)) return reduce({ p: BigInt(input), q: 1n });
    const str = input.toString();
    if (/^-?\d+(\.\d+)?$/.test(str)) {
      const [whole, frac = ''] = str.split('.');
      const scale = 10n ** BigInt(frac.length);
      const p = BigInt(whole!) * scale + (whole!.startsWith('-') ? -BigInt(frac || '0') : BigInt(frac || '0'));
      return reduce({ p, q: scale });
    }
    // Fallback: best-effort scaling by 1e9.
    const scale = 1_000_000_000n;
    return reduce({ p: BigInt(Math.round(input * 1e9)), q: scale });
  }
  const atoms = input.split('+');
  if (atoms.length === 0) throw new Error('lambda-math: empty fraction string');
  let acc: Fraction = { p: 0n, q: 1n };
  for (const a of atoms) {
    if (a.trim() === '') throw new Error(`lambda-math: empty atom in "${input}"`);
    acc = add(acc, parseAtom(a));
  }
  return acc;
}

export function fractionToNumber(f: Fraction): number {
  // bigint → number via Number conversion; safe for our weight magnitudes
  // (well under 2^53 in any realistic Λ component set).
  return Number(f.p) / Number(f.q);
}

/**
 * Greedy Fibonacci–Sylvester Egyptian-fraction decomposition.
 *
 * Returns the list of unit-fraction denominators whose reciprocals sum to
 * the input. Requires 0 ≤ p/q ≤ 1. Terminates in O(log q) steps for
 * proper fractions because the numerator strictly decreases.
 */
export function canonicalizeEgyptian(input: Fraction | string | number): string[] {
  let f = typeof input === 'object' ? reduce(input) : parseEgyptianFraction(input);
  if (f.p < 0n) throw new Error('lambda-math: canonicalizeEgyptian requires non-negative input');
  if (f.p === 0n) return [];
  if (f.p * 1n > f.q) {
    throw new Error('lambda-math: canonicalizeEgyptian requires input ≤ 1');
  }
  const out: string[] = [];
  // Cap iterations defensively; greedy method always terminates but guard
  // against pathological inputs hitting bigint blow-ups.
  for (let i = 0; i < 64 && f.p > 0n; i++) {
    // ceil(q / p)
    const k = (f.q + f.p - 1n) / f.p;
    out.push(`1/${k.toString()}`);
    f = sub(f, { p: 1n, q: k });
    if (f.p === 0n) break;
  }
  if (f.p !== 0n) {
    throw new Error('lambda-math: Egyptian decomposition did not terminate');
  }
  return out;
}
