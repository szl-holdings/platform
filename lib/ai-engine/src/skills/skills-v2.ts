/**
 * Skills v2 — Filesystem-Discovered Skill Packages
 *
 * Adopts Claude Code's SKILL.md frontmatter convention. Skills are
 * discovered from lib/ai-engine/src/skills/library/<skill>/SKILL.md,
 * hot-reloaded on file change, and resolvable by ID.
 *
 * Existing programmatic registrations keep working via the compatibility
 * shim: registerSkill() in skill-registry.ts still works and skills appear
 * alongside filesystem-discovered ones.
 *
 * Frontmatter schema (YAML):
 *   name, description, version, owner, allowed_tools, allowed_mcp_servers,
 *   model, permission_mode, eligibility_constitution_clause,
 *   covenant_policy_bundle, eval_set, telemetry_schema, category,
 *   applicable_agents, trigger_keywords, chainable_with
 */

import { readFileSync, readdirSync, statSync, watch as fsWatch } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Frontmatter types
// ---------------------------------------------------------------------------

export type PermissionMode = 'read-only' | 'plan-only' | 'auto-approve-low-risk' | 'hitl-required' | 'sovereign-air-gapped';

export interface SkillV2 {
  skill_id: string;
  name: string;
  description: string;
  version: string;
  owner: string;
  category: string;
  model?: string;
  permission_mode: PermissionMode;
  allowed_tools: string[];
  blocked_tools: string[];
  allowed_mcp_servers: string[];
  eligibility_constitution_clause?: string;
  covenant_policy_bundle?: string;
  eval_set?: string;
  telemetry_schema?: string;
  applicable_agents: string[];
  trigger_keywords: string[];
  chainable_with: string[];
  eval_pass_rate?: number;
  source: 'filesystem' | 'programmatic';
  skill_md_path?: string;
  registered_at: string;
}

// ---------------------------------------------------------------------------
// Frontmatter parser (simple YAML-like for skill metadata)
// ---------------------------------------------------------------------------

function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1]!;
  const result: Record<string, unknown> = {};

  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().replace(/-/g, '_');
    const rawValue = line.slice(colonIdx + 1).trim();

    if (rawValue.startsWith('[')) {
      try {
        result[key] = JSON.parse(rawValue.replace(/'/g, '"'));
      } catch {
        result[key] = rawValue
          .slice(1, -1)
          .split(',')
          .map(s => s.trim().replace(/['"]/g, ''))
          .filter(Boolean);
      }
    } else if (rawValue === 'true') {
      result[key] = true;
    } else if (rawValue === 'false') {
      result[key] = false;
    } else if (/^\d+\.?\d*$/.test(rawValue)) {
      result[key] = Number(rawValue);
    } else {
      result[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Filesystem discovery
// ---------------------------------------------------------------------------

const LIBRARY_ROOT = join(__dirname, 'library');

function discoverSkillFiles(): string[] {
  try {
    const entries = readdirSync(LIBRARY_ROOT);
    const skillFiles: string[] = [];
    for (const entry of entries) {
      const dir = join(LIBRARY_ROOT, entry);
      try {
        if (statSync(dir).isDirectory()) {
          const skillMd = join(dir, 'SKILL.md');
          try {
            statSync(skillMd);
            skillFiles.push(skillMd);
          } catch {
            // no SKILL.md in this directory
          }
        }
      } catch {
        // stat failed
      }
    }
    return skillFiles;
  } catch {
    return [];
  }
}

function loadSkillFromFile(skillMdPath: string): SkillV2 | null {
  try {
    const content = readFileSync(skillMdPath, 'utf8');
    const fm = parseFrontmatter(content);
    const skillId = skillMdPath.split('/').slice(-2)[0]!.replace(/_/g, '-');

    return {
      skill_id: (fm.skill_id as string) ?? skillId,
      name: (fm.name as string) ?? skillId,
      description: (fm.description as string) ?? '',
      version: (fm.version as string) ?? '1.0.0',
      owner: (fm.owner as string) ?? 'unknown',
      category: (fm.category as string) ?? 'general',
      model: fm.model as string | undefined,
      permission_mode: (fm.permission_mode as PermissionMode) ?? 'hitl-required',
      allowed_tools: (fm.allowed_tools as string[]) ?? [],
      blocked_tools: (fm.blocked_tools as string[]) ?? [],
      allowed_mcp_servers: (fm.allowed_mcp_servers as string[]) ?? [],
      eligibility_constitution_clause: fm.eligibility_constitution_clause as string | undefined,
      covenant_policy_bundle: fm.covenant_policy_bundle as string | undefined,
      eval_set: fm.eval_set as string | undefined,
      telemetry_schema: fm.telemetry_schema as string | undefined,
      applicable_agents: (fm.applicable_agents as string[]) ?? [],
      trigger_keywords: (fm.trigger_keywords as string[]) ?? [],
      chainable_with: (fm.chainable_with as string[]) ?? [],
      eval_pass_rate: fm.eval_pass_rate as number | undefined,
      source: 'filesystem',
      skill_md_path: skillMdPath,
      registered_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Registry v2
// ---------------------------------------------------------------------------

const v2Registry = new Map<string, SkillV2>();
let lastDiscoveryMs = 0;
const DISCOVERY_TTL_MS = 30_000;

function reloadSkillFile(filePath: string): void {
  const skill = loadSkillFromFile(filePath);
  if (skill) v2Registry.set(skill.skill_id, skill);
}

function refreshIfStale(): void {
  const now = Date.now();
  if (now - lastDiscoveryMs < DISCOVERY_TTL_MS) return;
  lastDiscoveryMs = now;

  const skillFiles = discoverSkillFiles();
  for (const filePath of skillFiles) {
    reloadSkillFile(filePath);
  }
}

// FS watcher — hot-reload on SKILL.md file changes. Fires before TTL, so edits
// to any SKILL.md in the library/ directory are reflected immediately without a
// server restart. TTL-based refresh remains as fallback for new skill directories.
try {
  fsWatch(LIBRARY_ROOT, { recursive: true }, (_event, filename) => {
    if (!filename || !filename.endsWith('SKILL.md')) return;
    const fullPath = join(LIBRARY_ROOT, filename);
    try {
      statSync(fullPath); // ensure file still exists (not deleted)
      reloadSkillFile(fullPath);
      lastDiscoveryMs = 0; // also invalidate TTL cache so next getAllSkillsV2 re-scans
    } catch {
      // file removed — remove from registry
      for (const [id, skill] of v2Registry.entries()) {
        if (skill.skill_md_path === fullPath) {
          v2Registry.delete(id);
          break;
        }
      }
    }
  });
} catch {
  // LIBRARY_ROOT may not exist yet (no SKILL.md files); watcher is best-effort.
  // TTL-based refresh still works.
}

export function registerSkillV2(skill: Omit<SkillV2, 'registered_at'>): void {
  v2Registry.set(skill.skill_id, { ...skill, registered_at: new Date().toISOString() });
}

export function getSkillV2(id: string): SkillV2 | null {
  refreshIfStale();
  return v2Registry.get(id) ?? null;
}

export function getAllSkillsV2(): SkillV2[] {
  refreshIfStale();
  return Array.from(v2Registry.values());
}

export function discoverSkillsV2ForQuery(query: string, agentId?: string): SkillV2[] {
  refreshIfStale();
  const lower = query.toLowerCase();
  return Array.from(v2Registry.values())
    .filter(s => !agentId || s.applicable_agents.includes(agentId) || s.applicable_agents.length === 0)
    .map(s => {
      let score = 0;
      for (const kw of s.trigger_keywords) {
        if (lower.includes(kw.toLowerCase())) score += 3;
      }
      const desc = `${s.name} ${s.description}`.toLowerCase();
      for (const word of lower.split(/\s+/).filter(w => w.length > 3)) {
        if (desc.includes(word)) score += 1;
      }
      return { skill: s, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(x => x.skill);
}

// ---------------------------------------------------------------------------
// Compatibility shim: keep old SkillPackage registrations working
// ---------------------------------------------------------------------------

import type { SkillPackage } from './skill-registry.js';

export function shimFromSkillPackage(pkg: SkillPackage): SkillV2 {
  return {
    skill_id: pkg.skillId,
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    owner: 'legacy',
    category: pkg.category,
    model: undefined,
    permission_mode: 'hitl-required',
    allowed_tools: [],
    blocked_tools: [],
    allowed_mcp_servers: [],
    applicable_agents: pkg.applicableAgents,
    trigger_keywords: pkg.triggerConditions.keywords,
    chainable_with: pkg.chainableWith,
    source: 'programmatic',
    registered_at: new Date().toISOString(),
  };
}

// Seed from existing registry at startup
import { getAllSkills } from './skill-registry.js';
for (const pkg of getAllSkills()) {
  v2Registry.set(pkg.skillId, shimFromSkillPackage(pkg));
}
