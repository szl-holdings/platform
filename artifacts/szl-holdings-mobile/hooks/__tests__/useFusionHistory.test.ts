import { dedupeHistory, MAX_HISTORY } from '../useFusionHistory';

describe('dedupeHistory', () => {
  it('prepends a new query', () => {
    expect(dedupeHistory('alpha', ['beta'])).toEqual(['alpha', 'beta']);
  });

  it('trims whitespace before storing', () => {
    expect(dedupeHistory('  alpha  ', [])).toEqual(['alpha']);
  });

  it('rejects queries shorter than 3 characters', () => {
    expect(dedupeHistory('a', ['beta'])).toEqual(['beta']);
    expect(dedupeHistory('  ', ['beta'])).toEqual(['beta']);
  });

  it('moves an existing query to the front (case-insensitive dedupe)', () => {
    expect(dedupeHistory('Alpha', ['beta', 'alpha', 'gamma'])).toEqual(['Alpha', 'beta', 'gamma']);
  });

  it(`caps history at ${MAX_HISTORY} entries`, () => {
    const existing = Array.from({ length: MAX_HISTORY }, (_, i) => `query-${i}`);
    const result = dedupeHistory('newest', existing);
    expect(result).toHaveLength(MAX_HISTORY);
    expect(result[0]).toBe('newest');
    expect(result[result.length - 1]).toBe(`query-${MAX_HISTORY - 2}`);
  });

  it('preserves the most recent casing when a duplicate is re-submitted', () => {
    const result = dedupeHistory('ALPHA', ['alpha', 'beta']);
    expect(result).toEqual(['ALPHA', 'beta']);
  });
});
