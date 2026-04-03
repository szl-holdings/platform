import { useTerraDeals, useTerraLeads } from "@workspace/graphql-client/hooks";

export function TerraGraphQLPanel() {
  const { data: dealsData, loading: dealsLoading } = useTerraDeals({ limit: 3 });
  const { data: leadsData, loading: leadsLoading } = useTerraLeads({ limit: 3 });

  if (dealsLoading && leadsLoading) return null;

  const deals = dealsData?.terraDeals ?? [];
  const leads = leadsData?.terraLeads ?? [];

  if (deals.length === 0 && leads.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">GraphQL Live Data</span>
      </div>
      {deals.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Recent Deals</p>
          <div className="space-y-1">
            {deals.map((deal: { id: string; address: string; stage: string; price: number | null }) => (
              <div key={deal.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 truncate max-w-[200px]">{deal.address}</span>
                <span className="text-zinc-500 ml-2">{deal.stage}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {leads.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Recent Leads</p>
          <div className="space-y-1">
            {leads.map((lead: { id: string; firstName: string; lastName: string; score: number | null }) => (
              <div key={lead.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{lead.firstName} {lead.lastName}</span>
                <span className="text-zinc-500">Score: {lead.score ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
