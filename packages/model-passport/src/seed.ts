/**
 * Seed Passports — bootstrap model registry entries for known platform models.
 *
 * Each seed passport is signed with an ephemeral Ed25519 bootstrap keypair
 * generated once per process at module-load time. The public key is embedded
 * in `signerPublicKey`, so `verifyPassportSignature` succeeds for seed entries
 * even though no external HSM is involved. Seeds are intended to represent the
 * platform's own allow-listed models; they should be promoted to real
 * operator-signed passports before production governance requires them.
 *
 * The bootstrap keypair is intentionally ephemeral — it is NOT persisted.
 * If the seeded rows are re-loaded from the DB they carry the public key that
 * was current when they were written, so verification still passes on any
 * subsequent process start that reads the stored JSONB.
 */
import { generateKeyPairSync } from 'node:crypto';
import type { ModelPassport, SignedModelPassport } from './types.js';
import { generatePassportId, signPassport } from './crypto.js';

// ── Bootstrap signing key ────────────────────────────────────────────────────
// Generated once per module load. All seed passports in this process are
// signed with this key so they pass `verifyPassportSignature` at runtime.
const { privateKey: BOOTSTRAP_PRIVATE_KEY, publicKey: BOOTSTRAP_PUBLIC_KEY } =
  generateKeyPairSync('ed25519', { publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });

function makeSigned(passport: ModelPassport): SignedModelPassport {
  return signPassport(passport, BOOTSTRAP_PRIVATE_KEY, BOOTSTRAP_PUBLIC_KEY);
}

export function getBootstrapPublicKey(): string {
  return BOOTSTRAP_PUBLIC_KEY;
}

const SEED_PASSPORTS: SignedModelPassport[] = [
  makeSigned({
    schemaVersion: '1.0',
    identity: {
      id: generatePassportId('openai', 'gpt-4o', 'hosted'),
      displayName: 'GPT-4o — Standard Hosted',
      version: '1.0.0',
      provider: 'openai',
      providerModelId: 'gpt-4o',
      createdAt: new Date().toISOString(),
    },
    quantProfile: { tier: 'hosted', contextWindow: 128000, modality: ['text', 'vision'] },
    capabilitySurface: {
      lanes: ['reasoning', 'planning', 'tool_calling', 'extraction', 'summarization'],
      skills: ['function-calling', 'structured-output', 'code-analysis'],
      supportedTools: ['web_search', 'code_interpreter'],
    },
    costProfile: { costPer1kTokensUsd: 0.005, p50LatencyMs: 800, p95LatencyMs: 2500, evalPassRate: 0.92 },
    policyEnvelope: {
      autonomyTier: 'supervised',
      allowedDomains: ['*'],
      piiHandling: 'redacted',
      escalationRules: ['require_approval_for_external_transfer'],
      jurisdictions: ['US', 'EU'],
    },
    approvals: { signers: [], requiredSigners: 1 },
    provenance: { sourceRegistryHash: 'bootstrap-seed', promptRegistryPins: [] },
    downgradeTo: [{ passportId: generatePassportId('openai', 'gpt-4o-mini', 'hosted'), displayName: 'GPT-4o Mini — Economy', reason: 'budget_exceeded' }],
    state: 'active',
  }),

  makeSigned({
    schemaVersion: '1.0',
    identity: {
      id: generatePassportId('openai', 'gpt-4o-mini', 'hosted'),
      displayName: 'GPT-4o Mini — Economy',
      version: '1.0.0',
      provider: 'openai',
      providerModelId: 'gpt-4o-mini',
      createdAt: new Date().toISOString(),
    },
    quantProfile: { tier: 'hosted', contextWindow: 128000, modality: ['text'] },
    capabilitySurface: {
      lanes: ['classification', 'triage', 'extraction', 'summarization', 'background_batch'],
      skills: ['structured-output'],
      supportedTools: [],
    },
    costProfile: { costPer1kTokensUsd: 0.00015, p50LatencyMs: 300, p95LatencyMs: 1000, evalPassRate: 0.85 },
    policyEnvelope: {
      autonomyTier: 'advisory',
      allowedDomains: ['*'],
      piiHandling: 'redacted',
      escalationRules: [],
      jurisdictions: ['US', 'EU'],
    },
    approvals: { signers: [], requiredSigners: 1 },
    provenance: { sourceRegistryHash: 'bootstrap-seed', promptRegistryPins: [] },
    downgradeTo: [{ passportId: generatePassportId('huggingface', 'Qwen/Qwen3-0.6B', 'hosted'), displayName: 'Qwen3-0.6B — Local Fallback', reason: 'cost_exceeded' }],
    state: 'active',
  }),

  makeSigned({
    schemaVersion: '1.0',
    identity: {
      id: generatePassportId('anthropic', 'claude-sonnet-4-6', 'hosted'),
      displayName: 'Claude Sonnet 4.6 — Standard',
      version: '1.0.0',
      provider: 'anthropic',
      providerModelId: 'claude-sonnet-4-6',
      createdAt: new Date().toISOString(),
    },
    quantProfile: { tier: 'hosted', contextWindow: 200000, modality: ['text'] },
    capabilitySurface: {
      lanes: ['reasoning', 'planning', 'extraction', 'summarization'],
      skills: ['long-context', 'function-calling', 'structured-output'],
      supportedTools: ['web_search'],
    },
    costProfile: { costPer1kTokensUsd: 0.003, p50LatencyMs: 1000, p95LatencyMs: 3000, evalPassRate: 0.94 },
    policyEnvelope: {
      autonomyTier: 'supervised',
      allowedDomains: ['*'],
      piiHandling: 'redacted',
      escalationRules: ['require_approval_for_external_transfer'],
      jurisdictions: ['US', 'EU'],
    },
    approvals: { signers: [], requiredSigners: 1 },
    provenance: { sourceRegistryHash: 'bootstrap-seed', promptRegistryPins: [] },
    downgradeTo: [{ passportId: generatePassportId('openai', 'gpt-4o-mini', 'hosted'), displayName: 'GPT-4o Mini — Economy', reason: 'provider_fallback' }],
    state: 'active',
  }),

  makeSigned({
    schemaVersion: '1.0',
    identity: {
      id: generatePassportId('huggingface', 'Qwen/Qwen3-8B', 'hosted'),
      displayName: 'Qwen3-8B — HuggingFace Hosted',
      version: '1.0.0',
      provider: 'huggingface',
      providerModelId: 'Qwen/Qwen3-8B',
      createdAt: new Date().toISOString(),
    },
    quantProfile: { tier: 'hosted', contextWindow: 32768, modality: ['text'] },
    capabilitySurface: {
      lanes: ['triage', 'classification', 'extraction', 'summarization'],
      skills: ['multilingual'],
      supportedTools: [],
    },
    costProfile: { costPer1kTokensUsd: 0.0002, p50LatencyMs: 500, p95LatencyMs: 1500, evalPassRate: 0.80 },
    policyEnvelope: {
      autonomyTier: 'advisory',
      allowedDomains: ['*'],
      piiHandling: 'redacted',
      escalationRules: [],
      jurisdictions: ['US', 'EU', 'APAC'],
    },
    approvals: { signers: [], requiredSigners: 1 },
    provenance: { sourceRegistryHash: 'bootstrap-seed', promptRegistryPins: [] },
    downgradeTo: [{ passportId: generatePassportId('huggingface', 'Qwen/Qwen3-0.6B', 'hosted'), displayName: 'Qwen3-0.6B — Local Fallback', reason: 'cost_exceeded' }],
    state: 'active',
  }),

  makeSigned({
    schemaVersion: '1.0',
    identity: {
      id: generatePassportId('huggingface', 'Qwen/Qwen3-0.6B', 'hosted'),
      displayName: 'Qwen3-0.6B — Local Fallback',
      version: '1.0.0',
      provider: 'huggingface',
      providerModelId: 'Qwen/Qwen3-0.6B',
      createdAt: new Date().toISOString(),
    },
    quantProfile: { tier: 'hosted', contextWindow: 32768, modality: ['text'] },
    capabilitySurface: {
      lanes: ['classification', 'background_batch'],
      skills: [],
      supportedTools: [],
    },
    costProfile: { costPer1kTokensUsd: 0.00005, p50LatencyMs: 150, p95LatencyMs: 500, evalPassRate: 0.72 },
    policyEnvelope: {
      autonomyTier: 'read_only',
      allowedDomains: ['*'],
      piiHandling: 'redacted',
      escalationRules: [],
      jurisdictions: ['US', 'EU', 'APAC'],
    },
    approvals: { signers: [], requiredSigners: 1 },
    provenance: { sourceRegistryHash: 'bootstrap-seed', promptRegistryPins: [] },
    downgradeTo: [],
    state: 'active',
  }),

  makeSigned({
    schemaVersion: '1.0',
    identity: {
      id: generatePassportId('huggingface', 'Qwen/Qwen2.5-VL-7B-Instruct', 'hosted'),
      displayName: 'Qwen2.5-VL-7B — Vision Understanding',
      version: '1.0.0',
      provider: 'huggingface',
      providerModelId: 'Qwen/Qwen2.5-VL-7B-Instruct',
      createdAt: new Date().toISOString(),
    },
    quantProfile: { tier: 'hosted', contextWindow: 32768, modality: ['text', 'vision'] },
    capabilitySurface: {
      lanes: ['vision_understanding'],
      skills: ['image-analysis', 'ocr', 'chart-understanding'],
      supportedTools: [],
    },
    costProfile: { costPer1kTokensUsd: 0.0002, p50LatencyMs: 600, p95LatencyMs: 2000, evalPassRate: 0.83 },
    policyEnvelope: {
      autonomyTier: 'advisory',
      allowedDomains: ['*'],
      piiHandling: 'redacted',
      escalationRules: [],
      jurisdictions: ['US', 'EU'],
    },
    approvals: { signers: [], requiredSigners: 1 },
    provenance: { sourceRegistryHash: 'bootstrap-seed', promptRegistryPins: [] },
    downgradeTo: [],
    state: 'active',
  }),
];

export function getSeedPassports(): SignedModelPassport[] {
  return SEED_PASSPORTS;
}

export function getSeedPassportById(id: string): SignedModelPassport | undefined {
  return SEED_PASSPORTS.find((p) => p.passport.identity.id === id);
}
