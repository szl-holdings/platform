import { szlHoldingsConfig } from '@szl-holdings/observability/configs';
import AppObservabilityPage from '@szl-holdings/shared-ui/AppObservabilityPage';

export default function ObservabilityPage() {
  return (
    <AppObservabilityPage config={szlHoldingsConfig} className="max-w-7xl mx-auto py-8 px-4" />
  );
}
