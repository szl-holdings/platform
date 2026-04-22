import { describe, expect, it } from 'vitest';
import { entityUri, isUri, parseUri } from '../uri.js';

describe('ontology URI helpers', () => {
  it('builds a well-formed URI', () => {
    expect(entityUri('vessel', 'imo', '9876543')).toBe('szl://vessel/imo/9876543');
    expect(entityUri('property', 'external', 123)).toBe('szl://property/external/123');
  });

  it('rejects unknown kinds', () => {
    expect(() => entityUri('made-up' as never, 'ns', 'x')).toThrow();
  });

  it('rejects bad namespaces and identifiers', () => {
    expect(() => entityUri('vessel', 'BAD NS', 'x')).toThrow();
    expect(() => entityUri('vessel', 'imo', 'has space')).toThrow();
  });

  it('parses URIs back to components', () => {
    expect(parseUri('szl://matter/pc/42')).toEqual({
      kind: 'matter',
      namespace: 'pc',
      identifier: '42',
    });
  });

  it('rejects malformed URIs', () => {
    expect(() => parseUri('http://nope')).toThrow();
    expect(() => parseUri('szl://nope/a/b')).toThrow(); // unknown kind
    expect(() => parseUri('szl://vessel//x')).toThrow();
  });

  it('isUri narrows correctly', () => {
    expect(isUri('szl://vessel/imo/1')).toBe(true);
    expect(isUri('not a uri')).toBe(false);
    expect(isUri(42)).toBe(false);
  });
});
