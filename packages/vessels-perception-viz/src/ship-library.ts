/**
 * Default ship/port part library + scene builder for procedural-kit.
 * Owned here (not in procedural-kit) so the package stays domain-
 * agnostic. Round-trips to USD via @szl-holdings/openusd-export.
 */

import {
  makePartLibrary,
  generate,
  IDENTITY_TRANSFORM,
  type Part,
  type PartLibrary,
  type Scene,
} from '@szl-holdings/procedural-kit';

/** Real, downloadable glTF asset URLs for each partId. Built once by
 *  `scripts/build-meshes.mjs` and committed under `src/assets/meshes`.
 *  `new URL(..., import.meta.url)` is ESM-standard so Vite emits a
 *  hashed asset URL in browsers and Node returns a `file://` URL for
 *  vitest — same import works in every consumer. */
const MESH_ASSET_FILES = {
  'hull-lgc': new URL('./assets/meshes/hull-lgc.gltf', import.meta.url).href,
  'hull-vlcc': new URL('./assets/meshes/hull-vlcc.gltf', import.meta.url).href,
  'bridge-house': new URL('./assets/meshes/bridge-house.gltf', import.meta.url).href,
  'cargo-tank-c': new URL('./assets/meshes/cargo-tank-c.gltf', import.meta.url).href,
  'cargo-tank-prismatic': new URL('./assets/meshes/cargo-tank-prismatic.gltf', import.meta.url).href,
  'manifold': new URL('./assets/meshes/manifold.gltf', import.meta.url).href,
  'port-jetty': new URL('./assets/meshes/port-jetty.gltf', import.meta.url).href,
  'port-loading-arm': new URL('./assets/meshes/port-loading-arm.gltf', import.meta.url).href,
} as const;

export type ShipPortPartId = keyof typeof MESH_ASSET_FILES;

/** Resolve a partId to a real downloadable glTF asset URL. Returns
 *  undefined for unknown partIds so callers can fall back to an
 *  in-line primitive. */
export function shipPortMeshAssetUrl(partId: string): string | undefined {
  return (MESH_ASSET_FILES as Record<string, string>)[partId];
}

/** Minimal mesh resolver — maps a procedural-kit partId to a USD prim
 *  reference. Vessels picks these prims from a downstream operator
 *  tool's USD library; for the deck and the live product, the
 *  references are stable strings. */
export function shipPortMeshResolver(partId: string): string | undefined {
  switch (partId) {
    case 'hull-lgc':
      return 'usd://szl/vessels/ship/hull-lgc.usd';
    case 'hull-vlcc':
      return 'usd://szl/vessels/ship/hull-vlcc.usd';
    case 'bridge-house':
      return 'usd://szl/vessels/ship/bridge-house.usd';
    case 'cargo-tank-c':
      return 'usd://szl/vessels/ship/cargo-tank-c.usd';
    case 'cargo-tank-prismatic':
      return 'usd://szl/vessels/ship/cargo-tank-prismatic.usd';
    case 'manifold':
      return 'usd://szl/vessels/ship/manifold.usd';
    case 'port-jetty':
      return 'usd://szl/vessels/port/jetty.usd';
    case 'port-loading-arm':
      return 'usd://szl/vessels/port/loading-arm.usd';
    default:
      return undefined;
  }
}

export function defaultShipPartLibrary(): PartLibrary {
  const parts: readonly Part[] = [
    {
      partId: 'hull-lgc',
      meshRef: 'usd://szl/vessels/ship/hull-lgc.usd',
      tags: ['hull', 'ship-root', 'lgc'],
      attachmentFrame: IDENTITY_TRANSFORM,
      slots: [
        { slotId: 'bridge', allowedPartTags: ['superstructure'], localTransform: IDENTITY_TRANSFORM },
        { slotId: 'cargoBay', allowedPartTags: ['cargo-tank'], localTransform: IDENTITY_TRANSFORM },
        { slotId: 'manifold', allowedPartTags: ['manifold'], localTransform: IDENTITY_TRANSFORM },
      ],
    },
    {
      partId: 'hull-vlcc',
      meshRef: 'usd://szl/vessels/ship/hull-vlcc.usd',
      tags: ['hull', 'ship-root', 'vlcc'],
      attachmentFrame: IDENTITY_TRANSFORM,
      slots: [
        { slotId: 'bridge', allowedPartTags: ['superstructure'], localTransform: IDENTITY_TRANSFORM },
        { slotId: 'cargoBay', allowedPartTags: ['cargo-tank'], localTransform: IDENTITY_TRANSFORM },
      ],
    },
    {
      partId: 'bridge-house',
      meshRef: 'usd://szl/vessels/ship/bridge-house.usd',
      tags: ['superstructure'],
      attachmentFrame: IDENTITY_TRANSFORM,
      slots: [],
    },
    {
      partId: 'cargo-tank-c',
      meshRef: 'usd://szl/vessels/ship/cargo-tank-c.usd',
      tags: ['cargo-tank'],
      attachmentFrame: IDENTITY_TRANSFORM,
      slots: [],
    },
    {
      partId: 'cargo-tank-prismatic',
      meshRef: 'usd://szl/vessels/ship/cargo-tank-prismatic.usd',
      tags: ['cargo-tank'],
      attachmentFrame: IDENTITY_TRANSFORM,
      slots: [],
    },
    {
      partId: 'manifold',
      meshRef: 'usd://szl/vessels/ship/manifold.usd',
      tags: ['manifold'],
      attachmentFrame: IDENTITY_TRANSFORM,
      slots: [],
    },
    {
      partId: 'port-jetty',
      meshRef: 'usd://szl/vessels/port/jetty.usd',
      tags: ['port-root'],
      attachmentFrame: IDENTITY_TRANSFORM,
      slots: [
        { slotId: 'arm', allowedPartTags: ['loading-arm'], localTransform: IDENTITY_TRANSFORM },
      ],
    },
    {
      partId: 'port-loading-arm',
      meshRef: 'usd://szl/vessels/port/loading-arm.usd',
      tags: ['loading-arm'],
      attachmentFrame: IDENTITY_TRANSFORM,
      slots: [],
    },
  ];
  return makePartLibrary('szl-vessels-ship-port@0.1', parts);
}

export interface BuildShipPortSceneOptions {
  readonly rootTag?: 'ship-root' | 'port-root';
  readonly maxDepth?: number;
  readonly fillProbability?: number;
}

export function buildShipPortScene(
  seed: number,
  options: BuildShipPortSceneOptions = {},
): Scene {
  const library = defaultShipPartLibrary();
  return generate(seed, library, {
    rootTag: options.rootTag ?? 'ship-root',
    maxDepth: options.maxDepth ?? 2,
    fillProbability: options.fillProbability ?? 0.9,
  });
}
