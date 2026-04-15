import React, { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type WorkspaceId, WORKSPACE_MAP, WORKSPACES, type WorkspaceConfig } from "@/constants/workspaces";

const STORAGE_KEY = "cortex_active_workspace";

interface AlertBadges {
  defense: number;
  fleet: number;
  properties: number;
  operations: number;
  advisory: number;
  portfolio: number;
  founder: number;
}

interface WorkspaceContextValue {
  activeWorkspace: WorkspaceId;
  config: WorkspaceConfig;
  setActiveWorkspace: (id: WorkspaceId) => void;
  badges: AlertBadges;
  setBadges: (badges: Partial<AlertBadges>) => void;
}

const defaultBadges: AlertBadges = { defense: 3, fleet: 1, properties: 0, operations: 2, advisory: 0, portfolio: 1, founder: 0 };

const WorkspaceContext = createContext<WorkspaceContextValue>({
  activeWorkspace: "portfolio",
  config: WORKSPACE_MAP.get("portfolio")!,
  setActiveWorkspace: () => {},
  badges: defaultBadges,
  setBadges: () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWorkspace, setActiveState] = useState<WorkspaceId>("portfolio");
  const [badges, setBadgesState] = useState<AlertBadges>(defaultBadges);

  const setActiveWorkspace = useCallback((id: WorkspaceId) => {
    setActiveState(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  }, []);

  const setBadges = useCallback((partial: Partial<AlertBadges>) => {
    setBadgesState(prev => ({ ...prev, ...partial }));
  }, []);

  const config = WORKSPACE_MAP.get(activeWorkspace) ?? WORKSPACES[0];

  return (
    <WorkspaceContext.Provider value={{ activeWorkspace, config, setActiveWorkspace, badges, setBadges }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
