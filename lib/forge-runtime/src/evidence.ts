import type { PrismDomain, EvidenceContext } from "@szl-holdings/prism-bus";

export type EvidenceType = EvidenceContext["type"];

export interface ForgeEvidenceCapture {
  executionId: string;
  domain: PrismDomain;
  type: EvidenceType;
  description?: string;
  data?: unknown;
  storagePath?: string | null;
  capturedAt?: number;
  metadata?: Record<string, unknown>;
}

const MAX_EVIDENCE_STORE = 500;

export class ForgeEvidenceStore {
  private entries: EvidenceContext[] = [];

  capture(capture: ForgeEvidenceCapture): EvidenceContext {
    const evidence: EvidenceContext = {
      evidenceId: `forg-ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      executionId: capture.executionId,
      domain: capture.domain,
      type: capture.type,
      capturedAt: capture.capturedAt ?? Date.now(),
      storagePath: capture.storagePath ?? null,
      description: capture.description,
      metadata: {
        ...capture.metadata,
        ...(capture.data ? { data: capture.data } : {}),
      },
    };

    if (evidence.metadata && Object.keys(evidence.metadata).length > 0) {
      const rawData = JSON.stringify(evidence.metadata);
      evidence.hash = this.simpleHash(rawData);
    }

    this.entries.unshift(evidence);
    if (this.entries.length > MAX_EVIDENCE_STORE) {
      this.entries.length = MAX_EVIDENCE_STORE;
    }

    return evidence;
  }

  getForExecution(executionId: string): EvidenceContext[] {
    return this.entries.filter(e => e.executionId === executionId);
  }

  getAll(options: { limit?: number; domain?: PrismDomain; type?: EvidenceType } = {}): EvidenceContext[] {
    let results = this.entries;
    if (options.domain) results = results.filter(e => e.domain === options.domain);
    if (options.type) results = results.filter(e => e.type === options.type);
    return results.slice(0, options.limit ?? 100);
  }

  private simpleHash(input: string): string {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 33) ^ input.charCodeAt(i);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
}

export const forgeEvidenceStore = new ForgeEvidenceStore();
