import { BrandedErrorFallback, type BrandedErrorFallbackProps } from "@szl-holdings/mobile-shared";

export function ErrorFallback(props: BrandedErrorFallbackProps) {
  return (
    <BrandedErrorFallback
      {...props}
      mode="reload"
      accentColor="#C8A96A"
      backgroundColor="#0e0c09"
      appName="Carlota Jo"
    />
  );
}
