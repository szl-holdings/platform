import { NexusApiPending } from './NexusApiPending';

export default function PromptRegistry() {
  return (
    <NexusApiPending
      endpoint="GET /api/nexus/prompts"
      description="The NEXUS Prompt Registry maintains versioned prompt templates with diff tracking, domain tagging, and eval linkage. Connect the backend to browse, compare versions, and promote prompts to production."
    />
  );
}
