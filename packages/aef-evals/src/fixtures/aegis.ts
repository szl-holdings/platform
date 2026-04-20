import type { GoldenQuery } from "../metrics.js";

export const AEGIS_GOLDEN_QUERIES: GoldenQuery[] = [
  {
    queryId: "aegis-q001",
    query: "What is the current exploitability status of CVE-2024-21762?",
    relevantChunkIds: ["aegis-chunk-001", "aegis-chunk-002"],
    exactMatchBoostTerms: ["CVE", "attack vector"],
    metadata: { domain: "security", entityTypes: ["threat"] },
  },
  {
    queryId: "aegis-q002",
    query: "Retrieve the incident investigation timeline for incident INC-2024-0847.",
    relevantChunkIds: ["aegis-chunk-003", "aegis-chunk-004", "aegis-chunk-005"],
    exactMatchBoostTerms: ["incident ID", "MITRE"],
    metadata: { domain: "security", entityTypes: ["incident"] },
  },
  {
    queryId: "aegis-q003",
    query: "Which controls are showing drift from CMMC Level 2 requirements?",
    relevantChunkIds: ["aegis-chunk-006", "aegis-chunk-007"],
    exactMatchBoostTerms: ["CMMC", "control ID"],
    metadata: { domain: "security", entityTypes: ["control"] },
  },
  {
    queryId: "aegis-q004",
    query: "List all critical-severity incidents involving lateral movement in the past 60 days.",
    relevantChunkIds: ["aegis-chunk-008", "aegis-chunk-009"],
    exactMatchBoostTerms: ["critical severity", "lateral movement", "ATT&CK"],
    metadata: { domain: "security", entityTypes: ["incident", "threat"] },
  },
  {
    queryId: "aegis-q005",
    query: "Show me the FedRAMP authorization status for the primary cloud infrastructure.",
    relevantChunkIds: ["aegis-chunk-010", "aegis-chunk-011"],
    exactMatchBoostTerms: ["FedRAMP", "regulation"],
    metadata: { domain: "security", entityTypes: ["control"] },
  },
  {
    queryId: "aegis-q006",
    query: "Which ransomware indicators of compromise are active in our environment?",
    relevantChunkIds: ["aegis-chunk-012", "aegis-chunk-013"],
    exactMatchBoostTerms: ["ransomware", "attack vector", "CVE"],
    metadata: { domain: "security", entityTypes: ["threat", "incident"] },
  },
];

export const AEGIS_MOCK_CORPUS = new Map<string, { text: string; boostTerms: string[] }>([
  ["aegis-chunk-001", { text: "CVE-2024-21762: Fortinet FortiOS SSL VPN heap buffer overflow. CVSS 9.8 (CRITICAL). Actively exploited in the wild as of 2024-02-08. Attack vector: network. No authentication required. Patch available: FortiOS 7.4.3.", boostTerms: ["CVE", "attack vector"] }],
  ["aegis-chunk-002", { text: "CVE-2024-21762 exploitability analysis: PoC code circulating on dark web forums since 2024-02-06. CISA KEV listed 2024-02-09. Recommended remediation: immediate upgrade or disable SSL VPN.", boostTerms: ["CVE", "attack vector"] }],
  ["aegis-chunk-003", { text: "Incident INC-2024-0847 — opened: 2024-06-05 14:23 UTC. Severity: CRITICAL. Initial detection: EDR alert on anomalous PowerShell execution pattern. Affected systems: 3 domain controllers.", boostTerms: ["incident ID", "MITRE"] }],
  ["aegis-chunk-004", { text: "INC-2024-0847 timeline: T+0h initial alert, T+2h triage confirmation, T+4h containment initiated (network segment isolation), T+8h IR team engaged, T+24h forensic image collected. MITRE ATT&CK: T1059.001 (PowerShell), T1078 (Valid Accounts).", boostTerms: ["incident ID", "MITRE"] }],
  ["aegis-chunk-005", { text: "INC-2024-0847 root cause: credential theft via spear-phishing targeting finance team. Threat actor used valid accounts (T1078) for lateral movement. 2 additional hosts compromised before containment.", boostTerms: ["incident ID", "lateral movement"] }],
  ["aegis-chunk-006", { text: "CMMC Level 2 drift report: Control ID AC.2.006 (Limit use of portable storage) — status: INEFFECTIVE. Last tested: 2024-01-15. Drift detected on 4 endpoints running unmanaged USB devices.", boostTerms: ["CMMC", "control ID"] }],
  ["aegis-chunk-007", { text: "CMMC Level 2 compliance gap summary: 7 controls drifted since last assessment. Highest risk gaps: AC.2.006 (access control), IA.2.078 (multi-factor auth), SI.2.216 (malicious code protection). Remediation plan due: 2024-07-15.", boostTerms: ["CMMC", "control ID"] }],
  ["aegis-chunk-008", { text: "Critical severity incidents with lateral movement — last 60 days: INC-2024-0847 (June), INC-2024-0791 (May). Both mapped to MITRE ATT&CK T1021 (Remote Services) and T1078 (Valid Accounts).", boostTerms: ["critical severity", "lateral movement", "ATT&CK"] }],
  ["aegis-chunk-009", { text: "INC-2024-0791 — May critical lateral movement event: threat actor moved from compromised workstation to 2 servers via RDP. MITRE ATT&CK: T1021.001. Contained within 6 hours. No data exfiltration confirmed.", boostTerms: ["critical severity", "lateral movement"] }],
  ["aegis-chunk-010", { text: "FedRAMP Moderate authorization — primary cloud infrastructure (AWS GovCloud us-east-1): authorization issued 2023-09-12. ATO valid through 2026-09-11. Last continuous monitoring report: 2024-05-01.", boostTerms: ["FedRAMP", "regulation"] }],
  ["aegis-chunk-011", { text: "FedRAMP authorization status: 14 controls in POA&M. 3 high-risk POA&M items require remediation before Q3 2024 continuous monitoring review. Controls affected: SC-7 (boundary protection), AU-6 (audit review).", boostTerms: ["FedRAMP", "regulation"] }],
  ["aegis-chunk-012", { text: "Active ransomware IoC cluster: SHA-256 hash e3b0c44298fc1c149afb matches LockBit 3.0 encryptor variant observed in wild since 2024-04-20. C2 domain: lock-srv-24[.]onion. Attack vector: RDP brute force.", boostTerms: ["ransomware", "attack vector"] }],
  ["aegis-chunk-013", { text: "Ransomware advisory: BlackCat/ALPHV encryptor indicators active in financial sector Q2 2024. Associated CVEs: CVE-2021-31207, CVE-2022-41082. Exfil method: Mega.nz prior to encryption. Threat level: CRITICAL.", boostTerms: ["ransomware", "CVE", "attack vector"] }],
]);
