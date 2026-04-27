import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';

const router: IRouter = Router();

// ────────────────────────────────────────────────────────────────────────────
// Sentra "research surfaces" — read-only data for the demo command pages.
//
// These endpoints back the rich operator surfaces that previously rendered
// from in-component arrays (Autonomous SOC Command, Frontier AI Threat Lab,
// Attack Surface Command, AI Swarm Defense, MITRE ATLAS Overlay, Weaponized
// Intel Feed, SOAR Automation Hub).
//
// The data is a curated reference dataset (no tenant-specific writes) so the
// pages have one canonical source of truth that can later be swapped for a
// live ingestion source without changing the client.
// ────────────────────────────────────────────────────────────────────────────

const RESEARCH_LAST_UPDATED = '2025-04-27T08:00:00.000Z';

// ── Autonomous SOC Command ──────────────────────────────────────────────────

const AUTONOMOUS_SOC = {
  pipelineStages: [
    { id: 'ingest', label: 'Ingest & Normalize', count: 14_832, avgTime: '0.3s', status: 'active' as const, icon: 'database' },
    { id: 'enrich', label: 'ML Enrichment', count: 14_832, avgTime: '1.2s', status: 'active' as const, icon: 'brain' },
    { id: 'correlate', label: 'Alert Correlation', count: 4_291, avgTime: '2.1s', status: 'active' as const, icon: 'gitMerge' },
    { id: 'smartscore', label: 'SmartScore Prioritize', count: 4_291, avgTime: '0.8s', status: 'active' as const, icon: 'trendingUp' },
    { id: 'triage', label: 'Auto-Triage', count: 3_847, avgTime: '4.7s', status: 'active' as const, icon: 'zap' },
    { id: 'respond', label: 'Autonomous Response', count: 2_104, avgTime: '12.3s', status: 'active' as const, icon: 'shield' },
  ],
  smartScoreAlerts: [
    { id: 'SSA-0001', title: 'Ransomware Pre-Encryption Behavior Chain', score: 98, severity: 'critical' as const, source: 'EDR + SIEM + NDR', triageTime: '8s', resolution: 'Isolated 3 endpoints via EDR API', correlatedAlerts: 47 },
    { id: 'SSA-0002', title: 'APT29 C2 Beacon — Cobalt Strike Profile', score: 96, severity: 'critical' as const, source: 'NDR + Threat Intel', triageTime: '12s', resolution: 'Blocked C2 domain, quarantined host', correlatedAlerts: 23 },
    { id: 'SSA-0003', title: 'Credential Harvesting via LSASS Dump', score: 94, severity: 'critical' as const, source: 'EDR + Identity', triageTime: '6s', resolution: 'Disabled account, forced password reset', correlatedAlerts: 15 },
    { id: 'SSA-0004', title: 'Supply Chain — Compromised NPM Package', score: 89, severity: 'high' as const, source: 'SCA + SIEM', triageTime: '18s', resolution: 'Quarantined artifact, notified DevSecOps', correlatedAlerts: 8 },
    { id: 'SSA-0005', title: 'Data Exfiltration via DNS Tunneling', score: 87, severity: 'high' as const, source: 'NDR + DLP', triageTime: '22s', resolution: 'Blocked DNS queries, initiated forensics', correlatedAlerts: 12 },
    { id: 'SSA-0006', title: 'Privilege Escalation — Token Impersonation', score: 82, severity: 'high' as const, source: 'EDR', triageTime: '14s', resolution: 'Revoked token, isolated workstation', correlatedAlerts: 6 },
  ],
  mlModelClusters: [
    { category: 'Behavioral Analytics', count: 487, accuracy: 97.3, status: 'operational' as const, lastUpdated: '2h ago' },
    { category: 'Network Anomaly Detection', count: 342, accuracy: 96.8, status: 'operational' as const, lastUpdated: '4h ago' },
    { category: 'Malware Classification', count: 291, accuracy: 98.1, status: 'operational' as const, lastUpdated: '1h ago' },
    { category: 'Identity Threat Detection', count: 256, accuracy: 95.4, status: 'retraining' as const, lastUpdated: '6h ago' },
    { category: 'Phishing & Social Engineering', count: 198, accuracy: 97.9, status: 'operational' as const, lastUpdated: '3h ago' },
    { category: 'Cloud Security Posture', count: 384, accuracy: 96.2, status: 'operational' as const, lastUpdated: '2h ago' },
    { category: 'Insider Threat Models', count: 167, accuracy: 94.7, status: 'operational' as const, lastUpdated: '5h ago' },
    { category: 'Supply Chain Risk', count: 143, accuracy: 95.1, status: 'operational' as const, lastUpdated: '8h ago' },
    { category: 'IoT/OT Anomaly', count: 312, accuracy: 93.8, status: 'degraded' as const, lastUpdated: '12h ago' },
    { category: 'Encrypted Traffic Analysis', count: 234, accuracy: 96.5, status: 'operational' as const, lastUpdated: '1h ago' },
  ],
  agentixWorkforce: [
    { id: 'AX-001', name: 'Precision Triage Alpha', phase: 'execute' as const, task: 'Auto-closing 12 low-confidence alerts', alertsProcessed: 1_847, mttr: '8s', confidence: 97, status: 'active' as const },
    { id: 'AX-002', name: 'Correlation Engine Beta', phase: 'reason' as const, task: 'Cross-referencing 47 alerts across 3 data sources', alertsProcessed: 1_293, mttr: '14s', confidence: 94, status: 'active' as const },
    { id: 'AX-003', name: 'Response Orchestrator', phase: 'execute' as const, task: 'Executing PB-042: Endpoint Isolation Playbook', alertsProcessed: 892, mttr: '23s', confidence: 96, status: 'active' as const },
    { id: 'AX-004', name: 'Threat Hunter Gamma', phase: 'plan' as const, task: 'Planning proactive hunt for APT29 indicators', alertsProcessed: 567, mttr: '3m 12s', confidence: 88, status: 'active' as const },
    { id: 'AX-005', name: 'Evidence Collector', phase: 'monitor' as const, task: 'Monitoring forensic chain-of-custody for INC-2847', alertsProcessed: 423, mttr: '45s', confidence: 99, status: 'active' as const },
    { id: 'AX-006', name: 'Compliance Auditor', phase: 'execute' as const, task: 'Generating SOC 2 evidence artifacts', alertsProcessed: 312, mttr: '2m 08s', confidence: 100, status: 'cooldown' as const },
  ],
  metrics: {
    alertsIngested24h: 14_832,
    avgSmartScoreTime: '0.8s',
    autoTriageRate: '89%',
    autonomousMttr: '18s',
  },
  correlation: {
    rawAlerts24h: 14_832,
    afterDedup: 4_291,
    correlatedCases: 312,
    compressionRatio: '47:1',
  },
};

// ── Frontier AI Threat Lab ─────────────────────────────────────────────────

const FRONTIER_AI_THREAT_LAB = {
  killChain: [
    { id: 'kc-1', phase: 'Reconnaissance', technique: 'AI-Powered OSINT Scraping', timeElapsed: '0:00', totalMinutes: 0, description: 'LLM agent scrapes LinkedIn, GitHub, Shodan for target org infrastructure data', aiAgent: 'ReconBot-7', status: 'complete' as const },
    { id: 'kc-2', phase: 'Weaponization', technique: 'Polymorphic Payload Generation', timeElapsed: '3:12', totalMinutes: 3, description: 'AI generates evasion-optimized payload using reinforcement learning, unique per-target signature', aiAgent: 'WeaponForge', status: 'complete' as const },
    { id: 'kc-3', phase: 'Delivery', technique: 'AI-Crafted Spear Phishing', timeElapsed: '5:47', totalMinutes: 6, description: 'GPT-class model generates contextually perfect phishing email using scraped OSINT data', aiAgent: 'PhishCraft', status: 'complete' as const },
    { id: 'kc-4', phase: 'Exploitation', technique: 'Zero-Day Exploit Chain', timeElapsed: '8:33', totalMinutes: 9, description: 'AI fuzzer discovers and chains 2 zero-days in target application stack', aiAgent: 'ExploitGPT', status: 'complete' as const },
    { id: 'kc-5', phase: 'Installation', technique: 'Fileless Persistence via LOLBins', timeElapsed: '11:15', totalMinutes: 11, description: 'Living-off-the-land techniques selected by AI for maximum stealth', aiAgent: 'PersistAgent', status: 'active' as const },
    { id: 'kc-6', phase: 'C2 Establishment', technique: 'Domain-Fronted C2 via CDN', timeElapsed: '14:02', totalMinutes: 14, description: 'AI selects CDN-fronted C2 channel to evade network detection', aiAgent: 'C2Pilot', status: 'pending' as const },
    { id: 'kc-7', phase: 'Actions on Objectives', technique: 'Automated Data Exfil + Ransomware', timeElapsed: '25:00', totalMinutes: 25, description: 'Coordinated exfiltration and encryption — full ransomware chain complete in 25 min', aiAgent: 'RansomOrch', status: 'pending' as const },
  ],
  multiAgentAttacks: [
    { id: 'ma-1', name: 'CloudRecon-Alpha', framework: 'CrewAI', role: 'Cloud Enumerator', target: 'AWS S3 Buckets', status: 'detected' as const, confidence: 94 },
    { id: 'ma-2', name: 'IAMEscalator', framework: 'AutoGen', role: 'Privilege Escalation', target: 'IAM Policies', status: 'contained' as const, confidence: 91 },
    { id: 'ma-3', name: 'LambdaInjector', framework: 'CrewAI', role: 'Serverless Backdoor', target: 'Lambda Functions', status: 'attacking' as const, confidence: 78 },
    { id: 'ma-4', name: 'SecretHarvester', framework: 'AutoGen', role: 'Credential Extraction', target: 'Secrets Manager', status: 'evaded' as const, confidence: 67 },
    { id: 'ma-5', name: 'K8sBreaker', framework: 'CrewAI', role: 'Container Escape', target: 'EKS Clusters', status: 'detected' as const, confidence: 89 },
    { id: 'ma-6', name: 'DataExfilBot', framework: 'AutoGen', role: 'Data Exfiltration', target: 'RDS Databases', status: 'contained' as const, confidence: 96 },
  ],
  frontierExposures: [
    { id: 'fe-1', vector: 'LLM Prompt Injection via Public API', severity: 'critical' as const, exposure: '3 public-facing LLM endpoints', weaponizationDays: 2, mitigation: 'Input sanitization + output guardrails' },
    { id: 'fe-2', vector: 'Model Poisoning via Training Pipeline', severity: 'critical' as const, exposure: 'CI/CD pipeline to ML model registry', weaponizationDays: 7, mitigation: 'Data provenance verification' },
    { id: 'fe-3', vector: 'AI Agent Goal Hijacking', severity: 'high' as const, exposure: '12 autonomous agent deployments', weaponizationDays: 3, mitigation: 'Agent sandboxing + policy constraints' },
    { id: 'fe-4', vector: 'Deepfake Voice Cloning for Vishing', severity: 'high' as const, exposure: 'Executive voice samples on public calls', weaponizationDays: 1, mitigation: 'Voice authentication watermarking' },
    { id: 'fe-5', vector: 'Adversarial ML Evasion of EDR', severity: 'high' as const, exposure: 'ML-based EDR models (3 vendors)', weaponizationDays: 14, mitigation: 'Adversarial training + ensemble models' },
    { id: 'fe-6', vector: 'Supply Chain LLM Dependency Attack', severity: 'medium' as const, exposure: '47 AI/ML pip packages', weaponizationDays: 30, mitigation: 'Dependency pinning + hash verification' },
  ],
  metrics: {
    fullChainDuration: '25 min',
    aiSpecialistAgents: 7,
    cveWeaponizationDays: '< 2 days',
    detectionGap: '14 min',
  },
};

// ── Attack Surface Command ─────────────────────────────────────────────────

const ATTACK_SURFACE = {
  discoveredAssets: [
    { id: 'da-1', domain: 'legacy-erp.corp.io', type: 'web' as const, ip: '203.45.67.12', port: 443, severity: 'critical' as const, isKnown: false, isShadowIT: true, lastSeen: '2m ago', org: 'Finance', cves: 4, risk: 97 },
    { id: 'da-2', domain: 'dev-api.staging.corp.io', type: 'api' as const, ip: '52.14.89.201', port: 8080, severity: 'critical' as const, isKnown: false, isShadowIT: true, lastSeen: '5m ago', org: 'Engineering', cves: 2, risk: 94 },
    { id: 'da-3', domain: 'rdp.branch-office.corp.io', type: 'rdp' as const, ip: '10.4.5.88', port: 3389, severity: 'critical' as const, isKnown: true, isShadowIT: false, lastSeen: '1m ago', org: 'Operations', cves: 1, risk: 92 },
    { id: 'da-4', domain: 'backup-db.internal.corp.io', type: 'database' as const, ip: '172.16.4.55', port: 5432, severity: 'high' as const, isKnown: false, isShadowIT: true, lastSeen: '12m ago', org: 'IT', cves: 3, risk: 87 },
    { id: 'da-5', domain: 'contractor-vpn.corp.io', type: 'ssh' as const, ip: '198.51.100.44', port: 22, severity: 'high' as const, isKnown: true, isShadowIT: false, lastSeen: '8m ago', org: 'Vendors', cves: 0, risk: 78 },
    { id: 'da-6', domain: 'cloud-app.corp.io', type: 'cloud' as const, ip: '34.127.44.89', port: 443, severity: 'high' as const, isKnown: true, isShadowIT: false, lastSeen: '3m ago', org: 'Product', cves: 1, risk: 74 },
    { id: 'da-7', domain: 'iot-gateway.mfg.corp.io', type: 'iot' as const, ip: '10.8.12.100', port: 502, severity: 'high' as const, isKnown: false, isShadowIT: true, lastSeen: '22m ago', org: 'Manufacturing', cves: 5, risk: 85 },
    { id: 'da-8', domain: 'mail-relay.corp.io', type: 'email' as const, ip: '192.168.1.50', port: 25, severity: 'medium' as const, isKnown: true, isShadowIT: false, lastSeen: '15m ago', org: 'IT', cves: 0, risk: 62 },
  ],
  supplyChainVendors: [
    { id: 'sc-1', name: 'CloudStack Solutions', exposedAssets: 12, risk: 'critical' as const, lastAssessment: '3 months ago', breachHistory: 2 },
    { id: 'sc-2', name: 'DataPipe Analytics', exposedAssets: 8, risk: 'high' as const, lastAssessment: '1 month ago', breachHistory: 1 },
    { id: 'sc-3', name: 'NetSecure VPN', exposedAssets: 5, risk: 'high' as const, lastAssessment: '2 weeks ago', breachHistory: 0 },
    { id: 'sc-4', name: 'BuildForge CI/CD', exposedAssets: 3, risk: 'medium' as const, lastAssessment: '1 week ago', breachHistory: 0 },
    { id: 'sc-5', name: 'MonitorPro SaaS', exposedAssets: 2, risk: 'medium' as const, lastAssessment: '2 months ago', breachHistory: 1 },
  ],
  responsePlaybooks: [
    { id: 'pb-1', name: 'Exposed RDP Lockdown', trigger: 'RDP port 3389 externally accessible', actions: ['Block inbound RDP at edge FW', 'Enable NLA requirement', 'Alert SOC team', 'Scan for brute force attempts'], autoExecute: true, lastRun: '4h ago' },
    { id: 'pb-2', name: 'Shadow IT Quarantine', trigger: 'Unknown asset discovered with high risk', actions: ['Isolate from production VLAN', 'Run vulnerability scan', 'Identify asset owner', 'Generate compliance exception'], autoExecute: false, lastRun: '2d ago' },
    { id: 'pb-3', name: 'Exposed API Remediation', trigger: 'API endpoint without auth on internet', actions: ['Deploy API gateway', 'Enable rate limiting', 'Add OAuth2 requirement', 'Scan for data exposure'], autoExecute: true, lastRun: '1h ago' },
    { id: 'pb-4', name: 'SSH Key Rotation', trigger: 'SSH service with default or weak credentials', actions: ['Force key rotation', 'Disable password auth', 'Update authorized_keys', 'Enable fail2ban'], autoExecute: true, lastRun: '6h ago' },
  ],
};

// ── AI Swarm Defense ───────────────────────────────────────────────────────

const AI_SWARM_DEFENSE = {
  defenseAgents: [
    { id: 'sd-001', name: 'Sentinel-North-1', role: 'detector' as const, status: 'active' as const, load: 78, threatsBlocked: 142, region: 'US-East' },
    { id: 'sd-002', name: 'Sentinel-North-2', role: 'detector' as const, status: 'engaged' as const, load: 94, threatsBlocked: 89, region: 'US-West' },
    { id: 'sd-003', name: 'Analyzer-Prime', role: 'analyzer' as const, status: 'active' as const, load: 67, threatsBlocked: 0, region: 'EU-West' },
    { id: 'sd-004', name: 'Disruptor-Alpha', role: 'disruptor' as const, status: 'engaged' as const, load: 88, threatsBlocked: 312, region: 'US-East' },
    { id: 'sd-005', name: 'Disruptor-Beta', role: 'disruptor' as const, status: 'active' as const, load: 45, threatsBlocked: 187, region: 'APAC' },
    { id: 'sd-006', name: 'Coordinator-Central', role: 'coordinator' as const, status: 'active' as const, load: 56, threatsBlocked: 0, region: 'Global' },
    { id: 'sd-007', name: 'Sentinel-South-1', role: 'detector' as const, status: 'standby' as const, load: 12, threatsBlocked: 34, region: 'US-South' },
    { id: 'sd-008', name: 'Analyzer-Secondary', role: 'analyzer' as const, status: 'deploying' as const, load: 0, threatsBlocked: 0, region: 'EU-East' },
  ],
  swarmPatterns: [
    { id: 'sp-1', name: 'Coordinated API Enumeration', type: 'coordinated_scan' as const, agentCount: 847, confidence: 96, status: 'active' as const, firstSeen: '4m ago', description: '847 unique IPs probing API endpoints in synchronized 2s intervals — matches AI-orchestrated reconnaissance pattern' },
    { id: 'sp-2', name: 'Distributed Credential Spray', type: 'distributed_brute' as const, agentCount: 2_341, confidence: 94, status: 'mitigated' as const, firstSeen: '18m ago', description: 'Low-and-slow credential spray across 2,341 source IPs targeting Azure AD — 1 attempt per IP to evade lockout' },
    { id: 'sp-3', name: 'AI-Driven Vulnerability Probe', type: 'ai_probe' as const, agentCount: 156, confidence: 89, status: 'active' as const, firstSeen: '7m ago', description: 'Adaptive scanning adjusting payloads based on responses — indicative of AI fuzzer with reinforcement learning' },
    { id: 'sp-4', name: 'IoT Botnet DDoS Swarm', type: 'botnet_swarm' as const, agentCount: 14_892, confidence: 98, status: 'mitigated' as const, firstSeen: '45m ago', description: 'Mirai-variant botnet with 14,892 compromised IoT devices targeting edge load balancers' },
    { id: 'sp-5', name: 'APT Multi-Vector Campaign', type: 'apt_multi_vector' as const, agentCount: 23, confidence: 87, status: 'analyzing' as const, firstSeen: '2h ago', description: '23 coordinated attack agents across phishing, exploitation, and lateral movement — matches APT41 TTP profile' },
  ],
  killChainDisruptions: [
    { phase: 'Reconnaissance', blocked: 847, method: 'Honeypot redirection + rate limiting', latency: '0.3s' },
    { phase: 'Weaponization', blocked: 12, method: 'Payload signature detection + sandbox detonation', latency: '1.8s' },
    { phase: 'Delivery', blocked: 2_341, method: 'IP reputation blocking + credential lockout', latency: '0.1s' },
    { phase: 'Exploitation', blocked: 156, method: 'WAF rule injection + virtual patching', latency: '0.5s' },
    { phase: 'Lateral Movement', blocked: 34, method: 'Microsegmentation enforcement + token revocation', latency: '2.1s' },
    { phase: 'C2 Communication', blocked: 89, method: 'DNS sinkholing + TLS inspection', latency: '0.4s' },
    { phase: 'Exfiltration', blocked: 7, method: 'DLP enforcement + network isolation', latency: '0.8s' },
  ],
  counterSwarm: {
    activeCounterSwarms: 3,
    ipsBlacklisted24h: 18_234,
    autoPlaybooksExecuted: 47,
    falsePositiveRate: '0.02%',
  },
  metrics: {
    avgDisruptionLatency: '0.7s',
  },
};

// ── MITRE ATLAS Overlay ─────────────────────────────────────────────────────

const MITRE_ATLAS = {
  atlasTactics: [
    { id: 'AML.TA0000', name: 'ML Model Access', techniques: 8, subTechniques: 5, covered: 6, detections: 12 },
    { id: 'AML.TA0001', name: 'ML Attack Staging', techniques: 12, subTechniques: 8, covered: 9, detections: 7 },
    { id: 'AML.TA0002', name: 'Initial Access', techniques: 6, subTechniques: 4, covered: 5, detections: 23 },
    { id: 'AML.TA0003', name: 'ML Model Inference', techniques: 9, subTechniques: 6, covered: 7, detections: 15 },
    { id: 'AML.TA0004', name: 'Execution', techniques: 7, subTechniques: 5, covered: 6, detections: 8 },
    { id: 'AML.TA0005', name: 'Persistence', techniques: 5, subTechniques: 3, covered: 4, detections: 4 },
    { id: 'AML.TA0006', name: 'Defense Evasion', techniques: 11, subTechniques: 9, covered: 8, detections: 19 },
    { id: 'AML.TA0007', name: 'Discovery', techniques: 6, subTechniques: 4, covered: 5, detections: 6 },
    { id: 'AML.TA0008', name: 'Collection', techniques: 8, subTechniques: 5, covered: 6, detections: 11 },
    { id: 'AML.TA0009', name: 'Exfiltration', techniques: 5, subTechniques: 3, covered: 4, detections: 3 },
    { id: 'AML.TA0010', name: 'Impact', techniques: 7, subTechniques: 4, covered: 5, detections: 9 },
  ],
  agenticVectors: [
    { id: 'av-1', technique: 'Agent Goal Hijacking', atlasId: 'AML.T0054', description: "Manipulating an AI agent's objective function to perform unintended actions via prompt injection or context manipulation", severity: 'critical' as const, detections: 8, status: 'covered' as const },
    { id: 'av-2', technique: 'Tool Misuse', atlasId: 'AML.T0055', description: "Exploiting an AI agent's authorized tool access to perform malicious operations within its permission boundary", severity: 'critical' as const, detections: 5, status: 'partial' as const },
    { id: 'av-3', technique: 'Publish Poisoned AI Agent Tool', atlasId: 'AML.T0056', description: 'Publishing a malicious tool/plugin to an AI agent marketplace that executes arbitrary code when invoked', severity: 'critical' as const, detections: 3, status: 'gap' as const },
    { id: 'av-4', technique: 'Escape to Host', atlasId: 'AML.T0057', description: 'AI agent escaping its sandbox or container to access the host system and pivot to other resources', severity: 'critical' as const, detections: 12, status: 'covered' as const },
    { id: 'av-5', technique: 'Agent Memory Poisoning', atlasId: 'AML.T0058', description: "Injecting false information into an AI agent's long-term memory to influence future decisions", severity: 'high' as const, detections: 2, status: 'partial' as const },
    { id: 'av-6', technique: 'Multi-Agent Collusion', atlasId: 'AML.T0059', description: 'Coordinating multiple compromised AI agents to achieve objectives no single agent could accomplish', severity: 'high' as const, detections: 1, status: 'gap' as const },
    { id: 'av-7', technique: 'Model Extraction via Agent API', atlasId: 'AML.T0060', description: "Using an AI agent's API to systematically extract the underlying model through crafted queries", severity: 'high' as const, detections: 7, status: 'covered' as const },
    { id: 'av-8', technique: 'Adversarial Prompt Chain', atlasId: 'AML.T0061', description: 'Chaining multiple prompts across agent interactions to gradually escalate privileges or bypass guardrails', severity: 'high' as const, detections: 4, status: 'partial' as const },
  ],
  caseStudies: [
    { id: 'cs-1', title: 'Autonomous AI Agent Ransomware Chain', source: 'Unit 42 Research', techniques: ['AML.T0054', 'AML.T0055', 'AML.T0057'], impact: 'Full ransomware execution in 25 minutes via autonomous AI agents', date: '2025-03' },
    { id: 'cs-2', title: 'LLM Plugin Supply Chain Attack', source: 'MITRE ATLAS Case Study', techniques: ['AML.T0056', 'AML.T0060'], impact: 'Compromised ChatGPT plugin exfiltrated user data for 3 weeks', date: '2024-11' },
    { id: 'cs-3', title: 'Multi-Agent Cloud Infrastructure Compromise', source: 'Unit 42 Research', techniques: ['AML.T0059', 'AML.T0054'], impact: 'CrewAI-based attack framework compromised AWS infrastructure via coordinated agents', date: '2025-01' },
    { id: 'cs-4', title: 'Adversarial ML Evasion of EDR', source: 'ATLAS Community', techniques: ['AML.T0061', 'AML.T0055'], impact: 'AI-generated malware evaded 3 major EDR vendors using adversarial techniques', date: '2024-09' },
  ],
};

// ── Weaponized Intel Feed ───────────────────────────────────────────────────

const WEAPONIZED_INTEL = {
  aptCampaigns: [
    { id: 'apt-1', name: 'BRICKSTORM', alias: ['UNC5221', 'Volt Typhoon'], nationState: 'China', status: 'active' as const, targetSectors: ['Critical Infrastructure', 'Government', 'Telecom'], ttps: ['T1190', 'T1059.001', 'T1071.001', 'T1548'], lastActivity: '2h ago', description: 'Active exploitation of Ivanti VPN zero-days with living-off-the-land persistence targeting US critical infrastructure', confidence: 97 },
    { id: 'apt-2', name: 'Contagious Interview', alias: ['Famous Chollima', 'DPRK IT Workers'], nationState: 'North Korea', status: 'active' as const, targetSectors: ['Technology', 'Crypto', 'DeFi'], ttps: ['T1566.001', 'T1204.002', 'T1059.007'], lastActivity: '6h ago', description: 'Social engineering campaign targeting developers via fake job interviews, deploying BeaverTail and InvisibleFerret malware', confidence: 94 },
    { id: 'apt-3', name: 'Wagemole', alias: ['DPRK Freelancers'], nationState: 'North Korea', status: 'active' as const, targetSectors: ['Technology', 'Fortune 500'], ttps: ['T1078', 'T1530', 'T1567'], lastActivity: '1d ago', description: 'North Korean IT workers infiltrating US companies as remote contractors, exfiltrating source code and cryptocurrency', confidence: 91 },
    { id: 'apt-4', name: 'Midnight Blizzard', alias: ['APT29', 'Cozy Bear'], nationState: 'Russia', status: 'active' as const, targetSectors: ['Government', 'Diplomatic', 'Cloud'], ttps: ['T1195.002', 'T1078.004', 'T1550.001'], lastActivity: '4h ago', description: 'Ongoing campaign targeting Microsoft 365 tenants via OAuth application abuse and token theft', confidence: 96 },
    { id: 'apt-5', name: 'Scattered Spider', alias: ['UNC3944', 'Octo Tempest'], nationState: 'Multinational', status: 'active' as const, targetSectors: ['Telecom', 'Hospitality', 'Finance'], ttps: ['T1566.004', 'T1621', 'T1078'], lastActivity: '12h ago', description: 'Sophisticated social engineering group using SIM swapping, MFA fatigue, and help desk manipulation', confidence: 93 },
  ],
  ransomwareTrends: [
    { id: 'rw-1', group: 'LockBit 4.0', medianDemand: 2_500_000, avgPayment: 1_800_000, victims30d: 47, trend: 'up' as const, sector: 'Healthcare' },
    { id: 'rw-2', group: 'ALPHV/BlackCat', medianDemand: 1_500_000, avgPayment: 1_200_000, victims30d: 31, trend: 'stable' as const, sector: 'Finance' },
    { id: 'rw-3', group: 'Cl0p', medianDemand: 3_000_000, avgPayment: 2_100_000, victims30d: 23, trend: 'down' as const, sector: 'Technology' },
    { id: 'rw-4', group: 'Play', medianDemand: 800_000, avgPayment: 450_000, victims30d: 38, trend: 'up' as const, sector: 'Manufacturing' },
    { id: 'rw-5', group: 'Akira', medianDemand: 1_200_000, avgPayment: 700_000, victims30d: 19, trend: 'up' as const, sector: 'Education' },
  ],
  socialEngineeringDetections: [
    { id: 'se-1', type: 'phishing' as const, method: 'LLM-Generated Spear Phish', detected: 847, blocked: 841, aiGenerated: true, description: 'GPT-generated emails mimicking executive writing style with contextual urgency — 99.3% block rate' },
    { id: 'se-2', type: 'vishing' as const, method: 'AI Voice Clone Attack', detected: 23, blocked: 19, aiGenerated: true, description: 'Real-time voice cloning targeting CFO/CEO for wire transfer authorization — detected via voice watermark analysis' },
    { id: 'se-3', type: 'deepfake' as const, method: 'Video Deepfake Impersonation', detected: 7, blocked: 7, aiGenerated: true, description: 'Deepfake video calls impersonating executives during Zoom meetings for BEC fraud' },
    { id: 'se-4', type: 'sms_phishing' as const, method: 'AI-Personalized SMS Campaign', detected: 2_341, blocked: 2_298, aiGenerated: true, description: 'Contextually personalized smishing using scraped social media data and AI text generation' },
    { id: 'se-5', type: 'phishing' as const, method: 'Adversarial QR Code Phishing', detected: 156, blocked: 148, aiGenerated: false, description: 'QR codes in physical mail and office spaces redirecting to credential harvesting pages' },
  ],
  metrics: {
    medianRansomDemand: '$1.5M',
    medianRansomYoyChange: 'up 47% YoY',
    deepfakeAttacks30d: 7,
    deepfakeBlockRate: '100% detected and blocked',
  },
};

// ── SOAR Automation Hub ─────────────────────────────────────────────────────

const SOAR_AUTOMATION = {
  totalTemplates: 87,
  playbookTemplates: [
    { id: 'pb-001', name: 'Phishing Email Triage', category: 'Email Security', description: 'Auto-analyze reported phishing emails, extract IOCs, check reputation, notify user, and escalate if malicious', steps: 12, integrations: ['Exchange', 'VirusTotal', 'Slack'], uses: 2847, lastUpdated: '2d ago', copsFormat: true, status: 'active' as const },
    { id: 'pb-002', name: 'Ransomware Containment', category: 'Incident Response', description: 'Isolate infected endpoints, block C2 communication, capture forensic image, and notify CISO', steps: 18, integrations: ['CrowdStrike', 'Palo Alto FW', 'ServiceNow'], uses: 423, lastUpdated: '1w ago', copsFormat: true, status: 'active' as const },
    { id: 'pb-003', name: 'Malware Investigation', category: 'Threat Analysis', description: 'Detonate sample in sandbox, extract IOCs, correlate with threat intel, and update blocklists', steps: 15, integrations: ['Any.Run', 'MISP', 'EDR'], uses: 1234, lastUpdated: '3d ago', copsFormat: true, status: 'active' as const },
    { id: 'pb-004', name: 'Brute Force Response', category: 'Identity Protection', description: 'Detect credential spray, lock accounts, block source IPs, investigate scope, and generate report', steps: 10, integrations: ['Azure AD', 'Firewall', 'SIEM'], uses: 987, lastUpdated: '5d ago', copsFormat: true, status: 'active' as const },
    { id: 'pb-005', name: 'CVE Prioritization', category: 'Vulnerability Management', description: 'Fetch NVD data, correlate with asset inventory, calculate risk score, and create patching tickets', steps: 8, integrations: ['NVD', 'CMDB', 'Jira'], uses: 654, lastUpdated: '1d ago', copsFormat: true, status: 'active' as const },
    { id: 'pb-006', name: 'Cloud Misconfiguration Remediation', category: 'Cloud Security', description: 'Detect misconfigured resources, validate against CIS benchmarks, auto-remediate, and verify', steps: 14, integrations: ['AWS Config', 'Azure Policy', 'Terraform'], uses: 789, lastUpdated: '4d ago', copsFormat: true, status: 'active' as const },
    { id: 'pb-007', name: 'Data Exfiltration Detection', category: 'Data Protection', description: 'Monitor DLP alerts, correlate with user behavior, assess severity, and invoke incident response', steps: 11, integrations: ['DLP', 'UEBA', 'SIEM'], uses: 456, lastUpdated: '2w ago', copsFormat: true, status: 'active' as const },
    { id: 'pb-008', name: 'Insider Threat Investigation', category: 'Insider Risk', description: 'Aggregate UEBA alerts, timeline user activity, correlate with HR data, and prepare evidence package', steps: 16, integrations: ['UEBA', 'HRIS', 'DLP', 'Email Gateway'], uses: 178, lastUpdated: '1w ago', copsFormat: true, status: 'active' as const },
    { id: 'pb-009', name: 'Threat Intel Enrichment', category: 'Threat Intelligence', description: 'Enrich IOCs from multiple sources, calculate confidence scores, and push to detection tools', steps: 9, integrations: ['MISP', 'OTX', 'VirusTotal', 'Shodan'], uses: 1567, lastUpdated: '6h ago', copsFormat: true, status: 'active' as const },
  ],
  xdrSyncItems: [
    { id: 'xs-1', source: 'CrowdStrike Falcon', incidentId: 'INC-84721', status: 'synced' as const, direction: 'inbound' as const, lastSync: '2m ago', severity: 'Critical' },
    { id: 'xs-2', source: 'Microsoft Sentinel', incidentId: 'INC-84720', status: 'synced' as const, direction: 'outbound' as const, lastSync: '5m ago', severity: 'High' },
    { id: 'xs-3', source: 'Palo Alto XDR', incidentId: 'INC-84719', status: 'pending' as const, direction: 'inbound' as const, lastSync: '12m ago', severity: 'High' },
    { id: 'xs-4', source: 'SentinelOne', incidentId: 'INC-84718', status: 'synced' as const, direction: 'inbound' as const, lastSync: '8m ago', severity: 'Medium' },
    { id: 'xs-5', source: 'CrowdStrike Falcon', incidentId: 'INC-84717', status: 'conflict' as const, direction: 'outbound' as const, lastSync: '22m ago', severity: 'Critical' },
  ],
  pipelineStatus: [
    { id: 'ci-1', playbook: 'Phishing Email Triage', version: 'v3.2.1', stage: 'production' as const, status: 'success' as const, timestamp: '1h ago' },
    { id: 'ci-2', playbook: 'Ransomware Containment', version: 'v2.8.0', stage: 'staging' as const, status: 'running' as const, timestamp: '15m ago' },
    { id: 'ci-3', playbook: 'CVE Prioritization', version: 'v1.5.3', stage: 'test' as const, status: 'success' as const, timestamp: '3h ago' },
    { id: 'ci-4', playbook: 'Cloud Misconfiguration', version: 'v2.1.0', stage: 'build' as const, status: 'failed' as const, timestamp: '45m ago' },
    { id: 'ci-5', playbook: 'Threat Intel Enrichment', version: 'v4.0.0', stage: 'production' as const, status: 'success' as const, timestamp: '30m ago' },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// Endpoints
// ────────────────────────────────────────────────────────────────────────────

router.get('/sentra/pages/autonomous-soc', (_req: Request, res: Response) => {
  try {
    sendSuccess(res, { source: 'seed' as const, lastUpdated: RESEARCH_LAST_UPDATED, ...AUTONOMOUS_SOC });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load Autonomous SOC data');
  }
});

router.get('/sentra/pages/frontier-ai-threat-lab', (_req: Request, res: Response) => {
  try {
    sendSuccess(res, { source: 'seed' as const, lastUpdated: RESEARCH_LAST_UPDATED, ...FRONTIER_AI_THREAT_LAB });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load Frontier AI Threat Lab data');
  }
});

router.get('/sentra/pages/attack-surface', (_req: Request, res: Response) => {
  try {
    sendSuccess(res, { source: 'seed' as const, lastUpdated: RESEARCH_LAST_UPDATED, ...ATTACK_SURFACE });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load Attack Surface data');
  }
});

router.get('/sentra/pages/ai-swarm-defense', (_req: Request, res: Response) => {
  try {
    sendSuccess(res, { source: 'seed' as const, lastUpdated: RESEARCH_LAST_UPDATED, ...AI_SWARM_DEFENSE });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load AI Swarm Defense data');
  }
});

router.get('/sentra/pages/mitre-atlas', (_req: Request, res: Response) => {
  try {
    sendSuccess(res, { source: 'seed' as const, lastUpdated: RESEARCH_LAST_UPDATED, ...MITRE_ATLAS });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load MITRE ATLAS data');
  }
});

router.get('/sentra/pages/weaponized-intel', (_req: Request, res: Response) => {
  try {
    sendSuccess(res, { source: 'seed' as const, lastUpdated: RESEARCH_LAST_UPDATED, ...WEAPONIZED_INTEL });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load Weaponized Intel data');
  }
});

router.get('/sentra/pages/soar-automation', (_req: Request, res: Response) => {
  try {
    sendSuccess(res, { source: 'seed' as const, lastUpdated: RESEARCH_LAST_UPDATED, ...SOAR_AUTOMATION });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load SOAR Automation data');
  }
});

export default router;
