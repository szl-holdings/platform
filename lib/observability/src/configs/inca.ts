import type { DomainConfig } from "../types.js";

export const incaConfig: DomainConfig = {
  appSlug: "inca",
  appName: "INCA AI Research Command Center",
  domain: "ai-research",
  description: "Experiment tracking, model performance, and research pipeline observability",
  connectors: ["ai", "huggingface", "storage"],
  metrics: [
    { id: "model_inference_p95", name: "Model Inference P95", description: "95th percentile inference latency", unit: "ms", pillar: "performance", type: "histogram", thresholds: { warning: 500, critical: 2000, direction: "above" } },
    { id: "training_throughput", name: "Training Throughput", description: "Training iterations per hour", unit: "/hr", pillar: "performance", type: "gauge" },
    { id: "gpu_utilization", name: "GPU Utilization", description: "Compute resource utilization rate", unit: "%", pillar: "performance", type: "gauge" },
    { id: "experiment_success_rate", name: "Experiment Success Rate", description: "Percentage of experiments meeting objectives", unit: "%", pillar: "business", type: "gauge", thresholds: { warning: 60, critical: 40, direction: "below" } },
    { id: "research_pipeline_throughput", name: "Research Pipeline Throughput", description: "Experiments completed per week", unit: "count", pillar: "business", type: "counter" },
    { id: "model_accuracy_improvement", name: "Model Accuracy Improvement", description: "Week-over-week accuracy gain", unit: "%", pillar: "business", type: "gauge" },
    { id: "experiment_workflow_completion", name: "Experiment Workflow Completion", description: "Rate of fully completed experiment workflows", unit: "%", pillar: "userExperience", type: "gauge" },
    { id: "notebook_render_time", name: "Notebook Render Time", description: "Time to render experiment notebooks", unit: "ms", pillar: "userExperience", type: "histogram" },
    { id: "researcher_session_depth", name: "Researcher Session Depth", description: "Average experiment interactions per session", unit: "count", pillar: "userExperience", type: "gauge" },
    { id: "model_drift_detection", name: "Model Drift Detection", description: "Rate of detected model performance drift", unit: "/hr", pillar: "predictiveHealth", type: "counter" },
    { id: "data_quality_score", name: "Data Quality Score", description: "Input data quality assessment", unit: "score", pillar: "predictiveHealth", type: "gauge" },
    { id: "huggingface_health", name: "HuggingFace API Health", description: "HuggingFace integration availability", unit: "score", pillar: "operational", type: "gauge" },
    { id: "compute_cluster_health", name: "Compute Cluster Health", description: "Training infrastructure status", unit: "score", pillar: "operational", type: "gauge" },
    { id: "research_impact_score", name: "Research Impact Score", description: "Weighted impact of research outputs", unit: "score", pillar: "strategic", type: "gauge" },
    { id: "innovation_velocity", name: "Innovation Velocity", description: "Rate of novel findings and breakthroughs", unit: "score", pillar: "strategic", type: "gauge" },
      { id: "threat_surface_score", name: "Threat Surface Score", description: "Composite attack surface exposure rating", unit: "score", pillar: "securityPosture", type: "gauge", thresholds: { warning: 60, critical: 40, direction: "below" } },
      { id: "compliance_drift", name: "Compliance Drift Index", description: "Deviation from baseline compliance posture", unit: "%", pillar: "securityPosture", type: "gauge", thresholds: { warning: 10, critical: 25, direction: "above" } },
      { id: "vulnerability_mttr", name: "Vulnerability MTTR", description: "Mean time to remediate discovered vulnerabilities", unit: "seconds", pillar: "securityPosture", type: "gauge" },
      { id: "deploy_frequency", name: "Deployment Frequency", description: "Deployments per day", unit: "count", pillar: "innovationVelocity", type: "counter" },
      { id: "change_failure_rate", name: "Change Failure Rate", description: "Percentage of deployments causing incidents", unit: "%", pillar: "innovationVelocity", type: "gauge", thresholds: { warning: 15, critical: 30, direction: "above" } },
      { id: "lead_time_changes", name: "Lead Time for Changes", description: "Time from commit to production", unit: "seconds", pillar: "innovationVelocity", type: "gauge" },
      { id: "mttr", name: "Mean Time to Recovery", description: "Average time to restore service after incident", unit: "seconds", pillar: "innovationVelocity", type: "gauge", thresholds: { warning: 3600, critical: 14400, direction: "above" } },
  ],
  kpis: [
    { id: "inference_latency", name: "Inference P95", pillar: "performance", format: "duration", target: 200 },
    { id: "experiment_rate", name: "Experiment Success", pillar: "business", format: "percent", target: 70 },
    { id: "pipeline_throughput", name: "Pipeline Throughput", pillar: "business", format: "number", target: 20 },
  
      { id: "security_score", name: "Security Posture Score", pillar: "securityPosture", format: "score", target: 85 },
      { id: "deploy_freq", name: "Deploy Frequency", pillar: "innovationVelocity", format: "number", target: 5 },
  ],
  healthSignals: [
    { id: "model_degradation", name: "Model Performance Degradation", pillar: "predictiveHealth", severity: "warning", condition: "Model accuracy dropped > 5% in 24h" },
    { id: "gpu_exhaustion", name: "GPU Resource Exhaustion", pillar: "operational", severity: "critical", condition: "GPU utilization > 95% sustained" },
  
      { id: "compliance_drift", name: "Compliance Drift Detected", pillar: "securityPosture", severity: "warning", condition: "Compliance deviation > 10%" },
      { id: "high_failure_rate", name: "High Change Failure Rate", pillar: "innovationVelocity", severity: "critical", condition: "Change failure rate > 30%" },
  ],
};
