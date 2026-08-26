import { createHash, randomUUID } from 'node:crypto';
import {
  ATELIER_DISCLOSURE,
  type AtelierAskRequest,
  AtelierAskRequestSchema,
  type AtelierAskResponse,
  type AtelierProviderResult,
} from './contracts.js';
import { evaluateAtelierPolicy } from './policy.js';
import { type AtelierProvider, resolveProvider } from './provider.js';

export class AtelierPolicyDeniedError extends Error {
  readonly code = 'ATELIER_POLICY_DENIED';
  constructor(
    message: string,
    readonly evaluationId: string,
    readonly violations: string[],
  ) {
    super(message);
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function disclosure(result: AtelierProviderResult): string {
  return ATELIER_DISCLOSURE.replace('{provider}', result.providerLabel).replace(
    '{model}',
    result.model,
  );
}

export async function askAtelier(params: {
  request: unknown;
  tenantId: string;
  provider?: AtelierProvider;
  now?: () => Date;
}): Promise<AtelierAskResponse> {
  const request: AtelierAskRequest = AtelierAskRequestSchema.parse(params.request);
  const policy = evaluateAtelierPolicy(request, params.tenantId);
  if (!policy.result.allowed) {
    throw new AtelierPolicyDeniedError(
      policy.result.violations[0]?.reason ?? 'A11oy Atelier policy denied this request.',
      policy.evaluationId,
      policy.result.violations.map((violation) => violation.reason),
    );
  }

  const startedAt = performance.now();
  const provider = params.provider ?? resolveProvider(request.provider);
  const result = await provider.generate(request);
  const generatedAt = (params.now ?? (() => new Date()))().toISOString();
  const sessionId = request.sessionId ?? randomUUID();
  const traceId = randomUUID();
  const receiptId = `atelier_${randomUUID()}`;

  return {
    answer: result.text,
    disclosure: disclosure(result),
    receipt: {
      receiptId,
      traceId,
      sessionId,
      provider: result.provider,
      providerLabel: result.providerLabel,
      model: result.model,
      providerRequestId: result.providerRequestId ?? null,
      promptSha256: sha256(request.prompt),
      responseSha256: sha256(result.text),
      policyEffect: policy.result.effect === 'audit_only' ? 'audit_only' : 'allow',
      policyEvaluationId: policy.evaluationId,
      evidenceState: 'OBSERVED',
      ledgerEntryId: null,
      ledgerState: 'PENDING_API_APPEND',
      memoryState: 'PENDING_API_COMMIT',
      localOnly: result.localOnly,
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      usage: result.usage,
      generatedAt,
    },
  };
}
