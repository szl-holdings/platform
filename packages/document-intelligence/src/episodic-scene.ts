/**
 * Document Intelligence — Episodic-map recall scene composer.
 *
 * Re-implements the episodic-map recall *visualization* as a
 * procedural-kit `Scene`, so the Conduit recall view uses the same
 * scene-composition primitives as ROSIE (and so the scene is
 * USD-exportable through `@szl-holdings/openusd-export/from-part-graph`).
 *
 * Layout:
 *   - root part `query` is the recall pivot,
 *   - one `episode` child per surfaced recall hit, slotted into `recalls`,
 *   - the per-episode transform encodes the fusion score (forward axis,
 *     z) and the temporal score (vertical axis, y) so the spatial layout
 *     is itself a receipt of the recall ranking.
 */

import {
  IDENTITY_TRANSFORM,
  type Part,
  type PartLibrary,
  type Scene,
  type SceneNode,
  type Transform3,
  makePartLibrary,
  rootNode,
  validateScene,
} from '@szl-holdings/procedural-kit';
import { fromPartGraph, type PartGraphScene, type UsdStageDescriptor } from '@szl-holdings/openusd-export/from-part-graph';

import type { EpisodicRecallHit, EpisodicRecallResult } from './episodic-recall-types.js';

const EPISODE_TAG = 'amaru.recall.episode';
const QUERY_TAG = 'amaru.recall.query';

export const EPISODIC_SCENE_LIBRARY_REF = 'amaru.episodic-recall.v1';

function buildEpisodicLibrary(episodeCount: number): PartLibrary {
  const parts: Part[] = [
    {
      partId: 'query',
      meshRef: 'amaru://recall/query.usd',
      tags: [QUERY_TAG],
      attachmentFrame: IDENTITY_TRANSFORM,
      slots: [
        {
          slotId: 'recalls',
          allowedPartTags: [EPISODE_TAG],
          localTransform: IDENTITY_TRANSFORM,
        },
      ],
    },
  ];
  for (let i = 0; i < episodeCount; i++) {
    parts.push({
      partId: `episode-${i}`,
      meshRef: `amaru://recall/episode.usd#${i}`,
      tags: [EPISODE_TAG],
      attachmentFrame: IDENTITY_TRANSFORM,
      slots: [],
    });
  }
  return makePartLibrary(EPISODIC_SCENE_LIBRARY_REF, parts);
}

function transformForHit(hit: EpisodicRecallHit, index: number, total: number): Transform3 {
  // Place the highest-fused episode closest along z, the others fan out
  // radially in x; vertical y encodes the temporal score so older/less-
  // recent hits sink. Scale clamps to a sensible range.
  const z = -Math.max(0.0, 1.0 - hit.fused) * 4.0;
  const y = (hit.temporalSim - 0.5) * 2.0;
  const xSpan = total <= 1 ? 0 : (index - (total - 1) / 2);
  const x = xSpan * 1.5;
  const s = Math.max(0.25, Math.min(1.5, 0.5 + hit.fused));
  return {
    translation: [x, y, z],
    rotation: [0, 0, 0, 1],
    scale: [s, s, s],
  };
}

export interface EpisodicScene {
  readonly scene: Scene;
  readonly library: PartLibrary;
  /** Mapping from sceneNode.partId → originating episodeId (for the renderer). */
  readonly bindings: ReadonlyArray<{ readonly partId: string; readonly episodeId: string; readonly fused: number }>;
}

export function composeEpisodicScene(recall: EpisodicRecallResult): EpisodicScene {
  const hits = recall.items;
  const library = buildEpisodicLibrary(hits.length);
  const bindings: Array<{ partId: string; episodeId: string; fused: number }> = [];
  const recallNodes: SceneNode[] = hits.map((hit, i) => {
    const partId = `episode-${i}`;
    bindings.push({ partId, episodeId: hit.episodeId, fused: hit.fused });
    return {
      partId,
      transform: transformForHit(hit, i, hits.length),
      slotBindings: {},
    };
  });
  const root = rootNode('query', { recalls: recallNodes });
  const scene: Scene = { libraryRef: EPISODIC_SCENE_LIBRARY_REF, root };
  const errors = validateScene(scene, library);
  if (errors.length > 0) {
    throw new Error(
      `composeEpisodicScene: invalid scene (${errors.length}): ${errors.map((e) => `${e.path}: ${e.message}`).join('; ')}`,
    );
  }
  return { scene, library, bindings };
}

function toPartGraphScene(scene: Scene): PartGraphScene {
  function walk(node: SceneNode): PartGraphScene['root'] {
    const slotBindings: Record<string, PartGraphScene['root'][]> = {};
    for (const [slotId, kids] of Object.entries(node.slotBindings)) {
      slotBindings[slotId] = kids.map(walk);
    }
    return {
      partId: node.partId,
      transform: {
        translation: node.transform.translation,
        rotation: node.transform.rotation,
        scale: node.transform.scale,
      },
      slotBindings,
    };
  }
  return { libraryRef: scene.libraryRef, root: walk(scene.root) };
}

/**
 * Export the episodic scene to a USD stage descriptor via the
 * `openusd-export/from-part-graph` adapter. The mesh resolver returns
 * the per-part `meshRef` so the resulting USD is round-tripable.
 */
export function episodicSceneToUsd(episodic: EpisodicScene): UsdStageDescriptor {
  const meshes = new Map<string, string>();
  for (const part of episodic.library.parts.values()) {
    meshes.set(part.partId, part.meshRef);
  }
  return fromPartGraph(toPartGraphScene(episodic.scene), (partId) => meshes.get(partId));
}
