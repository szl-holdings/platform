/**
 * Sandbox Runtime — Filesystem Capability
 *
 * Governed file operations within the workspace root.
 * - All paths validated against workspace root (no traversal)
 * - Large file reads support offset/limit pagination
 * - File writes create evidence in the step log
 * - Registered as Tool Mesh tools (sandbox.fs.*) with:
 *     internal-workflow tier for reads
 *     operator-assisted tier for writes
 */

import {
  access,
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { globalCollector } from '@workspace/cognitive-observability';
import { validateWorkspacePath, validateWorkspacePathSafe } from '../materializer.js';
import type {
  DirEntry,
  FileReadResult,
  FileWriteResult,
  ListDirResult,
  SandboxCapability,
} from '../types.js';

const DEFAULT_READ_LIMIT_BYTES = 512 * 1024; // 512 KB per read
const MAX_READ_BYTES = 4 * 1024 * 1024; // 4 MB absolute max

/** Guess mime type from extension. */
function guessMimeType(path: string): string {
  const ext = extname(path).toLowerCase();
  const map: Record<string, string> = {
    '.ts': 'text/typescript',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.py': 'text/x-python',
    '.sh': 'application/x-sh',
    '.html': 'text/html',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.csv': 'text/csv',
    '.yaml': 'application/yaml',
    '.yml': 'application/yaml',
    '.xml': 'application/xml',
  };
  return map[ext] ?? 'application/octet-stream';
}

const BINARY_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.tar', '.gz']);

export interface FilesystemCapabilityOptions {
  workspaceRoot: string;
  maxReadBytes?: number;
}

export class FilesystemCapability implements SandboxCapability {
  readonly type = 'filesystem' as const;
  readonly description = 'Governed file read/write/list operations within the workspace root.';

  private readonly workspaceRoot: string;
  private readonly maxReadBytes: number;

  constructor(opts: FilesystemCapabilityOptions) {
    this.workspaceRoot = opts.workspaceRoot;
    this.maxReadBytes = opts.maxReadBytes ?? DEFAULT_READ_LIMIT_BYTES;
  }

  /**
   * Read a file from the workspace. Supports offset/limit for large files.
   * @param path Workspace-relative path
   * @param options.offsetBytes Starting byte offset (for pagination)
   * @param options.limitBytes Max bytes to read (default 512 KB)
   */
  async readFile(
    path: string,
    options: { offsetBytes?: number; limitBytes?: number } = {},
  ): Promise<FileReadResult> {
    const fullPath = await validateWorkspacePathSafe(path, this.workspaceRoot);
    const stats = await stat(fullPath);
    const isBinary = BINARY_EXTS.has(extname(path).toLowerCase());

    const limitBytes = Math.min(
      options.limitBytes ?? this.maxReadBytes,
      MAX_READ_BYTES,
    );
    const offsetBytes = options.offsetBytes ?? 0;

    const readStart = Date.now();
    const raw = await readFile(fullPath);
    const readDurationMs = Date.now() - readStart;
    const slice = raw.slice(offsetBytes, offsetBytes + limitBytes);
    const truncated = offsetBytes + limitBytes < stats.size;

    // Emit filesystem read lifecycle metric for observability pipeline
    globalCollector.recordKnown('latency_ms', readDurationMs, {
      event: 'sandbox.fs.read',
      path: relative(this.workspaceRoot, fullPath),
      sizeBytes: String(stats.size),
      truncated: String(truncated),
      domain: 'sandbox',
    });

    if (isBinary) {
      return {
        path,
        content: slice.toString('base64'),
        encoding: 'base64',
        sizeBytes: stats.size,
        truncated,
      };
    }

    return {
      path,
      content: slice.toString('utf8'),
      encoding: 'utf8',
      sizeBytes: stats.size,
      truncated,
    };
  }

  /**
   * Write a file to the workspace. Creates parent directories if needed.
   * @param path Workspace-relative path
   * @param content File content
   * @param encoding 'utf8' or 'base64'
   */
  async writeFile(
    path: string,
    content: string,
    encoding: 'utf8' | 'base64' = 'utf8',
  ): Promise<FileWriteResult> {
    const fullPath = await validateWorkspacePathSafe(path, this.workspaceRoot);
    await mkdir(dirname(fullPath), { recursive: true });

    let exists = false;
    try {
      await access(fullPath, constants.F_OK);
      exists = true;
    } catch {
      // File does not exist yet
    }

    const buf = encoding === 'base64' ? Buffer.from(content, 'base64') : Buffer.from(content, 'utf8');
    const writeStart = Date.now();
    await writeFile(fullPath, buf);
    const writeDurationMs = Date.now() - writeStart;

    // Emit filesystem write lifecycle metric for observability pipeline
    globalCollector.recordKnown('latency_ms', writeDurationMs, {
      event: 'sandbox.fs.write',
      path: relative(this.workspaceRoot, fullPath),
      sizeBytes: String(buf.length),
      created: String(!exists),
      domain: 'sandbox',
    });

    return {
      path,
      sizeBytes: buf.length,
      created: !exists,
    };
  }

  /**
   * List directory contents (non-recursive).
   * @param path Workspace-relative path (default: workspace root)
   */
  async listDir(path = '.'): Promise<ListDirResult> {
    const fullPath = await validateWorkspacePathSafe(path, this.workspaceRoot);
    const rawEntries = await readdir(fullPath, { withFileTypes: true });

    const entries: DirEntry[] = await Promise.all(
      rawEntries.map(async (e) => {
        const entryFullPath = join(fullPath, e.name);
        const entryPath = relative(this.workspaceRoot, entryFullPath);
        let sizeBytes: number | undefined;
        let modifiedAt: string | undefined;

        try {
          const s = await stat(entryFullPath);
          sizeBytes = s.size;
          modifiedAt = s.mtime.toISOString();
        } catch {
          // Ignore stat errors for individual entries
        }

        return {
          name: e.name,
          path: entryPath,
          type: e.isDirectory() ? 'dir' : e.isSymbolicLink() ? 'symlink' : 'file',
          sizeBytes,
          modifiedAt,
        } satisfies DirEntry;
      }),
    );

    return { path, entries, count: entries.length };
  }

  /**
   * Apply a unified diff patch to a file.
   * Requires the `patch` command to be available in the environment.
   */
  async applyPatch(
    path: string,
    patch: string,
  ): Promise<{ path: string; success: boolean; error?: string }> {
    const fullPath = await validateWorkspacePathSafe(path, this.workspaceRoot);

    // Write patch content to a temp file, then invoke `patch` via execFile
    // with an explicit argument array — never string interpolation — so that
    // attacker-controlled file paths or patch content cannot inject shell commands.
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const { writeFile: wf, unlink } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { randomUUID } = await import('node:crypto');

    const execFileAsync = promisify(execFile);
    const patchFile = join(tmpdir(), `szl-patch-${randomUUID()}.patch`);

    try {
      await wf(patchFile, patch, 'utf8');
      // `patch -p0 -i <patchFile> <fullPath>` — all arguments passed as array,
      // no shell expansion, no injection surface.
      await execFileAsync('patch', ['-p0', '-i', patchFile, fullPath], {
        cwd: this.workspaceRoot,
        timeout: 30_000,
      });
      return { path, success: true };
    } catch (err) {
      return {
        path,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      try {
        await unlink(patchFile);
      } catch {
        // Best effort
      }
    }
  }

  /**
   * Return base64 thumbnail data for an image file.
   * Returns the full file content as base64 (callers should constrain size).
   */
  async viewImage(path: string): Promise<{ path: string; content: string; mimeType: string }> {
    const fullPath = await validateWorkspacePathSafe(path, this.workspaceRoot);
    const raw = await readFile(fullPath);
    const mimeType = guessMimeType(path);
    return {
      path,
      content: raw.toString('base64'),
      mimeType,
    };
  }

  /** Check whether a path exists in the workspace. */
  async exists(path: string): Promise<boolean> {
    // PathTraversalError is a security signal — re-throw rather than swallowing.
    const fullPath = await validateWorkspacePathSafe(path, this.workspaceRoot);
    try {
      await access(fullPath, constants.F_OK);
      return true;
    } catch {
      // Any filesystem error (ENOENT, EACCES, etc.) means "not accessible"
      return false;
    }
  }
}
