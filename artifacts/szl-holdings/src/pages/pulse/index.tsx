import type { ReactElement } from "react";
import { useParams } from "wouter";
import { PulseLayout } from "./pulse-layout";
import DailyBriefPage from "./daily-brief";
import BriefingLibraryPage from "./briefing-library";
import ConfidenceDashboardPage from "./confidence-dashboard";
import CustomBriefBuilderPage from "./custom-brief-builder";
import DissentChannelPage from "./dissent-channel";
import BriefDetailPage from "./brief-detail";
import PulseSettingsPage from "./settings";

const TAB_MAP: Record<string, () => ReactElement> = {
  library: BriefingLibraryPage,
  confidence: ConfidenceDashboardPage,
  builder: CustomBriefBuilderPage,
  dissent: DissentChannelPage,
  settings: PulseSettingsPage,
};

export default function PulsePage() {
  const { tab, id } = useParams<{ tab?: string; id?: string }>();

  let content: ReactElement;
  if (id) {
    content = <BriefDetailPage />;
  } else if (tab && TAB_MAP[tab]) {
    const TabComponent = TAB_MAP[tab]!;
    content = <TabComponent />;
  } else {
    content = <DailyBriefPage />;
  }

  return <PulseLayout>{content}</PulseLayout>;
}
