import type { DomainConfig } from "../types.js";

export const carlotaJoConfig: DomainConfig = {
  appSlug: "carlota-jo",
  appName: "Carlota Jo Consulting",
  domain: "consulting",
  description: "Client engagement, booking funnel, and strategic consulting impact observability",
  connectors: ["googleCalendar", "gmail"],
  metrics: [
    { id: "page_load_time", name: "Page Load Time", description: "Time to interactive for key pages", unit: "ms", pillar: "performance", type: "histogram", thresholds: { warning: 2000, critical: 5000, direction: "above" } },
    { id: "booking_api_latency", name: "Booking API Latency", description: "Booking system response time", unit: "ms", pillar: "performance", type: "histogram" },
    { id: "form_submission_time", name: "Form Submission Time", description: "End-to-end form processing time", unit: "ms", pillar: "performance", type: "histogram" },
    { id: "consultation_booking_rate", name: "Consultation Booking Rate", description: "Rate of completed consultation bookings", unit: "%", pillar: "business", type: "gauge" },
    { id: "client_engagement_depth", name: "Client Engagement Depth", description: "Average interaction touchpoints per client", unit: "count", pillar: "business", type: "gauge" },
    { id: "strategic_impact_score", name: "Strategic Impact Score", description: "Measured impact of consulting engagements", unit: "score", pillar: "business", type: "gauge" },
    { id: "booking_funnel_completion", name: "Booking Funnel Completion", description: "End-to-end booking funnel conversion rate", unit: "%", pillar: "userExperience", type: "gauge", thresholds: { warning: 60, critical: 40, direction: "below" } },
    { id: "form_abandonment_rate", name: "Form Abandonment Rate", description: "Rate of booking form abandonment", unit: "%", pillar: "userExperience", type: "gauge", thresholds: { warning: 30, critical: 50, direction: "above" } },
    { id: "mobile_responsiveness", name: "Mobile Responsiveness Score", description: "Mobile experience quality rating", unit: "score", pillar: "userExperience", type: "gauge" },
    { id: "demand_forecast", name: "Booking Demand Forecast", description: "Predicted booking volume accuracy", unit: "%", pillar: "predictiveHealth", type: "gauge" },
    { id: "churn_prediction", name: "Client Churn Prediction", description: "Early warning for client disengagement", unit: "score", pillar: "predictiveHealth", type: "gauge" },
    { id: "calendar_health", name: "Calendar Integration Health", description: "Google Calendar sync status", unit: "score", pillar: "operational", type: "gauge" },
    { id: "email_health", name: "Email Service Health", description: "Gmail notification delivery status", unit: "score", pillar: "operational", type: "gauge" },
    { id: "client_lifetime_value", name: "Client Lifetime Value", description: "Average client relationship value", unit: "score", pillar: "strategic", type: "gauge" },
    { id: "market_positioning", name: "Market Positioning Score", description: "Competitive market positioning strength", unit: "score", pillar: "strategic", type: "gauge" },
  ],
  kpis: [
    { id: "booking_rate", name: "Booking Conversion", pillar: "business", format: "percent", target: 25 },
    { id: "engagement", name: "Engagement Depth", pillar: "business", format: "number", target: 5 },
    { id: "impact", name: "Strategic Impact", pillar: "business", format: "score", target: 80 },
  ],
  healthSignals: [
    { id: "booking_failure", name: "Booking System Failure", pillar: "operational", severity: "critical", condition: "Booking API error rate > 5%" },
    { id: "calendar_sync_delay", name: "Calendar Sync Delay", pillar: "operational", severity: "warning", condition: "Calendar sync delayed > 5min" },
  ],
};
