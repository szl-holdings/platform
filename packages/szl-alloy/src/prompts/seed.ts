import { promptRegistry } from '@szl-holdings/prompt-registry';
import type { PromptKernel } from './types.js';
import {
  ambientCaptureRecapKernel,
  coldOutreachKernel,
  contactEnrichmentKernel,
  conversationalCrmKernel,
  deckFromBriefKernel,
  decisionIntelligenceKernel,
  deepAnalyticsKernel,
  docToActionKernel,
  executiveBriefingKernel,
  legalRiskExtractKernel,
  maritimeRiskBriefKernel,
  meetingToCrmUpdateKernel,
  researchAndCiteKernel,
  threatIntelBriefingKernel,
  videoStoryboardKernel,
  voiceToActionKernel,
} from './kernels/index.js';

const ALL_KERNELS: PromptKernel[] = [
  researchAndCiteKernel,
  ambientCaptureRecapKernel,
  voiceToActionKernel,
  contactEnrichmentKernel,
  deckFromBriefKernel,
  decisionIntelligenceKernel,
  deepAnalyticsKernel,
  conversationalCrmKernel,
  docToActionKernel,
  meetingToCrmUpdateKernel,
  threatIntelBriefingKernel,
  videoStoryboardKernel,
  legalRiskExtractKernel,
  coldOutreachKernel,
  maritimeRiskBriefKernel,
  executiveBriefingKernel,
];

let seeded = false;

export function seedKernels(): void {
  if (seeded) return;
  seeded = true;

  for (const kernel of ALL_KERNELS) {
    const registryId = `alloy.kernel.${kernel.id}`;
    if (promptRegistry.get(registryId)) continue;

    try {
      const def = promptRegistry.create({
        id: registryId,
        name: kernel.name,
        description: kernel.description,
        domain: kernel.domain,
        routeClass: `alloy-kernel:${kernel.pattern}`,
        template: kernel.template,
        systemPrompt: kernel.systemPrompt,
        variables: kernel.codex.inputSchema.map((f) => ({
          name: f.name,
          type: f.type as 'string' | 'number' | 'boolean' | 'array' | 'object',
          description: f.description,
          required: f.required ?? true,
          defaultValue: undefined,
        })),
        modelHints: {
          preferredProvider: kernel.modelHints.preferredProvider,
          preferredModel: kernel.modelHints.preferredModel,
          maxTokens: kernel.modelHints.maxTokens,
          temperature: kernel.modelHints.temperature,
          topP: kernel.modelHints.topP,
        },
        tags: [...kernel.tags, `kernel:${kernel.id}`, `version:${kernel.version}`],
        createdBy: 'alloy/prompts/seed',
      });

      const versionId = def.versions[0]?.versionId;
      if (versionId) {
        promptRegistry.promote(registryId, versionId);
      }
    } catch (_err) {
      // kernel already registered — skip
    }
  }
}

export function getAllKernels(): PromptKernel[] {
  return ALL_KERNELS;
}

export { ALL_KERNELS };
