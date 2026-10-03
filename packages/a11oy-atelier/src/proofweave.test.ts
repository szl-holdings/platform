import { describe, expect, it } from 'vitest';
import {
  AtelierProofweavePolicyDeniedError,
  AtelierProofweaveRequestSchema,
  compileAtelierProofweave,
  PROOFWEAVE_SCHEMA_VERSION,
} from './proofweave.js';

const FIXED_NOW = () => new Date('2026-08-29T18:00:00.000Z');
const REVISION = '1234567890abcdef1234567890abcdef12345678';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Expected fixture value.');
  return value;
}

function baseRequest() {
  return {
    objective: 'Assess two claims and produce an evidence-bound recommendation.',
    claims: [
      {
        claimId: 'claim-b',
        statement: 'The proposed pattern has a bounded execution budget.',
        kind: 'FACT' as const,
      },
      {
        claimId: 'claim-a',
        statement: 'Independent pattern adaptation is preferable to copying source code.',
        kind: 'RECOMMENDATION' as const,
      },
    ],
    materials: [
      {
        materialId: 'material-b',
        kind: 'CODE' as const,
        locator: 'https://example.org/source/tree/main',
        revision: REVISION,
        license: 'Apache-2.0',
        reuseIntent: 'ADAPT_PATTERN' as const,
      },
      {
        materialId: 'material-a',
        kind: 'PUBLICATION' as const,
        locator: 'https://example.org/publication',
        publisher: 'Example Research Institute',
        reuseIntent: 'REFERENCE_ONLY' as const,
      },
    ],
    requestedCapabilities: {
      readWeb: true,
      readGitHub: true,
    },
    outputFormat: 'TECHNICAL_REPORT' as const,
  };
}

describe('compileAtelierProofweave', () => {
  it('produces deterministic IDs and hashes for semantically equivalent requests', () => {
    const first = compileAtelierProofweave(baseRequest(), FIXED_NOW);
    const reordered = baseRequest();
    reordered.claims.reverse();
    reordered.materials.reverse();

    const second = compileAtelierProofweave(reordered, () => new Date('2030-01-01T00:00:00.000Z'));

    expect(first.schemaVersion).toBe(PROOFWEAVE_SCHEMA_VERSION);
    expect(first.planSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(first.planId).toBe(`proofweave_${first.planSha256}`);
    expect(first.weaveId).toBe(first.planId);
    expect(second.planSha256).toBe(first.planSha256);
    expect(second.planId).toBe(first.planId);
    expect(second.weaveId).toBe(first.weaveId);
    expect(first.claims.map((claim) => claim.claimId)).toEqual(['claim-a', 'claim-b']);
    expect(first.materials.map((material) => material.materialId)).toEqual([
      'material-a',
      'material-b',
    ]);
    expect(first.compiledAt).not.toBe(second.compiledAt);

    const changed = compileAtelierProofweave(
      { ...baseRequest(), objective: 'A materially different objective.' },
      FIXED_NOW,
    );
    expect(changed.planSha256).not.toBe(first.planSha256);
  });

  it('rejects unknown fields at the request and nested object boundaries', () => {
    expect(() =>
      compileAtelierProofweave({ ...baseRequest(), bypassPolicy: true }, FIXED_NOW),
    ).toThrow();

    const nested = baseRequest();
    expect(() =>
      compileAtelierProofweave(
        {
          ...nested,
          claims: [{ ...required(nested.claims[0]), unreviewedField: true }],
        },
        FIXED_NOW,
      ),
    ).toThrow();

    expect(() =>
      AtelierProofweaveRequestSchema.parse({
        ...baseRequest(),
        budget: { maxWorkcells: 5, unboundedConcurrency: true },
      }),
    ).toThrow();
  });

  it('rejects duplicate claim and material identifiers', () => {
    const request = baseRequest();
    expect(() =>
      compileAtelierProofweave(
        {
          ...request,
          claims: [
            required(request.claims[0]),
            { ...required(request.claims[1]), claimId: 'claim-b' },
          ],
        },
        FIXED_NOW,
      ),
    ).toThrow(/claimId must be unique/);

    expect(() =>
      compileAtelierProofweave(
        {
          ...request,
          materials: [
            required(request.materials[0]),
            { ...required(request.materials[1]), materialId: 'material-b' },
          ],
        },
        FIXED_NOW,
      ),
    ).toThrow(/materialId must be unique/);
  });

  it('rejects non-HTTPS material locators', () => {
    expect(() =>
      compileAtelierProofweave(
        {
          ...baseRequest(),
          materials: [
            {
              materialId: 'mutable-source',
              kind: 'PUBLICATION',
              locator: 'http://example.org/publication',
              reuseIntent: 'REFERENCE_ONLY',
            },
          ],
        },
        FIXED_NOW,
      ),
    ).toThrow(/HTTPS/);

    const malformed = AtelierProofweaveRequestSchema.safeParse({
      ...baseRequest(),
      materials: [
        {
          materialId: 'malformed-source',
          kind: 'PUBLICATION',
          locator: 'not-a-url',
          reuseIntent: 'REFERENCE_ONLY',
        },
      ],
    });
    expect(malformed.success).toBe(false);
  });

  it('rejects locale-sensitive or visually ambiguous identifiers', () => {
    expect(() =>
      compileAtelierProofweave(
        {
          ...baseRequest(),
          claims: [
            {
              claimId: 'é',
              statement: 'Precomposed identifier.',
              kind: 'FACT',
            },
            { claimId: 'é', statement: 'Combining identifier.', kind: 'FACT' },
          ],
        },
        FIXED_NOW,
      ),
    ).toThrow(/Identifiers must use only ASCII/);
  });

  it('rejects mutable, unlicensed, copyleft, and non-code incorporation requests', () => {
    const compileMaterial = (material: Record<string, unknown>) =>
      compileAtelierProofweave(
        {
          ...baseRequest(),
          materials: [material],
        },
        FIXED_NOW,
      );

    expect(() =>
      compileMaterial({
        materialId: 'mutable-code',
        kind: 'CODE',
        locator: 'https://example.org/source',
        reuseIntent: 'ADAPT_PATTERN',
      }),
    ).toThrow(/40-hex Git revision/);

    expect(() =>
      compileMaterial({
        materialId: 'unlicensed-code',
        kind: 'CODE',
        locator: 'https://example.org/source',
        revision: REVISION,
        reuseIntent: 'INCORPORATE_CODE',
      }),
    ).toThrow(/permissive SPDX license/);

    expect(() =>
      compileMaterial({
        materialId: 'copyleft-pattern-code',
        kind: 'CODE',
        locator: 'https://example.org/source',
        revision: REVISION,
        license: 'AGPL-3.0-only',
        reuseIntent: 'ADAPT_PATTERN',
      }),
    ).toThrow(/permissive SPDX license/);

    expect(() =>
      compileMaterial({
        materialId: 'unlicensed-pattern-code',
        kind: 'CODE',
        locator: 'https://example.org/source',
        revision: REVISION,
        reuseIntent: 'ADAPT_PATTERN',
      }),
    ).toThrow(/permissive SPDX license/);

    expect(() =>
      compileMaterial({
        materialId: 'copyleft-code',
        kind: 'CODE',
        locator: 'https://example.org/source',
        revision: REVISION,
        license: 'AGPL-3.0-only',
        reuseIntent: 'INCORPORATE_CODE',
      }),
    ).toThrow(/permissive SPDX license/);

    expect(() =>
      compileMaterial({
        materialId: 'not-code',
        kind: 'PUBLICATION',
        locator: 'https://example.org/publication',
        revision: REVISION,
        license: 'MIT',
        reuseIntent: 'INCORPORATE_CODE',
      }),
    ).toThrow(/only valid for CODE/);
  });

  it('admits permissively licensed code with a declared full revision for planning without incorporating it', () => {
    const plan = compileAtelierProofweave(
      {
        objective: 'Plan a bounded, licensed source review.',
        claims: [{ claimId: 'claim-1', statement: 'Review source.', kind: 'FACT' }],
        materials: [
          {
            materialId: 'code-1',
            kind: 'CODE',
            locator: 'https://example.org/source',
            revision: REVISION,
            license: 'MIT',
            reuseIntent: 'INCORPORATE_CODE',
          },
        ],
      },
      FIXED_NOW,
    );

    expect(plan.materials[0]).toMatchObject({
      admissionState: 'ADMITTED_FOR_PLANNING',
      handling: 'PERMISSIVE_CODE_REVIEW',
      metadataEvidenceClass: 'UNKNOWN',
      locatorState: 'DECLARED_NOT_FETCHED',
      publisherState: 'UNAVAILABLE',
      revisionState: 'DECLARED_NOT_VERIFIED',
      licenseState: 'DECLARED_NOT_VERIFIED',
      fetched: false,
      codeReuseState: 'NOT_INCORPORATED',
    });
    expect(plan.limitations).toContain(
      'DECLARED: this compiler does not fetch, copy, incorporate, or execute source code.',
    );
  });

  it.each([
    'externalWrites',
    'providerNativeSubagents',
    'providerDurableStorage',
  ] as const)('fails closed when %s is requested', (capability) => {
    let thrown: unknown;
    try {
      compileAtelierProofweave(
        {
          ...baseRequest(),
          requestedCapabilities: { [capability]: true },
        },
        FIXED_NOW,
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AtelierProofweavePolicyDeniedError);
    expect(thrown).toMatchObject({
      code: 'ATELIER_PROOFWEAVE_POLICY_DENIED',
      deniedCapabilities: [capability],
    });
  });

  it('emits the five fixed stages, lifecycle states, evidence class, and bounded defaults', () => {
    const plan = compileAtelierProofweave(
      {
        objective: 'Compile a research-only plan.',
        claims: [{ claimId: 'claim-1', statement: 'One claim.', kind: 'INFERENCE' }],
      },
      FIXED_NOW,
    );

    expect(plan.stages.map((stage) => stage.name)).toEqual([
      'PATTERN',
      'CUT',
      'STITCH',
      'FITTING',
      'LABEL',
    ]);
    expect(plan.review).toEqual({
      reviewType: 'AUTOMATED_REVIEW',
      reviewState: 'NOT_EXECUTED',
      humanApprovalState: 'UNAVAILABLE',
    });
    expect(plan).toMatchObject({
      mode: 'RESEARCH_ONLY',
      evidenceClass: 'SIMULATED',
      operationalState: 'DEMO',
      executionState: 'COMPILED_NOT_EXECUTED',
      persistenceState: 'IN_PROCESS_NOT_STORED',
      policy: {
        version: 'a11oy.atelier.proofweave-policy.v1',
        digestSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        decision: 'ALLOW',
        deniedCapabilities: [],
      },
      budget: {
        maxWorkcells: 5,
        maxProviderCalls: 0,
        maxSourceFetches: 0,
        maxTotalTokens: 4_096,
        maxEstimatedCostUsd: 0,
        maxWallTimeMs: 60_000,
      },
    });
    expect(plan.claims[0]).toMatchObject({
      evaluationState: 'NOT_EVALUATED',
      evidenceState: 'UNAVAILABLE',
    });
    expect(plan.claimGraph.nodes).toEqual(plan.claims);
    expect(plan.claimGraph.edges).toEqual([]);
    expect(plan.limitations).toContain(
      'Claim-graph edges remain empty until a separately authorized evidence execution evaluates relationships.',
    );

    const originalHash = plan.planSha256;
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.stages)).toBe(true);
    expect(Object.isFrozen(plan.stages[0])).toBe(true);
    expect(() => {
      const stages = plan.stages as unknown as Array<{ description: string }>;
      required(stages[0]).description = 'mutated after hashing';
    }).toThrow(TypeError);
    expect(
      compileAtelierProofweave(
        {
          objective: 'Compile a research-only plan.',
          claims: [{ claimId: 'claim-1', statement: 'One claim.', kind: 'INFERENCE' }],
        },
        FIXED_NOW,
      ).planSha256,
    ).toBe(originalHash);

    const bounded = compileAtelierProofweave(
      {
        objective: 'Compile at the admitted maxima.',
        claims: [{ claimId: 'claim-1', statement: 'One claim.', kind: 'FACT' }],
        budget: {
          maxWorkcells: 8,
          maxProviderCalls: 12,
          maxSourceFetches: 40,
          maxTotalTokens: 200_000,
          maxEstimatedCostUsd: 100,
          maxWallTimeMs: 900_000,
        },
      },
      FIXED_NOW,
    );
    expect(bounded.budget.maxWorkcells).toBe(8);
    expect(() =>
      compileAtelierProofweave(
        {
          objective: 'Too many Workcells.',
          claims: [{ claimId: 'claim-1', statement: 'One claim.', kind: 'FACT' }],
          budget: { maxWorkcells: 9 },
        },
        FIXED_NOW,
      ),
    ).toThrow();
  });
});
