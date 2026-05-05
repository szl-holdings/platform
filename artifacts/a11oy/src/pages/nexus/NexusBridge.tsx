import { NexusApiPending } from './NexusApiPending';

export default function NexusBridge() {
  return (
    <NexusApiPending
      endpoint="GET /api/nexus/bridge/tools"
      description="The NEXUS Bridge surfaces MCP tool catalogs and live call routing across Figma, GitHub, Claude, and custom adapters. Connect the backend to load registered tools and execute protocol-bridged calls."
    />
  );
}
