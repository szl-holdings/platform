import { pool } from "@szl-holdings/db";
import { gatewayInfer } from "./ai-gateway";
import { logger } from "./logger";

export interface OutputSchema {
  schemaId: string;
  name: string;
  version: string;
  description: string;
  domain: string;
  agentId?: string;
  jsonSchema: Record<string, unknown>;
  exampleOutput?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StructuredOutputResult<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  rawOutput: string;
  validationErrors: string[];
  repairsApplied: number;
  schemaId: string;
  schemaVersion: string;
  tokensUsed: number;
  latencyMs: number;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  missingFields: string[];
  unexpectedFields: string[];
}

const BUILT_IN_SCHEMAS: Record<string, OutputSchema> = {
  "signal.analysis": {
    schemaId: "signal.analysis",
    name: "Signal Analysis Output",
    version: "1.0.0",
    description: "Standard output for signal analysis agents",
    domain: "alloy",
    jsonSchema: {
      type: "object",
      required: ["severity", "confidence", "summary", "recommendations"],
      properties: {
        severity: { type: "string", enum: ["critical", "high", "medium", "low", "informational"] },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        summary: { type: "string", minLength: 10 },
        recommendations: { type: "array", items: { type: "string" }, minItems: 1 },
        entities: { type: "array", items: { type: "string" } },
        riskFactors: { type: "array", items: { type: "string" } },
        taxonomyTags: { type: "object" },
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "entity.extraction": {
    schemaId: "entity.extraction",
    name: "Entity Extraction Output",
    version: "1.0.0",
    description: "Structured output for entity extraction tasks",
    domain: "alloy",
    jsonSchema: {
      type: "object",
      required: ["entities", "triples"],
      properties: {
        entities: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "entityType", "confidence"],
            properties: {
              name: { type: "string" },
              entityType: { type: "string" },
              confidence: { type: "number" },
              properties: { type: "object" },
            },
          },
        },
        triples: {
          type: "array",
          items: {
            type: "object",
            required: ["subject", "predicate", "object"],
            properties: {
              subject: { type: "string" },
              predicate: { type: "string" },
              object: { type: "string" },
              confidence: { type: "number" },
            },
          },
        },
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "enrichment.report": {
    schemaId: "enrichment.report",
    name: "Signal Enrichment Report",
    version: "1.0.0",
    description: "Analyst-ready enrichment report output",
    domain: "alloy",
    jsonSchema: {
      type: "object",
      required: ["executiveSummary", "riskLevel", "confidenceScore", "recommendations"],
      properties: {
        executiveSummary: { type: "string", minLength: 20 },
        riskLevel: { type: "string", enum: ["critical", "high", "medium", "low", "informational"] },
        confidenceScore: { type: "number", minimum: 0, maximum: 1 },
        recommendations: { type: "array", items: { type: "string" } },
        taxonomyMapping: { type: "object" },
        crossDomainConnections: { type: "array", items: { type: "string" } },
        iocIndicators: { type: "array", items: { type: "string" } },
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "threat.assessment": {
    schemaId: "threat.assessment",
    name: "Threat Assessment Output",
    version: "1.0.0",
    description: "Defense domain threat assessment",
    domain: "defense",
    jsonSchema: {
      type: "object",
      required: ["threatLevel", "attackVectors", "mitigations", "confidence"],
      properties: {
        threatLevel: { type: "string", enum: ["critical", "high", "medium", "low"] },
        attackVectors: { type: "array", items: { type: "string" } },
        mitigations: { type: "array", items: { type: "string" } },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        mitreTechniques: { type: "array", items: { type: "string" } },
        affectedAssets: { type: "array", items: { type: "string" } },
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

async function ensureSchemaRegistryTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alloy_schema_registry (
      schema_id TEXT NOT NULL,
      version TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      domain TEXT NOT NULL DEFAULT 'alloy',
      agent_id TEXT,
      json_schema JSONB NOT NULL,
      example_output JSONB,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (schema_id, version)
    );
    CREATE TABLE IF NOT EXISTS alloy_structured_output_log (
      id SERIAL PRIMARY KEY,
      schema_id TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      agent_id TEXT,
      success BOOLEAN NOT NULL,
      repairs_applied INT NOT NULL DEFAULT 0,
      validation_errors JSONB NOT NULL DEFAULT '[]',
      tokens_used INT NOT NULL DEFAULT 0,
      latency_ms INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  try { await ensureSchemaRegistryTable(); tablesEnsured = true; } catch (err) {
    logger.warn({ err }, "Schema registry table ensure failed");
  }
}

/**
 * Recursively validate `data` against a JSON Schema node.
 * Supports: type, required, properties (recursive), items (recursive for arrays),
 * enum, minimum, maximum, minLength, minItems.
 */
function validateNode(
  data: unknown,
  schema: Record<string, unknown>,
  path: string,
  errors: string[],
  missingFields: string[]
): void {
  const schemaType = schema.type as string | undefined;

  if (schemaType === "object") {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      errors.push(`${path}: expected object, got ${Array.isArray(data) ? "array" : typeof data}`);
      return;
    }
    const obj = data as Record<string, unknown>;
    const required = (schema.required as string[]) || [];
    const properties = (schema.properties as Record<string, unknown>) || {};

    for (const field of required) {
      if (!(field in obj)) {
        missingFields.push(`${path}.${field}`);
        errors.push(`${path}: missing required field "${field}"`);
      }
    }

    for (const [key, value] of Object.entries(obj)) {
      if (key in properties) {
        validateNode(value, properties[key] as Record<string, unknown>, `${path}.${key}`, errors, missingFields);
      }
    }
  } else if (schemaType === "array") {
    if (!Array.isArray(data)) {
      errors.push(`${path}: expected array, got ${typeof data}`);
      return;
    }
    const minItems = schema.minItems as number | undefined;
    if (minItems !== undefined && data.length < minItems) {
      errors.push(`${path}: array must have at least ${minItems} item(s), got ${data.length}`);
    }
    const itemSchema = schema.items as Record<string, unknown> | undefined;
    if (itemSchema) {
      for (let i = 0; i < data.length; i++) {
        validateNode(data[i], itemSchema, `${path}[${i}]`, errors, missingFields);
      }
    }
  } else if (schemaType === "string") {
    if (typeof data !== "string") {
      errors.push(`${path}: expected string, got ${typeof data}`);
      return;
    }
    const enumVals = schema.enum as string[] | undefined;
    if (enumVals && !enumVals.includes(data)) {
      errors.push(`${path}: must be one of [${enumVals.join(", ")}], got "${data}"`);
    }
    const minLength = schema.minLength as number | undefined;
    if (minLength !== undefined && data.length < minLength) {
      errors.push(`${path}: string too short (min ${minLength}, got ${data.length})`);
    }
  } else if (schemaType === "number") {
    if (typeof data !== "number") {
      errors.push(`${path}: expected number, got ${typeof data}`);
      return;
    }
    const min = schema.minimum as number | undefined;
    const max = schema.maximum as number | undefined;
    if (min !== undefined && data < min) errors.push(`${path}: ${data} < minimum ${min}`);
    if (max !== undefined && data > max) errors.push(`${path}: ${data} > maximum ${max}`);
  } else if (schemaType === "boolean") {
    if (typeof data !== "boolean") {
      errors.push(`${path}: expected boolean, got ${typeof data}`);
    }
  }
  // unknown/missing type → skip further checks for flexibility
}

function validateAgainstSchema(data: unknown, schema: Record<string, unknown>): SchemaValidationResult {
  const errors: string[] = [];
  const missingFields: string[] = [];

  if (typeof data !== "object" || data === null) {
    return { valid: false, errors: ["Output is not a JSON object"], missingFields: ["(root)"], unexpectedFields: [] };
  }

  validateNode(data, schema, "root", errors, missingFields);

  return {
    valid: errors.length === 0,
    errors,
    missingFields,
    unexpectedFields: [],
  };
}

/** Safe JSON extraction: tries strict JSON.parse first, then greedy brace-matching fallback. */
function safeExtractJson(text: string): unknown | null {
  // Try whole-text parse first
  try {
    return JSON.parse(text);
  } catch { /* fall through */ }

  // Greedy brace-match: find the first '{' and balance to the closing '}'
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch { return null; }
      }
    }
  }
  return null;
}

export async function getSchema(schemaId: string, version?: string): Promise<OutputSchema | null> {
  if (BUILT_IN_SCHEMAS[schemaId]) return BUILT_IN_SCHEMAS[schemaId];

  await ensureTables();
  try {
    const versionFilter = version ? "AND version = $2" : "";
    const orderBy = version ? "" : "ORDER BY created_at DESC";
    const values = version ? [schemaId, version] : [schemaId];
    const { rows } = await pool.query(
      `SELECT * FROM alloy_schema_registry WHERE schema_id = $1 ${versionFilter} ${orderBy} LIMIT 1`,
      values
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
      schemaId: r.schema_id,
      name: r.name,
      version: r.version,
      description: r.description,
      domain: r.domain,
      agentId: r.agent_id,
      jsonSchema: r.json_schema,
      exampleOutput: r.example_output,
      createdAt: r.created_at?.toISOString() ?? "",
      updatedAt: r.updated_at?.toISOString() ?? "",
    };
  } catch (err) {
    logger.warn({ err, schemaId }, "Failed to fetch schema from registry");
    return null;
  }
}

export async function registerSchema(schema: Omit<OutputSchema, "createdAt" | "updatedAt">): Promise<OutputSchema> {
  await ensureTables();
  const now = new Date().toISOString();

  try {
    await pool.query(
      `INSERT INTO alloy_schema_registry (schema_id, version, name, description, domain, agent_id, json_schema, example_output)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (schema_id, version) DO UPDATE SET
         name = $3, description = $4, json_schema = $7, example_output = $8, updated_at = NOW()`,
      [schema.schemaId, schema.version, schema.name, schema.description, schema.domain,
       schema.agentId ?? null, JSON.stringify(schema.jsonSchema), schema.exampleOutput ? JSON.stringify(schema.exampleOutput) : null]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to persist schema to registry");
  }

  return { ...schema, createdAt: now, updatedAt: now };
}

export async function enforceStructuredOutput<T = Record<string, unknown>>(params: {
  agentId?: string;
  schemaId: string;
  systemPrompt: string;
  userPrompt: string;
  maxRetries?: number;
  schemaVersion?: string;
}): Promise<StructuredOutputResult<T>> {
  const startTime = Date.now();
  const maxRetries = params.maxRetries ?? 2;

  const schema = await getSchema(params.schemaId, params.schemaVersion);
  if (!schema) {
    return {
      success: false,
      rawOutput: "",
      validationErrors: [`Schema not found: ${params.schemaId}`],
      repairsApplied: 0,
      schemaId: params.schemaId,
      schemaVersion: params.schemaVersion ?? "unknown",
      tokensUsed: 0,
      latencyMs: Date.now() - startTime,
    };
  }

  const schemaInstruction = `\n\nYou MUST respond with ONLY valid JSON conforming exactly to this schema:\n${JSON.stringify(schema.jsonSchema, null, 2)}\n\nDo not include any text, markdown, or commentary outside the JSON object.`;

  let attempt = 0;
  let repairsApplied = 0;
  let totalTokens = 0;
  let lastRawOutput = "";
  let lastErrors: string[] = [];
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: params.systemPrompt + schemaInstruction },
    { role: "user", content: params.userPrompt },
  ];

  while (attempt <= maxRetries) {
    try {
      const response = await gatewayInfer({ messages, maxTokens: 1500, strategy: "preferred" });
      totalTokens += response?.usage?.totalTokens ?? 0;
      lastRawOutput = response.content || "";

      const parsed = safeExtractJson(lastRawOutput);
      if (parsed === null) {
        lastErrors = ["Response contains no valid JSON object"];
      } else {
        const validation = validateAgainstSchema(parsed, schema.jsonSchema);
        if (validation.valid) {
          const latencyMs = Date.now() - startTime;
          try {
            await pool.query(
              `INSERT INTO alloy_structured_output_log (schema_id, schema_version, agent_id, success, repairs_applied, validation_errors, tokens_used, latency_ms)
               VALUES ($1, $2, $3, TRUE, $4, '[]', $5, $6)`,
              [params.schemaId, schema.version, params.agentId ?? null, repairsApplied, totalTokens, latencyMs]
            );
          } catch (err) {
            logger.warn({ err }, "Failed to write structured output log (success)");
          }
          return {
            success: true,
            data: parsed as T,
            rawOutput: lastRawOutput,
            validationErrors: [],
            repairsApplied,
            schemaId: params.schemaId,
            schemaVersion: schema.version,
            tokensUsed: totalTokens,
            latencyMs,
          };
        } else {
          lastErrors = validation.errors;
          logger.info({ schemaId: params.schemaId, attempt, errors: validation.errors.slice(0, 3) }, "Structured output validation failed, will retry");
        }
      }
    } catch (err) {
      lastErrors = [`Inference error: ${(err as Error).message}`];
      logger.warn({ err, attempt }, "Structured output inference failed");
    }

    if (attempt < maxRetries) {
      repairsApplied++;
      messages.push({ role: "assistant", content: lastRawOutput || "{}" });
      messages.push({
        role: "user",
        content: `Your previous response had schema validation errors:\n${lastErrors.slice(0, 5).join("\n")}\n\nCorrect these issues and return ONLY valid JSON.`,
      });
    }

    attempt++;
  }

  const latencyMs = Date.now() - startTime;
  try {
    await pool.query(
      `INSERT INTO alloy_structured_output_log (schema_id, schema_version, agent_id, success, repairs_applied, validation_errors, tokens_used, latency_ms)
       VALUES ($1, $2, $3, FALSE, $4, $5, $6, $7)`,
      [params.schemaId, schema.version, params.agentId ?? null, repairsApplied,
       JSON.stringify(lastErrors), totalTokens, latencyMs]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to write structured output log (failure)");
  }

  return {
    success: false,
    rawOutput: lastRawOutput,
    validationErrors: lastErrors,
    repairsApplied,
    schemaId: params.schemaId,
    schemaVersion: schema.version,
    tokensUsed: totalTokens,
    latencyMs,
  };
}

export function listBuiltInSchemas(): OutputSchema[] {
  return Object.values(BUILT_IN_SCHEMAS);
}

export async function listAllSchemas(): Promise<OutputSchema[]> {
  await ensureTables();
  const builtIn = listBuiltInSchemas();
  try {
    const { rows } = await pool.query(
      `SELECT * FROM alloy_schema_registry WHERE is_active = TRUE ORDER BY created_at DESC`
    );
    const custom: OutputSchema[] = rows.map(r => ({
      schemaId: r.schema_id,
      name: r.name,
      version: r.version,
      description: r.description,
      domain: r.domain,
      agentId: r.agent_id,
      jsonSchema: r.json_schema,
      exampleOutput: r.example_output,
      createdAt: r.created_at?.toISOString() ?? "",
      updatedAt: r.updated_at?.toISOString() ?? "",
    }));
    return [...builtIn, ...custom];
  } catch (err) {
    logger.warn({ err }, "Failed to list schemas from registry");
    return builtIn;
  }
}

export async function getOutputQualityStats(): Promise<{
  totalOutputs: number;
  successRate: number;
  avgRepairsPerOutput: number;
  schemaUsage: Record<string, number>;
  failuresBySchema: Record<string, number>;
}> {
  try {
    const { rows } = await pool.query(
      `SELECT schema_id, success, COUNT(*) as cnt, AVG(repairs_applied) as avg_repairs
       FROM alloy_structured_output_log GROUP BY schema_id, success`
    );

    let total = 0, successes = 0, totalRepairs = 0;
    const schemaUsage: Record<string, number> = {};
    const failuresBySchema: Record<string, number> = {};

    for (const row of rows) {
      const cnt = parseInt(row.cnt);
      total += cnt;
      schemaUsage[row.schema_id] = (schemaUsage[row.schema_id] || 0) + cnt;
      if (row.success) {
        successes += cnt;
      } else {
        failuresBySchema[row.schema_id] = (failuresBySchema[row.schema_id] || 0) + cnt;
      }
      totalRepairs += parseFloat(row.avg_repairs) * cnt;
    }

    return {
      totalOutputs: total,
      successRate: total > 0 ? successes / total : 0,
      avgRepairsPerOutput: total > 0 ? totalRepairs / total : 0,
      schemaUsage,
      failuresBySchema,
    };
  } catch (err) {
    logger.warn({ err }, "Failed to fetch output quality stats");
    return { totalOutputs: 0, successRate: 0, avgRepairsPerOutput: 0, schemaUsage: {}, failuresBySchema: {} };
  }
}
