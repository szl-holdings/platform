/**
 * OMNIA Conversation Persistence — Memory Fabric Helpers
 *
 * Extracted from routes/openai/conversations.ts so these helpers can be
 * unit-tested against the real module code without standing up Express.
 *
 * persistSessionToFabric — idempotent write-through to defaultMemoryStore.
 * recoverSessionFromFabric — read-back path used by getOwnedSession() when
 *   the process-local sessions Map misses (post-eviction / post-restart).
 *
 * Design note — why defaultMemoryStore, not defaultScopedMemoryManager:
 *   defaultScopedMemoryManager is an in-process Map-based abstraction (see
 *   packages/memory-fabric/src/scoped-memory.ts). It is not connected to
 *   defaultMemoryStore and therefore does not benefit from the Postgres backend
 *   that boot() wires up at startup. Using defaultMemoryStore directly means
 *   conversation sessions are stored in the same Postgres-backed singleton as
 *   all other fabric entries and survive process restarts.
 */

import { defaultMemoryStore } from "@workspace/memory-fabric";
import type { MemoryEntry } from "@workspace/memory-fabric";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationSession {
  id: string;
  ownerId: number;
  title: string;
  createdAt: string;
  lastActiveAt: number;
  messages: ConversationMessage[];
}

const SESSION_TTL_MS = 30 * 60 * 1000;

/**
 * Write-through: persist a conversation session to the unified memory fabric
 * (defaultMemoryStore — Postgres-backed when DATABASE_URL is set at boot).
 *
 * Uses stable entry IDs derived from the conversationId so each put() is an
 * idempotent upsert; repeated writes replace the same slot, never accumulate.
 *
 * - tier='session'  scopeId='conv:<id>'  — full session snapshot for recovery
 * - tier='entity'   scopeId='conv:<id>'  — message thread for reflection agents
 *
 * Errors are swallowed — the caller's in-memory Map remains the fast read path.
 */
export function persistSessionToFabric(session: ConversationSession): void {
  try {
    const now = new Date().toISOString();
    const expiry = new Date(session.lastActiveAt + SESSION_TTL_MS).toISOString();
    const scopeId = `conv:${session.id}`;

    const sessionEntry: MemoryEntry = {
      id: `conv-session::${session.id}`,
      tier: "session",
      key: session.id,
      value: session,
      scopeId,
      domain: "platform",
      summary: `Conversation session ${session.id} — ${session.title}`,
      provenance: { source: "omnia-conversations", method: "agent", createdAt: session.createdAt },
      freshness: { lastUpdatedAt: now, isStale: false },
      confidence: 1.0,
      retention: { policy: "session-scoped", pinned: false, expiresAt: expiry },
      sensitivity: "internal",
      linkedEntities: [],
      linkedTraces: [],
      linkedActions: [],
      tags: ["conversation", "omnia"],
      metadata: { ownerId: session.ownerId, conversationId: session.id },
    };

    const messagesEntry: MemoryEntry = {
      id: `conv-messages::${session.id}`,
      tier: "entity",
      key: `${session.id}::messages`,
      value: session.messages,
      scopeId,
      domain: "platform",
      summary: `Message history for conversation ${session.id}`,
      provenance: { source: "omnia-conversations", method: "agent", createdAt: session.createdAt },
      freshness: { lastUpdatedAt: now, isStale: false },
      confidence: 1.0,
      retention: { policy: "session-scoped", pinned: false, expiresAt: expiry },
      sensitivity: "internal",
      linkedEntities: [],
      linkedTraces: [],
      linkedActions: [],
      tags: ["conversation-messages", "omnia"],
      metadata: { ownerId: session.ownerId, conversationId: session.id, messageCount: session.messages.length },
    };

    defaultMemoryStore.put(sessionEntry);
    defaultMemoryStore.put(messagesEntry);
  } catch {
    /* non-fatal — caller's in-memory Map remains the fast read path */
  }
}

/**
 * Recover a session from defaultMemoryStore, applying ownerId isolation and
 * respecting the 30-minute idle TTL even after a restart.
 *
 * Returns null if:
 *  - no entry exists for this conversationId in the fabric
 *  - the fabric entry has expired (preserves 30-min TTL semantics post-restart)
 *  - the stored ownerId does not match requesterId (prevents IDOR)
 */
export function recoverSessionFromFabric(
  id: string,
  requesterId: number,
): ConversationSession | null {
  const entry = defaultMemoryStore.getByKey("session", id, `conv:${id}`);
  if (!entry) return null;

  // Honour expiry: if the session TTL elapsed before restart, do not recover.
  if (entry.retention?.expiresAt && new Date(entry.retention.expiresAt) < new Date()) {
    return null;
  }

  const data = entry.value as ConversationSession;
  if (!data || typeof data.ownerId !== "number") return null;
  if (data.ownerId !== requesterId) return null;
  return data;
}
