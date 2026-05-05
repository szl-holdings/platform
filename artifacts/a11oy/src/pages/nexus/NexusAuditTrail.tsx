import { NexusApiPending } from './NexusApiPending';

export default function AuditTrail() {
  return (
    <NexusApiPending
      endpoint="GET /api/nexus/audit"
      description="The NEXUS Audit Trail provides a cryptographically-linked log of every agent action, tool call, and decision. Connect the backend to stream verified audit entries with full intent and evidence chains."
    />
  );
}
