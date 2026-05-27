/**
 * Part library — a `Part` declares its mesh reference, its attachment
 * frame, and zero-or-more named child slots. Re-expressed from kitbash
 * (docs/research/perception-bio-synthesis-2026.md §5).
 *
 * Parts are *authoring objects*, not meshes — `meshRef` is an opaque
 * reference resolved by the renderer (USD prim path, glTF node id, ...).
 */

export type Transform3 = {
  /** Translation `[x, y, z]`. */
  readonly translation: readonly [number, number, number];
  /** Rotation as a unit quaternion `[x, y, z, w]`. */
  readonly rotation: readonly [number, number, number, number];
  /** Uniform-or-anisotropic scale `[sx, sy, sz]`. */
  readonly scale: readonly [number, number, number];
};

export const IDENTITY_TRANSFORM: Transform3 = {
  translation: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
};

export interface Slot {
  readonly slotId: string;
  /** Subset of `Part.tags` that may bind into this slot. */
  readonly allowedPartTags: readonly string[];
  /** Local attachment transform for any child in this slot. */
  readonly localTransform: Transform3;
}

export interface Part {
  readonly partId: string;
  /** Opaque renderer reference (USD prim, glTF node, etc.). */
  readonly meshRef: string;
  /** Authoring tags used by slot binding (`['wheel', 'metal']`). */
  readonly tags: readonly string[];
  readonly attachmentFrame: Transform3;
  readonly slots: readonly Slot[];
}

export interface PartLibrary {
  readonly libraryRef: string;
  readonly parts: ReadonlyMap<string, Part>;
}

export function makePartLibrary(libraryRef: string, parts: readonly Part[]): PartLibrary {
  const map = new Map<string, Part>();
  for (const p of parts) {
    if (map.has(p.partId)) {
      throw new Error(`procedural-kit/part: duplicate partId "${p.partId}" in library "${libraryRef}"`);
    }
    map.set(p.partId, p);
  }
  return { libraryRef, parts: map };
}
