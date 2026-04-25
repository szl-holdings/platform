/**
 * Alloy Meridian — Counterfactual Ledger
 *
 * For each recommendation, records four projection paths:
 *   do_nothing, delay_30d, delegate, execute_now
 *
 * Each path carries expected outcome, confidence, risk delta, and
 * a rollback path in case the action is reversible.
 */

import {
  validateRecommendationCompleteness,
  type CompletenessValidationResult,
} from './founder-intent.js';

export type CounterfactualPath = 'do_nothing' | 'delay_30d' | 'delegate' | 'execute_now';

export interface PathProjection {
  path: CounterfactualPath;
  label: string;
  expectedOutcome: string;
  impactScore: number;
  riskDelta: number;
  confidence: number;
  timeToResult: string;
  reversible: boolean;
  rollbackPath?: string;
  cost: 'none' | 'low' | 'medium' | 'high';
}

export interface CounterfactualEntry {
  id: string;
  recommendationId: string;
  title: string;
  context: string;
  domain: string;
  projections: PathProjection[];
  recommendedPath: CounterfactualPath;
  rationale: string;
  sources: string[];
  owner: string;
  nextAction: string;
  createdAt: string;
  expiresAt: string;
  /** Governance completeness check — entries failing this cannot be approved. */
  governanceCheck: CompletenessValidationResult;
}

export interface CounterfactualLedger {
  entries: CounterfactualEntry[];
  totalEntries: number;
  pendingDecisions: number;
  retrievedAt: string;
}

const SAMPLE_ENTRIES: Omit<CounterfactualEntry, 'id' | 'createdAt' | 'expiresAt'>[] = [
  {
    recommendationId: 'rec-001',
    title: 'Upgrade API server memory allocation',
    context:
      'Heap usage at 74%, approaching OOM ceiling. Two incidents in past 7 days correlated with memory pressure.',
    domain: 'infrastructure',
    projections: [
      {
        path: 'do_nothing',
        label: 'Do Nothing',
        expectedOutcome: 'High probability of OOM crash within 14 days. Incident cost estimate $12k.',
        impactScore: -80,
        riskDelta: +0.35,
        confidence: 0.82,
        timeToResult: '14 days',
        reversible: false,
        cost: 'none',
      },
      {
        path: 'delay_30d',
        label: 'Delay 30 Days',
        expectedOutcome:
          'Moderate risk reduction through temporary workarounds. Full risk remains unresolved.',
        impactScore: -40,
        riskDelta: +0.15,
        confidence: 0.71,
        timeToResult: '30 days',
        reversible: true,
        rollbackPath: 'Revert resource config to previous values.',
        cost: 'low',
      },
      {
        path: 'delegate',
        label: 'Delegate to SRE',
        expectedOutcome: 'SRE team implements fix within 5 business days. Risk normalized.',
        impactScore: 60,
        riskDelta: -0.25,
        confidence: 0.78,
        timeToResult: '5 business days',
        reversible: true,
        rollbackPath: 'Rollback Kubernetes resource spec via GitOps.',
        cost: 'low',
      },
      {
        path: 'execute_now',
        label: 'Execute Now',
        expectedOutcome: 'Memory allocation doubled. OOM risk eliminated. +15% latency improvement.',
        impactScore: 90,
        riskDelta: -0.40,
        confidence: 0.91,
        timeToResult: '2 hours',
        reversible: true,
        rollbackPath: 'kubectl rollout undo deployment/api-server',
        cost: 'medium',
      },
    ],
    recommendedPath: 'execute_now',
    rationale:
      'Immediate execution eliminates critical risk at medium cost. Rollback path is clean and tested.',
    sources: ['infra-metrics', 'incident-log', 'cost-model'],
    owner: 'SRE Lead',
    nextAction: 'Approve resource spec change in Kubernetes manifest.',
  },
  {
    recommendationId: 'rec-002',
    title: 'Launch Q3 customer retention campaign',
    context:
      'Churn rate at 3.2%. NPS signal stale. Analytics show engagement drop in cohort C (enterprise).',
    domain: 'growth',
    projections: [
      {
        path: 'do_nothing',
        label: 'Do Nothing',
        expectedOutcome:
          'Churn continues at current rate. ARR impact -$68k over 90 days at current velocity.',
        impactScore: -70,
        riskDelta: +0.22,
        confidence: 0.76,
        timeToResult: '90 days',
        reversible: false,
        cost: 'none',
      },
      {
        path: 'delay_30d',
        label: 'Delay 30 Days',
        expectedOutcome: 'Some cohort C accounts churn before campaign reaches them. ~20% reduced effectiveness.',
        impactScore: -20,
        riskDelta: +0.08,
        confidence: 0.68,
        timeToResult: '30 days',
        reversible: false,
        cost: 'none',
      },
      {
        path: 'delegate',
        label: 'Delegate to CS Team',
        expectedOutcome:
          'CS team runs targeted outreach. Estimated 40% churn reduction for cohort C.',
        impactScore: 55,
        riskDelta: -0.18,
        confidence: 0.72,
        timeToResult: '2 weeks',
        reversible: true,
        rollbackPath: 'Pause campaign; no permanent state changes.',
        cost: 'low',
      },
      {
        path: 'execute_now',
        label: 'Execute Now',
        expectedOutcome: 'Automated retention sequence + exec outreach to top 5 at-risk accounts.',
        impactScore: 75,
        riskDelta: -0.25,
        confidence: 0.81,
        timeToResult: '48 hours',
        reversible: true,
        rollbackPath: 'Cancel campaign sequences via CRM. No financial commitment.',
        cost: 'medium',
      },
    ],
    recommendedPath: 'execute_now',
    rationale: 'Revenue at risk outweighs campaign cost. Early action recovers more at-risk accounts.',
    sources: ['analytics-engine', 'billing-api', 'crm-signals'],
    owner: 'Head of Growth',
    nextAction: 'Approve campaign brief and cohort C contact list.',
  },
  {
    recommendationId: 'rec-003',
    title: 'Patch 3 open critical CVEs in dependency chain',
    context:
      'Security scan found 3 critical CVEs in production dependency chain. CVSS scores 9.1, 8.8, 8.4.',
    domain: 'security',
    projections: [
      {
        path: 'do_nothing',
        label: 'Do Nothing',
        expectedOutcome:
          'Exploit probability rises to 65% within 30 days based on CVE threat intelligence.',
        impactScore: -95,
        riskDelta: +0.65,
        confidence: 0.89,
        timeToResult: '30 days',
        reversible: false,
        cost: 'none',
      },
      {
        path: 'delay_30d',
        label: 'Delay 30 Days',
        expectedOutcome: 'Unacceptable for CVSS >9. Regulatory exposure window remains open.',
        impactScore: -90,
        riskDelta: +0.55,
        confidence: 0.85,
        timeToResult: '30 days',
        reversible: false,
        cost: 'none',
      },
      {
        path: 'delegate',
        label: 'Delegate to Security Team',
        expectedOutcome: 'Security team patches within 72h SLA. Standard change control process.',
        impactScore: 80,
        riskDelta: -0.62,
        confidence: 0.88,
        timeToResult: '72 hours',
        reversible: true,
        rollbackPath: 'Revert dependency versions via package.json + lockfile.',
        cost: 'low',
      },
      {
        path: 'execute_now',
        label: 'Execute Now',
        expectedOutcome:
          'Emergency patch deployment. All 3 CVEs remediated. Verification scan within 1h.',
        impactScore: 95,
        riskDelta: -0.65,
        confidence: 0.93,
        timeToResult: '4 hours',
        reversible: true,
        rollbackPath: 'Rollback to previous release tag. Tested in staging.',
        cost: 'medium',
      },
    ],
    recommendedPath: 'execute_now',
    rationale:
      'Critical CVEs must be treated as P0. Immediate patch eliminates exploit window.',
    sources: ['security-scanner', 'nvd-feed', 'threat-intel'],
    owner: 'Security Lead',
    nextAction: 'Approve emergency patch PRs and fast-track CI pipeline.',
  },
];

export class CounterfactualLedgerService {
  getEntries(): CounterfactualLedger {
    const now = new Date();
    const entries: CounterfactualEntry[] = SAMPLE_ENTRIES.map((e, idx) => {
      // Derive rollbackPath for execute_now projection to include in completeness check.
      const executeNow = e.projections.find((p) => p.path === 'execute_now');
      const rollbackPath = executeNow?.rollbackPath ?? '';

      // Run governance completeness gate on every entry.
      // Entries missing any required field are marked invalid and blocked from approval.
      const governanceCheck = validateRecommendationCompleteness({
        sources: e.sources,
        confidence: executeNow?.confidence ?? 0,
        owner: e.owner,
        nextAction: e.nextAction,
        rollbackPath,
      });

      return {
        ...e,
        id: `cfl-${idx + 1}`,
        createdAt: new Date(now.getTime() - (idx + 1) * 3_600_000).toISOString(),
        expiresAt: new Date(now.getTime() + (7 - idx) * 86_400_000).toISOString(),
        governanceCheck,
      };
    });

    return {
      entries,
      totalEntries: entries.length,
      pendingDecisions: entries.filter(
        (e) => e.recommendedPath === 'execute_now' && e.governanceCheck.valid,
      ).length,
      retrievedAt: now.toISOString(),
    };
  }

  getEntry(id: string): CounterfactualEntry | undefined {
    const ledger = this.getEntries();
    return ledger.entries.find((e) => e.id === id);
  }
}

export const counterfactualLedger = new CounterfactualLedgerService();
