import { AppObservabilityPage } from "@workspace/shared-ui";
  import { readinessReportConfig } from "@workspace/observability/configs";

  export default function ObservabilityPage() {
    return <AppObservabilityPage config={readinessReportConfig} />;
  }
  