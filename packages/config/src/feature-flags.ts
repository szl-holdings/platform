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

export type RuntimeMode = 'local-dev' | 'internal-preview' | 'demo' | 'production';

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
      "Show 'Synthesized (no AI provider)' label on Pulse briefings generated via fallback drift path.",
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
    description: 'Enable PDF export button in Pulse briefing reader.',
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
    description: 'Allow unauthenticated access to NEXUS mockup-sandbox preview.',
    enabledFor: [],
    notes:
      'Disabled by default. NEXUS is an internal prototype and should not be publicly accessible.',
  },
};

export function isFlagEnabled(flagId: string, runtimeMode: RuntimeMode): boolean {
  const flag = FEATURE_FLAGS[flagId];
  if (!flag) return false;
  return flag.enabledFor.includes(runtimeMode);
}
