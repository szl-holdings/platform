/**
 * Code-based orchestration primitives.
 *
 * Three composable patterns built on AgentRunner:
 *
 *  chainAgents(agents, input, options)
 *    Pipeline: each agent's output feeds the next as input.
 *
 *  evaluatorLoop(worker, critic, input, options)
 *    Worker produces output, critic evaluates quality. Loops until critic
 *    approves or max iterations exhausted.
 *
 *  routeByClassification(classifier, routes, input, options)
 *    Classifier agent categorizes the input, then dispatches to the matching
 *    specialist. The classifier must emit a single-word category label.
 *
 * All patterns share governance (guardian), tracing, and run context with
 * the direct AgentRunner.
 */

import type { GuardianDecisionEngine } from '@workspace/guardian';
import type { Agent, AgentInferenceFn, AgentToolWrapper } from './agent.js';
import { AgentRunner, type AgentToolGateway } from './agent-runner.js';
import type { RunHooks } from './hooks.js';
import { createRunContext, type MutableRunContext } from './run-context.js';

export interface OrchestrationBaseOptions {
  inferenceFn?: AgentInferenceFn;
  runHooks?: RunHooks;
  agentTools?: AgentToolWrapper[];
  ctx?: MutableRunContext;
  /**
   * Guardian decision engine for all agent turns, tool calls, and handoffs
   * within this orchestration run. When omitted, AgentRunner falls back to
   * the platform defaultDecisionEngine — governed by whatever policy is
   * currently loaded.
   */
  guardian?: GuardianDecisionEngine;
  /**
   * Tool gateway for governed tool invocation in all runners spawned by
   * this orchestration primitive. When omitted, non-agent tool calls return
   * an informational not-configured message.
   */
  toolGateway?: AgentToolGateway;
}

// ─── chainAgents ─────────────────────────────────────────────────────────────

export interface ChainAgentsOptions extends OrchestrationBaseOptions {
  /** Label prefixed to the input for each stage. Default: agent name. */
  stageLabel?: (agent: Agent, index: number) => string;
}

export interface ChainAgentsResult {
  finalOutput: string | undefined;
  stageOutputs: Array<{ agentId: string; output: string | undefined }>;
  totalTurns: number;
  totalCostUsd: number;
  totalTokens: number;
}

/**
 * Pipeline: each agent's output is fed as input to the next.
 * The final agent's output is returned as the chain result.
 */
export async function chainAgents(
  agents: Agent[],
  input: string,
  options: ChainAgentsOptions = {},
): Promise<ChainAgentsResult> {
  if (agents.length === 0) {
    return { finalOutput: input, stageOutputs: [], totalTurns: 0, totalCostUsd: 0, totalTokens: 0 };
  }

  const ctx = options.ctx ?? createRunContext({ domain: 'chain-orchestration' });
  const stageOutputs: Array<{ agentId: string; output: string | undefined }> = [];
  let currentInput = input;
  let totalTurns = 0;
  let totalCostUsd = 0;
  let totalTokens = 0;

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i]!;
    const runner = new AgentRunner({
      agent,
      ctx,
      inferenceFn: options.inferenceFn,
      runHooks: options.runHooks,
      agentTools: options.agentTools,
      guardian: options.guardian,
      toolGateway: options.toolGateway,
    });

    const result = await runner.run(currentInput);
    stageOutputs.push({ agentId: agent.agentId, output: result.output });
    totalTurns += result.turns;
    totalCostUsd += result.totalCostUsd;
    totalTokens += result.totalTokens;

    currentInput = result.output ?? currentInput;
  }

  return {
    finalOutput: currentInput,
    stageOutputs,
    totalTurns,
    totalCostUsd,
    totalTokens,
  };
}

// ─── evaluatorLoop ────────────────────────────────────────────────────────────

export interface EvaluatorLoopOptions extends OrchestrationBaseOptions {
  maxIterations?: number;
  /** Critic must return a response that includes this string for approval. Default: 'APPROVED'. */
  approvalSignal?: string;
}

export interface EvaluatorLoopResult {
  finalOutput: string | undefined;
  approved: boolean;
  iterations: number;
  workerOutputs: string[];
  criticFeedback: string[];
  totalCostUsd: number;
  totalTokens: number;
}

/**
 * Worker produces output, critic evaluates it.
 * Loops until critic approves or maxIterations is exhausted.
 *
 * The critic receives the original input + worker output and should return
 * a response containing `approvalSignal` (default 'APPROVED') to approve,
 * or feedback text to request revision.
 */
export async function evaluatorLoop(
  worker: Agent,
  critic: Agent,
  input: string,
  options: EvaluatorLoopOptions = {},
): Promise<EvaluatorLoopResult> {
  const maxIterations = options.maxIterations ?? 3;
  const approvalSignal = options.approvalSignal ?? 'APPROVED';
  const ctx = options.ctx ?? createRunContext({ domain: 'evaluator-loop' });

  const workerOutputs: string[] = [];
  const criticFeedback: string[] = [];
  let totalCostUsd = 0;
  let totalTokens = 0;
  let approved = false;
  let lastWorkerOutput: string | undefined;

  let currentInput = input;

  for (let i = 0; i < maxIterations; i++) {
    // Worker turn
    const workerRunner = new AgentRunner({
      agent: worker,
      ctx,
      inferenceFn: options.inferenceFn,
      runHooks: options.runHooks,
      agentTools: options.agentTools,
      guardian: options.guardian,
      toolGateway: options.toolGateway,
    });
    const workerResult = await workerRunner.run(currentInput);
    lastWorkerOutput = workerResult.output;
    workerOutputs.push(lastWorkerOutput ?? '');
    totalCostUsd += workerResult.totalCostUsd;
    totalTokens += workerResult.totalTokens;

    // Critic turn
    const criticPrompt = [
      `Original task: ${input}`,
      `Worker output:\n${lastWorkerOutput}`,
      `Evaluate the output. If it fully meets the requirements, respond with "${approvalSignal}". `,
      `Otherwise, provide specific feedback for improvement.`,
    ].join('\n\n');

    const criticRunner = new AgentRunner({
      agent: critic,
      ctx,
      inferenceFn: options.inferenceFn,
      runHooks: options.runHooks,
      guardian: options.guardian,
      toolGateway: options.toolGateway,
    });
    const criticResult = await criticRunner.run(criticPrompt);
    const feedback = criticResult.output ?? '';
    criticFeedback.push(feedback);
    totalCostUsd += criticResult.totalCostUsd;
    totalTokens += criticResult.totalTokens;

    if (feedback.includes(approvalSignal)) {
      approved = true;
      break;
    }

    // Revision prompt for next iteration
    currentInput = [
      `Original task: ${input}`,
      `Your previous output:\n${lastWorkerOutput}`,
      `Critic feedback:\n${feedback}`,
      `Please revise your output addressing the critic feedback.`,
    ].join('\n\n');
  }

  return {
    finalOutput: lastWorkerOutput,
    approved,
    iterations: workerOutputs.length,
    workerOutputs,
    criticFeedback,
    totalCostUsd,
    totalTokens,
  };
}

// ─── routeByClassification ────────────────────────────────────────────────────

export interface ClassificationRoute {
  /** Category label the classifier must emit (case-insensitive match) */
  category: string;
  agent: Agent;
  /** Optional override input transform */
  inputTransform?: (originalInput: string, category: string) => string;
}

export interface RouteByClassificationOptions extends OrchestrationBaseOptions {
  /** If no category matches, fall back to this agent. */
  fallbackAgent?: Agent;
}

export interface RouteByClassificationResult {
  category: string;
  routedAgentId: string | undefined;
  output: string | undefined;
  totalCostUsd: number;
  totalTokens: number;
}

/**
 * Classifier agent categorizes the input, then dispatches to the matching
 * specialist. The classifier should emit a single token / short label as its
 * response — the first word of the response is used for matching.
 */
export async function routeByClassification(
  classifier: Agent,
  routes: ClassificationRoute[],
  input: string,
  options: RouteByClassificationOptions = {},
): Promise<RouteByClassificationResult> {
  const ctx = options.ctx ?? createRunContext({ domain: 'route-classification' });

  const categoryList = routes.map((r) => r.category).join(', ');
  const classifyPrompt = [
    input,
    `\nClassify this input into exactly one of these categories: ${categoryList}.`,
    `Respond with only the category name, nothing else.`,
  ].join('');

  let totalCostUsd = 0;
  let totalTokens = 0;

  // Classification step
  const classifierRunner = new AgentRunner({
    agent: classifier,
    ctx,
    inferenceFn: options.inferenceFn,
    runHooks: options.runHooks,
    guardian: options.guardian,
    toolGateway: options.toolGateway,
  });
  const classifyResult = await classifierRunner.run(classifyPrompt);
  totalCostUsd += classifyResult.totalCostUsd;
  totalTokens += classifyResult.totalTokens;

  const rawCategory = (classifyResult.output ?? '').trim().toLowerCase();
  // Match first word to a route category
  const firstWord = rawCategory.split(/\s+/)[0] ?? rawCategory;
  const matchedRoute = routes.find(
    (r) => r.category.toLowerCase() === firstWord || rawCategory.startsWith(r.category.toLowerCase()),
  );

  const targetAgent = matchedRoute?.agent ?? options.fallbackAgent;
  if (!targetAgent) {
    return {
      category: firstWord,
      routedAgentId: undefined,
      output: `[No route matched category '${firstWord}' and no fallback agent configured]`,
      totalCostUsd,
      totalTokens,
    };
  }

  const routedInput = matchedRoute?.inputTransform
    ? matchedRoute.inputTransform(input, firstWord)
    : input;

  const specialistRunner = new AgentRunner({
    agent: targetAgent,
    ctx,
    inferenceFn: options.inferenceFn,
    runHooks: options.runHooks,
    agentTools: options.agentTools,
    guardian: options.guardian,
    toolGateway: options.toolGateway,
  });
  const specialistResult = await specialistRunner.run(routedInput);
  totalCostUsd += specialistResult.totalCostUsd;
  totalTokens += specialistResult.totalTokens;

  return {
    category: firstWord,
    routedAgentId: targetAgent.agentId,
    output: specialistResult.output,
    totalCostUsd,
    totalTokens,
  };
}
