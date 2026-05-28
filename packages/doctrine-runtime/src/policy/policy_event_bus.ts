/**
 * policy_event_bus.ts — NATS hot-reload event bus (R3)
 * Subscribes to NATS subjects for live policy updates and triggers
 * in-process policy reloads without service restart.
 *
 * References
 * ----------
 * [1] NATS.io documentation: https://docs.nats.io/nats-concepts/core-nats
 * [2] Doctrine v6 §8.3 "Hot-Reload Bus Contract"
 * [3] Kleppmann, "Designing Data-Intensive Applications," ch.11 (2017)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PolicyUpdateEvent {
  type: "upsert" | "delete" | "reload_all";
  policyId: string;
  /** Serialised Doctrine v6 policy JSON (absent for delete/reload_all) */
  policyJson?: string;
  /** Originating node ID for loop detection */
  originNodeId: string;
  /** Unix ms timestamp */
  ts: number;
  /** Doctrine v6 version asserted by sender */
  doctrineVersion: 6;
}

export interface BusConfig {
  /** NATS server URL, e.g. "nats://localhost:4222" */
  natsUrl: string;
  /** Subject prefix — publishes/subscribes on `{prefix}.policy.>` */
  subjectPrefix: string;
  /** This node's identifier (used for loop detection) */
  nodeId: string;
  /** Reconnect interval ms [1] */
  reconnectIntervalMs: number;
  /** Max reconnect attempts (0 = infinite) */
  maxReconnectAttempts: number;
}

export type PolicyUpdateHandler = (event: PolicyUpdateEvent) => Promise<void>;

// ─────────────────────────────────────────────────────────────────────────────
// Minimal NATS connection abstraction
// (Real production code imports from "nats" npm package; this module provides
//  the interface + a fully functional in-process stub for testing [2])
// ─────────────────────────────────────────────────────────────────────────────

export interface NatsConnection {
  publish(subject: string, data: Uint8Array): void;
  subscribe(subject: string, handler: (data: Uint8Array, subject: string) => void): () => void;
  drain(): Promise<void>;
  isClosed(): boolean;
}

/** In-process stub that satisfies NatsConnection without a running NATS server */
export class InProcessNatsStub implements NatsConnection {
  private subs = new Map<string, Set<(data: Uint8Array, subject: string) => void>>();
  private closed = false;

  publish(subject: string, data: Uint8Array): void {
    if (this.closed) throw new Error("Connection is closed");
    // Match wildcards: ">" matches everything, "*" matches one token
    for (const [pattern, handlers] of this.subs) {
      if (matchNatsSubject(pattern, subject)) {
        for (const h of handlers) {
          // Async delivery (microtask) to mimic real NATS behaviour
          Promise.resolve().then(() => h(data, subject));
        }
      }
    }
  }

  subscribe(subject: string, handler: (data: Uint8Array, subject: string) => void): () => void {
    if (!this.subs.has(subject)) this.subs.set(subject, new Set());
    this.subs.get(subject)!.add(handler);
    return () => this.subs.get(subject)?.delete(handler);
  }

  async drain(): Promise<void> {
    this.closed = true;
  }

  isClosed(): boolean { return this.closed; }
}

/** NATS subject wildcard matching (NATS Core [1]) */
function matchNatsSubject(pattern: string, subject: string): boolean {
  const pTokens = pattern.split(".");
  const sTokens = subject.split(".");
  for (let i = 0; i < pTokens.length; i++) {
    if (pTokens[i] === ">") return true;
    if (i >= sTokens.length) return false;
    if (pTokens[i] !== "*" && pTokens[i] !== sTokens[i]) return false;
  }
  return pTokens.length === sTokens.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// PolicyEventBus
// ─────────────────────────────────────────────────────────────────────────────

export class PolicyEventBus {
  private handlers: PolicyUpdateHandler[] = [];
  private unsub: (() => void) | null = null;
  private _connected = false;

  constructor(
    private readonly cfg: BusConfig,
    private readonly nc: NatsConnection
  ) {}

  /** Register a handler called on every valid policy update event */
  onUpdate(handler: PolicyUpdateHandler): void {
    this.handlers.push(handler);
  }

  /** Begin listening for policy events on NATS */
  async start(): Promise<void> {
    if (this._connected) return;

    const subject = `${this.cfg.subjectPrefix}.policy.>`;
    this.unsub = this.nc.subscribe(subject, (data, subj) => {
      void this._handleRaw(data, subj);
    });
    this._connected = true;
  }

  /** Publish a policy update to all subscribers (Doctrine v6 §8.3 [2]) */
  async publish(event: Omit<PolicyUpdateEvent, "originNodeId" | "ts" | "doctrineVersion">): Promise<void> {
    const full: PolicyUpdateEvent = {
      ...event,
      originNodeId: this.cfg.nodeId,
      ts: Date.now(),
      doctrineVersion: 6,
    };
    const subject = `${this.cfg.subjectPrefix}.policy.${event.type}`;
    const data = Buffer.from(JSON.stringify(full), "utf8");
    this.nc.publish(subject, data);
  }

  private async _handleRaw(data: Uint8Array, subject: string): Promise<void> {
    let event: PolicyUpdateEvent;
    try {
      event = JSON.parse(Buffer.from(data).toString("utf8")) as PolicyUpdateEvent;
    } catch (e) {
      console.error(`[PolicyEventBus] JSON parse error on ${subject}:`, e);
      return;
    }

    // Validate minimum fields
    if (event.doctrineVersion !== 6) {
      console.warn(`[PolicyEventBus] Dropping event with doctrineVersion=${event.doctrineVersion}`);
      return;
    }

    // Loop detection: drop events we ourselves published
    if (event.originNodeId === this.cfg.nodeId) return;

    for (const h of this.handlers) {
      try {
        await h(event);
      } catch (e) {
        console.error("[PolicyEventBus] Handler error:", e);
      }
    }
  }

  async stop(): Promise<void> {
    this.unsub?.();
    this.unsub = null;
    this._connected = false;
    await this.nc.drain();
  }

  get connected(): boolean { return this._connected; }
}
