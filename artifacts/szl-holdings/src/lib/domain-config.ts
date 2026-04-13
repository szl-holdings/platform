import { Shield, Ship, Building2, Scale, Users, Cpu } from "lucide-react";

export type Domain = "aegis" | "vessels" | "terra" | "prism" | "carlotajo" | "alloy";

export interface DomainConfig {
  id: Domain;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  icon: typeof Shield;
  externalPath: string;
  wsChannels: string[];
  prismLens?: string;
}

export const DOMAINS: Record<Domain, DomainConfig> = {
  aegis: {
    id: "aegis", label: "Aegis", shortLabel: "AEG",
    color: "#4f6ef7", bg: "rgba(79,110,247,0.08)", icon: Shield,
    externalPath: "/firestorm/", wsChannels: ["aegis-incidents"],
    prismLens: "Risk",
  },
  vessels: {
    id: "vessels", label: "Vessels", shortLabel: "VES",
    color: "#38bdf8", bg: "rgba(56,189,248,0.08)", icon: Ship,
    externalPath: "/vessels/", wsChannels: ["vessel-positions"],
    prismLens: "Signals",
  },
  terra: {
    id: "terra", label: "Terra", shortLabel: "TER",
    color: "#a07848", bg: "rgba(160,120,72,0.08)", icon: Building2,
    externalPath: "/terra/", wsChannels: ["terra-signals"],
    prismLens: "Intelligence",
  },
  prism: {
    id: "prism", label: "PRISM Counsel", shortLabel: "PRM",
    color: "#d4a054", bg: "rgba(212,160,84,0.08)", icon: Scale,
    externalPath: "/prism-counsel/", wsChannels: ["notifications", "workflow-runs"],
    prismLens: "Motion",
  },
  carlotajo: {
    id: "carlotajo", label: "Carlota Jo", shortLabel: "CLJ",
    color: "#c4956a", bg: "rgba(196,149,106,0.08)", icon: Users,
    externalPath: "/carlota-jo/", wsChannels: ["bookings"],
    prismLens: "Pulse",
  },
  alloy: {
    id: "alloy", label: "Alloy", shortLabel: "ALY",
    color: "#6c8ebf", bg: "rgba(108,142,191,0.08)", icon: Cpu,
    externalPath: "/alloy/", wsChannels: ["workflow-runs"],
    prismLens: "Motion",
  },
};

export const DOMAIN_CHANNEL_MAP: Record<string, Domain | Domain[]> = {
  "aegis-incidents": "aegis",
  "vessel-positions": "vessels",
  "terra-signals": "terra",
  "workflow-runs": ["alloy", "prism"],
  "bookings": "carlotajo",
  "notifications": "prism",
};

export function resolveDomainFromChannel(channel: string, data?: Record<string, unknown>): Domain | null {
  const mapping = DOMAIN_CHANNEL_MAP[channel];
  if (!mapping) return null;
  if (typeof mapping === "string") return mapping;
  if (data?.domain && typeof data.domain === "string") {
    const d = data.domain as Domain;
    if (DOMAINS[d]) return d;
  }
  return mapping[0];
}
