import type { ActorRole, WorkflowContext, WorkflowStepResult } from './types.js';

export interface ActorExecutionResult {
  output: Record<string, unknown>;
  requiresApproval?: boolean;
  approvalContext?: Record<string, unknown>;
  [key: string]: unknown;
}

export abstract class WorkflowActor {
  abstract readonly role: ActorRole;
  abstract execute(
    ctx: WorkflowContext,
    input: Record<string, unknown>,
    prior: WorkflowStepResult[],
  ): Promise<ActorExecutionResult>;
}

export class IngestionPlannerActor extends WorkflowActor {
  readonly role: ActorRole = 'IngestionPlanner';

  async execute(
    ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const sourceId = String(input.sourceId ?? 'unknown');
    const contentLength = String(input.content ?? '').length;

    const estimatedChunks = Math.max(1, Math.ceil(contentLength / 512));

    return {
      output: {
        plan: 'sequential-ingest',
        sourceId,
        estimatedChunks,
        contentLengthBytes: contentLength,
        profileId: ctx.profileId,
        tenantId: ctx.tenantId,
      },
    };
  }
}

export class SourceNormalizerActor extends WorkflowActor {
  readonly role: ActorRole = 'SourceNormalizer';

  async execute(
    _ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const content = String(input.content ?? '');
    const normalized = content
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .trim();

    return {
      output: {
        normalizedLength: normalized.length,
        contentType: String(input.contentType ?? 'text/plain'),
        normalizedAt: new Date().toISOString(),
      },
    };
  }
}

/**
 * Truncation policy injected from the active DomainProfile. Mirrors the shape
 * of `@workspace/aef-domain-profiles`'s TruncationPolicySchema so callers can
 * pass the profile's value through unchanged.
 */
export interface ChunkTruncationPolicy {
  strategy: 'truncate' | 'reject';
  maxTokens: number;
  warnAtTokens?: number;
}

/**
 * Function that turns text into model-token IDs. Supplied by the embedding
 * backend (e.g. `loadTokenizer()` from `@workspace/continuum-vector-worker`) so
 * chunk windows align exactly with what the embedder will see.
 */
export type ChunkTokenizer = {
  encode(text: string): number[];
  decode(ids: number[]): string;
};

export interface ChunkPlannerOptions {
  tokenizer?: ChunkTokenizer;
  /**
   * Async loader invoked on first use when no `tokenizer` is supplied directly.
   * Allows the heavy embedding-model tokenizer to be lazy-imported only when
   * the workflow actually runs.
   */
  tokenizerLoader?: () => Promise<ChunkTokenizer | undefined>;
  truncationPolicy?: ChunkTruncationPolicy;
}

/**
 * Default tokenizer loader: dynamically imports
 * `@workspace/continuum-vector-worker`'s `loadTokenizer()` so token-based
 * chunking matches the embedding model's vocabulary. Returns `undefined`
 * if the package or model cannot be loaded (caller falls back to words).
 */
export async function loadDefaultChunkTokenizer(
  modelRef = 'Xenova/all-MiniLM-L6-v2',
): Promise<ChunkTokenizer | undefined> {
  try {
    const specifier = '@workspace/continuum-vector-worker';
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      loadTokenizer: (m: string) => Promise<ChunkTokenizer>;
    };
    const tok = await mod.loadTokenizer(modelRef);
    return {
      encode: (text: string) => tok.encode(text),
      decode: (ids: number[]) => tok.decode(ids),
    };
  } catch (_err) {
    return undefined;
  }
}

export interface ChunkPlanEntry {
  chunkIndex: number;
  /** Inclusive token offset (or word offset in word-fallback mode). */
  start: number;
  /** Exclusive end offset. */
  end: number;
  unit: 'tokens' | 'words';
  tokenCount: number;
  text?: string;
  truncated?: boolean;
}

export class ChunkPlannerActor extends WorkflowActor {
  readonly role: ActorRole = 'ChunkPlanner';
  private tokenizer: ChunkTokenizer | undefined;
  private readonly tokenizerLoader: (() => Promise<ChunkTokenizer | undefined>) | undefined;
  private readonly truncationPolicy: ChunkTruncationPolicy | undefined;
  private loadingTokenizer: Promise<ChunkTokenizer | undefined> | undefined;

  constructor(opts: ChunkPlannerOptions = {}) {
    super();
    this.tokenizer = opts.tokenizer;
    this.tokenizerLoader = opts.tokenizerLoader;
    this.truncationPolicy = opts.truncationPolicy;
  }

  private async resolveTokenizer(): Promise<ChunkTokenizer | undefined> {
    if (this.tokenizer) return this.tokenizer;
    if (!this.tokenizerLoader) return undefined;
    if (!this.loadingTokenizer) {
      this.loadingTokenizer = this.tokenizerLoader().then((t) => {
        if (t) this.tokenizer = t;
        return t;
      });
    }
    return this.loadingTokenizer;
  }

  async execute(
    _ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const content = String(input.content ?? '');
    const chunkSize = Number(input.chunkSize ?? 512);
    const chunkOverlap = Number(input.chunkOverlap ?? 64);
    const policy: ChunkTruncationPolicy = (input.truncationPolicy as
      | ChunkTruncationPolicy
      | undefined) ??
      this.truncationPolicy ?? {
        strategy: 'truncate',
        maxTokens: 512,
      };

    const tokenizer = await this.resolveTokenizer();
    if (tokenizer) {
      return this.planByTokens(tokenizer, content, chunkSize, chunkOverlap, policy);
    }
    return this.planByWords(content, chunkSize, chunkOverlap, policy);
  }

  private planByTokens(
    tokenizer: ChunkTokenizer,
    content: string,
    chunkSize: number,
    chunkOverlap: number,
    policy: ChunkTruncationPolicy,
  ): ActorExecutionResult {
    const ids = tokenizer.encode(content);
    if (chunkSize <= 0) {
      throw new Error(`ChunkPlanner: chunkSize=${chunkSize} must be > 0`);
    }
    if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
      throw new Error(`ChunkPlanner: chunkOverlap=${chunkOverlap} must be in [0, ${chunkSize})`);
    }
    const effectiveSize = chunkSize;
    const step = Math.max(1, effectiveSize - chunkOverlap);
    const chunks: ChunkPlanEntry[] = [];
    let cursor = 0;

    while (cursor < ids.length) {
      const end = Math.min(cursor + effectiveSize, ids.length);
      let windowIds = ids.slice(cursor, end);
      let truncated = false;

      if (windowIds.length > policy.maxTokens) {
        if (policy.strategy === 'reject') {
          throw new Error(
            `ChunkPlanner[reject]: window of ${windowIds.length} tokens exceeds maxTokens=${policy.maxTokens}`,
          );
        }
        windowIds = windowIds.slice(0, policy.maxTokens);
        truncated = true;
      }

      chunks.push({
        chunkIndex: chunks.length,
        start: cursor,
        end: cursor + windowIds.length,
        unit: 'tokens',
        tokenCount: windowIds.length,
        text: tokenizer.decode(windowIds),
        truncated,
      });

      if (end >= ids.length) break;
      cursor += step;
    }

    return {
      output: {
        chunkPlan: chunks,
        totalChunks: chunks.length,
        unit: 'tokens',
        chunkSizeTokens: effectiveSize,
        chunkOverlapTokens: chunkOverlap,
        totalTokens: ids.length,
        truncationPolicy: policy,
        anyTruncated: chunks.some((c) => c.truncated),
      },
    };
  }

  private planByWords(
    content: string,
    chunkSize: number,
    chunkOverlap: number,
    policy: ChunkTruncationPolicy,
  ): ActorExecutionResult {
    const words = content.split(/\s+/).filter((w) => w.length > 0);
    const chunks: ChunkPlanEntry[] = [];
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const sliceWords = words.slice(start, end);
      const tokenCountEstimate = Math.ceil(sliceWords.length * 1.3);

      if (tokenCountEstimate > policy.maxTokens && policy.strategy === 'reject') {
        throw new Error(
          `ChunkPlanner[reject]: estimated ${tokenCountEstimate} tokens exceeds maxTokens=${policy.maxTokens} (no tokenizer injected)`,
        );
      }

      chunks.push({
        chunkIndex: chunks.length,
        start,
        end,
        unit: 'words',
        tokenCount: tokenCountEstimate,
      });
      if (end >= words.length) break;
      start = end - chunkOverlap;
      if (start <= (chunks[chunks.length - 1]?.start ?? 0)) {
        start = end;
      }
    }

    return {
      output: {
        chunkPlan: chunks,
        totalChunks: chunks.length,
        unit: 'words',
        chunkSizeWords: chunkSize,
        chunkOverlapWords: chunkOverlap,
        truncationPolicy: policy,
      },
    };
  }
}

export class PolicyGuardActor extends WorkflowActor {
  readonly role: ActorRole = 'PolicyGuard';

  async execute(
    ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const operation = String(input.operation ?? 'ingest');
    const tenantId = ctx.tenantId;

    const isDestructive = ['rebuild_index', 'rotate_profile_version'].includes(operation);

    return {
      output: {
        tenantId,
        operation,
        policyDecision: 'allow',
        isDestructive,
        approvalRequired: ctx.approvalRequired && isDestructive,
        checkedAt: new Date().toISOString(),
      },
    };
  }
}

export class VectorDispatchActor extends WorkflowActor {
  readonly role: ActorRole = 'VectorDispatch';

  async execute(
    ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const totalChunks = Number(input.totalChunks ?? 0);

    return {
      output: {
        dispatchedChunks: totalChunks,
        backend: 'LocalCpuBackend',
        profileId: ctx.profileId,
        model: 'aef-embed-v1',
        batchSize: 32,
        dispatchedAt: new Date().toISOString(),
      },
    };
  }
}

export class IndexVerifierActor extends WorkflowActor {
  readonly role: ActorRole = 'IndexVerifier';

  async execute(
    ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const expectedChunks = Number(input.expectedChunks ?? 0);
    const indexedChunks = Number(input.indexedChunks ?? expectedChunks);

    const missing = expectedChunks - indexedChunks;
    const verified = missing === 0;

    return {
      output: {
        verified,
        expectedChunks,
        indexedChunks,
        missingChunks: missing,
        tenantId: ctx.tenantId,
        verifiedAt: new Date().toISOString(),
      },
    };
  }
}

export class RetrievalEvaluatorActor extends WorkflowActor {
  readonly role: ActorRole = 'RetrievalEvaluator';

  async execute(
    ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const queryCount = Number(input.queryCount ?? 0);

    return {
      output: {
        queryCount,
        profileId: ctx.profileId,
        tenantId: ctx.tenantId,
        evalStatus: queryCount > 0 ? 'completed' : 'skipped',
        sampleMetrics: {
          ndcg_at_10: queryCount > 0 ? 0.82 : null,
          recall_at_10: queryCount > 0 ? 0.75 : null,
        },
        evaluatedAt: new Date().toISOString(),
      },
    };
  }
}

export class ApprovalGateActor extends WorkflowActor {
  readonly role: ActorRole = 'ApprovalGate';

  async execute(
    _ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const requiresApproval = Boolean(input.requiresApproval ?? false);

    return {
      output: {
        gateResult: requiresApproval ? 'approval_required' : 'pass',
        requiresApproval,
        checkedAt: new Date().toISOString(),
      },
      requiresApproval,
    };
  }
}
