/**
 * Sandbox Runtime — Session Lifecycle
 *
 * SandboxSession wraps a live workspace directory.
 * - create(manifest) → materializes workspace and returns session
 * - serialize() → captures workspace as a portable snapshot
 * - resume(state) → recreates workspace from serialized state
 * - destroy() → cleans up workspace directory
 */

import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import { globalCollector } from '@workspace/cognitive-observability';
import { materializeManifest, validateWorkspacePath } from './materializer.js';
import type {
  Manifest,
  SandboxSessionState,
  SandboxSnapshot,
  SandboxSnapshotFile,
  WorkspaceFileInventory,
} from './types.js';

const MAX_SNAPSHOT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file in snapshot
const WORKSPACE_PREFIX = 'szl-sandbox-';

/** Walk a directory recursively, collecting file metadata. */
async function walkDir(
  dir: string,
  workspaceRoot: string,
  inventory: WorkspaceFileInventory[],
): Promise<void> {
  let entries: import('node:fs').Dirent<string>[];
  try {
    entries = await readdir(dir, { withFileTypes: true, encoding: 'utf8' });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath, workspaceRoot, inventory);
    } else if (entry.isFile()) {
      try {
        const stats = await stat(fullPath);
        inventory.push({
          path: relative(workspaceRoot, fullPath),
          sizeBytes: stats.size,
          modifiedAt: stats.mtime.toISOString(),
        });
      } catch {
        // Skip unreadable files
      }
    }
  }
}

export class SandboxSession {
  readonly sessionId: string;
  readonly workspaceRoot: string;
  /** Owning tenant org ID — used to enforce session isolation across tenants. */
  readonly tenantId: string;
  private _status: 'active' | 'idle' | 'suspended' | 'destroyed' = 'idle';
  private readonly createdAt: number;
  private lastActiveAt: number;
  private readonly environment: Record<string, string>;
  private readonly manifestId?: string;

  private constructor(
    sessionId: string,
    workspaceRoot: string,
    environment: Record<string, string>,
    tenantId: string,
    manifestId?: string,
  ) {
    this.sessionId = sessionId;
    this.workspaceRoot = workspaceRoot;
    this.environment = environment;
    this.tenantId = tenantId;
    this.createdAt = Date.now();
    this.lastActiveAt = Date.now();
    this.manifestId = manifestId;
  }

  get status() {
    return this._status;
  }

  /**
   * Create a new session from a manifest. Materializes the workspace.
   * @param manifest Workspace manifest to materialize.
   * @param tenantId Owning tenant org ID for session isolation.
   * @param opts Optional settings — pass `allowedSourceRoots` to permit
   *   `local_file`/`local_dir` manifest entries from trusted host paths.
   *   If omitted, local copies are denied (deny-by-default).
   */
  static async create(
    manifest: Manifest,
    tenantId: string,
    opts: { allowedSourceRoots?: string[] } = {},
  ): Promise<SandboxSession> {
    const sessionId = randomUUID();
    const workspaceRoot = await mkdtemp(join(tmpdir(), WORKSPACE_PREFIX));

    await materializeManifest(manifest, workspaceRoot, {
      allowedSourceRoots: opts.allowedSourceRoots ?? [],
    });

    const session = new SandboxSession(
      sessionId,
      workspaceRoot,
      manifest.environment ?? {},
      tenantId,
      manifest.id,
    );
    session._status = 'active';

    // Emit session lifecycle metric for observability pipeline
    globalCollector.recordKnown('latency_ms', 0, {
      event: 'sandbox.session.created',
      sessionId: session.sessionId,
      tenantId: session.tenantId,
      domain: 'sandbox',
    });

    return session;
  }

  /**
   * Resume a session from serialized state (recreates workspace from snapshot files).
   * The returned session workspace is empty until `restoreSnapshot()` is called.
   */
  static async resume(state: SandboxSessionState): Promise<SandboxSession> {
    const workspaceRoot = await mkdtemp(join(tmpdir(), WORKSPACE_PREFIX));
    const session = new SandboxSession(
      state.sessionId,
      workspaceRoot,
      state.environment,
      state.tenantId,
      state.manifestId,
    );
    session._status = 'active';
    return session;
  }

  /** Serialize the current workspace state as a portable snapshot. */
  async serialize(): Promise<SandboxSnapshot> {
    this.touch();
    const snapshotId = randomUUID();
    const inventory: WorkspaceFileInventory[] = [];
    await walkDir(this.workspaceRoot, this.workspaceRoot, inventory);

    const files: SandboxSnapshotFile[] = [];
    for (const item of inventory) {
      const fullPath = join(this.workspaceRoot, item.path);
      if (item.sizeBytes > MAX_SNAPSHOT_FILE_SIZE) continue; // skip huge files

      try {
        const content = await readFile(fullPath);
        let encoding: 'utf8' | 'base64' = 'utf8';
        let contentStr: string;

        // Try UTF-8 first; fall back to base64 for binary files
        try {
          contentStr = content.toString('utf8');
          // If round-trip is lossy, use base64
          if (Buffer.from(contentStr, 'utf8').length !== content.length) {
            contentStr = content.toString('base64');
            encoding = 'base64';
          }
        } catch {
          contentStr = content.toString('base64');
          encoding = 'base64';
        }

        files.push({ path: item.path, content: contentStr, encoding });
      } catch {
        // Skip unreadable files
      }
    }

    return {
      snapshotId,
      sessionId: this.sessionId,
      createdAt: Date.now(),
      files,
      environment: { ...this.environment },
    };
  }

  /** Restore workspace contents from a snapshot. */
  async restoreSnapshot(snapshot: SandboxSnapshot): Promise<void> {
    this.touch();
    for (const file of snapshot.files) {
      // Validate every path from the snapshot — snapshot objects may originate
      // from untrusted sources (API resume endpoint, serialized state stores).
      // Without this check, a crafted snapshot could escape the workspace root.
      const fullPath = validateWorkspacePath(file.path, this.workspaceRoot);
      await mkdir(join(fullPath, '..'), { recursive: true });

      if (file.encoding === 'base64') {
        await writeFile(fullPath, Buffer.from(file.content, 'base64'));
      } else {
        await writeFile(fullPath, file.content, 'utf8');
      }
    }
  }

  /** Return the current session state (lightweight — does not walk disk). */
  async getState(): Promise<SandboxSessionState> {
    this.touch();
    const inventory: WorkspaceFileInventory[] = [];
    await walkDir(this.workspaceRoot, this.workspaceRoot, inventory);

    return {
      sessionId: this.sessionId,
      tenantId: this.tenantId,
      manifestId: this.manifestId,
      workspaceRoot: this.workspaceRoot,
      status: this._status,
      createdAt: this.createdAt,
      lastActiveAt: this.lastActiveAt,
      fileInventory: inventory,
      environment: { ...this.environment },
    };
  }

  /** Destroy the workspace by removing the temporary directory. */
  async destroy(): Promise<void> {
    if (this._status === 'destroyed') return;
    this._status = 'destroyed';

    const destroyStart = Date.now();
    try {
      await rm(this.workspaceRoot, { recursive: true, force: true });
    } catch (err) {
      // Log cleanup failures — they indicate a potential workspace leak
      console.warn(
        `[SandboxSession] destroy failed for session '${this.sessionId}' at '${this.workspaceRoot}':`,
        err instanceof Error ? err.message : String(err),
      );
    }

    // Emit session destroy lifecycle metric
    globalCollector.recordKnown('latency_ms', Date.now() - destroyStart, {
      event: 'sandbox.session.destroyed',
      sessionId: this.sessionId,
      tenantId: this.tenantId,
      domain: 'sandbox',
    });
  }

  private touch(): void {
    this.lastActiveAt = Date.now();
  }
}

// ─── In-Memory Session Store ──────────────────────────────────────────────────

class InMemorySessionStore {
  private readonly sessions = new Map<string, SandboxSession>();

  set(session: SandboxSession): void {
    this.sessions.set(session.sessionId, session);
  }

  /** Retrieve a session by ID. Pass `tenantId` to enforce tenant ownership. */
  get(sessionId: string, tenantId?: string): SandboxSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    if (tenantId && session.tenantId !== tenantId) return undefined;
    return session;
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /** List sessions, optionally filtered to a single tenant. */
  list(tenantId?: string): SandboxSession[] {
    const all = [...this.sessions.values()];
    return tenantId ? all.filter((s) => s.tenantId === tenantId) : all;
  }
}

export const defaultSessionStore = new InMemorySessionStore();
