import type { DoctrineLayer } from "@szl-holdings/observability";
export type { DoctrineLayer, DoctrineContextModel, ExplainabilityModel, NormalizedEvent } from "@szl-holdings/observability";

export interface DoctrineLayerConfig {
  appId: string;
  appName: string;
  displayName?: string;
  layers: DoctrineLayer[];
  description: string;
  primaryRole: string;
}

export const DOCTRINE_LAYER_COLORS: Record<DoctrineLayer, { color: string; bg: string; border: string }> = {
  OBSERVE: {
    color: "hsl(200, 85%, 55%)",
    bg: "hsla(200, 85%, 55%, 0.12)",
    border: "hsla(200, 85%, 55%, 0.30)",
  },
  UNDERSTAND: {
    color: "hsl(270, 70%, 62%)",
    bg: "hsla(270, 70%, 62%, 0.12)",
    border: "hsla(270, 70%, 62%, 0.30)",
  },
  DECIDE: {
    color: "hsl(38, 90%, 55%)",
    bg: "hsla(38, 90%, 55%, 0.12)",
    border: "hsla(38, 90%, 55%, 0.30)",
  },
  EXECUTE: {
    color: "hsl(152, 65%, 48%)",
    bg: "hsla(152, 65%, 48%, 0.12)",
    border: "hsla(152, 65%, 48%, 0.30)",
  },
  TRUST: {
    color: "hsl(24, 60%, 56%)",
    bg: "hsla(24, 60%, 56%, 0.12)",
    border: "hsla(24, 60%, 56%, 0.30)",
  },
  SIGNAL: {
    color: "hsl(264, 56%, 60%)",
    bg: "hsla(264, 56%, 60%, 0.12)",
    border: "hsla(264, 56%, 60%, 0.30)",
  },
};

export const DOCTRINE_LAYER_DESCRIPTIONS: Record<DoctrineLayer, string> = {
  OBSERVE: "Collects and surfaces data, telemetry, and signals from the operational environment.",
  UNDERSTAND: "Synthesizes observations into insight — pattern recognition, prediction, and context modeling.",
  DECIDE: "Translates understanding into recommended or automated actions — routing, approvals, escalation.",
  EXECUTE: "Carries out decisions — automations, connectors, workflows, and delivery.",
  TRUST: "Premium client delivery and relationship intelligence — the highest-confidence output layer.",
  SIGNAL: "Founder identity and thought leadership — personal intelligence and brand signal.",
};

export const DOCTRINE_APP_MAP: DoctrineLayerConfig[] = [
  {
    appId: "szl-holdings",
    appName: "SZL Holdings",
    layers: ["OBSERVE", "UNDERSTAND", "DECIDE", "EXECUTE"],
    description: "Parent holding company — the unified operating model and brand hierarchy across all platforms.",
    primaryRole: "Parent Company",
  },
  {
    appId: "alloy",
    appName: "Alloy",
    displayName: "Alloy",
    layers: ["EXECUTE"],
    description: "Signal ingestion, workflow orchestration, action routing, output generation, and governance. Powers all platforms.",
    primaryRole: "Intelligence Backbone & Execution Engine",
  },
  {
    appId: "command",
    appName: "Command",
    displayName: "Unified Command",
    layers: ["OBSERVE", "DECIDE", "EXECUTE"],
    description: "Unified Command workspace — Strategy, Operations, and Infrastructure modes for end-to-end business orchestration.",
    primaryRole: "Unified Command Surface",
  },
  {
    appId: "vessels",
    appName: "Vessels",
    layers: ["OBSERVE"],
    description: "Maritime command intelligence — fleet visibility, voyage performance, and operational exceptions.",
    primaryRole: "Maritime Command Platform",
  },
  {
    appId: "terra",
    appName: "Terra",
    layers: ["OBSERVE", "DECIDE", "EXECUTE"],
    description: "Listings intelligence, inquiry routing, agent coordination, and distress signals for commercial real estate brokers.",
    primaryRole: "Real Estate Broker Command Platform",
  },
  {
    appId: "carlota-jo",
    appName: "Carlota Jo",
    layers: ["EXECUTE", "TRUST"],
    description: "Discreet operational and residence support for high-trust environments. Not a software product.",
    primaryRole: "Premium Service Brand",
  },
  {
    appId: "szl-leadership",
    appName: "Leadership",
    layers: ["SIGNAL", "TRUST"],
    description: "Founder identity and canonical narrative — Stephen Lutar's thesis, case studies, and ecosystem health, consolidated inside SZL Holdings.",
    primaryRole: "Founder · SZL Holdings",
  },
  {
    appId: "aegis",
    appName: "Aegis",
    displayName: "Aegis — Unified Defense & Intelligence Command",
    layers: ["OBSERVE", "UNDERSTAND", "DECIDE", "EXECUTE"],
    description: "Unified security, managed operations, and AI intelligence. SOC command, XDR, MSP operations, model registry, and agentic cortex in one platform.",
    primaryRole: "Unified Defense & Intelligence Command",
  },
];

export function getDoctrineConfig(appId: string): DoctrineLayerConfig | undefined {
  return DOCTRINE_APP_MAP.find((c) => c.appId === appId);
}

export function getAppsByLayer(layer: DoctrineLayer): DoctrineLayerConfig[] {
  return DOCTRINE_APP_MAP.filter((c) => c.layers.includes(layer));
}

export function formatLayerLabel(layers: DoctrineLayer[]): string {
  return layers.join(" + ");
}

export const DOCTRINE_LAYER_ORDER: DoctrineLayer[] = [
  "OBSERVE",
  "UNDERSTAND",
  "DECIDE",
  "EXECUTE",
  "TRUST",
  "SIGNAL",
];

