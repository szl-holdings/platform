import type { DomainConfig } from "../types.js";

export const firestormConfig: DomainConfig = {
  appSlug: "firestorm",
  appName: "Firestorm Security Simulation",
  domain: "cybersecurity",
  description: "Threat detection, incident response, and security posture observability",
  connectors: ["ai", "slack"],
  metrics: [
    { id: "threat_detection_rate", name: "Threat Detection Rate", description: "Threats identified per hour", unit: "/hr", pillar: "performance", type: "counter" },
    { id: "detection_latency", name: "Detection Latency", description: "Time from threat emergence to detection", unit: "ms", pillar: "performance", type: "histogram", thresholds: { warning: 500, critical: 2000, direction: "above" } },
    { id: "rule_eval_time", name: "Rule Evaluation Time", description: "Time to evaluate security rule set", unit: "ms", pillar: "performance", type: "histogram" },
    { id: "mttc", name: "Mean Time to Containment", description: "Average time to contain security threats", unit: "seconds", pillar: "business", type: "gauge", thresholds: { warning: 300, critical: 600, direction: "above" } },
    { id: "vuln_remediation_velocity", name: "Vulnerability Remediation Velocity", description: "Rate of vulnerability resolution", unit: "/hr", pillar: "business", type: "gauge" },
    { id: "compliance_score", name: "Compliance Posture Score", description: "Overall regulatory compliance rating", unit: "score", pillar: "business", type: "gauge", thresholds: { warning: 70, critical: 50, direction: "below" } },
    { id: "false_positive_rate", name: "False Positive Rate", description: "Percentage of false positive detections", unit: "%", pillar: "business", type: "gauge", thresholds: { warning: 20, critical: 40, direction: "above" } },
    { id: "soc_dashboard_load", name: "SOC Dashboard Load Time", description: "Security operations center render time", unit: "ms", pillar: "userExperience", type: "histogram" },
    { id: "analyst_workflow_time", name: "Analyst Workflow Completion", description: "Time for analysts to complete investigation workflow", unit: "seconds", pillar: "userExperience", type: "gauge" },
    { id: "incident_triage_efficiency", name: "Incident Triage Efficiency", description: "Speed and accuracy of incident prioritization", unit: "score", pillar: "userExperience", type: "gauge" },
    { id: "threat_forecast_accuracy", name: "Threat Forecast Accuracy", description: "Predictive model accuracy for threat patterns", unit: "%", pillar: "predictiveHealth", type: "gauge" },
    { id: "anomaly_baseline_drift", name: "Anomaly Baseline Drift", description: "Drift from established behavioral baselines", unit: "%", pillar: "predictiveHealth", type: "gauge" },
    { id: "mitre_coverage", name: "MITRE ATT&CK Coverage", description: "Percentage of MITRE techniques with detection rules", unit: "%", pillar: "operational", type: "gauge" },
    { id: "integration_health", name: "Threat Intel Feed Health", description: "Status of threat intelligence integrations", unit: "score", pillar: "operational", type: "gauge" },
    { id: "risk_reduction_roi", name: "Risk Reduction ROI", description: "Return on security investment via risk reduction", unit: "score", pillar: "strategic", type: "gauge" },
    { id: "security_maturity", name: "Security Maturity Index", description: "Organization security maturity level", unit: "score", pillar: "strategic", type: "gauge" },
      { id: "threat_surface_score", name: "Threat Surface Score", description: "Composite attack surface exposure rating", unit: "score", pillar: "securityPosture", type: "gauge", thresholds: { warning: 60, critical: 40, direction: "below" } },
      { id: "compliance_drift", name: "Compliance Drift Index", description: "Deviation from baseline compliance posture", unit: "%", pillar: "securityPosture", type: "gauge", thresholds: { warning: 10, critical: 25, direction: "above" } },
      { id: "vulnerability_mttr", name: "Vulnerability MTTR", description: "Mean time to remediate discovered vulnerabilities", unit: "seconds", pillar: "securityPosture", type: "gauge" },
      { id: "deploy_frequency", name: "Deployment Frequency", description: "Deployments per day", unit: "count", pillar: "innovationVelocity", type: "counter" },
      { id: "change_failure_rate", name: "Change Failure Rate", description: "Percentage of deployments causing incidents", unit: "%", pillar: "innovationVelocity", type: "gauge", thresholds: { warning: 15, critical: 30, direction: "above" } },
      { id: "lead_time_changes", name: "Lead Time for Changes", description: "Time from commit to production", unit: "seconds", pillar: "innovationVelocity", type: "gauge" },
      { id: "mttr", name: "Mean Time to Recovery", description: "Average time to restore service after incident", unit: "seconds", pillar: "innovationVelocity", type: "gauge", thresholds: { warning: 3600, critical: 14400, direction: "above" } },
  ],
  kpis: [
    { id: "detection_rate", name: "Detection Rate", pillar: "performance", format: "number", target: 50 },
    { id: "containment_time", name: "Mean Containment Time", pillar: "business", format: "duration", target: 300 },
    { id: "compliance", name: "Compliance Score", pillar: "business", format: "score", target: 85 },
  
      { id: "security_score", name: "Security Posture Score", pillar: "securityPosture", format: "score", target: 85 },
      { id: "deploy_freq", name: "Deploy Frequency", pillar: "innovationVelocity", format: "number", target: 5 },
  ],
  healthSignals: [
    { id: "high_severity_unresolved", name: "Critical Threat Unresolved", pillar: "operational", severity: "critical", condition: "Critical severity finding open > 1hr" },
    { id: "feed_down", name: "Threat Intel Feed Down", pillar: "operational", severity: "warning", condition: "Threat intelligence feed unavailable" },
  
      { id: "compliance_drift", name: "Compliance Drift Detected", pillar: "securityPosture", severity: "warning", condition: "Compliance deviation > 10%" },
      { id: "high_failure_rate", name: "High Change Failure Rate", pillar: "innovationVelocity", severity: "critical", condition: "Change failure rate > 30%" },
  ],
};
