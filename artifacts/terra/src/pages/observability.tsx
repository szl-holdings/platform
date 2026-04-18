import AppObservabilityPage from "@szl-holdings/shared-ui/AppObservabilityPage";
  import { terraConfig } from "@szl-holdings/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={terraConfig} />;
  }
  