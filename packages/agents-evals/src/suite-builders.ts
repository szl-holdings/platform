import { type PromptRef, resolvePrompt } from '@workspace/agents-prompts';
import type { TypedTool } from '@workspace/agents-tools';
import type { EvalCase, EvalSuiteDef } from '@workspace/eval-forge';

export interface ToolEvalCase {
  label: string;
  input: Record<string, unknown>;
  groundTruth: Record<string, unknown>;
  expectedOutcome?: 'pass' | 'fail';
  tags?: string[];
}

export function createToolEvalSuite(
  tool: TypedTool,
  cases: ToolEvalCase[],
  options?: { suiteId?: string; domain?: string; version?: number },
): EvalSuiteDef {
  const suiteId = options?.suiteId ?? `tool-eval:${tool.manifest.id}`;
  const domain = options?.domain ?? tool.manifest.domainTags[0] ?? 'custom';

  const evalCases: EvalCase[] = cases.map((c, idx) => ({
    id: `${suiteId}:case-${idx}`,
    domain,
    label: c.label,
    evalType: 'tool-reliability' as const,
    graderType: 'tool-reliability' as const,
    input: c.input,
    groundTruth: c.groundTruth,
    expectedOutcome: c.expectedOutcome ?? 'pass',
    tags: [...(c.tags ?? []), `tool:${tool.manifest.id}`, `version:${tool.manifest.version}`],
  }));

  return {
    suiteId,
    name: `Tool Reliability — ${tool.manifest.name}`,
    description: `Auto-generated reliability eval suite for tool '${tool.manifest.id}' v${tool.manifest.version}`,
    domain,
    evalType: 'tool-reliability',
    cases: evalCases,
    tags: ['auto-generated', 'tool-reliability', `tool:${tool.manifest.id}`],
    version: options?.version ?? 1,
  };
}

export interface PromptEvalCase {
  label: string;
  variables: Record<string, unknown>;
  groundTruth: Record<string, unknown>;
  expectedOutcome?: 'pass' | 'fail';
  tags?: string[];
}

export function createPromptEvalSuite(
  promptRef: PromptRef,
  cases: PromptEvalCase[],
  options?: { suiteId?: string; domain?: string; version?: number },
): EvalSuiteDef {
  const suiteId = options?.suiteId ?? `prompt-eval:${promptRef.id}`;
  const domain = options?.domain ?? 'agents-core';

  let resolvedVersionId = promptRef.versionConstraint ?? 'active';
  try {
    const resolved = resolvePrompt(promptRef, {});
    resolvedVersionId = resolved.versionId;
  } catch (_err) {
  }

  const evalCases: EvalCase[] = cases.map((c, idx) => ({
    id: `${suiteId}:case-${idx}`,
    domain,
    label: c.label,
    evalType: 'prompt-eval' as const,
    graderType: 'prompt-eval' as const,
    input: {
      ...c.variables,
      __promptId: promptRef.id,
      __versionConstraint: promptRef.versionConstraint,
    },
    groundTruth: c.groundTruth,
    expectedOutcome: c.expectedOutcome ?? 'pass',
    tags: [...(c.tags ?? []), `prompt:${promptRef.id}`, `version:${resolvedVersionId}`],
  }));

  return {
    suiteId,
    name: `Prompt Eval — ${promptRef.id}`,
    description: `Auto-generated prompt eval suite for prompt '${promptRef.id}' (${resolvedVersionId})`,
    domain,
    evalType: 'prompt-eval',
    cases: evalCases,
    tags: ['auto-generated', 'prompt-eval', `prompt:${promptRef.id}`],
    version: options?.version ?? 1,
  };
}

export function createEndToEndEvalSuite(params: {
  suiteId: string;
  name: string;
  description?: string;
  domain: string;
  cases: EvalCase[];
  version?: number;
}): EvalSuiteDef {
  return {
    suiteId: params.suiteId,
    name: params.name,
    description: params.description,
    domain: params.domain,
    evalType: 'end-to-end-scenario',
    cases: params.cases,
    tags: ['end-to-end', params.domain],
    version: params.version ?? 1,
  };
}
