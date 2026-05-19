/**
 * ROSIE API client — lightweight fetch wrappers over /api/rosie/*.
 * No codegen here; the rosie surface is intentionally namespaced and decoupled.
 */

const API_BASE = "/api/rosie";

type SuccessEnvelope<T> = { success: true; data: T } | T;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} on ${path}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as SuccessEnvelope<T>;
  if (json && typeof json === "object" && "success" in (json as any) && (json as any).success) {
    return (json as any).data as T;
  }
  return json as T;
}

export interface Template {
  id: string;
  name: string;
  domain: string;
  description: string;
  variables: number;
}

interface BaseReceipt {
  receiptId: string;
  inputHash: string;
  outputHash: string;
  prevHash: string;
  receiptHash: string;
  createdAt: string;
  governance: {
    standard: string;
    authority: string;
    llmRole?: string;
    verified?: boolean;
  };
}

export interface ProofReceipt extends BaseReceipt {
  kind: "solve";
  templateId: string;
  templateName: string;
  domain: string;
  seed: number;
  sweeps: number;
  energy: number;
  iterations: number;
  spins: number[];
  selected: string[];
  narrative: string | null;
}

export interface IngestReceipt extends BaseReceipt {
  kind: "ingest";
  source: "github" | "arxiv" | "huggingface";
  itemCount: number;
  errorCount: number;
}

export interface NarrationReceipt extends BaseReceipt {
  kind: "narration";
  targetReceiptId: string;
  provider: string;
  model: string;
  narrative: string;
  schemaValidated: boolean;
}

export type AnyReceipt = ProofReceipt | IngestReceipt | NarrationReceipt;

export interface ObjectiveBreakdown {
  field: number;
  coupling: number;
  total: number;
}

export interface SolveAlternative {
  seed: number;
  energy: number;
  delta: number;
  spinDiff: number;
  selected: string[];
}

export interface ReasoningStep {
  step: string;
  detail: string;
}

export interface SolveResponse {
  receipt: ProofReceipt;
  trace: number[];
  elapsedMs: number;
  labels: string[];
  breakdown?: ObjectiveBreakdown;
  alternatives?: SolveAlternative[];
  reasoningTrace?: ReasoningStep[];
}

export interface CustomSolveBody {
  name?: string;
  J: number[][];
  h: number[];
  labels?: string[];
  seed?: number;
  sweeps?: number;
}

export interface RepoActivity {
  repo: string;
  fetchedAt: string;
  description: string | null;
  stars: number;
  openIssues: number;
  pushedAt: string | null;
  defaultBranch: string;
  recentCommits: { sha: string; message: string; author: string; date: string }[];
  error?: string;
}

export interface ArxivPaper {
  source: "arxiv";
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  url: string;
}

export interface HfModel {
  source: "huggingface";
  id: string;
  url: string;
  downloads: number;
  likes: number;
  tags: string[];
  pipelineTag: string | null;
  updatedAt: string | null;
}

export const rosieApi = {
  templates: () => request<Template[]>("/templates"),
  solve: (body: { templateId: string; seed?: number; sweeps?: number; narrate?: boolean }) =>
    request<SolveResponse>("/solve", { method: "POST", body: JSON.stringify(body) }),
  solveCustom: (body: CustomSolveBody) =>
    request<SolveResponse>("/solve/custom", { method: "POST", body: JSON.stringify(body) }),
  receipts: (kind: "solve" | "ingest" | "narration" | "all" = "solve") =>
    request<AnyReceipt[]>(`/receipts?kind=${encodeURIComponent(kind)}`),
  receipt: (id: string) => request<AnyReceipt>(`/receipts/${id}`),
  verifyChain: () =>
    request<{ chainLength: number; verified: boolean; failures: { receiptId: string; reason: string }[]; head: string; standard: string }>(
      "/receipts/verify",
      { method: "POST", body: "{}" },
    ),
  research: () =>
    request<{
      arxiv: { lastRun: string | null; count: number; papers: ArxivPaper[] };
      huggingface: { lastRun: string | null; count: number; models: HfModel[] };
    }>("/research"),
  githubRepos: () => request<{ lastRun: string | null; repos: RepoActivity[] }>("/github/repos"),
  ingestStatus: () =>
    request<{
      github: { lastRun: string | null; repoCount: number };
      arxiv: { lastRun: string | null; paperCount: number };
      huggingface: { lastRun: string | null; modelCount: number };
    }>("/ingest/status"),
  ingestRun: () => request<unknown>("/ingest/run", { method: "POST", body: "{}" }),
  fabric: () =>
    request<{
      nodes: { id: string; label: string; kind: string; x: number; y: number }[];
      edges: { source: string; target: string; weight: number }[];
      receiptCount: number;
      ingest: { github: string | null; arxiv: string | null; huggingface: string | null };
    }>("/fabric"),
};

/** WebGPU detection — returns a status string for the UI. */
export async function detectWebGPU(): Promise<{
  available: boolean;
  adapter: string | null;
  reason: string | null;
}> {
  if (typeof navigator === "undefined" || !(navigator as any).gpu) {
    return { available: false, adapter: null, reason: "navigator.gpu not exposed" };
  }
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    if (!adapter) return { available: false, adapter: null, reason: "no adapter returned" };
    const info = (await adapter.requestAdapterInfo?.()) ?? {};
    const name = info?.description || info?.vendor || info?.architecture || "WebGPU adapter";
    return { available: true, adapter: name, reason: null };
  } catch (err) {
    return { available: false, adapter: null, reason: String(err) };
  }
}
