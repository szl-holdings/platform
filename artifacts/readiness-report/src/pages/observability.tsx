import { ObservabilityProvider, ObservabilityPanel } from "@workspace/observability/react";
import { readinessReportConfig } from "@workspace/observability/configs";

export default function ObservabilityPage() {
  return (
    <ObservabilityProvider config={readinessReportConfig}>
      <div className="max-w-7xl mx-auto">
        <ObservabilityPanel />
      </div>
    </ObservabilityProvider>
  );
}
