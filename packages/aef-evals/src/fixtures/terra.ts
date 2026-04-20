import type { GoldenQuery } from '../metrics.js';

export const TERRA_GOLDEN_QUERIES: GoldenQuery[] = [
  {
    queryId: 'terra-q001',
    query: 'Show me distressed properties in Brooklyn with parcel ID 309-442-1001.',
    relevantChunkIds: ['terra-chunk-001', 'terra-chunk-002'],
    exactMatchBoostTerms: ['parcel ID', 'BBL', 'distress'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'structured_id' },
  },
  {
    queryId: 'terra-q002',
    query: 'Which properties in Manhattan have active tax lien filings?',
    relevantChunkIds: ['terra-chunk-003', 'terra-chunk-004', 'terra-chunk-005'],
    exactMatchBoostTerms: ['tax lien', 'distress'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'natural_language' },
  },
  {
    queryId: 'terra-q003',
    query: 'What is the ownership structure behind 548 West 46th Street?',
    relevantChunkIds: ['terra-chunk-006', 'terra-chunk-007'],
    exactMatchBoostTerms: ['property address', 'owner of record'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'natural_language' },
  },
  {
    queryId: 'terra-q004',
    query: 'List all deals in the diligence stage within the Bronx portfolio.',
    relevantChunkIds: ['terra-chunk-008', 'terra-chunk-009'],
    exactMatchBoostTerms: ['BBL', 'distress'],
    metadata: { domain: 'terra', entityTypes: ['deal'], queryType: 'natural_language' },
  },
  {
    queryId: 'terra-q005',
    query: 'Are there any lis pendens filings on properties controlled by Hudson Valley Holdings?',
    relevantChunkIds: ['terra-chunk-010', 'terra-chunk-011'],
    exactMatchBoostTerms: ['lis pendens', 'distress', 'owner of record'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'natural_language' },
  },
  {
    queryId: 'terra-q006',
    query: 'What co-op boards have outstanding violations in Queens?',
    relevantChunkIds: ['terra-chunk-012', 'terra-chunk-013'],
    exactMatchBoostTerms: ['co-op', 'distress'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'natural_language' },
  },
  {
    queryId: 'terra-q007',
    query: 'BBL 1-01075-0032',
    relevantChunkIds: ['terra-chunk-006', 'terra-chunk-007'],
    exactMatchBoostTerms: ['BBL', 'property address'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'structured_id' },
  },
  {
    queryId: 'terra-q008',
    query: 'deal D-2024-BX-07 distress score and arrears',
    relevantChunkIds: ['terra-chunk-008', 'terra-chunk-009'],
    exactMatchBoostTerms: ['BBL', 'distress'],
    metadata: { domain: 'terra', entityTypes: ['deal'], queryType: 'structured_id' },
  },
  {
    queryId: 'terra-q009',
    query: 'HPD violation history for 4821 Church Avenue Brooklyn',
    relevantChunkIds: ['terra-chunk-002', 'terra-chunk-014'],
    exactMatchBoostTerms: ['HPD', 'distress'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'natural_language' },
  },
  {
    queryId: 'terra-q010',
    query: 'Which neighborhoods saw the largest jump in tax delinquency notices in Q1?',
    relevantChunkIds: ['terra-chunk-003', 'terra-chunk-015'],
    exactMatchBoostTerms: ['tax lien', 'distress'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'natural_language' },
  },
  {
    queryId: 'terra-q011',
    query: 'Marcus Webb beneficial ownership across the portfolio',
    relevantChunkIds: ['terra-chunk-006', 'terra-chunk-016'],
    exactMatchBoostTerms: ['owner of record', 'beneficial owner'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'multi_entity' },
  },
  {
    queryId: 'terra-q012',
    query: 'deals with both lis pendens and tax liens on the same parcel',
    relevantChunkIds: ['terra-chunk-005', 'terra-chunk-011', 'terra-chunk-017'],
    exactMatchBoostTerms: ['lis pendens', 'tax lien', 'distress'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'multi_entity' },
  },
  {
    queryId: 'terra-q013',
    query: 'that big building near times square owned by some llc',
    relevantChunkIds: ['terra-chunk-006', 'terra-chunk-007'],
    exactMatchBoostTerms: ['property address', 'owner of record'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'ambiguous' },
  },
  {
    queryId: 'terra-q014',
    query: 'Foreclosure auction calendar Q3 2024 New York City',
    relevantChunkIds: ['terra-chunk-018', 'terra-chunk-019'],
    exactMatchBoostTerms: ['foreclosure', 'distress'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'natural_language' },
  },
  {
    queryId: 'terra-q015',
    query: 'Cap rate compression analysis for Brooklyn multifamily Q2 2024',
    relevantChunkIds: ['terra-chunk-020'],
    exactMatchBoostTerms: ['cap rate'],
    metadata: { domain: 'terra', entityTypes: ['deal'], queryType: 'natural_language' },
  },
  {
    queryId: 'terra-q016',
    query: 'Pro forma underwriting assumptions for Bronx deal pipeline',
    relevantChunkIds: ['terra-chunk-009', 'terra-chunk-021'],
    exactMatchBoostTerms: ['pro forma', 'deal'],
    metadata: { domain: 'terra', entityTypes: ['deal'], queryType: 'natural_language' },
  },
  {
    queryId: 'terra-q017',
    query: 'violations on co-op BBL 4-01823-0010',
    relevantChunkIds: ['terra-chunk-012'],
    exactMatchBoostTerms: ['co-op', 'BBL'],
    metadata: { domain: 'terra', entityTypes: ['property'], queryType: 'structured_id' },
  },
  {
    queryId: 'terra-q018',
    query: 'paleontology dinosaur fossil cretaceous period excavation techniques',
    relevantChunkIds: [],
    expectedRelevant: 0,
    exactMatchBoostTerms: [],
    metadata: { domain: 'terra', queryType: 'adversarial', reason: 'off-domain natural sciences' },
  },
  {
    queryId: 'terra-q019',
    query: 'opera music aria soprano vocal warmup exercises',
    relevantChunkIds: [],
    expectedRelevant: 0,
    exactMatchBoostTerms: [],
    metadata: { domain: 'terra', queryType: 'adversarial', reason: 'off-domain music' },
  },
  {
    queryId: 'terra-q020',
    query: 'macrame wall hanging knotting bohemian fiber yarn',
    relevantChunkIds: [],
    expectedRelevant: 0,
    exactMatchBoostTerms: [],
    metadata: { domain: 'terra', queryType: 'adversarial', reason: 'off-domain handicraft' },
  },
];

export const TERRA_MOCK_CORPUS = new Map<string, { text: string; boostTerms: string[] }>([
  [
    'terra-chunk-001',
    {
      text: 'Property record — Parcel ID: 309-442-1001 (BBL: 3-09442-1001). Address: 4821 Church Avenue, Brooklyn, NY. Owner of record: Bethlehem Realty LLC. Distress score: 0.74. Active liens: 2.',
      boostTerms: ['parcel ID', 'BBL', 'distress'],
    },
  ],
  [
    'terra-chunk-002',
    {
      text: 'Distress signal: BBL 3-09442-1001 — 4821 Church Ave Brooklyn — tax delinquency notice filed 2024-01-18. HPD violations: 7 open. Classified as high-distress asset.',
      boostTerms: ['parcel ID', 'BBL', 'distress', 'HPD'],
    },
  ],
  [
    'terra-chunk-003',
    {
      text: "Manhattan tax lien report Q2 2024: 234 properties with active NYC Department of Finance tax lien filings. Highest concentration in Hell's Kitchen and East Harlem sub-markets.",
      boostTerms: ['tax lien', 'distress'],
    },
  ],
  [
    'terra-chunk-004',
    {
      text: 'Tax lien filing — 219 W 81st Street, Manhattan (BBL 1-01234-0056). Owner: Riverside Property Partners LLC. Lien amount: $148,000. Filed: 2024-03-02.',
      boostTerms: ['tax lien', 'distress'],
    },
  ],
  [
    'terra-chunk-005',
    {
      text: 'Tax lien cluster alert: 12 Manhattan properties owned by entities linked to Harlem Capital Group showing simultaneous lien filings in Q1 2024. Portfolio distress indicator triggered.',
      boostTerms: ['tax lien', 'distress', 'lis pendens'],
    },
  ],
  [
    'terra-chunk-006',
    {
      text: 'Ownership chain — 548 West 46th Street, Manhattan (BBL 1-01075-0032): Owner of record: West Side Developments LLC. Beneficial controller: Marcus Webb (90% interest via holding entity MWP Holdings NJ).',
      boostTerms: ['property address', 'owner of record', 'BBL', 'beneficial owner'],
    },
  ],
  [
    'terra-chunk-007',
    {
      text: '548 W 46th Street ownership history: conveyed from Meridian NYC LLC to West Side Developments LLC on 2022-11-14. Transfer price: $4.2M. Mortgage: $3.1M (First Republic, now JPMorgan).',
      boostTerms: ['property address', 'owner of record', 'BBL'],
    },
  ],
  [
    'terra-chunk-008',
    {
      text: 'Bronx deal pipeline — diligence stage: 4 active deals. Deal D-2024-BX-07 (2456 Grand Concourse), D-2024-BX-09 (714 E 180th St), D-2024-BX-12 (99 Lincoln Ave), D-2024-BX-15 (4501 Third Ave).',
      boostTerms: ['BBL', 'distress'],
    },
  ],
  [
    'terra-chunk-009',
    {
      text: 'Deal D-2024-BX-07 — 2456 Grand Concourse, Bronx. Diligence stage. Estimated value: $6.8M. Distress score: 0.81. Tax arrears: $212,000. LOI signed: 2024-05-28.',
      boostTerms: ['BBL', 'distress', 'pro forma'],
    },
  ],
  [
    'terra-chunk-010',
    {
      text: 'Lis pendens filing — Owner: Hudson Valley Holdings LLC. Properties affected: 3 in Brooklyn, 1 in Queens. Filing date: 2024-04-03. Foreclosure action initiated by lender First National Community Bank.',
      boostTerms: ['lis pendens', 'distress', 'owner of record', 'foreclosure'],
    },
  ],
  [
    'terra-chunk-011',
    {
      text: 'Hudson Valley Holdings — lis pendens cluster: BBLs 3-05812-0044, 3-06231-0017, 3-07809-0023, 4-11204-0088. All filed within 10-day window. Possible strategic default scenario.',
      boostTerms: ['lis pendens', 'distress', 'tax lien'],
    },
  ],
  [
    'terra-chunk-012',
    {
      text: 'Co-op board violations — Queens Q2 2024: Forest Hills Gardens Co-op (BBL 4-01823-0010): 4 open ECB violations. Kew Gardens Residence Corp (BBL 4-02107-0041): 2 open violations.',
      boostTerms: ['co-op', 'distress', 'BBL'],
    },
  ],
  [
    'terra-chunk-013',
    {
      text: 'Queens co-op outstanding violations summary: 17 co-op boards with active Department of Buildings violations as of June 2024. Top violation category: elevator maintenance non-compliance.',
      boostTerms: ['co-op', 'distress'],
    },
  ],
  [
    'terra-chunk-014',
    {
      text: 'HPD violation roll-up for 4821 Church Avenue: 7 open class-B violations (heat/hot water, vermin, peeling lead paint). Earliest open violation dates to 2022-09-11. No active vacate orders.',
      boostTerms: ['HPD', 'distress'],
    },
  ],
  [
    'terra-chunk-015',
    {
      text: "NYC tax delinquency notice trend Q1 2024 by neighborhood: East Harlem +38% YoY, Bushwick +31%, Mott Haven +27%, Hell's Kitchen +19%. Aggregate notices issued: 1,847.",
      boostTerms: ['tax lien', 'distress'],
    },
  ],
  [
    'terra-chunk-016',
    {
      text: 'Beneficial owner portfolio map — Marcus Webb: controlling interest in 6 LLCs (West Side Developments, MWP Holdings NJ, Riverbend Equities, Hudson West Capital, 46 St Partners, Webb Family Trust II). Combined NYC asset value: $58M.',
      boostTerms: ['owner of record', 'beneficial owner'],
    },
  ],
  [
    'terra-chunk-017',
    {
      text: 'Combined-distress parcel watchlist: 11 BBLs with both active tax lien and lis pendens filing as of 2024-06-15. Aggregate exposure: $9.4M in arrears, $24M in mortgage principal.',
      boostTerms: ['lis pendens', 'tax lien', 'distress'],
    },
  ],
  [
    'terra-chunk-018',
    {
      text: 'NYC foreclosure auction calendar Q3 2024: 142 scheduled auctions across the five boroughs. Brooklyn leads with 51, followed by Queens (37) and Bronx (28). Manhattan: 14, Staten Island: 12.',
      boostTerms: ['foreclosure', 'distress'],
    },
  ],
  [
    'terra-chunk-019',
    {
      text: 'Featured Q3 foreclosure auction — 1147 Bedford Avenue, Brooklyn (BBL 3-01900-0023): scheduled 2024-08-14, opening bid $1.85M, mortgage debt $2.4M. Second mortgage holder: Bedford Capital Lending.',
      boostTerms: ['foreclosure', 'BBL'],
    },
  ],
  [
    'terra-chunk-020',
    {
      text: 'Brooklyn multifamily cap rate analysis Q2 2024: trailing 90-day average 5.4%, compressed 40bps from Q1. Class B trades clearing at 5.1-5.6% range. Discount window narrowing relative to Manhattan.',
      boostTerms: ['cap rate'],
    },
  ],
  [
    'terra-chunk-021',
    {
      text: 'Bronx pipeline pro forma assumptions: 6.0% exit cap, 8.5% blended rent growth over 3-year hold, 65% LTV at 7.25% interest. Stabilised yield-on-cost target: 7.8%.',
      boostTerms: ['pro forma', 'deal'],
    },
  ],
]);
