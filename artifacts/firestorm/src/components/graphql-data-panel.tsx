import { useFirestormAssessments, useFirestormIncidents } from "@szl-holdings/graphql-client/hooks";

export function FirestormGraphQLPanel() {
  const { data: assessmentsData, loading: aLoading } = useFirestormAssessments({ limit: 3 });
  const { data: incidentsData, loading: iLoading } = useFirestormIncidents({ limit: 3 });

  if (aLoading && iLoading) return null;

  const assessments = assessmentsData?.firestormAssessments ?? [];
  const incidents = incidentsData?.firestormIncidents ?? [];

  if (assessments.length === 0 && incidents.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">GraphQL Live Data</span>
      </div>
      {assessments.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Active Assessments</p>
          <div className="space-y-1">
            {assessments.map((a: { id: string; name: string; assessmentType: string; status: string; overallRiskScore: number | null }) => (
              <div key={a.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 truncate max-w-[200px]">{a.name}</span>
                <span className="text-zinc-500">{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {incidents.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Recent Incidents</p>
          <div className="space-y-1">
            {incidents.map((i: { id: string; title: string; severity: string; status: string }) => (
              <div key={i.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 truncate max-w-[200px]">{i.title}</span>
                <span className="text-zinc-500">{i.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
