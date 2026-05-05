/**
 * OMNIA Conversation Persistence — Memory Fabric Integration Tests
 *
 * Tests exercise the ACTUAL helper functions from
 * artifacts/api-server/src/lib/conversation-fabric.ts (not mirrored logic),
 * so they catch real module-level drift.
 *
 *  (a) Idempotent writes — stable IDs upsert the same slot, never accumulate.
 *  (b) Post-eviction / post-restart recovery — recoverSessionFromFabric()
 *      restores sessions from defaultMemoryStore after the in-process Map misses.
 *  (c) Cross-user isolation — ownerId mismatch returns null from recovery path.
 *  (d) Entity tier — message thread is independently queryable by key.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  defaultMemoryStore,
  InMemoryStore,
  MutableMemoryStore,
} from '@workspace/memory-fabric';
import {
  persistSessionToFabric,
  recoverSessionFromFabric,
  type ConversationSession,
} from '../lib/conversation-fabric.js';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeSession(
  id: string,
  ownerId: number,
  messages: ConversationSession['messages'] = [],
): ConversationSession {
  return {
    id,
    ownerId,
    title: `Session ${id}`,
    createdAt: new Date().toISOString(),
    lastActiveAt: Date.now(),
    messages,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('omnia conversation persistence via defaultMemoryStore', () => {
  beforeEach(() => {
    (defaultMemoryStore as MutableMemoryStore).setBackend(new InMemoryStore());
  });

  describe('(a) idempotent writes — stable entry IDs prevent stale accumulation', () => {
    it('repeated persistSessionToFabric calls upsert the same slot, not accumulate', () => {
      const session = makeSession('conv-idempotent', 1);
      persistSessionToFabric(session);
      persistSessionToFabric(session);
      persistSessionToFabric(session);

      const all = defaultMemoryStore.list({ tier: 'session' });
      const ours = all.filter((e) => e.id === `conv-session::${session.id}`);
      expect(ours).toHaveLength(1);

      const allEntity = defaultMemoryStore.list({ tier: 'entity' });
      const ourMsgs = allEntity.filter((e) => e.id === `conv-messages::${session.id}`);
      expect(ourMsgs).toHaveLength(1);
    });

    it('session snapshot is always the latest write', () => {
      const session = makeSession('conv-latest', 1);
      persistSessionToFabric(session);

      session.messages.push({ role: 'user', content: 'hello' });
      session.lastActiveAt = Date.now();
      persistSessionToFabric(session);

      const entry = defaultMemoryStore.getByKey('session', session.id, `conv:${session.id}`);
      expect(entry).toBeDefined();
      const stored = entry!.value as ConversationSession;
      expect(stored.messages).toHaveLength(1);
      expect(stored.messages[0]?.content).toBe('hello');
    });
  });

  describe('(b) post-eviction recovery — recoverSessionFromFabric restores sessions', () => {
    it('session is recoverable from defaultMemoryStore after Map would be cleared', () => {
      const session = makeSession('conv-recover', 42, [
        { role: 'user', content: 'What is the fleet status?' },
        { role: 'assistant', content: 'All vessels are nominal.' },
      ]);

      persistSessionToFabric(session);

      const recovered = recoverSessionFromFabric(session.id, 42);
      expect(recovered).not.toBeNull();
      expect(recovered!.id).toBe(session.id);
      expect(recovered!.ownerId).toBe(42);
      expect(recovered!.messages).toHaveLength(2);
      expect(recovered!.messages[1]?.content).toBe('All vessels are nominal.');
    });

    it('returns null when no session has been persisted', () => {
      expect(recoverSessionFromFabric('conv-nonexistent', 1)).toBeNull();
    });

    it('recovery works after simulated restart (setBackend to durable store)', () => {
      const durableStore = new InMemoryStore();
      (defaultMemoryStore as MutableMemoryStore).setBackend(durableStore);

      const session = makeSession('conv-restart', 7);
      session.messages.push({ role: 'user', content: 'Schedule review' });
      persistSessionToFabric(session);

      // Simulate restart: fresh empty backend
      (defaultMemoryStore as MutableMemoryStore).setBackend(new InMemoryStore());
      expect(recoverSessionFromFabric(session.id, 7)).toBeNull();

      // Re-hydrate: re-attach to durableStore (mirrors what boot() does)
      (defaultMemoryStore as MutableMemoryStore).setBackend(durableStore);

      const recovered = recoverSessionFromFabric(session.id, 7);
      expect(recovered).not.toBeNull();
      expect(recovered!.messages).toHaveLength(1);
      expect(recovered!.messages[0]?.content).toBe('Schedule review');
    });
  });

  describe('(c) cross-user isolation — ownerId mismatch returns null', () => {
    it('recoverSessionFromFabric rejects wrong ownerId', () => {
      const session = makeSession('conv-private', 100);
      session.messages.push({ role: 'assistant', content: 'Classified briefing.' });
      persistSessionToFabric(session);

      expect(recoverSessionFromFabric(session.id, 999)).toBeNull();
      const own = recoverSessionFromFabric(session.id, 100);
      expect(own).not.toBeNull();
      expect(own!.ownerId).toBe(100);
    });

    it("two users' sessions coexist without interference", () => {
      const sA = makeSession('conv-user-a', 1);
      const sB = makeSession('conv-user-b', 2);
      sA.messages.push({ role: 'user', content: 'User A message' });
      sB.messages.push({ role: 'user', content: 'User B message' });

      persistSessionToFabric(sA);
      persistSessionToFabric(sB);

      expect(recoverSessionFromFabric(sA.id, 1)!.messages[0]?.content).toBe('User A message');
      expect(recoverSessionFromFabric(sB.id, 2)!.messages[0]?.content).toBe('User B message');
      expect(recoverSessionFromFabric(sA.id, 2)).toBeNull();
      expect(recoverSessionFromFabric(sB.id, 1)).toBeNull();
    });
  });

  describe('(d) message thread tier — entity entries are independently queryable', () => {
    it('message thread is written as tier=entity and queryable by key', () => {
      const session = makeSession('conv-msgs', 5);
      session.messages.push({ role: 'user', content: 'ping' });
      session.messages.push({ role: 'assistant', content: 'pong' });
      persistSessionToFabric(session);

      const msgEntry = defaultMemoryStore.getByKey(
        'entity',
        `${session.id}::messages`,
        `conv:${session.id}`,
      );
      expect(msgEntry).toBeDefined();
      const msgs = msgEntry!.value as ConversationSession['messages'];
      expect(msgs).toHaveLength(2);
      expect(msgs[0]?.role).toBe('user');
      expect(msgs[1]?.role).toBe('assistant');
    });

    it('message entry is updated idempotently on each append', () => {
      const session = makeSession('conv-append', 3);
      persistSessionToFabric(session);

      session.messages.push({ role: 'user', content: 'first' });
      persistSessionToFabric(session);

      session.messages.push({ role: 'assistant', content: 'reply' });
      persistSessionToFabric(session);

      const msgEntry = defaultMemoryStore.getByKey(
        'entity',
        `${session.id}::messages`,
        `conv:${session.id}`,
      );
      expect(msgEntry).toBeDefined();
      const msgs = msgEntry!.value as ConversationSession['messages'];
      expect(msgs).toHaveLength(2);

      const all = defaultMemoryStore.list({ tier: 'entity' });
      const ours = all.filter((e) => e.id === `conv-messages::${session.id}`);
      expect(ours).toHaveLength(1);
    });
  });
});
