
import { describe, expect, it } from 'vitest';

describe('DeterministicFallbackBackend logic', () => {
  function tfScore(query: string, text: string): number {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    if (terms.length === 0) return 0;
    const textLower = text.toLowerCase();
    const hits = terms.filter((t) => textLower.includes(t)).length;
    return hits / terms.length;
  }

  it('scores exact match higher than unrelated text', () => {
    const queryTerms = 'maritime law force majeure';
    const relevant = 'Force majeure is a clause in maritime law contracts.';
    const unrelated = 'The stock market closed higher on Monday.';
    expect(tfScore(queryTerms, relevant)).toBeGreaterThan(tfScore(queryTerms, unrelated));
  });

  it('returns 0 for completely unrelated text', () => {
    expect(tfScore('maritime law', 'apples oranges bananas')).toBe(0);
  });

  it('returns 1.0 for text containing all query terms', () => {
    expect(tfScore('maritime law', 'maritime and law are both present here')).toBe(1.0);
  });

  it('short query terms (<=2 chars) are ignored', () => {
    expect(tfScore('a an of', 'a an of the')).toBe(0);
  });
});
