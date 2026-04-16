import { createContext, useContext } from "react";

export const ExecutiveSafeModeContext = createContext<boolean>(false);

export function useExecutiveSafeMode(): boolean {
  return useContext(ExecutiveSafeModeContext);
}
