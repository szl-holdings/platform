import { useHoldingsVentures } from "@workspace/graphql-client/hooks";

export function HoldingsGraphQLPanel() {
  const { data, loading } = useHoldingsVentures({ limit: 5 });

  if (loading) return null;

  const ventures = data?.holdingsVentures ?? [];

  if (ventures.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">GraphQL Live Data</span>
      </div>
      <div>
        <p className="text-xs text-zinc-500 mb-1">Portfolio Ventures</p>
        <div className="space-y-1">
          {ventures.map((v: { id: string; name: string; slug: string; status: string; sector: string | null }) => (
            <div key={v.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{v.name}</span>
              <span className="text-zinc-500">{v.sector ?? "—"} · {v.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
