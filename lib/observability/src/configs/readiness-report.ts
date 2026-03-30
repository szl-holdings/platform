import type { DomainConfig } from "../types.js";

export const readinessReportConfig: DomainConfig = {
  appSlug: "readiness-report",
  appName: "Readiness Report",
  domain: "readiness-assessment",
  description: "Assessment pipeline, readiness scoring, and evaluation quality observability",
  connectors: ["ai", "notion"],
  metrics: [
    { id: "assessment_processing_time", name: "Assessment Processing Time", description: "Time to process readiness assessments", unit: "ms", pillar: "performance", type: "histogram", thresholds: { warning: 3000, critical: 8000, direction: "above" } },
    { id: "report_render_time", name: "Report Render Time", description: "Time to render readiness reports", unit: "ms", pillar: "performance", type: "histogram" },
    { id: "scoring_engine_latency", name: "Scoring Engine Latency", description: "Readiness score calculation time", unit: "ms", pillar: "performance", type: "histogram" },
    { id: "assessment_completion_rate", name: "Assessment Completion Rate", description: "Percentage of assessments fully completed", unit: "%", pillar: "business", type: "gauge", thresholds: { warning: 70, critical: 50, direction: "below" } },
    { id: "readiness_score_trend", name: "Readiness Score Trend", description: "Average readiness score over time", unit: "score", pillar: "business", type: "gauge" },
    { id: "evaluation_throughput", name: "Evaluation Throughput", description: "Assessments completed per day", unit: "count", pillar: "business", type: "counter" },
    { id: "survey_completion_time", name: "Survey Completion Time", description: "Average time to complete assessment survey", unit: "seconds", pillar: "userExperience", type: "gauge" },
    { id: "report_clarity_score", name: "Report Clarity Score", description: "User comprehension rating of reports", unit: "score", pillar: "userExperience", type: "gauge" },
    { id: "action_item_follow_through", name: "Action Item Follow-Through", description: "Rate of recommended actions completed", unit: "%", pillar: "userExperience", type: "gauge" },
    { id: "readiness_trajectory", name: "Readiness Trajectory Prediction", description: "Predicted readiness score trajectory", unit: "score", pillar: "predictiveHealth", type: "gauge" },
    { id: "gap_identification_accuracy", name: "Gap Identification Accuracy", description: "Accuracy of identified readiness gaps", unit: "%", pillar: "predictiveHealth", type: "gauge" },
    { id: "assessment_engine_health", name: "Assessment Engine Health", description: "Core assessment engine availability", unit: "score", pillar: "operational", type: "gauge" },
    { id: "data_integrity", name: "Data Integrity Score", description: "Assessment data quality and consistency", unit: "score", pillar: "operational", type: "gauge" },
    { id: "organizational_readiness", name: "Organizational Readiness Index", description: "Aggregate organizational readiness level", unit: "score", pillar: "strategic", type: "gauge" },
    { id: "improvement_velocity", name: "Improvement Velocity", description: "Rate of readiness improvement over time", unit: "score", pillar: "strategic", type: "gauge" },
      { id: "threat_surface_score", name: "Threat Surface Score", description: "Composite attack surface exposure rating", unit: "score", pillar: "securityPosture", type: "gauge", thresholds: { warning: 60, critical: 40, direction: "below" } },
      { id: "compliance_drift", name: "Compliance Drift Index", description: "Deviation from baseline compliance posture", unit: "%", pillar: "securityPosture", type: "gauge", thresholds: { warning: 10, critical: 25, direction: "above" } },
      { id: "vulnerability_mttr", name: "Vulnerability MTTR", description: "Mean time to remediate discovered vulnerabilities", unit: "seconds", pillar: "securityPosture", type: "gauge" },
      { id: "deploy_frequency", name: "Deployment Frequency", description: "Deployments per day", unit: "count", pillar: "innovationVelocity", type: "counter" },
      { id: "change_failure_rate", name: "Change Failure Rate", description: "Percentage of deployments causing incidents", unit: "%", pillar: "innovationVelocity", type: "gauge", thresholds: { warning: 15, critical: 30, direction: "above" } },
      { id: "lead_time_changes", name: "Lead Time for Changes", description: "Time from commit to production", unit: "seconds", pillar: "innovationVelocity", type: "gauge" },
      { id: "mttr", name: "Mean Time to Recovery", description: "Average time to restore service after incident", unit: "seconds", pillar: "innovationVelocity", type: "gauge", thresholds: { warning: 3600, critical: 14400, direction: "above" } },
  ],
  kpis: [
    { id: "completion", name: "Assessment Completion", pillar: "business", format: "percent", target: 85 },
    { id: "readiness", name: "Avg Readiness Score", pillar: "business", format: "score", target: 75 },
    { id: "throughput", name: "Daily Evaluations", pillar: "business", format: "number", target: 10 },
  
      { id: "security_score", name: "Security Posture Score", pillar: "securityPosture", format: "score", target: 85 },
      { id: "deploy_freq", name: "Deploy Frequency", pillar: "innovationVelocity", format: "number", target: 5 },
  ],
  healthSignals: [
    { id: "scoring_failure", name: "Scoring Engine Failure", pillar: "operational", severity: "critical", condition: "Scoring engine error rate > 5%" },
    { id: "data_inconsistency", name: "Data Inconsistency", pillar: "operational", severity: "warning", condition: "Assessment data validation failures detected" },
  
      { id: "compliance_drift", name: "Compliance Drift Detected", pillar: "securityPosture", severity: "warning", condition: "Compliance deviation > 10%" },
      { id: "high_failure_rate", name: "High Change Failure Rate", pillar: "innovationVelocity", severity: "critical", condition: "Change failure rate > 30%" },
  ],
};
