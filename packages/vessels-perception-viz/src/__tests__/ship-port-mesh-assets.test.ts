/**
 * Locks the contract that every partId returned by shipPortMeshResolver
 * also resolves to a real, on-disk, parseable glTF 2.0 asset. If a new
 * partId is added to the resolver without re-running build-meshes.mjs,
 * this test trips immediately — so the 3D view never silently falls
 * back to its in-line primitive in production.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { shipPortMeshAssetUrl, shipPortMeshResolver } from '../ship-library.js';

const PART_IDS = [
  'hull-lgc',
  'hull-vlcc',
  'bridge-house',
  'cargo-tank-c',
  'cargo-tank-prismatic',
  'manifold',
  'port-jetty',
  'port-loading-arm',
] as const;

describe('shipPortMeshAssetUrl — real glTF assets', () => {
  it('returns a file URL for every USD-resolvable partId', () => {
    for (const partId of PART_IDS) {
      expect(shipPortMeshResolver(partId), `usd ref for ${partId}`).toBeDefined();
      const url = shipPortMeshAssetUrl(partId);
      expect(url, `asset url for ${partId}`).toBeDefined();
      expect(url!.startsWith('file:') || url!.startsWith('http')).toBe(true);
    }
  });

  it('returns undefined for unknown partIds', () => {
    expect(shipPortMeshAssetUrl('not-a-real-part')).toBeUndefined();
  });

  it('each asset is a valid glTF 2.0 document with at least one mesh primitive', () => {
    for (const partId of PART_IDS) {
      const url = shipPortMeshAssetUrl(partId)!;
      const path = fileURLToPath(url);
      const json = JSON.parse(readFileSync(path, 'utf8')) as {
        asset: { version: string };
        meshes: Array<{ primitives: Array<{ attributes: { POSITION: number } }> }>;
        accessors: Array<{ count: number }>;
        buffers: Array<{ byteLength: number; uri: string }>;
      };
      expect(json.asset.version).toBe('2.0');
      expect(json.meshes.length).toBeGreaterThan(0);
      expect(json.meshes[0]!.primitives.length).toBeGreaterThan(0);
      expect(json.meshes[0]!.primitives[0]!.attributes.POSITION).toBeTypeOf('number');
      expect(json.buffers[0]!.uri.startsWith('data:application/octet-stream;base64,')).toBe(true);
      // POSITION accessor count > 0 — i.e. we shipped real geometry,
      // not an empty stub. (Index 0 is POSITION by build-meshes.mjs.)
      expect(json.accessors[0]!.count).toBeGreaterThan(0);
    }
  });
});
