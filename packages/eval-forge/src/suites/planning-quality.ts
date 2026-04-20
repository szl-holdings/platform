import type { EvalSuiteDef } from '../types.js';

export const planningQualitySuite: EvalSuiteDef = {
  suiteId: 'forge-planning-quality-v1',
  name: 'Planning Quality Eval',
  description:
    'Evaluates multi-step planning: step completeness, ordering, feasibility, dependency resolution, and goal alignment.',
  domain: 'planning',
  evalType: 'planning-quality',
  version: 1,
  tags: ['planning', 'multi-step', 'feasibility', 'goal-alignment'],
  cases: [
    {
      id: 'pq-001',
      domain: 'planning',
      label: 'Simple 3-step task plan',
      evalType: 'planning-quality',
      graderType: 'planning-quality',
      input: {
        goal: 'Deploy a new feature to production.',
        constraints: ['must pass CI', 'requires approval'],
      },
      groundTruth: {
        minSteps: 3,
        feasible: true,
        includesApproval: true,
      },
      expectedOutcome: 'pass',
      tags: ['deployment', 'approval'],
    },
    {
      id: 'pq-002',
      domain: 'planning',
      label: 'Complex investigation plan — dependency ordering',
      evalType: 'planning-quality',
      graderType: 'planning-quality',
      input: {
        goal: 'Investigate a data breach and produce a post-mortem report.',
        domain: 'security',
      },
      groundTruth: {
        minSteps: 5,
        feasible: true,
        hasPostMortemStep: true,
      },
      expectedOutcome: 'pass',
      tags: ['security', 'investigation'],
    },
    {
      id: 'pq-003',
      domain: 'planning',
      label: 'Goal decomposition — quarterly planning',
      evalType: 'planning-quality',
      graderType: 'planning-quality',
      input: {
        goal: 'Grow ARR by 25% in Q3.',
        resources: ['sales team', 'marketing budget $200k'],
        timeframe: '90 days',
      },
      groundTruth: {
        minSteps: 4,
        feasible: true,
        measurableOutcomes: true,
      },
      expectedOutcome: 'pass',
      tags: ['business', 'growth'],
    },
    {
      id: 'pq-004',
      domain: 'planning',
      label: 'Infeasible plan detection',
      evalType: 'planning-quality',
      graderType: 'planning-quality',
      input: {
        goal: 'Build a full social network in 1 day with 1 engineer.',
        constraints: ['1 day', '1 engineer', 'no existing code'],
      },
      groundTruth: {
        feasible: false,
        flaggedAsInfeasible: true,
      },
      expectedOutcome: 'fail',
      isRedTeam: true,
      tags: ['infeasible', 'red-team'],
    },
    {
      id: 'pq-005',
      domain: 'planning',
      label: 'Risk-aware plan — includes mitigation steps',
      evalType: 'planning-quality',
      graderType: 'planning-quality',
      input: {
        goal: 'Migrate database to new schema with zero downtime.',
        risks: ['data loss', 'service interruption'],
      },
      groundTruth: {
        minSteps: 4,
        feasible: true,
        hasRiskMitigation: true,
        hasRollbackStep: true,
      },
      expectedOutcome: 'pass',
      tags: ['migration', 'risk-mitigation'],
    },
  ],
};
