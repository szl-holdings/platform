import {
  EXTERNAL_WEBHOOK_TOOL_MANIFEST,
  ExternalWebhookCallInputSchema,
  externalWebhookHandler,
  INFRA_PROVISION_TOOL_MANIFEST,
  InfraProvisionInputSchema,
  infraProvisionHandler,
  METRICS_QUERY_TOOL_MANIFEST,
  MetricsQueryInputSchema,
  metricsQueryHandler,
  NOTIFICATION_SEND_TOOL_MANIFEST,
  NotificationSendInputSchema,
  notificationSendHandler,
  WORKFLOW_TRIGGER_TOOL_MANIFEST,
  WorkflowTriggerInputSchema,
  workflowTriggerHandler,
} from '@workspace/tool-mesh/tools/operations-tools';
import { z } from 'zod';
import { defineTool } from '../typed-tool.js';

const GenericOutputSchema = z.record(z.unknown());

export const metricsQueryTool = defineTool({
  manifest: METRICS_QUERY_TOOL_MANIFEST,
  inputSchema: MetricsQueryInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) => metricsQueryHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export const workflowTriggerTool = defineTool({
  manifest: WORKFLOW_TRIGGER_TOOL_MANIFEST,
  inputSchema: WorkflowTriggerInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) => workflowTriggerHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export const notificationSendTool = defineTool({
  manifest: NOTIFICATION_SEND_TOOL_MANIFEST,
  inputSchema: NotificationSendInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) =>
    notificationSendHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export const externalWebhookTool = defineTool({
  manifest: EXTERNAL_WEBHOOK_TOOL_MANIFEST,
  inputSchema: ExternalWebhookCallInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) => externalWebhookHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export const infraProvisionTool = defineTool({
  manifest: INFRA_PROVISION_TOOL_MANIFEST,
  inputSchema: InfraProvisionInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) => infraProvisionHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export {
  ExternalWebhookCallInputSchema,
  InfraProvisionInputSchema,
  MetricsQueryInputSchema,
  NotificationSendInputSchema,
  WorkflowTriggerInputSchema,
};
