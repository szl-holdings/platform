import { describe, expect, it } from 'vitest';
import { buildPageIndex, type JsonValue } from '../src/page-index';

const fixture: JsonValue = {
  doctrine: {
    version: 'v6',
    lambda_conjunctive_floor: 0.85,
    license_allowlist: ['MIT', 'Apache-2.0', 'BSD-3-Clause'],
  },
  thesis: {
    'TH8-GLR': {
      status: 'lean_skeleton_complete',
      theorems: [
        { id: 'TH8.1', proof_status: 'proved' },
        { id: 'TH8.2', proof_status: 'axiom' },
      ],
    },
  },
};

describe('PageIndex doc-tree (VectifyAI / PageIndex)', () => {
  const idx = buildPageIndex(fixture);

  it('lookup resolves nested object and array paths', () => {
    expect(idx.lookup('doctrine/version')).toBe('v6');
    expect(idx.lookup('doctrine/lambda_conjunctive_floor')).toBe(0.85);
    expect(idx.lookup('doctrine/license_allowlist/1')).toBe('Apache-2.0');
    expect(idx.lookup('thesis/TH8-GLR/theorems/0/id')).toBe('TH8.1');
  });

  it('lookup returns undefined for missing paths and bad array indices', () => {
    expect(idx.lookup('doctrine/missing')).toBeUndefined();
    expect(idx.lookup('doctrine/license_allowlist/99')).toBeUndefined();
    expect(idx.lookup('doctrine/license_allowlist/-1')).toBeUndefined();
  });

  it('breadcrumb is a strictly-deepening chain from root to target', () => {
    const trail = idx.breadcrumb('thesis/TH8-GLR/theorems/0/id');
    expect(trail.map((n) => n.key)).toEqual(['', 'thesis', 'TH8-GLR', 'theorems', '0', 'id']);
    for (let i = 1; i < trail.length; i++) {
      expect(trail[i]!.depth).toBe(trail[i - 1]!.depth + 1);
    }
  });

  it('search finds nodes by case-insensitive path substring', () => {
    const hits = idx.search('LICENSE');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((n) => n.path.toLowerCase().includes('license'))).toBe(true);
  });

  it('every visited path round-trips through lookup', () => {
    for (const [path, node] of idx.nodes) {
      if (node.kind !== 'leaf') continue;
      expect(idx.lookup(path)).toBeDefined();
    }
  });
});
