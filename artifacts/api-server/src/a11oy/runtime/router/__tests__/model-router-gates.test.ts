/**
 * Unit tests for the Lexicon-driven branch of `checkInferenceGates`.
 *
 * The router's `license_approved` gate is sourced exclusively from the
 * Lexicon catalog (#4763). These tests prove three properties of that
 * branch in isolation from the API/DB layer:
 *
 *   (a) A model approved only via Lexicon passes the gate even when the
 *       static registry has no opinion (or marks it pending).
 *   (b) A Lexicon entry in any non-approved state (denied, risk_flagged,
 *       pending_review, unknown) does NOT falsely pass the gate.
 *   (c) Cache invalidation is observable: the next call to
 *       `checkInferenceGates` reflects the updated cache state, so the
 *       approve/deny handlers' cache mutations take effect immediately.
 *
 * The static registry gate (`checkHfLiveRoutingGate`) and the Lexicon
 * sync helper (`getLexiconStatusSync`) are mocked so these tests run
 * without a database and isolate the OR/AND logic in the router.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../model-registry.js', () => ({
  checkHfLiveRoutingGate: vi.fn(),
}));

vi.mock('../../../../routes/a11oy-lexicon-api.js', () => ({
  getLexiconStatusSync: vi.fn(),
}));

import { checkInferenceGates } from '../model-router';
import { checkHfLiveRoutingGate } from '../../model-registry.js';
import { getLexiconStatusSync } from '../../../../routes/a11oy-lexicon-api.js';

const mockedRegistry = vi.mocked(checkHfLiveRoutingGate);
const mockedLexicon = vi.mocked(getLexiconStatusSync);

function registryAllPass(): void {
  mockedRegistry.mockReturnValue({
    allowed: true,
    failedConditions: [],
    conditions: {
      registry_record_exists: true,
      license_approved: true, // ignored by router; lexicon is authoritative
      sensitivity_match: true,
      hf_live_inference_enabled: true,
      hf_production_approved: true,
    },
  });
}

describe('checkInferenceGates — Lexicon-driven license_approved gate', () => {
  beforeEach(() => {
    mockedRegistry.mockReset();
    mockedLexicon.mockReset();
    registryAllPass();
  });

  it('(a) passes when a model is approved ONLY via Lexicon (registry license=false)', () => {
    // Critical contract: Lexicon is the SINGLE source of truth for
    // license_approved (#4763). Even when the static registry reports
    // license_approved=false, an 'approved' Lexicon entry must let the
    // gate pass (assuming all other registry gates are green). This
    // assertion would FAIL if the router ever regressed to AND-ing
    // registry license with Lexicon.
    mockedRegistry.mockReturnValue({
      allowed: false,
      failedConditions: ['license_approved'],
      conditions: {
        registry_record_exists: true,
        license_approved: false, // registry does NOT approve
        sensitivity_match: true,
        hf_live_inference_enabled: true,
        hf_production_approved: true,
      },
    });
    mockedLexicon.mockReturnValue('approved');

    const result = checkInferenceGates('Qwen/Qwen3-8B');

    expect(result.allowed).toBe(true);
    expect(result.gates.license_approved).toBe(true);
    expect(result.failedGates).toEqual([]);
    expect(mockedLexicon).toHaveBeenCalledWith('Qwen/Qwen3-8B');
  });

  it('(a-contract) Lexicon approval overrides registry license — registry license value is ignored', () => {
    // Explicit contract assertion: the router must read license_approved
    // exclusively from Lexicon. We flip the registry's license_approved
    // bit while holding Lexicon at 'approved' and verify the router's
    // gates.license_approved tracks Lexicon, not the registry.
    mockedLexicon.mockReturnValue('approved');

    for (const registryLicense of [true, false]) {
      mockedRegistry.mockReturnValue({
        allowed: true,
        failedConditions: [],
        conditions: {
          registry_record_exists: true,
          license_approved: registryLicense,
          sensitivity_match: true,
          hf_live_inference_enabled: true,
          hf_production_approved: true,
        },
      });
      const result = checkInferenceGates('Qwen/Qwen3-8B');
      expect(result.gates.license_approved, `registryLicense=${registryLicense}`).toBe(true);
      expect(result.allowed, `registryLicense=${registryLicense}`).toBe(true);
    }
  });

  it('(b1) does NOT falsely pass when the Lexicon entry is denied', () => {
    mockedLexicon.mockReturnValue('denied');

    const result = checkInferenceGates('some/denied-model');

    expect(result.allowed).toBe(false);
    expect(result.gates.license_approved).toBe(false);
    expect(result.failedGates).toContain('license_approved');
  });

  it('(b2) does NOT falsely pass when the Lexicon entry is risk_flagged or pending_review', () => {
    for (const status of ['risk_flagged', 'pending_review'] as const) {
      mockedLexicon.mockReturnValue(status);
      const result = checkInferenceGates('some/model');
      expect(result.gates.license_approved, `status=${status}`).toBe(false);
      expect(result.allowed, `status=${status}`).toBe(false);
      expect(result.failedGates, `status=${status}`).toContain('license_approved');
    }
  });

  it('(b3) fails closed when the model is unknown to Lexicon', () => {
    mockedLexicon.mockReturnValue('unknown');

    const result = checkInferenceGates('never/seen-model');

    expect(result.allowed).toBe(false);
    expect(result.gates.license_approved).toBe(false);
    expect(result.failedGates).toContain('license_approved');
  });

  it('(c) reflects cache invalidation on the very next call (deny → approve → deny)', () => {
    // Simulate the in-memory cache transitions that approve/deny perform on
    // `approvedCache` / `statusCache`. Because `checkInferenceGates` reads
    // `getLexiconStatusSync` every call (no internal memoisation), each
    // transition must be observable on the next call without a restart.
    const modelId = 'operator/curated-model';

    mockedLexicon.mockReturnValueOnce('denied');
    expect(checkInferenceGates(modelId).allowed).toBe(false);

    mockedLexicon.mockReturnValueOnce('approved');
    expect(checkInferenceGates(modelId).allowed).toBe(true);

    mockedLexicon.mockReturnValueOnce('denied');
    const after = checkInferenceGates(modelId);
    expect(after.allowed).toBe(false);
    expect(after.failedGates).toContain('license_approved');

    expect(mockedLexicon).toHaveBeenCalledTimes(3);
  });

  it('(c-bonus) a registry-failed gate still blocks even if Lexicon approves', () => {
    // Lexicon approval is necessary but not sufficient: other gates from the
    // static registry (e.g. live-inference-enabled) must still pass.
    mockedRegistry.mockReturnValue({
      allowed: false,
      failedConditions: ['hf_live_inference_enabled'],
      conditions: {
        registry_record_exists: true,
        license_approved: true,
        sensitivity_match: true,
        hf_live_inference_enabled: false,
        hf_production_approved: true,
      },
    });
    mockedLexicon.mockReturnValue('approved');

    const result = checkInferenceGates('Qwen/Qwen3-8B');
    expect(result.allowed).toBe(false);
    expect(result.gates.license_approved).toBe(true);
    expect(result.failedGates).toContain('live_inference_enabled');
    expect(result.failedGates).not.toContain('license_approved');
  });
});
