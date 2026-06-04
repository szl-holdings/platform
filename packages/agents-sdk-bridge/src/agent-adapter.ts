/**
 * SzlAgentAdapter — wraps each SZL AgentDefinition as an @openai/agents Agent.
 *
 * Maps:
 *   - AgentDefinition.systemPrompt → Agent.instructions
 *   - AgentDefinition.tools → SzlToolAdapter.adaptByIds() → SDK FunctionTool[]
 *   - AgentDefinition.collaboratesWith → SDK handoffs[] (other Agent instances)
 *   - AgentDefinition.preferredModel → SDK model config
 *   - SzlGuardrailAdapter → Agent.inputGuardrails / outputGuardrails
 *
 * The adapter is opt-in and backward compatible — existing AgentDefinitions
 * continue to work through the hand-rolled tool-calling loop unless they
 * declare useAgentsSdk: true.
 */

import { Agent, type InputGuardrail, type OutputGuardrail } from '@openai/agents';
import { SzlToolAdapter, type SzlToolAdapterOptions } from './tool-adapter.js';
import { SzlGuardrailAdapter } from './guardrail-adapter.js';

/**
 * Minimal shape of a SZL AgentDefinition.
 * Matches the full type in lib/ai-engine/src/nuro-mesh.ts.
 */
export interface AgentDefinitionLike {
  id: string;
  name: string;
  domain: string;
  preferredModel?: string;
  preferredProvider?: string;
  tools: string[];
  collaboratesWith?: string[];
  systemPrompt: string;
  useAgentsSdk?: boolean;
}

export interface SzlAgentAdapterOptions extends SzlToolAdapterOptions {
  /**
   * Domain context for policy evaluation in guardrails. Defaults to 'general'.
   */
  domain?: string;

  /**
   * A map of agentId → Agent instance for resolving handoffs.
   * Must be pre-populated before calling adaptAll().
   */
  agentRegistry?: Map<string, Agent<any>>;

  /**
   * Whether to attach SzlGuardrailAdapter as input/output guardrails.
   * Defaults to true.
   */
  enableGuardrails?: boolean;
}

/**
 * SzlAgentAdapter — converts a SZL AgentDefinition into an SDK Agent.
 */
export class SzlAgentAdapter {
  private readonly toolAdapter: SzlToolAdapter;
  private readonly agentRegistry: Map<string, Agent<any>>;
  private readonly domain: string;
  private readonly enableGuardrails: boolean;

  constructor(options: SzlAgentAdapterOptions = {}) {
    this.toolAdapter = new SzlToolAdapter(options);
    this.agentRegistry = options.agentRegistry ?? new Map();
    this.domain = options.domain ?? 'general';
    this.enableGuardrails = options.enableGuardrails ?? true;
  }

  /**
   * Adapt a single AgentDefinition into an SDK Agent.
   */
  adapt(definition: AgentDefinitionLike): Agent {
    const tools = this.toolAdapter.adaptByIds(definition.tools);

    const handoffs = (definition.collaboratesWith ?? []).flatMap((collaboratorId) => {
      const collaborator = this.agentRegistry.get(collaboratorId);
      if (!collaborator) {
        console.warn(
          `[SzlAgentAdapter] Handoff target '${collaboratorId}' not found in agentRegistry. ` +
            `Register it before adapting '${definition.id}'.`,
        );
        return [];
      }
      return [collaborator];
    });

    const domain = definition.domain || this.domain;
    const inputGuardrails: InputGuardrail[] = this.enableGuardrails
      ? [this.buildInputGuardrail(definition.id, domain)]
      : [];
    const outputGuardrails: OutputGuardrail<any>[] = this.enableGuardrails
      ? [this.buildOutputGuardrail(definition.id, domain)]
      : [];

    const agent = new Agent({
      name: definition.name,
      instructions: definition.systemPrompt,
      tools,
      handoffs,
      model: this.resolveModel(definition),
      inputGuardrails,
      outputGuardrails,
    });

    this.agentRegistry.set(definition.id, agent);
    return agent;
  }

  /**
   * Adapt multiple definitions in dependency order.
   * Definitions without collaborators are adapted first so handoff targets
   * are available when definitions that reference them are processed.
   */
  adaptAll(definitions: AgentDefinitionLike[]): Map<string, Agent> {
    const sorted = topologicalSort(definitions);
    for (const def of sorted) {
      this.adapt(def);
    }
    return new Map(this.agentRegistry);
  }

  /**
   * Retrieve an already-adapted agent by its SZL agent ID.
   */
  get(agentId: string): Agent | undefined {
    return this.agentRegistry.get(agentId);
  }

  private buildInputGuardrail(agentId: string, domain: string): InputGuardrail {
    const guardrailAdapter = new SzlGuardrailAdapter({
      agentId,
      domain,
      action: 'chat-completion',
    });
    return {
      name: `szl-policy-input:${domain}`,
      execute: async (args) => {
        const text = typeof args.input === 'string' ? args.input : JSON.stringify(args.input);
        const result = await guardrailAdapter.checkInput(text);
        return {
          tripwireTriggered: !result.allowed,
          outputInfo: result,
        };
      },
    };
  }

  private buildOutputGuardrail(agentId: string, domain: string): OutputGuardrail<any> {
    const guardrailAdapter = new SzlGuardrailAdapter({
      agentId,
      domain,
      action: 'chat-completion',
    });
    return {
      name: `szl-policy-output:${domain}`,
      execute: async (args) => {
        const text =
          typeof args.agentOutput === 'string'
            ? args.agentOutput
            : JSON.stringify(args.agentOutput ?? '');
        const result = await guardrailAdapter.checkOutput(text);
        return {
          tripwireTriggered: !result.allowed,
          outputInfo: result,
        };
      },
    };
  }

  private resolveModel(definition: AgentDefinitionLike): string | undefined {
    const provider = definition.preferredProvider ?? 'openai';
    const model = definition.preferredModel;

    if (provider === 'openai' || provider === 'azure') {
      return model;
    }

    // Non-OpenAI providers (Anthropic, Gemini, etc.) are not natively supported
    // by the @openai/agents SDK. We pass the model name through so a custom
    // ModelProvider registered on the Runner can intercept and route to the correct
    // backend. Silently dropping the model to undefined would ignore the SZL
    // agent's provider preference entirely.
    if (model) {
      console.warn(
        `[SzlAgentAdapter] Agent '${definition.id}' prefers provider='${provider}' model='${model}'. ` +
          `The @openai/agents SDK routes to OpenAI by default. ` +
          `Register a custom ModelProvider on the Runner to route to '${provider}'. ` +
          `Passing model='${model}' through; behavior depends on ModelProvider configuration.`,
      );
      return model;
    }

    console.warn(
      `[SzlAgentAdapter] Agent '${definition.id}' prefers provider='${provider}' ` +
        `but no preferredModel is set. Falling back to the SDK's default model.`,
    );
    return undefined;
  }
}

function topologicalSort(definitions: AgentDefinitionLike[]): AgentDefinitionLike[] {
  const idSet = new Set(definitions.map((d) => d.id));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const def of definitions) {
    inDegree.set(def.id, 0);
    adjacency.set(def.id, []);
  }

  for (const def of definitions) {
    for (const dep of def.collaboratesWith ?? []) {
      if (idSet.has(dep)) {
        adjacency.get(dep)!.push(def.id);
        inDegree.set(def.id, (inDegree.get(def.id) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const result: AgentDefinitionLike[] = [];
  const defMap = new Map(definitions.map((d) => [d.id, d]));

  while (queue.length > 0) {
    const id = queue.shift()!;
    const def = defMap.get(id);
    if (def) result.push(def);
    for (const neighbor of adjacency.get(id) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (result.length < definitions.length) {
    const remaining = definitions.filter((d) => !result.find((r) => r.id === d.id));
    result.push(...remaining);
  }

  return result;
}
