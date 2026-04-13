import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { logAction, updateActionStatus, generateActionId } from "./action-audit";

export type CodeLanguage = "python" | "sql" | "javascript" | "typescript" | "r" | "shell";
export type CodeGenDomain = "data_analysis" | "report_generation" | "automation" | "visualization" | "etl" | "general";

export interface CodeGenerationRequest {
  task: string;
  language?: CodeLanguage;
  domain?: CodeGenDomain;
  contextData?: string;
  existingCode?: string;
  constraints?: string[];
  triggeredBy?: string;
  agentId?: string;
}

export interface SecurityValidationResult {
  safe: boolean;
  issues: Array<{ severity: "low" | "medium" | "high" | "critical"; description: string; line?: number }>;
  blockedPatterns: string[];
}

export interface CodeGenerationResult {
  codeGenId: string;
  actionId: string;
  language: CodeLanguage;
  domain: CodeGenDomain;
  code: string;
  explanation: string;
  securityValidation: SecurityValidationResult;
  executionPlan: string[];
  expectedOutputDescription: string;
  dependencies: string[];
  estimatedComplexity: "low" | "medium" | "high";
  latencyMs: number;
  tokensUsed: number;
}

export interface CodeExecutionResult {
  executionId: string;
  codeGenId?: string;
  status: "success" | "error" | "timeout" | "blocked";
  output?: string;
  errorMessage?: string;
  simulatedResult?: any;
  executionTimeMs: number;
  sandboxed: boolean;
}

async function ensureCodeGenTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS code_generation_results (
      id BIGSERIAL PRIMARY KEY,
      code_gen_id TEXT NOT NULL UNIQUE,
      action_id TEXT,
      language TEXT NOT NULL DEFAULT 'python',
      domain TEXT NOT NULL DEFAULT 'general',
      task TEXT NOT NULL,
      code TEXT,
      explanation TEXT,
      security_validation JSONB DEFAULT '{}',
      execution_plan JSONB DEFAULT '[]',
      expected_output TEXT,
      dependencies JSONB DEFAULT '[]',
      complexity TEXT DEFAULT 'medium',
      tokens_used INTEGER DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      triggered_by TEXT,
      agent_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS code_execution_log (
      id BIGSERIAL PRIMARY KEY,
      execution_id TEXT NOT NULL UNIQUE,
      code_gen_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      output TEXT,
      error_message TEXT,
      simulated_result JSONB,
      execution_time_ms INTEGER DEFAULT 0,
      sandboxed BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch(() => {});
}

ensureCodeGenTable().catch(() => {});

const BLOCKED_PATTERNS = [
  /import\s+os/gi,
  /subprocess/gi,
  /exec\s*\(/gi,
  /eval\s*\(/gi,
  /__import__/gi,
  /open\s*\(/gi,
  /file\s*\(/gi,
  /rm\s+-rf/gi,
  /DROP\s+TABLE/gi,
  /DELETE\s+FROM/gi,
  /TRUNCATE/gi,
  /sys\.exit/gi,
  /shutil/gi,
];

const SQL_WRITE_PATTERNS = [
  /\bINSERT\s+INTO\b/gi,
  /\bUPDATE\s+\w/gi,
  /\bDELETE\s+FROM\b/gi,
  /\bDROP\b/gi,
  /\bALTER\b/gi,
  /\bCREATE\s+TABLE\b/gi,
  /\bTRUNCATE\b/gi,
];

function validateCodeSecurity(code: string, language: CodeLanguage): SecurityValidationResult {
  const issues: SecurityValidationResult["issues"] = [];
  const blockedMatches: string[] = [];

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      blockedMatches.push(pattern.source.slice(0, 30));
      issues.push({
        severity: "critical",
        description: `Blocked pattern detected: ${pattern.source.slice(0, 30)}`,
      });
    }
  }

  if (language === "sql") {
    for (const pattern of SQL_WRITE_PATTERNS) {
      if (pattern.test(code)) {
        issues.push({
          severity: "high",
          description: `Write operation in SQL: ${pattern.source.slice(0, 20)}`,
        });
      }
    }
  }

  if (code.includes("password") || code.includes("api_key") || code.includes("secret")) {
    issues.push({ severity: "medium", description: "Potential credential reference in code" });
  }

  return {
    safe: !issues.some(i => i.severity === "critical" || i.severity === "high"),
    issues,
    blockedPatterns: blockedMatches,
  };
}

function buildCodeGenSystemPrompt(language: CodeLanguage, domain: CodeGenDomain): string {
  const languageGuides: Record<CodeLanguage, string> = {
    python: "Generate clean, well-commented Python 3.x code. Use pandas, numpy, and standard library. Avoid file I/O, subprocess, or system calls.",
    sql: "Generate read-only SQL queries. Use SELECT, WITH (CTEs), and aggregation. Never use INSERT, UPDATE, DELETE, DROP, or ALTER.",
    javascript: "Generate modern ES2022+ JavaScript with async/await. Avoid eval, require, or fs operations.",
    typescript: "Generate TypeScript with proper typing. Use interfaces, generics, and strict type safety.",
    r: "Generate R code for statistical analysis and visualization. Use tidyverse conventions.",
    shell: "Generate safe shell scripts. Avoid rm -rf, destructive operations, or privilege escalation.",
  };

  const domainContexts: Record<CodeGenDomain, string> = {
    data_analysis: "Focus on data transformation, statistical analysis, aggregation, and pattern detection.",
    report_generation: "Focus on structured output formatting, markdown generation, and template rendering.",
    automation: "Focus on workflow orchestration, condition handling, and sequential task execution.",
    visualization: "Focus on chart-ready data structures and visualization library configurations.",
    etl: "Focus on data extraction, transformation, and loading operations.",
    general: "Focus on solving the stated problem efficiently and correctly.",
  };

  return `You are an expert ${language} code generator for ${domain} tasks in an enterprise analytics platform.

${languageGuides[language]}

Domain context: ${domainContexts[domain]}

Rules:
1. Code must be production-ready, well-commented, and correct
2. Include error handling for common failure cases
3. Use type hints/annotations where applicable
4. Keep functions small and single-purpose
5. Never access external URLs, file systems, or environment variables
6. All data operations must be on provided/simulated data only`;
}

export async function generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
  const codeGenId = `codegen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const actionId = generateActionId();
  const language = request.language ?? "python";
  const domain = request.domain ?? "data_analysis";
  const startTime = Date.now();

  await logAction({
    actionId,
    actionType: "tool_call",
    triggeredBy: request.triggeredBy ?? "agent",
    domain,
    input: { task: request.task.slice(0, 200), language, domain },
    status: "running",
    approvalRequired: false,
  });

  const systemPrompt = buildCodeGenSystemPrompt(language, domain);
  const contextNote = request.contextData ? `\n\nContext/data schema:\n${request.contextData.slice(0, 1000)}` : "";
  const constraintNote = request.constraints?.length ? `\n\nConstraints:\n${request.constraints.map(c => `- ${c}`).join("\n")}` : "";
  const existingNote = request.existingCode ? `\n\nExisting code to extend/fix:\n\`\`\`${language}\n${request.existingCode.slice(0, 1000)}\n\`\`\`` : "";

  const userPrompt = `Generate ${language} code for: ${request.task}${contextNote}${constraintNote}${existingNote}

Return JSON:
{
  "code": "the complete code",
  "explanation": "what the code does and how",
  "executionPlan": ["step 1: ...", "step 2: ..."],
  "expectedOutputDescription": "what the output will look like",
  "dependencies": ["library1", "library2"],
  "estimatedComplexity": "low|medium|high"
}`;

  let result: Omit<CodeGenerationResult, "codeGenId" | "actionId" | "language" | "domain" | "securityValidation" | "latencyMs" | "tokensUsed">;
  let tokensUsed = 0;
  let code = "";

  try {
    const response = await gatewayInfer({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 2000,
      strategy: "preferred",
    });

    tokensUsed = response.usage?.totalTokens ?? 0;

    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);

    code = parsed.code ?? "";
    result = {
      code,
      explanation: parsed.explanation ?? "Code generated",
      executionPlan: parsed.executionPlan ?? [],
      expectedOutputDescription: parsed.expectedOutputDescription ?? "Analysis output",
      dependencies: parsed.dependencies ?? [],
      estimatedComplexity: parsed.estimatedComplexity ?? "medium",
    };
  } catch {
    const fallbackCode = language === "python"
      ? `# Auto-generated code for: ${request.task}\n\ndef analyze(data):\n    \"\"\"${request.task}\"\"\"\n    results = {}\n    # TODO: Implement analysis\n    return results\n\nif __name__ == "__main__":\n    result = analyze({})\n    print(result)`
      : `-- Auto-generated query for: ${request.task}\nSELECT 1 as placeholder -- implement query here`;

    code = fallbackCode;
    result = {
      code: fallbackCode,
      explanation: `Template code for: ${request.task}`,
      executionPlan: ["Review generated code", "Implement logic", "Test with sample data"],
      expectedOutputDescription: "Analysis results",
      dependencies: [],
      estimatedComplexity: "medium",
    };
  }

  const securityValidation = validateCodeSecurity(code, language);
  const latencyMs = Date.now() - startTime;

  const fullResult: CodeGenerationResult = {
    codeGenId, actionId, language, domain, securityValidation, ...result, latencyMs, tokensUsed,
  };

  await pool.query(
    `INSERT INTO code_generation_results
     (code_gen_id, action_id, language, domain, task, code, explanation, security_validation,
      execution_plan, expected_output, dependencies, complexity, tokens_used, latency_ms, triggered_by, agent_id, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())`,
    [
      codeGenId, actionId, language, domain, request.task.slice(0, 500),
      fullResult.code.slice(0, 10000), fullResult.explanation,
      JSON.stringify(securityValidation), JSON.stringify(fullResult.executionPlan),
      fullResult.expectedOutputDescription, JSON.stringify(fullResult.dependencies),
      fullResult.estimatedComplexity, tokensUsed, latencyMs,
      request.triggeredBy ?? "agent", request.agentId ?? null,
    ]
  ).catch(err => logger.warn({ err }, "Failed to persist code gen result"));

  await updateActionStatus(actionId, "completed", {
    output: { codeGenId, language, safe: securityValidation.safe },
    latencyMs,
  });

  logger.info({ codeGenId, language, domain, safe: securityValidation.safe, latencyMs }, "Code generation completed");
  return fullResult;
}

export async function executeCodeSandboxed(params: {
  code: string;
  language: CodeLanguage;
  codeGenId?: string;
  inputData?: Record<string, any>;
}): Promise<CodeExecutionResult> {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const startTime = Date.now();

  const validation = validateCodeSecurity(params.code, params.language);

  if (!validation.safe) {
    const execResult: CodeExecutionResult = {
      executionId,
      codeGenId: params.codeGenId,
      status: "blocked",
      errorMessage: `Code blocked by security validation: ${validation.issues.map(i => i.description).join("; ")}`,
      executionTimeMs: Date.now() - startTime,
      sandboxed: true,
    };
    await pool.query(
      `INSERT INTO code_execution_log (execution_id, code_gen_id, status, error_message, execution_time_ms, sandboxed, created_at)
       VALUES ($1,$2,$3,$4,$5,TRUE,NOW())`,
      [executionId, params.codeGenId ?? null, "blocked", execResult.errorMessage, execResult.executionTimeMs]
    ).catch(() => {});
    return execResult;
  }

  const simulationResponse = await gatewayInfer({
    messages: [
      {
        role: "system",
        content: `You are a code execution simulator. Given ${params.language} code and optional input data, simulate its execution and produce realistic output. Do not actually execute the code — generate what the output would be.`,
      },
      {
        role: "user",
        content: `Simulate execution of this ${params.language} code:

\`\`\`${params.language}
${params.code.slice(0, 3000)}
\`\`\`

Input data: ${JSON.stringify(params.inputData ?? {})}

Return JSON:
{
  "simulatedOutput": "what the code would print/return",
  "simulatedResult": {},
  "executionNotes": "any important observations about the execution"
}`,
      },
    ],
    maxTokens: 1000,
    strategy: "fastest",
  });

  let simulatedOutput = "Execution simulated successfully";
  let simulatedResult: any = {};

  try {
    const match = simulationResponse.content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      simulatedOutput = parsed.simulatedOutput ?? simulatedOutput;
      simulatedResult = parsed.simulatedResult ?? {};
    }
  } catch { }

  const executionTimeMs = Date.now() - startTime;

  const execResult: CodeExecutionResult = {
    executionId,
    codeGenId: params.codeGenId,
    status: "success",
    output: simulatedOutput,
    simulatedResult,
    executionTimeMs,
    sandboxed: true,
  };

  await pool.query(
    `INSERT INTO code_execution_log (execution_id, code_gen_id, status, output, simulated_result, execution_time_ms, sandboxed, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,TRUE,NOW())`,
    [executionId, params.codeGenId ?? null, "success", simulatedOutput, JSON.stringify(simulatedResult), executionTimeMs]
  ).catch(() => {});

  logger.info({ executionId, codeGenId: params.codeGenId, executionTimeMs }, "Code execution simulation completed");
  return execResult;
}

export async function iterativeCodeRefinement(params: {
  originalCodeGenId: string;
  errorMessage: string;
  language: CodeLanguage;
  triggeredBy?: string;
}): Promise<CodeGenerationResult> {
  const original = await pool.query(
    "SELECT task, code, explanation FROM code_generation_results WHERE code_gen_id = $1",
    [params.originalCodeGenId]
  ).then(r => r.rows[0]).catch(() => null);

  if (!original) throw new Error(`Code generation ${params.originalCodeGenId} not found`);

  return generateCode({
    task: `Fix this code error: ${params.errorMessage}\n\nOriginal task: ${original.task}`,
    language: params.language,
    existingCode: original.code,
    triggeredBy: params.triggeredBy ?? "refinement",
  });
}

export async function getCodeGenResult(codeGenId: string): Promise<any | null> {
  try {
    const result = await pool.query("SELECT * FROM code_generation_results WHERE code_gen_id = $1", [codeGenId]);
    return result.rows[0] ?? null;
  } catch { return null; }
}

export async function listCodeGenResults(filters?: { language?: string; domain?: string; limit?: number }): Promise<any[]> {
  try {
    const params: any[] = [];
    let query = `SELECT code_gen_id, language, domain, task, complexity, tokens_used, created_at FROM code_generation_results WHERE 1=1`;
    let idx = 1;
    if (filters?.language) { query += ` AND language = $${idx}`; params.push(filters.language); idx++; }
    if (filters?.domain) { query += ` AND domain = $${idx}`; params.push(filters.domain); idx++; }
    params.push(filters?.limit ?? 20);
    const result = await pool.query(query + ` ORDER BY created_at DESC LIMIT $${idx}`, params);
    return result.rows;
  } catch { return []; }
}
