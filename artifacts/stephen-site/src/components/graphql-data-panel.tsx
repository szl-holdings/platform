import { useStephenCaseStudies, useStephenContentBlocks } from "@workspace/graphql-client/hooks";

export function StephenGraphQLPanel() {
  const { data: caseStudiesData, loading: csLoading } = useStephenCaseStudies({ limit: 3 });
  const { data: contentData, loading: cbLoading } = useStephenContentBlocks({ featured: true, limit: 3 });

  if (csLoading && cbLoading) return null;

  const caseStudies = caseStudiesData?.stephenCaseStudies ?? [];
  const contentBlocks = contentData?.stephenContentBlocks ?? [];

  if (caseStudies.length === 0 && contentBlocks.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">GraphQL Live Data</span>
      </div>
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
    </div>
  );
}
