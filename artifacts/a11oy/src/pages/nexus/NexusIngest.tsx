import { NexusApiPending } from './NexusApiPending';

export default function Ingest() {
  return (
    <NexusApiPending
      endpoint="GET /api/nexus/ingest/repos"
      description="The NEXUS Ingest pipeline extracts skills, memory entries, and pattern atlas data from GitHub repositories and documentation sources. Connect the backend to queue repositories and monitor indexing progress."
    />
  );
}
