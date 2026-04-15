import { GraphQLDataPanel } from "@szl-holdings/shared-ui";
import { useStephenCaseStudies, useStephenContentBlocks } from "@szl-holdings/graphql-client/hooks";

export function StephenGraphQLPanel() {
  const { data: caseStudiesData, loading: csLoading } = useStephenCaseStudies({ limit: 3 });
  const { data: contentData, loading: cbLoading } = useStephenContentBlocks({ featured: true, limit: 3 });

  return (
    <GraphQLDataPanel
      accentColor="rgb(96, 165, 250)"
      loading={csLoading && cbLoading}
      sections={[
        {
          label: "Case Studies",
          items: caseStudiesData?.stephenCaseStudies ?? [],
          renderItem: (cs: { id: string; title: string; slug: string; summary: string | null }) => (
            <div key={cs.id} className="text-xs">
              <span className="text-zinc-300">{cs.title}</span>
            </div>
          ),
        },
        {
          label: "Featured Content",
          items: contentData?.stephenContentBlocks ?? [],
          renderItem: (cb: { id: string; title: string; type: string }) => (
            <div key={cb.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{cb.title}</span>
              <span className="text-zinc-500">{cb.type}</span>
            </div>
          ),
        },
      ]}
    />
  );
}
