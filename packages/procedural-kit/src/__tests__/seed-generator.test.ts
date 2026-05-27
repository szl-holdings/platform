import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { bomOf } from '../bom.js';
import { partGraphHash, validateScene } from '../composition.js';
import { type Part, makePartLibrary, IDENTITY_TRANSFORM } from '../part.js';
import { generate } from '../seed-generator.js';

const hash = (v: unknown): string => createHash('sha256').update(JSON.stringify(v)).digest('hex');

function mkPart(partId: string, tags: string[], slots: { slotId: string; allowedPartTags: string[] }[] = []): Part {
  return {
    partId,
    meshRef: `mesh://${partId}`,
    tags,
    attachmentFrame: IDENTITY_TRANSFORM,
    slots: slots.map((s) => ({ ...s, localTransform: IDENTITY_TRANSFORM })),
  };
}

const library = makePartLibrary('lib-test', [
  mkPart('chassis', ['root', 'chassis'], [
    { slotId: 'fl', allowedPartTags: ['wheel'] },
    { slotId: 'fr', allowedPartTags: ['wheel'] },
    { slotId: 'rl', allowedPartTags: ['wheel'] },
    { slotId: 'rr', allowedPartTags: ['wheel'] },
    { slotId: 'top', allowedPartTags: ['antenna'] },
  ]),
  mkPart('wheel-small', ['wheel'], []),
  mkPart('wheel-big', ['wheel'], []),
  mkPart('antenna', ['antenna'], []),
]);

describe('generate — deterministic seed→Scene', () => {
  it('same seed → identical scene (property)', () => {
    const a = generate(42, library, { rootTag: 'root', maxDepth: 3, fillProbability: 1 });
    const b = generate(42, library, { rootTag: 'root', maxDepth: 3, fillProbability: 1 });
    expect(partGraphHash(a, hash)).toBe(partGraphHash(b, hash));
  });

  it('different seed → (usually) different scene', () => {
    const a = generate(1, library, { rootTag: 'root', maxDepth: 3, fillProbability: 0.7 });
    const b = generate(99999, library, { rootTag: 'root', maxDepth: 3, fillProbability: 0.7 });
    // Not guaranteed-different by spec, but with this library + seeds it is.
    expect(partGraphHash(a, hash)).not.toBe(partGraphHash(b, hash));
  });

  it('generated scene satisfies validateScene against the library', () => {
    const s = generate(7, library, { rootTag: 'root', maxDepth: 3, fillProbability: 1 });
    expect(validateScene(s, library)).toEqual([]);
  });

  it('bomOf returns counts that sum to the node count', () => {
    const s = generate(11, library, { rootTag: 'root', maxDepth: 3, fillProbability: 1 });
    const bom = bomOf(s);
    const total = Object.values(bom).reduce((acc, c) => acc + c, 0);
    let nodes = 0;
    const walk = (n: { readonly slotBindings: Readonly<Record<string, readonly unknown[]>> }): void => {
      nodes++;
      for (const k of Object.keys(n.slotBindings)) {
        for (const c of n.slotBindings[k]!) walk(c as Parameters<typeof walk>[0]);
      }
    };
    walk(s.root);
    expect(total).toBe(nodes);
  });

  it('throws if no part matches the rootTag', () => {
    expect(() =>
      generate(0, library, { rootTag: 'nonexistent', maxDepth: 1, fillProbability: 1 }),
    ).toThrow(/no parts/);
  });
});

describe('validateScene — slot tag-compatibility', () => {
  it('flags a child whose tags do not match its slot', () => {
    const bad = {
      libraryRef: 'lib-test',
      root: {
        partId: 'chassis',
        transform: IDENTITY_TRANSFORM,
        slotBindings: {
          fl: [{ partId: 'antenna', transform: IDENTITY_TRANSFORM, slotBindings: {} }],
        },
      },
    } as const;
    const errs = validateScene(bad, library);
    expect(errs.length).toBeGreaterThan(0);
    expect(errs[0]!.message).toMatch(/do not match slot/);
  });
});
