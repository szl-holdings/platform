import type { WorkspaceId } from "./workspaces";

export interface TabConfig {
  name: string;
  label: string;
  sfIcon: string;
  sfIconSelected: string;
  androidIcon: string;
}

export const WORKSPACE_TABS: Record<WorkspaceId, TabConfig[]> = {
  defense: [
    { name: "index", label: "Dashboard", sfIcon: "shield", sfIconSelected: "shield.fill", androidIcon: "shield" },
    { name: "signals", label: "Incidents", sfIcon: "exclamationmark.triangle", sfIconSelected: "exclamationmark.triangle.fill", androidIcon: "warning" },
    { name: "copilot", label: "Sentinel", sfIcon: "bubble.left.and.bubble.right", sfIconSelected: "bubble.left.and.bubble.right.fill", androidIcon: "message-circle" },
  ],
  fleet: [
    { name: "index", label: "Fleet", sfIcon: "ferry", sfIconSelected: "ferry.fill", androidIcon: "anchor" },
    { name: "signals", label: "Alerts", sfIcon: "bell", sfIconSelected: "bell.fill", androidIcon: "bell" },
    { name: "copilot", label: "Helmsman", sfIcon: "bubble.left.and.bubble.right", sfIconSelected: "bubble.left.and.bubble.right.fill", androidIcon: "message-circle" },
  ],
  properties: [
    { name: "index", label: "Properties", sfIcon: "building.2", sfIconSelected: "building.2.fill", androidIcon: "home" },
    { name: "signals", label: "Pipeline", sfIcon: "chart.bar", sfIconSelected: "chart.bar.fill", androidIcon: "bar-chart-2" },
    { name: "copilot", label: "Terrain", sfIcon: "bubble.left.and.bubble.right", sfIconSelected: "bubble.left.and.bubble.right.fill", androidIcon: "message-circle" },
  ],
  operations: [
    { name: "index", label: "Dashboard", sfIcon: "bolt", sfIconSelected: "bolt.fill", androidIcon: "zap" },
    { name: "signals", label: "Signals", sfIcon: "waveform.path.ecg", sfIconSelected: "waveform.path.ecg", androidIcon: "activity" },
    { name: "copilot", label: "Lyte AI", sfIcon: "bubble.left.and.bubble.right", sfIconSelected: "bubble.left.and.bubble.right.fill", androidIcon: "message-circle" },
  ],
  advisory: [
    { name: "index", label: "Overview", sfIcon: "sparkles", sfIconSelected: "sparkles", androidIcon: "star" },
    { name: "signals", label: "Sessions", sfIcon: "calendar", sfIconSelected: "calendar", androidIcon: "calendar" },
    { name: "copilot", label: "Muse", sfIcon: "bubble.left.and.bubble.right", sfIconSelected: "bubble.left.and.bubble.right.fill", androidIcon: "message-circle" },
  ],
  portfolio: [
    { name: "index", label: "Command", sfIcon: "chart.pie", sfIconSelected: "chart.pie.fill", androidIcon: "pie-chart" },
    { name: "signals", label: "Portfolio", sfIcon: "briefcase", sfIconSelected: "briefcase.fill", androidIcon: "briefcase" },
    { name: "copilot", label: "Navigator", sfIcon: "bubble.left.and.bubble.right", sfIconSelected: "bubble.left.and.bubble.right.fill", androidIcon: "message-circle" },
  ],
  founder: [
    { name: "index", label: "Home", sfIcon: "person", sfIconSelected: "person.fill", androidIcon: "user" },
    { name: "signals", label: "Ventures", sfIcon: "lightbulb", sfIconSelected: "lightbulb.fill", androidIcon: "trending-up" },
    { name: "copilot", label: "Stephen AI", sfIcon: "bubble.left.and.bubble.right", sfIconSelected: "bubble.left.and.bubble.right.fill", androidIcon: "message-circle" },
  ],
};
