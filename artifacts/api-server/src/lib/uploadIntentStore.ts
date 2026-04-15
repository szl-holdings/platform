/**
 * In-memory store that records server-issued upload intents.
 *
 * When `POST /storage/uploads/request-url` is called, the server records
 * the (objectPath, userId) pair with a short TTL. When `POST /api/files`
 * is called to register the file, the store is checked to confirm the caller
 * is the same user who originally requested the upload URL, preventing
 * arbitrary object-path claims and ACL takeover.
 */

const INTENT_TTL_MS = 60 * 60 * 1000; // 1 hour

interface UploadIntent {
  userId: number;
  expiresAt: Date;
}

const store = new Map<string, UploadIntent>();

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
 */
export function recordUploadIntent(objectPath: string, userId: number): void {
  store.set(objectPath, {
    userId,
    expiresAt: new Date(Date.now() + INTENT_TTL_MS),
  });
}

/**
 * Validate that an upload intent for `objectPath` was issued to `userId`
 * and has not expired. On success, the intent is consumed (one-time use).
 *
 * Returns true if valid, false otherwise.
 */
export function consumeUploadIntent(objectPath: string, userId: number): boolean {
  const intent = store.get(objectPath);
  if (!intent) return false;
  if (intent.userId !== userId) return false;
  if (intent.expiresAt <= new Date()) {
    store.delete(objectPath);
    return false;
  }
  store.delete(objectPath);
  return true;
}
