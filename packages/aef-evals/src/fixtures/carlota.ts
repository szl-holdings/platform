import type { GoldenQuery } from '../metrics.js';

export const CARLOTA_GOLDEN_QUERIES: GoldenQuery[] = [
  {
    queryId: 'carlota-q001',
    query: 'Retrieve the strategy brief for engagement ENG-2024-CJ-007.',
    relevantChunkIds: ['carlota-chunk-001', 'carlota-chunk-002'],
    exactMatchBoostTerms: ['engagement', 'advisory brief'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'structured_id' },
  },
  {
    queryId: 'carlota-q002',
    query:
      'What deliverables were completed in the brand positioning project for Client Ref CJ-P-0042?',
    relevantChunkIds: ['carlota-chunk-003', 'carlota-chunk-004'],
    exactMatchBoostTerms: ['client reference', 'brand positioning', 'deliverable'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'structured_id' },
  },
  {
    queryId: 'carlota-q003',
    query: 'Which retainer clients are in the active engagement stage this quarter?',
    relevantChunkIds: ['carlota-chunk-005', 'carlota-chunk-006'],
    exactMatchBoostTerms: ['retainer', 'engagement'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'natural_language' },
  },
  {
    queryId: 'carlota-q004',
    query: "Show me the strategy advisory brief for the principal's Q3 board presentation.",
    relevantChunkIds: ['carlota-chunk-007', 'carlota-chunk-008'],
    exactMatchBoostTerms: ['strategy', 'advisory brief', 'principal'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'natural_language' },
  },
  {
    queryId: 'carlota-q005',
    query: 'What outstanding invoices are linked to the operations advisory retainer?',
    relevantChunkIds: ['carlota-chunk-009', 'carlota-chunk-010'],
    exactMatchBoostTerms: ['invoice', 'retainer'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'natural_language' },
  },
  {
    queryId: 'carlota-q006',
    query: 'List project milestones achieved for engagement ENG-2024-CJ-012.',
    relevantChunkIds: ['carlota-chunk-011', 'carlota-chunk-012'],
    exactMatchBoostTerms: ['project milestone', 'engagement'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'structured_id' },
  },
  {
    queryId: 'carlota-q007',
    query: 'ENG-2024-CJ-009',
    relevantChunkIds: ['carlota-chunk-005', 'carlota-chunk-009', 'carlota-chunk-010'],
    exactMatchBoostTerms: ['engagement', 'retainer'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'structured_id' },
  },
  {
    queryId: 'carlota-q008',
    query: 'Which principals have engagements ending before September?',
    relevantChunkIds: ['carlota-chunk-006', 'carlota-chunk-013'],
    exactMatchBoostTerms: ['principal', 'engagement'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'natural_language' },
  },
  {
    queryId: 'carlota-q009',
    query: 'scope creep flagged on brand advisory work this quarter',
    relevantChunkIds: ['carlota-chunk-011', 'carlota-chunk-014'],
    exactMatchBoostTerms: ['scope', 'engagement'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'natural_language' },
  },
  {
    queryId: 'carlota-q010',
    query: 'Invoice INV-2024-CJ-039 aging and payment status',
    relevantChunkIds: ['carlota-chunk-009', 'carlota-chunk-010'],
    exactMatchBoostTerms: ['invoice'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'structured_id' },
  },
  {
    queryId: 'carlota-q011',
    query: "Carlota's recommendations for Q3 2024 capital allocation narrative",
    relevantChunkIds: ['carlota-chunk-007', 'carlota-chunk-008', 'carlota-chunk-015'],
    exactMatchBoostTerms: ['advisory brief', 'principal', 'strategy'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'natural_language' },
  },
  {
    queryId: 'carlota-q012',
    query: 'engagement with overdue invoice and active deliverable past milestone',
    relevantChunkIds: ['carlota-chunk-009', 'carlota-chunk-011', 'carlota-chunk-016'],
    exactMatchBoostTerms: ['invoice', 'engagement', 'project milestone'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'multi_entity' },
  },
  {
    queryId: 'carlota-q013',
    query: 'the thing carlota wrote for the principal about the board',
    relevantChunkIds: ['carlota-chunk-007', 'carlota-chunk-008'],
    exactMatchBoostTerms: ['advisory brief', 'principal'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'ambiguous' },
  },
  {
    queryId: 'carlota-q014',
    query: 'Pilot market selection rationale for national expansion strategy',
    relevantChunkIds: ['carlota-chunk-001', 'carlota-chunk-002', 'carlota-chunk-017'],
    exactMatchBoostTerms: ['strategy', 'advisory brief'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'natural_language' },
  },
  {
    queryId: 'carlota-q015',
    query: 'Renewal review checklist for September retainer cycle',
    relevantChunkIds: ['carlota-chunk-006', 'carlota-chunk-018'],
    exactMatchBoostTerms: ['retainer'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'natural_language' },
  },
  {
    queryId: 'carlota-q016',
    query: 'Brand audit report deliverable accepted CJ-P-0042',
    relevantChunkIds: ['carlota-chunk-003', 'carlota-chunk-004'],
    exactMatchBoostTerms: ['brand positioning', 'deliverable', 'client reference'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'structured_id' },
  },
  {
    queryId: 'carlota-q017',
    query: 'Confidentiality posture for principal-redacted engagement notes',
    relevantChunkIds: ['carlota-chunk-001', 'carlota-chunk-019'],
    exactMatchBoostTerms: ['principal', 'confidentiality'],
    metadata: { domain: 'carlota', entityTypes: ['engagement'], queryType: 'natural_language' },
  },
  {
    queryId: 'carlota-q018',
    query: 'deep sea fishing expedition tuna tackle bohemian',
    relevantChunkIds: [],
    expectedRelevant: 0,
    exactMatchBoostTerms: [],
    metadata: { domain: 'carlota', queryType: 'adversarial', reason: 'off-domain recreation' },
  },
  {
    queryId: 'carlota-q019',
    query: 'planetary science exoplanet atmosphere spectroscopy methods',
    relevantChunkIds: [],
    expectedRelevant: 0,
    exactMatchBoostTerms: [],
    metadata: {
      domain: 'carlota',
      queryType: 'adversarial',
      reason: 'off-domain natural sciences',
    },
  },
  {
    queryId: 'carlota-q020',
    query: 'ENG-9999-CJ-999 nonexistent advisory engagement summary',
    relevantChunkIds: [],
    expectedRelevant: 0,
    exactMatchBoostTerms: [],
    metadata: {
      domain: 'carlota',
      queryType: 'adversarial',
      reason: 'invalid engagement identifier',
    },
  },
];

export const CARLOTA_MOCK_CORPUS = new Map<string, { text: string; boostTerms: string[] }>([
  [
    'carlota-chunk-001',
    {
      text: 'Engagement ENG-2024-CJ-007 — Strategy Advisory. Principal: [REDACTED]. Status: Active. Advisory brief: Repositioning the operating entity from regional to national scope. Three pillars: market expansion, brand credibility, and operational consolidation.',
      boostTerms: ['engagement', 'advisory brief', 'principal', 'confidentiality'],
    },
  ],
  [
    'carlota-chunk-002',
    {
      text: 'ENG-2024-CJ-007 strategy brief summary: analysis of six comparable market entries over prior 5 years. Recommendation: phased national expansion starting Q3 2024, anchored in two pilot markets. Confidence: HIGH.',
      boostTerms: ['engagement', 'advisory brief', 'strategy'],
    },
  ],
  [
    'carlota-chunk-003',
    {
      text: 'Client Reference CJ-P-0042 — Brand Positioning Project. Deliverables completed: (1) Brand audit report, (2) Positioning framework document, (3) Visual identity brief, (4) Key message architecture. All four delivered and accepted as of 2024-05-30.',
      boostTerms: ['client reference', 'brand positioning', 'deliverable'],
    },
  ],
  [
    'carlota-chunk-004',
    {
      text: 'CJ-P-0042 brand positioning — principal feedback: framework approved. Visual identity brief forwarded to external design firm. Key message architecture approved for use in Q3 communications rollout.',
      boostTerms: ['client reference', 'brand positioning', 'deliverable', 'principal'],
    },
  ],
  [
    'carlota-chunk-005',
    {
      text: 'Active retainer engagements Q3 2024: ENG-2024-CJ-007 (strategy), ENG-2024-CJ-009 (operations), ENG-2024-CJ-011 (brand). All three principals have confirmed Q3 continuity. ENG-2024-CJ-011 scheduled for scope review July 10.',
      boostTerms: ['retainer', 'engagement', 'scope'],
    },
  ],
  [
    'carlota-chunk-006',
    {
      text: 'Retainer client status — active engagements: 3 principals on monthly retainer, 2 on project retainer. All retainer agreements current. Next renewal review cycle: September 2024.',
      boostTerms: ['retainer', 'engagement', 'principal'],
    },
  ],
  [
    'carlota-chunk-007',
    {
      text: 'Q3 board presentation strategy advisory brief — Principal advisory note: framework for presenting the operating portfolio to board. Recommended narrative arc: resilience thesis, then growth thesis, then capital allocation discussion.',
      boostTerms: ['strategy', 'advisory brief', 'principal'],
    },
  ],
  [
    'carlota-chunk-008',
    {
      text: 'Strategy brief for Q3 board: presentation structure agreed with principal 2024-06-28. Opening: operating summary (5 slides). Middle: strategic priorities (8 slides). Close: capital ask and timeline (3 slides). Rehearsal scheduled July 14.',
      boostTerms: ['strategy', 'advisory brief', 'principal'],
    },
  ],
  [
    'carlota-chunk-009',
    {
      text: 'Outstanding invoices — operations advisory retainer: INV-2024-CJ-039 ($8,500, 45 days outstanding). INV-2024-CJ-044 ($8,500, 15 days outstanding). Both linked to ENG-2024-CJ-009 operations retainer.',
      boostTerms: ['invoice', 'retainer', 'engagement'],
    },
  ],
  [
    'carlota-chunk-010',
    {
      text: 'Operations advisory retainer billing summary: ENG-2024-CJ-009. Retainer rate: $8,500/month. Invoices issued: 6. Invoices paid: 4. Invoices outstanding: 2. Aging: INV-039 (45d), INV-044 (15d).',
      boostTerms: ['invoice', 'retainer', 'engagement'],
    },
  ],
  [
    'carlota-chunk-011',
    {
      text: 'Engagement ENG-2024-CJ-012 — Brand Advisory. Project milestones achieved: M1 Discovery complete (April 8), M2 Brand architecture approved (May 14), M3 Launch collateral delivered (June 3). M4 Rollout support in progress.',
      boostTerms: ['project milestone', 'engagement', 'scope'],
    },
  ],
  [
    'carlota-chunk-012',
    {
      text: 'ENG-2024-CJ-012 milestone completion record: 3 of 4 milestones complete. M4 (6-month rollout support) 40% complete as of June 30, 2024. On track for full completion by Q4.',
      boostTerms: ['project milestone', 'engagement'],
    },
  ],
  [
    'carlota-chunk-013',
    {
      text: 'Engagement runway by principal: 2 engagements concluding before September 2024 — ENG-2024-CJ-005 (concludes Aug 12, principal pending renewal decision), ENG-2024-CJ-008 (concludes Aug 30, principal opted out of renewal).',
      boostTerms: ['principal', 'engagement'],
    },
  ],
  [
    'carlota-chunk-014',
    {
      text: 'Scope creep flag — ENG-2024-CJ-012 brand advisory: rollout support requests now include social channel management not in original SOW. Carlota recommended scope reset conversation; principal agreed to revisit at July 22 check-in.',
      boostTerms: ['scope', 'engagement'],
    },
  ],
  [
    'carlota-chunk-015',
    {
      text: 'Capital allocation narrative draft — Q3 board: balanced thesis recommending 60% reinvestment into operating portfolio, 25% selective M&A, 15% return of capital. Carlota framing emphasises resilience-first messaging.',
      boostTerms: ['advisory brief', 'strategy'],
    },
  ],
  [
    'carlota-chunk-016',
    {
      text: 'Engagement health composite — ENG-2024-CJ-009 operations retainer: invoice aging amber (INV-039 45d), deliverable past milestone date (M2 ops handbook +9 days), satisfaction green. Recommended action: principal touch-base.',
      boostTerms: ['invoice', 'engagement', 'project milestone'],
    },
  ],
  [
    'carlota-chunk-017',
    {
      text: 'Pilot market shortlist for national expansion strategy — top two recommendations: Atlanta GA and Denver CO. Selection rationale: market size adjacency, talent availability, regulatory environment, and modest competitive density.',
      boostTerms: ['strategy', 'advisory brief'],
    },
  ],
  [
    'carlota-chunk-018',
    {
      text: 'September retainer renewal checklist: validate scope, confirm rate card, refresh confidentiality undertakings, align on quarterly KPIs, schedule annual principal off-site. Owner: Carlota. Target completion: 2024-09-15.',
      boostTerms: ['retainer'],
    },
  ],
  [
    'carlota-chunk-019',
    {
      text: 'Confidentiality posture for principal-facing engagements: all client identifiers redacted in shared drives. Strategy briefs labelled CJ-CONFIDENTIAL. Access limited to Carlota and named delivery leads. NDA in force on all retainers.',
      boostTerms: ['principal', 'confidentiality'],
    },
  ],
]);
