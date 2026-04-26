/**
 * Feature Flag Catalog
 *
 * Evaluated against { orgId, role, runtimeMode } context.
 * These flags control surface-level UI behavior and must not be confused
 * with Covenant Policies (which govern AI execution).
 *
 * Note: Flags here are evaluated at runtime using runtimeMode from the
 * env-contract. For server-side flag evaluation, use the api-server's
 * existing runtimeMode check. This catalog is the authoritative list of
 * all named flags in the system.
 */

import type { RuntimeMode } from './runtime-mode.js';

export interface FeatureFlag {
  id: string;
  description: string;
  enabledFor: RuntimeMode[];
  notes: string;
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  DEMO_BANNERS: {
    id: 'DEMO_BANNERS',
    description: 'Show DemoModeBanner on all views that display seeded or simulated data.',
    enabledFor: ['demo', 'internal-preview'],
    notes:
      'Must be visible in demo mode. Do not enable in production unless data is genuinely seeded.',
  },
  PULSE_FALLBACK_LABEL: {
    id: 'PULSE_FALLBACK_LABEL',
    description:
      "Show 'Synthesized (no AI provider)' label on LUMINA briefings generated via fallback drift path.",
    enabledFor: ['demo', 'internal-preview', 'local-dev'],
    notes: 'Required to prevent silent fallback impersonating live AI briefings.',
  },
  AEGIS_UNWIRED_MODULES: {
    id: 'AEGIS_UNWIRED_MODULES',
    description: 'Show 8 Aegis modules that are not yet wired to live API. Hidden by default.',
    enabledFor: ['local-dev'],
    notes: 'These modules are stubs. Do not show in investor demos or production.',
  },
  VESSELS_COMMERCIAL_MODULES: {
    id: 'VESSELS_COMMERCIAL_MODULES',
    description: 'Show Vessels commercial modules (insurance, trading, platform) not wired to DB.',
    enabledFor: ['local-dev'],
    notes: 'Stubs only. Do not show in demos until wired.',
  },
  DEMO_RESET_BUTTON: {
    id: 'DEMO_RESET_BUTTON',
    description: 'Show in-app one-click demo reset button in the platform operator UI.',
    enabledFor: ['demo', 'internal-preview'],
    notes: 'Enables presenter recovery without terminal access.',
  },
  PDF_EXPORT_PULSE: {
    id: 'PDF_EXPORT_PULSE',
    description: 'Enable PDF export button in LUMINA briefing reader.',
    enabledFor: [],
    notes: 'Not implemented. Flag gates the button until implementation is complete.',
  },
  PERSONA_SWITCHER: {
    id: 'PERSONA_SWITCHER',
    description: 'Show interactive persona switcher for investor demos.',
    enabledFor: ['demo'],
    notes: 'Demo mode only; shows role-based view switching.',
  },
  NEXUS_PUBLIC_ACCESS: {
    id: 'NEXUS_PUBLIC_ACCESS',
    description: 'Allow unauthenticated access to PRAXIS mockup-sandbox preview.',
    enabledFor: [],
    notes:
      'Disabled by default. PRAXIS is an internal prototype and should not be publicly accessible.',
  },
  SEPA_BACS_RAILS: {
    id: 'SEPA_BACS_RAILS',
    description: 'Enable SEPA (EU) and BACS (UK) international payment rails in billing.',
    enabledFor: ['production', 'pilot', 'demo', 'internal-preview', 'local-dev'],
    notes: 'Flows through Stripe. Requires mandate acceptance from customer.',
  },
  ESIGNATURE_INTEGRATION: {
    id: 'ESIGNATURE_INTEGRATION',
    description: 'Enable DocuSign e-signature integration in Counsel for contract signing.',
    enabledFor: ['production', 'pilot', 'demo', 'internal-preview', 'local-dev'],
    notes: 'Configure ESIGNATURE_PROVIDER env var: docusign | hellosign | internal.',
  },
  PUBLIC_API_V1: {
    id: 'PUBLIC_API_V1',
    description: 'Enable public developer API v1 with OpenAPI spec and API key management.',
    enabledFor: ['production', 'pilot', 'demo', 'internal-preview', 'local-dev'],
    notes: 'OpenAPI spec at /api/v1/openapi.json. SDK at @szl-holdings/sdk.',
  },
  OUTBOUND_WEBHOOKS: {
    id: 'OUTBOUND_WEBHOOKS',
    description: 'Enable outbound webhook subscriptions with retry logic and delivery logs.',
    enabledFor: ['production', 'pilot', 'demo', 'internal-preview', 'local-dev'],
    notes: 'Extends existing /api/webhooks surface with persistent endpoint storage.',
  },
  PLUGIN_ARCHITECTURE: {
    id: 'PLUGIN_ARCHITECTURE',
    description: 'Enable plugin/extension architecture for domain module registration.',
    enabledFor: ['production', 'pilot', 'internal-preview', 'local-dev'],
    notes: 'Requires governance:proof-chain and governance:autonomy capabilities. See @szl-holdings/plugin-host.',
  },
  BILLING_DISPUTES: {
    id: 'BILLING_DISPUTES',
    description: 'Enable chargeback and dispute management in billing admin.',
    enabledFor: ['production', 'pilot', 'demo', 'internal-preview', 'local-dev'],
    notes: 'Pulls dispute data from Stripe. Surfaces in admin billing with response workflow.',
  },
  STABLECOIN_TREASURY: {
    id: 'STABLECOIN_TREASURY',
    description: 'Enable stablecoin treasury visibility (USDC, USDT, DAI) alongside fiat.',
    enabledFor: ['production', 'pilot', 'demo', 'internal-preview', 'local-dev'],
    notes: 'Reads balances from Coinbase Commerce. Configure TREASURY_PROVIDER env var.',
  },
  COURT_FILING_AUTOMATION: {
    id: 'COURT_FILING_AUTOMATION',
    description: 'Enable electronic court filing adapter in Counsel.',
    enabledFor: ['production', 'pilot', 'demo', 'internal-preview', 'local-dev'],
    notes: 'Supports PACER, NYSCEF, CA eCourt, Tyler eFSP. Manual fallback for unsupported jurisdictions.',
  },
};

export function isFlagEnabled(flagId: string, runtimeMode: RuntimeMode): boolean {
  const flag = FEATURE_FLAGS[flagId];
  if (!flag) return false;
  return flag.enabledFor.includes(runtimeMode);
}
