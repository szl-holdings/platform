import { BrandedErrorFallback, type BrandedErrorFallbackProps } from "@szl-holdings/mobile-shared";

export function ErrorFallback(props: BrandedErrorFallbackProps) {
  return (
    <BrandedErrorFallback
      {...props}
      mode="reload"
      accentColor="#F97316"
      backgroundColor="#080B12"
    />
  );
}
