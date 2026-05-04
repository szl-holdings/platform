import { logger } from '../lib/logger';
import { ENV_CONFIG } from '../lib/env-config';

const HF_JOBS_API_VERSION = 'v1';

export interface HfVolume {
  type: 'model' | 'dataset' | 'bucket' | 'subfolder';
  source: string;
  mount: string;
  readOnly?: boolean;
}

export interface HfJobSpec {
  image?: string;
  command?: string[];
  env?: Record<string, string>;
  secrets?: Record<string, string>;
  volumes?: HfVolume[];
  flavor: string;
  timeout?: number | string;
  namespace?: string;
  labels?: Record<string, string>;
}

export interface HfUvJobSpec extends HfJobSpec {
  type: 'uv';
  script?: string;
  requirements?: string[];
}

export interface HfDockerJobSpec extends HfJobSpec {
  type: 'docker';
  image: string;
}

export interface HfScheduleSpec extends HfJobSpec {
  type: 'uv' | 'docker';
  image?: string;
  cron: string;
}

export interface HfJobStatus {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'timeout' | 'cancelled';
  flavor: string;
  namespace: string;
  labels: Record<string, string>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  elapsedSeconds?: number;
  costPerMinute?: number;
}

export interface HfScheduleStatus {
  id: string;
  cron: string;
  status: 'active' | 'suspended';
  namespace: string;
  labels: Record<string, string>;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
}

export type HfJobLog = { timestamp: string; line: string };

export const HARDWARE_FLAVORS: Array<{
  id: string;
  label: string;
  gpus: number;
  vram: string;
  costPerMinute: number;
}> = [
  { id: 'cpu-basic', label: 'CPU Basic (2 vCPU, 16 GB)', gpus: 0, vram: '0', costPerMinute: 0.03 },
  { id: 'cpu-upgrade', label: 'CPU Upgrade (8 vCPU, 32 GB)', gpus: 0, vram: '0', costPerMinute: 0.07 },
  { id: 't4-small', label: 'Nvidia T4 — small', gpus: 1, vram: '16 GB', costPerMinute: 0.10 },
  { id: 't4-medium', label: 'Nvidia T4 — medium', gpus: 1, vram: '16 GB', costPerMinute: 0.20 },
  { id: 'a10g-small', label: 'Nvidia A10G — small', gpus: 1, vram: '24 GB', costPerMinute: 0.50 },
  { id: 'a10g-large', label: 'Nvidia A10G — large', gpus: 4, vram: '96 GB', costPerMinute: 1.80 },
  { id: 'a100-small', label: 'Nvidia A100 — small', gpus: 1, vram: '80 GB', costPerMinute: 2.50 },
  { id: 'a100-large', label: 'Nvidia A100 — large', gpus: 4, vram: '320 GB', costPerMinute: 8.00 },
];

const flavorMap = new Map(HARDWARE_FLAVORS.map((f) => [f.id, f]));

export function getFlavorCostPerMinute(flavorId: string): number | undefined {
  return flavorMap.get(flavorId)?.costPerMinute;
}

export function parseTimeout(value: number | string | undefined): number {
  if (value === undefined || value === null) return 3600;
  if (typeof value === 'number') return value;
  const str = String(value).trim().toLowerCase();
  const match = str.match(/^(\d+(?:\.\d+)?)\s*(s|m|h|d)$/);
  if (!match) {
    const parsed = parseInt(str, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3600;
  }
  const num = parseFloat(match[1]);
  switch (match[2]) {
    case 's': return Math.round(num);
    case 'm': return Math.round(num * 60);
    case 'h': return Math.round(num * 3600);
    case 'd': return Math.round(num * 86400);
    default: return 3600;
  }
}

export function serializeVolumeUrl(vol: HfVolume): string {
  const typePrefix = vol.type === 'subfolder' ? '' : `${vol.type}/`;
  const roSuffix = vol.readOnly ? ':ro' : '';
  return `hf://${typePrefix}${vol.source}:${vol.mount}${roSuffix}`;
}

export function buildApiUrl(path: string, namespace?: string): string {
  const base = ENV_CONFIG.hfJobs.apiBase.replace(/\/$/, '');
  const ns = namespace || ENV_CONFIG.hfJobs.namespace;
  return `${base}/api/jobs/${HF_JOBS_API_VERSION}/${ns ? `${ns}/` : ''}${path}`;
}

function buildScheduleApiUrl(path: string, namespace?: string): string {
  const base = ENV_CONFIG.hfJobs.apiBase.replace(/\/$/, '');
  const ns = namespace || ENV_CONFIG.hfJobs.namespace;
  return `${base}/api/jobs/${HF_JOBS_API_VERSION}/${ns ? `${ns}/` : ''}schedules/${path}`;
}

function authHeaders(): Record<string, string> {
  const token = ENV_CONFIG.hfJobs.token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function redactSecrets(spec: HfJobSpec): Record<string, unknown> {
  const clean = { ...spec } as Record<string, unknown>;
  if (spec.secrets) {
    clean.secrets = Object.fromEntries(
      Object.keys(spec.secrets).map((k) => [k, '***REDACTED***']),
    );
  }
  return clean;
}

function buildPayload(spec: HfJobSpec & { type?: string; cron?: string; script?: string; requirements?: string[] }): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (spec.image) payload.image = spec.image;
  if (spec.command) payload.command = spec.command;
  if (spec.env) payload.env = spec.env;
  if (spec.secrets) payload.secrets = spec.secrets;
  if (spec.flavor) payload.flavor = spec.flavor;
  if (spec.timeout !== undefined) payload.timeout = parseTimeout(spec.timeout);
  if (spec.labels) payload.labels = spec.labels;
  if (spec.volumes?.length) {
    payload.volumes = spec.volumes.map(serializeVolumeUrl);
  }
  if (spec.script) payload.script = spec.script;
  if (spec.requirements) payload.requirements = spec.requirements;
  if (spec.cron) payload.cron = spec.cron;
  return payload;
}

async function hfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...authHeaders(),
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  const res = await fetch(url, { ...options, headers });
  return res;
}

export async function submitJob(spec: HfUvJobSpec | HfDockerJobSpec): Promise<{ jobId: string; status: string; spec: Record<string, unknown> }> {
  if (!ENV_CONFIG.hfJobs.configured) {
    logger.warn('[hf-jobs] HF_TOKEN not configured — returning simulated job submission');
    const jobId = `hf-sim-${Date.now().toString(36)}`;
    return { jobId, status: 'queued', spec: redactSecrets(spec) };
  }

  const endpoint = spec.type === 'uv' ? 'uv' : 'docker';
  const url = buildApiUrl(endpoint, spec.namespace);
  const payload = buildPayload(spec);

  logger.info({ url, spec: redactSecrets(spec) }, '[hf-jobs] Submitting job');

  const res = await hfFetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HF Jobs API error ${res.status}: ${body}`);
  }

  const data = await res.json() as Record<string, unknown>;
  return {
    jobId: String(data.id ?? data.jobId ?? `hf-${Date.now().toString(36)}`),
    status: String(data.status ?? 'queued'),
    spec: redactSecrets(spec),
  };
}

export async function listJobs(namespace?: string, status?: string): Promise<HfJobStatus[]> {
  if (!ENV_CONFIG.hfJobs.configured) {
    return getDemoJobs();
  }

  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const url = buildApiUrl(`list${qs}`, namespace);
  const res = await hfFetch(url);

  if (!res.ok) {
    logger.warn({ status: res.status }, '[hf-jobs] Failed to list jobs');
    return getDemoJobs();
  }

  const data = await res.json() as Record<string, unknown>[];
  return data.map(mapJobRow);
}

export async function inspectJob(jobId: string, namespace?: string): Promise<HfJobStatus | null> {
  if (!ENV_CONFIG.hfJobs.configured) {
    return getDemoJobs().find((j) => j.id === jobId) ?? null;
  }

  const url = buildApiUrl(jobId, namespace);
  const res = await hfFetch(url);
  if (!res.ok) return null;
  const data = await res.json() as Record<string, unknown>;
  return mapJobRow(data);
}

export async function fetchJobLogs(jobId: string, namespace?: string): Promise<HfJobLog[]> {
  if (!ENV_CONFIG.hfJobs.configured) {
    return getDemoLogs(jobId);
  }

  const url = buildApiUrl(`${jobId}/logs`, namespace);
  const res = await hfFetch(url);
  if (!res.ok) return [];
  const data = await res.json() as HfJobLog[];
  return data;
}

export async function cancelJob(jobId: string, namespace?: string): Promise<boolean> {
  if (!ENV_CONFIG.hfJobs.configured) {
    logger.info({ jobId }, '[hf-jobs] Simulated cancel');
    return true;
  }

  const url = buildApiUrl(`${jobId}/cancel`, namespace);
  const res = await hfFetch(url, { method: 'POST' });
  return res.ok;
}

export async function deleteJob(jobId: string, namespace?: string): Promise<boolean> {
  if (!ENV_CONFIG.hfJobs.configured) {
    return true;
  }

  const url = buildApiUrl(jobId, namespace);
  const res = await hfFetch(url, { method: 'DELETE' });
  return res.ok;
}

export async function createSchedule(spec: HfScheduleSpec): Promise<{ scheduleId: string; status: string; spec: Record<string, unknown> }> {
  if (!ENV_CONFIG.hfJobs.configured) {
    const scheduleId = `hf-sched-${Date.now().toString(36)}`;
    return { scheduleId, status: 'active', spec: redactSecrets(spec) };
  }

  const url = buildScheduleApiUrl('create', spec.namespace);
  const payload = buildPayload(spec);

  const res = await hfFetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HF Schedules API error ${res.status}: ${body}`);
  }

  const data = await res.json() as Record<string, unknown>;
  return {
    scheduleId: String(data.id ?? data.scheduleId ?? `hf-sched-${Date.now().toString(36)}`),
    status: 'active',
    spec: redactSecrets(spec),
  };
}

export async function listSchedules(namespace?: string): Promise<HfScheduleStatus[]> {
  if (!ENV_CONFIG.hfJobs.configured) {
    return getDemoSchedules();
  }

  const url = buildScheduleApiUrl('list', namespace);
  const res = await hfFetch(url);
  if (!res.ok) return getDemoSchedules();
  const data = await res.json() as Record<string, unknown>[];
  return data.map(mapScheduleRow);
}

export async function inspectSchedule(scheduleId: string, namespace?: string): Promise<HfScheduleStatus | null> {
  if (!ENV_CONFIG.hfJobs.configured) {
    return getDemoSchedules().find((s) => s.id === scheduleId) ?? null;
  }

  const url = buildScheduleApiUrl(scheduleId, namespace);
  const res = await hfFetch(url);
  if (!res.ok) return null;
  const data = await res.json() as Record<string, unknown>;
  return mapScheduleRow(data);
}

export async function suspendSchedule(scheduleId: string, namespace?: string): Promise<boolean> {
  if (!ENV_CONFIG.hfJobs.configured) return true;
  const url = buildScheduleApiUrl(`${scheduleId}/suspend`, namespace);
  const res = await hfFetch(url, { method: 'POST' });
  return res.ok;
}

export async function resumeSchedule(scheduleId: string, namespace?: string): Promise<boolean> {
  if (!ENV_CONFIG.hfJobs.configured) return true;
  const url = buildScheduleApiUrl(`${scheduleId}/resume`, namespace);
  const res = await hfFetch(url, { method: 'POST' });
  return res.ok;
}

export async function deleteSchedule(scheduleId: string, namespace?: string): Promise<boolean> {
  if (!ENV_CONFIG.hfJobs.configured) return true;
  const url = buildScheduleApiUrl(scheduleId, namespace);
  const res = await hfFetch(url, { method: 'DELETE' });
  return res.ok;
}

function mapJobRow(row: Record<string, unknown>): HfJobStatus {
  const flavor = String(row.flavor ?? 'cpu-basic');
  const createdMs = row.createdAt ? new Date(String(row.createdAt)).getTime() : Date.now();
  const startedMs = row.startedAt ? new Date(String(row.startedAt)).getTime() : undefined;
  const completedMs = row.completedAt ? new Date(String(row.completedAt)).getTime() : undefined;
  const elapsed = startedMs
    ? Math.round(((completedMs ?? Date.now()) - startedMs) / 1000)
    : undefined;

  return {
    id: String(row.id ?? row.jobId ?? ''),
    status: (row.status as HfJobStatus['status']) ?? 'queued',
    flavor,
    namespace: String(row.namespace ?? ENV_CONFIG.hfJobs.namespace ?? ''),
    labels: (row.labels as Record<string, string>) ?? {},
    createdAt: new Date(createdMs).toISOString(),
    startedAt: startedMs ? new Date(startedMs).toISOString() : undefined,
    completedAt: completedMs ? new Date(completedMs).toISOString() : undefined,
    elapsedSeconds: elapsed,
    costPerMinute: getFlavorCostPerMinute(flavor),
  };
}

function mapScheduleRow(row: Record<string, unknown>): HfScheduleStatus {
  return {
    id: String(row.id ?? row.scheduleId ?? ''),
    cron: String(row.cron ?? ''),
    status: (row.status as 'active' | 'suspended') ?? 'active',
    namespace: String(row.namespace ?? ENV_CONFIG.hfJobs.namespace ?? ''),
    labels: (row.labels as Record<string, string>) ?? {},
    lastRunAt: row.lastRunAt ? String(row.lastRunAt) : undefined,
    nextRunAt: row.nextRunAt ? String(row.nextRunAt) : undefined,
    createdAt: row.createdAt ? String(row.createdAt) : new Date().toISOString(),
  };
}

function getDemoJobs(): HfJobStatus[] {
  const now = Date.now();
  return [
    {
      id: 'hf-demo-001',
      status: 'running',
      flavor: 'a10g-small',
      namespace: 'szl-holdings',
      labels: { domain: 'sentra', task: 'threat-model-finetune' },
      createdAt: new Date(now - 3600_000).toISOString(),
      startedAt: new Date(now - 3000_000).toISOString(),
      elapsedSeconds: 3000,
      costPerMinute: 0.50,
    },
    {
      id: 'hf-demo-002',
      status: 'queued',
      flavor: 't4-small',
      namespace: 'szl-holdings',
      labels: { domain: 'terra', task: 'distress-batch-inference' },
      createdAt: new Date(now - 600_000).toISOString(),
      costPerMinute: 0.10,
    },
    {
      id: 'hf-demo-003',
      status: 'succeeded',
      flavor: 'a100-small',
      namespace: 'szl-holdings',
      labels: { domain: 'vessels', task: 'ais-anomaly-retrain' },
      createdAt: new Date(now - 86400_000).toISOString(),
      startedAt: new Date(now - 82800_000).toISOString(),
      completedAt: new Date(now - 79200_000).toISOString(),
      elapsedSeconds: 3600,
      costPerMinute: 2.50,
    },
    {
      id: 'hf-demo-004',
      status: 'failed',
      flavor: 'a10g-large',
      namespace: 'szl-holdings',
      labels: { domain: 'lyte', task: 'revenue-forecast-retrain' },
      createdAt: new Date(now - 43200_000).toISOString(),
      startedAt: new Date(now - 42000_000).toISOString(),
      completedAt: new Date(now - 40800_000).toISOString(),
      elapsedSeconds: 1200,
      costPerMinute: 1.80,
    },
  ];
}

function getDemoSchedules(): HfScheduleStatus[] {
  const now = Date.now();
  return [
    {
      id: 'hf-sched-001',
      cron: '0 2 * * *',
      status: 'active',
      namespace: 'szl-holdings',
      labels: { domain: 'sentra', task: 'nightly-threat-retrain' },
      lastRunAt: new Date(now - 86400_000).toISOString(),
      nextRunAt: new Date(now + 43200_000).toISOString(),
      createdAt: new Date(now - 604800_000).toISOString(),
    },
    {
      id: 'hf-sched-002',
      cron: '0 */6 * * *',
      status: 'active',
      namespace: 'szl-holdings',
      labels: { domain: 'vessels', task: 'ais-batch-decode' },
      lastRunAt: new Date(now - 21600_000).toISOString(),
      nextRunAt: new Date(now + 600_000).toISOString(),
      createdAt: new Date(now - 2592000_000).toISOString(),
    },
    {
      id: 'hf-sched-003',
      cron: '0 8 * * 1',
      status: 'suspended',
      namespace: 'szl-holdings',
      labels: { domain: 'terra', task: 'weekly-valuation-sweep' },
      lastRunAt: new Date(now - 604800_000).toISOString(),
      createdAt: new Date(now - 1209600_000).toISOString(),
    },
  ];
}

function getDemoLogs(jobId: string): HfJobLog[] {
  const base = Date.now() - 60_000;
  return [
    { timestamp: new Date(base).toISOString(), line: `[${jobId}] Initializing compute environment...` },
    { timestamp: new Date(base + 2000).toISOString(), line: `[${jobId}] Pulling container image...` },
    { timestamp: new Date(base + 8000).toISOString(), line: `[${jobId}] Mounting volumes: model/szl-threat-v3, dataset/sentra-corpus` },
    { timestamp: new Date(base + 10000).toISOString(), line: `[${jobId}] GPU detected: NVIDIA A10G (24 GB VRAM)` },
    { timestamp: new Date(base + 12000).toISOString(), line: `[${jobId}] Starting training loop — epoch 1/10` },
    { timestamp: new Date(base + 30000).toISOString(), line: `[${jobId}] Epoch 1 complete — loss: 0.4231, accuracy: 0.8712` },
    { timestamp: new Date(base + 48000).toISOString(), line: `[${jobId}] Epoch 2 complete — loss: 0.3102, accuracy: 0.9084` },
    { timestamp: new Date(base + 55000).toISOString(), line: `[${jobId}] Checkpointing model to hf://model/szl-threat-v3:/output/checkpoint-2` },
  ];
}
