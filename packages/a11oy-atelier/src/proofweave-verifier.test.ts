import { describe, expect, it } from 'vitest';
import { compileAtelierProofweave } from './proofweave.js';
import { canonicalSerialize, sha256Hex } from './proofweave-canonical.js';
import { verifyAtelierProofweaveResponse } from './proofweave-verifier.js';

const TENANT_ID = 'solo-builder';
const FIXED_NOW = () => new Date('2026-10-03T12:00:00.000Z');
const REVISION = '1234567890abcdef1234567890abcdef12345678';
const HASH_FIELDS = [
  'schemaVersion',
  'objective',
  'outputFormat',
  'mode',
  'evidenceClass',
  'operationalState',
  'executionState',
  'persistenceState',
  'requestedCapabilities',
  'budget',
  'stages',
  'claims',
  'claimGraph',
  'materials',
  'review',
  'policy',
  'limitations',
] as const;

function requestFixture() {
  return {
    objective: 'Map an evidence-bound launch decision.',
    claims: [
      { claimId: 'claim-2', statement: 'The decision remains bounded.', kind: 'FACT' as const },
      {
        claimId: 'claim-1',
        statement: 'An independent expression is preferable.',
        kind: 'RECOMMENDATION' as const,
      },
    ],
    materials: [
      {
        materialId: 'material-1',
        kind: 'CODE' as const,
        locator: 'https://example.org/source',
        revision: REVISION,
        license: 'Apache-2.0',
        reuseIntent: 'ADAPT_PATTERN' as const,
      },
    ],
    budget: {
      maxWorkcells: 5,
      maxProviderCalls: 6,
      maxSourceFetches: 16,
      maxTotalTokens: 50_000,
      maxEstimatedCostUsd: 5,
      maxWallTimeMs: 300_000,
    },
    requestedCapabilities: {
      readWeb: true,
      readGitHub: true,
      externalWrites: false,
      providerNativeSubagents: false,
      providerDurableStorage: false,
    },
    outputFormat: 'TECHNICAL_REPORT' as const,
  };
}

function responseFixture() {
  return {
    ...compileAtelierProofweave(requestFixture(), FIXED_NOW),
    tenantId: TENANT_ID,
    tenantAttributionEvidenceClass: 'DECLARED' as const,
    ledger: {
      entryId: 'le_verifier_test',
      appendState: 'IN_PROCESS_APPEND_ACCEPTED' as const,
      backendState: 'CONFIGURATION_DEPENDENT' as const,
      durablePersistenceEvidenceClass: 'UNKNOWN' as const,
    },
  };
}

function mutableResponse(): Record<string, unknown> {
  return structuredClone(responseFixture()) as unknown as Record<string, unknown>;
}

function nestedRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected test fixture record.');
  }
  return value as Record<string, unknown>;
}

async function rehash(response: Record<string, unknown>): Promise<void> {
  const payload = Object.fromEntries(HASH_FIELDS.map((field) => [field, response[field]]));
  const digest = await sha256Hex(canonicalSerialize(payload));
  response.planSha256 = digest;
  response.planId = `proofweave_${digest}`;
  response.weaveId = `proofweave_${digest}`;
}

describe('verifyAtelierProofweaveResponse', () => {
  it('accepts only the exact request-bound tenant plan and recomputed digest', async () => {
    const response = responseFixture();
    await expect(
      verifyAtelierProofweaveResponse(response, {
        request: requestFixture(),
        tenantId: TENANT_ID,
      }),
    ).resolves.toBe(response);
  });

  it('rejects another tenant response', async () => {
    await expect(
      verifyAtelierProofweaveResponse(responseFixture(), {
        request: requestFixture(),
        tenantId: 'other-tenant',
      }),
    ).rejects.toThrow('ATELIER_RESPONSE_INVALID');
  });

  it('rejects self-consistently rehashed claim and material substitutions', async () => {
    const claimTamper = mutableResponse();
    const claims = claimTamper.claims as Array<Record<string, unknown>>;
    claims[0] = { ...claims[0], statement: 'Substituted claim.' };
    nestedRecord(claimTamper.claimGraph).nodes = claims;
    await rehash(claimTamper);

    await expect(
      verifyAtelierProofweaveResponse(claimTamper, {
        request: requestFixture(),
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow('ATELIER_RESPONSE_INVALID');

    const materialTamper = mutableResponse();
    const materials = materialTamper.materials as Array<Record<string, unknown>>;
    materials[0] = { ...materials[0], locator: 'https://attacker.example/source' };
    await rehash(materialTamper);

    await expect(
      verifyAtelierProofweaveResponse(materialTamper, {
        request: requestFixture(),
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow('ATELIER_RESPONSE_INVALID');
  });

  it('rejects a self-consistently rehashed policy substitution', async () => {
    const response = mutableResponse();
    nestedRecord(response.policy).ruleIds = ['deny_external_writes'];
    await rehash(response);

    await expect(
      verifyAtelierProofweaveResponse(response, {
        request: requestFixture(),
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow('ATELIER_RESPONSE_INVALID');
  });

  it('rejects digest, budget, stage, review, limitation, and ordering mismatches', async () => {
    const cases: Record<string, unknown>[] = [];

    const digest = mutableResponse();
    digest.planSha256 = 'f'.repeat(64);
    digest.planId = `proofweave_${'f'.repeat(64)}`;
    digest.weaveId = `proofweave_${'f'.repeat(64)}`;
    cases.push(digest);

    const budget = mutableResponse();
    nestedRecord(budget.budget).maxSourceFetches = 15;
    cases.push(budget);

    const stage = mutableResponse();
    const stages = stage.stages as Array<Record<string, unknown>>;
    stages[0] = { ...stages[0], description: 'Substituted stage.' };
    cases.push(stage);

    const review = mutableResponse();
    nestedRecord(review.review).reviewState = 'EXECUTED';
    cases.push(review);

    const limitation = mutableResponse();
    limitation.limitations = ['Limitations removed.'];
    cases.push(limitation);

    const reordered = mutableResponse();
    reordered.claims = [...(reordered.claims as unknown[])].reverse();
    cases.push(reordered);

    for (const response of cases) {
      await expect(
        verifyAtelierProofweaveResponse(response, {
          request: requestFixture(),
          tenantId: TENANT_ID,
        }),
      ).rejects.toThrow('ATELIER_RESPONSE_INVALID');
    }
  });

  it('rejects unbound top-level and ledger fields', async () => {
    const topLevel = mutableResponse();
    topLevel.unboundProof = 'not-hashed';
    const ledger = mutableResponse();
    nestedRecord(ledger.ledger).unboundProof = 'not-hashed';

    for (const response of [topLevel, ledger]) {
      await expect(
        verifyAtelierProofweaveResponse(response, {
          request: requestFixture(),
          tenantId: TENANT_ID,
        }),
      ).rejects.toThrow('ATELIER_RESPONSE_INVALID');
    }
  });

  it('rejects ledger entry identifiers that are not bounded single-line ASCII', async () => {
    const invalidEntryIds = [
      'le_ok\nTENANT ATTRIBUTION MEASURED',
      'le_ok\rforged',
      'le_ok\tforged',
      'le contains spaces',
      `le_${'a'.repeat(126)}`,
      'lé_unicode',
    ];

    for (const entryId of invalidEntryIds) {
      const response = mutableResponse();
      nestedRecord(response.ledger).entryId = entryId;

      await expect(
        verifyAtelierProofweaveResponse(response, {
          request: requestFixture(),
          tenantId: TENANT_ID,
        }),
      ).rejects.toThrow('ATELIER_RESPONSE_INVALID');
    }
  });
});
