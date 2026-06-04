/**
 * CRDT Live Collaboration Layer
 *
 * Wraps the CrdtDoc engine with presence tracking, cursor sharing,
 * and broadcast-channel-based real-time multiplayer sync for
 * operational surfaces (runbooks, threat assessments, deal memos).
 */

import { CrdtDoc, getOrCreateDoc } from './engine.js';
import type { CrdtDelta } from './types.js';

export type PresenceColor =
  | '#60a5fa'  // blue
  | '#a78bfa'  // purple
  | '#4ade80'  // green
  | '#f59e0b'  // amber
  | '#f472b6'  // pink
  | '#38bdf8'; // sky

const PRESENCE_COLORS: PresenceColor[] = [
  '#60a5fa', '#a78bfa', '#4ade80', '#f59e0b', '#f472b6', '#38bdf8',
];

export interface Presence {
  actorId: string;
  displayName: string;
  color: PresenceColor;
  cursor?: { fieldKey: string; position?: number };
  lastSeen: number;
  avatarInitials: string;
}

export interface CollaborationSession {
  entityType: string;
  entityId: string;
  actorId: string;
  displayName: string;
}

export type CollaborationEventType =
  | 'delta'
  | 'presence'
  | 'cursor'
  | 'heartbeat';

export interface CollaborationMessage {
  type: CollaborationEventType;
  session: Pick<CollaborationSession, 'entityType' | 'entityId'>;
  actorId: string;
  payload: unknown;
  timestamp: number;
}

const STALE_PRESENCE_MS = 10_000;
const HEARTBEAT_INTERVAL_MS = 3_000;

function pickColor(actorId: string): PresenceColor {
  let hash = 0;
  for (let i = 0; i < actorId.length; i++) {
    hash = (hash * 31 + actorId.charCodeAt(i)) & 0x7fffffff;
  }
  return PRESENCE_COLORS[hash % PRESENCE_COLORS.length]!;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

/**
 * CollaborationRoom manages a live multiplayer editing session for a
 * single CRDT document (e.g. one runbook, one threat assessment).
 *
 * Sync is done over BroadcastChannel for same-origin tabs; in a real
 * deployment this would be backed by a WebSocket relay.
 */
export class CollaborationRoom {
  private doc: CrdtDoc;
  private session: CollaborationSession;
  private channel: BroadcastChannel | null = null;
  private presence: Map<string, Presence> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private onPresenceChange: (presences: Presence[]) => void = () => {};
  private onRemoteDelta: (delta: CrdtDelta) => void = () => {};
  private unsub: (() => void) | null = null;

  constructor(session: CollaborationSession) {
    this.session = session;
    this.doc = getOrCreateDoc(session.entityType, session.entityId);
    this.presence.set(session.actorId, {
      actorId: session.actorId,
      displayName: session.displayName,
      color: pickColor(session.actorId),
      lastSeen: Date.now(),
      avatarInitials: initials(session.displayName),
    });
  }

  join(opts: {
    onPresenceChange: (p: Presence[]) => void;
    onRemoteDelta: (delta: CrdtDelta) => void;
  }): void {
    this.onPresenceChange = opts.onPresenceChange;
    this.onRemoteDelta = opts.onRemoteDelta;

    const channelName = `crdt:${this.session.entityType}:${this.session.entityId}`;

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(channelName);
      this.channel.onmessage = (ev: MessageEvent) => {
        this.handleIncoming(ev.data as CollaborationMessage);
      };
    }

    this.unsub = this.doc.onUpdate((delta) => {
      if (delta.actorId === this.session.actorId) {
        const msg: CollaborationMessage = {
          type: 'delta',
          session: { entityType: this.session.entityType, entityId: this.session.entityId },
          actorId: this.session.actorId,
          payload: delta,
          timestamp: Date.now(),
        };
        this.broadcast(msg);
      }
    });

    this.heartbeatTimer = setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        session: { entityType: this.session.entityType, entityId: this.session.entityId },
        actorId: this.session.actorId,
        payload: {
          displayName: this.session.displayName,
          color: pickColor(this.session.actorId),
          avatarInitials: initials(this.session.displayName),
        },
        timestamp: Date.now(),
      });
      this.pruneStalePresence();
    }, HEARTBEAT_INTERVAL_MS);

    this.broadcast({
      type: 'presence',
      session: { entityType: this.session.entityType, entityId: this.session.entityId },
      actorId: this.session.actorId,
      payload: {
        displayName: this.session.displayName,
        color: pickColor(this.session.actorId),
        avatarInitials: initials(this.session.displayName),
      },
      timestamp: Date.now(),
    });
  }

  updateCursor(fieldKey: string, position?: number): void {
    const existing = this.presence.get(this.session.actorId);
    if (existing) {
      existing.cursor = { fieldKey, position };
      this.presence.set(this.session.actorId, existing);
    }
    this.broadcast({
      type: 'cursor',
      session: { entityType: this.session.entityType, entityId: this.session.entityId },
      actorId: this.session.actorId,
      payload: { fieldKey, position },
      timestamp: Date.now(),
    });
  }

  setField(fieldKey: string, value: unknown): CrdtDelta {
    return this.doc.setField(this.session.actorId, fieldKey, value);
  }

  getDoc(): CrdtDoc {
    return this.doc;
  }

  getPresences(): Presence[] {
    return Array.from(this.presence.values()).sort((a, b) =>
      a.actorId === this.session.actorId ? -1 : b.actorId === this.session.actorId ? 1 : 0,
    );
  }

  leave(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.unsub?.();
    this.channel?.close();
    this.channel = null;
  }

  private broadcast(msg: CollaborationMessage): void {
    try {
      this.channel?.postMessage(msg);
    } catch {}
  }

  private handleIncoming(msg: CollaborationMessage): void {
    if (msg.actorId === this.session.actorId) return;
    if (
      msg.session.entityType !== this.session.entityType ||
      msg.session.entityId !== this.session.entityId
    ) return;

    if (msg.type === 'delta') {
      const delta = msg.payload as CrdtDelta;
      const result = this.doc.applyDelta(delta, true);
      if (result.merged) {
        this.onRemoteDelta(delta);
      }
    }

    if (msg.type === 'presence' || msg.type === 'heartbeat') {
      const p = msg.payload as { displayName: string; color: PresenceColor; avatarInitials: string };
      this.presence.set(msg.actorId, {
        actorId: msg.actorId,
        displayName: p.displayName,
        color: p.color ?? pickColor(msg.actorId),
        lastSeen: msg.timestamp,
        avatarInitials: p.avatarInitials ?? initials(p.displayName),
      });
      this.onPresenceChange(this.getPresences());
    }

    if (msg.type === 'cursor') {
      const existing = this.presence.get(msg.actorId);
      if (existing) {
        const c = msg.payload as { fieldKey: string; position?: number };
        existing.cursor = { fieldKey: c.fieldKey, position: c.position };
        existing.lastSeen = msg.timestamp;
        this.presence.set(msg.actorId, existing);
        this.onPresenceChange(this.getPresences());
      }
    }
  }

  private pruneStalePresence(): void {
    const now = Date.now();
    for (const [actorId, p] of this.presence.entries()) {
      if (actorId !== this.session.actorId && now - p.lastSeen > STALE_PRESENCE_MS) {
        this.presence.delete(actorId);
      }
    }
    this.onPresenceChange(this.getPresences());
  }
}

/**
 * Factory helper — creates or rejoins a collaboration room for an entity.
 */
const rooms = new Map<string, CollaborationRoom>();

export function getCollaborationRoom(session: CollaborationSession): CollaborationRoom {
  const key = `${session.entityType}:${session.entityId}`;
  let room = rooms.get(key);
  if (!room) {
    room = new CollaborationRoom(session);
    rooms.set(key, room);
  }
  return room;
}

export function leaveCollaborationRoom(entityType: string, entityId: string): void {
  const key = `${entityType}:${entityId}`;
  const room = rooms.get(key);
  if (room) {
    room.leave();
    rooms.delete(key);
  }
}
