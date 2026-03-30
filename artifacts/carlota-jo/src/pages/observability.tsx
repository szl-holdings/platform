import { ObservabilityProvider, ObservabilityPanel } from "@workspace/observability/react";
import { carlotaJoConfig } from "@workspace/observability/configs";

export default function ObservabilityPage() {
  return (
    <ObservabilityProvider config={carlotaJoConfig}>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <ObservabilityPanel />
      </div>
    </ObservabilityProvider>
  );
}
