import { AppObservabilityPage } from "@workspace/shared-ui";
  import { carlotaJoConfig } from "@workspace/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={carlotaJoConfig} />;
  }
  