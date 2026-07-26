import { randomUUID } from 'node:crypto';
import { canonicalJson, sha256 } from './canonical.js';
import { CapabilityTokenError, verifyCapabilityToken } from './capability.js';
import { createSignedReceipt } from './receipt.js';
import type {
  GovernanceReceipt,
  GovernedActionEnvelope,
  GovernedActionRequest,
  GovernedActionResult,
  McpGovernorConfig,
  PolicyDecision,
  ReplayStore,
  VerifiedCapability,
} from './types.js';

export class InMemoryReplayStore implements ReplayStore {
  private readonly consumed = new Map<string, number>();

  async consume(tokenId: string, expiresAt: number, nowSeconds: number): Promise<boolean> {
    for (const [consumedTokenId, consumedUntil] of this.consumed) {
      if (consumedUntil <= nowSeconds) this.consumed.delete(consumedTokenId);
    }
    if (expiresAt <= nowSeconds || this.consumed.has(tokenId)) return false;
    this.consumed.set(tokenId, expiresAt);
    return true;
  }
}

export class GovernanceDeniedError extends Error {
  constructor(
    readonly envelope: GovernedActionEnvelope,
    readonly decision: PolicyDecision,
    readonly receipts: GovernanceReceipt[],
  ) {
    super(`MCP action denied: ${decision.reason}`);
    this.name = 'GovernanceDeniedError';
  }
}

export class GovernancePostReceiptError extends Error {
  readonly effectOccurred = true;

  constructor(override readonly cause: unknown) {
    super('MCP action completed but its post-effect receipt could not be persisted');
    this.name = 'GovernancePostReceiptError';
  }
}

function block(reason: string): PolicyDecision {
  return { effect: 'block', reason };
}

function validateDecision(value: PolicyDecision): PolicyDecision {
  if (
    !value ||
    !['allow', 'block', 'approval_required'].includes(value.effect) ||
    typeof value.reason !== 'string' ||
    value.reason.length === 0
  ) {
    return block('policy_evaluator_invalid_result');
  }
  return value;
}

export function createGovernedActionEnvelope(
  request: GovernedActionRequest,
  now = new Date(),
): GovernedActionEnvelope {
  if (!request.toolName || !request.actorId || !request.tenantId) {
    throw new TypeError('toolName, actorId, and tenantId are required');
  }
  if (request.risk === 'read_only' && request.mutatesState) {
    throw new TypeError('read_only actions cannot declare a state mutation');
  }
  return {
    schema: 'szl.governed-action/v1',
    actionId: request.actionId ?? randomUUID(),
    toolName: request.toolName,
    actorId: request.actorId,
    tenantId: request.tenantId,
    risk: request.risk,
    mutatesState: request.mutatesState,
    requestedAt: now.toISOString(),
    argsDigest: sha256(canonicalJson(request.args)),
  };
}

export class McpGovernor {
  private readonly replayStore: ReplayStore;

  constructor(private readonly config: McpGovernorConfig) {
    this.replayStore = config.replayStore ?? new InMemoryReplayStore();
  }

  async run<T>(
    request: GovernedActionRequest,
    execute: () => Promise<T>,
  ): Promise<GovernedActionResult<T>> {
    const clock = this.config.clock ?? (() => new Date());
    const envelope = createGovernedActionEnvelope(request, clock());
    const receipts: GovernanceReceipt[] = [];
    let capability: VerifiedCapability | undefined;

    const persist = async (
      phase: 'before' | 'after' | 'blocked',
      outcome: 'pending' | 'success' | 'error' | 'blocked',
      decision: PolicyDecision,
      resultDigest?: string,
      priorReceiptDigest?: string,
    ): Promise<GovernanceReceipt> => {
      const receipt = createSignedReceipt(
        {
          envelope,
          decision,
          phase,
          outcome,
          occurredAt: clock().toISOString(),
          resultDigest,
          priorReceiptDigest,
        },
        this.config.receiptSigner,
      );
      await this.config.receiptWriter(receipt);
      receipts.push(receipt);
      return receipt;
    };

    const deny = async (decision: PolicyDecision): Promise<never> => {
      await persist('blocked', 'blocked', decision);
      throw new GovernanceDeniedError(envelope, decision, receipts);
    };

    const capabilityRequired =
      request.mutatesState || (this.config.requireCapabilityForReadOnly ?? false);
    if (capabilityRequired) {
      if (!request.capabilityToken) return deny(block('capability_token_required'));
      try {
        capability = await verifyCapabilityToken(
          request.capabilityToken,
          this.config.capabilityPublicKeyResolver,
          {
            now: clock(),
            expectedIssuer: this.config.expectedCapabilityIssuer,
            actorId: request.actorId,
            tenantId: request.tenantId,
            toolName: request.toolName,
            risk: request.risk,
          },
        );
      } catch (error) {
        const reason =
          error instanceof CapabilityTokenError
            ? `capability_${error.code}`
            : 'capability_verification_error';
        return deny(block(reason));
      }
    }

    let decision: PolicyDecision;
    try {
      decision = validateDecision(await this.config.policyEvaluator(envelope, request.args));
    } catch {
      decision = block('policy_evaluator_error');
    }
    if (decision.effect !== 'allow') return deny(decision);

    if (capability) {
      const replayCheckAt = Math.floor(clock().getTime() / 1000);
      const fresh = await this.replayStore.consume(
        capability.claims.tokenId,
        capability.claims.expiresAt,
        replayCheckAt,
      );
      if (!fresh) return deny(block('capability_replay'));
    }

    let before: GovernanceReceipt | undefined;
    if (request.mutatesState) {
      before = await persist('before', 'pending', decision);
    }

    let result: T;
    try {
      result = await execute();
    } catch (error) {
      try {
        await persist(
          'after',
          'error',
          decision,
          sha256(canonicalJson({ error: error instanceof Error ? error.name : typeof error })),
          before?.receiptDigest,
        );
      } catch (receiptError) {
        throw new GovernancePostReceiptError(receiptError);
      }
      throw error;
    }

    try {
      await persist(
        'after',
        'success',
        decision,
        sha256(canonicalJson(result === undefined ? null : result)),
        before?.receiptDigest,
      );
    } catch (error) {
      throw new GovernancePostReceiptError(error);
    }
    return { result, envelope, decision, capability, receipts };
  }
}
