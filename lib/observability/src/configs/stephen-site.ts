import type { DomainConfig } from "../types.js";

export const stephenSiteConfig: DomainConfig = {
  appSlug: "stephen-site",
  appName: "Stephen Lutar",
  domain: "personal-brand",
  description: "Personal brand performance, audience engagement, and content impact observability",
  connectors: ["stripe", "ai"],
  metrics: [
    { id: "page_performance", name: "Page Performance Score", description: "Core Web Vitals composite score", unit: "score", pillar: "performance", type: "gauge" },
    { id: "ttfb", name: "Time to First Byte", description: "Server response time for initial request", unit: "ms", pillar: "performance", type: "histogram", thresholds: { warning: 200, critical: 600, direction: "above" } },
    { id: "asset_load_time", name: "Asset Load Time", description: "Time to load page assets", unit: "ms", pillar: "performance", type: "histogram" },
    { id: "visitor_conversion_rate", name: "Visitor Conversion Rate", description: "Percentage of visitors taking action", unit: "%", pillar: "business", type: "gauge" },
    { id: "content_engagement", name: "Content Engagement Rate", description: "Interaction rate with site content", unit: "%", pillar: "business", type: "gauge" },
    { id: "checkout_completion", name: "Checkout Completion Rate", description: "E-commerce checkout success rate", unit: "%", pillar: "business", type: "gauge" },
    { id: "bounce_rate", name: "Bounce Rate", description: "Single-page session percentage", unit: "%", pillar: "userExperience", type: "gauge", thresholds: { warning: 60, critical: 80, direction: "above" } },
    { id: "scroll_depth", name: "Average Scroll Depth", description: "How far visitors scroll on pages", unit: "%", pillar: "userExperience", type: "gauge" },
    { id: "mobile_experience", name: "Mobile Experience Score", description: "Mobile usability rating", unit: "score", pillar: "userExperience", type: "gauge" },
    { id: "traffic_forecast", name: "Traffic Forecast Accuracy", description: "Predicted vs actual traffic", unit: "%", pillar: "predictiveHealth", type: "gauge" },
    { id: "engagement_trend", name: "Engagement Trend Prediction", description: "Predicted engagement trajectory", unit: "score", pillar: "predictiveHealth", type: "gauge" },
    { id: "stripe_health", name: "Stripe Payment Health", description: "Payment processing availability", unit: "score", pillar: "operational", type: "gauge" },
    { id: "cdn_health", name: "CDN Health", description: "Content delivery network status", unit: "score", pillar: "operational", type: "gauge" },
    { id: "brand_reach", name: "Brand Reach Index", description: "Overall brand visibility and reach", unit: "score", pillar: "strategic", type: "gauge" },
    { id: "authority_score", name: "Authority Score", description: "Domain authority and influence measure", unit: "score", pillar: "strategic", type: "gauge" },
      { id: "threat_surface_score", name: "Threat Surface Score", description: "Composite attack surface exposure rating", unit: "score", pillar: "securityPosture", type: "gauge", thresholds: { warning: 60, critical: 40, direction: "below" } },
      { id: "compliance_drift", name: "Compliance Drift Index", description: "Deviation from baseline compliance posture", unit: "%", pillar: "securityPosture", type: "gauge", thresholds: { warning: 10, critical: 25, direction: "above" } },
      { id: "vulnerability_mttr", name: "Vulnerability MTTR", description: "Mean time to remediate discovered vulnerabilities", unit: "seconds", pillar: "securityPosture", type: "gauge" },
      { id: "deploy_frequency", name: "Deployment Frequency", description: "Deployments per day", unit: "count", pillar: "innovationVelocity", type: "counter" },
      { id: "change_failure_rate", name: "Change Failure Rate", description: "Percentage of deployments causing incidents", unit: "%", pillar: "innovationVelocity", type: "gauge", thresholds: { warning: 15, critical: 30, direction: "above" } },
      { id: "lead_time_changes", name: "Lead Time for Changes", description: "Time from commit to production", unit: "seconds", pillar: "innovationVelocity", type: "gauge" },
      { id: "mttr", name: "Mean Time to Recovery", description: "Average time to restore service after incident", unit: "seconds", pillar: "innovationVelocity", type: "gauge", thresholds: { warning: 3600, critical: 14400, direction: "above" } },
  ],
  kpis: [
    { id: "conversion", name: "Conversion Rate", pillar: "business", format: "percent", target: 5 },
    { id: "engagement", name: "Engagement Rate", pillar: "business", format: "percent", target: 30 },
    { id: "performance", name: "Performance Score", pillar: "performance", format: "score", target: 90 },
  
      { id: "security_score", name: "Security Posture Score", pillar: "securityPosture", format: "score", target: 85 },
      { id: "deploy_freq", name: "Deploy Frequency", pillar: "innovationVelocity", format: "number", target: 5 },
  ],
  healthSignals: [
    { id: "payment_failure", name: "Payment Processing Failure", pillar: "operational", severity: "critical", condition: "Stripe payment error rate > 3%" },
    { id: "slow_page", name: "Slow Page Load", pillar: "performance", severity: "warning", condition: "LCP > 2.5s" },
  
      { id: "compliance_drift", name: "Compliance Drift Detected", pillar: "securityPosture", severity: "warning", condition: "Compliance deviation > 10%" },
      { id: "high_failure_rate", name: "High Change Failure Rate", pillar: "innovationVelocity", severity: "critical", condition: "Change failure rate > 30%" },
  ],
};
