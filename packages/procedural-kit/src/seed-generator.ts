/**
 * Deterministic seed → Scene generator. Given a seed and a library, the
 * same `(seed, library, constraints)` always yields the same Scene.
 *
 * Uses an internal mulberry32 PRNG so the generator is reproducible
 * across JS runtimes without depending on `Math.random`'s undefined
 * cross-engine behaviour.
 */

import { type SceneNode, type Scene, rootNode } from './composition.js';
import { type PartLibrary, IDENTITY_TRANSFORM, type Part } from './part.js';

export interface GenerateConstraints {
  /** Tag of the root part to anchor the scene at. */
  readonly rootTag: string;
  /** Max recursion depth from the root. */
  readonly maxDepth: number;
  /** Probability ∈ [0, 1] of filling any given slot at each step. */
  readonly fillProbability: number;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(rng() * arr.length)];
}

export function generate(seed: number, library: PartLibrary, constraints: GenerateConstraints): Scene {
  const rng = mulberry32(seed);
  const rootCandidates: Part[] = [];
  for (const p of library.parts.values()) {
    if (p.tags.includes(constraints.rootTag)) rootCandidates.push(p);
  }
  if (rootCandidates.length === 0) {
    throw new Error(`procedural-kit/seed-generator: no parts in library "${library.libraryRef}" carry root tag "${constraints.rootTag}"`);
  }
  const root = pick(rng, rootCandidates)!;
  return {
    libraryRef: library.libraryRef,
    root: build(root, library, rng, constraints, 0),
  };
}

function build(
  part: Part,
  library: PartLibrary,
  rng: () => number,
  constraints: GenerateConstraints,
  depth: number,
): SceneNode {
  const bindings: Record<string, SceneNode[]> = {};
  if (depth < constraints.maxDepth) {
    for (const slot of part.slots) {
      if (rng() > constraints.fillProbability) continue;
      const candidates: Part[] = [];
      for (const p of library.parts.values()) {
        if (slot.allowedPartTags.length === 0 || p.tags.some((t) => slot.allowedPartTags.includes(t))) {
          candidates.push(p);
        }
      }
      const child = pick(rng, candidates);
      if (child) {
        bindings[slot.slotId] = [build(child, library, rng, constraints, depth + 1)];
      }
    }
  }
  return rootNode(part.partId, bindings, IDENTITY_TRANSFORM);
}
