import { useTheme } from "@szl-holdings/mobile-shared";
import { LYTE_COLORS, LYTE_COLORS_LIGHT } from "@/constants/colors";

export function useColors() {
  const { isDark } = useTheme();
  return isDark ? LYTE_COLORS : LYTE_COLORS_LIGHT;
}
