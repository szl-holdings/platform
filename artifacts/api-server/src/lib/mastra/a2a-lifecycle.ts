/**
 * A2A Task Lifecycle Engine (v0.3)
 *
 * Full A2A v0.3 task lifecycle:
 * submitted → working → input-required → completed | failed | canceled
 *
 * Supports SSE streaming, push notification webhooks,
 * and signed Agent Cards wired to Alloy workflow state machine.
 */

import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import type { Response } from "express";

export type A2ATaskStatus =
  | "submitted"
  | "working"
  | "input-required"
  | "completed"
  | "failed"
  | "canceled";

export interface A2ATaskV3 {
  taskId: string;
  contextId: string;
  clientAgentId: string;
  remoteAgentId: string;
  status: A2ATaskStatus;
  input: unknown;
  output?: unknown;
  artifacts?: A2AArtifact[];
  error?: string;
  inputRequired?: {
    prompt: string;
    schema?: Record<string, unknown>;
  };
  history: A2ATaskHistoryEntry[];
  metadata: Record<string, unknown>;
  workflowRunId?: number;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface A2AArtifact {
  artifactId: string;
  type: "text" | "data" | "file" | "url";
  title: string;
  content: unknown;
  mimeType?: string;
  createdAt: string;
}

export interface A2ATaskHistoryEntry {
  status: A2ATaskStatus;
  timestamp: string;
  message?: string;
  actorId?: string;
}

export interface CreateA2ATaskInput {
  clientAgentId: string;
  remoteAgentId: string;
  input: unknown;
  contextId?: string;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
}

async function ensureA2AV3Table(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS a2a_tasks_v3 (
      task_id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      client_agent_id TEXT NOT NULL,
      remote_agent_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      input JSONB,
      output JSONB,
      artifacts JSONB DEFAULT '[]',
      error TEXT,
      input_required JSONB,
      history JSONB DEFAULT '[]',
      metadata JSONB DEFAULT '{}',
      workflow_run_id INTEGER,
      webhook_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS a2a_v3_status_idx ON a2a_tasks_v3 (status);
    CREATE INDEX IF NOT EXISTS a2a_v3_client_idx ON a2a_tasks_v3 (client_agent_id);
    CREATE INDEX IF NOT EXISTS a2a_v3_remote_idx ON a2a_tasks_v3 (remote_agent_id);
    CREATE INDEX IF NOT EXISTS a2a_v3_created_idx ON a2a_tasks_v3 (created_at);
  `);
}

let tableEnsured = false;
async function ensureTable(): Promise<void> {
  if (!tableEnsured) {
    await ensureA2AV3Table();
    tableEnsured = true;
  }
}

export async function ensureA2AV3Schema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS a2a_tasks_v3 (
      task_id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      client_agent_id TEXT NOT NULL,
      remote_agent_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      input JSONB,
      output JSONB,
      artifacts JSONB DEFAULT '[]',
      error TEXT,
      input_required JSONB,
      history JSONB DEFAULT '[]',
      metadata JSONB DEFAULT '{}',
      workflow_run_id INTEGER,
      webhook_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS a2a_v3_status_idx ON a2a_tasks_v3 (status);
    CREATE INDEX IF NOT EXISTS a2a_v3_client_idx ON a2a_tasks_v3 (client_agent_id);
    CREATE INDEX IF NOT EXISTS a2a_v3_remote_idx ON a2a_tasks_v3 (remote_agent_id);
    CREATE INDEX IF NOT EXISTS a2a_v3_created_idx ON a2a_tasks_v3 (created_at);
  `);
  tableEnsured = true;
  logger.info("A2A v3 task schema verified");
}

export async function createA2ATaskV3(input: CreateA2ATaskInput): Promise<string> {
  await ensureTable();

  const taskId = `a2av3_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const contextId = input.contextId ?? `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const initialHistory: A2ATaskHistoryEntry[] = [
    { status: "submitted", timestamp: now, message: "Task submitted to A2A v3 engine" },
  ];

  await pool.query(
    `INSERT INTO a2a_tasks_v3
     (task_id, context_id, client_agent_id, remote_agent_id, status, input, artifacts, history, metadata, webhook_url, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'submitted', $5, '[]', $6, $7, $8, NOW(), NOW())`,
    [
      taskId,
      contextId,
      input.clientAgentId,
      input.remoteAgentId,
      JSON.stringify(input.input),
      JSON.stringify(initialHistory),
      JSON.stringify(input.metadata ?? {}),
      input.webhookUrl ?? null,
    ],
  );

  logger.info({ taskId, remoteAgentId: input.remoteAgentId }, "A2A v3 task created");

  setImmediate(() => {
    transitionTask(taskId, "working", "Agent accepted the task").catch(err =>
      logger.warn({ err, taskId }, "Failed to auto-transition task to working")
    );
  });

  return taskId;
}

export async function getA2ATaskV3(taskId: string): Promise<A2ATaskV3 | null> {
  await ensureTable();

  const result = await pool.query("SELECT * FROM a2a_tasks_v3 WHERE task_id = $1", [taskId]);
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

export async function updateA2ATaskV3(
  taskId: string,
  status: A2ATaskStatus,
  output?: unknown,
  error?: string,
  artifacts?: A2AArtifact[],
): Promise<void> {
  await ensureTable();
  await transitionTask(taskId, status, error, output, artifacts);
}

async function transitionTask(
  taskId: string,
  newStatus: A2ATaskStatus,
  message?: string,
  output?: unknown,
  artifacts?: A2AArtifact[],
): Promise<void> {
  const existing = await getA2ATaskV3(taskId);
  if (!existing) return;

  if (!isValidTransition(existing.status, newStatus)) {
    logger.warn({ taskId, from: existing.status, to: newStatus }, "Invalid A2A task state transition");
    return;
  }

  const historyEntry: A2ATaskHistoryEntry = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    message,
  };

  const newHistory = [...existing.history, historyEntry];

  // Only write the error column for failure transitions; clear it on recovery transitions
  const errorValue = newStatus === "failed" ? (message ?? "Unknown failure") : null;
  const clearError = newStatus === "working" || newStatus === "completed";

  await pool.query(
    `UPDATE a2a_tasks_v3
     SET status = $2,
         output = COALESCE($3, output),
         artifacts = COALESCE($4, artifacts),
         error = CASE
           WHEN $5::text IS NOT NULL THEN $5::text
           WHEN $6 THEN NULL
           ELSE error
         END,
         history = $7,
         updated_at = NOW()
     WHERE task_id = $1`,
    [
      taskId,
      newStatus,
      output ? JSON.stringify(output) : null,
      artifacts ? JSON.stringify(artifacts) : null,
      errorValue,
      clearError,
      JSON.stringify(newHistory),
    ],
  );

  notifyWebhook(existing, newStatus, output).catch(() => {});

  sseEmit(taskId, newStatus, output, artifacts, message);

  logger.info({ taskId, from: existing.status, to: newStatus }, "A2A v3 task status transitioned");
}

function isValidTransition(from: A2ATaskStatus, to: A2ATaskStatus): boolean {
  const transitions: Record<A2ATaskStatus, A2ATaskStatus[]> = {
    submitted:        ["working", "canceled"],
    working:          ["input-required", "completed", "failed", "canceled"],
    "input-required": ["working", "canceled"],
    completed:        [],
    failed:           [],
    canceled:        [],
  };
  return (transitions[from] ?? []).includes(to);
}

export async function listA2ATasksV3(filters?: {
  agentId?: string;
  status?: string;
  contextId?: string;
  limit?: number;
}): Promise<A2ATaskV3[]> {
  await ensureTable();

  const conditions = ["1=1"];
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.agentId) {
    conditions.push(`(client_agent_id = $${idx} OR remote_agent_id = $${idx})`);
    params.push(filters.agentId);
    idx++;
  }
  if (filters?.status) {
    conditions.push(`status = $${idx}`);
    params.push(filters.status);
    idx++;
  }
  if (filters?.contextId) {
    conditions.push(`context_id = $${idx}`);
    params.push(filters.contextId);
    idx++;
  }

  params.push(filters?.limit ?? 50);

  const result = await pool.query(
    `SELECT * FROM a2a_tasks_v3 WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT $${idx}`,
    params,
  );

  return result.rows.map(mapRow);
}

function mapRow(r: Record<string, unknown>): A2ATaskV3 {
  return {
    taskId: r.task_id as string,
    contextId: r.context_id as string,
    clientAgentId: r.client_agent_id as string,
    remoteAgentId: r.remote_agent_id as string,
    status: r.status as A2ATaskStatus,
    input: r.input,
    output: r.output ?? undefined,
    artifacts: (r.artifacts as A2AArtifact[]) ?? [],
    error: r.error as string | undefined,
    inputRequired: r.input_required as A2ATaskV3["inputRequired"],
    history: (r.history as A2ATaskHistoryEntry[]) ?? [],
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    workflowRunId: r.workflow_run_id as number | undefined,
    webhookUrl: r.webhook_url as string | undefined,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  };
}

const sseListeners = new Map<string, Array<(data: string) => void>>();

function sseEmit(
  taskId: string,
  status: A2ATaskStatus,
  output?: unknown,
  artifacts?: A2AArtifact[],
  message?: string,
): void {
  const listeners = sseListeners.get(taskId);
  if (!listeners?.length) return;

  const event = JSON.stringify({
    type: "task_status_update",
    taskId,
    status,
    output,
    artifacts,
    message,
    timestamp: new Date().toISOString(),
  });

  for (const emit of listeners) {
    try { emit(event); } catch {}
  }

  if (["completed", "failed", "canceled"].includes(status)) {
    sseListeners.delete(taskId);
  }
}

export async function streamA2ATask(taskId: string, res: Response): Promise<void> {
  const task = await getA2ATaskV3(taskId);
  if (!task) {
    res.write(`data: ${JSON.stringify({ error: "Task not found", taskId })}\n\n`);
    res.end();
    return;
  }

  res.write(`data: ${JSON.stringify({ type: "task_created", taskId, status: task.status, task })}\n\n`);

  const emitter = (data: string) => {
    res.write(`data: ${data}\n\n`);
    if (["completed", "failed", "canceled"].some(s => data.includes(s))) {
      res.end();
    }
  };

  const listeners = sseListeners.get(taskId) ?? [];
  listeners.push(emitter);
  sseListeners.set(taskId, listeners);

  req_cleanup(res, taskId, emitter);

  const timeout = setTimeout(() => {
    const idx = sseListeners.get(taskId)?.indexOf(emitter) ?? -1;
    if (idx !== -1) sseListeners.get(taskId)?.splice(idx, 1);
    res.write(`data: ${JSON.stringify({ type: "timeout", taskId })}\n\n`);
    res.end();
  }, 60_000);

  res.on("close", () => {
    clearTimeout(timeout);
    const idx = sseListeners.get(taskId)?.indexOf(emitter) ?? -1;
    if (idx !== -1) sseListeners.get(taskId)?.splice(idx, 1);
  });
}

function req_cleanup(res: Response, taskId: string, emitter: (data: string) => void): void {
  res.on("close", () => {
    const listeners = sseListeners.get(taskId);
    if (listeners) {
      const idx = listeners.indexOf(emitter);
      if (idx !== -1) listeners.splice(idx, 1);
    }
  });
}

async function notifyWebhook(
  task: A2ATaskV3,
  newStatus: A2ATaskStatus,
  output?: unknown,
): Promise<void> {
  if (!task.webhookUrl) return;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    await fetch(task.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "a2a_task_update",
        taskId: task.taskId,
        contextId: task.contextId,
        status: newStatus,
        output,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch (err) {
    logger.warn({ err, taskId: task.taskId, webhookUrl: task.webhookUrl }, "A2A webhook notification failed");
  }
}
