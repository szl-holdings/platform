import { AppObservabilityPage } from "@workspace/shared-ui";
  import { szlHoldingsConfig } from "@workspace/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={szlHoldingsConfig} className="max-w-7xl mx-auto py-8 px-4" />;
  }
  