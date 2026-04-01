import colors from "@/constants/colors";

export function useColors() {
  return { ...colors.ocean, radius: colors.radius };
}
