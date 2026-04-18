import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendNoContent,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";
import { logger } from "../lib/logger";
import { RunConfigSchema } from "@workspace/alloy/types";
import { defaultLedger, makeLedgerEntry } from "@workspace/alloy/ledger";
import { getAlloyRunManager } from "../lib/alloy-run-manager-singleton";
import { InMemoryCheckpointStore } from "@workspace/alloy/checkpoint";
import { DefaultModelRouter } from "@workspace/alloy/model-router";
import { ECHO_STEP } from "@workspace/alloy/workflow";
import type { WorkflowStep, StepContext, StepResult, LedgerEntry, RunConfig } from "@workspace/alloy/types";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";

const router: IRouter = Router();

const runManager = getAlloyRunManager();
const modelRouter = new DefaultModelRouter();
const checkpointStore = new InMemoryCheckpointStore();

const inMemoryWorkflows = new Map<string, Record<string, unknown>>();
const inMemoryAgents = new Map<string, Record<string, unknown>>();
const inMemoryAgentVersions = new Map<string, Array<Record<string, unknown>>>();
const inMemoryPrompts = new Map<string, Record<string, unknown>>();
const inMemoryPromptVersions = new Map<string, Array<Record<string, unknown>>>();
const inMemoryModels = new Map<string, Record<string, unknown>>();
const inMemoryModelVersions = new Map<string, Array<Record<string, unknown>>>();
const inMemoryModelRoutes = new Map<string, Record<string, unknown>>();
const inMemorySignals = new Map<string, Record<string, unknown>>();
const inMemoryActions: LedgerEntry[] = [];

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  domain: z.string().default("general"),
  executionMode: z.enum(["manual", "semi_auto", "autonomous"]).default("manual"),
  policyTier: z.string().optional(),
  requiresExplicitApproval: z.boolean().default(true),
  rollbackPolicy: z.enum(["none", "step", "full"]).default("step"),
  stepsDefinition: z.array(z.record(z.unknown())).default([]),
  estimatedCostUsd: z.number().min(0).optional(),
  metadata: z.record(z.unknown()).default({}),
});

const createAgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  domain: z.string().default("general"),
  policyTier: z.string().default("internal-workflow"),
  defaultModel: z.string().optional(),
  capabilities: z.array(z.string()).default([]),
  toolAccess: z.array(z.string()).default([]),
  maxCostPerRunUsd: z.number().min(0).optional(),
  metadata: z.record(z.unknown()).default({}),
});

const createPromptSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  domain: z.string().default("general"),
  template: z.string().min(1),
  variables: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

const createModelSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  modelFamily: z.string().optional(),
  contextWindow: z.number().int().positive().optional(),
  costPerInputToken: z.number().min(0).optional(),
  costPerOutputToken: z.number().min(0).optional(),
  avgLatencyMs: z.number().int().positive().optional(),
  capabilities: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

const createSignalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  domain: z.string().default("general"),
  severity: z.enum(["info", "low", "medium", "high", "critical"]).default("medium"),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).default({}),
});

function listFromMap(map: Map<string, Record<string, unknown>>, page: number, limit: number, offset: number) {
  const all = Array.from(map.values());
  return { data: all.slice(offset, offset + limit), total: all.length, page, limit };
}

router.get("/workflows", authMiddleware(), validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    sendSuccess(res, listFromMap(inMemoryWorkflows, page, limit, offset));
  } catch (err) {
    handleRouteError(res, err, "Failed to list workflows");
  }
});

router.get("/workflows/:workflowId", authMiddleware(), (req: Request, res: Response) => {
  const { workflowId } = req.params as { workflowId: string };
  const wf = inMemoryWorkflows.get(workflowId);
  if (!wf) { sendNotFound(res, "Workflow"); return; }
  sendSuccess(res, wf);
});

router.post("/workflows", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const body = createWorkflowSchema.parse(req.body);
    const workflowId = randomUUID();
    const now = new Date().toISOString();
    const wf = {
      workflowId,
      ...body,
      isActive: true,
      createdBy: req.user?.id,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryWorkflows.set(workflowId, wf);
    logger.info({ workflowId, name: body.name }, "Workflow created");
    sendCreated(res, wf);
  } catch (err) {
    handleRouteError(res, err, "Failed to create workflow");
  }
});

router.patch("/workflows/:workflowId", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params as { workflowId: string };
    const existing = inMemoryWorkflows.get(workflowId);
    if (!existing) { sendNotFound(res, "Workflow"); return; }
    const updated = { ...existing, ...req.body, workflowId, updatedAt: new Date().toISOString() };
    inMemoryWorkflows.set(workflowId, updated);
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update workflow");
  }
});

router.delete("/workflows/:workflowId", authMiddleware(), requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params as { workflowId: string };
    if (!inMemoryWorkflows.has(workflowId)) { sendNotFound(res, "Workflow"); return; }
    inMemoryWorkflows.delete(workflowId);
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete workflow");
  }
});

router.get("/workflow-runs", authMiddleware(), validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const { workflowId } = req.query as { workflowId?: string };
    const all = defaultLedger.allEntries()
      .filter((e) => !workflowId || e.runId.startsWith(workflowId));
    const grouped: Record<string, LedgerEntry[]> = {};
    for (const e of all) {
      if (!grouped[e.runId]) grouped[e.runId] = [];
      grouped[e.runId].push(e);
    }
    const runs = Object.entries(grouped).map(([runId, entries]) => ({
      runId,
      state: runManager.getState(runId),
      ledgerEntries: entries,
    }));
    const paged = runs.slice(offset, offset + limit);
    sendSuccess(res, { data: paged, total: runs.length, page, limit });
  } catch (err) {
    handleRouteError(res, err, "Failed to list workflow runs");
  }
});

router.post("/workflow-runs", authMiddleware(), validateBody(jsonObjectBodySchema), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      workflowId?: string;
      agentId?: string;
      sessionId?: string;
      model?: string;
      policyTier?: string;
      isDryRun?: boolean;
      metadata?: Record<string, unknown>;
    };

    if (!body.workflowId) {
      sendBadRequest(res, "workflowId is required");
      return;
    }

    const user = (req as Request & { user?: { id?: number; roles?: string[]; orgs?: Array<{ orgId?: number }> } }).user;
    const serverMetadata: Record<string, unknown> = {
      ...(body.metadata ?? {}),
      orgId: user?.orgs?.[0]?.orgId ?? null,
      requestedById: user?.id ?? null,
      requestedByRole: user?.roles?.[0] ?? null,
    };

    const config = RunConfigSchema.parse({
      runId: randomUUID(),
      workflowId: body.workflowId,
      agentId: body.agentId,
      sessionId: body.sessionId,
      model: body.model,
      policyTier: body.policyTier,
      checkpointEnabled: true,
      metadata: serverMetadata,
    });

    const state = runManager.createRun(config);

    const steps: WorkflowStep[] = [ECHO_STEP];
    const finalState = await runManager.executeSteps(config.runId, steps, config);

    const cp = checkpointStore.latest(config.runId);

    logger.info({ runId: config.runId, status: finalState.status }, "Workflow run executed");
    sendCreated(res, {
      runId: config.runId,
      workflowId: body.workflowId,
      status: finalState.status,
      output: finalState.output,
      error: finalState.error,
      currentStep: finalState.currentStep,
      checkpointId: finalState.checkpointId ?? cp?.checkpointId,
      ledgerEntries: runManager.getLedgerEntries(config.runId),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to execute workflow run");
  }
});

router.get("/workflow-runs/:runId", authMiddleware(), (req: Request, res: Response) => {
  const { runId } = req.params as { runId: string };
  const state = runManager.getState(runId);
  if (!state) { sendNotFound(res, "WorkflowRun"); return; }
  sendSuccess(res, {
    ...state,
    ledgerEntries: runManager.getLedgerEntries(runId),
  });
});

router.post("/workflow-runs/:runId/replay", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { runId } = req.params as { runId: string };
    const existingState = runManager.getState(runId);
    if (!existingState) { sendNotFound(res, "WorkflowRun"); return; }

    const newRunId = randomUUID();
    const config = RunConfigSchema.parse({
      runId: newRunId,
      workflowId: existingState.workflowId,
      checkpointEnabled: true,
      metadata: { replayedFrom: runId },
    });

    runManager.createRun(config);
    const replayState = await runManager.executeSteps(newRunId, [ECHO_STEP], config);

    defaultLedger.record(makeLedgerEntry(newRunId, "checkpoint", `Replay of run ${runId}`));

    logger.info({ newRunId, originalRunId: runId, status: replayState.status }, "Run replay completed");
    sendCreated(res, {
      originalRunId: runId,
      newRunId,
      status: replayState.status,
      output: replayState.output,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to replay workflow run");
  }
});

router.get("/agents", authMiddleware(), validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    sendSuccess(res, listFromMap(inMemoryAgents, page, limit, offset));
  } catch (err) {
    handleRouteError(res, err, "Failed to list agents");
  }
});

router.get("/agents/:agentId", authMiddleware(), (req: Request, res: Response) => {
  const { agentId } = req.params as { agentId: string };
  const agent = inMemoryAgents.get(agentId);
  if (!agent) { sendNotFound(res, "Agent"); return; }
  sendSuccess(res, agent);
});

router.post("/agents", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const body = createAgentSchema.parse(req.body);
    const agentId = randomUUID();
    const now = new Date().toISOString();
    const agent = { agentId, ...body, isActive: true, createdBy: req.user?.id, createdAt: now, updatedAt: now };
    inMemoryAgents.set(agentId, agent);
    inMemoryAgentVersions.set(agentId, [{
      agentId,
      version: "1.0.0",
      snapshot: agent,
      isDeployed: true,
      deployedAt: now,
      createdAt: now,
    }]);
    logger.info({ agentId, name: body.name }, "Agent created");
    sendCreated(res, agent);
  } catch (err) {
    handleRouteError(res, err, "Failed to create agent");
  }
});

router.get("/agents/:agentId/versions", authMiddleware(), (req: Request, res: Response) => {
  try {
    const { agentId } = req.params as { agentId: string };
    if (!inMemoryAgents.has(agentId)) { sendNotFound(res, "Agent"); return; }
    const versions = inMemoryAgentVersions.get(agentId) ?? [];
    sendSuccess(res, { data: versions, total: versions.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list agent versions");
  }
});

router.post("/agents/:agentId/versions", authMiddleware(), requireRole("admin", "super_admin"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params as { agentId: string };
    const existing = inMemoryAgents.get(agentId);
    if (!existing) { sendNotFound(res, "Agent"); return; }
    const { version, changelog } = req.body as { version?: string; changelog?: string };
    if (!version) { sendBadRequest(res, "version is required"); return; }
    const now = new Date().toISOString();
    const ver = { agentId, version, changelog, snapshot: existing, isDeployed: false, createdAt: now };
    const versions = inMemoryAgentVersions.get(agentId) ?? [];
    versions.push(ver);
    inMemoryAgentVersions.set(agentId, versions);
    sendCreated(res, ver);
  } catch (err) {
    handleRouteError(res, err, "Failed to create agent version");
  }
});

router.get("/models", authMiddleware(), validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    sendSuccess(res, listFromMap(inMemoryModels, page, limit, offset));
  } catch (err) {
    handleRouteError(res, err, "Failed to list models");
  }
});

router.get("/models/:modelId", authMiddleware(), (req: Request, res: Response) => {
  const { modelId } = req.params as { modelId: string };
  const model = inMemoryModels.get(modelId);
  if (!model) { sendNotFound(res, "Model"); return; }
  sendSuccess(res, model);
});

router.post("/models", authMiddleware(), requireRole("admin", "super_admin"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const body = createModelSchema.parse(req.body);
    const modelId = randomUUID();
    const now = new Date().toISOString();
    const model = { modelId, ...body, isActive: true, createdAt: now, updatedAt: now };
    inMemoryModels.set(modelId, model);
    inMemoryModelVersions.set(modelId, [{
      modelId, version: "1.0.0", snapshot: model, isDeployed: true, deployedAt: now, createdAt: now,
    }]);
    logger.info({ modelId, name: body.name, provider: body.provider }, "Model registered");
    sendCreated(res, model);
  } catch (err) {
    handleRouteError(res, err, "Failed to register model");
  }
});

router.post("/models/route", authMiddleware(), validateBody(jsonObjectBodySchema), (req: Request, res: Response) => {
  try {
    const { task, latencyBudgetMs, maxCostUsd, preferredModel } = req.body as {
      task?: string;
      latencyBudgetMs?: number;
      maxCostUsd?: number;
      preferredModel?: string;
    };
    const selected = modelRouter.selectModel({ task, latencyBudgetMs, maxCostUsd, preferredModel });
    sendSuccess(res, { selectedModel: selected });
  } catch (err) {
    handleRouteError(res, err, "Failed to route model selection");
  }
});

router.get("/prompts", authMiddleware(), validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    sendSuccess(res, listFromMap(inMemoryPrompts, page, limit, offset));
  } catch (err) {
    handleRouteError(res, err, "Failed to list prompts");
  }
});

router.get("/prompts/:promptId", authMiddleware(), (req: Request, res: Response) => {
  const { promptId } = req.params as { promptId: string };
  const prompt = inMemoryPrompts.get(promptId);
  if (!prompt) { sendNotFound(res, "Prompt"); return; }
  sendSuccess(res, prompt);
});

router.post("/prompts", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const body = createPromptSchema.parse(req.body);
    const promptId = randomUUID();
    const now = new Date().toISOString();
    const prompt = { promptId, ...body, isActive: true, createdBy: req.user?.id, createdAt: now, updatedAt: now };
    inMemoryPrompts.set(promptId, prompt);
    inMemoryPromptVersions.set(promptId, [{
      promptId, version: "1.0.0", template: body.template, variables: body.variables,
      isDeployed: true, deployedAt: now, createdAt: now,
    }]);
    logger.info({ promptId, name: body.name }, "Prompt created");
    sendCreated(res, prompt);
  } catch (err) {
    handleRouteError(res, err, "Failed to create prompt");
  }
});

router.get("/prompts/:promptId/versions", authMiddleware(), (req: Request, res: Response) => {
  try {
    const { promptId } = req.params as { promptId: string };
    if (!inMemoryPrompts.has(promptId)) { sendNotFound(res, "Prompt"); return; }
    const versions = inMemoryPromptVersions.get(promptId) ?? [];
    sendSuccess(res, { data: versions, total: versions.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list prompt versions");
  }
});

router.get("/signals", authMiddleware(), validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const { severity, status, domain } = req.query as { severity?: string; status?: string; domain?: string };
    let all = Array.from(inMemorySignals.values()) as Array<Record<string, unknown>>;
    if (severity) all = all.filter((s) => s["severity"] === severity);
    if (status) all = all.filter((s) => s["status"] === status);
    if (domain) all = all.filter((s) => s["domain"] === domain);
    sendSuccess(res, { data: all.slice(offset, offset + limit), total: all.length, page, limit });
  } catch (err) {
    handleRouteError(res, err, "Failed to list signals");
  }
});

router.get("/signals/:signalId", authMiddleware(), (req: Request, res: Response) => {
  const { signalId } = req.params as { signalId: string };
  const signal = inMemorySignals.get(signalId);
  if (!signal) { sendNotFound(res, "Signal"); return; }
  sendSuccess(res, signal);
});

router.post("/signals", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const body = createSignalSchema.parse(req.body);
    const signalId = randomUUID();
    const now = new Date().toISOString();
    const signal = {
      signalId, ...body, status: "new",
      receivedAt: now, createdAt: now,
    };
    inMemorySignals.set(signalId, signal);
    logger.info({ signalId, title: body.title, severity: body.severity }, "Signal ingested");
    sendCreated(res, signal);
  } catch (err) {
    handleRouteError(res, err, "Failed to ingest signal");
  }
});

router.patch("/signals/:signalId/status", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { signalId } = req.params as { signalId: string };
    const existing = inMemorySignals.get(signalId);
    if (!existing) { sendNotFound(res, "Signal"); return; }
    const { status } = req.body as { status?: string };
    if (!status) { sendBadRequest(res, "status is required"); return; }
    const updated = { ...existing, status, processedAt: new Date().toISOString() };
    inMemorySignals.set(signalId, updated);
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update signal status");
  }
});

router.get("/actions", authMiddleware(), validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const { runId, type } = req.query as { runId?: string; type?: string };
    let entries = [...inMemoryActions];
    if (runId) entries = entries.filter((e) => e.runId === runId);
    if (type) entries = entries.filter((e) => e.type === type);
    const paged = entries.slice(offset, offset + limit);
    sendSuccess(res, { data: paged, total: entries.length, page, limit });
  } catch (err) {
    handleRouteError(res, err, "Failed to list actions");
  }
});

router.post("/actions", authMiddleware(), validateBody(jsonObjectBodySchema), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { runId, stepId, type, description, metadata } = req.body as {
      runId?: string;
      stepId?: string;
      type?: LedgerEntry["type"];
      description?: string;
      metadata?: Record<string, unknown>;
    };
    if (!runId || !type || !description) {
      sendBadRequest(res, "runId, type, and description are required");
      return;
    }
    const entry = makeLedgerEntry(runId, type, description, { stepId, metadata: metadata ?? {} });
    inMemoryActions.push(entry);
    defaultLedger.record(entry);
    logger.info({ entryId: entry.entryId, runId, type }, "Action ledger entry recorded");
    sendCreated(res, entry);
  } catch (err) {
    handleRouteError(res, err, "Failed to record action");
  }
});

router.get("/recommendations", authMiddleware(), validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const { domain, entityType, severity } = req.query as {
      domain?: string;
      entityType?: string;
      severity?: string;
    };
    sendSuccess(res, {
      data: [],
      total: 0,
      page,
      limit,
      filters: { domain, entityType, severity },
      note: "Recommendations are generated by the decision engine and stored in the recommendations table. Connect to DB for live data.",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to list recommendations");
  }
});

export default router;
