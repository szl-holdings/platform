import { GraphQLDataPanel } from "@szl-holdings/shared-ui";
import { useVessels, useVesselEvents } from "@szl-holdings/graphql-client/hooks";

export function VesselsGraphQLPanel() {
  const { data: vesselsData, loading: vesselsLoading } = useVessels({ limit: 3 });
  const { data: eventsData, loading: eventsLoading } = useVesselEvents({ limit: 3 });

  return (
    <GraphQLDataPanel
      accentColor="rgb(56, 189, 248)"
      loading={vesselsLoading && eventsLoading}
      sections={[
        {
          label: "Tracked Vessels",
          items: vesselsData?.vessels ?? [],
          renderItem: (v: { id: string; name: string; vesselType: string; status: string }) => (
            <div key={v.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{v.name}</span>
              <span className="text-zinc-500">{v.vesselType ?? "—"} · {v.status}</span>
            </div>
          ),
        },
        {
          label: "Recent Events",
          items: eventsData?.vesselEvents ?? [],
          renderItem: (e: { id: string; eventType: string; severity: string; status: string }) => (
            <div key={e.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{e.eventType}</span>
              <span className="text-zinc-500">{e.severity} · {e.status}</span>
            </div>
          ),
        },
      ]}
    />
  );
}
