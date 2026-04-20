import type { ActorRole, WorkflowContext, WorkflowStepResult } from "./types.js";

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
  readonly role: ActorRole = "IngestionPlanner";

  async execute(
    ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const sourceId = String(input["sourceId"] ?? "unknown");
    const contentLength = String(input["content"] ?? "").length;

    const estimatedChunks = Math.max(1, Math.ceil(contentLength / 512));

    return {
      output: {
        plan: "sequential-ingest",
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
  readonly role: ActorRole = "SourceNormalizer";

  async execute(
    _ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const content = String(input["content"] ?? "");
    const normalized = content
      .replace(/\r\n/g, "\n")
      .replace(/\t/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .trim();

    return {
      output: {
        normalizedLength: normalized.length,
        contentType: String(input["contentType"] ?? "text/plain"),
        normalizedAt: new Date().toISOString(),
      },
    };
  }
}

export class ChunkPlannerActor extends WorkflowActor {
  readonly role: ActorRole = "ChunkPlanner";

  async execute(
    _ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const content = String(input["content"] ?? "");
    const chunkSize = Number(input["chunkSize"] ?? 512);
    const chunkOverlap = Number(input["chunkOverlap"] ?? 64);

    const words = content.split(/\s+/).filter((w) => w.length > 0);
    const chunks: Array<{ chunkIndex: number; wordStart: number; wordEnd: number }> = [];
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      chunks.push({ chunkIndex: chunks.length, wordStart: start, wordEnd: end });
      if (end >= words.length) break;
      start = end - chunkOverlap;
      if (start <= (chunks[chunks.length - 1]?.wordStart ?? 0)) {
        start = end;
      }
    }

    return {
      output: {
        chunkPlan: chunks,
        totalChunks: chunks.length,
        chunkSizeWords: chunkSize,
        chunkOverlapWords: chunkOverlap,
      },
    };
  }
}

export class PolicyGuardActor extends WorkflowActor {
  readonly role: ActorRole = "PolicyGuard";

  async execute(
    ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const operation = String(input["operation"] ?? "ingest");
    const tenantId = ctx.tenantId;

    const isDestructive = ["rebuild_index", "rotate_profile_version"].includes(operation);

    return {
      output: {
        tenantId,
        operation,
        policyDecision: "allow",
        isDestructive,
        approvalRequired: ctx.approvalRequired && isDestructive,
        checkedAt: new Date().toISOString(),
      },
    };
  }
}

export class VectorDispatchActor extends WorkflowActor {
  readonly role: ActorRole = "VectorDispatch";

  async execute(
    ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const totalChunks = Number(input["totalChunks"] ?? 0);

    return {
      output: {
        dispatchedChunks: totalChunks,
        backend: "LocalCpuBackend",
        profileId: ctx.profileId,
        model: "aef-embed-v1",
        batchSize: 32,
        dispatchedAt: new Date().toISOString(),
      },
    };
  }
}

export class IndexVerifierActor extends WorkflowActor {
  readonly role: ActorRole = "IndexVerifier";

  async execute(
    ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const expectedChunks = Number(input["expectedChunks"] ?? 0);
    const indexedChunks = Number(input["indexedChunks"] ?? expectedChunks);

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
  readonly role: ActorRole = "RetrievalEvaluator";

  async execute(
    ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const queryCount = Number(input["queryCount"] ?? 0);

    return {
      output: {
        queryCount,
        profileId: ctx.profileId,
        tenantId: ctx.tenantId,
        evalStatus: queryCount > 0 ? "completed" : "skipped",
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
  readonly role: ActorRole = "ApprovalGate";

  async execute(
    _ctx: WorkflowContext,
    input: Record<string, unknown>,
  ): Promise<ActorExecutionResult> {
    const requiresApproval = Boolean(input["requiresApproval"] ?? false);

    return {
      output: {
        gateResult: requiresApproval ? "approval_required" : "pass",
        requiresApproval,
        checkedAt: new Date().toISOString(),
      },
      requiresApproval,
    };
  }
}
