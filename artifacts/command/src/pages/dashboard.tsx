import { Header } from "../components/header";
import { EcosystemPulse } from "../components/ecosystem-pulse";
import { DomainGrid } from "../components/domain-grid";
import { Timeline } from "../components/timeline";
import { IntelligencePanel } from "../components/intelligence-panel";
import { CommandActions } from "../components/command-actions";
import { useEcosystemData } from "../hooks/use-ecosystem-data";
import { MorningBriefingCard, DEMO_BRIEFING_HISTORY } from "@szl-holdings/shared-ui";

export function Dashboard() {
  const { data, dataUpdatedAt } = useEcosystemData();

  if (!data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-fg-muted)" }}
      >
        <div className="text-xs font-mono uppercase tracking-widest animate-pulse">
          Aggregating ecosystem data...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-fg-primary)" }}
    >
      <Header lastUpdatedAt={dataUpdatedAt} />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-8">
        <EcosystemPulse
          domains={data.domains}
          compositeScore={data.compositeScore}
          compositeStatus={data.compositeStatus}
        />

        <DomainGrid domains={data.domains} />

        <MorningBriefingCard
          briefing={DEMO_BRIEFING_HISTORY[0]}
          accentColor="#8b7ac8"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <IntelligencePanel cards={data.intelligence} />
            <CommandActions actions={data.actions} />
          </div>
          <div className="lg:col-span-1 h-[600px] lg:h-auto">
            <Timeline events={data.timeline} />
          </div>
        </div>
      </main>
    </div>
  );
}
