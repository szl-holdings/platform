import { useVessels, useVesselEvents } from "@szl-holdings/graphql-client/hooks";

export function VesselsGraphQLPanel() {
  const { data: vesselsData, loading: vesselsLoading } = useVessels({ limit: 3 });
  const { data: eventsData, loading: eventsLoading } = useVesselEvents({ limit: 3 });

  if (vesselsLoading && eventsLoading) return null;

  const vessels = vesselsData?.vessels ?? [];
  const events = eventsData?.vesselEvents ?? [];

  if (vessels.length === 0 && events.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">GraphQL Live Data</span>
      </div>
      {vessels.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Tracked Vessels</p>
          <div className="space-y-1">
            {vessels.map((v: { id: string; name: string; vesselType: string; status: string }) => (
              <div key={v.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{v.name}</span>
                <span className="text-zinc-500">{v.vesselType ?? "—"} · {v.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {events.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Recent Events</p>
          <div className="space-y-1">
            {events.map((e: { id: string; eventType: string; severity: string; status: string }) => (
              <div key={e.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{e.eventType}</span>
                <span className="text-zinc-500">{e.severity} · {e.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
