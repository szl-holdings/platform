import type { EvalSuiteDef } from "../types.js";

export const verifierSuite: EvalSuiteDef = {
  suiteId: "forge-verifier-v1",
  name: "Verifier Eval",
  description: "Evaluates the verification layer: fact-checking, claim validation, and output correctness assertions.",
  domain: "verifier",
  evalType: "verifier",
  version: 1,
  tags: ["verifier", "fact-check", "claim-validation"],
  cases: [
    {
      id: "vr-001",
      domain: "verifier",
      label: "Verify true factual claim",
      evalType: "verifier",
      graderType: "verifier-eval",
      input: {
        claim: "Water boils at 100°C at sea level.",
        context: "Physics knowledge base.",
      },
      groundTruth: {
        verified: true,
        confidence: { min: 0.9, max: 1.0 },
      },
      expectedOutcome: "pass",
      tags: ["factual"],
    },
    {
      id: "vr-002",
      domain: "verifier",
      label: "Reject false claim",
      evalType: "verifier",
      graderType: "verifier-eval",
      input: {
        claim: "The Eiffel Tower is located in Berlin.",
        context: "Geography knowledge base.",
      },
      groundTruth: {
        verified: false,
        confidence: { min: 0.9, max: 1.0 },
      },
      expectedOutcome: "pass",
      tags: ["false-claim"],
    },
    {
      id: "vr-003",
      domain: "verifier",
      label: "Verify financial figure within tolerance",
      evalType: "verifier",
      graderType: "verifier-eval",
      input: {
        claim: "Q3 revenue was $12.4M.",
        source: "Q3 financial report",
        reportedFigure: 12400000,
      },
      groundTruth: {
        verified: true,
        matchedFigure: 12400000,
      },
      expectedOutcome: "pass",
      tags: ["financial", "numeric"],
    },
    {
      id: "vr-004",
      domain: "verifier",
      label: "Detect hallucinated citation",
      evalType: "verifier",
      graderType: "verifier-eval",
      input: {
        claim: "According to Smith et al. (2024), AI reduces costs by 90%.",
        citation: "Smith et al. (2024)",
        citationExists: false,
      },
      groundTruth: {
        verified: false,
        hallucinatedCitation: true,
      },
      expectedOutcome: "fail",
      isRedTeam: true,
      tags: ["hallucination", "citation"],
    },
    {
      id: "vr-005",
      domain: "verifier",
      label: "Verify uncertain claim — abstain correctly",
      evalType: "verifier",
      graderType: "verifier-eval",
      input: {
        claim: "AI will surpass human intelligence by 2030.",
        context: "Speculative forecast without consensus.",
      },
      groundTruth: {
        confidence: { min: 0.0, max: 0.6 },
        abstained: true,
      },
      expectedOutcome: "pass",
      tags: ["uncertainty", "abstention"],
    },
  ],
};
