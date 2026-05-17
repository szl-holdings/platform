/**
 * MultiplexingTransport — share one PRAXISMcpServer across many sessions.
 *
 * The MCP SDK's `Server` (Protocol) keeps a one-shot `_transport` reference and
 * may only have `connect()` invoked once per instance. That forced the
 * substrate gateway into a "fresh PRAXISMcpServer + transport pair per
 * Streamable HTTP session" pattern: every initialize paid for re-registering
 * ~26 tools, ~N resources, and ~N prompts on a brand-new SDK `McpServer`.
 *
 * MultiplexingTransport eliminates that cost. A single PRAXISMcpServer
 * connects once to a long-lived multiplexer. Each Streamable HTTP session's
 * `StreamableHTTPServerTransport` is registered as a sub-transport via
 * `addSession(sub)`. Inbound messages are forwarded onto the shared Server
 * with the session id exposed both via `extra.sessionId` and via a
 * dynamic `transport.sessionId` getter backed by AsyncLocalStorage (the
 * SDK Server reads `capturedTransport.sessionId` synchronously inside
 * `_onrequest`). Outbound sends are routed back to the originating session
 * based on response id, `relatedRequestId`, the ALS-active session, or, as a
 * last resort for un-targeted notifications, broadcast.
 *
 * Tracked: szl-holdings/platform#113, task #5068.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type {
  Transport,
  TransportSendOptions,
} from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

type SessionTransport = Transport & { sessionId?: string };

interface RpcEnvelope {
  id?: string | number;
  method?: string;
}

export class MultiplexingTransport implements Transport {
  private readonly _sessions = new Map<string, SessionTransport>();
  /**
   * Per-session map of inbound request id → owning session id. Keyed by the
   * composite `${sid}::${id}` because JSON-RPC request ids are only required
   * to be unique within a single connection, not globally. Two concurrent
   * sessions can legally use the same id (e.g. `1`), so a flat
   * `Map<id, sid>` would let the second request overwrite the first and
   * misroute responses.
   *
   * In practice this map is only consulted as a fallback for `relatedRequestId`
   * correlation — outbound response routing relies on the ALS-active session
   * instead (AsyncLocalStorage propagates across awaits, so the response is
   * sent inside the same session context that handled the inbound request).
   */
  private readonly _requestOwners = new Map<string, string>();
  private readonly _als = new AsyncLocalStorage<string>();

  private static reqKey(sid: string, id: string | number): string {
    return `${sid}::${id}`;
  }

  onmessage?: (message: JSONRPCMessage, extra?: unknown) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;

  /**
   * Exposed as a getter so the SDK Server's synchronous
   * `capturedTransport?.sessionId` read inside `_onrequest` returns the
   * currently-dispatching session rather than a single static id.
   */
  get sessionId(): string | undefined {
    return this._als.getStore();
  }

  async start(): Promise<void> {
    /* no-op: per-session sub-transports are started by the gateway */
  }

  async close(): Promise<void> {
    const subs = [...this._sessions.values()];
    this._sessions.clear();
    this._requestOwners.clear();
    for (const sub of subs) {
      try {
        await sub.close();
      } catch {
        /* best effort */
      }
    }
    this.onclose?.();
  }

  /** Number of live sessions currently attached. */
  get sessionCount(): number {
    return this._sessions.size;
  }

  /** List currently attached session ids (insertion order). */
  listSessions(): string[] {
    return [...this._sessions.keys()];
  }

  /** Look up a session sub-transport by id. */
  getSession(sessionId: string): SessionTransport | undefined {
    return this._sessions.get(sessionId);
  }

  /** Run a callback with the given session bound as the ALS-active session. */
  runWithSession<T>(sessionId: string, fn: () => T): T {
    return this._als.run(sessionId, fn);
  }

  /**
   * Register a per-session sub-transport. Returns a disposer that removes
   * the session and its outstanding request→session mappings.
   *
   * `sub.sessionId` may be undefined at the time of attachment — the
   * Streamable HTTP transport assigns its session id lazily when the first
   * `initialize` request arrives (just before firing `onmessage`). The
   * sub-transport is therefore registered in `_sessions` lazily on the
   * first dispatched message.
   */
  addSession(sub: SessionTransport): () => void {
    let resolvedSid: string | undefined = sub.sessionId;
    if (resolvedSid) {
      this._sessions.set(resolvedSid, sub);
    }

    const userOnMessage = sub.onmessage;
    sub.onmessage = (message, extra) => {
      userOnMessage?.(message, extra);
      // Re-read the sessionId on each message — Streamable HTTP transports
      // assign it synchronously inside handleRequest right before this
      // hook fires for the initialize message.
      const sid = sub.sessionId ?? resolvedSid;
      if (!sid) {
        this.onerror?.(
          new Error('MultiplexingTransport: sub-transport fired onmessage with no sessionId'),
        );
        return;
      }
      if (sid !== resolvedSid) {
        resolvedSid = sid;
        this._sessions.set(sid, sub);
      }
      const env = message as RpcEnvelope;
      // Track inbound client requests under a session-scoped composite key.
      // Used only as a fallback for `relatedRequestId` correlation when the
      // ALS-active session is unavailable; the request id alone is not
      // unique across concurrent sessions.
      if (env.id !== undefined && typeof env.method === 'string') {
        this._requestOwners.set(MultiplexingTransport.reqKey(sid, env.id), sid);
      }
      const dispatchExtra = { ...((extra as Record<string, unknown>) ?? {}), sessionId: sid };
      this._als.run(sid, () => {
        this.onmessage?.(message, dispatchExtra);
      });
    };

    const userOnClose = sub.onclose;
    sub.onclose = () => {
      userOnClose?.();
      if (resolvedSid) this.removeSession(resolvedSid);
    };

    const userOnError = sub.onerror;
    sub.onerror = (err) => {
      userOnError?.(err);
      this.onerror?.(err);
    };

    return () => {
      if (resolvedSid) this.removeSession(resolvedSid);
    };
  }

  private removeSession(sid: string): void {
    if (!this._sessions.delete(sid)) return;
    const prefix = `${sid}::`;
    for (const key of this._requestOwners.keys()) {
      if (key.startsWith(prefix)) this._requestOwners.delete(key);
    }
  }

  /**
   * Routing rules (precedence high → low):
   *   1. Explicit `options.sessionId` hint.
   *   2. ALS-active session — AsyncLocalStorage propagates across awaits,
   *      so the response to an inbound request is sent inside the same
   *      session context that handled it. This is the *primary* mechanism
   *      for response routing and for server-initiated calls (sampling,
   *      notifications) issued from within a tool handler. It is correct
   *      under concurrent sessions even when JSON-RPC request ids collide
   *      across sessions (ids are only required to be unique per
   *      connection, not globally).
   *   3. `relatedRequestId` correlation, scoped to the ALS-active session
   *      so colliding ids across sessions cannot misroute.
   *   4. Notifications without any binding: broadcast to all sessions.
   *   5. Server-initiated requests without any binding: throw.
   */
  async send(
    message: JSONRPCMessage,
    options?: TransportSendOptions & { sessionId?: string },
  ): Promise<void> {
    const env = message as RpcEnvelope;
    const isResponse = env.id !== undefined && env.method === undefined;
    const isRequest = env.id !== undefined && env.method !== undefined;
    const isNotification = env.method !== undefined && env.id === undefined;

    let targetSid: string | undefined = options?.sessionId;

    if (!targetSid) {
      targetSid = this._als.getStore();
    }

    if (!targetSid && options?.relatedRequestId !== undefined) {
      // Look across all live sessions for a session that owns this related
      // request id. Composite keying ensures we never collapse colliding ids
      // from different sessions onto a single owner.
      for (const sid of this._sessions.keys()) {
        if (
          this._requestOwners.has(MultiplexingTransport.reqKey(sid, options.relatedRequestId))
        ) {
          targetSid = sid;
          break;
        }
      }
    }

    // Clear the owner entry when a response goes out (best-effort cleanup).
    if (isResponse && targetSid && env.id !== undefined) {
      this._requestOwners.delete(MultiplexingTransport.reqKey(targetSid, env.id));
    }

    if (targetSid) {
      const sub = this._sessions.get(targetSid);
      if (!sub) return; // session disappeared mid-flight; drop silently.
      await sub.send(message, options);
      return;
    }

    if (isNotification) {
      const errs: unknown[] = [];
      for (const sub of this._sessions.values()) {
        try {
          await sub.send(message, options);
        } catch (e) {
          errs.push(e);
        }
      }
      if (errs.length > 0) {
        this.onerror?.(
          new Error(
            `MultiplexingTransport.send: ${errs.length} session(s) failed during broadcast`,
          ),
        );
      }
      return;
    }

    if (isRequest) {
      throw new Error(
        'MultiplexingTransport.send: cannot route server-initiated request — no active session in scope. Pass options.sessionId or call within a session context.',
      );
    }

    // Unknown shape: best-effort broadcast.
    for (const sub of this._sessions.values()) {
      try {
        await sub.send(message, options);
      } catch {
        /* swallow */
      }
    }
  }
}
