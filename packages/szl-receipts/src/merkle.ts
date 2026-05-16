import { sha256Hex } from './hash.js';

/**
 * SHA-256 Merkle root over an array of leaf hex strings.
 * Empty input → all-zero hash. Odd levels duplicate the last node
 * (classical Bitcoin-style padding).
 */
export function merkleRoot(leafHashes: string[]): string {
  if (leafHashes.length === 0) return '0'.repeat(64);
  let layer = leafHashes.slice();
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i]!;
      const right = i + 1 < layer.length ? layer[i + 1]! : left;
      next.push(sha256Hex(left + right));
    }
    layer = next;
  }
  return layer[0]!;
}
