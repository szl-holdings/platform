import { GraphQLPanelShell } from "@szl-holdings/shared-ui";
import { useLyteSignals, useLyteActions } from "@szl-holdings/graphql-client/hooks";

export function LyteGraphQLPanel() {
  const { data: signalsData, loading: sLoading } = useLyteSignals({ limit: 3 });
  const { data: actionsData, loading: aLoading } = useLyteActions({ limit: 3 });

  if (sLoading && aLoading) return null;

  const signals = signalsData?.lyteSignals ?? [];
  const actions = actionsData?.lyteActions ?? [];

  if (signals.length === 0 && actions.length === 0) return null;

  return (
    <GraphQLPanelShell dotColor="bg-violet-400">
      {signals.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Active Signals</p>
          <div className="space-y-1">
            {signals.map((s: { id: string; title: string; source: string; severity: string; status: string }) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 truncate max-w-[200px]">{s.title}</span>
                <span className="text-zinc-500">{s.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {actions.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Pending Actions</p>
          <div className="space-y-1">
            {actions.map((a: { id: string; state: string; priority: string; valueAtRisk: number | null }) => (
              <div key={a.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{a.state}</span>
                <span className="text-zinc-500">P{a.priority} · VAR: {a.valueAtRisk ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GraphQLPanelShell>
  );
}
