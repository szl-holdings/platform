import type { GoldenFixtureSet } from "../types.js";

export const complianceFixtures: GoldenFixtureSet = {
  fixtureSetId: "lyte-governance-ops-golden-v1",
  profileId: "lyte_governance_ops",
  domain: "compliance",
  description:
    "Golden retrieval fixtures for the Lyte Governance Operations profile. Covers compliance control lookup, regulation citation, audit finding retrieval, and remediation evidence search.",
  queries: [
    {
      queryId: "cmp-q001",
      query: "NIST SP 800-53 AC-2 account management control evidence",
      relevantChunkIds: ["chunk-nist-ac-2-control-def", "chunk-ac-2-audit-evidence-2024"],
      notes: "Regulation code and control ID exact matches should both apply boosts.",
    },
    {
      queryId: "cmp-q002",
      query: "SOC 2 Type II CC6.1 logical access change management finding",
      relevantChunkIds: ["chunk-soc2-cc61-finding-2024", "chunk-soc2-cc61-remediation"],
    },
    {
      queryId: "cmp-q003",
      query: "GDPR Article 17 right erasure data subject request procedures",
      relevantChunkIds: ["chunk-gdpr-art17-procedure", "chunk-dsar-response-template"],
    },
    {
      queryId: "cmp-q004",
      query: "PCI-DSS Requirement 8.2 user authentication password policy",
      relevantChunkIds: ["chunk-pci-req-8-2-policy", "chunk-pci-dss-auth-controls"],
    },
    {
      queryId: "cmp-q005",
      query: "OFAC sanctions control screening customer onboarding",
      relevantChunkIds: ["chunk-ofac-screening-procedure", "chunk-sanctions-onboarding-checklist"],
    },
  ],
};
