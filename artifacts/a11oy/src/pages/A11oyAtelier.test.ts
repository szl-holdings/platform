import { compileAtelierProofweave } from '@szl-holdings/a11oy-atelier';
import type { AtelierProofweaveRequest } from '@szl-holdings/a11oy-atelier/proofweave-verifier';
import { describe, expect, it } from 'vitest';
import { resolveAtelierBrowserBoundary, validateProofweavePlanResponse } from './A11oyAtelier';

const TENANT_ID = 'browser-operator';
const REQUEST: AtelierProofweaveRequest = {
  objective: 'Map an evidence-bound launch decision',
  claims: [{ claimId: 'claim-1', statement: 'The decision is bounded.', kind: 'FACT' }],
  materials: [],
  budget: {
    maxWorkcells: 5,
    maxProviderCalls: 6,
    maxSourceFetches: 16,
    maxTotalTokens: 50_000,
    maxEstimatedCostUsd: 5,
    maxWallTimeMs: 300_000,
  },
  requestedCapabilities: {
    readWeb: false,
    readGitHub: false,
    externalWrites: false,
    providerNativeSubagents: false,
    providerDurableStorage: false,
  },
  outputFormat: 'TECHNICAL_REPORT',
};

function validResponse() {
  return {
    ...compileAtelierProofweave(REQUEST, () => new Date('2026-10-03T12:00:00.000Z')),
    tenantId: TENANT_ID,
    tenantAttributionEvidenceClass: 'DECLARED' as const,
    ledger: {
      entryId: 'ledger-entry-1',
      appendState: 'IN_PROCESS_APPEND_ACCEPTED' as const,
      backendState: 'CONFIGURATION_DEPENDENT' as const,
      durablePersistenceEvidenceClass: 'UNKNOWN' as const,
    },
  };
}

describe('validateProofweavePlanResponse', () => {
  it('accepts a digest-verified response for the exact submitted request and tenant', async () => {
    const response = validResponse();
    await expect(validateProofweavePlanResponse(response, REQUEST, TENANT_ID)).resolves.toBe(
      response,
    );
  });

  it('rejects a response for another submitted request', async () => {
    await expect(
      validateProofweavePlanResponse(
        validResponse(),
        { ...REQUEST, objective: 'A different objective' },
        TENANT_ID,
      ),
    ).rejects.toThrow('ATELIER_RESPONSE_INVALID');
  });

  it('rejects a response for another tenant', async () => {
    await expect(
      validateProofweavePlanResponse(validResponse(), REQUEST, 'other-tenant'),
    ).rejects.toThrow('ATELIER_RESPONSE_INVALID');
  });
});

describe('resolveAtelierBrowserBoundary', () => {
  it('keeps local development browser actions enabled', () => {
    expect(resolveAtelierBrowserBoundary(true)).toEqual({
      actionsEnabled: true,
      scope: 'LOCAL_DEVELOPMENT_ONLY',
    });
  });

  it('fails production browser actions closed without a server-side session or BFF', () => {
    const boundary = resolveAtelierBrowserBoundary(false);

    expect(boundary).toMatchObject({
      actionsEnabled: false,
      evidenceClass: 'BLOCKED',
      runtimeEvidenceClass: 'UNKNOWN',
    });
    expect(boundary.reason).toContain('authenticated server-side session or BFF');
    expect(boundary.reason).toContain('API keys remain server-side');
  });
});
