/**
 * xoshiro256ss.ts — xoshiro256** PRNG
 * Pure TypeScript implementation of xoshiro256** per Blackman & Vigna 2018 [1].
 *
 * xoshiro256** is a 64-bit all-purpose generator with 2^256-1 period, passing
 * all BigCrush and PractRand tests (see [1] Table 1 and §5).  It is NOT
 * cryptographically secure — use Node.js crypto.randomBytes() for secrets.
 *
 * References
 * ----------
 * [1] Blackman, D., & Vigna, S. (2021). Scrambled Linear Pseudorandom Number
 *     Generators. ACM Transactions on Mathematical Software, 47(4), 1–32.
 *     doi:10.1145/3460772
 *     (Preprint: https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 * [2] Reference C implementation by Sebastiano Vigna (public domain):
 *     https://prng.di.unimi.it/xoshiro256starstar.c
 * [3] Doctrine v6 §10.2 "PRNG selection for nonce generation"
 *
 * Note on BigInt: JavaScript lacks native unsigned 64-bit integers.  We
 * represent state as four BigInt values (uint64 each) and convert results
 * to Number via >>> 0 shifts when returning 32-bit values.  For 53-bit
 * float-precision doubles we use the upper 53 bits of the 64-bit output [1].
 */

// ─────────────────────────────────────────────────────────────────────────────
// 64-bit helpers (BigInt arithmetic, masked to 64 bits)
// ─────────────────────────────────────────────────────────────────────────────

const MASK64 = 0xFFFFFFFFFFFFFFFFn;

function rotl64(x: bigint, k: bigint): bigint {
  return ((x << k) | (x >> (64n - k))) & MASK64;
}

function add64(a: bigint, b: bigint): bigint {
  return (a + b) & MASK64;
}

function mul64(a: bigint, b: bigint): bigint {
  return (a * b) & MASK64;
}

// ─────────────────────────────────────────────────────────────────────────────
// xoshiro256** state
// ─────────────────────────────────────────────────────────────────────────────

export interface Xoshiro256State {
  s0: bigint; s1: bigint; s2: bigint; s3: bigint;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core next() function — reference impl [1][2]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Advances state by one step and returns the 64-bit output.
 * Output function: starstar scrambler = rotl(s1 * 5, 7) * 9  [1] §4
 *
 * State update (xoshiro256 [1] §A.1):
 *   t  = s1 << 17
 *   s2 ^= s0
 *   s3 ^= s1
 *   s1 ^= s2
 *   s0 ^= s3
 *   s2 ^= t
 *   s3  = rotl(s3, 45)
 */
function xoshiro256ssNext(state: Xoshiro256State): { result: bigint; state: Xoshiro256State } {
  const { s0, s1, s2, s3 } = state;

  // ** scrambler on s1
  const result = mul64(rotl64(mul64(s1, 5n), 7n), 9n);

  // State update
  const t = (s1 << 17n) & MASK64;
  let ns2 = s2 ^ s0;
  let ns3 = s3 ^ s1;
  let ns1 = s1 ^ ns2;
  let ns0 = s0 ^ ns3;
  ns2 ^= t;
  ns3 = rotl64(ns3, 45n);

  return {
    result,
    state: { s0: ns0, s1: ns1, s2: ns2, s3: ns3 },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Jump function — equivalent to 2^128 calls [1] §A.1
// ─────────────────────────────────────────────────────────────────────────────

const JUMP_CONSTANTS: readonly bigint[] = [
  0x180ec6d33cfd0aban,
  0xd5a61266f0c9392cn,
  0xa9582618e03fc9aan,
  0x39abdc4529b1661cn,
] as const;

function xoshiro256ssJump(state: Xoshiro256State): Xoshiro256State {
  let js0 = 0n, js1 = 0n, js2 = 0n, js3 = 0n;
  for (const jc of JUMP_CONSTANTS) {
    for (let b = 0n; b < 64n; b++) {
      if ((jc & (1n << b)) !== 0n) {
        js0 ^= state.s0; js1 ^= state.s1;
        js2 ^= state.s2; js3 ^= state.s3;
      }
      ({ state } = xoshiro256ssNext(state));
    }
  }
  return { s0: js0, s1: js1, s2: js2, s3: js3 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Splitmix64 seeding (from Vigna's reference implementation [2])
// Splitmix64 is used to expand a 64-bit seed into the 256-bit state.
// ─────────────────────────────────────────────────────────────────────────────

function splitmix64Next(x: bigint): { out: bigint; next: bigint } {
  x = add64(x, 0x9e3779b97f4a7c15n);
  let z = x;
  z = mul64(z ^ (z >> 30n), 0xbf58476d1ce4e5b9n);
  z = mul64(z ^ (z >> 27n), 0x94d049bb133111ebn);
  return { out: z ^ (z >> 31n), next: x };
}

function seedFromBigInt(seed: bigint): Xoshiro256State {
  let cur = seed & MASK64;
  let s0: bigint, s1: bigint, s2: bigint, s3: bigint;
  ;({ out: s0, next: cur } = splitmix64Next(cur));
  ;({ out: s1, next: cur } = splitmix64Next(cur));
  ;({ out: s2, next: cur } = splitmix64Next(cur));
  ;({ out: s3 } = splitmix64Next(cur));
  return { s0, s1, s2, s3 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Xoshiro256StarStar — OOP wrapper
// ─────────────────────────────────────────────────────────────────────────────

export class Xoshiro256StarStar {
  private state: Xoshiro256State;

  /**
   * @param seed  Any integer or bigint.  Passed through splitmix64 [2].
   */
  constructor(seed: number | bigint = Date.now()) {
    this.state = seedFromBigInt(BigInt(seed));
  }

  /**
   * Returns the raw 64-bit output as a BigInt.
   * Per xoshiro256** algorithm [1].
   */
  nextBigInt(): bigint {
    const { result, state } = xoshiro256ssNext(this.state);
    this.state = state;
    return result;
  }

  /**
   * Returns a 32-bit unsigned integer (upper 32 bits of 64-bit output).
   */
  nextUint32(): number {
    return Number(this.nextBigInt() >> 32n) >>> 0;
  }

  /**
   * Returns a float in [0, 1) using the upper 53 bits of the 64-bit output [1].
   *   f = (output >> 11) * 2^-53
   */
  nextFloat(): number {
    const raw = this.nextBigInt() >> 11n;
    return Number(raw) * (1.0 / 9007199254740992.0); // 2^-53
  }

  /**
   * Returns an integer in [min, max) (exclusive upper bound).
   * Uses rejection sampling to avoid modulo bias [1] §6.
   */
  nextIntInRange(min: number, max: number): number {
    if (min >= max) throw new RangeError("min must be < max");
    const range = BigInt(max - min);
    // Rejection sampling: reject if result ≥ floor(2^64 / range) * range
    const threshold = (MASK64 + 1n - range) % range;
    let r: bigint;
    do { r = this.nextBigInt(); } while (r < threshold);
    return Number(r % range) + min;
  }

  /**
   * Advances the generator by 2^128 steps (jump function [1] §A.1).
   * Useful for initialising independent parallel streams.
   */
  jump(): void {
    this.state = xoshiro256ssJump(this.state);
  }

  /** Returns a copy of the current state (for serialisation / reproducibility). */
  getState(): Xoshiro256State {
    return { ...this.state };
  }

  /** Restores a previously saved state. */
  setState(state: Xoshiro256State): void {
    this.state = { ...state };
  }

  /**
   * Fills a Uint8Array with pseudo-random bytes.
   * Endianness: little-endian uint64 chunks (consistent with Vigna's C impl [2]).
   */
  fillBytes(out: Uint8Array): void {
    let offset = 0;
    while (offset < out.length) {
      let word = this.nextBigInt();
      for (let b = 0; b < 8 && offset < out.length; b++, offset++) {
        out[offset] = Number(word & 0xffn);
        word >>= 8n;
      }
    }
  }
}
