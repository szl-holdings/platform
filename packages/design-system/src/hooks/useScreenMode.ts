import { useDesignSystem, type ScreenMode } from "../providers/DesignSystemProvider.js";

export interface ScreenModeValues {
  mode: ScreenMode;
  isExecutive: boolean;
  isOperator: boolean;
  setScreenMode: (mode: ScreenMode) => void;
}

/**
 * Returns the current screen mode (executive/operator) and a setter.
 *
 * Executive mode: Clean summaries, top risks, approvals needed, trends.
 * Operator mode: High-density, filter/table-first, drawers, trace+evidence visibility.
 */
export function useScreenMode(): ScreenModeValues {
  const { screenMode, setScreenMode } = useDesignSystem();
  return {
    mode: screenMode,
    isExecutive: screenMode === "executive",
    isOperator: screenMode === "operator",
    setScreenMode,
  };
}
