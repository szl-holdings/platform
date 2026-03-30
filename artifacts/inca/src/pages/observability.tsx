import { ObservabilityProvider, ObservabilityPanel } from "@workspace/observability/react";
import { incaConfig } from "@workspace/observability/configs";

export default function ObservabilityPage() {
  return (
    <ObservabilityProvider config={incaConfig}>
      <div className="max-w-7xl mx-auto">
        <ObservabilityPanel />
      </div>
    </ObservabilityProvider>
  );
}
