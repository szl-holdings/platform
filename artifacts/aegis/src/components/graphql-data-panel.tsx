import { GraphQLDataPanel } from "@szl-holdings/shared-ui";
import { useFirestormAssessments, useFirestormIncidents } from "@szl-holdings/graphql-client/hooks";

export function AegisGraphQLPanel() {
  const { data: assessmentsData, loading: aLoading } = useFirestormAssessments({ limit: 3 });
  const { data: incidentsData, loading: iLoading } = useFirestormIncidents({ limit: 3 });

  return (
    <GraphQLDataPanel
      accentColor="rgb(248, 113, 113)"
      loading={aLoading && iLoading}
      sections={[
        {
          label: "Active Assessments",
          items: assessmentsData?.firestormAssessments ?? [],
          renderItem: (a: { id: string; name: string; assessmentType: string; status: string; overallRiskScore: number | null }) => (
            <div key={a.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 truncate max-w-[200px]">{a.name}</span>
              <span className="text-zinc-500">{a.status}</span>
            </div>
          ),
        },
        {
          label: "Recent Incidents",
          items: incidentsData?.firestormIncidents ?? [],
          renderItem: (i: { id: string; title: string; severity: string; status: string }) => (
            <div key={i.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 truncate max-w-[200px]">{i.title}</span>
              <span className="text-zinc-500">{i.severity}</span>
            </div>
          ),
        },
      ]}
    />
  );
}
