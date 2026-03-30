import { AppObservabilityPage } from "@workspace/shared-ui";
  import { lyteCommandCenterConfig } from "@workspace/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={lyteCommandCenterConfig} />;
  }
  