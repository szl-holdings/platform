import { describe, expect, it } from 'vitest';

import { composeEpisodicScene, episodicSceneToUsd } from '../episodic-scene.js';
import type { EpisodicRecallResult } from '../staged-pipeline.js';

const RECALL: EpisodicRecallResult = {
  recallId: 'recall-test-001',
  fusionRule: 'sqrt(content*temporal)',
  items: [
    { episodeId: 'ep-A', scope: 'reefer', payload: { outcome: 'accepted' }, contentSim: 0.92, temporalSim: 0.88, fused: 0.90 },
    { episodeId: 'ep-B', scope: 'reefer', payload: { outcome: 'accepted' }, contentSim: 0.71, temporalSim: 0.65, fused: 0.68 },
    { episodeId: 'ep-C', scope: 'reefer', payload: { outcome: 'rejected' }, contentSim: 0.55, temporalSim: 0.40, fused: 0.47 },
  ],
};

describe('composeEpisodicScene — procedural-kit recall scene', () => {
  it('builds one query root with one slotted child per hit', () => {
    const { scene, bindings } = composeEpisodicScene(RECALL);
    expect(scene.root.partId).toBe('query');
    expect(scene.root.slotBindings.recalls).toHaveLength(3);
    expect(bindings.map((b) => b.episodeId)).toEqual(['ep-A', 'ep-B', 'ep-C']);
  });

  it('higher-fused hits sit closer along z than lower-fused', () => {
    const { scene } = composeEpisodicScene(RECALL);
    const recalls = scene.root.slotBindings.recalls!;
    const z0 = recalls[0]!.transform.translation[2];
    const z2 = recalls[2]!.transform.translation[2];
    expect(z0).toBeGreaterThan(z2); // both negative; "closer" == larger (less negative)
  });
});

describe('episodicSceneToUsd — round-trip via openusd-export/from-part-graph', () => {
  it('produces one Xform per scene node plus a Mesh per part', () => {
    const episodic = composeEpisodicScene(RECALL);
    const stage = episodicSceneToUsd(episodic);
    expect(stage.libraryRef).toBe('amaru.episodic-recall.v1');
    expect(stage.rootPrimPath).toBe('/world');
    // Root query Xform + query Mesh + recalls slot Xform + (per episode: Xform + Mesh) = 2 + 1 + 3*2 = 9.
    const xforms = stage.prims.filter((p) => p.typeName === 'Xform');
    const meshes = stage.prims.filter((p) => p.typeName === 'Mesh');
    expect(xforms.length).toBe(2 + 3); // query + recalls + 3 episodes
    expect(meshes.length).toBe(1 + 3); // query mesh + 3 episode meshes
    expect(stage.uvStrategy).toBe('inherit-from-meshref');
  });

  it('every USD prim path is unique (sanitised tokens)', () => {
    const episodic = composeEpisodicScene(RECALL);
    const stage = episodicSceneToUsd(episodic);
    const paths = stage.prims.map((p) => p.primPath);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('per-episode Mesh resolves to its meshRef in the library', () => {
    const episodic = composeEpisodicScene(RECALL);
    const stage = episodicSceneToUsd(episodic);
    const meshRefs = stage.prims.filter((p) => p.typeName === 'Mesh').map((p) => p.meshRef);
    expect(meshRefs).toEqual(
      expect.arrayContaining([
        'amaru://recall/query.usd',
        'amaru://recall/episode.usd#0',
        'amaru://recall/episode.usd#1',
        'amaru://recall/episode.usd#2',
      ]),
    );
  });

  it('round-trip is deterministic — same recall → same stage descriptor', () => {
    const s1 = episodicSceneToUsd(composeEpisodicScene(RECALL));
    const s2 = episodicSceneToUsd(composeEpisodicScene(RECALL));
    expect(s2).toEqual(s1);
  });
});
