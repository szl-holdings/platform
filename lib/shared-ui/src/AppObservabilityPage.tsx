import type { DomainConfig } from '@szl-holdings/observability';
import { ObservabilityPanel, ObservabilityProvider } from '@szl-holdings/observability/react';

interface AppObservabilityPageProps {
  config: DomainConfig;
  className?: string;
}

export default function AppObservabilityPage({
  config,
  className = 'max-w-7xl mx-auto',
}: AppObservabilityPageProps) {
  return (
    <ObservabilityProvider config={config}>
      <div className={className}>
        <ObservabilityPanel />
      </div>
    </ObservabilityProvider>
  );
}
