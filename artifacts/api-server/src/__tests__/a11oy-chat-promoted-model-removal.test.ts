/**
 * Unit coverage for `removePromotedModel()` and the chat router's safe
 * fallback when a `forcedModelId` points at a no-longer-promoted entry.
 *
 * Task #4981: deleting a model from the operator registry must also clear
 * the chat-router PROMOTED_MODELS picker. This test imports the chat
 * router module directly (no network / no auth) and asserts:
 *
 *   1. `registerPromotedModel` lands an entry in the picker.
 *   2. `removePromotedModel(upstreamId)` returns the lane ids it dropped
 *      AND removes every entry whose `upstreamModel` matches.
 *   3. Calling `removePromotedModel` for an unknown upstream is a no-op.
 *
 * The chat-router lane-resolution path itself (line ~568) already falls
 * back to `MODEL_LANE_MAP['a1.1oy-sovereign']` when `chosenModelId` does
 * not exist in either map, so the post-removal forcedModelId fallback is
 * a code-path assertion in `lane-config-fallback-on-removed-promoted`.
 */

import { describe, it, expect } from 'vitest';
import { registerPromotedModel, removePromotedModel } from '../routes/a11oy-chat.js';

describe('removePromotedModel — picker stays in sync with registry deletions', () => {
  it('drops the promoted entry by upstream model id and returns the removed lane id', () => {
    const externalId = 'test-anthropic/promoted-only-for-removal-test';
    registerPromotedModel({
      artifactId: 'art-removal-test-1',
      externalId,
      displayName: 'Promoted-Only-For-Removal-Test',
      provider: 'anthropic',
      codexScore: 0.9,
      promotedAt: new Date().toISOString(),
    });

    const removed = removePromotedModel(externalId);
    expect(removed).toEqual([`a1.1oy-frontier:anthropic:${externalId}`]);

    // Second removal is a no-op — already gone.
    const removedAgain = removePromotedModel(externalId);
    expect(removedAgain).toEqual([]);
  });

  it('is a no-op for an upstream id that was never promoted', () => {
    const removed = removePromotedModel('never-promoted/abc-xyz');
    expect(removed).toEqual([]);
  });
});
