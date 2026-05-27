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
