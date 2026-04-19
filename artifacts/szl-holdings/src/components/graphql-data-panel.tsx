import { GraphQLDataPanel } from "@szl-holdings/shared-ui/design-system";
import { useHoldingsVentures } from "@szl-holdings/graphql-client/hooks";

export function HoldingsGraphQLPanel() {
  const { data, loading } = useHoldingsVentures({ limit: 5 });

  return (
    <GraphQLDataPanel
      accentColor="rgb(251, 191, 36)"
      loading={loading}
      sections={[
        {
          label: "Portfolio Ventures",
          items: data?.holdingsVentures ?? [],
          renderItem: (v: { id: string; name: string; slug: string; status: string; sector: string | null }) => (
            <div key={v.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{v.name}</span>
              <span className="text-zinc-500">{v.sector ?? "—"} · {v.status}</span>
            </div>
          ),
        },
      ]}
    />
  );
}
