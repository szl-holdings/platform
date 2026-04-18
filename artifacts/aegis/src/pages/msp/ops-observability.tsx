import AppObservabilityPage from "@szl-holdings/shared-ui/AppObservabilityPage";
  import { mspConfig } from "@szl-holdings/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={mspConfig} />;
  }
  