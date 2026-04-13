import { Router, type IRouter, type Request, type Response } from "express";

const govRouter: IRouter = Router();

// ─── In-memory state stores (production would use DB/Redis) ───────────────────

interface ModelRecord {
  id: string;
  name: string;
  provider: string;
  task: string;
  license: string;
  licenseType: "commercial" | "research-only" | "restricted";
  securityScore: number;
  vulnerabilities: number;
  mmlu: number | null;
  humaneval: number | null;
  gsm8k: number | null;
  hellaswag: number | null;
  costPer1kTokens: number;
  contextWindow: number;
  parameters: string;
  trainingCutoff: string;
  dataOrigin: string;
  provenance: string;
  compliance: { gdpr: boolean; hipaa: boolean; sox: boolean; fedramp: boolean };
  approvalStatus: "approved" | "pending" | "blocked" | "under-review";
  inProduction: boolean;
  aibomHash: string;
  lastScanned: string;
  featured?: boolean;
}

interface ScanRecord {
  id: string;
  modelId: string;
  model: string;
  provider: string;
  scanDate: string;
  overallScore: number;
  promptInjectionScore: number;
  toxicityScore: number;
  dataLeakageScore: number;
  adversarialRobustnessScore: number;
  biasScore: number;
  status: "passed" | "failed" | "warning";
  vulnerabilitiesFound: number;
  scanDurationMs: number;
}

interface VulnerabilityRecord {
  id: string;
  modelId: string;
  model: string;
  provider: string;
  cveId: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "prompt-injection" | "data-leakage" | "toxicity" | "adversarial" | "bias";
  status: "active" | "cleared" | "mitigated" | "disputed";
  cvssScore: number;
  description: string;
  remediation: string;
  discoveredDate: string;
  updatedDate: string;
}

interface PolicyRecord {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  ruleType: "license" | "benchmark" | "cost" | "security" | "residency";
  condition: string;
  action: "block" | "flag" | "require-approval" | "restrict";
  triggeredCount: number;
  lastTriggered: string | null;
}

interface AuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  modelId: string;
  model: string;
  decision: "approved" | "blocked" | "flagged";
  policyTriggered: string | null;
  benchmarksPassed: string[];
  notes: string;
}

interface SnapshotRecord {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: string;
  createdBy: string;
  domain: string;
  tag: string;
  modelId: string;
  model: string;
  provider: string;
  systemPromptHash: string;
  toolsHash: string;
  memoryConfig: string;
  hyperparameters: Record<string, string | number>;
  pinned: boolean;
  deployedTo: string | null;
  parentSnapshotId: string | null;
  diffFromParent?: { added: number; removed: number; changed: number };
}

interface LifecycleRecord {
  id: string;
  modelId: string;
  name: string;
  provider: string;
  stage: string;
  stageStatus: "in-progress" | "passed" | "failed" | "pending" | "blocked";
  enteredStageAt: string;
  daysInStage: number;
  securityScore?: number;
  benchmarkScore?: number;
  costPer1kTokens?: number;
  agentCount?: number;
  qualityScore?: number;
  nextAction: string;
  rotation?: { reason: string; candidateModel: string; savingsEstimate: string };
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const MODELS: ModelRecord[] = [
  {
    id: "gpt-5-2", name: "GPT-5.2", provider: "openai", task: "text-generation",
    license: "OpenAI TOS", licenseType: "commercial", securityScore: 91, vulnerabilities: 0,
    mmlu: 96.2, humaneval: 91.8, gsm8k: 98.1, hellaswag: 97.4, costPer1kTokens: 0.015,
    contextWindow: 128000, parameters: "~1T", trainingCutoff: "2025-10",
    dataOrigin: "Curated web corpus + proprietary", provenance: "OpenAI pre-training + RLHF alignment",
    compliance: { gdpr: true, hipaa: false, sox: true, fedramp: false },
    approvalStatus: "approved", inProduction: true,
    aibomHash: "sha256:a7f2b9c3e1d4", lastScanned: "2026-04-13", featured: true,
  },
  {
    id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "anthropic", task: "text-generation",
    license: "Anthropic TOS", licenseType: "commercial", securityScore: 94, vulnerabilities: 0,
    mmlu: 94.8, humaneval: 89.2, gsm8k: 97.3, hellaswag: 95.6, costPer1kTokens: 0.012,
    contextWindow: 200000, parameters: "~500B", trainingCutoff: "2025-09",
    dataOrigin: "Curated web corpus + Anthropic data", provenance: "Anthropic Constitutional AI training",
    compliance: { gdpr: true, hipaa: true, sox: true, fedramp: false },
    approvalStatus: "approved", inProduction: true,
    aibomHash: "sha256:b8d3c1e7f2a9", lastScanned: "2026-04-12", featured: true,
  },
  {
    id: "gemini-3-1-pro", name: "Gemini 3.1 Pro Preview", provider: "gemini", task: "multimodal",
    license: "Google TOS", licenseType: "commercial", securityScore: 88, vulnerabilities: 1,
    mmlu: 93.7, humaneval: 87.4, gsm8k: 96.2, hellaswag: null, costPer1kTokens: 0.0105,
    contextWindow: 1000000, parameters: "~700B", trainingCutoff: "2025-08",
    dataOrigin: "Web + Google proprietary datasets", provenance: "Google Deepmind pre-training",
    compliance: { gdpr: true, hipaa: false, sox: false, fedramp: false },
    approvalStatus: "approved", inProduction: true,
    aibomHash: "sha256:c9e4d2f8a1b7", lastScanned: "2026-04-11",
  },
  {
    id: "llama-3-3-70b", name: "Llama 3.3 70B", provider: "meta", task: "text-generation",
    license: "Llama 3 Community", licenseType: "restricted", securityScore: 76, vulnerabilities: 2,
    mmlu: 88.4, humaneval: 81.2, gsm8k: 91.7, hellaswag: 92.1, costPer1kTokens: 0.0008,
    contextWindow: 128000, parameters: "70B", trainingCutoff: "2024-12",
    dataOrigin: "CommonCrawl, C4, Wikipedia, GitHub", provenance: "Meta AI pre-training on CommonCrawl + Books",
    compliance: { gdpr: true, hipaa: false, sox: false, fedramp: false },
    approvalStatus: "pending", inProduction: false,
    aibomHash: "sha256:d1f5a3b9c8e2", lastScanned: "2026-04-10",
  },
  {
    id: "qwen3-8b", name: "Qwen3 8B", provider: "alibaba", task: "text-generation",
    license: "Apache 2.0", licenseType: "commercial", securityScore: 71, vulnerabilities: 3,
    mmlu: 82.1, humaneval: 76.4, gsm8k: 88.3, hellaswag: null, costPer1kTokens: 0.0002,
    contextWindow: 32000, parameters: "8B", trainingCutoff: "2025-04",
    dataOrigin: "Multilingual web corpus, code repositories", provenance: "Alibaba DAMO Academy pre-training",
    compliance: { gdpr: false, hipaa: false, sox: false, fedramp: false },
    approvalStatus: "under-review", inProduction: false,
    aibomHash: "sha256:e2a7d4c1f9b3", lastScanned: "2026-04-09",
  },
  {
    id: "phi-3-mini", name: "Phi-3 Mini 7B", provider: "microsoft", task: "text-generation",
    license: "MIT", licenseType: "commercial", securityScore: 84, vulnerabilities: 1,
    mmlu: 79.8, humaneval: 72.1, gsm8k: 84.2, hellaswag: 81.3, costPer1kTokens: 0.00015,
    contextWindow: 128000, parameters: "7B", trainingCutoff: "2024-09",
    dataOrigin: "Phi-1 textbook datasets + web", provenance: "Microsoft Research pre-training on textbooks",
    compliance: { gdpr: true, hipaa: false, sox: false, fedramp: false },
    approvalStatus: "approved", inProduction: false,
    aibomHash: "sha256:f3b8e5d2a6c1", lastScanned: "2026-04-13",
  },
];

const SCANS: ScanRecord[] = [
  { id: "scan-001", modelId: "gpt-5-2", model: "GPT-5.2", provider: "openai", scanDate: "2026-04-13", overallScore: 91, promptInjectionScore: 94, toxicityScore: 97, dataLeakageScore: 89, adversarialRobustnessScore: 88, biasScore: 92, status: "passed", vulnerabilitiesFound: 0, scanDurationMs: 124000 },
  { id: "scan-002", modelId: "claude-sonnet-4-6", model: "Claude Sonnet 4.6", provider: "anthropic", scanDate: "2026-04-12", overallScore: 94, promptInjectionScore: 97, toxicityScore: 98, dataLeakageScore: 93, adversarialRobustnessScore: 91, biasScore: 95, status: "passed", vulnerabilitiesFound: 0, scanDurationMs: 118000 },
  { id: "scan-003", modelId: "gemini-3-1-pro", model: "Gemini 3.1 Pro Preview", provider: "gemini", scanDate: "2026-04-11", overallScore: 88, promptInjectionScore: 82, toxicityScore: 94, dataLeakageScore: 87, adversarialRobustnessScore: 89, biasScore: 91, status: "warning", vulnerabilitiesFound: 1, scanDurationMs: 131000 },
  { id: "scan-004", modelId: "llama-3-3-70b", model: "Llama 3.3 70B", provider: "meta", scanDate: "2026-04-10", overallScore: 76, promptInjectionScore: 74, toxicityScore: 81, dataLeakageScore: 78, adversarialRobustnessScore: 71, biasScore: 79, status: "warning", vulnerabilitiesFound: 2, scanDurationMs: 198000 },
  { id: "scan-005", modelId: "qwen3-8b", model: "Qwen3 8B", provider: "alibaba", scanDate: "2026-04-09", overallScore: 71, promptInjectionScore: 68, toxicityScore: 72, dataLeakageScore: 64, adversarialRobustnessScore: 74, biasScore: 78, status: "failed", vulnerabilitiesFound: 3, scanDurationMs: 88000 },
  { id: "scan-006", modelId: "phi-3-mini", model: "Phi-3 Mini 7B", provider: "microsoft", scanDate: "2026-04-13", overallScore: 84, promptInjectionScore: 87, toxicityScore: 91, dataLeakageScore: 82, adversarialRobustnessScore: 80, biasScore: 83, status: "warning", vulnerabilitiesFound: 1, scanDurationMs: 74000 },
];

const VULNERABILITIES: VulnerabilityRecord[] = [
  { id: "vuln-001", modelId: "gemini-3-1-pro", model: "Gemini 3.1 Pro Preview", provider: "gemini", cveId: "INCA-2026-0041", title: "Indirect prompt injection via PDF tool output", severity: "high", category: "prompt-injection", status: "mitigated", cvssScore: 7.8, description: "Model susceptible to indirect prompt injection attacks when processing tool outputs containing adversarial content in PDF metadata fields.", remediation: "Apply output sanitization layer before model context ingestion.", discoveredDate: "2026-03-15", updatedDate: "2026-04-01" },
  { id: "vuln-002", modelId: "qwen3-8b", model: "Qwen3 8B", provider: "alibaba", cveId: "INCA-2026-0038", title: "PII leakage in few-shot context", severity: "high", category: "data-leakage", status: "active", cvssScore: 8.1, description: "Model reproducibly leaks PII patterns from few-shot examples when prompted with specific extraction templates.", remediation: "Restrict use of PII in few-shot examples. Enable output scanning for PII patterns.", discoveredDate: "2026-03-28", updatedDate: "2026-04-09" },
  { id: "vuln-003", modelId: "qwen3-8b", model: "Qwen3 8B", provider: "alibaba", cveId: "INCA-2026-0035", title: "Toxicity elicitation via roleplay framing", severity: "medium", category: "toxicity", status: "active", cvssScore: 6.2, description: "Model produces harmful content when user applies roleplay framing patterns that bypass safety filters.", remediation: "Apply output toxicity scoring in gateway. Add roleplay pattern detection.", discoveredDate: "2026-03-20", updatedDate: "2026-04-09" },
  { id: "vuln-004", modelId: "llama-3-3-70b", model: "Llama 3.3 70B", provider: "meta", cveId: "INCA-2026-0031", title: "Adversarial suffix attacks reduce safety compliance", severity: "medium", category: "adversarial", status: "disputed", cvssScore: 5.9, description: "Adversarial suffix patterns appended to prompts measurably reduce safety compliance rate.", remediation: "Implement adversarial suffix detection in gateway. Apply jailbreak pattern blocklist.", discoveredDate: "2026-02-14", updatedDate: "2026-04-03" },
  { id: "vuln-005", modelId: "phi-3-mini", model: "Phi-3 Mini 7B", provider: "microsoft", cveId: "INCA-2026-0028", title: "Gender bias in professional role classification", severity: "low", category: "bias", status: "cleared", cvssScore: 3.1, description: "Model exhibited measurable gender bias in professional role inference tasks.", remediation: "Cleared — bias within industry-standard acceptable thresholds.", discoveredDate: "2026-02-01", updatedDate: "2026-03-15" },
];

const POLICIES: PolicyRecord[] = [
  { id: "pol-001", name: "License Gating — No Research-Only in Production", description: "Blocks models with research-only or restricted licenses from production.", enabled: true, ruleType: "license", condition: "licenseType IN ['research-only', 'restricted']", action: "block", triggeredCount: 3, lastTriggered: "2026-04-08" },
  { id: "pol-002", name: "Benchmark Minimum — MMLU ≥ 80%", description: "Requires models to achieve at least 80% MMLU before production approval.", enabled: true, ruleType: "benchmark", condition: "mmlu < 80", action: "block", triggeredCount: 1, lastTriggered: "2026-04-01" },
  { id: "pol-003", name: "Cost Cap — Max $0.05/1K tokens", description: "Flags models exceeding $0.05 per 1,000 tokens for cost review.", enabled: true, ruleType: "cost", condition: "costPer1kTokens > 0.05", action: "require-approval", triggeredCount: 0, lastTriggered: null },
  { id: "pol-004", name: "Security Score Minimum — Score ≥ 75", description: "Blocks any model with a security scan score below 75 from production deployment.", enabled: true, ruleType: "security", condition: "securityScore < 75", action: "block", triggeredCount: 2, lastTriggered: "2026-04-09" },
  { id: "pol-005", name: "Data Residency — EU Region Required", description: "Restricts certain workloads to EU-hosted model endpoints only.", enabled: false, ruleType: "residency", condition: "project.gdprRequired AND endpoint.region NOT IN ['eu-west-1']", action: "restrict", triggeredCount: 0, lastTriggered: null },
  { id: "pol-006", name: "Active Vulnerability Block", description: "Blocks models with active critical or high-severity vulnerabilities.", enabled: true, ruleType: "security", condition: "vulnerabilities.active.severity IN ['critical', 'high']", action: "block", triggeredCount: 2, lastTriggered: "2026-04-09" },
];

const AUDIT_LOG: AuditRecord[] = [
  { id: "audit-001", timestamp: "2026-04-13T14:22:00Z", actor: "ops-lead@szl.internal", role: "Model Approver", action: "Approved for production", modelId: "gpt-5-2", model: "GPT-5.2", decision: "approved", policyTriggered: null, benchmarksPassed: ["MMLU: 96.2%", "Security: 91"], notes: "Full AIBOM review completed. All policies passed." },
  { id: "audit-002", timestamp: "2026-04-12T11:05:00Z", actor: "ops-lead@szl.internal", role: "Model Approver", action: "Approved for production", modelId: "claude-sonnet-4-6", model: "Claude Sonnet 4.6", decision: "approved", policyTriggered: null, benchmarksPassed: ["MMLU: 94.8%", "Security: 94"], notes: "Constitutional AI alignment verified." },
  { id: "audit-003", timestamp: "2026-04-09T16:30:00Z", actor: "system@inca-lab", role: "Policy Engine", action: "Blocked deployment", modelId: "qwen3-8b", model: "Qwen3 8B", decision: "blocked", policyTriggered: "pol-004", benchmarksPassed: [], notes: "Security score 71 below minimum threshold (75)." },
  { id: "audit-004", timestamp: "2026-04-08T09:14:00Z", actor: "system@inca-lab", role: "Policy Engine", action: "Flagged for review", modelId: "llama-3-3-70b", model: "Llama 3.3 70B", decision: "flagged", policyTriggered: "pol-001", benchmarksPassed: ["MMLU: 88.4%"], notes: "License type 'restricted' triggered license gate policy." },
];

const SNAPSHOTS: SnapshotRecord[] = [
  { id: "snap-001", name: "Maritime Investigation v2.4", description: "Production-locked environment for maritime sanctions investigations.", version: "2.4.0", createdAt: "2026-04-10T14:22:00Z", createdBy: "ops@szl.internal", domain: "Vessels Maritime", tag: "production", modelId: "claude-sonnet-4-6", model: "claude-sonnet-4-6", provider: "anthropic", systemPromptHash: "sha256:a1b2c3d4e5f6", toolsHash: "sha256:b2c3d4e5f6a1", memoryConfig: "episodic + semantic, 30d retention", hyperparameters: { temperature: 0.1, max_tokens: 4096, top_p: 0.95, presence_penalty: 0.1 }, pinned: true, deployedTo: "production", parentSnapshotId: "snap-003", diffFromParent: { added: 2, removed: 0, changed: 3 } },
  { id: "snap-002", name: "Legal Analysis — PRISM v1.8", description: "Reproducible case analysis environment for PRISM Counsel.", version: "1.8.1", createdAt: "2026-04-08T09:15:00Z", createdBy: "prism-admin@szl.internal", domain: "PRISM Counsel", tag: "production", modelId: "gpt-5-2", model: "gpt-5.2", provider: "openai", systemPromptHash: "sha256:c3d4e5f6a1b2", toolsHash: "sha256:d4e5f6a1b2c3", memoryConfig: "case-scoped, 365d retention", hyperparameters: { temperature: 0.05, max_tokens: 8192, top_p: 0.9, frequency_penalty: 0.2 }, pinned: true, deployedTo: "production", parentSnapshotId: null },
  { id: "snap-003", name: "Maritime Investigation v2.3", description: "Previous production version. Retained for audit trail.", version: "2.3.2", createdAt: "2026-03-28T11:40:00Z", createdBy: "ops@szl.internal", domain: "Vessels Maritime", tag: "archived", modelId: "claude-sonnet-4-6", model: "claude-sonnet-4-6", provider: "anthropic", systemPromptHash: "sha256:e5f6a1b2c3d4", toolsHash: "sha256:b2c3d4e5f6a1", memoryConfig: "episodic + semantic, 30d retention", hyperparameters: { temperature: 0.1, max_tokens: 4096, top_p: 0.9, presence_penalty: 0.0 }, pinned: false, deployedTo: null, parentSnapshotId: null },
  { id: "snap-004", name: "Aegis Defense Analysis v3.1", description: "Audit-ready inference environment for defense operations.", version: "3.1.0", createdAt: "2026-04-05T07:30:00Z", createdBy: "aegis-admin@szl.internal", domain: "Aegis Defense", tag: "production", modelId: "gpt-5-2", model: "gpt-5.2", provider: "openai", systemPromptHash: "sha256:f6a1b2c3d4e5", toolsHash: "sha256:a1b2c3d4e5f6", memoryConfig: "working memory only, no persistence", hyperparameters: { temperature: 0.0, max_tokens: 4096, top_p: 1.0, presence_penalty: 0.0 }, pinned: true, deployedTo: "production", parentSnapshotId: null },
];

const LIFECYCLE: LifecycleRecord[] = [
  { id: "lc-001", modelId: "gpt-5-2", name: "GPT-5.2", provider: "openai", stage: "production", stageStatus: "in-progress", enteredStageAt: "2026-01-15", daysInStage: 88, securityScore: 91, benchmarkScore: 96.2, costPer1kTokens: 0.015, agentCount: 5, qualityScore: 96, nextAction: "Continuous monitoring — next review 2026-07-13" },
  { id: "lc-002", modelId: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "anthropic", stage: "production", stageStatus: "in-progress", enteredStageAt: "2026-02-01", daysInStage: 71, securityScore: 94, benchmarkScore: 94.8, costPer1kTokens: 0.012, agentCount: 3, qualityScore: 97, nextAction: "Continuous monitoring — no action required" },
  { id: "lc-003", modelId: "gemini-3-1-pro", name: "Gemini 3.1 Pro Preview", provider: "gemini", stage: "monitoring", stageStatus: "in-progress", enteredStageAt: "2026-03-10", daysInStage: 34, securityScore: 88, benchmarkScore: 93.7, costPer1kTokens: 0.0105, agentCount: 2, qualityScore: 89, nextAction: "Monitor prompt injection score — re-scan scheduled 2026-04-20", rotation: { reason: "Prompt injection score degraded 6pts since deployment.", candidateModel: "Claude Sonnet 4.6", savingsEstimate: "~$340/mo savings" } },
  { id: "lc-004", modelId: "phi-3-mini", name: "Phi-3 Mini 7B", provider: "microsoft", stage: "staging", stageStatus: "in-progress", enteredStageAt: "2026-04-07", daysInStage: 6, securityScore: 84, benchmarkScore: 79.8, costPer1kTokens: 0.00015, nextAction: "Run staging integration tests — 3 remaining" },
  { id: "lc-005", modelId: "llama-3-3-70b", name: "Llama 3.3 70B", provider: "meta", stage: "governance", stageStatus: "blocked", enteredStageAt: "2026-04-05", daysInStage: 8, securityScore: 76, benchmarkScore: 88.4, nextAction: "Awaiting legal review for restricted license policy waiver" },
  { id: "lc-006", modelId: "qwen3-8b", name: "Qwen3 8B", provider: "alibaba", stage: "security-scan", stageStatus: "failed", enteredStageAt: "2026-04-09", daysInStage: 4, securityScore: 71, nextAction: "Fix active vulnerabilities before re-scan" },
];

// ─── Policy Enforcement Engine ────────────────────────────────────────────────

function evaluatePolicies(model: ModelRecord, enabledPolicies: PolicyRecord[]): {
  allowed: boolean;
  blockedBy: PolicyRecord[];
  flaggedBy: PolicyRecord[];
  requiresApproval: boolean;
} {
  const blocked: PolicyRecord[] = [];
  const flagged: PolicyRecord[] = [];
  let requiresApproval = false;

  for (const policy of enabledPolicies.filter(p => p.enabled)) {
    let triggered = false;

    if (policy.id === "pol-001") {
      triggered = model.licenseType === "research-only" || model.licenseType === "restricted";
    } else if (policy.id === "pol-002") {
      triggered = model.mmlu !== null && model.mmlu < 80;
    } else if (policy.id === "pol-003") {
      triggered = model.costPer1kTokens > 0.05;
    } else if (policy.id === "pol-004") {
      triggered = model.securityScore < 75;
    } else if (policy.id === "pol-006") {
      // Active high/critical vulns
      const modelVulns = VULNERABILITIES.filter(v => v.modelId === model.id && v.status === "active" && (v.severity === "critical" || v.severity === "high"));
      triggered = modelVulns.length > 0;
    }

    if (triggered) {
      if (policy.action === "block") {
        blocked.push(policy);
        policy.triggeredCount += 1;
        policy.lastTriggered = new Date().toISOString().slice(0, 10);
      } else if (policy.action === "flag") {
        flagged.push(policy);
        policy.triggeredCount += 1;
        policy.lastTriggered = new Date().toISOString().slice(0, 10);
      } else if (policy.action === "require-approval") {
        requiresApproval = true;
        flagged.push(policy);
        policy.triggeredCount += 1;
        policy.lastTriggered = new Date().toISOString().slice(0, 10);
      }
    }
  }

  return {
    allowed: blocked.length === 0,
    blockedBy: blocked,
    flaggedBy: flagged,
    requiresApproval,
  };
}

// ─── Model Catalog Endpoints ──────────────────────────────────────────────────

govRouter.get("/inca-lab/models/catalog", (_req: Request, res: Response) => {
  res.json({ data: MODELS, meta: { total: MODELS.length, approved: MODELS.filter(m => m.approvalStatus === "approved").length } });
});

govRouter.get("/inca-lab/models/catalog/:id", (req: Request, res: Response) => {
  const model = MODELS.find(m => m.id === req.params.id);
  if (!model) { res.status(404).json({ error: "Model not found" }); return; }
  res.json({ data: model });
});

govRouter.post("/inca-lab/models/:id/approve", (req: Request, res: Response) => {
  const model = MODELS.find(m => m.id === req.params.id);
  if (!model) { res.status(404).json({ error: "Model not found" }); return; }

  const actor = (req.body as Record<string, string>).actor || "system@inca-lab";
  const overrideReason = (req.body as Record<string, string>).overrideReason;

  // Evaluate all enabled policies
  const evaluation = evaluatePolicies(model, POLICIES);

  if (!evaluation.allowed && !overrideReason) {
    // Create a blocked audit entry
    const auditEntry: AuditRecord = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "system@inca-lab",
      role: "Policy Engine",
      action: "Blocked deployment — policy violation",
      modelId: model.id,
      model: model.name,
      decision: "blocked",
      policyTriggered: evaluation.blockedBy[0]?.id ?? null,
      benchmarksPassed: [],
      notes: `Blocked by: ${evaluation.blockedBy.map(p => p.name).join(", ")}. Security: ${model.securityScore}, License: ${model.licenseType}, MMLU: ${model.mmlu}.`,
    };
    AUDIT_LOG.unshift(auditEntry);
    model.approvalStatus = "blocked";

    res.status(422).json({
      error: "Policy evaluation failed — approval blocked",
      blockedBy: evaluation.blockedBy.map(p => ({ id: p.id, name: p.name, action: p.action })),
      flaggedBy: evaluation.flaggedBy.map(p => ({ id: p.id, name: p.name })),
    });
    return;
  }

  // Approved — create audit entry
  const benchmarks: string[] = [];
  if (model.mmlu !== null) benchmarks.push(`MMLU: ${model.mmlu}%`);
  if (model.humaneval !== null) benchmarks.push(`HumanEval: ${model.humaneval}%`);
  benchmarks.push(`Security: ${model.securityScore}`);

  const flagNotes = evaluation.flaggedBy.length > 0 ? ` Flagged policies: ${evaluation.flaggedBy.map(p => p.name).join(", ")}.` : "";
  const overrideNotes = overrideReason ? ` Override reason: ${overrideReason}.` : "";

  const auditEntry: AuditRecord = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor,
    role: overrideReason ? "Model Approver (Override)" : "Model Approver",
    action: "Approved for production",
    modelId: model.id,
    model: model.name,
    decision: "approved",
    policyTriggered: null,
    benchmarksPassed: benchmarks,
    notes: `AIBOM review completed. All mandatory policies passed.${flagNotes}${overrideNotes}`,
  };
  AUDIT_LOG.unshift(auditEntry);
  model.approvalStatus = "approved";

  // Advance lifecycle to staging if it was in governance
  const lc = LIFECYCLE.find(l => l.modelId === model.id);
  if (lc && lc.stage === "governance") {
    lc.stage = "staging";
    lc.stageStatus = "in-progress";
    lc.nextAction = "Run staging integration tests";
    lc.enteredStageAt = new Date().toISOString().slice(0, 10);
    lc.daysInStage = 0;
  }

  res.json({
    data: model,
    evaluation: {
      allowed: true,
      flaggedBy: evaluation.flaggedBy.map(p => ({ id: p.id, name: p.name })),
      requiresApproval: evaluation.requiresApproval,
    },
    audit: auditEntry,
  });
});

govRouter.post("/inca-lab/models/:id/lifecycle", (req: Request, res: Response) => {
  const lc = LIFECYCLE.find(l => l.modelId === req.params.id);
  if (!lc) { res.status(404).json({ error: "Lifecycle record not found" }); return; }

  const { stage, stageStatus, nextAction } = req.body as Partial<LifecycleRecord>;
  if (stage) lc.stage = stage;
  if (stageStatus) lc.stageStatus = stageStatus;
  if (nextAction) lc.nextAction = nextAction;
  lc.enteredStageAt = new Date().toISOString().slice(0, 10);
  lc.daysInStage = 0;

  res.json({ data: lc });
});

// ─── Security Scanning Endpoints ──────────────────────────────────────────────

govRouter.get("/inca-lab/models/security-scans", (_req: Request, res: Response) => {
  const avgScore = SCANS.reduce((s, r) => s + r.overallScore, 0) / SCANS.length;
  res.json({
    data: {
      scans: SCANS,
      vulnerabilities: VULNERABILITIES,
      summary: {
        avgFleetScore: Math.round(avgScore),
        activeVulnerabilities: VULNERABILITIES.filter(v => v.status === "active").length,
        failedScans: SCANS.filter(s => s.status === "failed").length,
        policyBlocked: SCANS.filter(s => s.overallScore < 75).length,
      },
    },
  });
});

govRouter.post("/inca-lab/models/:id/scan", (req: Request, res: Response) => {
  const model = MODELS.find(m => m.id === req.params.id);
  if (!model) { res.status(404).json({ error: "Model not found" }); return; }

  // Simulate a re-scan with slight variation
  const existingScan = SCANS.find(s => s.modelId === model.id);
  if (!existingScan) { res.status(404).json({ error: "No scan baseline found" }); return; }

  const variation = () => Math.floor((Math.random() - 0.5) * 4); // ±2 variation
  const newScan: ScanRecord = {
    ...existingScan,
    id: `scan-${Date.now()}`,
    scanDate: new Date().toISOString().slice(0, 10),
    overallScore: Math.min(100, Math.max(0, existingScan.overallScore + variation())),
    promptInjectionScore: Math.min(100, Math.max(0, existingScan.promptInjectionScore + variation())),
    toxicityScore: Math.min(100, Math.max(0, existingScan.toxicityScore + variation())),
    dataLeakageScore: Math.min(100, Math.max(0, existingScan.dataLeakageScore + variation())),
    adversarialRobustnessScore: Math.min(100, Math.max(0, existingScan.adversarialRobustnessScore + variation())),
    biasScore: Math.min(100, Math.max(0, existingScan.biasScore + variation())),
    scanDurationMs: existingScan.scanDurationMs + Math.floor((Math.random() - 0.5) * 10000),
  };
  newScan.status = newScan.overallScore >= 88 ? "passed" : newScan.overallScore >= 75 ? "warning" : "failed";
  model.securityScore = newScan.overallScore;
  model.lastScanned = newScan.scanDate;

  // Update the scan in the array
  const scanIdx = SCANS.findIndex(s => s.modelId === model.id);
  if (scanIdx >= 0) SCANS[scanIdx] = newScan;

  res.json({ data: newScan });
});

govRouter.patch("/inca-lab/models/vulnerabilities/:id/status", (req: Request, res: Response) => {
  const vuln = VULNERABILITIES.find(v => v.id === req.params.id);
  if (!vuln) { res.status(404).json({ error: "Vulnerability not found" }); return; }

  const { status } = req.body as { status: VulnerabilityRecord["status"] };
  if (!["active", "cleared", "mitigated", "disputed"].includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  vuln.status = status;
  vuln.updatedDate = new Date().toISOString().slice(0, 10);

  res.json({ data: vuln });
});

// ─── Governance Policy Endpoints ──────────────────────────────────────────────

govRouter.get("/inca-lab/governance/policies", (_req: Request, res: Response) => {
  res.json({ data: POLICIES });
});

govRouter.patch("/inca-lab/governance/policies/:id", (req: Request, res: Response) => {
  const policy = POLICIES.find(p => p.id === req.params.id);
  if (!policy) { res.status(404).json({ error: "Policy not found" }); return; }

  const { enabled, name, description } = req.body as Partial<PolicyRecord>;
  if (enabled !== undefined) policy.enabled = enabled;
  if (name) policy.name = name;
  if (description) policy.description = description;

  res.json({ data: policy });
});

govRouter.get("/inca-lab/governance/audit", (_req: Request, res: Response) => {
  res.json({ data: AUDIT_LOG });
});

govRouter.post("/inca-lab/governance/audit", (req: Request, res: Response) => {
  const entry: AuditRecord = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...(req.body as Omit<AuditRecord, "id" | "timestamp">),
  };
  AUDIT_LOG.unshift(entry);
  res.status(201).json({ data: entry });
});

govRouter.get("/inca-lab/governance/compliance", (_req: Request, res: Response) => {
  const compliance = MODELS.map(model => {
    const scan = SCANS.find(s => s.modelId === model.id);
    const activeHighVulns = VULNERABILITIES.filter(v => v.modelId === model.id && v.status === "active" && (v.severity === "critical" || v.severity === "high")).length;

    const securityOk = (scan?.overallScore ?? 0) >= 75;
    const licenseOk = model.licenseType === "commercial";
    const benchmarkOk = (model.mmlu ?? 0) >= 80;
    const costOk = model.costPer1kTokens <= 0.05;
    const noActiveHighVulns = activeHighVulns === 0;

    return {
      modelId: model.id,
      model: model.name,
      provider: model.provider,
      overallCompliant: securityOk && licenseOk && benchmarkOk && costOk && noActiveHighVulns,
      securityPolicyMet: securityOk,
      licensePolicyMet: licenseOk,
      benchmarkPolicyMet: benchmarkOk,
      costPolicyMet: costOk,
      noActiveHighVulnerabilities: noActiveHighVulns,
      lastReviewed: model.lastScanned,
      drift: false,
    };
  });

  res.json({ data: compliance });
});

// Cross-domain: governance status for gateway routing decisions
govRouter.get("/inca-lab/governance/gateway-status", (_req: Request, res: Response) => {
  const gatewayStatus = MODELS.map(model => ({
    modelId: model.id,
    name: model.name,
    provider: model.provider,
    approvalStatus: model.approvalStatus,
    securityScore: model.securityScore,
    inProduction: model.inProduction,
    routingAllowed: model.approvalStatus === "approved" && model.securityScore >= 75,
    reason: model.approvalStatus !== "approved"
      ? `Model not approved (${model.approvalStatus})`
      : model.securityScore < 75
        ? `Security score ${model.securityScore} below threshold (75)`
        : null,
  }));

  res.json({ data: gatewayStatus });
});

// ─── Environment Snapshots Endpoints ─────────────────────────────────────────

govRouter.get("/inca-lab/environments/snapshots", (_req: Request, res: Response) => {
  res.json({ data: SNAPSHOTS, meta: { total: SNAPSHOTS.length, production: SNAPSHOTS.filter(s => s.tag === "production").length } });
});

govRouter.get("/inca-lab/environments/snapshots/:id", (req: Request, res: Response) => {
  const snap = SNAPSHOTS.find(s => s.id === req.params.id);
  if (!snap) { res.status(404).json({ error: "Snapshot not found" }); return; }
  res.json({ data: snap });
});

govRouter.post("/inca-lab/environments/snapshots", (req: Request, res: Response) => {
  const newSnap: SnapshotRecord = {
    id: `snap-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...(req.body as Omit<SnapshotRecord, "id" | "createdAt">),
  };
  SNAPSHOTS.push(newSnap);
  res.status(201).json({ data: newSnap });
});

govRouter.post("/inca-lab/environments/snapshots/:id/clone", (req: Request, res: Response) => {
  const snap = SNAPSHOTS.find(s => s.id === req.params.id);
  if (!snap) { res.status(404).json({ error: "Snapshot not found" }); return; }

  const cloned: SnapshotRecord = {
    ...snap,
    id: `snap-${Date.now()}`,
    name: `${snap.name} (Clone)`,
    version: snap.version + "-clone",
    createdAt: new Date().toISOString(),
    createdBy: (req.body as Record<string, string>).actor || "user@szl.internal",
    tag: "experimental",
    pinned: false,
    deployedTo: null,
    parentSnapshotId: snap.id,
    diffFromParent: { added: 0, removed: 0, changed: 0 },
  };
  SNAPSHOTS.push(cloned);
  res.status(201).json({ data: cloned });
});

govRouter.post("/inca-lab/environments/snapshots/:id/promote", (req: Request, res: Response) => {
  const snap = SNAPSHOTS.find(s => s.id === req.params.id);
  if (!snap) { res.status(404).json({ error: "Snapshot not found" }); return; }

  // Check model is approved before allowing promotion
  const model = MODELS.find(m => m.id === snap.modelId);
  if (model && model.approvalStatus !== "approved") {
    res.status(422).json({ error: `Model ${model.name} is not approved for production (status: ${model.approvalStatus})` }); return;
  }

  const target = ((req.body as Record<string, string>).target) || "staging";
  snap.tag = target === "production" ? "production" : "staging";
  snap.deployedTo = target;

  res.json({ data: snap });
});

govRouter.delete("/inca-lab/environments/snapshots/:id", (req: Request, res: Response) => {
  const idx = SNAPSHOTS.findIndex(s => s.id === req.params.id);
  if (idx < 0) { res.status(404).json({ error: "Snapshot not found" }); return; }
  if (SNAPSHOTS[idx]?.pinned) { res.status(422).json({ error: "Cannot delete a pinned snapshot" }); return; }
  const [removed] = SNAPSHOTS.splice(idx, 1);
  res.json({ data: removed });
});

// ─── Model Lifecycle Endpoints ────────────────────────────────────────────────

govRouter.get("/inca-lab/models/lifecycle", (_req: Request, res: Response) => {
  const costIntelligence = [
    { model: "GPT-5.2", agent: "Oracle", domain: "Predictive Analytics", monthlyCost: 98, alternativeModel: "Claude Sonnet 4.6", alternativeCost: 78, qualityDelta: -0.8, savings: 20 },
    { model: "GPT-5.2", agent: "Nexus Fuse", domain: "Cross-Domain", monthlyCost: 520, alternativeModel: "Gemini 3.1 Pro", alternativeCost: 364, qualityDelta: -1.4, savings: 156 },
    { model: "Gemini 3.1 Pro Preview", agent: "Prospector", domain: "Real Estate", monthlyCost: 188, alternativeModel: "Claude Sonnet 4.6", alternativeCost: 148, qualityDelta: 0.6, savings: 40 },
  ];

  res.json({
    data: {
      pipeline: LIFECYCLE,
      costIntelligence,
      summary: {
        inProduction: LIFECYCLE.filter(l => l.stage === "production").length,
        blocked: LIFECYCLE.filter(l => l.stageStatus === "blocked" || l.stageStatus === "failed").length,
        rotationCandidates: LIFECYCLE.filter(l => l.rotation).length,
        totalMonthlyCost: costIntelligence.reduce((s, c) => s + c.monthlyCost, 0),
        potentialSavings: costIntelligence.reduce((s, c) => s + c.savings, 0),
      },
    },
  });
});

govRouter.patch("/inca-lab/models/lifecycle/:modelId/rotate", (req: Request, res: Response) => {
  const lc = LIFECYCLE.find(l => l.modelId === req.params.modelId);
  if (!lc) { res.status(404).json({ error: "Lifecycle record not found" }); return; }
  if (!lc.rotation) { res.status(422).json({ error: "No rotation candidate registered for this model" }); return; }

  const { candidateModelId } = req.body as { candidateModelId: string };
  const candidateModel = MODELS.find(m => m.id === candidateModelId || m.name === lc.rotation!.candidateModel);
  if (candidateModel && candidateModel.approvalStatus !== "approved") {
    res.status(422).json({ error: `Candidate model ${candidateModel.name} is not approved` }); return;
  }

  lc.stage = "ab-testing";
  lc.stageStatus = "in-progress";
  lc.nextAction = `A/B test initiated — comparing against ${lc.rotation.candidateModel}`;
  const prevRotation = lc.rotation;
  delete lc.rotation;

  res.json({ data: lc, rotationInitiated: true, candidateModel: prevRotation.candidateModel });
});

export default govRouter;
