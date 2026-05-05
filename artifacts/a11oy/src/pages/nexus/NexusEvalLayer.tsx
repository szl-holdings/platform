import { NexusApiPending } from './NexusApiPending';

export default function EvalLayer() {
  return (
    <NexusApiPending
      endpoint="GET /api/nexus/eval-layer/nodes"
      description="The NEXUS Eval Layer maps evaluation scores, leaderboard positions, and badge states across all deployed application nodes. Connect the backend to load live benchmark results and compliance attestations."
    />
  );
}
