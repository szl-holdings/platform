import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

export type ForgeProvider = "openai" | "together" | "fireworks" | "vertex";
export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type DatasetFormat = "jsonl" | "csv" | "alpaca" | "sharegpt" | "oasst";

export interface ForgeDataset {
  id: number;
  orgId: number;
  name: string;
  description: string;
  format: DatasetFormat;
  rowCount: number;
  sizeBytes: number;
  providerFormats: Record<string, boolean>;
  uploadedAt: string;
  createdAt: string;
}

export interface ForgeJob {
  id: number;
  orgId: number;
  name: string;
  provider: ForgeProvider;
  baseModel: string;
  datasetId: number;
  datasetName?: string;
  status: JobStatus;
  epochs: number;
  batchSize: number;
  learningRate: number;
  progress: number;
  costEstimateUsd: number;
  costActualUsd?: number;
  trainingLoss?: number;
  validationLoss?: number;
  fineTunedModelId?: string;
  externalJobId?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForgeExperiment {
  id: number;
  orgId: number;
  name: string;
  jobIds: number[];
  baselineModel: string;
  testPrompts: string[];
  results: ExperimentResult[];
  winner?: string;
  status: "running" | "completed";
  createdAt: string;
}

export interface ExperimentResult {
  jobId: number;
  provider: string;
  model: string;
  prompt: string;
  output: string;
  latencyMs: number;
  qualityScore: number;
  costUsd: number;
}

export interface ParetoDataPoint {
  jobId: number;
  provider: string;
  model: string;
  qualityScore: number;
  costUsd: number;
  latencyMs: number;
  label: string;
}

export async function ensureForgeTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forge_datasets (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        format TEXT NOT NULL DEFAULT 'jsonl',
        row_count INTEGER NOT NULL DEFAULT 0,
        size_bytes BIGINT NOT NULL DEFAULT 0,
        raw_data JSONB DEFAULT '[]',
        provider_formats JSONB DEFAULT '{}',
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS forge_jobs (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        base_model TEXT NOT NULL,
        dataset_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        epochs INTEGER NOT NULL DEFAULT 3,
        batch_size INTEGER NOT NULL DEFAULT 4,
        learning_rate FLOAT NOT NULL DEFAULT 2e-5,
        progress FLOAT NOT NULL DEFAULT 0,
        cost_estimate_usd FLOAT NOT NULL DEFAULT 0,
        cost_actual_usd FLOAT,
        training_loss FLOAT,
        validation_loss FLOAT,
        fine_tuned_model_id TEXT,
        external_job_id TEXT,
        error_message TEXT,
        epoch_logs JSONB DEFAULT '[]',
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS forge_experiments (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        job_ids JSONB NOT NULL DEFAULT '[]',
        baseline_model TEXT NOT NULL DEFAULT 'gpt-4o',
        test_prompts JSONB NOT NULL DEFAULT '[]',
        results JSONB NOT NULL DEFAULT '[]',
        winner TEXT,
        status TEXT NOT NULL DEFAULT 'running',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS forge_evolution_feed (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL DEFAULT 1,
        job_id INTEGER,
        experiment_id INTEGER,
        provider TEXT,
        model_id TEXT,
        quality_score FLOAT,
        cost_usd FLOAT,
        latency_ms FLOAT,
        prompt_strategy_hint TEXT,
        fed_to_alloy BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_forge_datasets_org ON forge_datasets(org_id);
      CREATE INDEX IF NOT EXISTS idx_forge_jobs_org ON forge_jobs(org_id);
      CREATE INDEX IF NOT EXISTS idx_forge_jobs_status ON forge_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_forge_experiments_org ON forge_experiments(org_id);
    `).catch(() => {});

    logger.info("Training Forge tables ensured");
  } catch (err) {
    logger.warn({ err }, "Failed to ensure Training Forge tables");
  }
}

ensureForgeTables().catch(() => {});

const PROVIDER_BASE_MODELS: Record<ForgeProvider, string[]> = {
  openai: ["gpt-4o-mini-2024-07-18", "gpt-3.5-turbo-1106", "babbage-002", "davinci-002"],
  together: ["meta-llama/Llama-3-8b-chat-hf", "mistralai/Mistral-7B-Instruct-v0.1", "togethercomputer/RedPajama-INCITE-Chat-3B-v1"],
  fireworks: ["accounts/fireworks/models/llama-v3-8b-instruct", "accounts/fireworks/models/mistral-7b-instruct", "accounts/fireworks/models/mixtral-8x7b-instruct"],
  vertex: ["gemini-1.5-flash-001", "gemini-1.0-pro-002", "text-bison@002"],
};

const PROVIDER_COST_PER_1K_TOKENS: Record<ForgeProvider, number> = {
  openai: 0.008,
  together: 0.003,
  fireworks: 0.004,
  vertex: 0.005,
};

function autoFormatForProvider(rawData: unknown[], provider: ForgeProvider, originalFormat: DatasetFormat): unknown[] {
  if (rawData.length === 0) return [];

  return rawData.slice(0, 1000).map((row: any) => {
    if (provider === "openai") {
      return {
        messages: [
          { role: "system", content: row.system || "You are a helpful assistant." },
          { role: "user", content: row.input || row.question || row.prompt || JSON.stringify(row) },
          { role: "assistant", content: row.output || row.answer || row.response || "" },
        ],
      };
    } else if (provider === "together") {
      return {
        text: `<human>: ${row.input || row.question || ""}\n<bot>: ${row.output || row.answer || ""}`,
      };
    } else if (provider === "fireworks") {
      return {
        prompt: `Human: ${row.input || row.question || ""}\n\nAssistant:`,
        completion: ` ${row.output || row.answer || ""}`,
      };
    } else if (provider === "vertex") {
      return {
        input_text: row.input || row.question || "",
        output_text: row.output || row.answer || "",
      };
    }
    return row;
  });
}

export async function createDataset(params: {
  orgId: number;
  name: string;
  description?: string;
  format: DatasetFormat;
  rawData: unknown[];
}): Promise<ForgeDataset> {
  const providerFormats: Record<string, boolean> = {};
  for (const provider of ["openai", "together", "fireworks", "vertex"] as ForgeProvider[]) {
    const formatted = autoFormatForProvider(params.rawData, provider, params.format);
    providerFormats[provider] = formatted.length > 0;
  }

  const sizeBytes = JSON.stringify(params.rawData).length;

  const { rows } = await pool.query<{ id: number; created_at: string }>(
    `INSERT INTO forge_datasets (org_id, name, description, format, row_count, size_bytes, raw_data, provider_formats, uploaded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING id, created_at`,
    [params.orgId, params.name, params.description || "", params.format, params.rawData.length, sizeBytes, JSON.stringify(params.rawData), JSON.stringify(providerFormats)]
  );

  return {
    id: rows[0].id,
    orgId: params.orgId,
    name: params.name,
    description: params.description || "",
    format: params.format,
    rowCount: params.rawData.length,
    sizeBytes,
    providerFormats,
    uploadedAt: rows[0].created_at,
    createdAt: rows[0].created_at,
  };
}

export async function listDatasets(orgId: number): Promise<ForgeDataset[]> {
  const { rows } = await pool.query(
    `SELECT id, org_id, name, description, format, row_count, size_bytes, provider_formats, uploaded_at, created_at
     FROM forge_datasets WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [orgId]
  );
  return rows.map(r => ({
    id: r.id,
    orgId: r.org_id,
    name: r.name,
    description: r.description,
    format: r.format,
    rowCount: r.row_count,
    sizeBytes: r.size_bytes,
    providerFormats: r.provider_formats,
    uploadedAt: r.uploaded_at,
    createdAt: r.created_at,
  }));
}

export async function getDatasetFormatted(datasetId: number, provider: ForgeProvider): Promise<unknown[]> {
  const { rows } = await pool.query(`SELECT raw_data, format FROM forge_datasets WHERE id = $1`, [datasetId]);
  if (!rows.length) throw new Error("Dataset not found");
  return autoFormatForProvider(rows[0].raw_data as unknown[], provider, rows[0].format as DatasetFormat);
}

export async function launchJob(params: {
  orgId: number;
  name: string;
  provider: ForgeProvider;
  baseModel: string;
  datasetId: number;
  epochs?: number;
  batchSize?: number;
  learningRate?: number;
}): Promise<ForgeJob> {
  const epochs = params.epochs ?? 3;
  const batchSize = params.batchSize ?? 4;
  const learningRate = params.learningRate ?? 2e-5;

  const { rows: dsRows } = await pool.query(`SELECT row_count FROM forge_datasets WHERE id = $1`, [params.datasetId]);
  if (!dsRows.length) throw new Error("Dataset not found");

  const rowCount = dsRows[0].row_count as number;
  const tokenEstimate = rowCount * 512;
  const costEstimate = (tokenEstimate / 1000) * PROVIDER_COST_PER_1K_TOKENS[params.provider] * epochs;

  const { rows } = await pool.query<{ id: number; created_at: string }>(
    `INSERT INTO forge_jobs (org_id, name, provider, base_model, dataset_id, status, epochs, batch_size, learning_rate, cost_estimate_usd, progress)
     VALUES ($1, $2, $3, $4, $5, 'queued', $6, $7, $8, $9, 0)
     RETURNING id, created_at`,
    [params.orgId, params.name, params.provider, params.baseModel, params.datasetId, epochs, batchSize, learningRate, costEstimate]
  );

  const jobId = rows[0].id;

  setTimeout(() => simulateJobProgress(jobId, epochs, rowCount, costEstimate).catch(() => {}), 2000);

  return {
    id: jobId,
    orgId: params.orgId,
    name: params.name,
    provider: params.provider,
    baseModel: params.baseModel,
    datasetId: params.datasetId,
    status: "queued",
    epochs,
    batchSize,
    learningRate,
    progress: 0,
    costEstimateUsd: costEstimate,
    createdAt: rows[0].created_at,
    updatedAt: rows[0].created_at,
  };
}

async function simulateJobProgress(jobId: number, epochs: number, rowCount: number, costEstimate: number): Promise<void> {
  try {
    await pool.query(
      `UPDATE forge_jobs SET status = 'running', progress = 0, started_at = NOW(), external_job_id = $2, updated_at = NOW() WHERE id = $1`,
      [jobId, `ext_${Math.random().toString(36).slice(2, 10)}`]
    );

    const epochLogs: Array<{ epoch: number; trainingLoss: number; validationLoss: number; timestamp: string }> = [];
    let trainingLoss = 2.5 + Math.random() * 0.5;
    let validationLoss = 2.6 + Math.random() * 0.5;

    for (let ep = 1; ep <= epochs; ep++) {
      await new Promise(r => setTimeout(r, 8000));

      trainingLoss = Math.max(0.1, trainingLoss * (0.65 + Math.random() * 0.1));
      validationLoss = Math.max(0.12, validationLoss * (0.68 + Math.random() * 0.1));

      epochLogs.push({
        epoch: ep,
        trainingLoss: parseFloat(trainingLoss.toFixed(4)),
        validationLoss: parseFloat(validationLoss.toFixed(4)),
        timestamp: new Date().toISOString(),
      });

      const progress = (ep / epochs) * 100;

      await pool.query(
        `UPDATE forge_jobs SET progress = $2, training_loss = $3, validation_loss = $4, epoch_logs = $5, updated_at = NOW() WHERE id = $1`,
        [jobId, progress, trainingLoss, validationLoss, JSON.stringify(epochLogs)]
      );
    }

    const { rows } = await pool.query(`SELECT provider, base_model, cost_estimate_usd FROM forge_jobs WHERE id = $1`, [jobId]);
    if (!rows.length) return;

    const fineTunedModelId = `ft:${rows[0].base_model}:${jobId}`;
    const costActual = costEstimate * (0.9 + Math.random() * 0.2);

    await pool.query(
      `UPDATE forge_jobs SET status = 'completed', progress = 100, fine_tuned_model_id = $2,
       cost_actual_usd = $3, completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [jobId, fineTunedModelId, costActual]
    );

    await pool.query(
      `INSERT INTO forge_evolution_feed (org_id, job_id, provider, model_id, quality_score, cost_usd, prompt_strategy_hint, fed_to_alloy)
       VALUES (1, $1, $2, $3, $4, $5, $6, false)`,
      [jobId, rows[0].provider, fineTunedModelId, 0.7 + Math.random() * 0.25, costActual, "fine_tuned_specialization"]
    ).catch(() => {});

    logger.info({ jobId }, "Training Forge job simulation completed");
  } catch (err) {
    await pool.query(
      `UPDATE forge_jobs SET status = 'failed', error_message = $2, updated_at = NOW() WHERE id = $1`,
      [jobId, String(err)]
    ).catch(() => {});
  }
}

export async function listJobs(orgId: number, filters?: { provider?: string; status?: string }): Promise<ForgeJob[]> {
  let query = `SELECT j.*, d.name as dataset_name
    FROM forge_jobs j
    LEFT JOIN forge_datasets d ON j.dataset_id = d.id
    WHERE j.org_id = $1`;
  const params: unknown[] = [orgId];

  if (filters?.provider) { params.push(filters.provider); query += ` AND j.provider = $${params.length}`; }
  if (filters?.status) { params.push(filters.status); query += ` AND j.status = $${params.length}`; }
  query += " ORDER BY j.created_at DESC LIMIT 50";

  const { rows } = await pool.query(query, params);
  return rows.map(mapJob);
}

export async function getJob(jobId: number, orgId: number): Promise<ForgeJob | null> {
  const { rows } = await pool.query(
    `SELECT j.*, d.name as dataset_name FROM forge_jobs j LEFT JOIN forge_datasets d ON j.dataset_id = d.id
     WHERE j.id = $1 AND j.org_id = $2`,
    [jobId, orgId]
  );
  return rows.length ? mapJob(rows[0]) : null;
}

export async function cancelJob(jobId: number, orgId: number): Promise<void> {
  await pool.query(
    `UPDATE forge_jobs SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND org_id = $2 AND status IN ('queued', 'running')`,
    [jobId, orgId]
  );
}

function mapJob(r: any): ForgeJob {
  return {
    id: r.id,
    orgId: r.org_id,
    name: r.name,
    provider: r.provider,
    baseModel: r.base_model,
    datasetId: r.dataset_id,
    datasetName: r.dataset_name,
    status: r.status,
    epochs: r.epochs,
    batchSize: r.batch_size,
    learningRate: parseFloat(r.learning_rate),
    progress: parseFloat(r.progress ?? "0"),
    costEstimateUsd: parseFloat(r.cost_estimate_usd ?? "0"),
    costActualUsd: r.cost_actual_usd ? parseFloat(r.cost_actual_usd) : undefined,
    trainingLoss: r.training_loss ? parseFloat(r.training_loss) : undefined,
    validationLoss: r.validation_loss ? parseFloat(r.validation_loss) : undefined,
    fineTunedModelId: r.fine_tuned_model_id,
    externalJobId: r.external_job_id,
    errorMessage: r.error_message,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function createExperiment(params: {
  orgId: number;
  name: string;
  jobIds: number[];
  baselineModel: string;
  testPrompts: string[];
}): Promise<ForgeExperiment> {
  const results: ExperimentResult[] = [];

  const { rows: jobRows } = await pool.query(
    `SELECT id, provider, base_model, fine_tuned_model_id, status FROM forge_jobs WHERE id = ANY($1) AND org_id = $2`,
    [params.jobIds, params.orgId]
  );

  for (const prompt of params.testPrompts) {
    for (const job of jobRows) {
      const model = job.fine_tuned_model_id || job.base_model;
      results.push({
        jobId: job.id,
        provider: job.provider,
        model,
        prompt,
        output: generateSyntheticOutput(prompt, job.provider, model),
        latencyMs: Math.round(200 + Math.random() * 1800),
        qualityScore: parseFloat((0.55 + Math.random() * 0.40).toFixed(3)),
        costUsd: parseFloat((0.001 + Math.random() * 0.009).toFixed(4)),
      });
    }

    results.push({
      jobId: -1,
      provider: "baseline",
      model: params.baselineModel,
      prompt,
      output: generateSyntheticOutput(prompt, "baseline", params.baselineModel),
      latencyMs: Math.round(300 + Math.random() * 1200),
      qualityScore: parseFloat((0.50 + Math.random() * 0.35).toFixed(3)),
      costUsd: parseFloat((0.002 + Math.random() * 0.008).toFixed(4)),
    });
  }

  const avgScores: Record<string, number> = {};
  for (const r of results) {
    const key = r.model;
    if (!avgScores[key]) avgScores[key] = 0;
    avgScores[key] = (avgScores[key] + r.qualityScore) / 2;
  }
  const winner = Object.entries(avgScores).sort((a, b) => b[1] - a[1])[0]?.[0];

  const { rows } = await pool.query<{ id: number; created_at: string }>(
    `INSERT INTO forge_experiments (org_id, name, job_ids, baseline_model, test_prompts, results, winner, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed')
     RETURNING id, created_at`,
    [params.orgId, params.name, JSON.stringify(params.jobIds), params.baselineModel, JSON.stringify(params.testPrompts), JSON.stringify(results), winner]
  );

  return {
    id: rows[0].id,
    orgId: params.orgId,
    name: params.name,
    jobIds: params.jobIds,
    baselineModel: params.baselineModel,
    testPrompts: params.testPrompts,
    results,
    winner,
    status: "completed",
    createdAt: rows[0].created_at,
  };
}

function generateSyntheticOutput(prompt: string, provider: string, model: string): string {
  const intros: Record<string, string> = {
    openai: "Based on my training, ",
    together: "Drawing from the dataset, ",
    fireworks: "As a fine-tuned model, ",
    vertex: "Analyzing the context provided, ",
    baseline: "In response to your query, ",
  };
  const intro = intros[provider] || intros.baseline;
  return `${intro}here is my response to "${prompt.slice(0, 60)}...": [Simulated output from ${model}. This represents the model response quality after fine-tuning on your domain dataset.]`;
}

export async function listExperiments(orgId: number): Promise<ForgeExperiment[]> {
  const { rows } = await pool.query(
    `SELECT * FROM forge_experiments WHERE org_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [orgId]
  );
  return rows.map(r => ({
    id: r.id,
    orgId: r.org_id,
    name: r.name,
    jobIds: r.job_ids as number[],
    baselineModel: r.baseline_model,
    testPrompts: r.test_prompts as string[],
    results: r.results as ExperimentResult[],
    winner: r.winner,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function getEvolutionFeed(orgId: number): Promise<ParetoDataPoint[]> {
  const { rows } = await pool.query(
    `SELECT ef.*, j.name as job_name FROM forge_evolution_feed ef
     LEFT JOIN forge_jobs j ON ef.job_id = j.id
     WHERE ef.org_id = $1 ORDER BY ef.created_at DESC LIMIT 100`,
    [orgId]
  );
  return rows.map(r => ({
    jobId: r.job_id,
    provider: r.provider,
    model: r.model_id,
    qualityScore: parseFloat(r.quality_score ?? "0"),
    costUsd: parseFloat(r.cost_usd ?? "0"),
    latencyMs: parseFloat(r.latency_ms ?? "0"),
    label: r.job_name || r.model_id,
  }));
}

export async function getProviderModels(): Promise<Record<ForgeProvider, string[]>> {
  return PROVIDER_BASE_MODELS;
}

export async function forgeDashboard(orgId: number): Promise<Record<string, unknown>> {
  const [jobsResult, datasetsResult, experimentsResult, feedResult] = await Promise.all([
    pool.query(
      `SELECT count(*) as total,
              count(*) FILTER (WHERE status = 'running') as running,
              count(*) FILTER (WHERE status = 'completed') as completed,
              count(*) FILTER (WHERE status = 'failed') as failed,
              COALESCE(sum(cost_actual_usd), 0) as total_cost,
              COALESCE(avg(training_loss) FILTER (WHERE status = 'completed'), 0) as avg_loss
       FROM forge_jobs WHERE org_id = $1`,
      [orgId]
    ),
    pool.query(`SELECT count(*) as total, COALESCE(sum(row_count), 0) as total_rows FROM forge_datasets WHERE org_id = $1`, [orgId]),
    pool.query(`SELECT count(*) as total FROM forge_experiments WHERE org_id = $1`, [orgId]),
    pool.query(
      `SELECT provider, count(*) as job_count, avg(quality_score) as avg_quality, avg(cost_usd) as avg_cost
       FROM forge_evolution_feed WHERE org_id = $1 GROUP BY provider`,
      [orgId]
    ),
  ]);

  return {
    jobs: jobsResult.rows[0],
    datasets: datasetsResult.rows[0],
    experiments: experimentsResult.rows[0],
    providerStats: feedResult.rows,
  };
}
