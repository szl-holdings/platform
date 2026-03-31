import { AppObservabilityPage } from "@workspace/shared-ui";
  import { incaConfig } from "@workspace/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={incaConfig} />;
  }
  