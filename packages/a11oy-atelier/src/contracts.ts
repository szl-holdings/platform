import { z } from 'zod';

export const ATELIER_DISCLOSURE =
  'A11oy Atelier is an SZL Holdings product. Its Ayllu council, policy gates, retrieval, and receipts are operated by A11oy. Model inference for this response was provided by {provider} using {model}. Third-party provider names identify the configured inference service only; no affiliation or endorsement is implied.';

export const AtelierCapabilitiesSchema = z
  .object({
    tools: z.boolean().default(false),
    search: z.boolean().default(false),
    durableStorage: z.boolean().default(false),
    subagents: z.boolean().default(false),
  })
  .strict()
  .default({});

export const AtelierAskRequestSchema = z
  .object({
    prompt: z.string().trim().min(1).max(100_000),
    sessionId: z.string().trim().min(1).max(128).optional(),
    provider: z.enum(['auto', 'xai', 'grok-build']).default('auto'),
    model: z.string().trim().min(1).max(128).optional(),
    reasoningEffort: z.enum(['low', 'medium', 'high']).default('medium'),
    maxOutputTokens: z.number().int().min(1).max(16_384).default(2_048),
    capabilities: AtelierCapabilitiesSchema,
  })
  .strict();

export type AtelierAskRequest = z.infer<typeof AtelierAskRequestSchema>;
export type AtelierCapabilities = z.infer<typeof AtelierCapabilitiesSchema>;
export type AtelierProviderId = 'xai' | 'grok-build';

export interface AtelierUsage {
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

export interface AtelierProviderResult {
  text: string;
  provider: AtelierProviderId;
  providerLabel: string;
  model: string;
  providerRequestId?: string;
  usage: AtelierUsage;
  localOnly: boolean;
}

export interface AtelierReceipt {
  receiptId: string;
  traceId: string;
  sessionId: string;
  provider: AtelierProviderId;
  providerLabel: string;
  model: string;
  providerRequestId: string | null;
  promptSha256: string;
  responseSha256: string;
  policyEffect: 'allow' | 'audit_only';
  policyEvaluationId: string;
  evidenceState: 'OBSERVED';
  ledgerEntryId: string | null;
  ledgerState: 'PENDING_API_APPEND' | 'IN_PROCESS_APPEND_ACCEPTED';
  memoryState: 'PENDING_API_COMMIT' | 'COMMITTED_IN_PROCESS';
  localOnly: boolean;
  latencyMs: number;
  usage: AtelierUsage;
  generatedAt: string;
}

export interface AtelierAskResponse {
  answer: string;
  disclosure: string;
  receipt: AtelierReceipt;
}

export interface AtelierProviderHealth {
  provider: AtelierProviderId;
  model: string;
  configured: boolean;
  available: boolean;
  localOnly: boolean;
  evidenceState: 'OBSERVED' | 'UNAVAILABLE';
  reason: string;
}
