import { randomUUID } from 'node:crypto';

export type HubOperationType =
  | 'search_models'
  | 'search_datasets'
  | 'download_model'
  | 'upload_model'
  | 'manage_bucket'
  | 'launch_space'
  | 'get_model_card'
  | 'get_dataset_info';

export type HubRiskLevel = 'low' | 'medium' | 'high';

export interface HubOperationRecord {
  id: string;
  type: HubOperationType;
  riskLevel: HubRiskLevel;
  agentId?: string;
  tenantId?: string;
  resourceUri: string;
  purpose?: string;
  costEstimateUsd: number;
  status: 'pending' | 'completed' | 'failed' | 'blocked';
  result?: unknown;
  error?: string;
  createdAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface HubModelSearchParams {
  search?: string;
  task?: string;
  library?: string;
  license?: string;
  sort?: 'downloads' | 'likes' | 'trending' | 'lastModified';
  limit?: number;
  minDownloads?: number;
  maxParameters?: string;
}

export interface HubModelResult {
  id: string;
  author?: string;
  modelId: string;
  sha?: string;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag?: string;
  library_name?: string;
  lastModified?: string;
  private: boolean;
}

export interface HubDatasetSearchParams {
  search?: string;
  task?: string;
  sort?: 'downloads' | 'likes' | 'trending';
  limit?: number;
}

export interface HubDatasetResult {
  id: string;
  author?: string;
  downloads: number;
  likes: number;
  tags: string[];
  lastModified?: string;
  private: boolean;
}

export interface HubDownloadRequest {
  modelId: string;
  revision?: string;
  files?: string[];
  purpose?: string;
}

export interface HubUploadRequest {
  repoId: string;
  repoType?: 'model' | 'dataset' | 'space';
  files: Array<{ path: string; content: string }>;
  commitMessage?: string;
  purpose?: string;
}

export interface HubBucketRequest {
  action: 'create' | 'list' | 'delete' | 'get';
  bucketName?: string;
  prefix?: string;
}

export interface HubSpaceRequest {
  action: 'create' | 'list' | 'get' | 'restart' | 'pause';
  spaceId?: string;
  sdk?: 'gradio' | 'streamlit' | 'docker' | 'static';
  hardware?: string;
  private?: boolean;
}

const RISK_MAP: Record<HubOperationType, HubRiskLevel> = {
  search_models: 'low',
  search_datasets: 'low',
  get_model_card: 'low',
  get_dataset_info: 'low',
  download_model: 'medium',
  upload_model: 'high',
  manage_bucket: 'high',
  launch_space: 'high',
};

const COST_ESTIMATES: Record<HubOperationType, number> = {
  search_models: 0.0001,
  search_datasets: 0.0001,
  get_model_card: 0.0001,
  get_dataset_info: 0.0001,
  download_model: 0.005,
  upload_model: 0.01,
  manage_bucket: 0.002,
  launch_space: 0.05,
};

const VALID_MODEL_SORT = new Set(['downloads', 'likes', 'trending', 'lastModified']);
const VALID_DATASET_SORT = new Set(['downloads', 'likes', 'trending']);
const VALID_BUCKET_ACTION = new Set(['create', 'list', 'delete', 'get']);
const VALID_SPACE_ACTION = new Set(['create', 'list', 'get', 'restart', 'pause']);
const VALID_SPACE_SDK = new Set(['gradio', 'streamlit', 'docker', 'static']);
const VALID_REPO_TYPE = new Set(['model', 'dataset', 'space']);

export function isValidModelSort(v: unknown): v is HubModelSearchParams['sort'] {
  return typeof v === 'string' && VALID_MODEL_SORT.has(v);
}

export function isValidDatasetSort(v: unknown): v is HubDatasetSearchParams['sort'] {
  return typeof v === 'string' && VALID_DATASET_SORT.has(v);
}

export function isValidBucketAction(v: unknown): v is HubBucketRequest['action'] {
  return typeof v === 'string' && VALID_BUCKET_ACTION.has(v);
}

export function isValidSpaceAction(v: unknown): v is HubSpaceRequest['action'] {
  return typeof v === 'string' && VALID_SPACE_ACTION.has(v);
}

export function isValidSpaceSdk(v: unknown): v is HubSpaceRequest['sdk'] {
  return typeof v === 'string' && VALID_SPACE_SDK.has(v);
}

export function isValidRepoType(v: unknown): v is HubUploadRequest['repoType'] {
  return typeof v === 'string' && VALID_REPO_TYPE.has(v);
}

export function classifyHubRisk(opType: HubOperationType): HubRiskLevel {
  return RISK_MAP[opType];
}

export function estimateHubCost(opType: HubOperationType): number {
  return COST_ESTIMATES[opType];
}

function safeString(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

function safeNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function safeStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function safeBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

interface RawHubModel {
  _id?: unknown;
  id?: unknown;
  author?: unknown;
  modelId?: unknown;
  sha?: unknown;
  downloads?: unknown;
  likes?: unknown;
  tags?: unknown;
  pipeline_tag?: unknown;
  library_name?: unknown;
  lastModified?: unknown;
  private?: unknown;
}

interface RawHubDataset {
  _id?: unknown;
  id?: unknown;
  author?: unknown;
  downloads?: unknown;
  likes?: unknown;
  tags?: unknown;
  lastModified?: unknown;
  private?: unknown;
}

function parseModelResult(raw: RawHubModel): HubModelResult {
  const id = safeString(raw._id ?? raw.id, '');
  return {
    id,
    author: typeof raw.author === 'string' ? raw.author : undefined,
    modelId: safeString(raw.modelId ?? raw.id, ''),
    sha: typeof raw.sha === 'string' ? raw.sha : undefined,
    downloads: safeNumber(raw.downloads, 0),
    likes: safeNumber(raw.likes, 0),
    tags: safeStringArray(raw.tags),
    pipeline_tag: typeof raw.pipeline_tag === 'string' ? raw.pipeline_tag : undefined,
    library_name: typeof raw.library_name === 'string' ? raw.library_name : undefined,
    lastModified: typeof raw.lastModified === 'string' ? raw.lastModified : undefined,
    private: safeBool(raw.private, false),
  };
}

function parseDatasetResult(raw: RawHubDataset): HubDatasetResult {
  return {
    id: safeString(raw._id ?? raw.id, ''),
    author: typeof raw.author === 'string' ? raw.author : undefined,
    downloads: safeNumber(raw.downloads, 0),
    likes: safeNumber(raw.likes, 0),
    tags: safeStringArray(raw.tags),
    lastModified: typeof raw.lastModified === 'string' ? raw.lastModified : undefined,
    private: safeBool(raw.private, false),
  };
}

export function parseRepoId(repoId: string): { name: string; organization?: string } {
  const slashIdx = repoId.indexOf('/');
  if (slashIdx > 0) {
    return { organization: repoId.slice(0, slashIdx), name: repoId.slice(slashIdx + 1) };
  }
  return { name: repoId };
}

export class HuggingFaceHubClient {
  private readonly baseUrl = 'https://huggingface.co/api';
  private readonly operations: HubOperationRecord[] = [];
  private readonly MAX_OPERATIONS = 10_000;

  private get apiKey(): string | undefined {
    return process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN;
  }

  private get hasWriteToken(): boolean {
    return !!this.apiKey;
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`;
    return h;
  }

  private recordOp(
    type: HubOperationType,
    resourceUri: string,
    opts?: { agentId?: string; tenantId?: string; purpose?: string },
  ): HubOperationRecord {
    const record: HubOperationRecord = {
      id: `hub-${randomUUID().slice(0, 12)}`,
      type,
      riskLevel: classifyHubRisk(type),
      agentId: opts?.agentId,
      tenantId: opts?.tenantId,
      resourceUri,
      purpose: opts?.purpose,
      costEstimateUsd: estimateHubCost(type),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.operations.unshift(record);
    if (this.operations.length > this.MAX_OPERATIONS) this.operations.length = this.MAX_OPERATIONS;
    return record;
  }

  private completeOp(record: HubOperationRecord, result?: unknown, error?: string): void {
    const now = new Date().toISOString();
    record.completedAt = now;
    record.durationMs = new Date(now).getTime() - new Date(record.createdAt).getTime();
    if (error) {
      record.status = 'failed';
      record.error = error;
    } else {
      record.status = 'completed';
      record.result = result;
    }
  }

  async searchModels(params: HubModelSearchParams): Promise<{ models: HubModelResult[]; record: HubOperationRecord }> {
    const op = this.recordOp('search_models', 'hf://models', { purpose: `search: ${params.search ?? '*'}` });
    try {
      const queryParts: string[] = [];
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.task) queryParts.push(`pipeline_tag=${encodeURIComponent(params.task)}`);
      if (params.library) queryParts.push(`library=${encodeURIComponent(params.library)}`);
      if (params.license) queryParts.push(`filter=license:${encodeURIComponent(params.license)}`);
      if (params.sort) queryParts.push(`sort=${params.sort}`);
      queryParts.push(`limit=${params.limit ?? 20}`);

      const url = `${this.baseUrl}/models?${queryParts.join('&')}`;
      const resp = await fetch(url, {
        headers: this.headers,
        signal: AbortSignal.timeout(15_000),
      });

      if (!resp.ok) throw new Error(`HF API error: ${resp.status}`);
      const raw = (await resp.json()) as RawHubModel[];
      const models: HubModelResult[] = raw.map(parseModelResult);

      this.completeOp(op, { count: models.length });
      return { models, record: op };
    } catch (err) {
      this.completeOp(op, undefined, err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async searchDatasets(params: HubDatasetSearchParams): Promise<{ datasets: HubDatasetResult[]; record: HubOperationRecord }> {
    const op = this.recordOp('search_datasets', 'hf://datasets', { purpose: `search: ${params.search ?? '*'}` });
    try {
      const queryParts: string[] = [];
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.sort) queryParts.push(`sort=${params.sort}`);
      queryParts.push(`limit=${params.limit ?? 20}`);

      const url = `${this.baseUrl}/datasets?${queryParts.join('&')}`;
      const resp = await fetch(url, {
        headers: this.headers,
        signal: AbortSignal.timeout(15_000),
      });

      if (!resp.ok) throw new Error(`HF API error: ${resp.status}`);
      const raw = (await resp.json()) as RawHubDataset[];
      const datasets: HubDatasetResult[] = raw.map(parseDatasetResult);

      this.completeOp(op, { count: datasets.length });
      return { datasets, record: op };
    } catch (err) {
      this.completeOp(op, undefined, err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async getModelCard(modelId: string): Promise<{ card: Record<string, unknown>; record: HubOperationRecord }> {
    const op = this.recordOp('get_model_card', `hf://models/${modelId}`);
    try {
      const resp = await fetch(`${this.baseUrl}/models/${modelId}`, {
        headers: this.headers,
        signal: AbortSignal.timeout(10_000),
      });
      if (!resp.ok) throw new Error(`HF API error: ${resp.status}`);
      const card = (await resp.json()) as Record<string, unknown>;
      this.completeOp(op, { modelId });
      return { card, record: op };
    } catch (err) {
      this.completeOp(op, undefined, err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async downloadModelMetadata(req: HubDownloadRequest): Promise<{ metadata: Record<string, unknown>; record: HubOperationRecord }> {
    const op = this.recordOp('download_model', `hf://models/${req.modelId}`, { purpose: req.purpose });
    try {
      const resp = await fetch(`${this.baseUrl}/models/${req.modelId}`, {
        headers: this.headers,
        signal: AbortSignal.timeout(15_000),
      });
      if (!resp.ok) throw new Error(`HF API error: ${resp.status}`);
      const data = (await resp.json()) as Record<string, unknown>;

      const siblings = Array.isArray(data.siblings) ? data.siblings : [];
      const files = (siblings as Array<Record<string, unknown>>).map((s) => ({
        filename: safeString(s.rfilename, 'unknown'),
        size: safeNumber(s.size, 0),
      }));

      const metadata = {
        modelId: req.modelId,
        revision: req.revision ?? 'main',
        files,
        totalFiles: files.length,
        totalSizeBytes: files.reduce((sum, f) => sum + f.size, 0),
        tags: safeStringArray(data.tags),
        pipeline_tag: typeof data.pipeline_tag === 'string' ? data.pipeline_tag : undefined,
        library_name: typeof data.library_name === 'string' ? data.library_name : undefined,
        downloadUrl: `https://huggingface.co/${req.modelId}/tree/${req.revision ?? 'main'}`,
      };

      this.completeOp(op, metadata);
      return { metadata, record: op };
    } catch (err) {
      this.completeOp(op, undefined, err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async uploadModel(req: HubUploadRequest): Promise<{ result: Record<string, unknown>; record: HubOperationRecord }> {
    const op = this.recordOp('upload_model', `hf://repos/${req.repoId}`, { purpose: req.purpose });
    if (!this.hasWriteToken) {
      const error = 'HF_TOKEN not configured — upload requires a HuggingFace write token';
      this.completeOp(op, undefined, error);
      throw new Error(error);
    }

    try {
      const { name, organization } = parseRepoId(req.repoId);
      const createBody: Record<string, unknown> = {
        type: req.repoType ?? 'model',
        name,
        private: false,
      };
      if (organization) createBody.organization = organization;

      const createRepoResp = await fetch(`${this.baseUrl}/repos/create`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(createBody),
        signal: AbortSignal.timeout(30_000),
      });

      let repoCreated = false;
      if (createRepoResp.ok) {
        repoCreated = true;
      } else if (createRepoResp.status === 409) {
        repoCreated = false;
      } else {
        const errorBody = await createRepoResp.text().catch(() => '');
        throw new Error(`HF repo creation failed: ${createRepoResp.status} ${errorBody}`);
      }

      let filesUploaded = 0;
      for (const file of req.files) {
        const uploadUrl = `https://huggingface.co/api/${req.repoType ?? 'model'}s/${req.repoId}/upload/main/${file.path}`;
        const uploadResp = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            ...this.headers,
            'Content-Type': 'application/octet-stream',
          },
          body: file.content,
          signal: AbortSignal.timeout(60_000),
        });
        if (!uploadResp.ok) {
          const errText = await uploadResp.text().catch(() => '');
          throw new Error(`File upload failed for ${file.path}: ${uploadResp.status} ${errText}`);
        }
        filesUploaded++;
      }

      const result = {
        repoId: req.repoId,
        repoType: req.repoType ?? 'model',
        repoCreated,
        filesUploaded,
        commitMessage: req.commitMessage ?? 'Upload via A11oy Hub Bridge',
        repoUrl: `https://huggingface.co/${req.repoId}`,
      };
      this.completeOp(op, result);
      return { result, record: op };
    } catch (err) {
      this.completeOp(op, undefined, err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async manageBucket(req: HubBucketRequest): Promise<{ result: Record<string, unknown>; record: HubOperationRecord }> {
    const op = this.recordOp('manage_bucket', `hf://buckets/${req.bucketName ?? 'default'}`, {
      purpose: `bucket ${req.action}`,
    });
    if (!this.hasWriteToken) {
      const error = 'HF_TOKEN not configured — bucket operations require a HuggingFace token';
      this.completeOp(op, undefined, error);
      throw new Error(error);
    }

    try {
      const storageBase = 'https://huggingface.co/api/storage';
      let apiResp: Response;

      switch (req.action) {
        case 'list': {
          apiResp = await fetch(storageBase, {
            headers: this.headers,
            signal: AbortSignal.timeout(15_000),
          });
          break;
        }
        case 'get': {
          if (!req.bucketName) throw new Error('bucketName is required for get action');
          const prefix = req.prefix ? `?prefix=${encodeURIComponent(req.prefix)}` : '';
          apiResp = await fetch(`${storageBase}/${encodeURIComponent(req.bucketName)}${prefix}`, {
            headers: this.headers,
            signal: AbortSignal.timeout(15_000),
          });
          break;
        }
        case 'create': {
          if (!req.bucketName) throw new Error('bucketName is required for create action');
          apiResp = await fetch(storageBase, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ name: req.bucketName }),
            signal: AbortSignal.timeout(15_000),
          });
          break;
        }
        case 'delete': {
          if (!req.bucketName) throw new Error('bucketName is required for delete action');
          apiResp = await fetch(`${storageBase}/${encodeURIComponent(req.bucketName)}`, {
            method: 'DELETE',
            headers: this.headers,
            signal: AbortSignal.timeout(15_000),
          });
          break;
        }
        default:
          throw new Error(`Unknown bucket action: ${req.action}`);
      }

      if (!apiResp.ok) {
        const errText = await apiResp.text().catch(() => '');
        throw new Error(`HF Storage API error: ${apiResp.status} ${errText}`);
      }

      const data = await apiResp.json().catch(() => ({})) as Record<string, unknown>;
      const result = {
        action: req.action,
        bucketName: req.bucketName,
        prefix: req.prefix,
        data,
      };
      this.completeOp(op, result);
      return { result, record: op };
    } catch (err) {
      this.completeOp(op, undefined, err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async manageSpace(req: HubSpaceRequest): Promise<{ result: Record<string, unknown>; record: HubOperationRecord }> {
    const op = this.recordOp('launch_space', `hf://spaces/${req.spaceId ?? 'new'}`, {
      purpose: `space ${req.action}`,
    });
    if (!this.hasWriteToken && req.action !== 'list' && req.action !== 'get') {
      const error = 'HF_TOKEN not configured — Space management requires a HuggingFace write token';
      this.completeOp(op, undefined, error);
      throw new Error(error);
    }

    try {
      const spacesBase = `${this.baseUrl}/spaces`;
      let apiResp: Response;

      switch (req.action) {
        case 'list': {
          apiResp = await fetch(`${spacesBase}?limit=20`, {
            headers: this.headers,
            signal: AbortSignal.timeout(15_000),
          });
          break;
        }
        case 'get': {
          if (!req.spaceId) throw new Error('spaceId is required for get action');
          apiResp = await fetch(`${spacesBase}/${req.spaceId}`, {
            headers: this.headers,
            signal: AbortSignal.timeout(15_000),
          });
          break;
        }
        case 'create': {
          if (!req.spaceId) throw new Error('spaceId is required for create action');
          const { name: spaceName, organization: spaceOrg } = parseRepoId(req.spaceId);
          const spaceCreateBody: Record<string, unknown> = {
            type: 'space',
            name: spaceName,
            sdk: req.sdk ?? 'gradio',
            hardware: req.hardware ?? 'cpu-basic',
            private: req.private ?? false,
          };
          if (spaceOrg) spaceCreateBody.organization = spaceOrg;
          apiResp = await fetch(`${this.baseUrl}/repos/create`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(spaceCreateBody),
            signal: AbortSignal.timeout(30_000),
          });
          break;
        }
        case 'restart': {
          if (!req.spaceId) throw new Error('spaceId is required for restart action');
          apiResp = await fetch(`${spacesBase}/${req.spaceId}/restart`, {
            method: 'POST',
            headers: this.headers,
            signal: AbortSignal.timeout(30_000),
          });
          break;
        }
        case 'pause': {
          if (!req.spaceId) throw new Error('spaceId is required for pause action');
          apiResp = await fetch(`${spacesBase}/${req.spaceId}/pause`, {
            method: 'POST',
            headers: this.headers,
            signal: AbortSignal.timeout(15_000),
          });
          break;
        }
        default:
          throw new Error(`Unknown space action: ${req.action}`);
      }

      if (!apiResp.ok) {
        const errText = await apiResp.text().catch(() => '');
        throw new Error(`HF Spaces API error: ${apiResp.status} ${errText}`);
      }

      const data = await apiResp.json().catch(() => ({})) as Record<string, unknown>;
      const result = {
        action: req.action,
        spaceId: req.spaceId,
        data,
      };
      this.completeOp(op, result);
      return { result, record: op };
    } catch (err) {
      this.completeOp(op, undefined, err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  getOperations(opts?: {
    limit?: number;
    type?: HubOperationType;
    agentId?: string;
    tenantId?: string;
    status?: HubOperationRecord['status'];
  }): HubOperationRecord[] {
    let records = this.operations;
    if (opts?.type) records = records.filter((r) => r.type === opts.type);
    if (opts?.agentId) records = records.filter((r) => r.agentId === opts.agentId);
    if (opts?.tenantId) records = records.filter((r) => r.tenantId === opts.tenantId);
    if (opts?.status) records = records.filter((r) => r.status === opts.status);
    return records.slice(0, opts?.limit ?? 50);
  }

  getCostSummary(opts?: { agentId?: string; tenantId?: string }): {
    totalCostUsd: number;
    byOperation: Record<string, number>;
    byAgent: Record<string, number>;
    operationCount: number;
  } {
    let records = this.operations.filter((r) => r.status === 'completed');
    if (opts?.agentId) records = records.filter((r) => r.agentId === opts.agentId);
    if (opts?.tenantId) records = records.filter((r) => r.tenantId === opts.tenantId);

    const byOperation: Record<string, number> = {};
    const byAgent: Record<string, number> = {};
    let totalCostUsd = 0;

    for (const r of records) {
      totalCostUsd += r.costEstimateUsd;
      byOperation[r.type] = (byOperation[r.type] ?? 0) + r.costEstimateUsd;
      if (r.agentId) byAgent[r.agentId] = (byAgent[r.agentId] ?? 0) + r.costEstimateUsd;
    }

    return { totalCostUsd, byOperation, byAgent, operationCount: records.length };
  }
}

export const hubClient = new HuggingFaceHubClient();
