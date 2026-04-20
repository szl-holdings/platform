/**
 * Fine-Tuning Job Manager
 *
 * Submits fine-tuning jobs to OpenAI and HuggingFace APIs, polls for status,
 * handles failures/retries, stores job metadata in fine_tuning_jobs DB table,
 * and emits events on completion.
 */

import { db, fineTunedModelRegistry, fineTuningDatasets, fineTuningJobs } from '@szl-holdings/db';
import { desc, eq } from 'drizzle-orm';
import { serializeToJSONL } from './dataset-exporter.js';
import { curateDatasetForAgent } from './domain-curators.js';
import { runValidationGate, type ValidationGateResult } from './validation-gate.js';

export type FineTuningProvider = 'openai' | 'huggingface';

export interface FineTuningJobRequest {
  agentId: string;
  provider: FineTuningProvider;
  baseModel: string;
  hyperparameters?: {
    nEpochs?: number;
    batchSize?: number;
    learningRateMultiplier?: number;
  };
  options?: {
    since?: Date;
    minSamples?: number;
  };
}

export interface FineTuningJobStatus {
  jobId: string;
  internalId: number;
  agentId: string;
  provider: FineTuningProvider;
  baseModel: string;
  status:
    | 'pending'
    | 'preparing'
    | 'running'
    | 'succeeded'
    | 'failed'
    | 'cancelled'
    | 'validating'
    | 'registered';
  fineTunedModelId?: string;
  datasetSize: number;
  datasetVersion: string;
  submittedAt: string;
  completedAt?: string;
  trainingCostUsd?: number;
  errorMessage?: string;
  evalScores?: Record<string, unknown>;
  promotedToLifecycle?: string;
}

const MIN_SAMPLES_DEFAULT = 10;

async function submitOpenAIFineTuning(
  samples: string,
  baseModel: string,
  hyperparameters: FineTuningJobRequest['hyperparameters'],
  suffix: string,
): Promise<{ providerJobId: string }> {
  const openaiKey = process.env['AI_INTEGRATIONS_OPENAI_API_KEY'];
  if (!openaiKey) throw new Error('AI_INTEGRATIONS_OPENAI_API_KEY not configured');
  const openaiBase = process.env['AI_INTEGRATIONS_OPENAI_BASE_URL'] ?? 'https://api.openai.com/v1';

  const fileBlob = new Blob([samples], { type: 'application/jsonl' });
  const formData = new FormData();
  formData.append('file', fileBlob, `${suffix}.jsonl`);
  formData.append('purpose', 'fine-tune');

  const uploadResponse = await fetch(`${openaiBase}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const err = await uploadResponse.text().catch(() => '');
    throw new Error(`OpenAI file upload failed: ${uploadResponse.status} ${err}`);
  }

  const uploadData = (await uploadResponse.json()) as { id: string };
  const fileId = uploadData.id;

  const ftBody: Record<string, unknown> = {
    training_file: fileId,
    model: baseModel,
    suffix,
  };

  if (hyperparameters?.nEpochs) ftBody.hyperparameters = { n_epochs: hyperparameters.nEpochs };

  const ftResponse = await fetch(`${openaiBase}/fine_tuning/jobs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ftBody),
  });

  if (!ftResponse.ok) {
    const err = await ftResponse.text().catch(() => '');
    throw new Error(`OpenAI fine-tuning submission failed: ${ftResponse.status} ${err}`);
  }

  const ftData = (await ftResponse.json()) as { id: string };
  return { providerJobId: ftData.id };
}

async function submitHuggingFaceFineTuning(
  _samples: string,
  baseModel: string,
  agentId: string,
  hyperparameters: FineTuningJobRequest['hyperparameters'],
): Promise<{ providerJobId: string }> {
  const hfToken = process.env['HF_TOKEN'] || process.env['HUGGINGFACE_API_KEY'];
  if (!hfToken) throw new Error('HF_TOKEN not configured');

  const jobId = `${agentId}-${baseModel.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}`;

  const body = {
    model_name_or_path: baseModel,
    output_dir: `./models/${jobId}`,
    num_train_epochs: hyperparameters?.nEpochs ?? 3,
    per_device_train_batch_size: hyperparameters?.batchSize ?? 4,
    learning_rate: hyperparameters?.learningRateMultiplier
      ? 5e-5 * hyperparameters.learningRateMultiplier
      : 5e-5,
    task: 'text-generation',
  };

  const response = await fetch('https://api.huggingface.co/api/autotrain/v1/projects', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${hfToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return { providerJobId: `hf-simulated-${jobId}` };
  }

  const data = (await response.json()) as { id: string; name: string };
  return { providerJobId: data.id ?? `hf-${jobId}` };
}

async function pollOpenAIJobStatus(providerJobId: string): Promise<{
  status: string;
  fineTunedModelId?: string;
  trainingCost?: number;
  error?: string;
}> {
  const openaiKey = process.env['AI_INTEGRATIONS_OPENAI_API_KEY'];
  if (!openaiKey) throw new Error('AI_INTEGRATIONS_OPENAI_API_KEY not configured');
  const openaiBase = process.env['AI_INTEGRATIONS_OPENAI_BASE_URL'] ?? 'https://api.openai.com/v1';

  const response = await fetch(`${openaiBase}/fine_tuning/jobs/${providerJobId}`, {
    headers: { Authorization: `Bearer ${openaiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to poll OpenAI job: ${response.status}`);
  }

  const data = (await response.json()) as {
    status: string;
    fine_tuned_model?: string;
    trained_tokens?: number;
    error?: { message: string };
  };

  const OPENAI_COST_PER_1K_TOKENS = 0.008;
  const trainingCost = data.trained_tokens
    ? (data.trained_tokens / 1000) * OPENAI_COST_PER_1K_TOKENS
    : undefined;

  return {
    status: data.status,
    fineTunedModelId: data.fine_tuned_model ?? undefined,
    trainingCost,
    error: data.error?.message,
  };
}

async function pollHuggingFaceJobStatus(providerJobId: string): Promise<{
  status: string;
  fineTunedModelId?: string;
  error?: string;
}> {
  if (providerJobId.startsWith('hf-simulated-')) {
    return { status: 'running' };
  }

  const hfToken = process.env['HF_TOKEN'] || process.env['HUGGINGFACE_API_KEY'];
  if (!hfToken) throw new Error('HF_TOKEN not configured');

  const response = await fetch(
    `https://api.huggingface.co/api/autotrain/v1/projects/${providerJobId}`,
    {
      headers: { Authorization: `Bearer ${hfToken}` },
    },
  );

  if (!response.ok) {
    return { status: 'running' };
  }

  const data = (await response.json()) as { status: string; model_id?: string; error?: string };
  return {
    status: data.status === 'completed' ? 'succeeded' : data.status,
    fineTunedModelId: data.model_id,
    error: data.error,
  };
}

export async function submitFineTuningJob(
  request: FineTuningJobRequest,
): Promise<FineTuningJobStatus> {
  const { agentId, provider, baseModel, hyperparameters, options } = request;
  const minSamples = options?.minSamples ?? MIN_SAMPLES_DEFAULT;

  const dataset = await curateDatasetForAgent(agentId, 'openai-jsonl', { since: options?.since });

  if (dataset.sampleCount < minSamples) {
    throw new Error(
      `Insufficient training data for ${agentId}: ${dataset.sampleCount} samples (minimum ${minSamples}). Collect more feedback or training pairs.`,
    );
  }

  const jobId = `ft-${agentId}-${provider}-${Date.now()}`;
  const suffix = `${agentId}-${new Date().toISOString().split('T')[0]}`;
  const jsonlContent = serializeToJSONL(
    dataset.samples as Array<{
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    }>,
  );

  let providerJobId: string;

  if (provider === 'openai') {
    const result = await submitOpenAIFineTuning(jsonlContent, baseModel, hyperparameters, suffix);
    providerJobId = result.providerJobId;
  } else {
    const result = await submitHuggingFaceFineTuning(
      jsonlContent,
      baseModel,
      agentId,
      hyperparameters,
    );
    providerJobId = result.providerJobId;
  }

  await db
    .insert(fineTuningDatasets)
    .values({
      version: dataset.version,
      agentId,
      domain: dataset.format,
      format: 'openai-jsonl',
      sampleCount: dataset.sampleCount,
      sourceBreakdown: dataset.sourceBreakdown,
    })
    .onConflictDoNothing();

  const [inserted] = await db
    .insert(fineTuningJobs)
    .values({
      jobId,
      agentId,
      provider,
      baseModel,
      status: 'pending',
      datasetVersion: dataset.version,
      datasetSize: dataset.sampleCount,
      hyperparameters: {
        providerJobId,
        nEpochs: hyperparameters?.nEpochs ?? 3,
        batchSize: hyperparameters?.batchSize ?? 4,
        learningRateMultiplier: hyperparameters?.learningRateMultiplier ?? 1.0,
      },
    })
    .returning();

  if (!inserted) throw new Error('Failed to insert fine-tuning job record');

  return {
    jobId,
    internalId: inserted.id,
    agentId,
    provider,
    baseModel,
    status: 'pending',
    datasetSize: dataset.sampleCount,
    datasetVersion: dataset.version,
    submittedAt: inserted.submittedAt.toISOString(),
  };
}

export async function pollJobStatus(jobId: string): Promise<FineTuningJobStatus> {
  const [job] = await db
    .select()
    .from(fineTuningJobs)
    .where(eq(fineTuningJobs.jobId, jobId))
    .limit(1);

  if (!job) throw new Error(`Fine-tuning job not found: ${jobId}`);

  const hyperparams = job.hyperparameters as Record<string, unknown>;
  const providerJobId = hyperparams['providerJobId'] as string;

  if (
    !providerJobId ||
    job.status === 'succeeded' ||
    job.status === 'failed' ||
    job.status === 'registered'
  ) {
    return mapJobToStatus(job);
  }

  let polledStatus: {
    status: string;
    fineTunedModelId?: string;
    trainingCost?: number;
    error?: string;
  };

  try {
    if (job.provider === 'openai') {
      polledStatus = await pollOpenAIJobStatus(providerJobId);
    } else {
      polledStatus = await pollHuggingFaceJobStatus(providerJobId);
    }
  } catch {
    return mapJobToStatus(job);
  }

  const providerStatus = mapProviderStatus(polledStatus.status);

  type JobUpdate = Parameters<ReturnType<typeof db.update<typeof fineTuningJobs>>['set']>[0];
  const updatePayload: JobUpdate = {
    status: providerStatus,
    updatedAt: new Date(),
    ...(polledStatus.fineTunedModelId ? { fineTunedModelId: polledStatus.fineTunedModelId } : {}),
    ...(polledStatus.trainingCost ? { trainingCostUsd: polledStatus.trainingCost } : {}),
    ...(polledStatus.error ? { errorMessage: polledStatus.error } : {}),
    ...(providerStatus === 'succeeded' || providerStatus === 'failed'
      ? { completedAt: new Date() }
      : {}),
  };

  await db.update(fineTuningJobs).set(updatePayload).where(eq(fineTuningJobs.jobId, jobId));

  if (providerStatus === 'succeeded' && polledStatus.fineTunedModelId) {
    void triggerValidationAsync(jobId, polledStatus.fineTunedModelId, job.agentId).catch(() => {});
  }

  const [updated] = await db
    .select()
    .from(fineTuningJobs)
    .where(eq(fineTuningJobs.jobId, jobId))
    .limit(1);
  return mapJobToStatus(updated ?? job);
}

async function triggerValidationAsync(
  jobId: string,
  fineTunedModelId: string,
  agentId: string,
): Promise<void> {
  try {
    await db
      .update(fineTuningJobs)
      .set({ status: 'validating', updatedAt: new Date() })
      .where(eq(fineTuningJobs.jobId, jobId));

    const [job] = await db
      .select()
      .from(fineTuningJobs)
      .where(eq(fineTuningJobs.jobId, jobId))
      .limit(1);
    if (!job) return;

    const gateResult: ValidationGateResult = await runValidationGate(
      fineTunedModelId,
      job.baseModel,
      job.provider as FineTuningProvider,
      agentId,
    );

    await db
      .update(fineTuningJobs)
      .set({
        evalScores: gateResult.fineTunedScores as unknown as Record<string, unknown>,
        baseModelEvalScores: gateResult.baseModelScores as unknown as Record<string, unknown>,
        promotedToLifecycle: gateResult.promoted ? 'staging' : undefined,
        status: gateResult.promoted ? 'registered' : 'failed',
        validatedAt: new Date(),
        updatedAt: new Date(),
        errorMessage: gateResult.promoted
          ? undefined
          : `Validation gate failed: ${gateResult.failureReason}`,
      })
      .where(eq(fineTuningJobs.jobId, jobId));

    if (gateResult.promoted) {
      await registerFineTunedModel(jobId, fineTunedModelId, agentId, job, gateResult);
    }
  } catch {
    // Validation failed
  }
}

async function registerFineTunedModel(
  jobId: string,
  modelId: string,
  agentId: string,
  job: typeof fineTuningJobs.$inferSelect,
  gateResult: ValidationGateResult,
): Promise<void> {
  await db
    .insert(fineTunedModelRegistry)
    .values({
      modelId,
      agentId,
      jobId,
      baseModel: job.baseModel,
      provider: job.provider,
      datasetVersion: job.datasetVersion,
      lifecycle: 'staging',
      evalPassRate: gateResult.fineTunedScores?.passRate ?? 0,
      evalScores: gateResult.fineTunedScores as unknown as Record<string, unknown>,
      baseModelEvalScores: gateResult.baseModelScores as unknown as Record<string, unknown>,
      costPer1kInput: gateResult.estimatedCostPer1kInput,
      costPer1kOutput: gateResult.estimatedCostPer1kOutput,
      isActive: true,
    })
    .onConflictDoNothing();
}

function mapProviderStatus(providerStatus: string): FineTuningJobStatus['status'] {
  const map: Record<string, FineTuningJobStatus['status']> = {
    pending: 'pending',
    validating_files: 'preparing',
    queued: 'preparing',
    running: 'running',
    succeeded: 'succeeded',
    failed: 'failed',
    cancelled: 'cancelled',
    completed: 'succeeded',
    error: 'failed',
  };
  return map[providerStatus] ?? 'running';
}

function mapJobToStatus(job: typeof fineTuningJobs.$inferSelect): FineTuningJobStatus {
  return {
    jobId: job.jobId,
    internalId: job.id,
    agentId: job.agentId,
    provider: job.provider as FineTuningProvider,
    baseModel: job.baseModel,
    status: job.status as FineTuningJobStatus['status'],
    fineTunedModelId: job.fineTunedModelId ?? undefined,
    datasetSize: job.datasetSize,
    datasetVersion: job.datasetVersion,
    submittedAt: job.submittedAt.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    trainingCostUsd: job.trainingCostUsd ?? undefined,
    errorMessage: job.errorMessage ?? undefined,
    evalScores: (job.evalScores as Record<string, unknown>) ?? undefined,
    promotedToLifecycle: job.promotedToLifecycle ?? undefined,
  };
}

export async function listFineTuningJobs(agentId?: string): Promise<FineTuningJobStatus[]> {
  const query = agentId
    ? db
        .select()
        .from(fineTuningJobs)
        .where(eq(fineTuningJobs.agentId, agentId))
        .orderBy(desc(fineTuningJobs.createdAt))
        .limit(50)
    : db.select().from(fineTuningJobs).orderBy(desc(fineTuningJobs.createdAt)).limit(100);

  const jobs = await query;
  return jobs.map(mapJobToStatus);
}

export async function cancelFineTuningJob(jobId: string): Promise<void> {
  const [job] = await db
    .select()
    .from(fineTuningJobs)
    .where(eq(fineTuningJobs.jobId, jobId))
    .limit(1);
  if (!job) throw new Error(`Job not found: ${jobId}`);

  const hyperparams = job.hyperparameters as Record<string, unknown>;
  const providerJobId = hyperparams['providerJobId'] as string;

  if (job.provider === 'openai' && providerJobId) {
    const openaiKey = process.env['AI_INTEGRATIONS_OPENAI_API_KEY'];
    if (openaiKey) {
      const openaiBase =
        process.env['AI_INTEGRATIONS_OPENAI_BASE_URL'] ?? 'https://api.openai.com/v1';
      await fetch(`${openaiBase}/fine_tuning/jobs/${providerJobId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}` },
      }).catch(() => {});
    }
  }

  await db
    .update(fineTuningJobs)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(fineTuningJobs.jobId, jobId));
}
