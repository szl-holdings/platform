import type {
  AnomalyDetectionResult,
  AnomalyDetectionService,
  AnomalyStore,
  BatchDetectionInput,
  StreamingDetectionInput,
} from './types.js';
import { detectStreaming } from './streaming.js';
import { detectBatch } from './batch.js';

export class AnomalyDetectionServiceImpl implements AnomalyDetectionService {
  private readonly store?: AnomalyStore;

  constructor(opts?: { store?: AnomalyStore }) {
    this.store = opts?.store;
  }

  async detectStreaming(input: StreamingDetectionInput): Promise<AnomalyDetectionResult> {
    const result = await detectStreaming(input);
    if (this.store) {
      await Promise.all(result.anomalies.map((a) => this.store!.persist(a)));
    }
    return result;
  }

  async detectBatch(input: BatchDetectionInput): Promise<AnomalyDetectionResult> {
    const result = await detectBatch(input);
    if (this.store) {
      await Promise.all(result.anomalies.map((a) => this.store!.persist(a)));
    }
    return result;
  }
}

export class InMemoryAnomalyStore implements AnomalyStore {
  private readonly events: Parameters<AnomalyStore['persist']>[0][] = [];

  async persist(anomaly: Parameters<AnomalyStore['persist']>[0]): Promise<void> {
    this.events.push(anomaly);
  }

  async query(filter: Parameters<AnomalyStore['query']>[0]): Promise<Parameters<AnomalyStore['persist']>[0][]> {
    let results = [...this.events];
    if (filter.lane) results = results.filter((e) => e.lane === filter.lane);
    if (filter.severity) results = results.filter((e) => e.severity === filter.severity);
    if (filter.since) results = results.filter((e) => e.detectedAt >= filter.since!);
    if (filter.entityId) results = results.filter((e) => e.entityId === filter.entityId);
    if (filter.limit) results = results.slice(-filter.limit);
    return results;
  }
}

export const globalAnomalyStore = new InMemoryAnomalyStore();

export const globalAnomalyService = new AnomalyDetectionServiceImpl({
  store: globalAnomalyStore,
});
