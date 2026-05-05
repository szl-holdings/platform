import { NexusApiPending } from './NexusApiPending';

export default function NexusEvalConsole() {
  return (
    <NexusApiPending
      endpoint="GET /api/nexus/eval/suites"
      description="The NEXUS Eval Console runs structured evaluation suites against deployed agent models, tracking pass rates, confidence scores, and red-team coverage. Connect the backend to load suites and trigger runs."
    />
  );
}
