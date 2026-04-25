import type { BusinessSignal } from '../schema';
import type { SignalSeverity, SignalStatus, Vertical } from '../core/types';
import { SEED_SIGNALS } from '../demo/seedSignals';

export interface SignalFilter {
  vertical?: Vertical;
  severity?: SignalSeverity;
  status?: SignalStatus;
  limit?: number;
  offset?: number;
}

export interface SignalMeshInterface {
  ingest(signal: BusinessSignal): Promise<BusinessSignal>;
  get(id: string): Promise<BusinessSignal | undefined>;
  list(filter?: SignalFilter): Promise<{ signals: BusinessSignal[]; total: number }>;
  summary(): Promise<{ total: number; bySeverity: Record<string, number>; byVertical: Record<string, number> }>;
}

class InMemorySignalMesh implements SignalMeshInterface {
  private store: Map<string, BusinessSignal> = new Map();

  constructor(seed: BusinessSignal[]) {
    for (const s of seed) {
      this.store.set(s.id, s);
    }
  }

  async ingest(signal: BusinessSignal): Promise<BusinessSignal> {
    const ts = new Date().toISOString();
    const enriched = { ...signal, updatedAt: ts };
    this.store.set(enriched.id, enriched);
    return enriched;
  }

  async get(id: string): Promise<BusinessSignal | undefined> {
    return this.store.get(id);
  }

  async list(filter?: SignalFilter): Promise<{ signals: BusinessSignal[]; total: number }> {
    let results = Array.from(this.store.values());

    if (filter?.vertical) results = results.filter((s) => s.vertical === filter.vertical);
    if (filter?.severity) results = results.filter((s) => s.severity === filter.severity);
    if (filter?.status)   results = results.filter((s) => s.status === filter.status);

    results.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));

    const total = results.length;
    const offset = filter?.offset ?? 0;
    const limit  = filter?.limit  ?? 50;
    return { signals: results.slice(offset, offset + limit), total };
  }

  async summary() {
    const all = Array.from(this.store.values());
    const bySeverity: Record<string, number> = {};
    const byVertical: Record<string, number> = {};
    for (const s of all) {
      bySeverity[s.severity] = (bySeverity[s.severity] ?? 0) + 1;
      byVertical[s.vertical] = (byVertical[s.vertical] ?? 0) + 1;
    }
    return { total: all.length, bySeverity, byVertical };
  }
}

export const signalMesh: SignalMeshInterface = new InMemorySignalMesh(SEED_SIGNALS);
