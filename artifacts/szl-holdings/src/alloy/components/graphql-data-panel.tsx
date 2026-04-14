import { useAlloyWorkflows, useAlloySignals } from "@szl-holdings/graphql-client/hooks";

export function AlloyGraphQLPanel() {
  const { data: workflowsData, loading: wLoading } = useAlloyWorkflows({ limit: 3 });
  const { data: signalsData, loading: sLoading } = useAlloySignals({ limit: 3 });

  if (wLoading && sLoading) return null;

  const workflows = workflowsData?.alloyWorkflows ?? [];
  const signals = signalsData?.alloySignals ?? [];

  if (workflows.length === 0 && signals.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">GraphQL Live Data</span>
      </div>
      {workflows.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Active Workflows</p>
          <div className="space-y-1">
            {workflows.map((w: { id: string; name: string; type: string; status: string; priority: string }) => (
              <div key={w.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 truncate max-w-[200px]">{w.name}</span>
                <span className="text-zinc-500">{w.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {signals.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Recent Signals</p>
          <div className="space-y-1">
            {signals.map((s: { id: string; source: string; severity: string; status: string; domain: string }) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{s.source}</span>
                <span className="text-zinc-500">{s.severity} · {s.domain}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
