import { useWorkspace } from "@/context/WorkspaceContext";
import { CORTEX_COLORS } from "@/constants/colors";

export function useColors() {
  const { config } = useWorkspace();
  return {
    ...CORTEX_COLORS,
    accent: config.accentColor,
    amber: "#f59e0b",
    navy: "#0D1117",
    border: CORTEX_COLORS.border,
  };
}
