import {
  productAccent,
  SubstrateWorkflowPanel as SharedSubstrateWorkflowPanel,
} from '@szl-holdings/design-system';

export function SubstrateWorkflowPanel() {
  return (
    <SharedSubstrateWorkflowPanel
      workflowId="lyte-operational-drift"
      title="Operational Drift Review"
      subtitle="Substrate · lyte-operational-drift · Phase 2"
      description="Detects SLO creep, configuration divergence, and capacity trends. Requires operator approval before corrective actions."
      accentColor={productAccent.lyte}
      workflowInput={{
        services: ['all'],
        lookbackHours: 72,
        driftThreshold: 0.15,
      }}
      defaultConfidence={0.84}
      dryRunNote="DRY-RUN — all writes suppressed. Switch to live mode to commit corrections."
      pendingApprovalNote="PENDING APPROVAL — run is paused at approval gate. Check the approvals inbox to resume."
    />
  );
}
