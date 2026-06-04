/**
 * Sandbox Runtime — Skills Capability
 *
 * Provides access to the SZL skills registry from within a sandbox session.
 * Agents can discover and invoke registered skills (prompt templates, tool
 * sequences, and capability bundles) by name.
 */

import type { SandboxCapability } from '../types.js';

export interface SkillDescriptor {
  id: string;
  name: string;
  description: string;
  tags: string[];
  version: string;
}

export interface SkillInvocationResult {
  skillId: string;
  status: 'completed' | 'failed' | 'not_found';
  output?: unknown;
  error?: string;
  durationMs: number;
}

export interface SkillsCapabilityOptions {
  /** Optional list of allowed skill IDs (allowlist). All skills allowed if omitted. */
  allowedSkillIds?: string[];
  /** Optional list of blocked skill IDs (denylist). */
  blockedSkillIds?: string[];
}

/**
 * SkillsCapability exposes skill discovery and invocation to sandbox agents.
 * All skill invocations are logged and can be gated by an allowlist.
 */
export class SkillsCapability implements SandboxCapability {
  readonly type = 'skills' as const;
  readonly description = 'Discover and invoke SZL skills from within a sandbox session.';

  private readonly allowedSkillIds?: Set<string>;
  private readonly blockedSkillIds: Set<string>;

  constructor(opts: SkillsCapabilityOptions = {}) {
    this.allowedSkillIds = opts.allowedSkillIds
      ? new Set(opts.allowedSkillIds)
      : undefined;
    this.blockedSkillIds = new Set(opts.blockedSkillIds ?? []);
  }

  /**
   * List all skills discoverable by this sandbox session.
   * Respects allowlist and blocklist filters.
   */
  async listSkills(): Promise<{ skills: SkillDescriptor[]; count: number }> {
    const { defaultSkillRegistry } = await importSkillRegistry();
    const all: SkillDescriptor[] = defaultSkillRegistry.list().map(normalizeDescriptor);
    const filtered = all.filter((s) => this.isAllowed(s.id));
    return { skills: filtered, count: filtered.length };
  }

  /**
   * Look up a skill by ID.
   * Returns null if not found or not allowed.
   */
  async getSkill(skillId: string): Promise<SkillDescriptor | null> {
    if (!this.isAllowed(skillId)) return null;
    const { defaultSkillRegistry } = await importSkillRegistry();
    const skill = defaultSkillRegistry.get(skillId);
    return skill ? normalizeDescriptor(skill) : null;
  }

  /**
   * Invoke a skill by ID with optional arguments.
   * Returns a structured result — never throws on skill failure.
   */
  async invokeSkill(
    skillId: string,
    args: Record<string, unknown> = {},
  ): Promise<SkillInvocationResult> {
    const start = Date.now();
    if (!this.isAllowed(skillId)) {
      return {
        skillId,
        status: 'failed',
        error: `Skill '${skillId}' is not permitted in this sandbox session.`,
        durationMs: Date.now() - start,
      };
    }

    try {
      const { defaultSkillRegistry } = await importSkillRegistry();
      const skill = defaultSkillRegistry.get(skillId);
      if (!skill) {
        return { skillId, status: 'not_found', durationMs: Date.now() - start };
      }

      const output = await defaultSkillRegistry.invoke(skillId, args);
      return { skillId, status: 'completed', output, durationMs: Date.now() - start };
    } catch (err) {
      return {
        skillId,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      };
    }
  }

  private isAllowed(skillId: string): boolean {
    if (this.blockedSkillIds.has(skillId)) return false;
    if (this.allowedSkillIds && !this.allowedSkillIds.has(skillId)) return false;
    return true;
  }
}

// ─── Registry shim ────────────────────────────────────────────────────────────
// Dynamic import keeps sandbox-runtime from hard-coupling to agents-core skill
// registry at parse time. Resolves to a no-op shim when the registry package
// is unavailable (e.g., in unit test environments).

interface SkillRegistry {
  list(): Array<{ id: string; name: string; description: string; tags?: string[]; version?: string }>;
  get(id: string): { id: string; name: string; description: string; tags?: string[]; version?: string } | undefined;
  invoke(id: string, args: Record<string, unknown>): Promise<unknown>;
}

interface RegistryModule {
  defaultSkillRegistry: SkillRegistry;
}

async function importSkillRegistry(): Promise<RegistryModule> {
  try {
    // @ts-expect-error — sub-path may not be declared in agents-core types yet
    return await import('@workspace/agents-core/skill-registry') as RegistryModule;
  } catch {
    return {
      defaultSkillRegistry: {
        list: () => [],
        get: () => undefined,
        invoke: async () => {
          throw new Error('Skill registry unavailable in this environment');
        },
      },
    };
  }
}

function normalizeDescriptor(
  raw: { id: string; name: string; description: string; tags?: string[]; version?: string },
): SkillDescriptor {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    tags: raw.tags ?? [],
    version: raw.version ?? '0.0.0',
  };
}
