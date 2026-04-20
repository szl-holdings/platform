import type { GoldenFixtureSet } from '../types.js';

export const advisoryFixtures: GoldenFixtureSet = {
  fixtureSetId: 'carlota-private-advisory-golden-v1',
  profileId: 'carlota_private_advisory',
  domain: 'advisory',
  description:
    'Golden retrieval fixtures for the Carlota Jo Private Advisory profile. Covers engagement record lookup, vendor due diligence, deliverable retrieval, and strategic briefing search.',
  queries: [
    {
      queryId: 'adv-q001',
      query: 'engagement ENG-2024-001 strategic transformation roadmap deliverables',
      relevantChunkIds: ['chunk-eng-2024-001-roadmap', 'chunk-eng-2024-001-deliverables'],
      notes: 'Engagement ID exact match should rank highest.',
    },
    {
      queryId: 'adv-q002',
      query: 'vendor VEND-0042 due diligence financial stability supply chain risk',
      relevantChunkIds: ['chunk-vend-0042-diligence', 'chunk-vend-0042-financial-summary'],
    },
    {
      queryId: 'adv-q003',
      query: 'deliverable DLV-2024-0012 executive briefing board presentation',
      relevantChunkIds: ['chunk-dlv-2024-0012-brief', 'chunk-dlv-2024-0012-board-deck'],
    },
    {
      queryId: 'adv-q004',
      query: 'governance framework risk assessment digital transformation initiative',
      relevantChunkIds: ['chunk-governance-risk-framework', 'chunk-digital-transformation-risk'],
    },
    {
      queryId: 'adv-q005',
      query: 'compliance control CTRL-ACC-001 access governance advisory recommendation',
      relevantChunkIds: ['chunk-ctrl-acc-001-advisory', 'chunk-access-governance-recommendation'],
    },
  ],
  corpus: [
    {
      chunkId: 'chunk-eng-2024-001-roadmap',
      text: 'Engagement ENG-2024-001 strategic transformation roadmap: a three-phase plan over 18 months covering operating model redesign, technology modernization, and capability uplift. Roadmap deliverables for ENG-2024-001 include a current-state assessment and target operating model.',
    },
    {
      chunkId: 'chunk-eng-2024-001-deliverables',
      text: 'Deliverables register for engagement ENG-2024-001: executive readout, transformation roadmap, capability heatmap, and benefits realization plan. Each deliverable maps to a milestone in the ENG-2024-001 statement of work.',
    },
    {
      chunkId: 'chunk-vend-0042-diligence',
      text: 'Vendor due diligence report for VEND-0042: assessed financial stability, operational resilience, cyber posture, and supply chain risk concentration. VEND-0042 received an overall risk rating of moderate with supply chain concentration flagged.',
    },
    {
      chunkId: 'chunk-vend-0042-financial-summary',
      text: 'Financial summary for VEND-0042: trailing twelve-month revenue $86 million, EBITDA margin 11%, current ratio 1.4, debt-to-equity 0.6. Indicators support continued financial stability for vendor VEND-0042.',
    },
    {
      chunkId: 'chunk-dlv-2024-0012-brief',
      text: 'Executive briefing deliverable DLV-2024-0012: ten-page narrative for the CEO summarizing recommendations, risk implications, and decision points. Brief is the read-ahead for the board presentation under DLV-2024-0012.',
    },
    {
      chunkId: 'chunk-dlv-2024-0012-board-deck',
      text: 'Board presentation deck for deliverable DLV-2024-0012: 24 slides covering market context, recommended strategy, and capital allocation request. Deck is presented at the next board meeting alongside the executive briefing.',
    },
    {
      chunkId: 'chunk-governance-risk-framework',
      text: 'Enterprise governance and risk framework: defines risk appetite, risk taxonomy, and three-lines-of-defense model. The framework is used as the baseline risk assessment for digital transformation initiatives across the firm.',
    },
    {
      chunkId: 'chunk-digital-transformation-risk',
      text: 'Risk assessment for the enterprise digital transformation initiative: identifies execution risk, vendor concentration risk, and change adoption risk. Mitigation actions are tracked in the governance forum each month.',
    },
    {
      chunkId: 'chunk-ctrl-acc-001-advisory',
      text: 'Advisory note on compliance control CTRL-ACC-001 access governance: recommends quarterly entitlement reviews, joiner-mover-leaver automation, and segregation-of-duties analytics. Advisory recommendation supports CTRL-ACC-001 maturity uplift.',
    },
    {
      chunkId: 'chunk-access-governance-recommendation',
      text: 'Access governance recommendation: implement an identity governance and administration platform to automate access requests and recertifications. Recommendation aligns to compliance control CTRL-ACC-001 and reduces manual effort.',
    },
    {
      chunkId: 'chunk-distractor-coffee',
      text: 'Guide to single origin coffee tasting notes covering acidity, body, and finish across Ethiopian and Colombian beans.',
    },
    {
      chunkId: 'chunk-distractor-marketing',
      text: 'Marketing campaign retrospective covering paid social spend and creative iteration cycle for a consumer brand launch.',
    },
    {
      chunkId: 'chunk-distractor-music',
      text: 'History of orchestral string instruments from baroque viols through modern violin construction.',
    },
    {
      chunkId: 'chunk-distractor-travel',
      text: "Walking tour of Edinburgh's Old Town including the Royal Mile and surrounding closes and wynds.",
    },
    {
      chunkId: 'chunk-distractor-fitness',
      text: 'Mobility routine for desk workers focused on shoulders, thoracic spine, and hip flexors performed daily.',
    },
  ],
};
