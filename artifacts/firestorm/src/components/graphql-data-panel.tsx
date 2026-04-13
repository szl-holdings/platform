import { GraphQLPanelShell } from "@szl-holdings/shared-ui";
import { useFirestormAssessments, useFirestormIncidents } from "@szl-holdings/graphql-client/hooks";

export function FirestormGraphQLPanel() {
  const { data: assessmentsData, loading: aLoading } = useFirestormAssessments({ limit: 3 });
  const { data: incidentsData, loading: iLoading } = useFirestormIncidents({ limit: 3 });

  if (aLoading && iLoading) return null;

  const assessments = assessmentsData?.firestormAssessments ?? [];
  const incidents = incidentsData?.firestormIncidents ?? [];

  if (assessments.length === 0 && incidents.length === 0) return null;

  return (
    <GraphQLPanelShell dotColor="bg-red-400">
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
    </GraphQLPanelShell>
  );
}
