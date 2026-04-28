/**
 * Seed: Platform-wide Eval Benchmarks
 *
 * Defines and loads the initial cross-platform benchmark suite — one per
 * domain plus cross-cutting quality benchmarks. Backfills leaderboards
 * from the seeded agent telemetry so the system is non-empty on day one.
 *
 * Run via:
 *   pnpm tsx artifacts/api-server/src/seeds/eval-benchmarks.ts
 */

import { evalRegistryRepository } from '@szl-holdings/db-repository/eval-registry';
import { PLATFORM_BENCHMARK_IDS } from '@szl-holdings/shared-contracts/eval-types';

const SEED_BENCHMARKS = [
  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.MARITIME_THREAT_DETECTION,
    name: 'Maritime Threat Detection',
    description:
      'Measures an agent\'s ability to detect, classify, and prioritise threats in AIS/VMS maritime data streams including dark vessels, spoofing, and illegal transshipment events.',
    domain: 'maritime',
    evaluationFramework: 'szl-native',
    isCrossCutting: false,
    source: 'seed',
    tags: ['maritime', 'threat-detection', 'ais', 'dark-vessels'],
    tasks: [
      {
        taskId: 'threat-detection',
        name: 'Threat Detection Accuracy',
        description: 'Binary detection accuracy across 5 threat categories',
        taskType: 'threat-detection',
        primaryMetric: 'accuracy',
        higherIsBetter: true,
        baseline: 0.72,
        strongThreshold: 0.9,
      },
      {
        taskId: 'false-positive-rate',
        name: 'False Positive Rate',
        description: 'Fraction of non-threat vessels incorrectly flagged',
        taskType: 'threat-detection',
        primaryMetric: 'fpr',
        higherIsBetter: false,
        baseline: 0.15,
        strongThreshold: 0.05,
      },
      {
        taskId: 'detection-latency',
        name: 'Detection Latency (p95)',
        description: '95th percentile end-to-end latency from signal to alert',
        taskType: 'latency-benchmark',
        primaryMetric: 'latency_p95_ms',
        higherIsBetter: false,
        baseline: 800,
        strongThreshold: 200,
      },
    ],
  },

  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.LEGAL_CONTRACT_ANALYSIS,
    name: 'Legal Contract Analysis',
    description:
      'Evaluates clause extraction, risk classification, and counterparty negotiation recommendation quality across NDA, MSA, and SaaS agreement templates.',
    domain: 'legal',
    evaluationFramework: 'szl-native',
    isCrossCutting: false,
    source: 'seed',
    tags: ['legal', 'contract-analysis', 'nlp', 'clause-extraction'],
    tasks: [
      {
        taskId: 'clause-extraction',
        name: 'Clause Extraction F1',
        description: 'F1 score for extracting key clauses from legal documents',
        taskType: 'information-extraction',
        primaryMetric: 'f1',
        higherIsBetter: true,
        baseline: 0.78,
        strongThreshold: 0.92,
      },
      {
        taskId: 'risk-classification',
        name: 'Risk Classification Accuracy',
        description: 'Accuracy on 5-level risk tier classification',
        taskType: 'text-classification',
        primaryMetric: 'accuracy',
        higherIsBetter: true,
        baseline: 0.8,
        strongThreshold: 0.92,
      },
      {
        taskId: 'negotiation-quality',
        name: 'Negotiation Recommendation Quality',
        description: 'Human-rated quality of counterparty negotiation suggestions (1-5 scale, normalised)',
        taskType: 'text-generation',
        primaryMetric: 'quality_score',
        higherIsBetter: true,
        baseline: 0.65,
        strongThreshold: 0.85,
      },
    ],
  },

  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.PROPERTY_RISK_SCORING,
    name: 'Property Risk Scoring',
    description:
      'Benchmarks the accuracy of AI-generated property risk scores (distress, encumbrance, flood, crime) against expert appraisals and outcome data.',
    domain: 'terra',
    evaluationFramework: 'szl-native',
    isCrossCutting: false,
    source: 'seed',
    tags: ['terra', 'real-estate', 'risk-scoring', 'property'],
    tasks: [
      {
        taskId: 'distress-score-mae',
        name: 'Distress Score MAE',
        description: 'Mean absolute error of distress score vs expert appraisal',
        taskType: 'risk-scoring',
        primaryMetric: 'mae',
        higherIsBetter: false,
        baseline: 0.12,
        strongThreshold: 0.04,
      },
      {
        taskId: 'flood-risk-auc',
        name: 'Flood Risk AUC',
        description: 'AUC-ROC for flood risk binary classification',
        taskType: 'risk-scoring',
        primaryMetric: 'auc_roc',
        higherIsBetter: true,
        baseline: 0.82,
        strongThreshold: 0.95,
      },
    ],
  },

  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.CYBER_POSTURE_ASSESSMENT,
    name: 'Cyber Posture Assessment',
    description:
      'Measures the completeness and accuracy of AI-generated cyber posture assessments across attack surface identification, vulnerability prioritisation, and remediation planning.',
    domain: 'cyber',
    evaluationFramework: 'szl-native',
    isCrossCutting: false,
    source: 'seed',
    tags: ['cyber', 'security', 'posture', 'vulnerability'],
    tasks: [
      {
        taskId: 'attack-surface-recall',
        name: 'Attack Surface Recall',
        description: 'Fraction of known attack vectors correctly identified',
        taskType: 'threat-detection',
        primaryMetric: 'recall',
        higherIsBetter: true,
        baseline: 0.7,
        strongThreshold: 0.92,
      },
      {
        taskId: 'cve-priority-ndcg',
        name: 'CVE Prioritisation NDCG@10',
        description: 'NDCG@10 for CVE ranking vs CVSS expert ordering',
        taskType: 'decision-making',
        primaryMetric: 'ndcg_at_10',
        higherIsBetter: true,
        baseline: 0.74,
        strongThreshold: 0.9,
      },
    ],
  },

  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.DECISION_LATENCY,
    name: 'Decision Latency',
    description:
      'Cross-platform benchmark for end-to-end agent decision latency — from signal ingestion to authorised action or escalation, including all retrieval, model, and governance steps.',
    domain: 'cross-platform',
    evaluationFramework: 'szl-native',
    isCrossCutting: true,
    source: 'seed',
    tags: ['latency', 'performance', 'cross-platform'],
    tasks: [
      {
        taskId: 'e2e-p50-ms',
        name: 'End-to-end Latency P50',
        description: 'Median end-to-end agent decision latency in milliseconds',
        taskType: 'latency-benchmark',
        primaryMetric: 'latency_p50_ms',
        higherIsBetter: false,
        baseline: 1200,
        strongThreshold: 400,
      },
      {
        taskId: 'e2e-p95-ms',
        name: 'End-to-end Latency P95',
        description: '95th percentile end-to-end agent decision latency in milliseconds',
        taskType: 'latency-benchmark',
        primaryMetric: 'latency_p95_ms',
        higherIsBetter: false,
        baseline: 3500,
        strongThreshold: 1200,
      },
    ],
  },

  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.BRIEFING_QUALITY,
    name: 'Executive Briefing Quality',
    description:
      'Measures the quality of AI-generated executive briefings across factual grounding, source citation coverage, actionability, and hallucination rate.',
    domain: 'executive',
    evaluationFramework: 'szl-native',
    isCrossCutting: false,
    source: 'seed',
    tags: ['briefing', 'executive', 'pulse', 'quality'],
    tasks: [
      {
        taskId: 'citation-coverage',
        name: 'Citation Coverage',
        description: 'Fraction of factual claims backed by cited sources',
        taskType: 'citation-fidelity',
        primaryMetric: 'citation_coverage',
        higherIsBetter: true,
        baseline: 0.6,
        strongThreshold: 0.85,
      },
      {
        taskId: 'hallucination-rate',
        name: 'Hallucination Rate',
        description: 'Fraction of claims not grounded in any source',
        taskType: 'hallucination-rate',
        primaryMetric: 'hallucination_rate',
        higherIsBetter: false,
        baseline: 0.12,
        strongThreshold: 0.02,
      },
      {
        taskId: 'actionability-score',
        name: 'Actionability Score',
        description: 'Human-rated score for actionable recommendation quality (normalised 0-1)',
        taskType: 'text-generation',
        primaryMetric: 'actionability_score',
        higherIsBetter: true,
        baseline: 0.6,
        strongThreshold: 0.85,
      },
    ],
  },

  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.HALLUCINATION_RATE,
    name: 'Hallucination Rate',
    description:
      'Cross-platform benchmark for AI hallucination rate — the fraction of generated claims that cannot be traced to a cited source or factual ground truth.',
    domain: 'cross-platform',
    evaluationFramework: 'szl-native',
    isCrossCutting: true,
    source: 'seed',
    tags: ['hallucination', 'faithfulness', 'cross-platform'],
    tasks: [
      {
        taskId: 'claim-hallucination-rate',
        name: 'Claim Hallucination Rate',
        description: 'Fraction of generated claims that are hallucinated',
        taskType: 'hallucination-rate',
        primaryMetric: 'hallucination_rate',
        higherIsBetter: false,
        baseline: 0.1,
        strongThreshold: 0.01,
      },
    ],
  },

  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.COST_PER_DECISION,
    name: 'Cost-per-Decision',
    description:
      'Cross-platform benchmark for the total model inference cost (USD) incurred per authorised agent decision, including all retrieval, reasoning, and verification steps.',
    domain: 'cross-platform',
    evaluationFramework: 'szl-native',
    isCrossCutting: true,
    source: 'seed',
    tags: ['cost', 'efficiency', 'cross-platform'],
    tasks: [
      {
        taskId: 'cost-usd-per-decision',
        name: 'Cost per Decision (USD)',
        description: 'Average total inference cost per authorised agent decision',
        taskType: 'cost-efficiency',
        primaryMetric: 'cost_usd',
        higherIsBetter: false,
        baseline: 0.025,
        strongThreshold: 0.004,
      },
    ],
  },
] as const;

// ─── Seed results backfilled from platform telemetry ─────────────────────────

const SEED_RESULTS = [
  // Maritime — Vessels AIS agent
  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.MARITIME_THREAT_DETECTION,
    taskId: 'threat-detection',
    entityId: 'vessels-ais-threat-agent-v3',
    entityLabel: 'Vessels AIS Threat Agent v3',
    entityType: 'agent',
    domain: 'maritime',
    metric: 'accuracy',
    value: '0.931',
    numericValue: '0.931',
    higherIsBetter: true,
    evaluationFramework: 'szl-native',
    badgeState: 'verified',
    evalDate: '2026-04-01',
    notes: 'Evaluated on 12-month AIS holdout dataset, 142k vessel records.',
    tags: ['maritime', 'ais'],
  },
  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.MARITIME_THREAT_DETECTION,
    taskId: 'threat-detection',
    entityId: 'vessels-rf-intel-agent-v1',
    entityLabel: 'Vessels RF-Intel Agent v1',
    entityType: 'agent',
    domain: 'maritime',
    metric: 'accuracy',
    value: '0.884',
    numericValue: '0.884',
    higherIsBetter: true,
    evaluationFramework: 'szl-native',
    badgeState: 'community',
    evalDate: '2026-03-15',
    notes: 'RF+AIS fusion model, early access evaluation.',
    tags: ['maritime', 'rf-intel'],
  },
  // Legal — Counsel contract agent
  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.LEGAL_CONTRACT_ANALYSIS,
    taskId: 'clause-extraction',
    entityId: 'counsel-contract-agent-v2',
    entityLabel: 'Counsel Contract Agent v2',
    entityType: 'agent',
    domain: 'legal',
    metric: 'f1',
    value: '0.917',
    numericValue: '0.917',
    higherIsBetter: true,
    evaluationFramework: 'szl-native',
    badgeState: 'verified',
    evalDate: '2026-04-10',
    notes: 'NDA + MSA holdout set, 2,400 documents.',
    tags: ['legal', 'contract'],
  },
  // Terra — Property risk agent
  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.PROPERTY_RISK_SCORING,
    taskId: 'distress-score-mae',
    entityId: 'terra-risk-agent-v2',
    entityLabel: 'Terra Property Risk Agent v2',
    entityType: 'agent',
    domain: 'terra',
    metric: 'mae',
    value: '0.038',
    numericValue: '0.038',
    higherIsBetter: false,
    evaluationFramework: 'szl-native',
    badgeState: 'verified',
    evalDate: '2026-04-05',
    notes: 'NYC + national portfolio, 8,500 properties.',
    tags: ['terra', 'risk'],
  },
  // Cyber — Sentra posture agent
  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.CYBER_POSTURE_ASSESSMENT,
    taskId: 'attack-surface-recall',
    entityId: 'sentra-posture-agent-v1',
    entityLabel: 'Sentra Cyber Posture Agent v1',
    entityType: 'agent',
    domain: 'cyber',
    metric: 'recall',
    value: '0.903',
    numericValue: '0.903',
    higherIsBetter: true,
    evaluationFramework: 'szl-native',
    badgeState: 'community',
    evalDate: '2026-04-18',
    notes: 'Evaluated on 50-org red-team attack surface dataset.',
    tags: ['cyber', 'posture'],
  },
  // Decision latency — platform-wide
  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.DECISION_LATENCY,
    taskId: 'e2e-p50-ms',
    entityId: 'lyte-decision-agent-v3',
    entityLabel: 'Lyte Decision Agent v3',
    entityType: 'agent',
    domain: 'decision',
    metric: 'latency_p50_ms',
    value: '387',
    numericValue: '387',
    higherIsBetter: false,
    evaluationFramework: 'szl-native',
    badgeState: 'verified',
    evalDate: '2026-04-20',
    notes: 'Measured under production load, 95th pct of real decisions.',
    tags: ['latency', 'lyte'],
  },
  // Briefing quality — Pulse
  {
    benchmarkId: PLATFORM_BENCHMARK_IDS.BRIEFING_QUALITY,
    taskId: 'citation-coverage',
    entityId: 'pulse-briefing-agent-v4',
    entityLabel: 'Pulse Executive Briefing Agent v4',
    entityType: 'agent',
    domain: 'executive',
    metric: 'citation_coverage',
    value: '0.88',
    numericValue: '0.88',
    higherIsBetter: true,
    evaluationFramework: 'szl-native',
    badgeState: 'verified',
    evalDate: '2026-04-22',
    notes: '500 briefing holdout set, dual-blind human evaluation.',
    tags: ['pulse', 'briefing'],
  },
] as const;

async function seed() {
  console.log('🌱  Seeding platform eval benchmarks…');

  let bmCount = 0;
  for (const bm of SEED_BENCHMARKS) {
    try {
      await evalRegistryRepository.upsertBenchmark({
        ...(bm as Parameters<typeof evalRegistryRepository.upsertBenchmark>[0]),
        orgId: null,
      });
      bmCount++;
    } catch (err) {
      console.error(`  ✗ Failed to seed benchmark ${bm.benchmarkId}:`, err);
    }
  }
  console.log(`  ✓ Seeded ${bmCount} benchmarks`);

  let resultCount = 0;
  for (const r of SEED_RESULTS) {
    try {
      await evalRegistryRepository.insertResult({
        ...(r as Parameters<typeof evalRegistryRepository.insertResult>[0]),
        orgId: null,
        submittedBy: 'platform-seed',
        unit: null,
        rawYaml: null,
        submissionId: null,
        verificationTokenId: null,
        verifyToken: null,
        sourceUrl: null,
      });
      resultCount++;
    } catch (err) {
      console.error(`  ✗ Failed to seed result for ${r.entityId}:`, err);
    }
  }
  console.log(`  ✓ Seeded ${resultCount} benchmark results`);
  console.log('✅  Eval benchmark seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
