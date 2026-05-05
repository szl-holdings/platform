import { NexusApiPending } from './NexusApiPending';

export default function Marketplace() {
  return (
    <NexusApiPending
      endpoint="GET /api/nexus/marketplace/servers"
      description="The NEXUS Marketplace lists registered MCP server packages — both SZL-curated and community-contributed — available for governed AI workflows. Connect the backend to browse, filter, and install tool adapters."
    />
  );
}
