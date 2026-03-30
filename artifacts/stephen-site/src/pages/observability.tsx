import { ObservabilityProvider, ObservabilityPanel } from "@workspace/observability/react";
import { stephenSiteConfig } from "@workspace/observability/configs";

export default function ObservabilityPage() {
  return (
    <ObservabilityProvider config={stephenSiteConfig}>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <ObservabilityPanel />
      </div>
    </ObservabilityProvider>
  );
}
