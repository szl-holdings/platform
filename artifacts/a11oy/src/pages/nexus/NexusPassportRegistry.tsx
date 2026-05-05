import { NexusApiPending } from './NexusApiPending';

export default function PassportRegistry() {
  return (
    <NexusApiPending
      endpoint="GET /api/nexus/passports"
      description="The NEXUS Passport Registry tracks model passport entries — capability declarations, policy lenses, proof bundles, and compliance state — for every AI model deployed in the governed fabric. Connect the backend to inspect model provenance."
    />
  );
}
