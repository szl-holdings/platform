export type WorkspaceId = "defense" | "fleet" | "properties" | "operations" | "advisory" | "portfolio" | "founder";

export interface WorkspaceConfig {
  id: WorkspaceId;
  label: string;
  shortLabel: string;
  icon: string;
  accentColor: string;
  description: string;
  copilotName: string;
  copilotIcon: string;
  copilotAgentId: string;
}

export const WORKSPACES: WorkspaceConfig[] = [
  { id: "defense", label: "Defense & Intelligence", shortLabel: "Defense", icon: "🛡", accentColor: "#f59e0b", description: "SOC operations, threat analysis & incident response", copilotName: "Sentinel", copilotIcon: "🛡", copilotAgentId: "aegis" },
  { id: "fleet", label: "Fleet Command", shortLabel: "Fleet", icon: "⚓", accentColor: "#38bdf8", description: "Maritime operations, vessel tracking & fleet management", copilotName: "Helmsman", copilotIcon: "⚓", copilotAgentId: "vessels" },
  { id: "properties", label: "Properties", shortLabel: "Properties", icon: "🏗", accentColor: "#c87941", description: "Real estate intelligence, property analysis & deal pipeline", copilotName: "Terrain", copilotIcon: "🏗", copilotAgentId: "terra" },
  { id: "operations", label: "Operations", shortLabel: "Ops", icon: "⚡", accentColor: "#00d4ff", description: "Business observability, AIOps & service health", copilotName: "Lyte Ops", copilotIcon: "⚡", copilotAgentId: "lyte" },
  { id: "advisory", label: "Advisory", shortLabel: "Advisory", icon: "✨", accentColor: "#c8a96a", description: "Client advisory, session management & service design", copilotName: "Carlota", copilotIcon: "✨", copilotAgentId: "carlota-jo" },
  { id: "portfolio", label: "Portfolio & Holdings", shortLabel: "Portfolio", icon: "◆", accentColor: "#c9a84c", description: "Executive command, investor relations & portfolio management", copilotName: "Navigator", copilotIcon: "◆", copilotAgentId: "szl-holdings" },
  { id: "founder", label: "Founder", shortLabel: "Founder", icon: "👤", accentColor: "#a855f7", description: "Articles, ventures & personal command", copilotName: "Stephen AI", copilotIcon: "👤", copilotAgentId: "stephen" },
];

export const WORKSPACE_MAP = new Map(WORKSPACES.map(w => [w.id, w]));
