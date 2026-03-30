import { ObservabilityProvider, ObservabilityPanel } from "@workspace/observability/react";
import { lyteCommandCenterConfig } from "@workspace/observability/configs";

export default function ObservabilityPage() {
  return (
    <ObservabilityProvider config={lyteCommandCenterConfig}>
      <div className="max-w-7xl mx-auto">
        <ObservabilityPanel />
      </div>
    </ObservabilityProvider>
  );
}
