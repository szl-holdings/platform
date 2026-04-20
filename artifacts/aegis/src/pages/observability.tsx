import { firestormConfig } from '@szl-holdings/observability/configs';
import AppObservabilityPage from '@szl-holdings/shared-ui/AppObservabilityPage';

export default function ObservabilityPage() {
  return <AppObservabilityPage config={firestormConfig} />;
}
