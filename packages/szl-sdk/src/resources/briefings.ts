import type { ReceiptedStream } from '@szl-holdings/szl-receipts';
import type { HttpClient } from '../http.js';
import type { PaginationOptions, PaginatedResponse } from '../types.js';

export interface Briefing {
  id: string | number;
  title: string;
  summary: string;
  createdAt: string;
}

export interface BriefingChunk {
  id: string | number;
  delta: string;
  done?: boolean;
}

export interface BriefingStreamOptions {
  since?: string;
  signal?: AbortSignal;
  streamId?: string;
}

export class BriefingsResource {
  constructor(private readonly http: HttpClient) {}

  async list(options: PaginationOptions = {}): Promise<PaginatedResponse<Briefing>> {
    return this.http.get<PaginatedResponse<Briefing>>('/v1/briefings', {
      limit: options.limit,
      offset: options.offset,
      page: options.page,
    });
  }

  async get(id: string | number): Promise<Briefing> {
    return this.http.get<Briefing>(`/v1/briefings/${id}`);
  }

  /**
   * Stream a briefing as it is generated. Each chunk is recorded as its own
   * `LambdaReceipt` (paramsHash = sha256 of the chunk's raw bytes); the
   * `closure` promise resolves with a folded `StreamClosureReceipt`.
   */
  stream(options: BriefingStreamOptions = {}): ReceiptedStream<BriefingChunk> {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (options.since !== undefined) query.since = options.since;
    return this.http.stream<BriefingChunk>('GET', '/v1/briefings/stream', {
      query,
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.streamId ? { streamId: options.streamId } : {}),
    });
  }
}
