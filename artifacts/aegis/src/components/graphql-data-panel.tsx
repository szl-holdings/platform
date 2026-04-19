import { GraphQLDataPanel } from "@szl-holdings/shared-ui/design-system";
import { useFirestormIncidents, useFirestormAssessments } from "@szl-holdings/graphql-client/hooks";

export function AegisGraphQLPanel() {
  const { data: incidentsData, loading: iLoading } = useFirestormIncidents({ limit: 4 });
  const { data: assessmentsData, loading: aLoading } = useFirestormAssessments({ limit: 3 });

  return (
    <GraphQLDataPanel
      accentColor="rgb(96, 165, 250)"
      loading={iLoading && aLoading}
      sections={[
        {
          label: "Active Incidents",
          items: incidentsData?.firestormIncidents ?? [],
          renderItem: (inc: { id: string; title: string; severity: string; status: string }) => (
            <div key={inc.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 truncate max-w-[160px]">{inc.title}</span>
              <span className="text-zinc-500">{inc.severity} · {inc.status}</span>
            </div>
          ),
        },
        {
          label: "Recent Assessments",
          items: assessmentsData?.firestormAssessments ?? [],
          renderItem: (a: { id: string; name: string; assessmentType: string; status: string }) => (
            <div key={a.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 truncate max-w-[160px]">{a.name}</span>
              <span className="text-zinc-500">{a.assessmentType} · {a.status}</span>
            </div>
          ),
        },
      ]}
    />
  );
}
