/**
 * @workspace/sandbox-runtime — Governed Execution Environments
 *
 * OpenAI Agents Sandbox architecture implemented natively within SZL's
 * governed fabric. Every sandbox operation flows through Guardian, Policy
 * Engine, and Tool Mesh.
 *
 * Core exports:
 * - SandboxAgent          — runs objectives inside governed workspaces
 * - SandboxSession        — manages workspace lifecycle (create/serialize/resume/destroy)
 * - Manifest              — describes workspace contents
 * - UnixLocalSandboxClient — creates and manages sessions on the local filesystem
 * - ShellCapability       — governed shell execution
 * - FilesystemCapability  — governed file read/write/list
 * - MemoryCapability      — cross-run workspace memory
 * - registerSandboxTools  — registers all tools in the Tool Mesh
 */

export * from './types.js';
export { SandboxSession, defaultSessionStore } from './session.js';
export { SandboxAgent, createSandboxAgent } from './agent.js';
export { UnixLocalSandboxClient, defaultSandboxClient } from './client.js';
export { ShellCapability, DEFAULT_BLOCKED_PATTERNS } from './capabilities/shell.js';
export { FilesystemCapability } from './capabilities/filesystem.js';
export { MemoryCapability } from './capabilities/memory.js';
export { SkillsCapability, type SkillDescriptor, type SkillInvocationResult } from './capabilities/skills.js';
export { materializeManifest, validateWorkspacePath, validateWorkspacePathSafe, PathTraversalError, type MaterializeOptions } from './materializer.js';
export { registerSandboxTools } from './tool-registrations.js';
export {
  createSandboxStepExecutor,
  type SandboxPlanStep,
  type SandboxStepContext,
  type SandboxStepExecutorOptions,
} from './cognitive-executor.js';
export { redactPii } from './capabilities/shell.js';
