/**
 * Sandbox Runtime — Core Type System
 *
 * Follows the OpenAI sandbox contract (Manifest, Capabilities, Sessions,
 * Memory, Snapshots) but wired through SZL's governed fabric.
 */

import { z } from 'zod';

// ─── Manifest Entry Types ─────────────────────────────────────────────────────

/** Inline file content written directly to the workspace. */
export interface ManifestFileEntry {
  type: 'file';
  path: string;
  content: string;
  encoding?: 'utf8' | 'base64';
}

/** Inline directory (creates the directory and optionally populates files). */
export interface ManifestDirEntry {
  type: 'dir';
  path: string;
  files?: ManifestFileEntry[];
}

/** Copy a file from the host filesystem into the workspace. */
export interface ManifestLocalFileEntry {
  type: 'local_file';
  path: string;
  sourcePath: string;
}

/** Copy a directory from the host filesystem into the workspace. */
export interface ManifestLocalDirEntry {
  type: 'local_dir';
  path: string;
  sourcePath: string;
}

/**
 * Clone a public git repository into the workspace.
 * Private repos are out of scope for the initial release.
 */
export interface ManifestGitRepoEntry {
  type: 'git_repo';
  path: string;
  url: string;
  ref?: string;
}

/**
 * Cloud storage mount — schema defined for forward compatibility.
 * The Unix-local client does NOT materialize these; a cloud provider
 * client must be supplied to handle them.
 */
export interface ManifestS3Entry {
  type: 's3';
  path: string;
  bucket: string;
  key: string;
}

export type ManifestEntry =
  | ManifestFileEntry
  | ManifestDirEntry
  | ManifestLocalFileEntry
  | ManifestLocalDirEntry
  | ManifestGitRepoEntry
  | ManifestS3Entry;

// ─── Manifest ─────────────────────────────────────────────────────────────────

/** Describes the workspace contents and configuration for a sandbox session. */
export interface Manifest {
  id?: string;
  name?: string;
  entries: ManifestEntry[];
  /** Environment variables written to .env in the workspace root. */
  environment?: Record<string, string>;
  /** Directories inside the workspace expected to contain output artifacts. */
  outputDirs?: string[];
  /** Deny-list of additional shell command patterns for this specific sandbox. */
  blockedCommands?: string[];
  /** Max execution time in milliseconds for the session (default: unlimited). */
  maxDurationMs?: number;
}

// ─── Capabilities ─────────────────────────────────────────────────────────────

export type SandboxCapabilityType = 'shell' | 'filesystem' | 'memory' | 'skills';

export interface SandboxCapability {
  readonly type: SandboxCapabilityType;
  /** Human-readable description of what this capability can do. */
  readonly description: string;
}

// ─── Shell Execution ──────────────────────────────────────────────────────────

export interface ShellExecOptions {
  /** Command timeout in ms (default: 30_000). */
  timeoutMs?: number;
  /** Additional env vars merged with workspace .env. */
  env?: Record<string, string>;
  /** Working subdirectory relative to workspace root (default: workspace root). */
  cwd?: string;
}

export interface ShellExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
  command: string;
}

// ─── File Operations ──────────────────────────────────────────────────────────

export interface FileReadResult {
  path: string;
  content: string;
  encoding: 'utf8' | 'base64';
  sizeBytes: number;
  truncated: boolean;
}

export interface FileWriteResult {
  path: string;
  sizeBytes: number;
  created: boolean;
}

export interface DirEntry {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'symlink';
  sizeBytes?: number;
  modifiedAt?: string;
}

export interface ListDirResult {
  path: string;
  entries: DirEntry[];
  count: number;
}

export interface PatchResult {
  path: string;
  hunksApplied: number;
  linesAdded: number;
  linesRemoved: number;
}

// ─── Session State ────────────────────────────────────────────────────────────

export interface WorkspaceFileInventory {
  path: string;
  sizeBytes: number;
  modifiedAt: string;
}

export type SandboxSessionStatus = 'active' | 'idle' | 'suspended' | 'destroyed';

export interface SandboxSessionState {
  sessionId: string;
  /** Owning tenant org ID. Required for tenant isolation at the API layer. */
  tenantId: string;
  manifestId?: string;
  workspaceRoot: string;
  status: SandboxSessionStatus;
  createdAt: number;
  lastActiveAt: number;
  fileInventory: WorkspaceFileInventory[];
  environment: Record<string, string>;
  metadata?: Record<string, unknown>;
}

// ─── Snapshot ─────────────────────────────────────────────────────────────────

export interface SandboxSnapshotFile {
  path: string;
  content: string;
  encoding: 'utf8' | 'base64';
}

export interface SandboxSnapshot {
  snapshotId: string;
  sessionId: string;
  createdAt: number;
  files: SandboxSnapshotFile[];
  environment: Record<string, string>;
  metadata?: Record<string, unknown>;
}

// ─── Run Config ───────────────────────────────────────────────────────────────

export interface SandboxRunConfig {
  /** Override the default shell command timeout. */
  shellTimeoutMs?: number;
  /** Max output size per shell command in bytes (default: 1MB). */
  maxOutputBytes?: number;
  /** Whether sandbox steps require approval before execution. */
  requireApproval?: boolean;
  /** Whether to emit OTel spans for all sandbox operations. */
  emitTraces?: boolean;
  /** Domain label forwarded to Guardian for policy decisions. */
  domain?: string;
  /** Custom additional blocked command patterns. */
  blockedCommands?: string[];
  /** Whether to run the agent in dry-run mode (no real side effects). */
  dryRun?: boolean;
  /**
   * Permitted host directories for `local_file`/`local_dir` manifest entries.
   * Defaults to [] (deny-all). Must be set explicitly to allow host file copies.
   * Can also be set per-run via SandboxAgentOptions.allowedSourceRoots.
   */
  allowedSourceRoots?: string[];
}

// ─── Agent Run Result ─────────────────────────────────────────────────────────

export interface SandboxArtifact {
  path: string;
  sizeBytes: number;
  mimeType?: string;
  content?: string;
}

export interface SandboxAgentRunResult {
  runId: string;
  sessionId: string;
  objective: string;
  status: 'completed' | 'completed_with_errors' | 'failed' | 'timeout';
  summary?: string;
  artifacts: SandboxArtifact[];
  shellCommandsExecuted: number;
  filesRead: number;
  filesWritten: number;
  durationMs: number;
  stepResults: Array<{
    stepId: string;
    stepName: string;
    status: string;
    durationMs: number;
    error?: string;
  }>;
}

// ─── Zod Schemas (API validation) ────────────────────────────────────────────

export const ManifestFileEntrySchema = z.object({
  type: z.literal('file'),
  path: z.string().min(1),
  content: z.string(),
  encoding: z.enum(['utf8', 'base64']).default('utf8'),
});

export const ManifestDirEntrySchema = z.object({
  type: z.literal('dir'),
  path: z.string().min(1),
  files: z.array(ManifestFileEntrySchema).optional(),
});

export const ManifestLocalFileEntrySchema = z.object({
  type: z.literal('local_file'),
  path: z.string().min(1),
  sourcePath: z.string().min(1),
});

export const ManifestLocalDirEntrySchema = z.object({
  type: z.literal('local_dir'),
  path: z.string().min(1),
  sourcePath: z.string().min(1),
});

export const ManifestGitRepoEntrySchema = z.object({
  type: z.literal('git_repo'),
  path: z.string().min(1),
  url: z.string().url(),
  ref: z.string().optional(),
});

export const ManifestS3EntrySchema = z.object({
  type: z.literal('s3'),
  path: z.string().min(1),
  bucket: z.string().min(1),
  key: z.string().min(1),
});

export const ManifestEntrySchema = z.discriminatedUnion('type', [
  ManifestFileEntrySchema,
  ManifestDirEntrySchema,
  ManifestLocalFileEntrySchema,
  ManifestLocalDirEntrySchema,
  ManifestGitRepoEntrySchema,
  ManifestS3EntrySchema,
]);

export const ManifestSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  entries: z.array(ManifestEntrySchema).default([]),
  environment: z.record(z.string()).optional(),
  outputDirs: z.array(z.string()).optional(),
  blockedCommands: z.array(z.string()).optional(),
  maxDurationMs: z.number().positive().optional(),
});

export const SandboxRunConfigSchema = z.object({
  shellTimeoutMs: z.number().positive().optional(),
  maxOutputBytes: z.number().positive().optional(),
  requireApproval: z.boolean().optional(),
  emitTraces: z.boolean().optional(),
  domain: z.string().optional(),
  blockedCommands: z.array(z.string()).optional(),
  dryRun: z.boolean().optional(),
  allowedSourceRoots: z.array(z.string()).optional(),
});
