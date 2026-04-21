import {
  promptRegistry as baseRegistry,
  loadActivePrompt,
  loadPromptVersion,
  type PromptDefinition,
  type PromptVariable,
  type PromptVersion,
  renderTemplate,
} from '@szl-holdings/prompt-registry';
import type { PromptRef } from './ref.js';
import { PromptRefResolutionError } from './ref.js';

export type { PromptDefinition, PromptVariable, PromptVersion };

export interface ResolvedPrompt {
  promptId: string;
  versionId: string;
  version: number;
  rendered: string;
  systemPrompt?: string;
  modelHints: PromptVersion['modelHints'];
}

export function resolvePrompt(
  promptRef: PromptRef,
  variables: Record<string, unknown> = {},
): ResolvedPrompt {
  const { id, versionConstraint } = promptRef;

  try {
    if (!versionConstraint || versionConstraint === 'active' || versionConstraint === 'latest') {
      const result = loadActivePrompt(id, variables);
      return {
        promptId: id,
        versionId: result.version.versionId,
        version: result.version.version,
        rendered: result.rendered,
        systemPrompt: result.version.systemPrompt,
        modelHints: result.version.modelHints,
      };
    }

    const versionId = versionConstraint.startsWith('v')
      ? `${id}@${versionConstraint}`
      : versionConstraint;

    const result = loadPromptVersion(id, versionId, variables);
    return {
      promptId: id,
      versionId: result.version.versionId,
      version: result.version.version,
      rendered: result.rendered,
      systemPrompt: result.version.systemPrompt,
      modelHints: result.version.modelHints,
    };
  } catch (err) {
    throw new PromptRefResolutionError(id, err instanceof Error ? err.message : String(err));
  }
}

export function getPromptDefinition(id: string): PromptDefinition | undefined {
  return baseRegistry.get(id);
}

export function listPrompts(filter?: { domain?: string; status?: string }): PromptDefinition[] {
  const all = baseRegistry.list();
  let result = all;
  if (filter?.domain) {
    result = result.filter((p: PromptDefinition) => p.domain === filter.domain);
  }
  if (filter?.status) {
    result = result.filter((p: PromptDefinition) =>
      p.versions.some((v: PromptVersion) => v.status === filter.status),
    );
  }
  return result;
}

export function registerPrompt(params: {
  id: string;
  name: string;
  description: string;
  domain: string;
  routeClass: string;
  template: string;
  systemPrompt?: string;
  variables?: PromptVariable[];
  modelHints?: PromptVersion['modelHints'];
  tags?: string[];
  createdBy?: string;
}): PromptDefinition {
  return baseRegistry.create(params);
}

export function promotePromptVersion(promptId: string, versionId: string): void {
  baseRegistry.promote(promptId, versionId);
}

export { renderTemplate };
