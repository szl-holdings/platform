import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNexusSettings, type NexusSettings } from "./api";

const DEFAULT_SETTINGS: NexusSettings = {
  domainToggles: { vessels: true, aegis: true, terra: true, prism: true, lyte: true },
  correlationThreshold: 0.6,
  autoRefreshInterval: 30,
};

interface SettingsContextValue {
  settings: NexusSettings;
  refetchIntervalMs: number;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  refetchIntervalMs: 30_000,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: ["nexus-settings"],
    queryFn: fetchNexusSettings,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const settings: NexusSettings = data?.config
    ? { ...DEFAULT_SETTINGS, ...data.config }
    : DEFAULT_SETTINGS;

  const refetchIntervalMs = (settings.autoRefreshInterval ?? 30) * 1000;

  return (
    <SettingsContext.Provider value={{ settings, refetchIntervalMs }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useNexusSettings() {
  return useContext(SettingsContext);
}
