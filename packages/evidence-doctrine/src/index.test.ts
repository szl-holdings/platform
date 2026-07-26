// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertLambdaCaseStudy,
  type DecisionEvidence,
  type DecisionEvidenceBundle,
  evaluateTheoremU,
  gradeDecision,
  LEVEL_REQUIREMENTS,
} from './index.ts';

const BUNDLE_IDENTITY = {
  subject: 'decision:fixture:001',
  bundle_sha256: 'a'.repeat(64),
  evaluated_at: '2026-07-26T07:00:00Z',
};

function bundle(
  evidence: DecisionEvidence,
  identity: DecisionEvidenceBundle['identity'] = BUNDLE_IDENTITY,
): DecisionEvidenceBundle {
  return { identity, evidence };
}

function verifiedThrough(level: 'D1' | 'D2' | 'D3' | 'D4'): DecisionEvidence {
  const evidence: DecisionEvidence = {};
  for (const current of ['D1', 'D2', 'D3', 'D4'] as const) {
    for (const requirement of LEVEL_REQUIREMENTS[current]) {
      evidence[requirement] = 'VERIFIED';
    }
    if (current === level) break;
  }
  return evidence;
}

test('D0 when a D1 record is incomplete', () => {
  const result = gradeDecision(
    bundle({
      inputs_recorded: 'VERIFIED',
      policy_recorded: 'UNVERIFIED',
      output_recorded: 'VERIFIED',
    }),
  );
  assert.equal(result.achieved_level, 'D0');
  assert.deepEqual(result.blocking_requirements, ['policy_recorded']);
  assert.equal(result.bundle_subject, BUNDLE_IDENTITY.subject);
  assert.equal(result.bundle_sha256, BUNDLE_IDENTITY.bundle_sha256);
  assert.equal(result.evaluated_at, BUNDLE_IDENTITY.evaluated_at);
});

test('D1 records inputs, policy, and output', () => {
  assert.equal(gradeDecision(bundle(verifiedThrough('D1'))).achieved_level, 'D1');
});

test('later evidence cannot skip an unverified D2 requirement', () => {
  const evidence = verifiedThrough('D4');
  evidence.signature_verified = 'UNVERIFIED';
  assert.equal(gradeDecision(bundle(evidence)).achieved_level, 'D1');
});

test('D4 requires every cumulative requirement', () => {
  const result = gradeDecision(bundle(verifiedThrough('D4')));
  assert.equal(result.achieved_level, 'D4');
  assert.equal(result.unverified_requirements.length, 0);
  assert.equal(result.absent_requirements.length, 0);
});

test('truthy values are rejected instead of being treated as evidence', () => {
  assert.throws(
    () => gradeDecision(bundle({ inputs_recorded: true as never })),
    /must be VERIFIED, UNVERIFIED, or ABSENT/,
  );
  assert.throws(
    () => gradeDecision(bundle({ inputs_recorded: null as never })),
    /must be VERIFIED, UNVERIFIED, or ABSENT/,
  );
});

test('bundle identity is required and validated before grading', () => {
  assert.throws(
    () => gradeDecision({ evidence: verifiedThrough('D1') } as never),
    /identity must be an object/,
  );
  assert.throws(
    () =>
      gradeDecision(
        bundle(verifiedThrough('D1'), {
          ...BUNDLE_IDENTITY,
          bundle_sha256: 'NOT-A-DIGEST',
        }),
      ),
    /lowercase sha256 digest/,
  );
  assert.throws(
    () =>
      gradeDecision(
        bundle(verifiedThrough('D1'), {
          ...BUNDLE_IDENTITY,
          evaluated_at: '2026-07-26T07:00:00',
        }),
      ),
    /timezone-qualified timestamp/,
  );
});

test('Lambda uniqueness stays open, gray, and not machine-checked', () => {
  assert.deepEqual(
    assertLambdaCaseStudy({
      claim: 'CONJECTURE_1',
      state: 'OPEN',
      display: 'GRAY',
      machine_checked: false,
    }),
    {
      claim: 'CONJECTURE_1',
      state: 'OPEN',
      display: 'GRAY',
      machine_checked: false,
    },
  );
  assert.throws(
    () =>
      assertLambdaCaseStudy({
        claim: 'CONJECTURE_1',
        state: 'OPEN',
        display: 'GRAY',
        machine_checked: true,
      } as never),
    /not machine-checked/,
  );
  assert.throws(
    () =>
      assertLambdaCaseStudy({
        claim: 'CONJECTURE_1',
        state: 'OPEN',
        display: 'GRAY',
        machine_checked: false,
        conclusion: 'PROVED',
      }),
    /must remain CONJECTURE_1/,
  );
});

test('Theorem U reports only a conditional result', () => {
  assert.equal(
    evaluateTheoremU({
      premise_u1: 'VERIFIED',
      premise_u2: 'VERIFIED',
      premise_u3: 'VERIFIED',
    }),
    'CONDITIONALLY_SATISFIED',
  );
  assert.equal(
    evaluateTheoremU({
      premise_u1: 'VERIFIED',
      premise_u2: 'UNVERIFIED',
      premise_u3: 'VERIFIED',
    }),
    'CONDITIONAL_OPEN',
  );
  assert.equal(
    evaluateTheoremU({
      premise_u1: 'VERIFIED',
    } as never),
    'CONDITIONAL_OPEN',
  );
  assert.equal(
    evaluateTheoremU({
      premise_u1: 'VERIFIED',
      premise_u2: 'VERIFIED',
      premise_u3: 'VERIFIED',
      conclusion: 'PROVED',
    } as never),
    'CONDITIONAL_OPEN',
  );
});
