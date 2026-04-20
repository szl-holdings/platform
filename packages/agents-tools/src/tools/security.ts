import { z } from "zod";
import {
  ThreatScanInputSchema,
  THREAT_SCAN_TOOL_MANIFEST,
  threatScanHandler,
  AlertEscalationInputSchema,
  ALERT_ESCALATION_TOOL_MANIFEST,
  alertEscalationHandler,
  ComplianceCheckInputSchema,
  COMPLIANCE_CHECK_TOOL_MANIFEST,
  complianceCheckHandler,
  IncidentContainmentInputSchema,
  INCIDENT_CONTAINMENT_TOOL_MANIFEST,
  incidentContainmentHandler,
  VulnerabilityReportInputSchema,
  VULNERABILITY_REPORT_TOOL_MANIFEST,
  vulnerabilityReportHandler,
} from "@workspace/tool-mesh/tools/security-tools";
import { defineTool } from "../typed-tool.js";

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
  handler: (input) => incidentContainmentHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export const vulnerabilityReportTool = defineTool({
  manifest: VULNERABILITY_REPORT_TOOL_MANIFEST,
  inputSchema: VulnerabilityReportInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) => vulnerabilityReportHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export {
  ThreatScanInputSchema,
  AlertEscalationInputSchema,
  ComplianceCheckInputSchema,
  IncidentContainmentInputSchema,
  VulnerabilityReportInputSchema,
};
