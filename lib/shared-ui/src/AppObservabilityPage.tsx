import { ObservabilityProvider, ObservabilityPanel } from "@szl-holdings/observability/react";
import type { DomainConfig } from "@szl-holdings/observability";

interface AppObservabilityPageProps {
  config: DomainConfig;
  className?: string;
}

export default function AppObservabilityPage({ config, className = "max-w-7xl mx-auto" }: AppObservabilityPageProps) {
  return (
    <ObservabilityProvider config={config}>
      <div className={className}>
        <ObservabilityPanel />
      </div>
    </ObservabilityProvider>
  );
}
