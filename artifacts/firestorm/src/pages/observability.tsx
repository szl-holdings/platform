import { AppObservabilityPage } from "@workspace/shared-ui";
  import { firestormConfig } from "@workspace/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={firestormConfig} />;
  }
  