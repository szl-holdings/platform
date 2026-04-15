import { useTheme } from "@szl-holdings/mobile-shared";
import colors from "@/constants/colors";

export function useColors() {
  const { isDark } = useTheme();
  return { ...(isDark ? colors.dark : colors.light), radius: colors.radius };
}
