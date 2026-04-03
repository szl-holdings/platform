import { AppObservabilityPage } from "@workspace/shared-ui";
  import { vesselsConfig } from "@workspace/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={vesselsConfig} />;
  }
  