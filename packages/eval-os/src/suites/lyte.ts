import type { EvalSuiteDef } from "../runtime.js";

export const lyteSuite: EvalSuiteDef = {
  suiteId: "lyte-v1",
  name: "Lyte Platform Intelligence",
  description: "Evaluates Lyte domain: prioritization accuracy, recommendation ranking, and action routing.",
  domain: "lyte",
  version: 1,
  tags: ["lyte", "prioritization", "recommendation", "routing"],
  cases: [
    {
      id: "lyte-priority-001",
      domain: "lyte",
      label: "Prioritization — urgent billing issue first",
      graderType: "exact-match",
      input: {
        tickets: [
          { id: "t1", category: "billing-failure", severity: "critical", age: 2 },
          { id: "t2", category: "feature-request", severity: "low", age: 5 },
          { id: "t3", category: "outage", severity: "critical", age: 1 },
        ],
      },
      groundTruth: {
        topPriority: "t3",
        orderedIds: ["t3", "t1", "t2"],
      },
      expectedOutcome: "pass",
      tags: ["prioritization"],
    },
    {
      id: "lyte-priority-002",
      domain: "lyte",
      label: "Prioritization — deprioritize stale items",
      graderType: "exact-match",
      input: {
        tickets: [
          { id: "t1", category: "enhancement", severity: "low", age: 90, stale: true },
          { id: "t2", category: "bug", severity: "medium", age: 3 },
        ],
      },
      groundTruth: {
        topPriority: "t2",
        staleIds: ["t1"],
      },
      expectedOutcome: "pass",
      tags: ["prioritization"],
    },
    {
      id: "lyte-recommendation-001",
      domain: "lyte",
      label: "Recommendation ranking — upsell relevance",
      graderType: "exact-match",
      input: {
        customerId: "cust-001",
        currentPlan: "starter",
        usagePattern: "high-api-calls",
        recommendationPool: ["upgrade-to-pro", "add-storage", "add-analytics"],
      },
      groundTruth: {
        topRecommendation: "upgrade-to-pro",
        relevanceScore: { min: 0.8, max: 1.0 },
      },
      expectedOutcome: "pass",
      tags: ["recommendation-ranking"],
    },
    {
      id: "lyte-recommendation-002",
      domain: "lyte",
      label: "Recommendation ranking — low usage customer",
      graderType: "exact-match",
      input: {
        customerId: "cust-002",
        currentPlan: "enterprise",
        usagePattern: "low-usage",
        recommendationPool: ["downgrade-plan", "training-resources", "account-review"],
      },
      groundTruth: {
        topRecommendation: "account-review",
        relevanceScore: { min: 0.6, max: 1.0 },
      },
      expectedOutcome: "pass",
      tags: ["recommendation-ranking"],
    },
    {
      id: "lyte-routing-001",
      domain: "lyte",
      label: "Action routing — technical issue to engineering",
      graderType: "agent-workflow-eval",
      input: {
        actionId: "act-001",
        type: "api-error",
        severity: "high",
        routingRules: ["technical->engineering", "billing->finance", "legal->counsel"],
      },
      groundTruth: {
        stepsExpected: 2,
        goalAchieved: true,
        routedTo: "engineering",
      },
      expectedOutcome: "pass",
      tags: ["action-routing"],
    },
    {
      id: "lyte-latency-001",
      domain: "lyte",
      label: "Latency threshold — recommendation API",
      graderType: "latency-cost",
      input: {
        operation: "recommendation-generation",
        complexity: "standard",
      },
      groundTruth: {
        maxLatencyMs: 2000,
        maxCostUsd: 0.005,
      },
      expectedOutcome: "pass",
      tags: ["latency", "cost"],
    },
  ],
};
