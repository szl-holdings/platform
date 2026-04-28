import {
  productAccent,
  SubstrateWorkflowPanel as SharedSubstrateWorkflowPanel,
} from '@szl-holdings/design-system';

export function SubstrateWorkflowPanel() {
  return (
    <SharedSubstrateWorkflowPanel
      workflowId="vessels-voyage-anomaly"
      title="Voyage Event Anomaly Review"
      subtitle="Substrate · vessels-voyage-anomaly · Phase 2"
      description="Reviews AIS event streams for dark periods, STS transfers, and sanctions proximity. Operator approval required before case creation."
      accentColor={productAccent.vessels}
      workflowInput={{
        vesselIds: ['IMO-9876543', 'IMO-9234567'],
        lookbackHours: 720,
      }}
      defaultConfidence={0.81}
      dryRunNote="DRY-RUN — case creation and notifications suppressed."
      pendingApprovalNote="PENDING APPROVAL — paused at approval gate. Review the approvals inbox to resume."
    />
  );
}
