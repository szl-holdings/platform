import { BrandedErrorFallback } from "@szl-holdings/mobile-shared";
import type { ErrorFallbackProps } from "@szl-holdings/mobile-shared";
import { CORTEX_COLORS } from "@/constants/colors";

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <BrandedErrorFallback
      error={error}
      resetError={resetError}
      appName="CORTEX"
      accentColor="#334155"
      backgroundColor={CORTEX_COLORS.bg}
    />
  );
}
