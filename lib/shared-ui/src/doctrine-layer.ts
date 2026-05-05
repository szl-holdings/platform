import type { DoctrineLayer } from '@szl-holdings/observability';

export type {
  DoctrineContextModel,
  DoctrineLayer,
  ExplainabilityModel,
  NormalizedEvent,
} from '@szl-holdings/observability';

export interface DoctrineLayerConfig {
  appId: string;
  appName: string;
  displayName?: string;
  layers: DoctrineLayer[];
  description: string;
  primaryRole: string;
}

export const DOCTRINE_LAYER_COLORS: Record<
  DoctrineLayer,
  { color: string; bg: string; border: string }
> = {
  OBSERVE: {
    color: 'hsl(200, 85%, 55%)',
    bg: 'hsla(200, 85%, 55%, 0.12)',
    border: 'hsla(200, 85%, 55%, 0.30)',
  },
  UNDERSTAND: {
    color: 'hsl(270, 70%, 62%)',
    bg: 'hsla(270, 70%, 62%, 0.12)',
    border: 'hsla(270, 70%, 62%, 0.30)',
  },
  DECIDE: {
    color: 'hsl(38, 90%, 55%)',
    bg: 'hsla(38, 90%, 55%, 0.12)',
    border: 'hsla(38, 90%, 55%, 0.30)',
  },
  EXECUTE: {
    color: 'hsl(152, 65%, 48%)',
    bg: 'hsla(152, 65%, 48%, 0.12)',
    border: 'hsla(152, 65%, 48%, 0.30)',
  },
  TRUST: {
    color: 'hsl(24, 60%, 56%)',
    bg: 'hsla(24, 60%, 56%, 0.12)',
    border: 'hsla(24, 60%, 56%, 0.30)',
  },
  SIGNAL: {
    color: 'hsl(264, 56%, 60%)',
    bg: 'hsla(264, 56%, 60%, 0.12)',
    border: 'hsla(264, 56%, 60%, 0.30)',
  },
};

export const DOCTRINE_LAYER_DESCRIPTIONS: Record<DoctrineLayer, string> = {
  OBSERVE: 'Collects and surfaces data, telemetry, and signals from the operational environment.',
  UNDERSTAND:
    'Synthesizes observations into insight — pattern recognition, prediction, and context modeling.',
  DECIDE:
    'Translates understanding into recommended or automated actions — routing, approvals, escalation.',
  EXECUTE: 'Carries out decisions — automations, connectors, workflows, and delivery.',
  TRUST:
    'Premium client delivery and relationship intelligence — the highest-confidence output layer.',
  SIGNAL: 'Founder identity and thought leadership — personal intelligence and brand signal.',
};

export const DOCTRINE_APP_MAP: DoctrineLayerConfig[] = [
  {
    appId: 'szl-holdings',
    appName: 'A11oy',
    displayName: 'A11oy — Brand Orchestration Layer',
    layers: ['OBSERVE', 'UNDERSTAND', 'DECIDE', 'EXECUTE'],
    description:
      'Governed Decision Operating System — the unified intelligence and orchestration layer across all SZL domain products.',
    primaryRole: 'Ecosystem Intelligence Layer',
  },
  {
    appId: 'sentra',
    appName: 'Sentra',
    displayName: 'Sentra — Cyber Resilience Command',
    layers: ['OBSERVE', 'UNDERSTAND', 'DECIDE'],
    description:
      'Cyber resilience command — threat intelligence, incident response, remediation automation, and constitutional AI governance.',
    primaryRole: 'Cyber Resilience Command',
  },
  {
    appId: 'conduit',
    appName: 'Conduit',
    displayName: 'Conduit — Reverse ETL',
    layers: ['EXECUTE'],
    description:
      'Reverse ETL platform — syncs warehouse data to any SaaS destination with governed orchestration and audit trails.',
    primaryRole: 'Reverse ETL & Data Activation',
  },
  {
    appId: 'vessels',
    appName: 'Vessels',
    displayName: 'Vessels — Maritime Intelligence',
    layers: ['OBSERVE'],
    description:
      'Maritime command intelligence — fleet visibility, voyage economics, AIS tracking, and operational exceptions.',
    primaryRole: 'Maritime Command Platform',
  },
  {
    appId: 'terra',
    appName: 'Terra',
    displayName: 'Terra — Real Estate Intelligence',
    layers: ['OBSERVE', 'DECIDE', 'EXECUTE'],
    description:
      'Real estate intelligence — distress radar, deal pipeline underwriting, market analytics, and agent coordination.',
    primaryRole: 'Real Estate Intelligence Platform',
  },
  {
    appId: 'carlota-jo',
    appName: 'Carlota Jo',
    layers: ['TRUST'],
    description:
      'Premium consulting and advisory operations platform for high-trust client engagements and founder strategy.',
    primaryRole: 'Premium Advisory Brand',
  },
  {
    appId: 'counsel',
    appName: 'Counsel',
    displayName: 'Counsel — Legal Matter Command',
    layers: ['UNDERSTAND', 'DECIDE'],
    description:
      'Legal matter command — matter intelligence, obligation graph, proof chain, and exposure forecasting.',
    primaryRole: 'Legal Matter Command',
  },
];

export function getDoctrineConfig(appId: string): DoctrineLayerConfig | undefined {
  return DOCTRINE_APP_MAP.find((c) => c.appId === appId);
}

export function getAppsByLayer(layer: DoctrineLayer): DoctrineLayerConfig[] {
  return DOCTRINE_APP_MAP.filter((c) => c.layers.includes(layer));
}

export function formatLayerLabel(layers: DoctrineLayer[]): string {
  return layers.join(' + ');
}

export const DOCTRINE_LAYER_ORDER: DoctrineLayer[] = [
  'OBSERVE',
  'UNDERSTAND',
  'DECIDE',
  'EXECUTE',
  'TRUST',
  'SIGNAL',
];
