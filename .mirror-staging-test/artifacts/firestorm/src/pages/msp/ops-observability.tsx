import { AppObservabilityPage } from "@workspace/shared-ui";
  import { mspConfig } from "@workspace/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={mspConfig} />;
  }
  