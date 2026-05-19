/**
 * Environment Contract
 *
 * Authoritative specification of all environment variables used across
 * the platform. Replaces ad-hoc env reads with a typed, documented contract.
 *
 * Each variable is classified as:
 *   "required"    — platform will not start without this
 *   "recommended" — missing degrades a feature or increases risk
 *   "optional"    — activates specific integrations when set
 *   "deprecated"  — do not use; will be removed
 *
 * The source of truth for validation logic is:
 * artifacts/api-server/src/lib/startup-validation.ts
 *
 * This file is for documentation, type safety, and cross-package reference.
 */

export type EnvVarClassification = 'required' | 'recommended' | 'optional' | 'deprecated';

export interface EnvVarSpec {
  key: string;
  classification: EnvVarClassification;
  description: string;
  example?: string;
  risksIfMissing: string;
}

export const ENV_CONTRACT: EnvVarSpec[] = [
  // Core infrastructure
  {
    key: 'DATABASE_URL',
    classification: 'required',
    description: 'PostgreSQL connection string.',
    example: 'postgresql://user:pass@host:5432/szl',
    risksIfMissing: 'Platform will not start.',
  },
  {
    key: 'SESSION_SECRET',
    classification: 'required',
    description: 'Secret used for session encryption. Minimum 32 characters.',
    risksIfMissing: 'Sessions cannot be encrypted; security failure.',
  },
  {
    key: 'RUNTIME_MODE',
    classification: 'required',
    description:
      'Controls system behavior. Values: local-dev | internal-preview | demo | production.',
    example: 'demo',
    risksIfMissing: 'Platform defaults to most permissive mode; production risk.',
  },
  {
    key: 'NODE_ENV',
    classification: 'required',
    description: 'Standard Node environment: development | production | test.',
    example: 'production',
    risksIfMissing: 'Many libraries default to development mode, exposing debug output.',
  },

  // AI providers (via Replit proxy)
  {
    key: 'AI_INTEGRATIONS_OPENAI_API_KEY',
    classification: 'recommended',
    description: 'OpenAI API key via Replit AI Integrations proxy.',
    risksIfMissing:
      'Pulse briefings fall back to synthetic drift mode. AI triage/plan/retrieve endpoints degrade.',
  },
  {
    key: 'AI_INTEGRATIONS_ANTHROPIC_API_KEY',
    classification: 'optional',
    description: 'Anthropic Claude key via Replit AI Integrations proxy.',
    risksIfMissing: 'Claude provider unavailable; falls back to OpenAI or Gemini.',
  },
  {
    key: 'AI_INTEGRATIONS_GEMINI_API_KEY',
    classification: 'optional',
    description: 'Google Gemini key via Replit AI Integrations proxy.',
    risksIfMissing: 'Gemini provider unavailable.',
  },

  // Authentication
  {
    key: 'AUTH_PROVIDER_KEY',
    classification: 'required',
    description: 'OIDC client secret for Replit Auth.',
    risksIfMissing: 'Authentication fails for all users.',
  },
  {
    key: 'CONTINUUM_INTERNAL_TOKEN',
    classification: 'required',
    description: 'Privileged agent access token for M2M communication. Minimum 32 characters.',
    risksIfMissing: 'Agent-to-agent calls fail; Counsel execution fabric is broken.',
  },
  {
    key: 'CONNECTOR_ENCRYPTION_KEY',
    classification: 'required',
    description: 'AES-256-GCM hex key (64 chars) for credential storage.',
    risksIfMissing: 'Third-party connector credentials cannot be encrypted.',
  },
  {
    key: 'SERVICE_ROLE_KEY',
    classification: 'required',
    description: 'Admin bypass for machine-to-machine communication.',
    risksIfMissing: 'Admin operations and provisioning fail.',
  },

  // Maps
  {
    key: 'MAPBOX_TOKEN',
    classification: 'recommended',
    description: 'Mapbox API token for DOMAINE map views.',
    risksIfMissing: 'All DOMAINE map views render blank. Demo-killer for DOMAINE presentations.',
  },

  // Monitoring
  {
    key: 'SENTRY_DSN',
    classification: 'recommended',
    description: 'Sentry Data Source Name for error telemetry.',
    risksIfMissing: 'No error reporting; production errors go undetected.',
  },

  // Demo mode
  {
    key: 'DEMO_MODE',
    classification: 'optional',
    description: "If 'true', mocks external services and disables destructive operations.",
    risksIfMissing: 'Normal behavior; only set in demo environments.',
  },
  {
    key: 'ENABLE_DEMO_SEED',
    classification: 'optional',
    description: "If 'true', seeds demo data on startup. MUST NOT be set in production.",
    example: 'true',
    risksIfMissing: 'Demo data not seeded automatically.',
  },

  // Mobile
  {
    key: 'EXPO_ACCESS_TOKEN',
    classification: 'optional',
    description: 'Expo push notification access token.',
    risksIfMissing: 'Mobile push notifications will not work.',
  },

  // Analytics
  {
    key: 'POSTHOG_API_KEY',
    classification: 'recommended',
    description: 'PostHog project API key for conversion event tracking.',
    risksIfMissing: 'No analytics; conversion data is not captured.',
  },

  // Storage
  {
    key: 'DEFAULT_OBJECT_STORAGE_BUCKET_ID',
    classification: 'optional',
    description: 'Replit-provisioned GCS bucket for object storage.',
    risksIfMissing: 'File upload and object storage features unavailable.',
  },

  // Sovereign Substrate — HuggingFace Buckets
  {
    key: 'HF_TOKEN',
    classification: 'optional',
    description:
      'HuggingFace API token used by Sovereign Substrate to push FORGE artifacts ' +
      'and Proof Packets to the betterwithage buckets. Read+write scope on the ' +
      'three forge-* buckets is required.',
    risksIfMissing:
      'Sovereign Substrate uploads disabled — FORGE artifacts will not be published ' +
      'to HF; the /sovereign catalog will only show pre-existing records.',
  },
  {
    key: 'HF_BUCKET_MODELS',
    classification: 'optional',
    description: 'HF bucket name (private) for FORGE fine-tuned model weights. Default: forge-models',
    example: 'forge-models',
    risksIfMissing: 'Fine-tuned model artifacts cannot be persisted to HF.',
  },
  {
    key: 'HF_BUCKET_DATASETS',
    classification: 'optional',
    description: 'HF bucket name (private) for training and eval datasets. Default: forge-datasets',
    example: 'forge-datasets',
    risksIfMissing: 'Training datasets cannot be persisted to HF.',
  },
  {
    key: 'HF_BUCKET_PUBLIC',
    classification: 'optional',
    description:
      'HF bucket name (public) for published Sovereign artifacts with open licenses. ' +
      'Default: forge-public. CDN pre-warming should be enabled on this bucket.',
    example: 'forge-public',
    risksIfMissing: 'Publicly-released artifacts cannot be persisted to HF.',
  },
  {
    key: 'SOVEREIGN_SIGNING_KEY_ID',
    classification: 'optional',
    description: 'Opaque key id (e.g. "sovereign-2026-05") embedded in every Proof Packet.',
    risksIfMissing: 'Proof Packet signing disabled.',
  },
  {
    key: 'SOVEREIGN_SIGNING_KEY_HEX',
    classification: 'optional',
    description:
      'Ed25519 signing seed (32 bytes, hex-encoded) used to sign Proof Packets. ' +
      'The public key derived from it is published at /api/sovereign/public-key ' +
      'for third-party verification.',
    risksIfMissing: 'Proof Packets cannot be signed; artifacts will publish unsigned.',
  },
  {
    key: 'SOVEREIGN_PUBLISH_TOKEN',
    classification: 'optional',
    description:
      'Bearer token required on POST /api/sovereign/publish. Must be at ' +
      'least 16 chars. If unset, the publish endpoint is disabled (401) and ' +
      'only FORGE pipelines configured with the matching token can register ' +
      'new artifacts.',
    risksIfMissing: 'Sovereign publish endpoint disabled; only read paths remain.',
  },
  {
    key: 'SOVEREIGN_HF_ORG',
    classification: 'optional',
    description: 'HuggingFace org that owns the forge-* buckets. Default: betterwithage',
    example: 'betterwithage',
    risksIfMissing: 'Sovereign uploads cannot resolve the target org.',
  },

  // Deprecated
  {
    key: 'FIREBASE_API_KEY',
    classification: 'deprecated',
    description:
      'Not used. Platform does not use Firebase. Remove from any environment that has it set.',
    risksIfMissing: 'No risk; this variable has no effect.',
  },
];

export function getRequiredVars(): EnvVarSpec[] {
  return ENV_CONTRACT.filter((v) => v.classification === 'required');
}

export function getRecommendedVars(): EnvVarSpec[] {
  return ENV_CONTRACT.filter((v) => v.classification === 'recommended');
}

export function getDeprecatedVars(): EnvVarSpec[] {
  return ENV_CONTRACT.filter((v) => v.classification === 'deprecated');
}
