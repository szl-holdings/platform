/**
 * @szl/substrate-client — Streaming / SSE Helper
 *
 * Connects to the substrate-mcp-gateway SSE endpoint and emits typed
 * RunEvent objects. Works in any environment that supports EventSource or
 * the Fetch API (Node 18+, Deno, browsers).
 *
 * @example
 * ```ts
 * import { SubstrateStreaming } from "@szl/substrate-client/streaming";
 *
 * const stream = new SubstrateStreaming({
 *   sseUrl: client.sseUrl(),
 *   apiKey: process.env.SUBSTRATE_GATEWAY_API_KEY,
 *   onEvent: (event) => console.log(event.type, event.data),
 * });
 *
 * await stream.connect();
 * // ... later
 * stream.disconnect();
 * ```
 */

import type { RunEvent, StreamingOptions } from './types.js';

export interface SubstrateStreamingOptions extends StreamingOptions {
  sseUrl: string;
  apiKey?: string;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
}

export class SubstrateStreaming {
  private readonly sseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly onEvent: ((event: RunEvent) => void) | undefined;
  private readonly onError: ((error: Error) => void) | undefined;
  private readonly onClose: (() => void) | undefined;
  private readonly reconnectDelayMs: number;
  private readonly maxReconnectAttempts: number;

  private abortController: AbortController | null = null;
  private reconnectAttempts = 0;
  private closed = false;

  constructor(options: SubstrateStreamingOptions) {
    this.sseUrl = options.sseUrl;
    this.apiKey = options.apiKey;
    this.onEvent = options.onEvent;
    this.onError = options.onError;
    this.onClose = options.onClose;
    this.reconnectDelayMs = options.reconnectDelayMs ?? 3_000;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
  }

  /**
   * Connect to the SSE endpoint and start streaming events.
   * Automatically reconnects on disconnect up to maxReconnectAttempts times.
   */
  async connect(): Promise<void> {
    this.closed = false;
    await this._connect();
  }

  private async _connect(): Promise<void> {
    this.abortController = new AbortController();

    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    let res: Response;
    try {
      res = await fetch(this.sseUrl, {
        headers,
        signal: this.abortController.signal,
      });
    } catch (e) {
      if (this.closed) return;
      const error = e instanceof Error ? e : new Error(String(e));
      this.onError?.(error);
      await this._maybeReconnect();
      return;
    }

    if (!res.ok || !res.body) {
      const error = new Error(`SSE connection failed: HTTP ${res.status}`);
      this.onError?.(error);
      await this._maybeReconnect();
      return;
    }

    this.reconnectAttempts = 0;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let eventType = '';
        let dataLines: string[] = [];

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
          } else if (line === '') {
            if (dataLines.length > 0) {
              const dataStr = dataLines.join('\n');
              let parsed: unknown;
              try {
                parsed = JSON.parse(dataStr);
              } catch {
                parsed = { raw: dataStr };
              }

              const parsedRunId = (parsed as Record<string, unknown>).runId;
              const event: RunEvent = {
                type: (eventType || 'ping') as RunEvent['type'],
                timestamp: Date.now(),
                data: parsed,
                ...(typeof parsedRunId === 'string' ? { runId: parsedRunId } : {}),
              };

              this.onEvent?.(event);
              eventType = '';
              dataLines = [];
            }
          }
        }
      }
    } catch (e) {
      if (this.closed) return;
      const error = e instanceof Error ? e : new Error(String(e));
      this.onError?.(error);
    } finally {
      reader.releaseLock();
    }

    if (!this.closed) {
      await this._maybeReconnect();
    } else {
      this.onClose?.();
    }
  }

  private async _maybeReconnect(): Promise<void> {
    if (this.closed) {
      this.onClose?.();
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onError?.(
        new Error(`SSE connection failed after ${this.maxReconnectAttempts} reconnect attempts`),
      );
      this.onClose?.();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelayMs * Math.min(this.reconnectAttempts, 4);

    await new Promise<void>((resolve) => setTimeout(resolve, delay));
    await this._connect();
  }

  /**
   * Disconnect from the SSE endpoint.
   */
  disconnect(): void {
    this.closed = true;
    this.abortController?.abort();
  }
}

/**
 * Connect to the SSE endpoint and call onEvent for each event.
 * Returns a disconnect function.
 *
 * @example
 * ```ts
 * const disconnect = connectRunEvents(client.sseUrl(), {
 *   apiKey,
 *   onEvent: (e) => console.log(e.type),
 * });
 * // later...
 * disconnect();
 * ```
 */
export function connectRunEvents(
  sseUrl: string,
  options: StreamingOptions & { apiKey?: string },
): () => void {
  const streaming = new SubstrateStreaming({ sseUrl, ...options });
  void streaming.connect();
  return () => streaming.disconnect();
}
