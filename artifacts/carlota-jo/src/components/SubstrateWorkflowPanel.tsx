import {
  productAccent,
  SubstrateWorkflowPanel as SharedSubstrateWorkflowPanel,
} from '@szl-holdings/design-system';

export function SubstrateWorkflowPanel({
  clientId,
  taskTitle,
}: {
  clientId?: string;
  taskTitle?: string;
}) {
  return (
    <SharedSubstrateWorkflowPanel
      workflowId="carlota-jo-task-routing"
      title="White-Glove Task Routing"
      subtitle="Substrate · carlota-jo-task-routing · Phase 2"
      description="Matches incoming client tasks to advisors by expertise and availability. Practice lead approval before assignment confirmation."
      accentColor={productAccent.carlota}
      workflowInput={{
        clientId: clientId ?? 'CLIENT-MERIDIAN-001',
        taskTitle: taskTitle ?? 'Strategic diagnostic and competitive positioning review',
        taskDescription:
          'Full market positioning diagnostic with competitive benchmarking and capability gap analysis for Q3 strategic roadmap.',
        taskType: 'strategic-advisory',
        urgency: 'immediate',
      }}
      defaultConfidence={0.89}
      extraMetrics={[{ label: 'SLA', value: '48h' }]}
      dryRunNote="DRY-RUN — assignment and client notification suppressed."
      pendingApprovalNote="PENDING APPROVAL — paused at approval gate. Practice lead must review before routing commits."
    />
  );
}
