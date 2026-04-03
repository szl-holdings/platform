import { AppObservabilityPage } from "@szl-holdings/shared-ui";
  import { firestormConfig } from "@szl-holdings/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={firestormConfig} />;
  }
  