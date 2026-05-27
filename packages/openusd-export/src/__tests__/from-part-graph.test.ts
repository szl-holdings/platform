import { describe, expect, it } from 'vitest';
import { fromPartGraph, type PartGraphScene } from '../from-part-graph.js';

const identity = { translation: [0, 0, 0] as const, rotation: [0, 0, 0, 1] as const, scale: [1, 1, 1] as const };

const scene: PartGraphScene = {
  libraryRef: 'lib-test',
  root: {
    partId: 'chassis',
    transform: identity,
    slotBindings: {
      fl: [{ partId: 'wheel-small', transform: identity, slotBindings: {} }],
      fr: [{ partId: 'wheel-small', transform: identity, slotBindings: {} }],
    },
  },
};

describe('fromPartGraph — Scene → USD stage descriptor', () => {
  it('emits a deterministic prim hierarchy under /world', () => {
    const stage = fromPartGraph(scene);
    expect(stage.rootPrimPath).toBe('/world');
    const paths = stage.prims.map((p) => p.primPath);
    expect(paths).toContain('/world/chassis');
    expect(paths).toContain('/world/chassis/fl');
    expect(paths).toContain('/world/chassis/fl/wheel_small');
  });

  it('attaches a Mesh prim under the Xform when meshRefResolver supplies one', () => {
    const stage = fromPartGraph(scene, (partId) => (partId === 'chassis' ? 'mesh://chassis.usd' : undefined));
    const mesh = stage.prims.find((p) => p.primPath === '/world/chassis/Mesh');
    expect(mesh?.typeName).toBe('Mesh');
    expect(mesh?.meshRef).toBe('mesh://chassis.usd');
  });

  it('records the UV strategy explicitly (no silent default)', () => {
    expect(fromPartGraph(scene).uvStrategy).toBe('inherit-from-meshref');
  });
});
