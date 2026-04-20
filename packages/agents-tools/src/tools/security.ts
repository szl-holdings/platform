import {
  ALERT_ESCALATION_TOOL_MANIFEST,
  AlertEscalationInputSchema,
  alertEscalationHandler,
  COMPLIANCE_CHECK_TOOL_MANIFEST,
  ComplianceCheckInputSchema,
  complianceCheckHandler,
  INCIDENT_CONTAINMENT_TOOL_MANIFEST,
  IncidentContainmentInputSchema,
  incidentContainmentHandler,
  THREAT_SCAN_TOOL_MANIFEST,
  ThreatScanInputSchema,
  threatScanHandler,
  VULNERABILITY_REPORT_TOOL_MANIFEST,
  VulnerabilityReportInputSchema,
  vulnerabilityReportHandler,
} from '@workspace/tool-mesh/tools/security-tools';
import { z } from 'zod';
import { defineTool } from '../typed-tool.js';

const GenericOutputSchema = z.record(z.unknown());

export const threatScanTool = defineTool({
  manifest: THREAT_SCAN_TOOL_MANIFEST,
  inputSchema: ThreatScanInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) => threatScanHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export const alertEscalationTool = defineTool({
  manifest: ALERT_ESCALATION_TOOL_MANIFEST,
  inputSchema: AlertEscalationInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) => alertEscalationHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export const complianceCheckTool = defineTool({
  manifest: COMPLIANCE_CHECK_TOOL_MANIFEST,
  inputSchema: ComplianceCheckInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) => complianceCheckHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export const incidentContainmentTool = defineTool({
  manifest: INCIDENT_CONTAINMENT_TOOL_MANIFEST,
  inputSchema: IncidentContainmentInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) =>
    incidentContainmentHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export const vulnerabilityReportTool = defineTool({
  manifest: VULNERABILITY_REPORT_TOOL_MANIFEST,
  inputSchema: VulnerabilityReportInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) =>
    vulnerabilityReportHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export {
  AlertEscalationInputSchema,
  ComplianceCheckInputSchema,
  IncidentContainmentInputSchema,
  ThreatScanInputSchema,
  VulnerabilityReportInputSchema,
};
