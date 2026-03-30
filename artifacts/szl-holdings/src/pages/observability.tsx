import { ObservabilityProvider, ObservabilityPanel } from "@workspace/observability/react";
import { szlHoldingsConfig } from "@workspace/observability/configs";

export default function ObservabilityPage() {
  return (
    <ObservabilityProvider config={szlHoldingsConfig}>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <ObservabilityPanel />
      </div>
    </ObservabilityProvider>
  );
}
