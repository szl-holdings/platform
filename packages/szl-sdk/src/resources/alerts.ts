import type { ReceiptedStream } from '@szl-holdings/szl-receipts';
import type { HttpClient } from '../http.js';
import type { PaginationOptions, PaginatedResponse } from '../types.js';

export interface Alert {
  id: string | number;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
}

export interface AlertEvent {
  id: string | number;
  type: 'created' | 'updated' | 'resolved';
  alert: Alert;
}

export interface AlertSubscribeOptions {
  severity?: string;
  signal?: AbortSignal;
  streamId?: string;
}

export class AlertsResource {
  constructor(private readonly http: HttpClient) {}

  async list(options: PaginationOptions & { status?: string } = {}): Promise<PaginatedResponse<Alert>> {
    return this.http.get<PaginatedResponse<Alert>>('/v1/alerts', options);
  }

  /**
   * Subscribe to a live stream of alert events over Server-Sent Events.
   * Each event is recorded as a `LambdaReceipt` (paramsHash = sha256 of
   * the event's raw bytes); the returned `closure` promise resolves with
   * a `StreamClosureReceipt` once the iterator is drained or aborted.
   */
  subscribe(options: AlertSubscribeOptions = {}): ReceiptedStream<AlertEvent> {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (options.severity !== undefined) query.severity = options.severity;
    return this.http.stream<AlertEvent>('GET', '/v1/alerts/subscribe', {
      query,
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.streamId ? { streamId: options.streamId } : {}),
    });
  }
}
