export interface HFModel {
  id: string;
  modelId?: string;
  pipeline_tag?: string;
  downloads?: number;
  likes?: number;
  lastModified?: string;
  tags?: string[];
  description?: string;
}

export interface HFDataset {
  id: string;
  downloads?: number;
  likes?: number;
  lastModified?: string;
  tags?: string[];
}

export interface HFSpace {
  id: string;
  likes?: number;
  lastModified?: string;
  sdk?: string;
  tags?: string[];
}

export interface HFStatus {
  tokenPresent: boolean;
  tokenValid: boolean;
  username?: string;
  inferenceReachable: boolean;
  pinnedModels: number;
  pinnedDatasets: number;
  pinnedSpaces: number;
  lastChecked: string;
  status: 'healthy' | 'degraded' | 'auth_error' | 'unconfigured';
  message?: string;
}

export interface HFHubClient {
  get: <T>(path: string, signal?: AbortSignal) => Promise<T>;
  post: <T>(path: string, body: unknown, signal?: AbortSignal) => Promise<T>;
}

export function createHfHubClient(baseUrl: string): HFHubClient {
  const hfBase = baseUrl.replace(/\/[^/]+\/$/, '/api/hf/hub');

  async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const res = await fetch(`${hfBase}${path}`, { signal });
    if (!res.ok) throw new Error(`HF Hub API returned ${res.status}`);
    return res.json() as Promise<T>;
  }

  async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
    const res = await fetch(`${hfBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) throw new Error(`HF Hub API returned ${res.status}`);
    return res.json() as Promise<T>;
  }

  return { get, post };
}
