import { z } from "zod";
import { pool } from "@szl-holdings/db";
import { logger } from "../logger";

export type AutonomyLevel = "observer" | "advisor" | "operator";
export type ConsentCategory = "functional" | "analytics" | "personalization" | "action";
export type SkillDomain = "maritime" | "security" | "legal" | "real-estate" | "ai-ops" | "advisory" | "orchestration" | "content" | "data" | "productivity" | "visual" | "communication" | "intelligence" | "media";
export type SkillStatus = "active" | "degraded" | "inactive" | "deprecated";

export interface SkillVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface SkillComposabilitySpec {
  canChainWith: string[];
  canBeChainedBy: string[];
  maxChainDepth: number;
  parallelizable: boolean;
}

export interface SkillOrgConfig {
  orgId: string;
  enabled: boolean;
  autonomyLevelOverride?: AutonomyLevel;
  customConfig?: Record<string, unknown>;
  updatedAt: Date;
}

export interface SkillRegistryEntry {
  skillId: string;
  version: SkillVersion;
  label: string;
  description: string;
  category: string;
  domains: SkillDomain[];
  agentIds: string[];
  status: SkillStatus;
  requiredAutonomyLevel: AutonomyLevel;
  consentCategory: ConsentCategory;
  composability: SkillComposabilitySpec;
  inputSchema: z.ZodType<any>;
  outputSchema: z.ZodType<any>;
  invocations: number;
  successfulInvocations: number;
  avgLatencyMs: number;
  lastUsedAt: Date | null;
  registeredAt: Date;
  updatedAt: Date;
  orgConfigs: SkillOrgConfig[];
  tags: string[];
}

export interface SkillRegistryRow {
  skill_id: string;
  version_major: number;
  version_minor: number;
  version_patch: number;
  label: string;
  description: string;
  category: string;
  domains: string[];
  agent_ids: string[];
  status: string;
  required_autonomy_level: string;
  consent_category: string;
  composability: Record<string, unknown>;
  input_schema_json: string;
  output_schema_json: string;
  invocations: number;
  successful_invocations: number;
  avg_latency_ms: number;
  last_used_at: Date | null;
  registered_at: Date;
  updated_at: Date;
  tags: string[];
}

const SKILL_DEFINITIONS: Array<{
  skillId: string;
  version: SkillVersion;
  label: string;
  description: string;
  category: string;
  domains: SkillDomain[];
  agentIds: string[];
  requiredAutonomyLevel: AutonomyLevel;
  consentCategory: ConsentCategory;
  composability: SkillComposabilitySpec;
  tags: string[];
}> = [
  {
    skillId: "presentation-engine",
    version: { major: 2, minor: 0, patch: 0 },
    label: "AI Presentation Engine",
    description: "Generate structured slide decks (investor pitches, board briefs, client presentations) from natural language prompts with domain-aware tone profiles",
    category: "content",
    domains: ["orchestration", "advisory", "ai-ops"],
    agentIds: ["szl-orchestrator", "carlota-advisory", "lyte-aiops"],
    requiredAutonomyLevel: "advisor",
    consentCategory: "functional",
    composability: {
      canChainWith: ["email-composer", "content-engine", "design-studio", "viz-engine"],
      canBeChainedBy: ["knowledge-vault", "smart-spreadsheet"],
      maxChainDepth: 4,
      parallelizable: false,
    },
    tags: ["presentations", "slides", "content", "visual"],
  },
  {
    skillId: "email-composer",
    version: { major: 2, minor: 0, patch: 0 },
    label: "AI Email Composer",
    description: "Smart email drafting, reply suggestions, tone adjustment, and thread summarization with domain-aware tone profiles for legal, maritime, security, and executive contexts",
    category: "communication",
    domains: ["legal", "maritime", "security", "orchestration"],
    agentIds: ["prism-legal", "vessels-intelligence", "aegis-defense", "szl-orchestrator"],
    requiredAutonomyLevel: "advisor",
    consentCategory: "functional",
    composability: {
      canChainWith: ["content-engine", "scheduling-engine", "meeting-intel"],
      canBeChainedBy: ["presentation-engine", "knowledge-vault"],
      maxChainDepth: 3,
      parallelizable: true,
    },
    tags: ["email", "communication", "drafting", "tone"],
  },
  {
    skillId: "design-studio",
    version: { major: 2, minor: 0, patch: 0 },
    label: "AI Image & Design Studio",
    description: "On-demand generation of charts, diagrams, branded assets, and marketing visuals with domain-specific styling",
    category: "visual",
    domains: ["orchestration", "advisory", "ai-ops"],
    agentIds: ["szl-orchestrator", "lyte-aiops", "carlota-advisory"],
    requiredAutonomyLevel: "observer",
    consentCategory: "functional",
    composability: {
      canChainWith: ["presentation-engine", "content-engine", "viz-engine"],
      canBeChainedBy: ["presentation-engine", "content-engine"],
      maxChainDepth: 2,
      parallelizable: true,
    },
    tags: ["design", "visual", "graphics", "branding"],
  },
  {
    skillId: "smart-spreadsheet",
    version: { major: 2, minor: 0, patch: 0 },
    label: "AI Smart Spreadsheet",
    description: "Natural language data queries returning structured tables, pivot analyses, and exportable CSV for deal sheets, fleet manifests, and incident matrices",
    category: "data",
    domains: ["real-estate", "maritime", "security", "orchestration", "ai-ops"],
    agentIds: ["terra-realestate", "vessels-intelligence", "aegis-defense", "szl-orchestrator"],
    requiredAutonomyLevel: "observer",
    consentCategory: "analytics",
    composability: {
      canChainWith: ["viz-engine", "presentation-engine", "content-engine"],
      canBeChainedBy: ["knowledge-vault", "viz-engine"],
      maxChainDepth: 3,
      parallelizable: true,
    },
    tags: ["data", "tables", "spreadsheet", "export", "analytics"],
  },
  {
    skillId: "scheduling-engine",
    version: { major: 2, minor: 0, patch: 0 },
    label: "AI Scheduling Intelligence",
    description: "Calendar-aware scheduling with timezone awareness, priority scoring, and conflict detection. Powers the Carlota Jo Rhythm Calendar",
    category: "productivity",
    domains: ["advisory", "orchestration", "ai-ops"],
    agentIds: ["carlota-advisory", "szl-orchestrator", "lyte-aiops"],
    requiredAutonomyLevel: "advisor",
    consentCategory: "personalization",
    composability: {
      canChainWith: ["email-composer", "meeting-intel", "content-engine"],
      canBeChainedBy: ["meeting-intel"],
      maxChainDepth: 3,
      parallelizable: false,
    },
    tags: ["scheduling", "calendar", "productivity", "meetings"],
  },
  {
    skillId: "content-engine",
    version: { major: 2, minor: 0, patch: 0 },
    label: "AI Writing & Content Engine",
    description: "Long-form content generation with domain-specific tone profiles: legal (PRISM), executive (SZL), advisory (Carlota Jo), operational (Lyte). Supports style transfer and multi-format output",
    category: "content",
    domains: ["legal", "orchestration", "advisory", "ai-ops"],
    agentIds: ["prism-legal", "szl-orchestrator", "carlota-advisory", "lyte-aiops"],
    requiredAutonomyLevel: "advisor",
    consentCategory: "functional",
    composability: {
      canChainWith: ["email-composer", "presentation-engine", "design-studio", "scheduling-engine"],
      canBeChainedBy: ["knowledge-vault", "meeting-intel"],
      maxChainDepth: 4,
      parallelizable: true,
    },
    tags: ["content", "writing", "reports", "proposals", "legal"],
  },
  {
    skillId: "video-engine",
    version: { major: 2, minor: 0, patch: 0 },
    label: "AI Video Generation",
    description: "Agent-driven creation of summary videos, briefing clips, and data walkthroughs from structured content",
    category: "media",
    domains: ["orchestration", "security", "real-estate"],
    agentIds: ["szl-orchestrator", "aegis-defense", "terra-realestate"],
    requiredAutonomyLevel: "advisor",
    consentCategory: "functional",
    composability: {
      canChainWith: ["presentation-engine", "content-engine"],
      canBeChainedBy: ["presentation-engine"],
      maxChainDepth: 2,
      parallelizable: false,
    },
    tags: ["video", "media", "briefings", "walkthroughs"],
  },
  {
    skillId: "meeting-intel",
    version: { major: 2, minor: 0, patch: 0 },
    label: "AI Meeting Intelligence",
    description: "Transcription processing, summarization, action item extraction, and automated follow-up scheduling with domain-aware parsing",
    category: "productivity",
    domains: ["legal", "ai-ops", "advisory"],
    agentIds: ["prism-legal", "lyte-aiops", "carlota-advisory"],
    requiredAutonomyLevel: "observer",
    consentCategory: "functional",
    composability: {
      canChainWith: ["email-composer", "scheduling-engine", "content-engine", "knowledge-vault"],
      canBeChainedBy: ["scheduling-engine"],
      maxChainDepth: 3,
      parallelizable: false,
    },
    tags: ["meetings", "transcription", "action-items", "follow-up"],
  },
  {
    skillId: "viz-engine",
    version: { major: 2, minor: 0, patch: 0 },
    label: "AI Data Visualization",
    description: "Natural language to interactive chart generation (Recharts-compatible) from any data source with domain-specific visual templates",
    category: "data",
    domains: ["orchestration", "ai-ops", "maritime", "real-estate", "security"],
    agentIds: ["szl-orchestrator", "lyte-aiops", "vessels-intelligence", "terra-realestate", "aegis-defense"],
    requiredAutonomyLevel: "observer",
    consentCategory: "analytics",
    composability: {
      canChainWith: ["presentation-engine", "smart-spreadsheet", "content-engine"],
      canBeChainedBy: ["smart-spreadsheet", "knowledge-vault"],
      maxChainDepth: 3,
      parallelizable: true,
    },
    tags: ["visualization", "charts", "data", "recharts", "analytics"],
  },
  {
    skillId: "knowledge-vault",
    version: { major: 2, minor: 0, patch: 0 },
    label: "AI Knowledge Vault",
    description: "Self-organizing cross-domain knowledge base with auto-tagging, smart linking, and semantic retrieval across all SZL domains",
    category: "intelligence",
    domains: ["orchestration", "legal", "maritime", "security", "real-estate", "advisory", "ai-ops"],
    agentIds: ["szl-orchestrator", "prism-legal", "vessels-intelligence", "aegis-defense", "terra-realestate", "carlota-advisory", "lyte-aiops"],
    requiredAutonomyLevel: "observer",
    consentCategory: "personalization",
    composability: {
      canChainWith: ["content-engine", "email-composer", "viz-engine", "presentation-engine", "smart-spreadsheet"],
      canBeChainedBy: ["meeting-intel"],
      maxChainDepth: 4,
      parallelizable: true,
    },
    tags: ["knowledge", "retrieval", "semantic-search", "intelligence", "cross-domain"],
  },
];

export async function ensureSkillsRegistryTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_skills_registry (
        skill_id TEXT PRIMARY KEY,
        version_major INTEGER NOT NULL DEFAULT 1,
        version_minor INTEGER NOT NULL DEFAULT 0,
        version_patch INTEGER NOT NULL DEFAULT 0,
        label TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        domains TEXT[] NOT NULL DEFAULT '{}',
        agent_ids TEXT[] NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'active',
        required_autonomy_level TEXT NOT NULL DEFAULT 'observer',
        consent_category TEXT NOT NULL DEFAULT 'functional',
        composability JSONB NOT NULL DEFAULT '{}',
        input_schema_json TEXT NOT NULL DEFAULT '{}',
        output_schema_json TEXT NOT NULL DEFAULT '{}',
        invocations BIGINT NOT NULL DEFAULT 0,
        successful_invocations BIGINT NOT NULL DEFAULT 0,
        avg_latency_ms FLOAT NOT NULL DEFAULT 0,
        last_used_at TIMESTAMPTZ,
        registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        tags TEXT[] NOT NULL DEFAULT '{}'
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_skill_org_configs (
        id BIGSERIAL PRIMARY KEY,
        skill_id TEXT NOT NULL REFERENCES ai_skills_registry(skill_id) ON DELETE CASCADE,
        org_id TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        autonomy_level_override TEXT,
        custom_config JSONB DEFAULT '{}',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(skill_id, org_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_user_autonomy_prefs (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        skill_id TEXT NOT NULL REFERENCES ai_skills_registry(skill_id) ON DELETE CASCADE,
        autonomy_level TEXT NOT NULL DEFAULT 'observer',
        consent_given BOOLEAN NOT NULL DEFAULT FALSE,
        consent_given_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, skill_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_skill_compositions (
        id BIGSERIAL PRIMARY KEY,
        composition_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        creator_id TEXT,
        org_id TEXT,
        steps JSONB NOT NULL DEFAULT '[]',
        approval_gates JSONB NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'active',
        invocations BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_skills_registry_category ON ai_skills_registry(category);
      CREATE INDEX IF NOT EXISTS idx_skills_registry_status ON ai_skills_registry(status);
      CREATE INDEX IF NOT EXISTS idx_skills_registry_updated_at ON ai_skills_registry(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_skill_org_configs_org_id ON ai_skill_org_configs(org_id);
      CREATE INDEX IF NOT EXISTS idx_user_autonomy_prefs_user_id ON ai_user_autonomy_prefs(user_id);
    `);

    for (const skill of SKILL_DEFINITIONS) {
      await pool.query(
        `INSERT INTO ai_skills_registry
         (skill_id, version_major, version_minor, version_patch, label, description, category, domains, agent_ids,
          status, required_autonomy_level, consent_category, composability, input_schema_json, output_schema_json,
          tags, registered_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',$10,$11,$12,'{}','{}', $13, NOW(), NOW())
         ON CONFLICT (skill_id) DO UPDATE SET
           version_major = EXCLUDED.version_major,
           version_minor = EXCLUDED.version_minor,
           version_patch = EXCLUDED.version_patch,
           label = EXCLUDED.label,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           domains = EXCLUDED.domains,
           agent_ids = EXCLUDED.agent_ids,
           required_autonomy_level = EXCLUDED.required_autonomy_level,
           consent_category = EXCLUDED.consent_category,
           composability = EXCLUDED.composability,
           tags = EXCLUDED.tags,
           updated_at = NOW()`,
        [
          skill.skillId,
          skill.version.major, skill.version.minor, skill.version.patch,
          skill.label, skill.description, skill.category,
          skill.domains, skill.agentIds,
          skill.requiredAutonomyLevel, skill.consentCategory,
          JSON.stringify(skill.composability),
          skill.tags,
        ]
      );
    }

    logger.info({ count: SKILL_DEFINITIONS.length }, "Skills registry initialized");
  } catch (err) {
    logger.warn({ err }, "Failed to init skills registry (non-fatal)");
  }
}

export async function listSkills(filters?: {
  category?: string;
  domain?: string;
  status?: string;
  orgId?: string;
  search?: string;
}): Promise<SkillRegistryRow[]> {
  const conditions = ["1=1"];
  const params: any[] = [];
  let idx = 1;

  if (filters?.category) { conditions.push(`category = $${idx}`); params.push(filters.category); idx++; }
  if (filters?.domain) { conditions.push(`$${idx} = ANY(domains)`); params.push(filters.domain); idx++; }
  if (filters?.status) { conditions.push(`status = $${idx}`); params.push(filters.status); idx++; }
  if (filters?.search) {
    conditions.push(`(label ILIKE $${idx} OR description ILIKE $${idx} OR $${idx} = ANY(tags))`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const result = await pool.query(
    `SELECT * FROM ai_skills_registry WHERE ${conditions.join(" AND ")} ORDER BY category, label`,
    params
  );
  return result.rows;
}

export async function getSkill(skillId: string): Promise<SkillRegistryRow | null> {
  const result = await pool.query("SELECT * FROM ai_skills_registry WHERE skill_id = $1", [skillId]);
  return result.rows[0] ?? null;
}

export async function updateSkillStatus(skillId: string, status: SkillStatus): Promise<void> {
  await pool.query(
    "UPDATE ai_skills_registry SET status = $2, updated_at = NOW() WHERE skill_id = $1",
    [skillId, status]
  );
}

export async function setSkillOrgConfig(
  skillId: string,
  orgId: string,
  config: { enabled?: boolean; autonomyLevelOverride?: AutonomyLevel; customConfig?: Record<string, unknown> }
): Promise<void> {
  await pool.query(
    `INSERT INTO ai_skill_org_configs (skill_id, org_id, enabled, autonomy_level_override, custom_config, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (skill_id, org_id) DO UPDATE SET
       enabled = COALESCE($3, ai_skill_org_configs.enabled),
       autonomy_level_override = COALESCE($4, ai_skill_org_configs.autonomy_level_override),
       custom_config = COALESCE($5, ai_skill_org_configs.custom_config),
       updated_at = NOW()`,
    [skillId, orgId, config.enabled ?? true, config.autonomyLevelOverride ?? null, JSON.stringify(config.customConfig ?? {})]
  );
}

export async function getSkillOrgConfigs(skillId: string): Promise<SkillOrgConfig[]> {
  const result = await pool.query(
    "SELECT * FROM ai_skill_org_configs WHERE skill_id = $1 ORDER BY org_id",
    [skillId]
  );
  return result.rows.map((r: any) => ({
    orgId: r.org_id,
    enabled: r.enabled,
    autonomyLevelOverride: r.autonomy_level_override,
    customConfig: r.custom_config,
    updatedAt: r.updated_at,
  }));
}

export async function isSkillEnabledForOrg(skillId: string, orgId: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT enabled FROM ai_skill_org_configs WHERE skill_id = $1 AND org_id = $2",
    [skillId, orgId]
  );
  if (result.rows.length === 0) return true;
  return result.rows[0].enabled;
}

export async function getUserAutonomyLevel(
  userId: string,
  skillId: string
): Promise<AutonomyLevel> {
  const result = await pool.query(
    "SELECT autonomy_level FROM ai_user_autonomy_prefs WHERE user_id = $1 AND skill_id = $2",
    [userId, skillId]
  );
  return result.rows[0]?.autonomy_level ?? "observer";
}

export async function setUserAutonomyLevel(
  userId: string,
  skillId: string,
  level: AutonomyLevel,
  consentGiven = false
): Promise<void> {
  await pool.query(
    `INSERT INTO ai_user_autonomy_prefs (user_id, skill_id, autonomy_level, consent_given, consent_given_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (user_id, skill_id) DO UPDATE SET
       autonomy_level = $3,
       consent_given = $4,
       consent_given_at = CASE WHEN $4 THEN NOW() ELSE ai_user_autonomy_prefs.consent_given_at END,
       updated_at = NOW()`,
    [userId, skillId, level, consentGiven, consentGiven ? new Date() : null]
  );
}

export async function getUserAutonomyPrefs(userId: string): Promise<Array<{ skillId: string; autonomyLevel: AutonomyLevel; consentGiven: boolean }>> {
  const result = await pool.query(
    "SELECT skill_id, autonomy_level, consent_given FROM ai_user_autonomy_prefs WHERE user_id = $1",
    [userId]
  );
  return result.rows.map((r: any) => ({
    skillId: r.skill_id,
    autonomyLevel: r.autonomy_level,
    consentGiven: r.consent_given,
  }));
}

export async function recordSkillInvocation(
  skillId: string,
  success: boolean,
  latencyMs: number
): Promise<void> {
  try {
    await pool.query(
      `UPDATE ai_skills_registry SET
         invocations = invocations + 1,
         successful_invocations = successful_invocations + $2::int,
         avg_latency_ms = (avg_latency_ms * invocations + $3) / (invocations + 1),
         last_used_at = NOW(),
         updated_at = NOW()
       WHERE skill_id = $1`,
      [skillId, success ? 1 : 0, latencyMs]
    );
  } catch {}
}

export async function getSkillMetrics(skillId: string): Promise<{
  invocations: number;
  successRate: number;
  avgLatencyMs: number;
  lastUsedAt: Date | null;
}> {
  const result = await pool.query(
    "SELECT invocations, successful_invocations, avg_latency_ms, last_used_at FROM ai_skills_registry WHERE skill_id = $1",
    [skillId]
  );
  const row = result.rows[0];
  if (!row) return { invocations: 0, successRate: 0, avgLatencyMs: 0, lastUsedAt: null };
  return {
    invocations: parseInt(row.invocations),
    successRate: row.invocations > 0 ? row.successful_invocations / row.invocations : 0,
    avgLatencyMs: parseFloat(row.avg_latency_ms),
    lastUsedAt: row.last_used_at,
  };
}

export async function getSkillsStats(): Promise<{
  total: number;
  active: number;
  byCategory: Record<string, number>;
  topByUsage: Array<{ skillId: string; label: string; invocations: number }>;
}> {
  const [totalResult, categoryResult, topResult] = await Promise.all([
    pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'active') as active FROM ai_skills_registry"),
    pool.query("SELECT category, COUNT(*) as cnt FROM ai_skills_registry GROUP BY category"),
    pool.query("SELECT skill_id, label, invocations FROM ai_skills_registry ORDER BY invocations DESC LIMIT 5"),
  ]);

  const byCategory: Record<string, number> = {};
  for (const row of categoryResult.rows) {
    byCategory[row.category] = parseInt(row.cnt);
  }

  return {
    total: parseInt(totalResult.rows[0]?.total ?? "0"),
    active: parseInt(totalResult.rows[0]?.active ?? "0"),
    byCategory,
    topByUsage: topResult.rows.map((r: any) => ({
      skillId: r.skill_id,
      label: r.label,
      invocations: parseInt(r.invocations),
    })),
  };
}

export async function saveSkillComposition(composition: {
  compositionId: string;
  name: string;
  description?: string;
  creatorId?: string;
  orgId?: string;
  steps: Array<{ skillId: string; label?: string; config?: Record<string, unknown>; dependsOn?: string[]; approvalRequired?: boolean; timeoutMs?: number }>;
  approvalGates: Array<{ afterStep: string; reason: string }>;
}): Promise<void> {
  await pool.query(
    `INSERT INTO ai_skill_compositions
     (composition_id, name, description, creator_id, org_id, steps, approval_gates, status, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'active',NOW(),NOW())
     ON CONFLICT (composition_id) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       steps = EXCLUDED.steps,
       approval_gates = EXCLUDED.approval_gates,
       updated_at = NOW()`,
    [
      composition.compositionId, composition.name, composition.description ?? null,
      composition.creatorId ?? null, composition.orgId ?? null,
      JSON.stringify(composition.steps), JSON.stringify(composition.approvalGates),
    ]
  );
}

export async function listCompositions(orgId?: string): Promise<any[]> {
  const result = await pool.query(
    `SELECT * FROM ai_skill_compositions WHERE ($1::text IS NULL OR org_id = $1) ORDER BY updated_at DESC`,
    [orgId ?? null]
  );
  return result.rows;
}

export async function getComposition(compositionId: string): Promise<any | null> {
  const result = await pool.query(
    "SELECT * FROM ai_skill_compositions WHERE composition_id = $1",
    [compositionId]
  );
  return result.rows[0] ?? null;
}
