import { GraphQLPanelShell } from "@szl-holdings/shared-ui";
import { useStephenCaseStudies, useStephenContentBlocks } from "@szl-holdings/graphql-client/hooks";

export function StephenGraphQLPanel() {
  const { data: caseStudiesData, loading: csLoading } = useStephenCaseStudies({ limit: 3 });
  const { data: contentData, loading: cbLoading } = useStephenContentBlocks({ featured: true, limit: 3 });

  if (csLoading && cbLoading) return null;

  const caseStudies = caseStudiesData?.stephenCaseStudies ?? [];
  const contentBlocks = contentData?.stephenContentBlocks ?? [];

  if (caseStudies.length === 0 && contentBlocks.length === 0) return null;

  return (
    <GraphQLPanelShell dotColor="bg-blue-400">
      {caseStudies.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Case Studies</p>
          <div className="space-y-1">
            {caseStudies.map((cs: { id: string; title: string; slug: string; summary: string | null }) => (
              <div key={cs.id} className="text-xs">
                <span className="text-zinc-300">{cs.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {contentBlocks.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Featured Content</p>
          <div className="space-y-1">
            {contentBlocks.map((cb: { id: string; title: string; type: string }) => (
              <div key={cb.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{cb.title}</span>
                <span className="text-zinc-500">{cb.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GraphQLPanelShell>
  );
}
