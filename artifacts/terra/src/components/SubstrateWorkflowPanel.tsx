import {
  productAccent,
  SubstrateWorkflowPanel as SharedSubstrateWorkflowPanel,
} from '@szl-holdings/design-system';

export function SubstrateWorkflowPanel() {
  return (
    <SharedSubstrateWorkflowPanel
      workflowId="terra-portfolio-anomaly"
      title="Portfolio Anomaly and Event Intelligence"
      subtitle="Substrate · terra-portfolio-anomaly · Phase 2"
      description="Monitors the portfolio for distress signals, AVM outliers, and tenant risk events. Operator approval required before portfolio actions."
      accentColor={productAccent.terra}
      workflowInput={{
        portfolioId: 'TERRA-PORT-001',
        propertyIds: ['TERRA-NYC-0441', 'TERRA-MIA-0102'],
        lookbackDays: 90,
      }}
      defaultConfidence={0.82}
      dryRunNote="DRY-RUN — financial writes and notifications suppressed."
      pendingApprovalNote="PENDING APPROVAL — paused at approval gate. Review the approvals inbox to resume."
    />
  );
}
