/**
 * Procedural-kit Scene → openusd-export USD-stage round-trip lock.
 * Same seed must yield the same prim set, with mesh refs resolved
 * through the shared `shipPortMeshResolver`.
 */

import { describe, expect, it } from 'vitest';
import {
  partGraphHash,
  validateScene,
} from '@szl-holdings/procedural-kit';
import {
  buildShipPortScene,
  defaultShipPartLibrary,
  shipPortMeshResolver,
} from '../ship-library.js';
import { fromPartGraphAdapter, toPartGraphScene } from '../usd-adapter.js';

function djb2(value: unknown): string {
  const s = JSON.stringify(value) ?? '';
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, '0');
}

describe('Ship/port scene round-trip — procedural-kit → openusd-export', () => {
  const seed = 8675309;
  const scene = buildShipPortScene(seed, { rootTag: 'ship-root', maxDepth: 2, fillProbability: 1 });

  it('produces a valid scene against the default library', () => {
    const errors = validateScene(scene, defaultShipPartLibrary());
    expect(errors).toEqual([]);
  });

  it('is deterministic — same seed ⇒ same part-graph hash', () => {
    const again = buildShipPortScene(seed, { rootTag: 'ship-root', maxDepth: 2, fillProbability: 1 });
    expect(partGraphHash(scene, djb2)).toBe(partGraphHash(again, djb2));
  });

  it('round-trips into a USD stage rooted at /world', () => {
    const stage = fromPartGraphAdapter(scene, shipPortMeshResolver);
    expect(stage.rootPrimPath).toBe('/world');
    expect(stage.uvStrategy).toBe('inherit-from-meshref');
    // Every authored part should yield at least an Xform prim.
    const xforms = stage.prims.filter((p) => p.typeName === 'Xform');
    expect(xforms.length).toBeGreaterThan(0);
  });

  it('attaches Mesh prims wherever the resolver returns a usd:// reference', () => {
    const stage = fromPartGraphAdapter(scene, shipPortMeshResolver);
    const meshes = stage.prims.filter((p) => p.typeName === 'Mesh');
    expect(meshes.length).toBeGreaterThan(0);
    for (const m of meshes) {
      expect(m.meshRef).toMatch(/^usd:\/\/szl\/vessels\//);
    }
  });

  it('Scene and PartGraphScene are structurally equivalent through the adapter', () => {
    const bridged = toPartGraphScene(scene);
    expect(bridged.libraryRef).toBe(scene.libraryRef);
    expect(bridged.root.partId).toBe(scene.root.partId);
  });
});
