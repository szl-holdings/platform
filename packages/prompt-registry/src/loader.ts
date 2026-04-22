import { type PromptDefinition, type PromptVersion, promptRegistry } from './registry.js';

export interface PromptLookupResult {
  prompt: PromptDefinition;
  version: PromptVersion;
  rendered: string;
}

export function loadActivePrompt(
  id: string,
  variables: Record<string, unknown> = {},
): PromptLookupResult {
  const prompt = promptRegistry.get(id);
  if (!prompt) throw new Error(`Prompt '${id}' not found`);

  const version = promptRegistry.getActiveVersion(id);
  if (!version) throw new Error(`Prompt '${id}' has no active version — promote a version first`);

  const rendered = renderTemplate(version.template, variables);
  return { prompt, version, rendered };
}

export function loadPromptVersion(
  id: string,
  versionId: string,
  variables: Record<string, unknown> = {},
): PromptLookupResult {
  const prompt = promptRegistry.get(id);
  if (!prompt) throw new Error(`Prompt '${id}' not found`);

  const version = promptRegistry.getVersion(id, versionId);
  if (!version) throw new Error(`Version '${versionId}' not found for prompt '${id}'`);

  const rendered = renderTemplate(version.template, variables);
  return { prompt, version, rendered };
}

function renderTemplate(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = variables[key];
    if (value === undefined) return `{{${key}}}`;
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });
}

export { renderTemplate };
