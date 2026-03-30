import { AppObservabilityPage } from "@workspace/shared-ui";
  import { dreamscapeConfig } from "@workspace/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={dreamscapeConfig} />;
  }
  