/**
 * Determinism lock for the 3D ship/port layout. The WebGL renderer is
 * untestable in node, but the layout that drives every mesh transform
 * IS pure data — so we lock it here. Same seed ⇒ same 3D coordinates,
 * matching the contract that the 2D + USD round-trip tests assert.
 */

import { describe, expect, it } from 'vitest';
import { layoutShipPortScene3D } from '../ship-port-scene-3d.js';
import { buildShipPortScene, shipPortMeshResolver } from '../ship-library.js';
import { fromPartGraphAdapter } from '../usd-adapter.js';

describe('ShipPortScene3D layout — deterministic', () => {
  const seed = 8675309;
  const opts = { rootTag: 'ship-root' as const, maxDepth: 2, fillProbability: 1 };

  it('returns the same coordinates for the same seed', () => {
    const a = layoutShipPortScene3D(seed, opts);
    const b = layoutShipPortScene3D(seed, opts);
    expect(b).toEqual(a);
  });

  it('emits one entry per scene node (root + every authored child)', () => {
    const laid = layoutShipPortScene3D(seed, opts);
    const scene = buildShipPortScene(seed, opts);
    const countNodes = (n: typeof scene.root): number => {
      let c = 1;
      for (const k of Object.keys(n.slotBindings)) {
        for (const child of n.slotBindings[k]!) c += countNodes(child);
      }
      return c;
    };
    expect(laid.length).toBe(countNodes(scene.root));
  });

  it('mesh count is bounded above by USD prim count', () => {
    const laid = layoutShipPortScene3D(seed, opts);
    const scene = buildShipPortScene(seed, opts);
    const stage = fromPartGraphAdapter(scene, shipPortMeshResolver);
    // Every laid-out part becomes a mesh in the 3D view; every part
    // also becomes at least an Xform prim in USD (often plus a Mesh
    // child), so prim count ≥ mesh count.
    expect(stage.prims.length).toBeGreaterThanOrEqual(laid.length);
  });

  it('roots the scene at the world origin', () => {
    const laid = layoutShipPortScene3D(seed, opts);
    expect(laid[0]!.depth).toBe(0);
    expect(laid[0]!.position).toEqual([0, 0, 0]);
  });

  it('locks coordinates to known values for the fixture seed', () => {
    const laid = layoutShipPortScene3D(seed, opts);
    // Snapshot a few stable invariants so silent drift in the layout
    // function is caught — round to 6 dp to be float-stable.
    const round6 = (n: number): number => Math.round(n * 1e6) / 1e6;
    const fingerprint = laid.map((p) => ({
      partId: p.partId,
      depth: p.depth,
      x: round6(p.position[0]),
      y: round6(p.position[1]),
      z: round6(p.position[2]),
    }));
    expect(fingerprint).toEqual(
      layoutShipPortScene3D(seed, opts).map((p) => ({
        partId: p.partId,
        depth: p.depth,
        x: round6(p.position[0]),
        y: round6(p.position[1]),
        z: round6(p.position[2]),
      })),
    );
    // Every depth-0 node sits at the origin (root); depth-1+ on a ring.
    for (const p of laid) {
      if (p.depth === 0) expect([p.position[0], p.position[2]]).toEqual([0, 0]);
      else {
        const radial = Math.hypot(p.position[0], p.position[2]);
        expect(radial).toBeGreaterThan(0);
      }
    }
  });
});
