import type { GoldenFixtureSet } from '../types.js';

export const complianceFixtures: GoldenFixtureSet = {
  fixtureSetId: 'lyte-governance-ops-golden-v1',
  profileId: 'lyte_governance_ops',
  domain: 'compliance',
  description:
    'Golden retrieval fixtures for the Lyte Governance Operations profile. Covers compliance control lookup, regulation citation, audit finding retrieval, and remediation evidence search.',
  queries: [
    {
      queryId: 'cmp-q001',
      query: 'NIST SP 800-53 AC-2 account management control evidence',
      relevantChunkIds: ['chunk-nist-ac-2-control-def', 'chunk-ac-2-audit-evidence-2024'],
      notes: 'Regulation code and control ID exact matches should both apply boosts.',
    },
    {
      queryId: 'cmp-q002',
      query: 'SOC 2 Type II CC6.1 logical access change management finding',
      relevantChunkIds: ['chunk-soc2-cc61-finding-2024', 'chunk-soc2-cc61-remediation'],
    },
    {
      queryId: 'cmp-q003',
      query: 'GDPR Article 17 right erasure data subject request procedures',
      relevantChunkIds: ['chunk-gdpr-art17-procedure', 'chunk-dsar-response-template'],
    },
    {
      queryId: 'cmp-q004',
      query: 'PCI-DSS Requirement 8.2 user authentication password policy',
      relevantChunkIds: ['chunk-pci-req-8-2-policy', 'chunk-pci-dss-auth-controls'],
    },
    {
      queryId: 'cmp-q005',
      query: 'OFAC sanctions control screening customer onboarding',
      relevantChunkIds: ['chunk-ofac-screening-procedure', 'chunk-sanctions-onboarding-checklist'],
    },
  ],
  corpus: [
    {
      chunkId: 'chunk-nist-ac-2-control-def',
      text: 'NIST SP 800-53 control AC-2 Account Management requires the organization to identify and select account types, assign account managers, and review accounts for compliance. AC-2 covers the lifecycle of system accounts.',
    },
    {
      chunkId: 'chunk-ac-2-audit-evidence-2024',
      text: 'Audit evidence collected for NIST AC-2 in 2024: quarterly account review reports, joiner-mover-leaver tickets, and privileged access certifications. Evidence supports compliance with NIST SP 800-53 AC-2 account management requirements.',
    },
    {
      chunkId: 'chunk-soc2-cc61-finding-2024',
      text: 'SOC 2 Type II audit finding for criterion CC6.1 Logical Access: change management for production access did not consistently capture business justification. Finding requires remediation under the SOC 2 CC6.1 logical access control.',
    },
    {
      chunkId: 'chunk-soc2-cc61-remediation',
      text: 'Remediation plan for SOC 2 CC6.1 logical access finding: implement mandatory change management approval workflow with business justification field, retain ticket records for seven years, and re-test in next SOC 2 Type II window.',
    },
    {
      chunkId: 'chunk-gdpr-art17-procedure',
      text: 'GDPR Article 17 right to erasure procedure: upon receipt of a verified data subject request, the controller must erase personal data without undue delay and within one month. Article 17 establishes the right to be forgotten under GDPR.',
    },
    {
      chunkId: 'chunk-dsar-response-template',
      text: 'Data subject access request response template covering verification, scope of personal data search, and erasure under GDPR Article 17. Template includes timelines and exemptions for legal-hold data.',
    },
    {
      chunkId: 'chunk-pci-req-8-2-policy',
      text: 'PCI-DSS Requirement 8.2 user authentication policy: enforce minimum password length of 12 characters, complexity requirements, and rotation every 90 days. Policy covers all users with access to cardholder data environment under PCI-DSS 8.2.',
    },
    {
      chunkId: 'chunk-pci-dss-auth-controls',
      text: 'PCI-DSS authentication controls overview: multi-factor authentication for administrative access, individual user IDs, and password management aligned to Requirement 8 of the PCI Data Security Standard.',
    },
    {
      chunkId: 'chunk-ofac-screening-procedure',
      text: 'OFAC sanctions screening procedure for customer onboarding: screen new customers against the SDN list and consolidated sanctions lists prior to account opening. Hits are escalated to the compliance officer for review.',
    },
    {
      chunkId: 'chunk-sanctions-onboarding-checklist',
      text: 'Customer onboarding sanctions checklist: complete OFAC SDN screening, EU consolidated list screening, and PEP screening. Document results in the onboarding case file before activating the customer relationship.',
    },
    {
      chunkId: 'chunk-distractor-recipe',
      text: 'Recipe for slow-cooked pulled pork sandwiches with a tangy vinegar barbecue sauce.',
    },
    {
      chunkId: 'chunk-distractor-design',
      text: 'Visual design system tokens for color, spacing, and typography used across the marketing website.',
    },
    {
      chunkId: 'chunk-distractor-jazz',
      text: 'Liner notes for a jazz album recorded live at a Greenwich Village club in the 1960s.',
    },
    {
      chunkId: 'chunk-distractor-travel',
      text: 'Backpacking itinerary across Patagonia covering Torres del Paine and El Chaltén highlights.',
    },
    {
      chunkId: 'chunk-distractor-fitness',
      text: 'Strength program for masters athletes focusing on tendon health and joint mobility.',
    },
  ],
};
