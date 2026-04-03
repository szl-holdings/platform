import { AppObservabilityPage } from "@workspace/shared-ui";
  import { terraConfig } from "@workspace/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={terraConfig} />;
  }
  