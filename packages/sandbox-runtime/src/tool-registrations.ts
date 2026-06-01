/**
 * Sandbox Runtime — Tool Mesh Registrations
 *
 * Registers sandbox tools in the Tool Mesh with appropriate policy tiers:
 * - sandbox.shell          → operator-assisted (side-effecting)
 * - sandbox.fs.read        → internal-workflow (read-only)
 * - sandbox.fs.write       → operator-assisted (mutating)
 * - sandbox.fs.list        → internal-workflow (read-only)
 * - sandbox.session.create → operator-assisted
 * - sandbox.session.snapshot → internal-workflow
 * - sandbox.session.destroy  → operator-assisted
 *
 * All tool handlers require `tenantId` in their input to enforce
 * per-tenant session ownership — no cross-tenant IDOR is possible.
 *
 * Call registerSandboxTools(gateway, registry) once at server startup.
 */

import type { ToolMeshGateway } from '@workspace/tool-mesh/gateway';
import type { ToolRegistry } from '@workspace/tool-mesh/registry';
import { ToolManifestSchema } from '@workspace/tool-mesh/manifest';
import { defaultSandboxClient } from './client.js';

function manifest(partial: Parameters<typeof ToolManifestSchema.parse>[0]) {
  return ToolManifestSchema.parse(partial);
}

/**
 * Extract and validate tenantId from tool input.
 * Throws a typed error if tenantId is missing — callers receive a clear 403-like signal.
 */
function requireTenantId(input: Record<string, unknown>): string {
  const tenantId = input.tenantId;
  if (typeof tenantId !== 'string' || !tenantId) {
    throw new Error(
      'Sandbox tool invocation requires a non-empty tenantId for tenant isolation.',
    );
  }
  return tenantId;
}

/**
 * Schema fragment added to every tool that operates on an existing session.
 * tenantId is required — without it the handler cannot enforce ownership.
 */
const SESSION_INPUT_PROPERTIES = {
  sessionId: { type: 'string', description: 'Sandbox session ID' },
  tenantId: {
    type: 'string',
    description: 'Owning tenant org ID — required for session isolation',
  },
};

export function registerSandboxTools(
  gateway: ToolMeshGateway,
  registry: ToolRegistry,
): void {
  // ── sandbox.shell ───────────────────────────────────────────────────────────
  registry.register(
    manifest({
      id: 'sandbox.shell',
      name: 'Sandbox Shell',
      version: '1.0.0',
      description:
        'Execute a shell command inside a governed sandbox workspace. ' +
        'CWD is locked to workspace root. Output is capped at 1 MB.',
      domainTags: ['infrastructure'],
      policyTier: 'operator-assisted',
      approvalRequired: false,
      timeoutMs: 60_000,
      inputSchema: {
        type: 'object',
        properties: {
          ...SESSION_INPUT_PROPERTIES,
          command: { type: 'string', description: 'Shell command to execute' },
          timeoutMs: {
            type: 'number',
            description: 'Command timeout in milliseconds (default 30 000)',
          },
          cwd: {
            type: 'string',
            description: 'Working directory relative to workspace root',
          },
          blockedCommands: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional command patterns to block for this invocation',
          },
          maxOutputBytes: {
            type: 'number',
            description: 'Max stdout+stderr size in bytes (default 1 MB)',
          },
        },
        required: ['sessionId', 'tenantId', 'command'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          stdout: { type: 'string' },
          stderr: { type: 'string' },
          exitCode: { type: 'number' },
          durationMs: { type: 'number' },
          timedOut: { type: 'boolean' },
        },
      },
      observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
    }),
  );

  gateway.registerHandler('sandbox.shell', async (input) => {
    const raw = input as Record<string, unknown>;
    const tenantId = requireTenantId(raw);
    const { sessionId, command, timeoutMs, cwd, blockedCommands, maxOutputBytes } = raw as {
      sessionId: string;
      command: string;
      timeoutMs?: number;
      cwd?: string;
      blockedCommands?: string[];
      maxOutputBytes?: number;
    };

    const session = defaultSandboxClient.getSession(sessionId, tenantId);
    if (!session) throw new Error(`Sandbox session '${sessionId}' not found`);

    const { ShellCapability } = await import('./capabilities/shell.js');
    const shell = new ShellCapability({
      workspaceRoot: session.workspaceRoot,
      defaultTimeoutMs: timeoutMs ?? 30_000,
      ...(maxOutputBytes != null ? { maxOutputBytes } : {}),
      ...(blockedCommands && blockedCommands.length > 0
        ? { additionalBlockedCommands: blockedCommands }
        : {}),
    });
    return shell.exec(command, { timeoutMs, cwd });
  });

  // ── sandbox.fs.read ─────────────────────────────────────────────────────────
  registry.register(
    manifest({
      id: 'sandbox.fs.read',
      name: 'Sandbox File Read',
      version: '1.0.0',
      description: 'Read a file from a sandbox workspace. Supports pagination for large files.',
      domainTags: ['infrastructure'],
      policyTier: 'internal-workflow',
      timeoutMs: 10_000,
      inputSchema: {
        type: 'object',
        properties: {
          ...SESSION_INPUT_PROPERTIES,
          path: { type: 'string', description: 'Workspace-relative path' },
          offsetBytes: { type: 'number' },
          limitBytes: { type: 'number' },
        },
        required: ['sessionId', 'tenantId', 'path'],
      },
    }),
  );

  gateway.registerHandler('sandbox.fs.read', async (input) => {
    const raw = input as Record<string, unknown>;
    const tenantId = requireTenantId(raw);
    const { sessionId, path, offsetBytes, limitBytes } = raw as {
      sessionId: string;
      path: string;
      offsetBytes?: number;
      limitBytes?: number;
    };
    const session = defaultSandboxClient.getSession(sessionId, tenantId);
    if (!session) throw new Error(`Session '${sessionId}' not found`);
    const { FilesystemCapability } = await import('./capabilities/filesystem.js');
    const fs = new FilesystemCapability({ workspaceRoot: session.workspaceRoot });
    return fs.readFile(path, { offsetBytes, limitBytes });
  });

  // ── sandbox.fs.write ────────────────────────────────────────────────────────
  registry.register(
    manifest({
      id: 'sandbox.fs.write',
      name: 'Sandbox File Write',
      version: '1.0.0',
      description: 'Write a file to a sandbox workspace. Creates parent directories as needed.',
      domainTags: ['infrastructure'],
      policyTier: 'operator-assisted',
      timeoutMs: 10_000,
      inputSchema: {
        type: 'object',
        properties: {
          ...SESSION_INPUT_PROPERTIES,
          path: { type: 'string' },
          content: { type: 'string' },
          encoding: { type: 'string', enum: ['utf8', 'base64'] },
        },
        required: ['sessionId', 'tenantId', 'path', 'content'],
      },
    }),
  );

  gateway.registerHandler('sandbox.fs.write', async (input) => {
    const raw = input as Record<string, unknown>;
    const tenantId = requireTenantId(raw);
    const { sessionId, path, content, encoding = 'utf8' } = raw as {
      sessionId: string;
      path: string;
      content: string;
      encoding?: 'utf8' | 'base64';
    };
    const session = defaultSandboxClient.getSession(sessionId, tenantId);
    if (!session) throw new Error(`Session '${sessionId}' not found`);
    const { FilesystemCapability } = await import('./capabilities/filesystem.js');
    const fs = new FilesystemCapability({ workspaceRoot: session.workspaceRoot });
    return fs.writeFile(path, content, encoding);
  });

  // ── sandbox.fs.list ─────────────────────────────────────────────────────────
  registry.register(
    manifest({
      id: 'sandbox.fs.list',
      name: 'Sandbox Dir List',
      version: '1.0.0',
      description: 'List directory contents in a sandbox workspace.',
      domainTags: ['infrastructure'],
      policyTier: 'internal-workflow',
      timeoutMs: 10_000,
      inputSchema: {
        type: 'object',
        properties: {
          ...SESSION_INPUT_PROPERTIES,
          path: { type: 'string', description: 'Workspace-relative path (default: root)' },
        },
        required: ['sessionId', 'tenantId'],
      },
    }),
  );

  gateway.registerHandler('sandbox.fs.list', async (input) => {
    const raw = input as Record<string, unknown>;
    const tenantId = requireTenantId(raw);
    const { sessionId, path = '.' } = raw as { sessionId: string; path?: string };
    const session = defaultSandboxClient.getSession(sessionId, tenantId);
    if (!session) throw new Error(`Session '${sessionId}' not found`);
    const { FilesystemCapability } = await import('./capabilities/filesystem.js');
    const fs = new FilesystemCapability({ workspaceRoot: session.workspaceRoot });
    return fs.listDir(path);
  });

  // ── sandbox.session.create ──────────────────────────────────────────────────
  registry.register(
    manifest({
      id: 'sandbox.session.create',
      name: 'Sandbox Session Create',
      version: '1.0.0',
      description: 'Create a new governed sandbox session from a manifest.',
      domainTags: ['infrastructure'],
      policyTier: 'operator-assisted',
      timeoutMs: 60_000,
      inputSchema: {
        type: 'object',
        properties: {
          tenantId: {
            type: 'string',
            description: 'Owning tenant org ID — required for session isolation',
          },
          manifest: {
            type: 'object',
            description: 'Sandbox manifest (entries, environment, outputDirs)',
          },
        },
        required: ['tenantId', 'manifest'],
      },
    }),
  );

  gateway.registerHandler('sandbox.session.create', async (input) => {
    const raw = input as Record<string, unknown>;
    const tenantId = requireTenantId(raw);
    const { manifest: mfst } = raw as {
      manifest: Parameters<typeof defaultSandboxClient.createSession>[0];
    };
    const session = await defaultSandboxClient.createSession(mfst, tenantId);
    return { sessionId: session.sessionId, tenantId: session.tenantId, workspaceRoot: session.workspaceRoot };
  });

  // ── sandbox.session.snapshot ────────────────────────────────────────────────
  registry.register(
    manifest({
      id: 'sandbox.session.snapshot',
      name: 'Sandbox Session Snapshot',
      version: '1.0.0',
      description: 'Serialize the current workspace state as a portable snapshot.',
      domainTags: ['infrastructure'],
      policyTier: 'internal-workflow',
      timeoutMs: 30_000,
      inputSchema: {
        type: 'object',
        properties: { ...SESSION_INPUT_PROPERTIES },
        required: ['sessionId', 'tenantId'],
      },
    }),
  );

  gateway.registerHandler('sandbox.session.snapshot', async (input) => {
    const raw = input as Record<string, unknown>;
    const tenantId = requireTenantId(raw);
    const { sessionId } = raw as { sessionId: string };
    return defaultSandboxClient.snapshot(sessionId, tenantId);
  });

  // ── sandbox.session.destroy ─────────────────────────────────────────────────
  registry.register(
    manifest({
      id: 'sandbox.session.destroy',
      name: 'Sandbox Session Destroy',
      version: '1.0.0',
      description: 'Destroy a sandbox session and clean up its workspace directory.',
      domainTags: ['infrastructure'],
      policyTier: 'operator-assisted',
      timeoutMs: 30_000,
      inputSchema: {
        type: 'object',
        properties: { ...SESSION_INPUT_PROPERTIES },
        required: ['sessionId', 'tenantId'],
      },
    }),
  );

  gateway.registerHandler('sandbox.session.destroy', async (input) => {
    const raw = input as Record<string, unknown>;
    const tenantId = requireTenantId(raw);
    const { sessionId } = raw as { sessionId: string };
    await defaultSandboxClient.destroySession(sessionId, tenantId);
    return { destroyed: true, sessionId };
  });

  // ── sandbox.fs.apply_patch ──────────────────────────────────────────────────
  registry.register(
    manifest({
      id: 'sandbox.fs.apply_patch',
      name: 'Sandbox Apply Patch',
      version: '1.0.0',
      description:
        'Apply a unified diff patch to a file in a sandbox workspace. ' +
        'Uses the system `patch` command via execFile (no shell injection surface).',
      domainTags: ['infrastructure'],
      policyTier: 'operator-assisted',
      approvalRequired: false,
      timeoutMs: 30_000,
      inputSchema: {
        type: 'object',
        properties: {
          ...SESSION_INPUT_PROPERTIES,
          path: {
            type: 'string',
            description: 'Workspace-relative path of the file to patch',
          },
          patch: {
            type: 'string',
            description: 'Unified diff patch content',
          },
        },
        required: ['sessionId', 'tenantId', 'path', 'patch'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          success: { type: 'boolean' },
          error: { type: 'string' },
        },
      },
      observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
    }),
  );

  gateway.registerHandler('sandbox.fs.apply_patch', async (input) => {
    const raw = input as Record<string, unknown>;
    const tenantId = requireTenantId(raw);
    const { sessionId, path, patch } = raw as {
      sessionId: string;
      path: string;
      patch: string;
    };
    const session = defaultSandboxClient.getSession(sessionId, tenantId);
    if (!session) throw new Error(`Session '${sessionId}' not found`);
    const { FilesystemCapability } = await import('./capabilities/filesystem.js');
    const fs = new FilesystemCapability({ workspaceRoot: session.workspaceRoot });
    return fs.applyPatch(path, patch);
  });

  // ── sandbox.fs.view_image ───────────────────────────────────────────────────
  registry.register(
    manifest({
      id: 'sandbox.fs.view_image',
      name: 'Sandbox View Image',
      version: '1.0.0',
      description:
        'Read an image file from a sandbox workspace and return it as a base64-encoded string. ' +
        'Suitable for passing to vision-capable models. Supports PNG, JPEG, GIF, SVG.',
      domainTags: ['infrastructure'],
      policyTier: 'internal-workflow',
      approvalRequired: false,
      timeoutMs: 10_000,
      inputSchema: {
        type: 'object',
        properties: {
          ...SESSION_INPUT_PROPERTIES,
          path: {
            type: 'string',
            description: 'Workspace-relative path of the image file',
          },
        },
        required: ['sessionId', 'tenantId', 'path'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          content: { type: 'string', description: 'Base64-encoded image content' },
          mimeType: { type: 'string' },
        },
      },
      observabilityHooks: { emitTrace: true, emitMetrics: false, sensitiveFields: [] },
    }),
  );

  gateway.registerHandler('sandbox.fs.view_image', async (input) => {
    const raw = input as Record<string, unknown>;
    const tenantId = requireTenantId(raw);
    const { sessionId, path } = raw as { sessionId: string; path: string };
    const session = defaultSandboxClient.getSession(sessionId, tenantId);
    if (!session) throw new Error(`Session '${sessionId}' not found`);
    const { FilesystemCapability } = await import('./capabilities/filesystem.js');
    const fs = new FilesystemCapability({ workspaceRoot: session.workspaceRoot });
    return fs.viewImage(path);
  });
}
