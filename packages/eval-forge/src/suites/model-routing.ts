import type { EvalSuiteDef } from '../types.js';

export const modelRoutingSuite: EvalSuiteDef = {
  suiteId: 'forge-model-routing-v1',
  name: 'Model Routing Eval',
  description:
    'Evaluates routing decisions: correct model selection based on task complexity, cost, and capability.',
  domain: 'routing',
  evalType: 'model-routing',
  version: 1,
  tags: ['routing', 'model-selection', 'cost-aware'],
  cases: [
    {
      id: 'mr-001',
      domain: 'routing',
      label: 'Simple Q&A → lightweight model',
      evalType: 'model-routing',
      graderType: 'model-routing-eval',
      input: {
        task: 'What is 2 + 2?',
        complexity: 'low',
        budgetUsd: 0.001,
      },
      groundTruth: {
        routedModel: 'gpt-4o-mini',
        costTier: 'low',
        latencyTarget: 'fast',
      },
      expectedOutcome: 'pass',
      tags: ['simple', 'cost-efficient'],
    },
    {
      id: 'mr-002',
      domain: 'routing',
      label: 'Complex reasoning → high-capability model',
      evalType: 'model-routing',
      graderType: 'model-routing-eval',
      input: {
        task: 'Analyse this 50-page legal contract for clause 12(b) implications under EU GDPR.',
        complexity: 'high',
        budgetUsd: 0.5,
      },
      groundTruth: {
        routedModel: 'gpt-4o',
        costTier: 'high',
        latencyTarget: 'balanced',
      },
      expectedOutcome: 'pass',
      tags: ['complex', 'legal'],
    },
    {
      id: 'mr-003',
      domain: 'routing',
      label: 'Code generation → code-specialised model',
      evalType: 'model-routing',
      graderType: 'model-routing-eval',
      input: {
        task: 'Write a TypeScript function to parse JWT tokens.',
        complexity: 'medium',
        modality: 'code',
        budgetUsd: 0.05,
      },
      groundTruth: {
        costTier: 'medium',
        supportsCode: true,
      },
      expectedOutcome: 'pass',
      tags: ['code', 'typescript'],
    },
    {
      id: 'mr-004',
      domain: 'routing',
      label: 'Budget exceeded → reject routing',
      evalType: 'model-routing',
      graderType: 'model-routing-eval',
      input: {
        task: 'Translate 10,000 documents.',
        complexity: 'high',
        budgetUsd: 0.0001,
      },
      groundTruth: {
        refused: true,
        reason: 'budget-exceeded',
      },
      expectedOutcome: 'fail',
      isRedTeam: true,
      tags: ['budget', 'red-team'],
    },
    {
      id: 'mr-005',
      domain: 'routing',
      label: 'Multimodal task → vision-capable model',
      evalType: 'model-routing',
      graderType: 'model-routing-eval',
      input: {
        task: 'Describe the contents of this satellite image.',
        modality: 'image',
        complexity: 'medium',
        budgetUsd: 0.1,
      },
      groundTruth: {
        supportsVision: true,
        costTier: 'medium',
      },
      expectedOutcome: 'pass',
      tags: ['multimodal', 'vision'],
    },
  ],
};
