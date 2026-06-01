import type { GoldenFixtureSet } from '../types.js';

export const legalFixtures: GoldenFixtureSet = {
  fixtureSetId: 'prism-legal-matter-golden-v1',
  profileId: 'prism_legal_matter',
  domain: 'legal',
  description:
    'Golden retrieval fixtures for the PRISM Legal Matter profile. Covers docket number lookup, matter ID search, statute citations, contract retrieval, and deposition document search.',
  queries: [
    {
      queryId: 'leg-q001',
      query: 'docket 24-1234-CV motion to dismiss antitrust claim',
      relevantChunkIds: ['chunk-docket-24-1234-cv-motion', 'chunk-antitrust-brief-2024'],
      notes: 'Docket number exact match should rank above general antitrust commentary.',
    },
    {
      queryId: 'leg-q002',
      query: 'matter MTR-2024-0041 regulatory compliance settlement',
      relevantChunkIds: ['chunk-mtr-2024-0041-settlement', 'chunk-mtr-2024-0041-compliance'],
    },
    {
      queryId: 'leg-q003',
      query: '15 U.S.C. § 78j securities fraud liability disclosure',
      relevantChunkIds: ['chunk-usc-78j-analysis', 'chunk-sec-fraud-case-2024'],
      notes: 'Statute citation exact match should boost highly relevant securities law documents.',
    },
    {
      queryId: 'leg-q004',
      query: 'contract CONTRACT-2024-A001 indemnification clause limitation liability',
      relevantChunkIds: ['chunk-contract-2024-a001-indemnity', 'chunk-contract-2024-a001-full'],
    },
    {
      queryId: 'leg-q005',
      query: 'deposition testimony expert witness damages calculation',
      relevantChunkIds: ['chunk-deposition-expert-damages-2024', 'chunk-expert-witness-report'],
    },
  ],
  corpus: [
    {
      chunkId: 'chunk-docket-24-1234-cv-motion',
      text: "Docket 24-1234-CV: Defendant's motion to dismiss the antitrust claim under Rule 12(b)(6). The motion argues plaintiff has failed to plead a relevant antitrust market and that the asserted claim cannot proceed in docket 24-1234-CV.",
    },
    {
      chunkId: 'chunk-antitrust-brief-2024',
      text: 'Memorandum of law in support of motion to dismiss the Sherman Act antitrust claim filed in docket 24-1234-CV. Brief discusses Twombly pleading standard for antitrust conspiracy claims and asks the court to dismiss.',
    },
    {
      chunkId: 'chunk-mtr-2024-0041-settlement',
      text: 'Matter MTR-2024-0041 settlement agreement: regulatory compliance dispute resolved on 2024-08-12 with monetary penalty and a five-year compliance monitor. Settlement closes matter MTR-2024-0041 with no admission of liability.',
    },
    {
      chunkId: 'chunk-mtr-2024-0041-compliance',
      text: 'Compliance program implementation plan attached to matter MTR-2024-0041, including quarterly regulatory reporting obligations, employee training, and independent monitor reviews mandated by the settlement.',
    },
    {
      chunkId: 'chunk-usc-78j-analysis',
      text: 'Analysis of 15 U.S.C. § 78j(b) securities fraud liability standards: scienter, materiality, and disclosure obligations under Rule 10b-5. Section 78j of Title 15 governs manipulative and deceptive devices in securities markets.',
    },
    {
      chunkId: 'chunk-sec-fraud-case-2024',
      text: "Recent securities fraud case applying 15 U.S.C. § 78j and Rule 10b-5: court found defendant's misleading disclosure constituted a material misstatement giving rise to liability under section 78j of the Exchange Act.",
    },
    {
      chunkId: 'chunk-contract-2024-a001-indemnity',
      text: 'Contract CONTRACT-2024-A001, Section 9 — Indemnification. Each party shall indemnify and hold harmless the other against third-party claims, subject to the limitation of liability cap stated in Section 10. Indemnity clause is subject to the survival period.',
    },
    {
      chunkId: 'chunk-contract-2024-a001-full',
      text: 'Master services agreement CONTRACT-2024-A001 between Acme Corp and Vendor Inc. Includes scope of services, fees, indemnification (Section 9), limitation of liability (Section 10), and termination provisions for the contract.',
    },
    {
      chunkId: 'chunk-deposition-expert-damages-2024',
      text: "Deposition of plaintiff's expert witness on damages calculation, taken 2024-09-04. Expert testimony covers methodology for lost-profits and disgorgement damages models used in commercial litigation.",
    },
    {
      chunkId: 'chunk-expert-witness-report',
      text: 'Expert witness report by Dr. Lee, CPA, presenting a damages calculation of $14.2 million in lost profits and $3.6 million in restitution. Report served as the basis for the deposition testimony on damages.',
    },
    {
      chunkId: 'chunk-distractor-recipe',
      text: 'A recipe for tomato basil soup involving fresh basil, ripe tomatoes, garlic, and a touch of cream.',
    },
    {
      chunkId: 'chunk-distractor-marketing',
      text: 'Marketing brochure describing premium membership benefits, including priority customer support and exclusive events.',
    },
    {
      chunkId: 'chunk-distractor-engineering',
      text: 'Engineering changelog for release v3.4.2: bug fixes for the data export pipeline and improved logging.',
    },
    {
      chunkId: 'chunk-distractor-travel',
      text: 'Travel advisory for Southeast Asia covering visa requirements and recommended vaccinations for tourists.',
    },
    {
      chunkId: 'chunk-distractor-fitness',
      text: 'Twelve-week strength training program emphasizing compound lifts and progressive overload for intermediate lifters.',
    },
  ],
};
