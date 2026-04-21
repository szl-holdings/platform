export type DealAttachmentRef = {
  kind: 'deck' | 'data-room';
  name: string;
  size: number;
  contentType: string;
  downloadUrl: string;
};

export type SubmittedDeal = {
  id: string;
  company: string;
  sector: string;
  stage: string;
  askSize: string;
  valuation: string;
  convictionScore: number;
  scores: {
    team: number;
    market: number;
    product: number;
    traction: number;
    competitive: number;
    financials: number;
  };
  status: 'screening' | 'active' | 'passed' | 'invested';
  founder: string;
  founderEmail?: string;
  summary: string;
  risks: string[];
  strengths: string[];
  deckUrl?: string | null;
  attachments?: DealAttachmentRef[];
  notes?: string | null;
  date: string;
  source: 'inbound';
};

export type AttachmentUpload = {
  kind: 'deck' | 'data-room';
  name: string;
  size: number;
  contentType: string;
  objectPath: string;
};

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const SUBMIT_ENDPOINT = `${API_BASE}/api/public/fund-inbound-deals`;
const LIST_ENDPOINT = `${API_BASE}/api/fund-inbound-deals`;
const DEAL_ENDPOINT = (id: string) => `${API_BASE}/api/fund-inbound-deals/${encodeURIComponent(id)}`;

export type SubmitDealPayload = {
  company: string;
  website?: string;
  sector: string;
  stage: string;
  askSize?: string;
  valuation?: string;
  arr?: string;
  growth?: string;
  founderName: string;
  founderEmail: string;
  founderBackground?: string;
  founderEducation?: string;
  founderPriorExits?: string;
  summary: string;
  deckUrl?: string;
  convictionScore: number;
  scores: SubmittedDeal['scores'];
  status: SubmittedDeal['status'];
  strengths: string[];
  risks: string[];
  attachments?: AttachmentUpload[];
  _hp?: string;
};

export async function uploadAttachment(
  file: File,
  kind: 'deck' | 'data-room',
): Promise<AttachmentUpload> {
  // Server-mediated upload: the API enforces the 25MB ceiling and MIME
  // allowlist before writing anything to object storage.
  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);
  const res = await fetch(`${API_BASE}/api/public/fund-inbound-deals/upload`, {
    method: 'POST',
    headers: { 'x-requested-with': 'XMLHttpRequest' },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as
    | { data?: { objectPath: string; name: string; size: number; contentType: string } }
    | { objectPath: string; name: string; size: number; contentType: string };
  const data =
    'data' in json && json.data
      ? json.data
      : (json as { objectPath: string; name: string; size: number; contentType: string });
  return {
    kind,
    name: data.name,
    size: data.size,
    contentType: data.contentType,
    objectPath: data.objectPath,
  };
}

let cache: SubmittedDeal[] = [];
const listeners = new Set<() => void>();

export function getSubmittedDeals(): SubmittedDeal[] {
  return cache;
}

export async function loadSubmittedDeals(): Promise<SubmittedDeal[]> {
  try {
    const res = await fetch(LIST_ENDPOINT, { credentials: 'include' });
    if (res.status === 401 || res.status === 403) {
      // Viewer is not an authenticated partner — no submissions to merge in.
      cache = [];
      listeners.forEach((fn) => fn());
      return cache;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    type RawAttachment = {
      kind: 'deck' | 'data-room';
      name: string;
      size: number;
      contentType: string;
      downloadPath?: string;
      downloadUrl?: string;
    };
    type RawDeal = Omit<SubmittedDeal, 'attachments'> & { attachments?: RawAttachment[] };
    const json = (await res.json()) as { data?: RawDeal[] } | RawDeal[];
    const list = Array.isArray(json) ? json : (json.data ?? []);
    // Prepend the API base to attachment download paths so analyst links work
    // even when the frontend and API are served from different origins.
    cache = list.map((d) => ({
      ...d,
      notes: (d as { notes?: string | null }).notes ?? null,
      attachments: (d.attachments ?? []).map((a) => ({
        kind: a.kind,
        name: a.name,
        size: a.size,
        contentType: a.contentType,
        downloadUrl: a.downloadPath ? `${API_BASE}${a.downloadPath}` : (a.downloadUrl ?? ''),
      })),
    })) as SubmittedDeal[];
    listeners.forEach((fn) => fn());
    return cache;
  } catch {
    return cache;
  }
}

export async function submitDeal(
  payload: SubmitDealPayload,
): Promise<{ pipelineId: string; confirmationEmail: string; submittedAt: string }> {
  const res = await fetch(SUBMIT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-requested-with': 'XMLHttpRequest' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Submission failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as
    | { data?: { pipelineId: string; confirmationEmail: string; submittedAt: string } }
    | { pipelineId: string; confirmationEmail: string; submittedAt: string };
  const data =
    'data' in json && json.data
      ? json.data
      : (json as { pipelineId: string; confirmationEmail: string; submittedAt: string });
  // Refresh cache so pipeline page reflects the new entry on next read.
  void loadSubmittedDeals();
  return data;
}

export async function updateDeal(
  pipelineId: string,
  patch: { status?: SubmittedDeal['status']; notes?: string | null },
): Promise<void> {
  const res = await fetch(DEAL_ENDPOINT(pipelineId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-requested-with': 'XMLHttpRequest' },
    credentials: 'include',
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Update failed (${res.status}): ${text}`);
  }
  // Optimistically patch the cache and notify subscribers.
  cache = cache.map((d) =>
    d.id === pipelineId ? { ...d, ...patch } : d,
  );
  listeners.forEach((fn) => fn());
  // Then re-fetch to get authoritative server state.
  void loadSubmittedDeals();
}

export function subscribeSubmittedDeals(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
