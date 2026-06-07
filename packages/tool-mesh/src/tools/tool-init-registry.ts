import type { ToolMeshGateway } from '../gateway.js';
import type { ToolRegistry } from '../registry.js';
import {
  alertEscalationHandler,
  ALERT_ESCALATION_TOOL_MANIFEST,
  complianceCheckHandler,
  COMPLIANCE_CHECK_TOOL_MANIFEST,
  incidentContainmentHandler,
  INCIDENT_CONTAINMENT_TOOL_MANIFEST,
  threatScanHandler,
  THREAT_SCAN_TOOL_MANIFEST,
  vulnerabilityReportHandler,
  VULNERABILITY_REPORT_TOOL_MANIFEST,
} from './security-tools.js';
import {
  budgetForecastHandler,
  BUDGET_FORECAST_TOOL_MANIFEST,
  fundTransferHandler,
  FUND_TRANSFER_TOOL_MANIFEST,
  portfolioSnapshotHandler,
  PORTFOLIO_SNAPSHOT_TOOL_MANIFEST,
  regulatoryFilingHandler,
  REGULATORY_FILING_TOOL_MANIFEST,
} from './finance-tools.js';
import {
  externalWebhookHandler,
  EXTERNAL_WEBHOOK_TOOL_MANIFEST,
  infraProvisionHandler,
  INFRA_PROVISION_TOOL_MANIFEST,
  metricsQueryHandler,
  METRICS_QUERY_TOOL_MANIFEST,
  notificationSendHandler,
  NOTIFICATION_SEND_TOOL_MANIFEST,
  workflowTriggerHandler,
  WORKFLOW_TRIGGER_TOOL_MANIFEST,
} from './operations-tools.js';
import { graphQueryHandler, GRAPH_QUERY_TOOL_MANIFEST } from './graph-query.js';
import { documentRetrievalHandler, DOCUMENT_RETRIEVAL_TOOL_MANIFEST } from './document-retrieval.js';
import { initDomainDataTools } from './domain-data-tools.js';

const TOOL_ENTRIES = [
  { manifest: THREAT_SCAN_TOOL_MANIFEST, handler: threatScanHandler },
  { manifest: ALERT_ESCALATION_TOOL_MANIFEST, handler: alertEscalationHandler },
  { manifest: COMPLIANCE_CHECK_TOOL_MANIFEST, handler: complianceCheckHandler },
  { manifest: INCIDENT_CONTAINMENT_TOOL_MANIFEST, handler: incidentContainmentHandler },
  { manifest: VULNERABILITY_REPORT_TOOL_MANIFEST, handler: vulnerabilityReportHandler },
  { manifest: FUND_TRANSFER_TOOL_MANIFEST, handler: fundTransferHandler },
  { manifest: PORTFOLIO_SNAPSHOT_TOOL_MANIFEST, handler: portfolioSnapshotHandler },
  { manifest: BUDGET_FORECAST_TOOL_MANIFEST, handler: budgetForecastHandler },
  { manifest: REGULATORY_FILING_TOOL_MANIFEST, handler: regulatoryFilingHandler },
  { manifest: METRICS_QUERY_TOOL_MANIFEST, handler: metricsQueryHandler },
  { manifest: WORKFLOW_TRIGGER_TOOL_MANIFEST, handler: workflowTriggerHandler },
  { manifest: NOTIFICATION_SEND_TOOL_MANIFEST, handler: notificationSendHandler },
  { manifest: EXTERNAL_WEBHOOK_TOOL_MANIFEST, handler: externalWebhookHandler },
  { manifest: INFRA_PROVISION_TOOL_MANIFEST, handler: infraProvisionHandler },
  { manifest: GRAPH_QUERY_TOOL_MANIFEST, handler: graphQueryHandler },
  { manifest: DOCUMENT_RETRIEVAL_TOOL_MANIFEST, handler: documentRetrievalHandler },
] as const;

export function initAllToolMeshHandlers(gateway: ToolMeshGateway, registry: ToolRegistry): void {
  initDomainDataTools(gateway, registry);

  for (const { manifest, handler } of TOOL_ENTRIES) {
    if (registry.get(manifest.id)) continue;
    registry.register(manifest);
    gateway.registerHandler(manifest.id, handler);
  }
}
