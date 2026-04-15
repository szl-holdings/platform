import { GraphQLDataPanel } from "@szl-holdings/shared-ui";
import { useLyteSignals, useLyteActions } from "@szl-holdings/graphql-client/hooks";

export function LyteGraphQLPanel() {
  const { data: signalsData, loading: sLoading } = useLyteSignals({ limit: 3 });
  const { data: actionsData, loading: aLoading } = useLyteActions({ limit: 3 });

  return (
    <GraphQLDataPanel
      accentColor="rgb(167, 139, 250)"
      loading={sLoading && aLoading}
      sections={[
        {
          label: "Active Signals",
          items: signalsData?.lyteSignals ?? [],
          renderItem: (s: { id: string; title: string; source: string; severity: string; status: string }) => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 truncate max-w-[200px]">{s.title}</span>
              <span className="text-zinc-500">{s.severity}</span>
            </div>
          ),
        },
        {
          label: "Pending Actions",
          items: actionsData?.lyteActions ?? [],
          renderItem: (a: { id: string; state: string; priority: string; valueAtRisk: number | null }) => (
            <div key={a.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{a.state}</span>
              <span className="text-zinc-500">P{a.priority} · VAR: {a.valueAtRisk ?? "—"}</span>
            </div>
          ),
        },
      ]}
    />
  );
}
