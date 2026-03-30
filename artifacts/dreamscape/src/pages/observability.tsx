import { ObservabilityProvider, ObservabilityPanel } from "@workspace/observability/react";
import { dreamscapeConfig } from "@workspace/observability/configs";

export default function ObservabilityPage() {
  return (
    <ObservabilityProvider config={dreamscapeConfig}>
      <div className="max-w-7xl mx-auto">
        <ObservabilityPanel />
      </div>
    </ObservabilityProvider>
  );
}
