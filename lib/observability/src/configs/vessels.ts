import type { DomainConfig } from "../types.js";

export const vesselsConfig: DomainConfig = {
  appSlug: "vessels",
  appName: "Vessels Maritime Intelligence",
  domain: "maritime",
  description: "Fleet operations, voyage optimization, and maritime compliance observability",
  connectors: ["shipping", "stormglass", "weather"],
  metrics: [
    { id: "route_calc_time", name: "Route Calculation Time", description: "Time to compute optimal voyage route", unit: "ms", pillar: "performance", type: "histogram", thresholds: { warning: 500, critical: 2000, direction: "above" } },
    { id: "ais_data_latency", name: "AIS Data Latency", description: "Delay in receiving vessel position updates", unit: "ms", pillar: "performance", type: "gauge", thresholds: { warning: 300, critical: 1000, direction: "above" } },
    { id: "weather_api_response", name: "Weather API Response Time", description: "StormGlass API response latency", unit: "ms", pillar: "performance", type: "histogram" },
    { id: "fleet_utilization", name: "Fleet Utilization Rate", description: "Percentage of fleet actively deployed", unit: "%", pillar: "business", type: "gauge" },
    { id: "voyage_deviation", name: "Average Voyage Deviation", description: "Mean deviation from planned routes", unit: "%", pillar: "business", type: "gauge", thresholds: { warning: 15, critical: 30, direction: "above" } },
    { id: "co2_compliance", name: "CO2 Compliance Score", description: "Fleet-wide emissions compliance rating", unit: "score", pillar: "business", type: "gauge", thresholds: { warning: 70, critical: 50, direction: "below" } },
    { id: "fuel_efficiency", name: "Fuel Efficiency Index", description: "Fleet average fuel consumption efficiency", unit: "score", pillar: "business", type: "gauge" },
    { id: "dashboard_load", name: "Dashboard Load Time", description: "Time to render fleet command center", unit: "ms", pillar: "userExperience", type: "histogram", thresholds: { warning: 2000, critical: 5000, direction: "above" } },
    { id: "alert_response", name: "Alert Response Rate", description: "Percentage of alerts acknowledged within SLA", unit: "%", pillar: "userExperience", type: "gauge" },
    { id: "session_depth", name: "Session Interaction Depth", description: "Average pages viewed per session", unit: "count", pillar: "userExperience", type: "gauge" },
    { id: "anomaly_detection_rate", name: "Anomaly Detection Rate", description: "Rate of detected route/weather anomalies", unit: "/hr", pillar: "predictiveHealth", type: "counter" },
    { id: "predictive_accuracy", name: "ETA Prediction Accuracy", description: "Accuracy of estimated arrival predictions", unit: "%", pillar: "predictiveHealth", type: "gauge" },
    { id: "stormglass_health", name: "StormGlass API Health", description: "Weather data provider availability", unit: "score", pillar: "operational", type: "gauge" },
    { id: "shipping_api_health", name: "Shipping API Health", description: "Shipping integration availability", unit: "score", pillar: "operational", type: "gauge" },
    { id: "fleet_roi", name: "Fleet Operations ROI", description: "Return on fleet operations investment", unit: "score", pillar: "strategic", type: "gauge" },
    { id: "safety_index", name: "Maritime Safety Index", description: "Composite fleet safety score", unit: "score", pillar: "strategic", type: "gauge" },
      { id: "threat_surface_score", name: "Threat Surface Score", description: "Composite attack surface exposure rating", unit: "score", pillar: "securityPosture", type: "gauge", thresholds: { warning: 60, critical: 40, direction: "below" } },
      { id: "compliance_drift", name: "Compliance Drift Index", description: "Deviation from baseline compliance posture", unit: "%", pillar: "securityPosture", type: "gauge", thresholds: { warning: 10, critical: 25, direction: "above" } },
      { id: "vulnerability_mttr", name: "Vulnerability MTTR", description: "Mean time to remediate discovered vulnerabilities", unit: "seconds", pillar: "securityPosture", type: "gauge" },
      { id: "deploy_frequency", name: "Deployment Frequency", description: "Deployments per day", unit: "count", pillar: "innovationVelocity", type: "counter" },
      { id: "change_failure_rate", name: "Change Failure Rate", description: "Percentage of deployments causing incidents", unit: "%", pillar: "innovationVelocity", type: "gauge", thresholds: { warning: 15, critical: 30, direction: "above" } },
      { id: "lead_time_changes", name: "Lead Time for Changes", description: "Time from commit to production", unit: "seconds", pillar: "innovationVelocity", type: "gauge" },
      { id: "mttr", name: "Mean Time to Recovery", description: "Average time to restore service after incident", unit: "seconds", pillar: "innovationVelocity", type: "gauge", thresholds: { warning: 3600, critical: 14400, direction: "above" } },
  ],
  kpis: [
    { id: "fleet_util", name: "Fleet Utilization", pillar: "business", format: "percent", target: 85 },
    { id: "co2_score", name: "CO2 Compliance", pillar: "business", format: "score", target: 80 },
    { id: "eta_accuracy", name: "ETA Accuracy", pillar: "predictiveHealth", format: "percent", target: 95 },
  
      { id: "security_score", name: "Security Posture Score", pillar: "securityPosture", format: "score", target: 85 },
      { id: "deploy_freq", name: "Deploy Frequency", pillar: "innovationVelocity", format: "number", target: 5 },
  ],
  healthSignals: [
    { id: "vessel_offline", name: "Vessel Offline", pillar: "operational", severity: "critical", condition: "Vessel AIS signal lost > 30min" },
    { id: "route_deviation", name: "Excessive Route Deviation", pillar: "business", severity: "warning", condition: "Voyage deviation > 15%" },
  
      { id: "compliance_drift", name: "Compliance Drift Detected", pillar: "securityPosture", severity: "warning", condition: "Compliance deviation > 10%" },
      { id: "high_failure_rate", name: "High Change Failure Rate", pillar: "innovationVelocity", severity: "critical", condition: "Change failure rate > 30%" },
  ],
};
