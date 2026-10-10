import { z } from 'zod';
import { compareCodeUnits } from './proofweave-canonical.js';

export const PROOFWEAVE_SCHEMA_VERSION = 'a11oy.atelier.proofweave.v1' as const;
export const PROOFWEAVE_POLICY_VERSION = 'a11oy.atelier.proofweave-policy.v1' as const;

export const PROOFWEAVE_POLICY_RULES = Object.freeze([
  'deny_external_writes',
  'deny_provider_native_subagents',
  'deny_provider_durable_storage',
  'require_https_material_locator',
  'require_ascii_stable_identifiers',
  'require_declared_full_git_revision',
  'require_permissive_code_adaptation',
] as const);

const CLAIM_KINDS = ['FACT', 'INFERENCE', 'RECOMMENDATION'] as const;
const MATERIAL_KINDS = ['CODE', 'PUBLICATION', 'MODEL_CARD', 'DATASET', 'RUNTIME_RECEIPT'] as const;
const REUSE_INTENTS = ['REFERENCE_ONLY', 'ADAPT_PATTERN', 'INCORPORATE_CODE'] as const;
const OUTPUT_FORMATS = ['BRIEF', 'TECHNICAL_REPORT', 'DECISION_MEMO'] as const;
const PERMISSIVE_CODE_LICENSES = new Set([
  'Apache-2.0',
  'MIT',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
]);
const FULL_GIT_REVISION = /^[0-9a-f]{40}$/i;
const STABLE_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

const StableIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(
    STABLE_IDENTIFIER,
    'Identifiers must use only ASCII letters, digits, period, underscore, colon, or hyphen.',
  );

const ProofweaveClaimSchema = z
  .object({
    claimId: StableIdentifierSchema,
    statement: z.string().trim().min(1).max(100_000),
    kind: z.enum(CLAIM_KINDS),
  })
  .strict();

const HttpsLocatorSchema = z
  .string()
  .trim()
  .url()
  .superRefine((locator, context) => {
    let parsed: URL;
    try {
      parsed = new URL(locator);
    } catch {
      return;
    }
    if (parsed.protocol !== 'https:') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Material locators must use HTTPS.',
      });
    }
  });

const ProofweaveMaterialSchema = z
  .object({
    materialId: StableIdentifierSchema,
    kind: z.enum(MATERIAL_KINDS),
    locator: HttpsLocatorSchema,
    publisher: z.string().trim().min(1).max(256).optional(),
    revision: z.string().trim().min(1).max(128).optional(),
    license: z.string().trim().min(1).max(128).optional(),
    reuseIntent: z.enum(REUSE_INTENTS),
  })
  .strict()
  .superRefine((material, context) => {
    if (
      material.kind === 'CODE' &&
      material.reuseIntent !== 'REFERENCE_ONLY' &&
      !FULL_GIT_REVISION.test(material.revision ?? '')
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['revision'],
        message:
          'Code used for pattern adaptation or incorporation requires an operator-declared, syntactically valid 40-hex Git revision.',
      });
    }

    if (material.reuseIntent === 'INCORPORATE_CODE' && material.kind !== 'CODE') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reuseIntent'],
        message: 'INCORPORATE_CODE is only valid for CODE materials.',
      });
      return;
    }

    if (
      material.kind === 'CODE' &&
      material.reuseIntent !== 'REFERENCE_ONLY' &&
      !PERMISSIVE_CODE_LICENSES.has(material.license ?? '')
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['license'],
        message:
          'Code pattern adaptation or incorporation requires an explicit permissive SPDX license: Apache-2.0, MIT, BSD-2-Clause, BSD-3-Clause, or ISC.',
      });
    }
  });

export const AtelierProofweaveBudgetSchema = z
  .object({
    maxWorkcells: z.number().int().min(5).max(8).default(5),
    maxProviderCalls: z.number().int().min(0).max(12).default(0),
    maxSourceFetches: z.number().int().min(0).max(40).default(0),
    maxTotalTokens: z.number().int().min(1_024).max(200_000).default(4_096),
    maxEstimatedCostUsd: z.number().finite().min(0).max(100).default(0),
    maxWallTimeMs: z.number().int().min(1_000).max(900_000).default(60_000),
  })
  .strict()
  .default({});

export const AtelierProofweaveCapabilitiesSchema = z
  .object({
    readWeb: z.boolean().default(false),
    readGitHub: z.boolean().default(false),
    externalWrites: z.boolean().default(false),
    providerNativeSubagents: z.boolean().default(false),
    providerDurableStorage: z.boolean().default(false),
  })
  .strict()
  .default({});

export const AtelierProofweaveRequestSchema = z
  .object({
    objective: z.string().trim().min(1).max(100_000),
    claims: z.array(ProofweaveClaimSchema).min(1).max(12),
    materials: z.array(ProofweaveMaterialSchema).max(20).default([]),
    budget: AtelierProofweaveBudgetSchema,
    requestedCapabilities: AtelierProofweaveCapabilitiesSchema,
    outputFormat: z.enum(OUTPUT_FORMATS).default('TECHNICAL_REPORT'),
  })
  .strict()
  .superRefine((request, context) => {
    addDuplicateIdIssues(request.claims, 'claimId', ['claims'], context);
    addDuplicateIdIssues(request.materials, 'materialId', ['materials'], context);
  });

export type AtelierProofweaveRequest = z.infer<typeof AtelierProofweaveRequestSchema>;
export type AtelierProofweaveBudget = Readonly<z.infer<typeof AtelierProofweaveBudgetSchema>>;
export type AtelierProofweaveCapabilities = Readonly<
  z.infer<typeof AtelierProofweaveCapabilitiesSchema>
>;
export type AtelierProofweaveStageName = 'PATTERN' | 'CUT' | 'STITCH' | 'FITTING' | 'LABEL';

export interface AtelierProofweaveStage {
  readonly stageId: `proofweave-${Lowercase<AtelierProofweaveStageName>}`;
  readonly order: 1 | 2 | 3 | 4 | 5;
  readonly name: AtelierProofweaveStageName;
  readonly role: 'Pathfinder' | 'WorkGraphWeaver' | 'ForgeMind' | 'MirrorEval' | 'ProofSmith';
  readonly description: string;
  readonly executionState: 'NOT_EXECUTED';
}

export interface AtelierProofweaveClaimPlan {
  readonly claimId: string;
  readonly statement: string;
  readonly kind: (typeof CLAIM_KINDS)[number];
  readonly evaluationState: 'NOT_EVALUATED';
  readonly evidenceState: 'UNAVAILABLE';
}

export interface AtelierProofweaveMaterialAdmission {
  readonly materialId: string;
  readonly kind: (typeof MATERIAL_KINDS)[number];
  readonly locator: string;
  readonly publisher?: string;
  readonly revision?: string;
  readonly license?: string;
  readonly reuseIntent: (typeof REUSE_INTENTS)[number];
  readonly admissionState: 'ADMITTED_FOR_PLANNING';
  readonly handling:
    | 'HTTPS_REFERENCE_ONLY'
    | 'INDEPENDENT_PATTERN_ADAPTATION'
    | 'PERMISSIVE_CODE_REVIEW';
  readonly metadataEvidenceClass: 'UNKNOWN';
  readonly locatorState: 'DECLARED_NOT_FETCHED';
  readonly publisherState: 'DECLARED_NOT_VERIFIED' | 'UNAVAILABLE';
  readonly revisionState: 'DECLARED_NOT_VERIFIED' | 'UNAVAILABLE';
  readonly licenseState: 'DECLARED_NOT_VERIFIED' | 'UNAVAILABLE';
  readonly fetched: false;
  readonly codeReuseState: 'NOT_INCORPORATED';
}

export interface AtelierProofweaveHashPayload {
  readonly schemaVersion: typeof PROOFWEAVE_SCHEMA_VERSION;
  readonly objective: string;
  readonly outputFormat: (typeof OUTPUT_FORMATS)[number];
  readonly mode: 'RESEARCH_ONLY';
  readonly evidenceClass: 'SIMULATED';
  readonly operationalState: 'DEMO';
  readonly executionState: 'COMPILED_NOT_EXECUTED';
  readonly persistenceState: 'IN_PROCESS_NOT_STORED';
  readonly requestedCapabilities: AtelierProofweaveCapabilities;
  readonly budget: AtelierProofweaveBudget;
  readonly stages: readonly AtelierProofweaveStage[];
  readonly claims: readonly AtelierProofweaveClaimPlan[];
  readonly claimGraph: {
    readonly nodes: readonly AtelierProofweaveClaimPlan[];
    readonly edges: readonly [];
  };
  readonly materials: readonly AtelierProofweaveMaterialAdmission[];
  readonly review: {
    readonly reviewType: 'AUTOMATED_REVIEW';
    readonly reviewState: 'NOT_EXECUTED';
    readonly humanApprovalState: 'UNAVAILABLE';
  };
  readonly policy: {
    readonly version: typeof PROOFWEAVE_POLICY_VERSION;
    readonly digestSha256: string;
    readonly ruleIds: readonly (typeof PROOFWEAVE_POLICY_RULES)[number][];
    readonly decision: 'ALLOW';
    readonly deniedCapabilities: readonly string[];
  };
  readonly limitations: readonly string[];
}

export interface AtelierProofweavePlan extends AtelierProofweaveHashPayload {
  readonly weaveId: `proofweave_${string}`;
  readonly planId: `proofweave_${string}`;
  readonly planSha256: string;
  readonly compiledAt: string;
}

export interface AtelierProofweaveApiResponse extends AtelierProofweavePlan {
  readonly tenantId: string;
  readonly tenantAttributionEvidenceClass: 'DECLARED';
  readonly ledger: {
    readonly entryId: string;
    readonly appendState: 'IN_PROCESS_APPEND_ACCEPTED';
    readonly backendState: 'CONFIGURATION_DEPENDENT';
    readonly durablePersistenceEvidenceClass: 'UNKNOWN';
  };
}

export class AtelierProofweavePolicyDeniedError extends Error {
  readonly code = 'ATELIER_PROOFWEAVE_POLICY_DENIED' as const;
  readonly policyVersion = PROOFWEAVE_POLICY_VERSION;

  constructor(readonly deniedCapabilities: readonly string[]) {
    super(`A11oy Atelier Proofweave policy denied capabilities: ${deniedCapabilities.join(', ')}.`);
    this.name = 'AtelierProofweavePolicyDeniedError';
  }
}

export const PROOFWEAVE_STAGES: readonly AtelierProofweaveStage[] = Object.freeze([
  Object.freeze({
    stageId: 'proofweave-pattern',
    order: 1,
    name: 'PATTERN',
    role: 'Pathfinder',
    description:
      'Pathfinder structures the objective, claims, admitted materials, and declared constraints into a bounded research pattern.',
    executionState: 'NOT_EXECUTED',
  }),
  Object.freeze({
    stageId: 'proofweave-cut',
    order: 2,
    name: 'CUT',
    role: 'WorkGraphWeaver',
    description:
      'WorkGraphWeaver partitions the research pattern into governed Workcells within the declared budget.',
    executionState: 'NOT_EXECUTED',
  }),
  Object.freeze({
    stageId: 'proofweave-stitch',
    order: 3,
    name: 'STITCH',
    role: 'ForgeMind',
    description:
      'ForgeMind assembles the planned claim-to-material reasoning without executing providers, fetching sources, or writing externally.',
    executionState: 'NOT_EXECUTED',
  }),
  Object.freeze({
    stageId: 'proofweave-fitting',
    order: 4,
    name: 'FITTING',
    role: 'MirrorEval',
    description:
      'MirrorEval is assigned an automated review of claim coverage, material handling, and policy conformance.',
    executionState: 'NOT_EXECUTED',
  }),
  Object.freeze({
    stageId: 'proofweave-label',
    order: 5,
    name: 'LABEL',
    role: 'ProofSmith',
    description:
      'ProofSmith labels evidence states, limitations, and the planned Proof Packet for operator inspection.',
    executionState: 'NOT_EXECUTED',
  }),
]);

export const PROOFWEAVE_LIMITATIONS = Object.freeze([
  'This compiler produces a deterministic research plan; it does not execute the plan.',
  'No model or provider call has been made.',
  'No network, web, GitHub, or source fetch has been performed.',
  'DECLARED: this compiler does not fetch, copy, incorporate, or execute source code.',
  'Material locator ownership, publisher, revision existence and reachability, license, and compatibility are operator-declared; their evidence class remains UNKNOWN.',
  'Plan compilation performs no external write or provider-side persistence; an API transport may separately dispatch audit metadata and must label its durability independently.',
  'The compiled plan is returned in process and is not durably stored.',
  'Claim-graph edges remain empty until a separately authorized evidence execution evaluates relationships.',
  'Claim evaluation, automated review, human approval, and runtime evidence remain unavailable until separately executed and witnessed.',
] as const);

export const PROOFWEAVE_DENIED_CAPABILITIES = Object.freeze([
  'externalWrites',
  'providerNativeSubagents',
  'providerDurableStorage',
] as const);

function addDuplicateIdIssues<T extends Record<K, string>, K extends string>(
  entries: readonly T[],
  key: K,
  path: [string],
  context: z.RefinementCtx,
): void {
  const firstIndexes = new Map<string, number>();
  entries.forEach((entry, index) => {
    const firstIndex = firstIndexes.get(entry[key]);
    if (firstIndex === undefined) {
      firstIndexes.set(entry[key], index);
      return;
    }
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [...path, index, key],
      message: `${key} must be unique; it duplicates index ${firstIndex}.`,
    });
  });
}

function materialHandling(
  reuseIntent: AtelierProofweaveMaterialAdmission['reuseIntent'],
): AtelierProofweaveMaterialAdmission['handling'] {
  switch (reuseIntent) {
    case 'REFERENCE_ONLY':
      return 'HTTPS_REFERENCE_ONLY';
    case 'ADAPT_PATTERN':
      return 'INDEPENDENT_PATTERN_ADAPTATION';
    case 'INCORPORATE_CODE':
      return 'PERMISSIVE_CODE_REVIEW';
  }
}

export function deniedProofweaveCapabilities(request: AtelierProofweaveRequest): readonly string[] {
  return PROOFWEAVE_DENIED_CAPABILITIES.filter(
    (capability) => request.requestedCapabilities[capability],
  );
}

export function createAtelierProofweaveHashPayload(
  request: AtelierProofweaveRequest,
  policyDigestSha256: string,
): AtelierProofweaveHashPayload {
  const claims: AtelierProofweaveClaimPlan[] = request.claims
    .map((claim) => ({
      ...claim,
      evaluationState: 'NOT_EVALUATED' as const,
      evidenceState: 'UNAVAILABLE' as const,
    }))
    .sort((left, right) => compareCodeUnits(left.claimId, right.claimId));

  const materials: AtelierProofweaveMaterialAdmission[] = request.materials
    .map((material) => ({
      ...material,
      revision: material.revision?.toLowerCase(),
      admissionState: 'ADMITTED_FOR_PLANNING' as const,
      handling: materialHandling(material.reuseIntent),
      metadataEvidenceClass: 'UNKNOWN' as const,
      locatorState: 'DECLARED_NOT_FETCHED' as const,
      publisherState: material.publisher
        ? ('DECLARED_NOT_VERIFIED' as const)
        : ('UNAVAILABLE' as const),
      revisionState: material.revision
        ? ('DECLARED_NOT_VERIFIED' as const)
        : ('UNAVAILABLE' as const),
      licenseState: material.license
        ? ('DECLARED_NOT_VERIFIED' as const)
        : ('UNAVAILABLE' as const),
      fetched: false as const,
      codeReuseState: 'NOT_INCORPORATED' as const,
    }))
    .sort((left, right) => compareCodeUnits(left.materialId, right.materialId));

  return {
    schemaVersion: PROOFWEAVE_SCHEMA_VERSION,
    objective: request.objective,
    outputFormat: request.outputFormat,
    mode: 'RESEARCH_ONLY',
    evidenceClass: 'SIMULATED',
    operationalState: 'DEMO',
    executionState: 'COMPILED_NOT_EXECUTED',
    persistenceState: 'IN_PROCESS_NOT_STORED',
    requestedCapabilities: request.requestedCapabilities,
    budget: request.budget,
    stages: PROOFWEAVE_STAGES,
    claims,
    claimGraph: { nodes: claims, edges: [] },
    materials,
    review: {
      reviewType: 'AUTOMATED_REVIEW',
      reviewState: 'NOT_EXECUTED',
      humanApprovalState: 'UNAVAILABLE',
    },
    policy: {
      version: PROOFWEAVE_POLICY_VERSION,
      digestSha256: policyDigestSha256,
      ruleIds: PROOFWEAVE_POLICY_RULES,
      decision: 'ALLOW',
      deniedCapabilities: [],
    },
    limitations: PROOFWEAVE_LIMITATIONS,
  };
}
