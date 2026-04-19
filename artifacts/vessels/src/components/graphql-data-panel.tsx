import { GraphQLDataPanel } from "@szl-holdings/shared-ui/design-system";
import { useVessels, useVesselEvents } from "@szl-holdings/graphql-client/hooks";

export function VesselsGraphQLPanel() {
  const { data: vesselsData, loading: vLoading } = useVessels({ limit: 4 });
  const { data: eventsData, loading: eLoading } = useVesselEvents({ limit: 3 });

  return (
    <GraphQLDataPanel
      accentColor="rgb(14, 165, 233)"
      loading={vLoading && eLoading}
      sections={[
        {
          label: "Fleet",
          items: vesselsData?.vessels ?? [],
          renderItem: (v: { id: string; name: string; vesselType: string; status: string }) => (
            <div key={v.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 truncate max-w-[160px]">{v.name}</span>
              <span className="text-zinc-500">{v.vesselType} · {v.status}</span>
            </div>
          ),
        },
        {
          label: "Recent Events",
          items: eventsData?.vesselEvents ?? [],
          renderItem: (e: { id: string; severity: string; vesselId: string; createdAt: string }) => (
            <div key={e.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-mono">{e.vesselId.slice(-8).toUpperCase()}</span>
              <span className="text-zinc-500">{e.severity}</span>
            </div>
          ),
        },
      ]}
    />
  );
}
