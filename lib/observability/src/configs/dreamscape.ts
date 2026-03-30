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
  ],
  kpis: [
    { id: "render_speed", name: "Avg Render Time", pillar: "performance", format: "duration", target: 2000 },
    { id: "conversion_lift", name: "Conversion Lift", pillar: "business", format: "percent", target: 15 },
    { id: "pipeline_speed", name: "Pipeline Velocity", pillar: "business", format: "number", target: 30 },
  ],
  healthSignals: [
    { id: "render_failure", name: "Render Pipeline Failure", pillar: "operational", severity: "critical", condition: "Render failure rate > 10%" },
    { id: "storage_capacity", name: "Storage Near Capacity", pillar: "operational", severity: "warning", condition: "Storage usage > 85%" },
  ],
};
