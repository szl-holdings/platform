import { describe, it, expect } from 'vitest';
import { rank, scoreItem, type BriefingItem } from './index.js';

const ITEMS: BriefingItem[] = [
  { id: 'a', domain: 'Maritime', headline: 'Port congestion', priority: 'high', confidence: 0.94, covenantLift: 42000, tags: ['ports', 'congestion'] },
  { id: 'b', domain: 'Compliance', headline: 'OFAC update', priority: 'medium', confidence: 0.97, covenantLift: 180000, tags: ['sanctions'] },
  { id: 'c', domain: 'Strategy', headline: 'Competitor funding', priority: 'medium', confidence: 0.82, covenantLift: 0, tags: ['intel'] },
];

describe('unirec scorer', () => {
  it('produces deterministic ranking', () => {
    const r1 = rank(ITEMS, { operatorId: 'op-1', recentDomains: ['Maritime', 'Legal'] });
    const r2 = rank(ITEMS, { operatorId: 'op-1', recentDomains: ['Maritime', 'Legal'] });
    expect(r1.rankSignature).toBe(r2.rankSignature);
    expect(r1.ranked.length).toBe(3);
  });

  it('rewards operator affinity', () => {
    const compFocused = rank(ITEMS, { operatorId: 'op-c', recentDomains: ['Compliance'], affinityTags: ['sanctions'] });
    const martFocused = rank(ITEMS, { operatorId: 'op-m', recentDomains: ['Maritime'], affinityTags: ['ports'] });
    expect(compFocused.ranked[0]!.item.id).toBe('b');
    expect(martFocused.ranked[0]!.item.id).toBe('a');
  });

  it('applies operator-calibrated resonance multiplier within bounds', () => {
    const s1 = scoreItem(ITEMS[0]!, { operatorId: 'op', resonanceWeight: 1.5 });
    const s2 = scoreItem(ITEMS[0]!, { operatorId: 'op', resonanceWeight: 1.0 });
    // Capped at 1.2× — not 1.5×
    expect(s1.axes.governance).toBe(1.2);
    expect(s1.score / s2.score).toBeCloseTo(1.2, 5);
  });

  it('exposes per-axis rationale', () => {
    const s = scoreItem(ITEMS[0]!, { operatorId: 'op' });
    expect(s.rationale).toMatch(/U=/);
    expect(s.rationale).toMatch(/C=/);
    expect(s.rationale).toMatch(/P=/);
    expect(s.rationale).toMatch(/G=/);
  });

  it('top-by-domain returns first hit per domain', () => {
    const r = rank(ITEMS, { operatorId: 'op' });
    expect(Object.keys(r.topByDomain).sort()).toEqual(['Compliance', 'Maritime', 'Strategy']);
  });
});
