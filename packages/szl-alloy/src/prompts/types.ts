import { z } from 'zod';

export const EvidenceRequirementSchema = z.object({
  kind: z.enum(['citation', 'document', 'metric', 'signal', 'attestation', 'memory']),
  label: z.string(),
  required: z.boolean().default(true),
  minCount: z.number().int().min(0).default(1),
  description: z.string(),
});
export type EvidenceRequirement = z.infer<typeof EvidenceRequirementSchema>;

export const RefusalPolicySchema = z.object({
  triggers: z.array(z.string()),
  escalationTarget: z.string().optional(),
  refusalMessage: z.string(),
  logLevel: z.enum(['info', 'warn', 'error']).default('warn'),
});
export type RefusalPolicy = z.infer<typeof RefusalPolicySchema>;

export const RubricCriterionSchema = z.object({
  id: z.string(),
  label: z.string(),
  weight: z.number().min(0).max(1),
  passingThreshold: z.number().min(0).max(1).default(0.6),
  description: z.string(),
  keywords: z.array(z.string()).default([]),
});
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;

export const FewShotExampleSchema = z.object({
  id: z.string(),
  description: z.string(),
  input: z.record(z.unknown()),
  output: z.string(),
  notes: z.string().optional(),
});
export type FewShotExample = z.infer<typeof FewShotExampleSchema>;

export const ModelHintsSchema = z.object({
  preferredProvider: z.string().optional(),
  preferredModel: z.string().optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  responseFormat: z.enum(['text', 'json', 'markdown']).default('markdown'),
});
export type ModelHints = z.infer<typeof ModelHintsSchema>;

export const InputFieldSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  description: z.string(),
  required: z.boolean().default(true),
  example: z.unknown().optional(),
});
export type InputField = z.infer<typeof InputFieldSchema>;

export const OutputFieldSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  description: z.string(),
  example: z.unknown().optional(),
});
export type OutputField = z.infer<typeof OutputFieldSchema>;

export const CodexPayloadSchema = z.object({
  role: z.string().describe('The system-level role/persona the model should adopt'),
  contract: z.string().describe('What the kernel promises to produce and under what constraints'),
  inputSchema: z.array(InputFieldSchema).describe('Declared input fields and their types'),
  outputSchema: z.array(OutputFieldSchema).describe('Expected output fields and their types'),
  evidenceRequirements: z
    .array(EvidenceRequirementSchema)
    .describe('Evidence that must be surfaced or cited in the output'),
  refusalPolicy: RefusalPolicySchema.describe('When and how to refuse or escalate'),
  evaluationRubric: z
    .array(RubricCriterionSchema)
    .describe('Criteria for automated quality evaluation'),
  examples: z.array(FewShotExampleSchema).describe('Few-shot input/output examples'),
});
export type CodexPayload = z.infer<typeof CodexPayloadSchema>;

export const PromptKernelSchema = z.object({
  id: z.string().describe('Unique stable identifier, e.g. "research-and-cite"'),
  version: z.string().describe('Semver string, e.g. "1.0.0"'),
  name: z.string().describe('Human-readable display name'),
  description: z.string().describe('One-sentence description of the kernel purpose'),
  pattern: z
    .string()
    .describe('Innovation pattern this kernel embodies, e.g. "research-and-cite"'),
  domain: z.string().describe('Primary domain tag, e.g. "intelligence", "legal", "crm"'),
  verticals: z.array(z.string()).describe('SZL vertical IDs this kernel is recommended for'),
  template: z.string().describe('The prompt template with {{variable}} placeholders'),
  systemPrompt: z.string().describe('System prompt to prepend'),
  modelHints: ModelHintsSchema,
  codex: CodexPayloadSchema,
  registryVersionId: z.string().optional().describe('Set after registration with prompt-registry'),
  inspirations: z
    .array(z.string())
    .default([])
    .describe('Source tools that inspired this kernel, e.g. ["Perplexity", "Claude Cowork"]'),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
});
export type PromptKernel = z.infer<typeof PromptKernelSchema>;

export interface KernelFilter {
  domain?: string;
  pattern?: string;
  vertical?: string;
  tags?: string[];
}

export interface RenderResult {
  kernelId: string;
  version: string;
  rendered: string;
  systemPrompt: string;
  modelHints: ModelHints;
  codex: CodexPayload;
}
