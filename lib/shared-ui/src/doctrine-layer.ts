import type { DoctrineLayer } from "@workspace/observability";
export type { DoctrineLayer, DoctrineContextModel, ExplainabilityModel, NormalizedEvent } from "@workspace/observability";

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
    appId: "lyte",
    appName: "Lyte",
    layers: ["DECIDE", "EXECUTE"],
    description: "Workflow routing, approvals, ownership, and escalation command center.",
    primaryRole: "Decision + Execution Engine",
  },
  {
    appId: "vessels",
    appName: "Vessels",
    layers: ["OBSERVE"],
    description: "Maritime movement tracking, watchlists, anomaly detection, and geospatial alerting.",
    primaryRole: "Maritime Observation Layer",
  },
  {
    appId: "firestorm",
    appName: "Firestorm",
    layers: ["UNDERSTAND"],
    description: "Security simulation, blast radius analysis, resilience scoring, and penetration testing.",
    primaryRole: "Security Understanding Layer",
  },
  {
    appId: "inca",
    appName: "INCA",
    layers: ["UNDERSTAND", "DECIDE"],
    description: "Intelligence fusion, entity graph construction, and narrative assessment.",
    primaryRole: "Intelligence Understanding + Decision Layer",
  },
  {
    appId: "alloy",
    appName: "Alloy",
    displayName: "Alloy",
    layers: ["EXECUTE"],
    description: "Connectors, automations, DAGs, retries, and execution history.",
    primaryRole: "Execution + Automation Engine",
  },
  {
    appId: "carlota-jo",
    appName: "Carlota Jo",
    layers: ["EXECUTE", "TRUST"],
    description: "Premium client delivery, luxury advisory, and engagement excellence.",
    primaryRole: "Execution + Trust Layer",
  },
  {
    appId: "stephen-site",
    appName: "Stephen Lutar",
    layers: ["SIGNAL", "TRUST"],
    description: "Founder identity, thought leadership, and personal brand intelligence.",
    primaryRole: "Signal + Trust Layer",
  },
  {
    appId: "szl-holdings",
    appName: "SZL Holdings",
    layers: ["OBSERVE", "UNDERSTAND", "DECIDE", "EXECUTE"],
    description: "Parent intelligence architecture — the unified operating model across all layers.",
    primaryRole: "Parent Intelligence Architecture",
  },
  {
    appId: "msp",
    appName: "Evolve MSP",
    layers: ["OBSERVE", "EXECUTE"],
    description: "Managed services performance monitoring and service delivery orchestration.",
    primaryRole: "Managed Services Intelligence Layer",
  },
  {
    appId: "terra",
    appName: "Terra",
    layers: ["OBSERVE", "UNDERSTAND"],
    description: "Real estate market intelligence, portfolio analysis, and deal insight.",
    primaryRole: "Real Estate Intelligence Layer",
  },
  {
    appId: "dreamscape",
    appName: "Dreamscape",
    layers: ["EXECUTE"],
    description: "Creative asset generation, campaign production, and content execution.",
    primaryRole: "Creative Execution Layer",
  },
  {
    appId: "readiness-report",
    appName: "Readiness",
    layers: ["OBSERVE", "UNDERSTAND"],
    description: "Organizational readiness assessment, risk scoring, and gap analysis.",
    primaryRole: "Readiness Observation + Analysis Layer",
  },
  {
    appId: "admin",
    appName: "Admin Panel",
    layers: ["EXECUTE"],
    description: "Control plane administration, user management, and system configuration.",
    primaryRole: "Administration + Control Layer",
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

