import { describe, expect, it } from 'vitest';
import { detectClusters } from '../cluster-detect.js';
import { step, type Particle } from '../verlet-step.js';

function particle(id: string, x: number, y: number, label: string, radius = 1): Particle {
  return { id, position: [x, y], prevPosition: [x, y], radius, label };
}

describe('detectClusters — spherepop union-find', () => {
  it('partition is total: ∑ cluster.size === particles.length (property)', () => {
    const labels = ['red', 'blue', 'green'];
    const ps: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      ps.push(particle(`p${i}`, Math.cos(i) * 5, Math.sin(i) * 5, labels[i % 3]!));
    }
    const clusters = detectClusters(ps);
    const total = clusters.reduce((acc, c) => acc + c.size, 0);
    expect(total).toBe(ps.length);
  });

  it('different labels never merge even at zero distance', () => {
    const ps = [particle('a', 0, 0, 'red'), particle('b', 0, 0, 'blue')];
    const clusters = detectClusters(ps);
    expect(clusters).toHaveLength(2);
  });

  it('touching same-label particles form one cluster of size 2', () => {
    const ps = [particle('a', 0, 0, 'red', 1), particle('b', 2, 0, 'red', 1)];
    const clusters = detectClusters(ps);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]!.size).toBe(2);
    expect(clusters[0]!.centroid).toEqual([1, 0]);
  });

  it('chain of same-label particles forms one cluster (transitive closure)', () => {
    const ps = [
      particle('a', 0, 0, 'red'),
      particle('b', 1.9, 0, 'red'),
      particle('c', 3.8, 0, 'red'),
      particle('d', 5.7, 0, 'red'),
    ];
    const clusters = detectClusters(ps);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]!.size).toBe(4);
  });
});

describe('step — Verlet integrator', () => {
  it('zero acceleration + zero velocity → position is fixed (idempotence property)', () => {
    const ps = [particle('a', 1, 2, 'x')];
    const next = step(ps, 0.016);
    expect(next[0]!.position[0]).toBeCloseTo(1);
    expect(next[0]!.position[1]).toBeCloseTo(2);
  });

  it('non-overlapping particles after collision resolution', () => {
    const ps = [particle('a', 0, 0, 'x', 1), particle('b', 1.5, 0, 'x', 1)];
    const after = step(ps, 0.016, { collisionIterations: 2 });
    const dx = after[0]!.position[0] - after[1]!.position[0];
    const dy = after[0]!.position[1] - after[1]!.position[1];
    expect(Math.sqrt(dx * dx + dy * dy)).toBeGreaterThanOrEqual(2 - 1e-6);
  });

  it('rejects invalid dt loudly', () => {
    expect(() => step([], 0)).toThrow();
    expect(() => step([], -1)).toThrow();
  });
});
