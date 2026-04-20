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
  corpus: [
    {
      chunkId: "chunk-cve-2024-12345-advisory",
      text: "Security advisory CVE-2024-12345: a critical remote code execution vulnerability in the Apache HTTP web server allows unauthenticated attackers to execute arbitrary code via a crafted request. CVE-2024-12345 affects Apache versions 2.4.x and is rated CVSS 9.8 critical.",
    },
    {
      chunkId: "chunk-cve-2024-12345-patch",
      text: "Patch notes for CVE-2024-12345: upgrade Apache web server to version 2.4.59 or apply the vendor backport. The patch addresses the critical exploit chain reported under CVE-2024-12345 and prevents arbitrary code execution.",
    },
    {
      chunkId: "chunk-inc-20240101-timeline",
      text: "Incident INC-20240101 timeline: initial access via phishing email (MITRE T1566), lateral movement through SMB at T+04:30, then ransomware deployment at T+09:15. Incident INC-20240101 traced to a financially motivated ransomware affiliate.",
    },
    {
      chunkId: "chunk-t1566-phishing-indicator",
      text: "MITRE ATT&CK T1566 phishing technique indicators tied to incident INC-20240101: weaponized spreadsheet attachment with macro dropper, sender domain typosquatting the corporate domain, and attempted lateral movement after initial click.",
    },
    {
      chunkId: "chunk-t1071-c2-detection",
      text: "Detection rule for MITRE ATT&CK T1071 application-layer protocol command and control: HTTP beaconing pattern with regular interval to suspicious external host. Frequently associated with Cobalt Strike beacon configurations.",
    },
    {
      chunkId: "chunk-cobalt-strike-indicators-2024",
      text: "Threat intelligence on Cobalt Strike beacon variants observed in 2024 campaigns: HTTP beaconing C2 over port 443 with jittered intervals consistent with MITRE T1071. Indicators include malleable C2 profiles mimicking legitimate web traffic.",
    },
    {
      chunkId: "chunk-ep-00441-activity-log",
      text: "Endpoint EP-00441 activity log shows lateral movement attempts to adjacent hosts via WMI on 2024-07-15 between 02:14 and 02:48 UTC. Endpoint EP-00441 was the staging host for the credential-access phase of the intrusion.",
    },
    {
      chunkId: "chunk-ep-00441-credential-event",
      text: "Credential dumping event observed on endpoint EP-00441: lsass memory access by a non-standard process consistent with Mimikatz behavior. Event correlated with subsequent lateral movement attempts from EP-00441.",
    },
    {
      chunkId: "chunk-cve-2023-44487-analysis",
      text: "Analysis of CVE-2023-44487 HTTP/2 Rapid Reset zero-day: attackers abuse stream cancellation to mount a high-volume DDoS attack. CVE-2023-44487 was actively exploited against major cloud providers in late 2023.",
    },
    {
      chunkId: "chunk-ddos-mitigation-http2",
      text: "Mitigation guidance for the HTTP/2 Rapid Reset DDoS technique (CVE-2023-44487): enforce per-connection stream limits, deploy edge rate limiting, and patch reverse proxies. Mitigations significantly reduce the amplification observed during the zero-day campaign.",
    },
    { chunkId: "chunk-distractor-tea-blog", text: "A blog post about brewing the perfect cup of green tea at home, including water temperature and steep times." },
    { chunkId: "chunk-distractor-marketing-funnel", text: "Marketing funnel optimization tips for B2B SaaS companies: improving lead qualification and demo conversion rates." },
    { chunkId: "chunk-distractor-music-review", text: "Album review of an indie folk record exploring themes of memory and place across twelve acoustic tracks." },
    { chunkId: "chunk-distractor-travel-italy", text: "Two-week travel itinerary through Italy covering Rome, Florence, and Venice with restaurant recommendations." },
    { chunkId: "chunk-distractor-fitness-yoga", text: "Beginner yoga routine focused on hip mobility and breath control, suitable for office workers with tight hips." },
  ],
};
