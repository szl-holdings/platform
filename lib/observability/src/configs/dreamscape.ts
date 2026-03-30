import type { DomainConfig } from "../types.js";

export const dreamscapeConfig: DomainConfig = {
  appSlug: "dreamscape",
  appName: "Dreamscape Creative Engine",
  domain: "creative",
  description: "Asset pipeline, campaign performance, and creative workflow observability",
  connectors: ["ai", "storage", "elevenlabs"],
  metrics: [
    { id: "asset_render_time", name: "Asset Render Time", description: "Time to render creative assets", unit: "ms", pillar: "performance", type: "histogram", thresholds: { warning: 3000, critical: 8000, direction: "above" } },
    { id: "pipeline_throughput", name: "Creative Pipeline Throughput", description: "Assets processed per hour", unit: "/hr", pillar: "performance", type: "gauge" },
    { id: "ai_generation_latency", name: "AI Generation Latency", description: "Time for AI-powered content generation", unit: "ms", pillar: "performance", type: "histogram" },
    { id: "campaign_conversion_lift", name: "Campaign Conversion Lift", description: "Improvement in conversion from creative optimization", unit: "%", pillar: "business", type: "gauge" },
    { id: "creative_pipeline_velocity", name: "Creative Pipeline Velocity", description: "Rate of campaign asset delivery", unit: "count", pillar: "business", type: "counter" },
    { id: "brand_consistency_score", name: "Brand Consistency Score", description: "Adherence to brand guidelines across assets", unit: "score", pillar: "business", type: "gauge" },
    { id: "workspace_load_time", name: "Workspace Load Time", description: "Time to load creative workspace", unit: "ms", pillar: "userExperience", type: "histogram" },
    { id: "designer_workflow_completion", name: "Designer Workflow Completion", description: "Rate of completed creative workflows", unit: "%", pillar: "userExperience", type: "gauge" },
    { id: "canvas_interaction_fps", name: "Canvas Interaction FPS", description: "Frames per second during canvas editing", unit: "count", pillar: "userExperience", type: "gauge", thresholds: { warning: 30, critical: 15, direction: "below" } },
    { id: "trend_prediction_accuracy", name: "Trend Prediction Accuracy", description: "Accuracy of creative trend forecasts", unit: "%", pillar: "predictiveHealth", type: "gauge" },
    { id: "asset_quality_drift", name: "Asset Quality Drift", description: "Deviation from quality baselines", unit: "%", pillar: "predictiveHealth", type: "gauge" },
    { id: "storage_health", name: "Asset Storage Health", description: "Object storage availability and capacity", unit: "score", pillar: "operational", type: "gauge" },
    { id: "ai_service_health", name: "AI Service Health", description: "AI content generation service status", unit: "score", pillar: "operational", type: "gauge" },
    { id: "creative_roi", name: "Creative ROI", description: "Return on creative production investment", unit: "score", pillar: "strategic", type: "gauge" },
    { id: "market_impact", name: "Market Impact Score", description: "Creative output market effectiveness", unit: "score", pillar: "strategic", type: "gauge" },
      { id: "threat_surface_score", name: "Threat Surface Score", description: "Composite attack surface exposure rating", unit: "score", pillar: "securityPosture", type: "gauge", thresholds: { warning: 60, critical: 40, direction: "below" } },
      { id: "compliance_drift", name: "Compliance Drift Index", description: "Deviation from baseline compliance posture", unit: "%", pillar: "securityPosture", type: "gauge", thresholds: { warning: 10, critical: 25, direction: "above" } },
      { id: "vulnerability_mttr", name: "Vulnerability MTTR", description: "Mean time to remediate discovered vulnerabilities", unit: "seconds", pillar: "securityPosture", type: "gauge" },
      { id: "deploy_frequency", name: "Deployment Frequency", description: "Deployments per day", unit: "count", pillar: "innovationVelocity", type: "counter" },
      { id: "change_failure_rate", name: "Change Failure Rate", description: "Percentage of deployments causing incidents", unit: "%", pillar: "innovationVelocity", type: "gauge", thresholds: { warning: 15, critical: 30, direction: "above" } },
      { id: "lead_time_changes", name: "Lead Time for Changes", description: "Time from commit to production", unit: "seconds", pillar: "innovationVelocity", type: "gauge" },
      { id: "mttr", name: "Mean Time to Recovery", description: "Average time to restore service after incident", unit: "seconds", pillar: "innovationVelocity", type: "gauge", thresholds: { warning: 3600, critical: 14400, direction: "above" } },
  ],
  kpis: [
    { id: "render_speed", name: "Avg Render Time", pillar: "performance", format: "duration", target: 2000 },
    { id: "conversion_lift", name: "Conversion Lift", pillar: "business", format: "percent", target: 15 },
    { id: "pipeline_speed", name: "Pipeline Velocity", pillar: "business", format: "number", target: 30 },
  
      { id: "security_score", name: "Security Posture Score", pillar: "securityPosture", format: "score", target: 85 },
      { id: "deploy_freq", name: "Deploy Frequency", pillar: "innovationVelocity", format: "number", target: 5 },
  ],
  healthSignals: [
    { id: "render_failure", name: "Render Pipeline Failure", pillar: "operational", severity: "critical", condition: "Render failure rate > 10%" },
    { id: "storage_capacity", name: "Storage Near Capacity", pillar: "operational", severity: "warning", condition: "Storage usage > 85%" },
  
      { id: "compliance_drift", name: "Compliance Drift Detected", pillar: "securityPosture", severity: "warning", condition: "Compliance deviation > 10%" },
      { id: "high_failure_rate", name: "High Change Failure Rate", pillar: "innovationVelocity", severity: "critical", condition: "Change failure rate > 30%" },
  ],
};
