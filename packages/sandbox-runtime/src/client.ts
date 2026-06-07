/**
 * Sandbox Runtime — UnixLocalSandboxClient
 *
 * Creates and manages sandbox sessions backed by temporary directories on the
 * local filesystem. Suitable for the Replit environment and local development.
 *
 * Provider abstraction is in place; future clients (Modal, E2B, Cloudflare)
 * can implement the same interface.
 *
 * Tenant isolation: all mutating operations accept a `tenantId` that is stored
 * on the session. Read operations that supply `tenantId` return only sessions
 * owned by that tenant, preventing cross-tenant IDOR.
 */

import { randomUUID } from 'node:crypto';
import { SandboxSession, defaultSessionStore } from './session.js';
import type {
  Manifest,
  SandboxAgentRunResult,
  SandboxRunConfig,
  SandboxSessionState,
  SandboxSnapshot,
} from './types.js';
import { SandboxAgent } from './agent.js';

export interface SandboxClientInfo {
  provider: string;
  version: string;
  maxConcurrentSessions: number;
}

export interface SandboxClient {
  readonly info: SandboxClientInfo;
  createSession(manifest: Manifest, tenantId: string): Promise<SandboxSession>;
  getSession(sessionId: string, tenantId?: string): SandboxSession | undefined;
  listSessions(tenantId?: string): Promise<SandboxSessionState[]>;
  destroySession(sessionId: string, tenantId?: string): Promise<void>;
  snapshot(sessionId: string, tenantId?: string): Promise<SandboxSnapshot>;
  resumeFromSnapshot(snapshot: SandboxSnapshot, tenantId: string): Promise<SandboxSession>;
  runAgent(
    sessionId: string,
    objective: string,
    config?: SandboxRunConfig,
    tenantId?: string,
  ): Promise<SandboxAgentRunResult>;
}

const MAX_CONCURRENT_SESSIONS = 50;

export class UnixLocalSandboxClient implements SandboxClient {
  readonly info: SandboxClientInfo = {
    provider: 'unix-local',
    version: '1.0.0',
    maxConcurrentSessions: MAX_CONCURRENT_SESSIONS,
  };

  async createSession(manifest: Manifest, tenantId: string): Promise<SandboxSession> {
    const activeSessions = defaultSessionStore.list(tenantId).filter((s) => s.status === 'active');
    if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
      throw new Error(
        `UnixLocalSandboxClient: maximum concurrent sessions (${MAX_CONCURRENT_SESSIONS}) reached for tenant '${tenantId}'.`,
      );
    }

    const session = await SandboxSession.create(manifest, tenantId);
    defaultSessionStore.set(session);
    return session;
  }

  /** Look up a session by ID, optionally enforcing tenant ownership. */
  getSession(sessionId: string, tenantId?: string): SandboxSession | undefined {
    return defaultSessionStore.get(sessionId, tenantId);
  }

  /** List sessions, optionally filtered to a single tenant. */
  async listSessions(tenantId?: string): Promise<SandboxSessionState[]> {
    const sessions = defaultSessionStore.list(tenantId);
    const states = await Promise.all(sessions.map((s) => s.getState()));
    return states;
  }

  /** Destroy a session. Pass `tenantId` to enforce ownership before deletion. */
  async destroySession(sessionId: string, tenantId?: string): Promise<void> {
    const session = defaultSessionStore.get(sessionId, tenantId);
    if (!session) {
      throw new Error(`Session '${sessionId}' not found.`);
    }
    await session.destroy();
    defaultSessionStore.delete(sessionId);
  }

  /** Snapshot a session. Pass `tenantId` to enforce ownership. */
  async snapshot(sessionId: string, tenantId?: string): Promise<SandboxSnapshot> {
    const session = defaultSessionStore.get(sessionId, tenantId);
    if (!session) {
      throw new Error(`Session '${sessionId}' not found.`);
    }
    return session.serialize();
  }

  /**
   * Resume a session from a snapshot. The new session is bound to `tenantId`.
   *
   * A fresh session ID is always generated — the snapshot's `sessionId` is
   * preserved as `originalSessionId` in the state metadata but is NOT reused
   * as the active session key. This prevents:
   * - Snapshot ID collision/overwrite attacks (crafting a snapshot with a
   *   known session ID to hijack or overwrite an existing live session)
   * - Cross-tenant session aliasing
   *
   * The snapshot is validated for path traversal before files are written.
   */
  async resumeFromSnapshot(snapshot: SandboxSnapshot, tenantId: string): Promise<SandboxSession> {
    const freshSessionId = randomUUID();

    const state: SandboxSessionState = {
      sessionId: freshSessionId,
      tenantId,
      workspaceRoot: '',
      status: 'idle',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      fileInventory: [],
      environment: snapshot.environment,
      metadata: {
        ...snapshot.metadata,
        originalSessionId: snapshot.sessionId,
        snapshotId: snapshot.snapshotId,
        snapshotCreatedAt: snapshot.createdAt,
      },
    };

    const session = await SandboxSession.resume(state);
    await session.restoreSnapshot(snapshot);
    defaultSessionStore.set(session);
    return session;
  }

  /** Run the sandbox agent in an existing session. */
  async runAgent(
    sessionId: string,
    objective: string,
    config: SandboxRunConfig = {},
    tenantId?: string,
  ): Promise<SandboxAgentRunResult> {
    const session = defaultSessionStore.get(sessionId, tenantId);
    if (!session) {
      throw new Error(`Session '${sessionId}' not found.`);
    }

    const agent = new SandboxAgent();
    // Forward the session's tenantId so MemoryCapability keys are tenant-scoped,
    // preventing cross-tenant memory fabric leakage when reusing an existing session.
    return agent.run(objective, { entries: [] }, config, {
      session,
      tenantId: session.tenantId,
    });
  }
}

export const defaultSandboxClient = new UnixLocalSandboxClient();
