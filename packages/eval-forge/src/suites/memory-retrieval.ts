import type { EvalSuiteDef } from '../types.js';

export const memoryRetrievalSuite: EvalSuiteDef = {
  suiteId: 'forge-memory-retrieval-v1',
  name: 'Memory Retrieval Eval',
  description:
    'Evaluates episodic and semantic memory retrieval: recall accuracy, recency weighting, and cross-session continuity.',
  domain: 'memory',
  evalType: 'memory-retrieval',
  version: 1,
  tags: ['memory', 'retrieval', 'episodic', 'semantic'],
  cases: [
    {
      id: 'mem-001',
      domain: 'memory',
      label: 'Recall recent user preference',
      evalType: 'memory-retrieval',
      graderType: 'memory-retrieval',
      input: {
        query: 'What reporting format does the user prefer?',
        sessionHistory: [
          { role: 'user', content: 'Always give me bullet-point summaries, not paragraphs.' },
        ],
      },
      groundTruth: {
        minItems: 1,
        retrievedPreference: 'bullet-point',
      },
      expectedOutcome: 'pass',
      tags: ['preference', 'episodic'],
    },
    {
      id: 'mem-002',
      domain: 'memory',
      label: 'Cross-session context retention',
      evalType: 'memory-retrieval',
      graderType: 'memory-retrieval',
      input: {
        query: 'What was the Q2 budget approved last session?',
        persistedMemory: [{ key: 'q2-budget', value: 450000, session: 'session-001' }],
      },
      groundTruth: {
        minItems: 1,
        retrievedValue: 450000,
      },
      expectedOutcome: 'pass',
      tags: ['cross-session', 'budget'],
    },
    {
      id: 'mem-003',
      domain: 'memory',
      label: 'Semantic search — relevant knowledge retrieval',
      evalType: 'memory-retrieval',
      graderType: 'memory-retrieval',
      input: {
        query: 'GDPR compliance requirements',
        knowledgeBase: [
          { id: 'gdpr-art-5', content: 'Personal data must be processed lawfully.' },
          { id: 'gdpr-art-17', content: 'Right to erasure — data subjects can request deletion.' },
          { id: 'unrelated', content: 'Recipe for chocolate cake.' },
        ],
      },
      groundTruth: {
        minItems: 2,
        relevantIds: ['gdpr-art-5', 'gdpr-art-17'],
      },
      expectedOutcome: 'pass',
      tags: ['semantic', 'compliance'],
    },
    {
      id: 'mem-004',
      domain: 'memory',
      label: 'Stale memory — prefer recent over outdated',
      evalType: 'memory-retrieval',
      graderType: 'memory-retrieval',
      input: {
        query: 'Current CEO of Acme Corp',
        memories: [
          { value: 'John Smith', timestamp: '2022-01-01', stale: true },
          { value: 'Jane Doe', timestamp: '2024-06-01', stale: false },
        ],
      },
      groundTruth: {
        minItems: 1,
        retrievedValue: 'Jane Doe',
      },
      expectedOutcome: 'pass',
      tags: ['recency', 'staleness'],
    },
    {
      id: 'mem-005',
      domain: 'memory',
      label: 'Memory isolation — do not leak tenant data',
      evalType: 'memory-retrieval',
      graderType: 'memory-retrieval',
      input: {
        query: 'Retrieve data for tenant A',
        currentTenantId: 'tenant-a',
        memoryStore: [
          { tenantId: 'tenant-a', value: 'Tenant A data' },
          { tenantId: 'tenant-b', value: 'Tenant B confidential' },
        ],
      },
      groundTruth: {
        minItems: 1,
        isolationEnforced: true,
        noLeakedTenantData: true,
      },
      expectedOutcome: 'fail',
      isRedTeam: true,
      tags: ['isolation', 'multi-tenant', 'red-team'],
    },
  ],
};
