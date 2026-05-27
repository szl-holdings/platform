/**
 * Bridge between procedural-kit's `Scene` and openusd-export's
 * `PartGraphScene`. The two shapes are structurally identical — the
 * adapter exists to make the cross-package type contract explicit
 * (no `as unknown as` sprinkled at call sites) and to centralize the
 * round-trip used by the USD fixture test.
 */

import type { Scene, SceneNode } from '@szl-holdings/procedural-kit';
import {
  fromPartGraph,
  type PartGraphScene,
  type PartGraphSceneNode,
  type UsdStageDescriptor,
} from '@szl-holdings/openusd-export/from-part-graph';

function toPartGraphNode(node: SceneNode): PartGraphSceneNode {
  const bindings: Record<string, PartGraphSceneNode[]> = {};
  for (const [k, children] of Object.entries(node.slotBindings)) {
    bindings[k] = children.map((c) => toPartGraphNode(c));
  }
  return {
    partId: node.partId,
    transform: node.transform,
    slotBindings: bindings,
  };
}

export function toPartGraphScene(scene: Scene): PartGraphScene {
  return {
    libraryRef: scene.libraryRef,
    root: toPartGraphNode(scene.root),
  };
}

export function fromPartGraphAdapter(
  scene: Scene,
  meshRefResolver?: (partId: string) => string | undefined,
): UsdStageDescriptor {
  return fromPartGraph(toPartGraphScene(scene), meshRefResolver);
}

export type { UsdStageDescriptor };
