/**
 * Bill-of-materials — flatten a Scene to `{partId: count}`. Consumers
 * (procurement, license-checking, cost) read the BOM, not the mesh.
 */

import type { Scene, SceneNode } from './composition.js';

export type BillOfMaterials = Readonly<Record<string, number>>;

export function bomOf(scene: Scene): BillOfMaterials {
  const counts: Record<string, number> = {};
  walk(scene.root, counts);
  return counts;
}

function walk(node: SceneNode, counts: Record<string, number>): void {
  counts[node.partId] = (counts[node.partId] ?? 0) + 1;
  for (const children of Object.values(node.slotBindings)) {
    for (const c of children) walk(c, counts);
  }
}
