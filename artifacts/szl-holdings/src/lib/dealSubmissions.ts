export type SubmittedDeal = {
  id: string;
  company: string;
  sector: string;
  stage: string;
  askSize: string;
  valuation: string;
  convictionScore: number;
  scores: { team: number; market: number; product: number; traction: number; competitive: number; financials: number };
  status: "screening" | "active" | "passed" | "invested";
  founder: string;
  founderEmail?: string;
  summary: string;
  risks: string[];
  strengths: string[];
  date: string;
  source: "inbound";
};

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
  scores: SubmittedDeal["scores"];
  status: SubmittedDeal["status"];
  strengths: string[];
  risks: string[];
};

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const SUBMIT_ENDPOINT = `${API_BASE}/api/public/fund-inbound-deals`;
const LIST_ENDPOINT = `${API_BASE}/api/fund-inbound-deals`;

let cache: SubmittedDeal[] = [];
const listeners = new Set<() => void>();

export function getSubmittedDeals(): SubmittedDeal[] {
  return cache;
}

export async function loadSubmittedDeals(): Promise<SubmittedDeal[]> {
  try {
    const res = await fetch(LIST_ENDPOINT, { credentials: "include" });
    if (res.status === 401 || res.status === 403) {
      // Viewer is not an authenticated partner — no submissions to merge in.
      cache = [];
      listeners.forEach(fn => fn());
      return cache;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data?: SubmittedDeal[] } | SubmittedDeal[];
    const list = Array.isArray(json) ? json : (json.data ?? []);
    cache = list;
    listeners.forEach(fn => fn());
    return cache;
  } catch {
    return cache;
  }
}

export async function submitDeal(payload: SubmitDealPayload): Promise<{ pipelineId: string; confirmationEmail: string; submittedAt: string }> {
  const res = await fetch(SUBMIT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-requested-with": "XMLHttpRequest" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Submission failed (${res.status}): ${text}`);
  }
  const json = await res.json() as { data?: { pipelineId: string; confirmationEmail: string; submittedAt: string } } | { pipelineId: string; confirmationEmail: string; submittedAt: string };
  const data = "data" in json && json.data ? json.data : (json as { pipelineId: string; confirmationEmail: string; submittedAt: string });
  // Refresh cache so pipeline page reflects the new entry on next read.
  void loadSubmittedDeals();
  return data;
}

export function subscribeSubmittedDeals(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
