/**
 * RunContext — typed shared context that flows through all agents in a run.
 *
 * Agents can read from and write to the context. Every mutation is traced
 * so the full context evolution is visible in the trace-graph.
 */

import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const RunContextSchema = z.object({
  runId: z.string(),
  sessionId: z.string().optional(),
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  domain: z.string().optional(),
  traceId: z.string(),
  budgetRemainingUsd: z.number().nonnegative().optional(),
  maxTurns: z.number().int().positive().default(10),
  currentTurn: z.number().int().nonnegative().default(0),
  currentAgentId: z.string().optional(),
  evidence: z.array(z.record(z.unknown())).default([]),
  domainConstraints: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).default({}),
});

export type RunContextInput = z.input<typeof RunContextSchema>;
export type RunContext = z.infer<typeof RunContextSchema>;

export interface RunContextMutation {
  field: string;
  previousValue: unknown;
  nextValue: unknown;
  agentId: string;
  timestamp: number;
}

/**
 * MutableRunContext wraps the typed RunContext and tracks all mutations
 * so they can be surfaced in traces.
 */
export class MutableRunContext {
  private _ctx: RunContext;
  readonly mutations: RunContextMutation[] = [];

  constructor(input: RunContextInput) {
    this._ctx = RunContextSchema.parse(input);
  }

  get snapshot(): Readonly<RunContext> {
    return this._ctx;
  }

  get runId(): string {
    return this._ctx.runId;
  }

  get traceId(): string {
    return this._ctx.traceId;
  }

  get sessionId(): string | undefined {
    return this._ctx.sessionId;
  }

  get tenantId(): string | undefined {
    return this._ctx.tenantId;
  }

  get userId(): string | undefined {
    return this._ctx.userId;
  }

  get domain(): string | undefined {
    return this._ctx.domain;
  }

  get budgetRemainingUsd(): number | undefined {
    return this._ctx.budgetRemainingUsd;
  }

  get maxTurns(): number {
    return this._ctx.maxTurns;
  }

  get currentTurn(): number {
    return this._ctx.currentTurn;
  }

  get currentAgentId(): string | undefined {
    return this._ctx.currentAgentId;
  }

  get evidence(): ReadonlyArray<Record<string, unknown>> {
    return this._ctx.evidence;
  }

  get domainConstraints(): Readonly<Record<string, unknown>> {
    return this._ctx.domainConstraints;
  }

  get metadata(): Readonly<Record<string, unknown>> {
    return this._ctx.metadata;
  }

  incrementTurn(): void {
    this._mutate('currentTurn', this._ctx.currentTurn, this._ctx.currentTurn + 1, 'system');
    this._ctx = { ...this._ctx, currentTurn: this._ctx.currentTurn + 1 };
  }

  setCurrentAgent(agentId: string): void {
    this._mutate('currentAgentId', this._ctx.currentAgentId, agentId, agentId);
    this._ctx = { ...this._ctx, currentAgentId: agentId };
  }

  addEvidence(piece: Record<string, unknown>, agentId: string): void {
    const prev = [...this._ctx.evidence];
    const next = [...this._ctx.evidence, piece];
    this._mutate('evidence', prev, next, agentId);
    this._ctx = { ...this._ctx, evidence: next };
  }

  deductBudget(costUsd: number, agentId: string): void {
    if (this._ctx.budgetRemainingUsd === undefined) return;
    const prev = this._ctx.budgetRemainingUsd;
    const next = Math.max(0, prev - costUsd);
    this._mutate('budgetRemainingUsd', prev, next, agentId);
    this._ctx = { ...this._ctx, budgetRemainingUsd: next };
  }

  setMetadata(key: string, value: unknown, agentId: string): void {
    const prev = this._ctx.metadata[key];
    this._mutate(`metadata.${key}`, prev, value, agentId);
    this._ctx = { ...this._ctx, metadata: { ...this._ctx.metadata, [key]: value } };
  }

  setDomainConstraint(key: string, value: unknown, agentId: string): void {
    const prev = this._ctx.domainConstraints[key];
    this._mutate(`domainConstraints.${key}`, prev, value, agentId);
    this._ctx = { ...this._ctx, domainConstraints: { ...this._ctx.domainConstraints, [key]: value } };
  }

  private _mutate(field: string, previousValue: unknown, nextValue: unknown, agentId: string): void {
    this.mutations.push({ field, previousValue, nextValue, agentId, timestamp: Date.now() });
  }
}

export function createRunContext(
  options: Partial<RunContextInput> & { runId?: string; traceId?: string } = {},
): MutableRunContext {
  return new MutableRunContext({
    runId: options.runId ?? randomUUID(),
    traceId: options.traceId ?? randomUUID(),
    ...options,
  });
}
