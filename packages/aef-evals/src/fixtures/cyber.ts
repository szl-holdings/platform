import type { GoldenFixtureSet } from "../types.js";

export const cyberFixtures: GoldenFixtureSet = {
  fixtureSetId: "aegis-security-incident-golden-v1",
  profileId: "aegis_security_incident",
  domain: "cyber",
  description:
    "Golden retrieval fixtures for the Aegis Security Incident profile. Covers CVE lookup, incident correlation, MITRE ATT&CK technique search, threat actor intelligence, and endpoint investigation.",
  queries: [
    {
      queryId: "cyb-q001",
      query: "CVE-2024-12345 critical vulnerability Apache web server exploit",
      relevantChunkIds: ["chunk-cve-2024-12345-advisory", "chunk-cve-2024-12345-patch"],
      notes: "CVE ID exact match should always rank highest.",
    },
    {
      queryId: "cyb-q002",
      query: "INC-20240101 ransomware lateral movement MITRE T1566",
      relevantChunkIds: ["chunk-inc-20240101-timeline", "chunk-t1566-phishing-indicator"],
    },
    {
      queryId: "cyb-q003",
      query: "T1071 command control HTTP beaconing threat actor Cobalt Strike",
      relevantChunkIds: ["chunk-t1071-c2-detection", "chunk-cobalt-strike-indicators-2024"],
    },
    {
      queryId: "cyb-q004",
      query: "endpoint EP-00441 lateral movement credential dump",
      relevantChunkIds: ["chunk-ep-00441-activity-log", "chunk-ep-00441-credential-event"],
    },
    {
      queryId: "cyb-q005",
      query: "zero-day CVE-2023-44487 HTTP2 rapid reset DDoS mitigation",
      relevantChunkIds: ["chunk-cve-2023-44487-analysis", "chunk-ddos-mitigation-http2"],
    },
  ],
};
