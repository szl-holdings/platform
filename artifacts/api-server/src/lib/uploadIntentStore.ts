/**
 * In-memory store that records server-issued upload intents.
 *
 * When `POST /storage/uploads/request-url` is called, the server records
 * the (objectPath, userId, resolvedOrgId, domain) tuple with a short TTL.
 * When `POST /api/files` is called to register the file, the store is checked to:
 *   1. Confirm the caller is the same user who requested the upload URL
 *   2. Return the server-resolved org context so POST /files can use it directly,
 *      ignoring any client-supplied orgId (prevents cross-org metadata writes and quota evasion).
 *
 * resolvedOrgId is set at presign time from the authenticated user's verified org membership,
 * not from client input. It is authoritative for the orgId written to filesTable.
 */

import { LRUCache } from 'lru-cache';

const INTENT_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface UploadIntent {
  userId: number;
  /** Server-resolved org ID from the user's verified session membership. Null for personal uploads. */
  resolvedOrgId: number | null;
  /** Product domain used for allowlist validation at presign time. */
  domain: string | null;
  expiresAt: Date;
}

const store = new LRUCache<string, UploadIntent>({ max: 2000 });

/** Periodically evict expired intents so the map does not grow unboundedly. */
function evictExpired(): void {
  const now = new Date();
  for (const [key, intent] of store.entries()) {
    if (intent.expiresAt <= now) {
      store.delete(key);
    }
  }
}
setInterval(evictExpired, INTENT_TTL_MS).unref();

/**
 * Record that `userId` has been issued a presigned upload URL for `objectPath`.
 * Stores server-resolved org context to be enforced at file registration time.
 */
export function recordUploadIntent(
  objectPath: string,
  userId: number,
  resolvedOrgId: number | null,
  domain: string | null,
): void {
  store.set(objectPath, {
    userId,
    resolvedOrgId,
    domain,
    expiresAt: new Date(Date.now() + INTENT_TTL_MS),
  });
}

/**
 * Peek at an upload intent without consuming it.
 * Use this to validate the intent before running expensive operations that may fail.
 * Call consumeUploadIntent() once all validation succeeds.
 *
 * Returns the intent data if valid, null otherwise.
 */
export function peekUploadIntent(objectPath: string, userId: number): UploadIntent | null {
  const intent = store.get(objectPath);
  if (!intent) return null;
  if (intent.userId !== userId) return null;
  if (intent.expiresAt <= new Date()) {
    store.delete(objectPath);
    return null;
  }
  return intent;
}

/**
 * Validate and consume (one-time use) an upload intent for `objectPath` issued to `userId`.
 * Returns the full intent data (including server-resolved org context) on success, null otherwise.
 * Call only after all validation steps have passed to avoid burning the intent on recoverable errors.
 */
export function consumeUploadIntent(objectPath: string, userId: number): UploadIntent | null {
  const intent = store.get(objectPath);
  if (!intent) return null;
  if (intent.userId !== userId) return null;
  if (intent.expiresAt <= new Date()) {
    store.delete(objectPath);
    return null;
  }
  store.delete(objectPath);
  return intent;
}
