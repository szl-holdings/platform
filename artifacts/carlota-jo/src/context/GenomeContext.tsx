import { createContext, useContext, useState, type ReactNode } from "react";

type PrefStore = Record<string, string>;

type GenomeContextValue = {
  overrides: PrefStore;
  updatePref: (key: string, newValue: string) => void;
  getPref: (key: string) => string | undefined;
  lastUpdated: string | null;
};

const GenomeContext = createContext<GenomeContextValue | null>(null);

export function GenomeProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<PrefStore>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const updatePref = (key: string, newValue: string) => {
    setOverrides(prev => ({ ...prev, [key]: newValue }));
    const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setLastUpdated(now);
  };

  const getPref = (key: string): string | undefined => overrides[key];

  return (
    <GenomeContext.Provider value={{ overrides, updatePref, getPref, lastUpdated }}>
      {children}
    </GenomeContext.Provider>
  );
}

export function useGenome(): GenomeContextValue {
  const ctx = useContext(GenomeContext);
  if (!ctx) throw new Error("useGenome must be used within GenomeProvider");
  return ctx;
}
