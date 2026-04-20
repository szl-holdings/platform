import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { ApprovalRequest } from "./types.js";

export interface ApprovalStore {
  create(request: ApprovalRequest): void;
  get(approvalId: string): ApprovalRequest | undefined;
  resolve(
    approvalId: string,
    decision: "approved" | "rejected",
    operatorId: string,
    rationale?: string,
  ): ApprovalRequest;
  list(workflowId?: string): ApprovalRequest[];
}

export class InMemoryApprovalStore implements ApprovalStore {
  private readonly store = new Map<string, ApprovalRequest>();

  create(request: ApprovalRequest): void {
    if (this.store.has(request.approvalId)) {
      throw new Error(`Approval request already exists: ${request.approvalId}`);
    }
    this.store.set(request.approvalId, { ...request });
  }

  get(approvalId: string): ApprovalRequest | undefined {
    const rec = this.store.get(approvalId);
    return rec ? { ...rec } : undefined;
  }

  resolve(
    approvalId: string,
    decision: "approved" | "rejected",
    operatorId: string,
    rationale?: string,
  ): ApprovalRequest {
    const existing = this.store.get(approvalId);
    if (!existing) {
      throw new Error(`Approval request not found: ${approvalId}`);
    }
    if (existing.decision !== "pending") {
      throw new Error(
        `Approval ${approvalId} is already resolved: ${existing.decision}`,
      );
    }

    const resolved: ApprovalRequest = {
      ...existing,
      decision,
      operatorId,
      rationale: rationale ?? existing.rationale,
      resolvedAt: new Date().toISOString(),
    };
    this.store.set(approvalId, resolved);
    return { ...resolved };
  }

  list(workflowId?: string): ApprovalRequest[] {
    const all = Array.from(this.store.values());
    if (workflowId) {
      return all
        .filter((r) => r.workflowId === workflowId)
        .map((r) => ({ ...r }));
    }
    return all.map((r) => ({ ...r }));
  }
}

export function createApprovalRequest(
  workflowId: string,
  kind: string,
  context: Record<string, unknown> = {},
): ApprovalRequest {
  return {
    approvalId: `apr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workflowId,
    kind,
    requestedAt: new Date().toISOString(),
    decision: "pending",
    context,
  };
}

export class FileApprovalStore implements ApprovalStore {
  private readonly filePath: string;
  private data: Map<string, ApprovalRequest>;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.data = this.loadFromDisk();
  }

  private loadFromDisk(): Map<string, ApprovalRequest> {
    try {
      if (!existsSync(this.filePath)) return new Map();
      const raw = readFileSync(this.filePath, "utf8");
      const entries = JSON.parse(raw) as Array<[string, ApprovalRequest]>;
      return new Map(entries);
    } catch {
      return new Map();
    }
  }

  private flush(): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true });
      writeFileSync(
        this.filePath,
        JSON.stringify(Array.from(this.data.entries()), null, 2),
        "utf8",
      );
    } catch {
      // best-effort flush
    }
  }

  create(request: ApprovalRequest): void {
    if (this.data.has(request.approvalId)) {
      throw new Error(`Approval request already exists: ${request.approvalId}`);
    }
    this.data.set(request.approvalId, { ...request });
    this.flush();
  }

  get(approvalId: string): ApprovalRequest | undefined {
    const rec = this.data.get(approvalId);
    return rec ? { ...rec } : undefined;
  }

  resolve(
    approvalId: string,
    decision: "approved" | "rejected",
    operatorId: string,
    rationale?: string,
  ): ApprovalRequest {
    const existing = this.data.get(approvalId);
    if (!existing) {
      throw new Error(`Approval request not found: ${approvalId}`);
    }
    if (existing.decision !== "pending") {
      throw new Error(`Approval ${approvalId} is already resolved: ${existing.decision}`);
    }
    const resolved: ApprovalRequest = {
      ...existing,
      decision,
      operatorId,
      ...(rationale !== undefined ? { rationale } : {}),
      resolvedAt: new Date().toISOString(),
    };
    this.data.set(approvalId, resolved);
    this.flush();
    return { ...resolved };
  }

  list(workflowId?: string): ApprovalRequest[] {
    const all = Array.from(this.data.values());
    if (workflowId) {
      return all.filter((r) => r.workflowId === workflowId).map((r) => ({ ...r }));
    }
    return all.map((r) => ({ ...r }));
  }
}

export const defaultApprovalStore: ApprovalStore = new InMemoryApprovalStore();
