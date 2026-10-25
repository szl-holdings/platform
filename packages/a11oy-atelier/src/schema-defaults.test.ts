import { describe, expect, it } from 'vitest';
import { AtelierAskRequestSchema, AtelierCapabilitiesSchema } from './contracts.js';
import {
  AtelierProofweaveBudgetSchema,
  AtelierProofweaveCapabilitiesSchema,
} from './proofweave-contract.js';

describe('Atelier schema defaults', () => {
  it('keeps omitted and empty capabilities denied', () => {
    const denied = { tools: false, search: false, durableStorage: false, subagents: false };
    expect(AtelierCapabilitiesSchema.parse(undefined)).toEqual(denied);
    expect(AtelierCapabilitiesSchema.parse({})).toEqual(denied);
    expect(AtelierAskRequestSchema.parse({ prompt: 'Local contract check' }).capabilities).toEqual(denied);
  });

  it('retains explicit capability overrides and rejects unknown or invalid fields', () => {
    expect(AtelierCapabilitiesSchema.parse({ search: true })).toEqual({
      tools: false, search: true, durableStorage: false, subagents: false,
    });
    expect(AtelierCapabilitiesSchema.safeParse({ search: 'true' }).success).toBe(false);
    expect(AtelierCapabilitiesSchema.safeParse({ execute: true }).success).toBe(false);
  });

  it('fills the same bounded budget for omitted and empty inputs', () => {
    const budget = {
      maxWorkcells: 5, maxProviderCalls: 0, maxSourceFetches: 0,
      maxTotalTokens: 4_096, maxEstimatedCostUsd: 0, maxWallTimeMs: 60_000,
    };
    expect(AtelierProofweaveBudgetSchema.parse(undefined)).toEqual(budget);
    expect(AtelierProofweaveBudgetSchema.parse({})).toEqual(budget);
    expect(AtelierProofweaveBudgetSchema.parse({ maxWorkcells: 6 })).toEqual({ ...budget, maxWorkcells: 6 });
    expect(AtelierProofweaveBudgetSchema.safeParse({ maxProviderCalls: 13 }).success).toBe(false);
    expect(AtelierProofweaveBudgetSchema.safeParse({ unbounded: true }).success).toBe(false);
  });

  it('keeps every omitted Proofweave capability false', () => {
    const denied = {
      readWeb: false, readGitHub: false, externalWrites: false,
      providerNativeSubagents: false, providerDurableStorage: false,
    };
    expect(AtelierProofweaveCapabilitiesSchema.parse(undefined)).toEqual(denied);
    expect(AtelierProofweaveCapabilitiesSchema.parse({})).toEqual(denied);
    expect(AtelierProofweaveCapabilitiesSchema.safeParse({ externalWrites: 'true' }).success).toBe(false);
    expect(AtelierProofweaveCapabilitiesSchema.safeParse({ unknown: false }).success).toBe(false);
  });
});
