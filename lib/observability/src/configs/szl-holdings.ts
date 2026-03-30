import type { DomainConfig } from "../types.js";

export const szlHoldingsConfig: DomainConfig = {
  appSlug: "szl-holdings",
  appName: "SZL Holdings",
  domain: "portfolio-management",
  description: "Portfolio operations, subsidiary performance, and holdings intelligence observability",
  connectors: ["stripe", "hubspot"],
  metrics: [
    { id: "api_response_time", name: "API Response Time", description: "Holdings platform API latency", unit: "ms", pillar: "performance", type: "histogram", thresholds: { warning: 500, critical: 2000, direction: "above" } },
    { id: "data_refresh_rate", name: "Data Refresh Rate", description: "Frequency of portfolio data updates", unit: "/hr", pillar: "performance", type: "gauge" },
    { id: "report_generation_time", name: "Report Generation Time", description: "Time to generate portfolio reports", unit: "seconds", pillar: "performance", type: "histogram" },
    { id: "portfolio_value_growth", name: "Portfolio Value Growth", description: "Quarter-over-quarter portfolio growth", unit: "%", pillar: "business", type: "gauge" },
    { id: "subsidiary_performance", name: "Subsidiary Performance Index", description: "Aggregate subsidiary health score", unit: "score", pillar: "business", type: "gauge" },
    { id: "investment_yield", name: "Investment Yield", description: "Return on portfolio investments", unit: "%", pillar: "business", type: "gauge" },
    { id: "portal_engagement", name: "Investor Portal Engagement", description: "Investor interaction frequency", unit: "count", pillar: "userExperience", type: "gauge" },
    { id: "report_accessibility", name: "Report Accessibility Score", description: "Ease of accessing portfolio reports", unit: "score", pillar: "userExperience", type: "gauge" },
    { id: "inquiry_response_time", name: "Inquiry Response Time", description: "Time to respond to investor inquiries", unit: "seconds", pillar: "userExperience", type: "gauge" },
    { id: "market_trend_accuracy", name: "Market Trend Accuracy", description: "Accuracy of market trend predictions", unit: "%", pillar: "predictiveHealth", type: "gauge" },
    { id: "risk_forecast", name: "Risk Forecast Score", description: "Portfolio risk prediction accuracy", unit: "score", pillar: "predictiveHealth", type: "gauge" },
    { id: "data_pipeline_health", name: "Data Pipeline Health", description: "Financial data ingestion pipeline status", unit: "score", pillar: "operational", type: "gauge" },
    { id: "compliance_system_health", name: "Compliance System Health", description: "Regulatory compliance system availability", unit: "score", pillar: "operational", type: "gauge" },
    { id: "shareholder_value", name: "Shareholder Value Index", description: "Composite shareholder value metric", unit: "score", pillar: "strategic", type: "gauge" },
    { id: "strategic_alignment", name: "Strategic Alignment Score", description: "Portfolio-strategy alignment measure", unit: "score", pillar: "strategic", type: "gauge" },
  ],
  kpis: [
    { id: "growth", name: "Portfolio Growth", pillar: "business", format: "percent", target: 12 },
    { id: "subsidiary_health", name: "Subsidiary Health", pillar: "business", format: "score", target: 80 },
    { id: "yield", name: "Investment Yield", pillar: "business", format: "percent", target: 8 },
  ],
  healthSignals: [
    { id: "data_stale", name: "Stale Portfolio Data", pillar: "operational", severity: "warning", condition: "Portfolio data not refreshed in > 1hr" },
    { id: "compliance_gap", name: "Compliance Gap Detected", pillar: "operational", severity: "critical", condition: "Regulatory filing deadline approaching" },
  ],
};
