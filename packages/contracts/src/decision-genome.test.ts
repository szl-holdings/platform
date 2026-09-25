import { describe, expect, it } from 'vitest';
import { DecisionGenomeEventSchema, DecisionRecommendationSchema } from './decision-genome';

const event = {
  eventId: 'fixture:observation',
  eventType: 'OBSERVATION',
  at: '2026-09-21T00:00:00.000Z',
  actor: 'fixture:offline',
  subjectDigest: 'a'.repeat(64),
  inputDigests: [],
  policyVersion: 'fixture-v1',
  evidenceLabel: 'MODELED',
};

describe('Decision Genome record payload', () => {
  it('accepts an empty string-keyed payload without inventing evidence', () => {
    expect(DecisionGenomeEventSchema.parse({ ...event, payload: {} }).payload).toEqual({});
  });

  it('preserves heterogeneous unknown values in a non-empty record', () => {
    const payload = {
      sourceState: 'STALE',
      sourceConfidence: 0.5,
      unavailable: null,
      executable: false,
      nested: { label: 'MODELED' },
      inputs: [1, 'two', null],
      '0': 'numeric-looking keys are still strings',
    };
    expect(DecisionGenomeEventSchema.parse({ ...event, payload }).payload).toEqual(payload);
  });

  it.each([
    { name: 'null', value: null },
    { name: 'array', value: [] },
    { name: 'string', value: 'not a record' },
    { name: 'number', value: 1 },
    { name: 'boolean', value: false },
    { name: 'missing', value: undefined },
  ])('rejects an outer $name payload', ({ value }) => {
    expect(DecisionGenomeEventSchema.safeParse({ ...event, payload: value }).success).toBe(false);
  });

  it('does not loosen event identity validation', () => {
    expect(
      DecisionGenomeEventSchema.safeParse({ ...event, subjectDigest: 'short', payload: {} }).success,
    ).toBe(false);
  });
});

describe('Decision Genome recommendation authority boundary', () => {
  const recommendation = {
    state: 'REVIEW_REQUIRED',
    action: 'OPEN_INCIDENT',
    reasonCodes: ['CALIBRATION_SET_INSUFFICIENT'],
    humanApprovalRequired: true,
    executable: false,
    evidenceLabel: 'MODELED',
  };

  it('retains non-executable modeled recommendations', () => {
    expect(DecisionRecommendationSchema.parse(recommendation)).toEqual(recommendation);
  });

  it.each([true, 1, 'false', null, undefined])('rejects executable=%s', (executable) => {
    expect(DecisionRecommendationSchema.safeParse({ ...recommendation, executable }).success).toBe(
      false,
    );
  });
});
