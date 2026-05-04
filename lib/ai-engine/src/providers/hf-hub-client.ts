const HF_API_BASE = 'https://huggingface.co/api';
const HF_DATASETS_SERVER = 'https://datasets-server.huggingface.co';
const DEFAULT_TIMEOUT_MS = 20_000;

function getToken(): string | undefined {
  return process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
}

function headers(json = false): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms = DEFAULT_TIMEOUT_MS): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fn(ctrl.signal).finally(() => clearTimeout(timer));
}

async function hfGet<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { headers: headers(), signal });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw Object.assign(new Error(`HF API ${res.status}: ${text.slice(0, 300)}`), {
      statusCode: res.status === 503 ? 503 : 502,
    });
  }
  return res.json() as Promise<T>;
}

export function hasToken(): boolean {
  return !!getToken();
}

export interface HubSearchOptions {
  search?: string;
  limit?: number;
  page?: number;
  sort?: string;
  task?: string;
  license?: string;
}

export async function searchModels(opts: HubSearchOptions = {}): Promise<unknown[]> {
  const { search = '', limit = 20, page = 0, sort = 'downloads', task, license } = opts;
  const params = new URLSearchParams({
    search,
    limit: String(limit),
    skip: String(page * limit),
    sort,
    direction: '-1',
  });
  if (task) params.set('pipeline_tag', task);
  if (license) params.set('license', license);

  return withTimeout((signal) => hfGet<unknown[]>(`${HF_API_BASE}/models?${params}`, signal));
}

export async function getModelCard(modelId: string): Promise<{ info: unknown; readme: string | null }> {
  const [info, readme] = await Promise.allSettled([
    withTimeout((signal) => hfGet<unknown>(`${HF_API_BASE}/models/${modelId}`, signal)),
    withTimeout((signal) =>
      fetch(`https://huggingface.co/${modelId}/resolve/main/README.md`, {
        headers: headers(),
        signal,
      }).then((r) => (r.ok ? r.text() : null)),
    ),
  ]);

  return {
    info: info.status === 'fulfilled' ? info.value : null,
    readme: readme.status === 'fulfilled' ? readme.value : null,
  };
}

export async function searchDatasets(opts: HubSearchOptions = {}): Promise<unknown[]> {
  const { search = '', limit = 20, page = 0, sort = 'downloads' } = opts;
  const params = new URLSearchParams({
    search,
    limit: String(limit),
    skip: String(page * limit),
    sort,
    direction: '-1',
  });

  return withTimeout((signal) => hfGet<unknown[]>(`${HF_API_BASE}/datasets?${params}`, signal));
}

export interface DatasetDetail {
  info: unknown;
  splits: unknown;
  preview: unknown;
}

export async function getDatasetDetail(dataset: string): Promise<DatasetDetail> {
  const [info, splits, preview] = await Promise.allSettled([
    withTimeout((signal) => hfGet<unknown>(`${HF_API_BASE}/datasets/${dataset}`, signal)),
    withTimeout((signal) =>
      hfGet<unknown>(`${HF_DATASETS_SERVER}/splits?dataset=${encodeURIComponent(dataset)}`, signal),
    ),
    withTimeout((signal) =>
      hfGet<unknown>(
        `${HF_DATASETS_SERVER}/first-rows?dataset=${encodeURIComponent(dataset)}&config=default&split=train&offset=0&length=10`,
        signal,
      ),
    ),
  ]);

  return {
    info: info.status === 'fulfilled' ? info.value : null,
    splits: splits.status === 'fulfilled' ? splits.value : null,
    preview: preview.status === 'fulfilled' ? preview.value : null,
  };
}

export async function searchSpaces(opts: HubSearchOptions = {}): Promise<unknown[]> {
  const { search = '', limit = 20, page = 0, sort = 'likes' } = opts;
  const params = new URLSearchParams({
    search,
    limit: String(limit),
    skip: String(page * limit),
    sort,
    direction: '-1',
  });

  return withTimeout((signal) => hfGet<unknown[]>(`${HF_API_BASE}/spaces?${params}`, signal));
}

export async function getSpaceDetail(spaceId: string): Promise<{ info: unknown; embedUrl: string }> {
  const info = await withTimeout((signal) =>
    hfGet<unknown>(`${HF_API_BASE}/spaces/${spaceId}`, signal),
  );
  return { info, embedUrl: `https://huggingface.co/spaces/${spaceId}` };
}

export interface TokenHealthResult {
  tokenPresent: boolean;
  tokenValid: boolean;
  username?: string;
  userType?: string;
  inferenceReachable: boolean;
}

export async function checkTokenHealth(): Promise<TokenHealthResult> {
  const token = getToken();
  if (!token) {
    return { tokenPresent: false, tokenValid: false, inferenceReachable: false };
  }

  const [whoami, inferenceCheck] = await Promise.allSettled([
    withTimeout(
      (signal) =>
        fetch('https://huggingface.co/api/whoami-v2', {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        }).then(async (r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<{ name?: string; email?: string; type?: string }>;
        }),
      5000,
    ),
    withTimeout(
      (signal) =>
        fetch('https://router.huggingface.co/hf-inference/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            model: process.env.HF_FALLBACK_LLM || 'Qwen/Qwen3-0.6B',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
          }),
          signal,
        }).then((r) => ({ ok: r.ok || r.status === 400 || r.status === 422, status: r.status })),
      8000,
    ),
  ]);

  const tokenValid = whoami.status === 'fulfilled';
  const inferenceReachable =
    inferenceCheck.status === 'fulfilled' && inferenceCheck.value?.ok === true;

  return {
    tokenPresent: true,
    tokenValid,
    username:
      whoami.status === 'fulfilled'
        ? (whoami.value as Record<string, unknown>).name as string | undefined
        : undefined,
    userType:
      whoami.status === 'fulfilled'
        ? (whoami.value as Record<string, unknown>).type as string | undefined
        : undefined,
    inferenceReachable,
  };
}
