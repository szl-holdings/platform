import { ObservabilityProvider, ObservabilityPanel } from "@workspace/observability/react";
import { vesselsConfig } from "@workspace/observability/configs";

export default function ObservabilityPage() {
  return (
    <ObservabilityProvider config={vesselsConfig}>
      <div className="max-w-7xl mx-auto">
        <ObservabilityPanel />
      </div>
    </ObservabilityProvider>
  );
}
