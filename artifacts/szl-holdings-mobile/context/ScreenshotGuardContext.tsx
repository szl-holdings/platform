import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WorkspaceDomain } from "@/context/WorkspaceContext";

const STORAGE_KEY = "cortex_screenshot_policies";

const DEFAULT_POLICIES: Record<WorkspaceDomain, boolean> = {
  command: false,
  defense: true,
  fleet: false,
  properties: false,
  operations: false,
  advisory: true,
  portfolio: true,
  founder: false,
};

interface ScreenshotGuardContextValue {
  policies: Record<WorkspaceDomain, boolean>;
  setPolicy: (domain: WorkspaceDomain, enabled: boolean) => void;
  isPolicyEnabled: (domain: WorkspaceDomain) => boolean;
}

const ScreenshotGuardContext = createContext<ScreenshotGuardContextValue>({
  policies: DEFAULT_POLICIES,
  setPolicy: () => {},
  isPolicyEnabled: () => false,
});

export function ScreenshotGuardProvider({ children }: { children: ReactNode }) {
  const [policies, setPolicies] = useState<Record<WorkspaceDomain, boolean>>(DEFAULT_POLICIES);

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (val) {
          const parsed = JSON.parse(val);
          setPolicies((prev) => ({ ...prev, ...parsed }));
        }
      })
      .catch(() => {});
  }, []);

  const setPolicy = useCallback((domain: WorkspaceDomain, enabled: boolean) => {
    setPolicies((prev) => {
      const next = { ...prev, [domain]: enabled };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isPolicyEnabled = useCallback(
    (domain: WorkspaceDomain) => policies[domain] ?? false,
    [policies]
  );

  return (
    <ScreenshotGuardContext.Provider value={{ policies, setPolicy, isPolicyEnabled }}>
      {children}
    </ScreenshotGuardContext.Provider>
  );
}

export function useScreenshotGuard() {
  return useContext(ScreenshotGuardContext);
}
