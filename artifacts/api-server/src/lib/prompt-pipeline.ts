import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PromptVariable {
  name: string;
  type: "string" | "number" | "boolean" | "array";
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
}

export interface PromptTemplate {
  id: string;
  name: string;
  domain: string;
  taskType: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: PromptVariable[];
  version: number;
  status: "active" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface PromptVersion {
  versionId: string;
  templateId: string;
  version: number;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: PromptVariable[];
  createdAt: string;
  createdBy?: string;
  changeNote?: string;
  qualityScore?: number;
  requestCount: number;
  avgQualityScore: number;
}

export interface PromptABTest {
  testId: string;
  name: string;
  templateId: string;
  versionA: number;
  versionB: number;
  weightA: number;
  weightB: number;
  domain: string;
  taskType: string;
  metric: "quality" | "latency" | "engagement";
  status: "active" | "paused" | "completed";
  startedAt: string;
  completedAt?: string;
  results?: {
    requestsA: number;
    requestsB: number;
    avgQualityA: number;
    avgQualityB: number;
    winner?: "A" | "B" | "tie";
    confidence: number;
  };
}

export interface PromptRenderResult {
  systemPrompt: string;
  userPrompt: string;
  templateId: string;
  version: number;
  abVariant?: "A" | "B";
  testId?: string;
}

// ─── DB Bootstrap ─────────────────────────────────────────────────────────────

export async function ensurePromptPipelineTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prompt_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT NOT NULL DEFAULT 'general',
        task_type TEXT NOT NULL DEFAULT 'general',
        system_prompt TEXT NOT NULL DEFAULT '',
        user_prompt_template TEXT NOT NULL DEFAULT '',
        variables JSONB NOT NULL DEFAULT '[]',
        version INT NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'active',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS prompt_template_versions (
        version_id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        version INT NOT NULL,
        system_prompt TEXT NOT NULL DEFAULT '',
        user_prompt_template TEXT NOT NULL DEFAULT '',
        variables JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by TEXT,
        change_note TEXT,
        quality_score FLOAT,
        request_count INT NOT NULL DEFAULT 0,
        avg_quality_score FLOAT NOT NULL DEFAULT 0,
        UNIQUE(template_id, version)
      );

      CREATE TABLE IF NOT EXISTS prompt_ab_tests (
        test_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        template_id TEXT NOT NULL,
        version_a INT NOT NULL,
        version_b INT NOT NULL,
        weight_a FLOAT NOT NULL DEFAULT 0.5,
        weight_b FLOAT NOT NULL DEFAULT 0.5,
        domain TEXT NOT NULL DEFAULT 'general',
        task_type TEXT NOT NULL DEFAULT 'general',
        metric TEXT NOT NULL DEFAULT 'quality',
        status TEXT NOT NULL DEFAULT 'active',
        results JSONB,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS prompt_ab_events (
        id BIGSERIAL PRIMARY KEY,
        test_id TEXT NOT NULL,
        template_id TEXT NOT NULL,
        version_used INT NOT NULL,
        variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
        quality_score FLOAT,
        latency_ms FLOAT,
        success BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS prompt_performance (
        id BIGSERIAL PRIMARY KEY,
        template_id TEXT NOT NULL,
        version INT NOT NULL,
        domain TEXT NOT NULL,
        task_type TEXT NOT NULL,
        quality_score FLOAT,
        latency_ms FLOAT,
        success BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_prompt_performance_template ON prompt_performance(template_id, version);
      CREATE INDEX IF NOT EXISTS idx_prompt_ab_events_test ON prompt_ab_events(test_id);
    `);
    logger.info("Prompt pipeline tables ensured");
  } catch (err) {
    logger.warn({ err }, "Failed to ensure prompt pipeline tables (non-fatal)");
  }
}

// ─── Template CRUD ────────────────────────────────────────────────────────────

export async function createPromptTemplate(params: {
  name: string;
  domain?: string;
  taskType?: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables?: PromptVariable[];
  metadata?: Record<string, unknown>;
  createdBy?: string;
}): Promise<PromptTemplate> {
  const id = `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const versionId = `ver_${id}_v1`;

  try {
    await pool.query(
      `INSERT INTO prompt_templates (id, name, domain, task_type, system_prompt, user_prompt_template, variables, version, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'active', $8)`,
      [id, params.name, params.domain ?? "general", params.taskType ?? "general",
        params.systemPrompt, params.userPromptTemplate, JSON.stringify(params.variables ?? []),
        JSON.stringify(params.metadata ?? {})]
    );

    await pool.query(
      `INSERT INTO prompt_template_versions (version_id, template_id, version, system_prompt, user_prompt_template, variables, created_by, change_note)
       VALUES ($1, $2, 1, $3, $4, $5, $6, 'Initial version')`,
      [versionId, id, params.systemPrompt, params.userPromptTemplate, JSON.stringify(params.variables ?? []), params.createdBy]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to persist prompt template");
  }

  return {
    id,
    name: params.name,
    domain: params.domain ?? "general",
    taskType: params.taskType ?? "general",
    systemPrompt: params.systemPrompt,
    userPromptTemplate: params.userPromptTemplate,
    variables: params.variables ?? [],
    version: 1,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: params.metadata,
  };
}

export async function updatePromptTemplate(
  id: string,
  params: {
    systemPrompt?: string;
    userPromptTemplate?: string;
    variables?: PromptVariable[];
    status?: "active" | "draft" | "archived";
    changeNote?: string;
    createdBy?: string;
  }
): Promise<PromptTemplate | null> {
  try {
    const existing = await pool.query("SELECT * FROM prompt_templates WHERE id = $1", [id]);
    if (existing.rows.length === 0) return null;

    const row = existing.rows[0];
    const newVersion = row.version + 1;
    const versionId = `ver_${id}_v${newVersion}`;

    const newSystem = params.systemPrompt ?? row.system_prompt;
    const newUser = params.userPromptTemplate ?? row.user_prompt_template;
    const newVars = params.variables ?? row.variables;

    await pool.query(
      `UPDATE prompt_templates SET system_prompt = $2, user_prompt_template = $3, variables = $4, version = $5, status = $6, updated_at = NOW()
       WHERE id = $1`,
      [id, newSystem, newUser, JSON.stringify(newVars), newVersion, params.status ?? row.status]
    );

    await pool.query(
      `INSERT INTO prompt_template_versions (version_id, template_id, version, system_prompt, user_prompt_template, variables, created_by, change_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [versionId, id, newVersion, newSystem, newUser, JSON.stringify(newVars), params.createdBy, params.changeNote ?? "Updated"]
    );

    return {
      id,
      name: row.name,
      domain: row.domain,
      taskType: row.task_type,
      systemPrompt: newSystem,
      userPromptTemplate: newUser,
      variables: Array.isArray(newVars) ? newVars : [],
      version: newVersion,
      status: params.status ?? row.status,
      createdAt: row.created_at,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.warn({ err, id }, "Failed to update prompt template");
    return null;
  }
}

export async function rollbackPromptTemplate(id: string, version: number): Promise<PromptTemplate | null> {
  try {
    const verResult = await pool.query(
      "SELECT * FROM prompt_template_versions WHERE template_id = $1 AND version = $2",
      [id, version]
    );
    if (verResult.rows.length === 0) return null;
    const ver = verResult.rows[0];

    return updatePromptTemplate(id, {
      systemPrompt: ver.system_prompt,
      userPromptTemplate: ver.user_prompt_template,
      variables: ver.variables,
      changeNote: `Rolled back to version ${version}`,
    });
  } catch (err) {
    logger.warn({ err }, "Failed to rollback prompt template");
    return null;
  }
}

export async function listPromptTemplates(domain?: string, taskType?: string, status?: string): Promise<PromptTemplate[]> {
  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (domain) { conditions.push(`domain = $${idx}`); params.push(domain); idx++; }
    if (taskType) { conditions.push(`task_type = $${idx}`); params.push(taskType); idx++; }
    if (status) { conditions.push(`status = $${idx}`); params.push(status); idx++; }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT * FROM prompt_templates ${where} ORDER BY updated_at DESC LIMIT 100`,
      params
    );

    return result.rows.map(r => ({
      id: r.id,
      name: r.name,
      domain: r.domain,
      taskType: r.task_type,
      systemPrompt: r.system_prompt,
      userPromptTemplate: r.user_prompt_template,
      variables: r.variables ?? [],
      version: r.version,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      metadata: r.metadata,
    }));
  } catch {
    return [];
  }
}

export async function getPromptTemplate(id: string): Promise<PromptTemplate | null> {
  try {
    const result = await pool.query("SELECT * FROM prompt_templates WHERE id = $1", [id]);
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return {
      id: r.id,
      name: r.name,
      domain: r.domain,
      taskType: r.task_type,
      systemPrompt: r.system_prompt,
      userPromptTemplate: r.user_prompt_template,
      variables: r.variables ?? [],
      version: r.version,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      metadata: r.metadata,
    };
  } catch {
    return null;
  }
}

export async function getPromptVersions(templateId: string): Promise<PromptVersion[]> {
  try {
    const result = await pool.query(
      "SELECT * FROM prompt_template_versions WHERE template_id = $1 ORDER BY version DESC",
      [templateId]
    );
    return result.rows.map(r => ({
      versionId: r.version_id,
      templateId: r.template_id,
      version: r.version,
      systemPrompt: r.system_prompt,
      userPromptTemplate: r.user_prompt_template,
      variables: r.variables ?? [],
      createdAt: r.created_at,
      createdBy: r.created_by,
      changeNote: r.change_note,
      qualityScore: r.quality_score ? parseFloat(r.quality_score) : undefined,
      requestCount: r.request_count ?? 0,
      avgQualityScore: parseFloat(r.avg_quality_score ?? "0"),
    }));
  } catch {
    return [];
  }
}

export async function deletePromptTemplate(id: string): Promise<boolean> {
  try {
    await pool.query("UPDATE prompt_templates SET status = 'archived', updated_at = NOW() WHERE id = $1", [id]);
    return true;
  } catch {
    return false;
  }
}

// ─── Template Rendering ───────────────────────────────────────────────────────

export function renderPromptTemplate(
  template: PromptTemplate,
  variables: Record<string, unknown>,
): { systemPrompt: string; userPrompt: string } {
  let systemPrompt = template.systemPrompt;
  let userPrompt = template.userPromptTemplate;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const strValue = Array.isArray(value) ? value.join(", ") : String(value ?? "");
    systemPrompt = systemPrompt.split(placeholder).join(strValue);
    userPrompt = userPrompt.split(placeholder).join(strValue);
  }

  for (const variable of template.variables) {
    if (variable.defaultValue !== undefined && !(variable.name in variables)) {
      const placeholder = `{{${variable.name}}}`;
      const defaultStr = Array.isArray(variable.defaultValue) ? variable.defaultValue.join(", ") : String(variable.defaultValue);
      systemPrompt = systemPrompt.split(placeholder).join(defaultStr);
      userPrompt = userPrompt.split(placeholder).join(defaultStr);
    }
  }

  return { systemPrompt, userPrompt };
}

// ─── Prompt A/B Testing ───────────────────────────────────────────────────────

const activePromptTests = new Map<string, PromptABTest>();

export async function createPromptABTest(params: {
  name: string;
  templateId: string;
  versionA: number;
  versionB: number;
  weightA?: number;
  domain?: string;
  taskType?: string;
  metric?: PromptABTest["metric"];
}): Promise<PromptABTest> {
  const testId = `ptest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const test: PromptABTest = {
    testId,
    name: params.name,
    templateId: params.templateId,
    versionA: params.versionA,
    versionB: params.versionB,
    weightA: params.weightA ?? 0.5,
    weightB: 1 - (params.weightA ?? 0.5),
    domain: params.domain ?? "general",
    taskType: params.taskType ?? "general",
    metric: params.metric ?? "quality",
    status: "active",
    startedAt: new Date().toISOString(),
  };

  try {
    await pool.query(
      `INSERT INTO prompt_ab_tests (test_id, name, template_id, version_a, version_b, weight_a, weight_b, domain, task_type, metric, status, started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW())`,
      [testId, params.name, params.templateId, params.versionA, params.versionB,
        test.weightA, test.weightB, test.domain, test.taskType, test.metric]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to persist prompt A/B test");
  }

  activePromptTests.set(testId, test);
  return test;
}

export async function resolvePromptForRender(
  templateId: string,
  variables: Record<string, unknown>,
): Promise<PromptRenderResult | null> {
  const template = await getPromptTemplate(templateId);
  if (!template) return null;

  for (const [testId, test] of activePromptTests) {
    if (test.templateId === templateId && test.status === "active") {
      const variant: "A" | "B" = Math.random() < test.weightA ? "A" : "B";
      const versionNum = variant === "A" ? test.versionA : test.versionB;

      try {
        const verResult = await pool.query(
          "SELECT * FROM prompt_template_versions WHERE template_id = $1 AND version = $2",
          [templateId, versionNum]
        );
        if (verResult.rows.length > 0) {
          const ver = verResult.rows[0];
          const versionedTemplate: PromptTemplate = {
            ...template,
            systemPrompt: ver.system_prompt,
            userPromptTemplate: ver.user_prompt_template,
            variables: ver.variables ?? template.variables,
            version: versionNum,
          };
          const rendered = renderPromptTemplate(versionedTemplate, variables);
          return { ...rendered, templateId, version: versionNum, abVariant: variant, testId };
        }
      } catch {}
    }
  }

  const rendered = renderPromptTemplate(template, variables);
  return { ...rendered, templateId, version: template.version };
}

export async function recordPromptOutcome(
  templateId: string,
  version: number,
  qualityScore: number,
  latencyMs: number,
  success: boolean,
  testId?: string,
  variant?: "A" | "B",
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO prompt_performance (template_id, version, domain, task_type, quality_score, latency_ms, success)
       SELECT domain, $2, domain, task_type, $3, $4, $5 FROM prompt_templates WHERE id = $1`,
      [templateId, version, qualityScore, latencyMs, success]
    );

    await pool.query(
      `UPDATE prompt_template_versions
       SET request_count = request_count + 1,
           avg_quality_score = (avg_quality_score * request_count + $3) / (request_count + 1)
       WHERE template_id = $1 AND version = $2`,
      [templateId, version, qualityScore]
    );

    if (testId && variant) {
      await pool.query(
        `INSERT INTO prompt_ab_events (test_id, template_id, version_used, variant, quality_score, latency_ms, success)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [testId, templateId, version, variant, qualityScore, latencyMs, success]
      );
    }
  } catch {}
}

export async function getPromptTestResults(testId: string): Promise<PromptABTest["results"] | null> {
  try {
    const result = await pool.query(
      `SELECT variant, count(*) as requests, avg(quality_score) as avg_quality
       FROM prompt_ab_events WHERE test_id = $1 GROUP BY variant`,
      [testId]
    );
    const a = result.rows.find(r => r.variant === "A");
    const b = result.rows.find(r => r.variant === "B");
    if (!a || !b) return null;

    const reqA = parseInt(a.requests);
    const reqB = parseInt(b.requests);
    const qA = parseFloat(a.avg_quality ?? "0");
    const qB = parseFloat(b.avg_quality ?? "0");
    const diff = Math.abs(qA - qB);
    const winner: "A" | "B" | "tie" = diff > 0.05 ? (qA > qB ? "A" : "B") : "tie";

    return {
      requestsA: reqA,
      requestsB: reqB,
      avgQualityA: qA,
      avgQualityB: qB,
      winner,
      confidence: Math.min(0.99, (reqA + reqB) / 100),
    };
  } catch {
    return null;
  }
}

export async function listPromptABTests(templateId?: string): Promise<PromptABTest[]> {
  try {
    const result = await pool.query(
      templateId
        ? "SELECT * FROM prompt_ab_tests WHERE template_id = $1 ORDER BY started_at DESC LIMIT 50"
        : "SELECT * FROM prompt_ab_tests ORDER BY started_at DESC LIMIT 50",
      templateId ? [templateId] : []
    );
    return result.rows.map(r => ({
      testId: r.test_id,
      name: r.name,
      templateId: r.template_id,
      versionA: r.version_a,
      versionB: r.version_b,
      weightA: parseFloat(r.weight_a),
      weightB: parseFloat(r.weight_b),
      domain: r.domain,
      taskType: r.task_type,
      metric: r.metric,
      status: r.status,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      results: r.results,
    }));
  } catch {
    return [];
  }
}

export async function getVersionPerformance(templateId: string): Promise<Array<{
  version: number;
  requestCount: number;
  avgQualityScore: number;
  avgLatencyMs: number;
  successRate: number;
}>> {
  try {
    const result = await pool.query(
      `SELECT version, count(*) as requests, avg(quality_score) as avg_quality, avg(latency_ms) as avg_latency,
              sum(case when success then 1 else 0 end)::float / count(*) as success_rate
       FROM prompt_performance WHERE template_id = $1
       GROUP BY version ORDER BY version DESC`,
      [templateId]
    );
    return result.rows.map(r => ({
      version: r.version,
      requestCount: parseInt(r.requests),
      avgQualityScore: parseFloat(r.avg_quality ?? "0"),
      avgLatencyMs: parseFloat(r.avg_latency ?? "0"),
      successRate: parseFloat(r.success_rate ?? "1"),
    }));
  } catch {
    return [];
  }
}
