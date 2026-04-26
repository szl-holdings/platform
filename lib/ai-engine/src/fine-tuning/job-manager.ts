/**
 * Fine-Tuning Job Manager
 *
 * Submits fine-tuning jobs to OpenAI and Gemini APIs, polls for status,
 * handles failures/retries, runs data quality gates before submission,
 * stores job metadata in fine_tuning_jobs DB table, and emits events on completion.
 */

import { db, auditLogsTable, fineTunedModelRegistry, fineTuningDatasets, fineTuningJobs } from '@szl-holdings/db';
import { desc, eq } from 'drizzle-orm';
import { serializeToJSONL, serializeDPOToJSONL, type OpenAIDPOSample } from './dataset-exporter.js';
import { curateDatasetForAgent } from './domain-curators.js';
import { runValidationGate, type ValidationGateResult } from './validation-gate.js';
import { runDataQualityGate } from './data-quality-gate.js';

export type FineTuningProvider = 'openai' | 'gemini' | 'huggingface';

export interface FineTuningJobRequest {
  agentId: string;
  provider: FineTuningProvider;
  baseModel: string;
  format?: 'openai-jsonl' | 'openai-dpo';
  triggeredBy?: 'manual' | 'auto';
  hyperparameters?: {
    nEpochs?: number;
    batchSize?: number;
    learningRateMultiplier?: number;
  };
  options?: {
    since?: Date;
    minSamples?: number;
    skipQualityGate?: boolean;
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
  qualityReport?: Record<string, unknown>;
}

const MIN_SAMPLES_DEFAULT = 10;

async function submitOpenAIFineTuning(
  samples: string,
  baseModel: string,
  hyperparameters: FineTuningJobRequest['hyperparameters'],
  suffix: string,
  isDPO = false,
): Promise<{ providerJobId: string }> {
  const openaiKey = process.env.OPENAI_FINE_TUNING_API_KEY;
  if (!openaiKey)
    throw new Error(
      'OPENAI_FINE_TUNING_API_KEY not configured (set this to a direct OpenAI key, not the proxy key)',
    );
  const openaiBase = process.env.OPENAI_FINE_TUNING_BASE_URL ?? 'https://api.openai.com/v1';

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

  if (isDPO) {
    ftBody.method = { type: 'dpo' };
  }

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

async function submitGeminiFineTuning(
  samples: string,
  baseModel: string,
  agentId: string,
  hyperparameters: FineTuningJobRequest['hyperparameters'],
): Promise<{ providerJobId: string }> {
  const geminiKey = process.env.GEMINI_FINE_TUNING_API_KEY ?? process.env.GEMINI_API_KEY ?? process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!geminiKey) throw new Error('GEMINI_FINE_TUNING_API_KEY not configured');

  const geminiBase =
    process.env.GEMINI_FINE_TUNING_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta';

  let trainingData: Array<{ text_input: string; output: string }> = [];
  try {
    const lines = samples.split('\n').filter(Boolean);
    for (const line of lines) {
      const parsed = JSON.parse(line) as {
        messages?: Array<{ role: string; content: string }>;
      };
      if (parsed.messages) {
        const userMsg = parsed.messages.find((m) => m.role === 'user')?.content ?? '';
        const assistantMsg = parsed.messages.find((m) => m.role === 'assistant')?.content ?? '';
        if (userMsg && assistantMsg) {
          trainingData.push({ text_input: userMsg, output: assistantMsg });
        }
      }
    }
  } catch {
    throw new Error('Failed to parse training data for Gemini format');
  }

  if (trainingData.length === 0) {
    throw new Error('No valid training samples for Gemini fine-tuning');
  }

  const displayName = `${agentId}-${new Date().toISOString().split('T')[0]}`;

  const requestBody = {
    display_name: displayName,
    base_model: baseModel,
    tuning_task: {
      training_data: {
        examples: {
          examples: trainingData.slice(0, 500),
        },
      },
      hyperparameters: {
        ...(hyperparameters?.nEpochs ? { epoch_count: hyperparameters.nEpochs } : {}),
        ...(hyperparameters?.batchSize ? { batch_size: hyperparameters.batchSize } : {}),
        ...(hyperparameters?.learningRateMultiplier
          ? { learning_rate_multiplier: hyperparameters.learningRateMultiplier }
          : {}),
      },
    },
  };

  const response = await fetch(
    `${geminiBase}/tunedModels?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Gemini fine-tuning submission failed: ${response.status} ${err}`);
  }

  const data = (await response.json()) as { name?: string; metadata?: { tunedModel?: string } };
  // `data.name` is the operation resource (e.g. "operations/abc123") returned by the API.
  // A missing `name` means the response is malformed — we cannot poll without it.
  if (!data.name) {
    throw new Error(
      `Gemini fine-tuning submission succeeded but response contained no operation name. ` +
        `Cannot track job lifecycle. Raw response keys: ${Object.keys(data).join(', ')}`,
    );
  }
  return { providerJobId: data.name };
}

async function submitHuggingFaceFineTuning(
  samples: string,
  baseModel: string,
  agentId: string,
  hyperparameters: FineTuningJobRequest['hyperparameters'],
): Promise<{ providerJobId: string }> {
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!hfToken) throw new Error('HUGGINGFACE_API_KEY not configured for HuggingFace fine-tuning');

  const hfUsername = process.env.HF_USERNAME;
  if (!hfUsername) throw new Error('HF_USERNAME not configured (required for AutoTrain dataset upload)');

  const autotrainBase = process.env.HF_AUTOTRAIN_BASE_URL ?? 'https://huggingface.co/api/autotrain';
  const hubApiBase = process.env.HF_HUB_API_BASE_URL ?? 'https://huggingface.co/api';

  const projectName = `szl-${agentId}-ft-${Date.now()}`;
  const datasetRepoId = `${hfUsername}/${projectName}-data`;

  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${hfToken}`,
    'Content-Type': 'application/json',
  };

  const createRepoResp = await fetch(`${hubApiBase}/repos/create`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ type: 'dataset', name: `${projectName}-data`, private: true }),
  });

  if (!createRepoResp.ok) {
    const err = await createRepoResp.text().catch(() => '');
    if (!err.includes('You already created this dataset repo')) {
      throw new Error(`HF dataset repo creation failed: ${createRepoResp.status} ${err}`);
    }
  }

  /**
   * AutoTrain SFT expects rows with `instruction` and `output` string columns.
   * The incoming `samples` is openai-jsonl: each line is {"messages":[{role,content}...]}.
   * Transform to {"instruction":"<user turn>","output":"<assistant turn>"} before upload.
   */
  const hfSftLines = samples
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        const row = JSON.parse(line) as {
          messages?: Array<{ role: string; content: string }>;
          instruction?: string;
          output?: string;
        };
        if (row.instruction !== undefined && row.output !== undefined) {
          return JSON.stringify({ instruction: row.instruction, output: row.output });
        }
        const messages = row.messages ?? [];
        const userMsg = [...messages].reverse().find((m) => m.role === 'user');
        const assistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
        if (!userMsg || !assistantMsg) return null;
        return JSON.stringify({ instruction: userMsg.content, output: assistantMsg.content });
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .join('\n');

  if (!hfSftLines) {
    throw new Error('HF fine-tuning: no valid instruction/output pairs found after converting training data');
  }

  const fileContent = Buffer.from(hfSftLines, 'utf-8').toString('base64');
  const commitResp = await fetch(
    `${hubApiBase}/datasets/${datasetRepoId}/commit/main`,
    {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        commit_message: `Upload training data for ${agentId} fine-tuning`,
        operations: [
          {
            operation: 'addOrUpdate',
            path: 'train.jsonl',
            encoding: 'base64',
            content: fileContent,
          },
        ],
      }),
    },
  );

  if (!commitResp.ok) {
    const err = await commitResp.text().catch(() => '');
    throw new Error(`HF training data upload failed: ${commitResp.status} ${err}`);
  }

  const autotrainBody = {
    proj_name: projectName,
    username: hfUsername,
    task: 'llm-sft',
    config: {
      base_model: baseModel,
      data_path: datasetRepoId,
      train_split: 'train',
      col_mapping: { text_column: 'instruction', target_column: 'output' },
      model_max_length: 2048,
      epochs: hyperparameters?.nEpochs ?? 3,
      batch_size: hyperparameters?.batchSize ?? 4,
      lr: hyperparameters?.learningRateMultiplier ? hyperparameters.learningRateMultiplier * 2e-4 : 2e-4,
      mixed_precision: 'bf16',
      use_peft: true,
      quantization: 'int4',
    },
  };

  const autotrainResp = await fetch(`${autotrainBase}/projects`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(autotrainBody),
  });

  if (!autotrainResp.ok) {
    const err = await autotrainResp.text().catch(() => '');
    throw new Error(`HF AutoTrain job submission failed: ${autotrainResp.status} ${err}`);
  }

  const autotrainData = (await autotrainResp.json()) as { id?: string; proj_name?: string };
  const providerJobId = autotrainData.id ?? autotrainData.proj_name ?? projectName;

  return { providerJobId };
}

async function pollHuggingFaceJobStatus(providerJobId: string): Promise<{
  status: string;
  fineTunedModelId?: string;
  error?: string;
}> {
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!hfToken) throw new Error('HUGGINGFACE_API_KEY not configured');

  const autotrainBase = process.env.HF_AUTOTRAIN_BASE_URL ?? 'https://huggingface.co/api/autotrain';

  const response = await fetch(`${autotrainBase}/projects/${providerJobId}`, {
    headers: { Authorization: `Bearer ${hfToken}` },
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`HF AutoTrain job poll failed: ${response.status} ${errBody}`);
  }

  const data = (await response.json()) as {
    status?: string;
    model_id?: string;
    error?: string;
  };

  const rawStatus = (data.status ?? 'running').toLowerCase();
  const statusMap: Record<string, string> = {
    completed: 'succeeded',
    success: 'succeeded',
    error: 'failed',
    failed: 'failed',
    running: 'running',
    pending: 'pending',
    queued: 'pending',
    training: 'running',
  };
  const mappedStatus = statusMap[rawStatus] ?? 'running';

  return {
    status: mappedStatus,
    ...(data.model_id ? { fineTunedModelId: data.model_id } : {}),
    ...(data.error ? { error: data.error } : {}),
  };
}

async function pollOpenAIJobStatus(providerJobId: string): Promise<{
  status: string;
  fineTunedModelId?: string;
  trainingCost?: number;
  error?: string;
}> {
  const openaiKey = process.env.OPENAI_FINE_TUNING_API_KEY;
  if (!openaiKey) throw new Error('OPENAI_FINE_TUNING_API_KEY not configured');
  const openaiBase = process.env.OPENAI_FINE_TUNING_BASE_URL ?? 'https://api.openai.com/v1';

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

  const _errMsg = data.error?.message;
  return {
    status: data.status,
    ...(data.fine_tuned_model !== undefined ? { fineTunedModelId: data.fine_tuned_model } : {}),
    ...(trainingCost !== undefined ? { trainingCost } : {}),
    ...(_errMsg !== undefined ? { error: _errMsg } : {}),
  };
}

async function pollGeminiJobStatus(providerJobId: string): Promise<{
  status: string;
  fineTunedModelId?: string;
  error?: string;
}> {
  const geminiKey = process.env.GEMINI_FINE_TUNING_API_KEY ?? process.env.GEMINI_API_KEY ?? process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!geminiKey) throw new Error('GEMINI_FINE_TUNING_API_KEY not configured');

  const geminiBase =
    process.env.GEMINI_FINE_TUNING_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta';

  const url = `${geminiBase}/${providerJobId}?key=${geminiKey}`;

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Gemini job poll failed: ${response.status} ${errBody}`);
  }

  const data = (await response.json()) as {
    done?: boolean;
    error?: { message: string };
    response?: { name?: string };
    metadata?: {
      tunedModel?: string;
      state?: string;
      totalSteps?: number;
      completedSteps?: number;
    };
  };

  if (data.error) {
    return { status: 'failed', error: data.error.message };
  }

  if (data.done) {
    const modelName = data.response?.name ?? data.metadata?.tunedModel;
    return {
      status: 'succeeded',
      ...(modelName ? { fineTunedModelId: modelName } : {}),
    };
  }

  const state = data.metadata?.state?.toLowerCase() ?? 'running';
  return { status: state === 'active' || state === 'creating' ? 'running' : state };
}

export async function submitFineTuningJob(
  request: FineTuningJobRequest,
): Promise<FineTuningJobStatus> {
  const {
    agentId,
    provider,
    baseModel,
    hyperparameters,
    options,
    format = 'openai-jsonl',
    triggeredBy = 'manual',
  } = request;
  const minSamples = options?.minSamples ?? MIN_SAMPLES_DEFAULT;
  const isDPO = format === 'openai-dpo';

  // DPO preference-pair training is only supported by the OpenAI fine-tuning API.
  if (isDPO && provider !== 'openai') {
    throw new Error(
      `DPO format (openai-dpo) is only supported with provider 'openai', got '${provider}'.`,
    );
  }

  const exportFormat = isDPO ? 'openai-dpo' : 'openai-jsonl';
  const dataset = await curateDatasetForAgent(agentId, exportFormat, (options?.since !== undefined ? { since: options.since } : {}));

  if (dataset.sampleCount < minSamples) {
    throw new Error(
      `Insufficient training data for ${agentId}: ${dataset.sampleCount} samples (minimum ${minSamples}). Collect more feedback or training pairs.`,
    );
  }

  let qualityReportData: Record<string, unknown> | undefined;

  if (!options?.skipQualityGate) {
    const qGateResult = await runDataQualityGate(
      dataset.samples as unknown[],
      dataset.sourceBreakdown as unknown as Record<string, number>,
      { minSamples },
    );
    qualityReportData = qGateResult as unknown as Record<string, unknown>;

    // Audit: quality gate decision
    void db
      .insert(auditLogsTable)
      .values({
        actionType: qGateResult.passed
          ? 'fine_tuning.quality_gate.passed'
          : 'fine_tuning.quality_gate.blocked',
        entityType: 'fine_tuning_dataset',
        entityId: agentId,
        payloadJson: {
          agentId,
          sampleCount: dataset.sampleCount,
          passed: qGateResult.passed,
          blockedReasons: qGateResult.blockedReasons,
          warnings: qGateResult.warnings,
          score: qGateResult.score,
        } as Record<string, unknown>,
      })
      .catch(() => {});

    if (!qGateResult.passed) {
      throw new Error(
        `Training data quality gate failed: ${qGateResult.blockedReasons.join('; ')}`,
      );
    }
  }

  const jobId = `ft-${agentId}-${provider}-${Date.now()}`;
  const suffix = `${agentId}-${new Date().toISOString().split('T')[0]}`;

  // Guard against double-suffix if dataset version already ends with '-dpo' (idempotent re-export)
  const DPO_SUFFIX = '-dpo';
  const versionWithDPO = isDPO
    ? dataset.version.endsWith(DPO_SUFFIX)
      ? dataset.version
      : `${dataset.version}${DPO_SUFFIX}`
    : dataset.version;

  let jsonlContent: string;
  if (isDPO) {
    jsonlContent = serializeDPOToJSONL(dataset.samples as OpenAIDPOSample[]);
  } else {
    jsonlContent = serializeToJSONL(
      dataset.samples as Array<{
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
      }>,
    );
  }

  let providerJobId: string;

  if (provider === 'openai') {
    const result = await submitOpenAIFineTuning(jsonlContent, baseModel, hyperparameters, suffix, isDPO);
    providerJobId = result.providerJobId;
  } else if (provider === 'huggingface') {
    const result = await submitHuggingFaceFineTuning(jsonlContent, baseModel, agentId, hyperparameters);
    providerJobId = result.providerJobId;
  } else {
    const result = await submitGeminiFineTuning(jsonlContent, baseModel, agentId, hyperparameters);
    providerJobId = result.providerJobId;
  }

  await db
    .insert(fineTuningDatasets)
    .values({
      version: versionWithDPO,
      agentId,
      domain: dataset.format,
      format: exportFormat,
      sampleCount: dataset.sampleCount,
      sourceBreakdown: dataset.sourceBreakdown,
      ...(qualityReportData ? { qualityReport: qualityReportData } : {}),
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
      datasetVersion: versionWithDPO,
      datasetSize: dataset.sampleCount,
      triggeredBy,
      qualityGatePassed: qualityReportData ? true : undefined,
      qualityReport: qualityReportData,
      hyperparameters: {
        providerJobId,
        nEpochs: hyperparameters?.nEpochs ?? 3,
        batchSize: hyperparameters?.batchSize ?? 4,
        learningRateMultiplier: hyperparameters?.learningRateMultiplier ?? 1.0,
        format: exportFormat,
        isDPO,
      },
    })
    .returning();

  if (!inserted) throw new Error('Failed to insert fine-tuning job record');

  // Audit: job submission lifecycle event
  void db
    .insert(auditLogsTable)
    .values({
      actionType: 'fine_tuning.job.submitted',
      entityType: 'fine_tuning_job',
      entityId: jobId,
      payloadJson: {
        jobId,
        agentId,
        provider,
        baseModel,
        triggeredBy,
        format: exportFormat,
        isDPO,
        datasetVersion: versionWithDPO,
        datasetSize: dataset.sampleCount,
        qualityGatePassed: qualityReportData != null,
        providerJobId,
      } as Record<string, unknown>,
    })
    .catch(() => {});

  return {
    jobId,
    internalId: inserted.id,
    agentId,
    provider,
    baseModel,
    status: 'pending',
    datasetSize: dataset.sampleCount,
    datasetVersion: versionWithDPO,
    submittedAt: inserted.submittedAt.toISOString(),
    ...(qualityReportData ? { qualityReport: qualityReportData } : {}),
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
  const providerJobId = hyperparams.providerJobId as string;

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
    } else if (job.provider === 'huggingface') {
      polledStatus = await pollHuggingFaceJobStatus(providerJobId);
    } else {
      polledStatus = await pollGeminiJobStatus(providerJobId);
    }
  } catch (pollErr) {
    const errMsg = pollErr instanceof Error ? pollErr.message : String(pollErr);
    const hp = job.hyperparameters as Record<string, unknown>;
    const consecutivePollErrors =
      typeof hp.consecutivePollErrors === 'number' ? hp.consecutivePollErrors + 1 : 1;
    const MAX_CONSECUTIVE_POLL_ERRORS = 5;

    if (consecutivePollErrors >= MAX_CONSECUTIVE_POLL_ERRORS) {
      await db
        .update(fineTuningJobs)
        .set({
          status: 'failed',
          errorMessage: `Provider poll failed ${consecutivePollErrors} consecutive times: ${errMsg}`,
          updatedAt: new Date(),
          completedAt: new Date(),
          hyperparameters: { ...hp, consecutivePollErrors },
        })
        .where(eq(fineTuningJobs.jobId, jobId));
      const [failed] = await db
        .select()
        .from(fineTuningJobs)
        .where(eq(fineTuningJobs.jobId, jobId))
        .limit(1);
      return mapJobToStatus(failed ?? job);
    }

    await db
      .update(fineTuningJobs)
      .set({
        errorMessage: `Transient poll error (${consecutivePollErrors}/${MAX_CONSECUTIVE_POLL_ERRORS}): ${errMsg}`,
        updatedAt: new Date(),
        hyperparameters: { ...hp, consecutivePollErrors },
      })
      .where(eq(fineTuningJobs.jobId, jobId));
    return mapJobToStatus(job);
  }

  const providerStatus = mapProviderStatus(polledStatus.status);

  const hp = job.hyperparameters as Record<string, unknown>;
  type JobUpdate = Parameters<ReturnType<typeof db.update<typeof fineTuningJobs>>['set']>[0];
  const updatePayload: JobUpdate = {
    status: providerStatus,
    updatedAt: new Date(),
    hyperparameters: { ...hp, consecutivePollErrors: 0 },
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
    creating: 'running',
    active: 'running',
    succeeded: 'succeeded',
    failed: 'failed',
    cancelled: 'cancelled',
    completed: 'succeeded',
    error: 'failed',
  };
  return map[providerStatus] ?? 'running';
}

function mapJobToStatus(job: typeof fineTuningJobs.$inferSelect): FineTuningJobStatus {
  const _completedAt = job.completedAt?.toISOString();
  const _evalScores = job.evalScores as Record<string, unknown> | null;
  const _qualityReport = job.qualityReport as Record<string, unknown> | null;
  return {
    jobId: job.jobId,
    internalId: job.id,
    agentId: job.agentId,
    provider: job.provider as FineTuningProvider,
    baseModel: job.baseModel,
    status: job.status as FineTuningJobStatus['status'],
    datasetSize: job.datasetSize,
    datasetVersion: job.datasetVersion,
    submittedAt: job.submittedAt.toISOString(),
    ...(job.fineTunedModelId != null ? { fineTunedModelId: job.fineTunedModelId } : {}),
    ...(_completedAt !== undefined ? { completedAt: _completedAt } : {}),
    ...(job.trainingCostUsd != null ? { trainingCostUsd: job.trainingCostUsd } : {}),
    ...(job.errorMessage != null ? { errorMessage: job.errorMessage } : {}),
    ...(_evalScores != null ? { evalScores: _evalScores } : {}),
    ...(job.promotedToLifecycle != null ? { promotedToLifecycle: job.promotedToLifecycle } : {}),
    ...(_qualityReport != null ? { qualityReport: _qualityReport } : {}),
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
  const providerJobId = hyperparams.providerJobId as string;

  if (job.provider === 'openai' && providerJobId) {
    const openaiKey = process.env.OPENAI_FINE_TUNING_API_KEY;
    if (openaiKey) {
      const openaiBase = process.env.OPENAI_FINE_TUNING_BASE_URL ?? 'https://api.openai.com/v1';
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
