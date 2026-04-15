import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type WorkspaceDomain =
  | "command"
  | "defense"
  | "fleet"
  | "properties"
  | "operations"
  | "advisory"
  | "portfolio"
  | "founder";

export interface WorkspaceConfig {
  id: WorkspaceDomain;
  label: string;
  icon: string;
  accent: string;
  route: string;
  description: string;
}

export const WORKSPACES: WorkspaceConfig[] = [
  {
    id: "command",
    label: "Command Feed",
    icon: "⬡",
    accent: "#c9a84c",
    route: "/(shell)/",
    description: "Cross-domain situational awareness",
  },
  {
    id: "defense",
    label: "Defense",
    icon: "🛡",
    accent: "#ef4444",
    route: "/(shell)/defense",
    description: "Aegis SOC & threat intelligence",
  },
  {
    id: "fleet",
    label: "Fleet",
    icon: "⚓",
    accent: "#0ea5e9",
    route: "/(shell)/fleet",
    description: "Vessels maritime intelligence",
  },
  {
    id: "properties",
    label: "Properties",
    icon: "🏛",
    accent: "#c87941",
    route: "/(shell)/properties",
    description: "Terra real estate intelligence",
  },
  {
    id: "operations",
    label: "Operations",
    icon: "⚡",
    accent: "#a855f7",
    route: "/(shell)/operations",
    description: "Lyte AIOps & business observability",
  },
  {
    id: "advisory",
    label: "Advisory",
    icon: "◉",
    accent: "#10b981",
    route: "/(shell)/advisory",
    description: "Carlota Jo client advisory",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: "◈",
    accent: "#c9a84c",
    route: "/(shell)/portfolio",
    description: "SZL Holdings executive command",
  },
  {
    id: "founder",
    label: "Founder",
    icon: "◊",
    accent: "#6366f1",
    route: "/(shell)/founder",
    description: "Stephen personal command",
  },
];

export interface WorkspaceBadge {
  workspaceId: WorkspaceDomain;
  count: number;
}

interface WorkspaceContextValue {
  activeWorkspace: WorkspaceDomain;
  setActiveWorkspace: (domain: WorkspaceDomain) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  badges: Record<WorkspaceDomain, number>;
  setBadge: (domain: WorkspaceDomain, count: number) => void;
  totalBadges: number;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  activeWorkspace: "command",
  setActiveWorkspace: () => {},
  drawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
  badges: {} as Record<WorkspaceDomain, number>,
  setBadge: () => {},
  totalBadges: 0,
});

const STORAGE_KEY = "cortex_active_workspace";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWorkspace, setActiveWorkspaceState] = useState<WorkspaceDomain>("command");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badges, setBadges] = useState<Record<WorkspaceDomain, number>>({
    command: 0,
    defense: 0,
    fleet: 0,
    properties: 0,
    operations: 0,
    advisory: 0,
    portfolio: 0,
    founder: 0,
  });

  const setActiveWorkspace = useCallback((domain: WorkspaceDomain) => {
    setActiveWorkspaceState(domain);
    AsyncStorage.setItem(STORAGE_KEY, domain).catch(() => {});
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);

  const setBadge = useCallback((domain: WorkspaceDomain, count: number) => {
    setBadges((prev) => ({ ...prev, [domain]: count }));
  }, []);

  const totalBadges = Object.values(badges).reduce((a, b) => a + b, 0);

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        setActiveWorkspace,
        drawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        badges,
        setBadge,
        totalBadges,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  return useContext(WorkspaceContext);
}
