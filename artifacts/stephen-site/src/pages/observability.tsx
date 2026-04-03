import { AppObservabilityPage } from "@szl-holdings/shared-ui";
import { stephenSiteConfig } from "@szl-holdings/observability/configs";

export default function ObservabilityPage() {
  return <AppObservabilityPage config={stephenSiteConfig} className="max-w-7xl mx-auto py-8 px-4" />;
}
