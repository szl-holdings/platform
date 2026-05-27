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

// ───────────────────────────────────────────────────────────────────────
// Reasoning surface — Graph Planner / CTM / Time-R1 / MARBLE
// ───────────────────────────────────────────────────────────────────────

export interface LambdaReceipt {
  receiptId: string;
  kind: string;
  inputHash: string;
  outputHash: string;
  prevHash: string;
  receiptHash: string;
  createdAt: string;
  governance: { standard: string; pillar: string; authority: string };
  payload: Record<string, unknown>;
}

export interface PlanAction {
  id: string;
  title: string;
  preconditions: string[];
  effects: string[];
  actor?: string;
  cost?: number;
}

export interface PlanDag {
  planId: string;
  goal: string[];
  initialState: string[];
  nodes: PlanAction[];
  edges: { from: string; to: string }[];
  executionOrder: string[];
  criticalPath: string[];
  parallelBranches: string[][];
  unmetPreconditions: string[];
  totalCost: number;
}

export interface PlanTemplate {
  id: string;
  title: string;
  description: string;
  body?: { goal: string[]; initialState: string[]; actions: PlanAction[] };
}

export interface CtmCandidate {
  processorId: string;
  content: string;
  salience: number;
  tags?: string[];
}

export interface CtmTick {
  tick: number;
  candidates: CtmCandidate[];
  winner: CtmCandidate;
  suppressed: CtmCandidate[];
  arbitrationRationale: string;
}

export interface CtmResult {
  loopId: string;
  ticks: CtmTick[];
  finalSynthesis: string;
  totalSuppressed: number;
}

export interface BucketDrift {
  bucketIndex: number;
  startT: number;
  endT: number;
  mean: number;
  std: number;
  driftScore: number;
  count: number;
}

export interface TemporalForecast {
  seriesId: string;
  bucketWindowMs: number;
  bucketCount: number;
  baseline: { mean: number; std: number };
  buckets: BucketDrift[];
  causalPriorViolations: number[];
  peakBucket: BucketDrift | null;
  forecast: { nextMean: number; confidence: number; horizonMs: number };
  synthesis: string;
}

export interface MarbleScenarioMeta {
  scenarioId: string;
  teamGoal: string;
  ticks: number;
  agentCount: number;
  hasAdversarial: boolean;
  expectedPolicyDenials: string[];
}

export interface MarbleResult {
  scenarioId: string;
  coordinationCost: number;
  messagesExchanged: number;
  conflictingWrites: { key: string; agents: string[]; tick: number }[];
  teamGoalReached: boolean;
  adversarialGoalsAchieved: number;
  policyDenialsObserved: string[];
  expectedDenialsMissed: string[];
  score: number;
  trace: { tick: number; perAgent: ({ agentId: string; message: string; writes: Record<string, string>; claimedGoalReached: boolean; policyViolation?: string })[] }[];
}

export interface DroneOversightResponse {
  verdict: "auto-cleared" | "requires-hitl";
  telemetry: { t: number; altitude: number; speed: number; inGeofence: boolean }[];
  plan: PlanDag;
  temporal: TemporalForecast;
  ctm: CtmResult;
  receipts: { plan: LambdaReceipt; temporal: LambdaReceipt; ctm: LambdaReceipt; oversight: LambdaReceipt };
  pendingApproval: { id: string; submittedAt: number } | null;
}

export const reasoningApi = {
  planTemplates: () => request<{ templates: PlanTemplate[] }>("/plan/templates"),
  planTemplate: (id: string) => request<PlanTemplate>(`/plan/templates/${encodeURIComponent(id)}`),
  plan: (body: { goal: string[]; initialState: string[]; actions: PlanAction[]; planId?: string }) =>
    request<{ dag: PlanDag; receipt: LambdaReceipt }>("/plan", { method: "POST", body: JSON.stringify(body) }),
  ctm: (body: { input: string; ticks?: number; seed?: number }) =>
    request<{ result: CtmResult; receipt: LambdaReceipt }>("/ctm", { method: "POST", body: JSON.stringify(body) }),
  temporal: (body: { series: { t: number; v: number; label?: string }[]; bucketWindowMs?: number; baselineBuckets?: number; allowNonMonotonic?: boolean; seriesId?: string }) =>
    request<{ forecast: TemporalForecast; receipt: LambdaReceipt }>("/temporal", { method: "POST", body: JSON.stringify(body) }),
  marbleScenarios: () => request<{ scenarios: MarbleScenarioMeta[] }>("/marble/scenarios"),
  marbleRun: (body: { scenarioId: string; seed?: number }) =>
    request<{ result: MarbleResult; receipt: LambdaReceipt }>("/marble/run", { method: "POST", body: JSON.stringify(body) }),
  droneOversight: (body: { seed?: number; scenario?: string } = {}) =>
    request<DroneOversightResponse>("/demos/drone-oversight", { method: "POST", body: JSON.stringify(body) }),
  reasoningReceipts: (kind?: string, limit = 50) =>
    request<{ receipts: LambdaReceipt[]; chainHead: string; total: number }>(
      `/reasoning/receipts?${kind ? `kind=${encodeURIComponent(kind)}&` : ""}limit=${limit}`,
    ),
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
