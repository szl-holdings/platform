/**
 * Scene composition DAG. Built by construction to be acyclic — a slot
 * binding can only point to a child, never a back-edge — so cycle
 * detection at the type level is unnecessary.
 *
 * The composition is the **authoring object**; the renderer flattens
 * it for display, and the receipt envelope hashes it for provenance.
 */

import { type Part, type PartLibrary, type Transform3, IDENTITY_TRANSFORM } from './part.js';

export interface SceneNode {
  readonly partId: string;
  readonly transform: Transform3;
  readonly slotBindings: Readonly<Record<string, readonly SceneNode[]>>;
}

export interface Scene {
  readonly libraryRef: string;
  readonly root: SceneNode;
}

export function rootNode(partId: string, slotBindings: Record<string, SceneNode[]> = {}, transform: Transform3 = IDENTITY_TRANSFORM): SceneNode {
  return { partId, transform, slotBindings };
}

export interface CompositionError {
  readonly path: string;
  readonly message: string;
}

/** Validate that every slot binding references a known part whose tags
 *  satisfy the slot's `allowedPartTags`. */
export function validateScene(scene: Scene, library: PartLibrary): readonly CompositionError[] {
  const errors: CompositionError[] = [];
  walk(scene.root, library, '$', errors);
  return errors;
}

function walk(node: SceneNode, library: PartLibrary, path: string, errors: CompositionError[]): void {
  const part: Part | undefined = library.parts.get(node.partId);
  if (!part) {
    errors.push({ path, message: `unknown partId "${node.partId}"` });
    return;
  }
  for (const [slotId, children] of Object.entries(node.slotBindings)) {
    const slot = part.slots.find((s) => s.slotId === slotId);
    if (!slot) {
      errors.push({ path: `${path}/${slotId}`, message: `part "${part.partId}" has no slot "${slotId}"` });
      continue;
    }
    for (let i = 0; i < children.length; i++) {
      const child = children[i]!;
      const childPart: Part | undefined = library.parts.get(child.partId);
      const childPath = `${path}/${slotId}[${i}]`;
      if (childPart) {
        const ok = slot.allowedPartTags.length === 0 ||
          childPart.tags.some((t) => slot.allowedPartTags.includes(t));
        if (!ok) {
          errors.push({
            path: childPath,
            message: `child part "${child.partId}" tags [${childPart.tags.join(',')}] do not match slot "${slotId}" allowed tags [${slot.allowedPartTags.join(',')}]`,
          });
        }
      }
      walk(child, library, childPath, errors);
    }
  }
}

/** Stable structural hash of a scene's part-graph (independent of
 *  hashing primitive — caller supplies the digest function). */
export function partGraphHash(scene: Scene, hash: (value: unknown) => string): string {
  return hash(canonicalise(scene.root));
}

function canonicalise(node: SceneNode): unknown {
  const slots: Record<string, unknown[]> = {};
  const slotIds = Object.keys(node.slotBindings).sort();
  for (const slotId of slotIds) {
    slots[slotId] = node.slotBindings[slotId]!.map((c) => canonicalise(c));
  }
  return {
    partId: node.partId,
    transform: node.transform,
    slotBindings: slots,
  };
}
