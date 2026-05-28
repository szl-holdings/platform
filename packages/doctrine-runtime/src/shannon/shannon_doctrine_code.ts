/**
 * shannon_doctrine_code.ts — runtime counterpart of
 * Lutar/Shannon/DoctrineEntropy.lean
 *
 * Encodes the 4-level doctrine alphabet {Bot, L1, L2, Top} as a
 * Shannon-optimal 2-bit prefix code.  Round-trip parity with the Lean
 * module is asserted by the test suite.
 *
 * Citations (attribution-clean):
 *   • Shannon, C. E. (1948). A Mathematical Theory of Communication.
 *     Bell System Technical Journal 27(3):379–423, 27(4):623–656.
 *     DOI 10.1002/j.1538-7305.1948.tb01338.x
 *   • Shannon & Weaver 1949 (book), ISBN 0-252-72546-8
 *   • Shannon 1949 secrecy paper, DOI 10.1002/j.1538-7305.1949.tb00928.x
 *   • Cover & Thomas 2006, ISBN 978-0-471-24195-9
 *
 * Innovation beyond Shannon 1948: AI-doctrine source coding is a novel
 * application; the rate bound below is the operational floor on the
 * doctrine channel of a governed agentic runtime.
 */

export enum DoctrineLabel {
  Bot = 'Bot',
  L1 = 'L1',
  L2 = 'L2',
  Top = 'Top',
}

/** 2-bit codewords for the 4 doctrine labels. */
export const SHANNON_CODE: Record<DoctrineLabel, number> = {
  [DoctrineLabel.Bot]: 0,
  [DoctrineLabel.L1]: 1,
  [DoctrineLabel.L2]: 2,
  [DoctrineLabel.Top]: 3,
};

/** Encoder.  Total, pure, decidable. */
export function shannonEncode(l: DoctrineLabel): number {
  return SHANNON_CODE[l];
}

/** Decoder.  Returns `undefined` for invalid 2-bit codewords. */
export function shannonDecode(code: number): DoctrineLabel | undefined {
  switch (code) {
    case 0:
      return DoctrineLabel.Bot;
    case 1:
      return DoctrineLabel.L1;
    case 2:
      return DoctrineLabel.L2;
    case 3:
      return DoctrineLabel.Top;
    default:
      return undefined;
  }
}

/** Every codeword is at most 3 (i.e. fits in 2 bits). */
export const CODEWORD_BITS = 2;

/** Constant codeword length — matches `Lutar.Shannon.codewordLength`. */
export function codewordLength(_: DoctrineLabel): number {
  return CODEWORD_BITS;
}

/**
 * Shannon channel rate bound (operational form).
 *
 * Given a bit-rate budget `bitsPerSecond` for the audit-closure operator
 * and the constant 2-bit codeword length, the maximum receipt rate is
 * `bitsPerSecond / CODEWORD_BITS` receipts per second.  This is the
 * Shannon-capacity floor on the doctrine channel.
 */
export function channelRateBound(bitsPerSecond: number): number {
  if (!Number.isFinite(bitsPerSecond) || bitsPerSecond < 0) {
    throw new Error('bitsPerSecond must be a non-negative finite number');
  }
  return Math.floor(bitsPerSecond / CODEWORD_BITS);
}

/**
 * Kraft sum for the doctrine code: ∑ 2^{-l_i} over 4 codewords of length 2
 *  = 4 · 2^{-2}
 *  = 1.0 (equality case — the code is complete).
 */
export function kraftSum(): number {
  const labels: DoctrineLabel[] = [
    DoctrineLabel.Bot,
    DoctrineLabel.L1,
    DoctrineLabel.L2,
    DoctrineLabel.Top,
  ];
  return labels.reduce((s, l) => s + Math.pow(2, -codewordLength(l)), 0);
}
