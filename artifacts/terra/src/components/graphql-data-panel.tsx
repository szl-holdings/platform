import { GraphQLDataPanel } from "@szl-holdings/shared-ui";
import { useTerraDeals, useTerraLeads } from "@szl-holdings/graphql-client/hooks";

export function TerraGraphQLPanel() {
  const { data: dealsData, loading: dealsLoading } = useTerraDeals({ limit: 3 });
  const { data: leadsData, loading: leadsLoading } = useTerraLeads({ limit: 3 });

  return (
    <GraphQLDataPanel
      accentColor="rgb(52, 211, 153)"
      loading={dealsLoading && leadsLoading}
      sections={[
        {
          label: "Recent Deals",
          items: dealsData?.terraDeals ?? [],
          renderItem: (deal: { id: string; address: string; stage: string; price: number | null }) => (
            <div key={deal.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 truncate max-w-[200px]">{deal.address}</span>
              <span className="text-zinc-500 ml-2">{deal.stage}</span>
            </div>
          ),
        },
        {
          label: "Recent Leads",
          items: leadsData?.terraLeads ?? [],
          renderItem: (lead: { id: string; firstName: string; lastName: string; score: number | null }) => (
            <div key={lead.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{lead.firstName} {lead.lastName}</span>
              <span className="text-zinc-500">Score: {lead.score ?? "—"}</span>
            </div>
          ),
        },
      ]}
    />
  );
}
