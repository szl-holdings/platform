import { GraphQLDataPanel } from "@szl-holdings/shared-ui";
import { useAlloyWorkflows, useAlloySignals } from "@szl-holdings/graphql-client/hooks";

export function AlloyGraphQLPanel() {
  const { data: workflowsData, loading: wLoading } = useAlloyWorkflows({ limit: 3 });
  const { data: signalsData, loading: sLoading } = useAlloySignals({ limit: 3 });

  return (
    <GraphQLDataPanel
      accentColor="rgb(129, 140, 248)"
      loading={wLoading && sLoading}
      sections={[
        {
          label: "Active Workflows",
          items: workflowsData?.alloyWorkflows ?? [],
          renderItem: (w: { id: string; name: string; type: string; status: string; priority: string }) => (
            <div key={w.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 truncate max-w-[200px]">{w.name}</span>
              <span className="text-zinc-500">{w.status}</span>
            </div>
          ),
        },
        {
          label: "Recent Signals",
          items: signalsData?.alloySignals ?? [],
          renderItem: (s: { id: string; source: string; severity: string; status: string; domain: string }) => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{s.source}</span>
              <span className="text-zinc-500">{s.severity} · {s.domain}</span>
            </div>
          ),
        },
      ]}
    />
  );
}
