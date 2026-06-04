import { promptEvaluator, promptRegistry, renderTemplate } from '@szl-holdings/prompt-registry';
import { ALL_KERNELS, seedKernels } from './seed.js';
import type { KernelFilter, PromptKernel, RenderResult } from './types.js';

export type { CodexPayload, KernelFilter, ModelHints, PromptKernel, RenderResult } from './types.js';
export { promptEvaluator, promptRegistry };

function ensureSeeded(): void {
  seedKernels();
}

function toRegistryId(id: string): string {
  return `alloy.kernel.${id}`;
}

function semverToRegistryVersionId(kernelId: string, semver: string): string {
  const major = parseInt(semver.split('.')[0] ?? '1', 10);
  return `${toRegistryId(kernelId)}@v${major}`;
}

export function getKernel(id: string, version?: string): PromptKernel {
  ensureSeeded();

  const kernel = ALL_KERNELS.find((k) => k.id === id);
  if (!kernel) {
    throw new Error(
      `[alloy/prompts] Kernel '${id}' not found. Available kernels: ${ALL_KERNELS.map((k) => k.id).join(', ')}`,
    );
  }

  const regId = toRegistryId(id);

  if (version) {
    const versionId = semverToRegistryVersionId(id, version);
    const regVersion = promptRegistry.getVersion(regId, versionId);
    if (!regVersion) {
      throw new Error(
        `[alloy/prompts] Kernel '${id}' version '${version}' (registry versionId '${versionId}') not found`,
      );
    }
    return {
      ...kernel,
      template: regVersion.template,
      systemPrompt: regVersion.systemPrompt ?? kernel.systemPrompt,
      modelHints: { ...kernel.modelHints, ...regVersion.modelHints },
    };
  }

  const activeVersion = promptRegistry.getActiveVersion(regId);
  if (!activeVersion) {
    throw new Error(
      `[alloy/prompts] Kernel '${id}' has no active version in the prompt registry. Ensure seedKernels() has been called.`,
    );
  }

  return {
    ...kernel,
    template: activeVersion.template,
    systemPrompt: activeVersion.systemPrompt ?? kernel.systemPrompt,
    modelHints: { ...kernel.modelHints, ...activeVersion.modelHints },
  };
}

export function listKernels(filter?: KernelFilter): PromptKernel[] {
  ensureSeeded();

  const activeIds = new Set(
    promptRegistry
      .list()
      .filter(
        (def) =>
          def.routeClass.startsWith('alloy-kernel:') &&
          def.activeVersionId !== null,
      )
      .map((def) => def.id.replace('alloy.kernel.', '')),
  );

  let results = ALL_KERNELS.filter((k) => activeIds.has(k.id));

  if (filter?.domain) {
    results = results.filter((k) => k.domain === filter.domain);
  }
  if (filter?.pattern) {
    results = results.filter((k) => k.pattern === filter.pattern);
  }
  if (filter?.vertical) {
    results = results.filter((k) => k.verticals.includes(filter.vertical!));
  }
  if (filter?.tags && filter.tags.length > 0) {
    results = results.filter((k) => filter.tags!.some((t) => k.tags.includes(t)));
  }

  return results;
}

export function renderKernel(id: string, vars: Record<string, unknown>): RenderResult {
  const kernel = getKernel(id);

  const missingRequired = kernel.codex.inputSchema
    .filter((f) => f.required && !(f.name in vars))
    .map((f) => f.name);

  if (missingRequired.length > 0) {
    throw new Error(
      `[alloy/prompts] Kernel '${id}' is missing required variables: ${missingRequired.join(', ')}`,
    );
  }

  const rendered = renderTemplate(kernel.template, vars);

  return {
    kernelId: kernel.id,
    version: kernel.version,
    rendered,
    systemPrompt: kernel.systemPrompt,
    modelHints: kernel.modelHints,
    codex: kernel.codex,
  };
}

export function getKernelsForVertical(verticalId: string): PromptKernel[] {
  return listKernels({ vertical: verticalId });
}

export function getKernelsByPattern(pattern: string): PromptKernel[] {
  return listKernels({ pattern });
}

export { seedKernels };

export * from './kernels/index.js';
