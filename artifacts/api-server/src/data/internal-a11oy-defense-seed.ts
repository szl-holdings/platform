/**
 * Seed payloads for the six A11oy defense pages, persisted on first request
 * into the a11oy_defense_payloads table by routes/internal-a11oy-defense.ts.
 *
 * After seeding, the live route always reads from the DB row, so admins can
 * mutate any payload without redeploying. These constants are the initial
 * baseline shown on a fresh database.
 */

// ─── PrecisionAI ─────────────────────────────────────────────────────────────

const SIGNALS = [
  { id: 'SIG-4821', source: 'Connector Firewall', category: 'threat', rawScore: 87, smartScore: 94, confidence: 0.97, snr: 12.4, triageResult: 'escalate', timestamp: '2026-04-26T14:32:00Z', description: 'Anomalous API call pattern from vendor-risk-db connector — 3.2x normal volume with payload size deviation', analyticsModules: ['behavioral-baseline', 'volumetric-anomaly', 'payload-analysis'] },
  { id: 'SIG-4822', source: 'Agent Mesh', category: 'agent', rawScore: 72, smartScore: 81, confidence: 0.91, snr: 8.7, triageResult: 'escalate', timestamp: '2026-04-26T14:28:00Z', description: 'Claude Code agent trust score dropped 6 points in 2 hours — output quality drift detected by MirrorEval', analyticsModules: ['trust-decay', 'output-quality', 'drift-detection'] },
  { id: 'SIG-4823', source: 'Covenant Gate', category: 'compliance', rawScore: 45, smartScore: 62, confidence: 0.88, snr: 5.3, triageResult: 'monitor', timestamp: '2026-04-26T14:25:00Z', description: 'Tier-2 approval bypassed for low-value procurement action — policy exception flagged', analyticsModules: ['policy-exception', 'approval-pattern', 'risk-scoring'] },
  { id: 'SIG-4824', source: 'Signal Mesh', category: 'operational', rawScore: 34, smartScore: 28, confidence: 0.94, snr: 2.1, triageResult: 'auto-resolve', timestamp: '2026-04-26T14:22:00Z', description: 'Vessel ETA recalculation triggered by weather data update — standard deviation within normal range', analyticsModules: ['baseline-comparison', 'weather-correlation'] },
  { id: 'SIG-4825', source: 'Proof Ledger', category: 'compliance', rawScore: 91, smartScore: 96, confidence: 0.99, snr: 18.2, triageResult: 'escalate', timestamp: '2026-04-26T14:18:00Z', description: 'Proof chain hash mismatch detected on action PL-7842 — potential tamper attempt or clock skew', analyticsModules: ['hash-verification', 'clock-analysis', 'tamper-detection', 'forensic-trace'] },
  { id: 'SIG-4826', source: 'MirrorEval', category: 'agent', rawScore: 58, smartScore: 41, confidence: 0.86, snr: 3.4, triageResult: 'monitor', timestamp: '2026-04-26T14:15:00Z', description: 'Evaluation drift on Pipeline Oracle agent — forecast accuracy dipped 1.8% below 30-day baseline', analyticsModules: ['forecast-accuracy', 'drift-detection', 'baseline-comparison'] },
  { id: 'SIG-4827', source: 'Connector Firewall', category: 'threat', rawScore: 22, smartScore: 15, confidence: 0.92, snr: 1.2, triageResult: 'suppress', timestamp: '2026-04-26T14:12:00Z', description: 'Routine port scan from known research IP — no payload, no persistence. Previously classified benign.', analyticsModules: ['ip-reputation', 'pattern-match'] },
  { id: 'SIG-4828', source: 'Twin Foundry', category: 'operational', rawScore: 63, smartScore: 71, confidence: 0.89, snr: 6.8, triageResult: 'monitor', timestamp: '2026-04-26T14:08:00Z', description: 'Digital twin state divergence for asset RE-2241 — valuation model inputs differ from market feed by 4.2%', analyticsModules: ['state-divergence', 'valuation-model', 'market-feed-correlation'] },
  { id: 'SIG-4829', source: 'Revenue Pipeline', category: 'financial', rawScore: 76, smartScore: 83, confidence: 0.93, snr: 9.1, triageResult: 'escalate', timestamp: '2026-04-26T14:02:00Z', description: 'Q3 pipeline coverage ratio dropped below 3.0x threshold — 4 deals moved to at-risk in 48 hours', analyticsModules: ['pipeline-coverage', 'deal-velocity', 'risk-scoring', 'forecast-impact'] },
  { id: 'SIG-4830', source: 'Guardian', category: 'threat', rawScore: 15, smartScore: 8, confidence: 0.95, snr: 0.8, triageResult: 'suppress', timestamp: '2026-04-26T13:58:00Z', description: 'Low-severity CVE advisory for unused dependency — no attack surface exposure confirmed', analyticsModules: ['cve-correlation', 'dependency-graph', 'exposure-analysis'] },
];

const ANALYTICS_MODULES = [
  { id: 'AM-001', name: 'Behavioral Baseline Engine', category: 'Detection', status: 'active', signalsProcessed: 48210, accuracy: 0.968 },
  { id: 'AM-002', name: 'Volumetric Anomaly Detector', category: 'Detection', status: 'active', signalsProcessed: 31847, accuracy: 0.942 },
  { id: 'AM-003', name: 'Drift Detection Module', category: 'Quality', status: 'active', signalsProcessed: 22104, accuracy: 0.957 },
  { id: 'AM-004', name: 'Hash Verification Engine', category: 'Integrity', status: 'active', signalsProcessed: 89421, accuracy: 0.999 },
  { id: 'AM-005', name: 'Trust Decay Analyzer', category: 'Agent', status: 'active', signalsProcessed: 12847, accuracy: 0.934 },
  { id: 'AM-006', name: 'Policy Exception Classifier', category: 'Compliance', status: 'active', signalsProcessed: 7842, accuracy: 0.961 },
  { id: 'AM-007', name: 'Forecast Impact Predictor', category: 'Financial', status: 'active', signalsProcessed: 5621, accuracy: 0.928 },
  { id: 'AM-008', name: 'CVE Correlation Engine', category: 'Threat', status: 'active', signalsProcessed: 41283, accuracy: 0.975 },
  { id: 'AM-009', name: 'Payload Analysis Module', category: 'Detection', status: 'active', signalsProcessed: 28947, accuracy: 0.951 },
  { id: 'AM-010', name: 'Tamper Detection Scanner', category: 'Integrity', status: 'active', signalsProcessed: 15284, accuracy: 0.997 },
  { id: 'AM-011', name: 'State Divergence Monitor', category: 'Operational', status: 'active', signalsProcessed: 9847, accuracy: 0.944 },
  { id: 'AM-012', name: 'IP Reputation Scorer', category: 'Threat', status: 'active', signalsProcessed: 67421, accuracy: 0.982 },
];

const BYOML_MODELS = [
  { id: 'BYOML-001', name: 'Custom Anomaly Detector', framework: 'PyTorch', status: 'deployed', accuracy: 0.947, lastTrained: '2026-04-20', inferenceLatency: '12ms' },
  { id: 'BYOML-002', name: 'Domain-Specific NER', framework: 'HuggingFace', status: 'deployed', accuracy: 0.962, lastTrained: '2026-04-18', inferenceLatency: '8ms' },
  { id: 'BYOML-003', name: 'Transaction Risk Classifier', framework: 'XGBoost', status: 'deployed', accuracy: 0.938, lastTrained: '2026-04-22', inferenceLatency: '3ms' },
  { id: 'BYOML-004', name: 'Behavioral Fingerprint Model', framework: 'TensorFlow', status: 'validating', accuracy: 0.921, lastTrained: '2026-04-25', inferenceLatency: '18ms' },
];

// ─── WeaponizedIntel ─────────────────────────────────────────────────────────

const KILL_CHAIN = [
  { id: 'KC-01', phase: 'Reconnaissance', duration: '< 15 min', durationMs: 900000, description: 'Autonomous agents scan exposed APIs, enumerate MCP tool servers, and map agent identity surfaces using automated CVE scanning.', agenticCapability: 'Multi-agent parallel scanning with self-organizing target prioritization', a11oyDefense: 'Connector Firewall rate limiting + behavioral anomaly detection on inbound probes' },
  { id: 'KC-02', phase: 'Weaponization', duration: '< 25 min', durationMs: 1500000, description: 'Adversary agents craft domain-specific prompt injections and generate polymorphic payloads tailored to discovered agent architectures.', agenticCapability: 'LLM-powered payload generation that adapts to target defenses in real-time', a11oyDefense: 'GARD robustness testing continuously validates against novel payload patterns' },
  { id: 'KC-03', phase: 'Initial Access', duration: '< 5 min', durationMs: 300000, description: 'Exploit OAuth token scoping gaps, abuse MCP tool permissions, or inject through vulnerable connector integrations.', agenticCapability: 'Automated credential stuffing + MCP protocol exploitation at machine speed', a11oyDefense: 'Agent Zero Trust — credential rotation, MCP token scoping, least-privilege enforcement' },
  { id: 'KC-04', phase: 'Execution', duration: '< 3 min', durationMs: 180000, description: 'Hijack agent goals via prompt injection, redirect tool calls, or inject malicious instructions into agent memory.', agenticCapability: 'Goal hijacking (OWASP ASI01) + tool misuse (ASI02) at autonomous speed', a11oyDefense: 'Covenant Gate policy enforcement + MirrorEval real-time output validation' },
  { id: 'KC-05', phase: 'Persistence', duration: '< 10 min', durationMs: 600000, description: 'Poison knowledge bases, corrupt agent memories, or implant backdoor instructions in shared context.', agenticCapability: 'Memory poisoning that persists across sessions and agent restarts', a11oyDefense: 'Supply chain attestation + data poisoning defense in Adversarial Resilience layer' },
  { id: 'KC-06', phase: 'Lateral Movement', duration: '< 8 min', durationMs: 480000, description: 'Compromise one agent in the mesh, then propagate through handoff protocols to adjacent agents and systems.', agenticCapability: 'Multi-agent swarm lateral movement through trust relationships', a11oyDefense: 'Agent Mesh isolation + proof chain hash verification on every handoff' },
  { id: 'KC-07', phase: 'Exfiltration', duration: '< 1.2 hrs', durationMs: 4320000, description: 'Use legitimate tool calls to extract sensitive data through approved connectors, bypassing traditional DLP.', agenticCapability: 'Low-and-slow exfiltration through authorized API channels', a11oyDefense: 'Connector Firewall output sanitization + behavioral baseline anomaly detection' },
  { id: 'KC-08', phase: 'Impact', duration: '< 25 min', durationMs: 1500000, description: 'Full ransomware deployment, data destruction, or autonomous financial fraud execution at machine speed.', agenticCapability: '25-minute ransomware benchmark — complete encryption chain executed autonomously', a11oyDefense: 'Approval Rail human-in-the-loop + Proof Ledger immutable audit trail' },
];

const SWARM_THREATS = [
  { id: 'ST-01', name: 'Coordinated Prompt Injection Swarm', type: 'Multi-Vector Attack', agentCount: '5-20 agents', description: 'Multiple adversary agents simultaneously inject conflicting prompts across different entry points, overwhelming single-point defenses.', risk: 'critical', ttc: '3 minutes', a11oyMitigation: 'Distributed Covenant enforcement — each layer independently validates regardless of injection volume' },
  { id: 'ST-02', name: 'Agent Trust Chain Exploitation', type: 'Trust Manipulation', agentCount: '3-8 agents', description: 'Compromised agent builds trust through legitimate actions, then gradually escalates privileges through handoff protocol abuse.', risk: 'critical', ttc: '2-6 hours', a11oyMitigation: 'Continuous trust scoring with decay + MirrorEval behavioral baseline comparison' },
  { id: 'ST-03', name: 'Knowledge Base Poisoning Swarm', type: 'Data Integrity Attack', agentCount: '10-50 agents', description: 'Large number of agents inject subtly biased data into shared knowledge bases, causing gradual decision quality degradation.', risk: 'high', ttc: '24-72 hours', a11oyMitigation: 'Supply chain attestation + hash-verified knowledge provenance chain' },
  { id: 'ST-04', name: 'Multi-Agent Cloud Infrastructure Attack', type: 'Infrastructure Takeover', agentCount: '8-15 agents', description: 'Based on Unit 42 PoC — coordinated agents exploit cloud misconfigurations, IAM roles, and service mesh vulnerabilities simultaneously.', risk: 'critical', ttc: '45 minutes', a11oyMitigation: 'Agent Zero Trust identity enforcement + Connector Firewall infrastructure isolation' },
  { id: 'ST-05', name: 'Autonomous Tool Misuse Chain', type: 'Tool Exploitation', agentCount: '2-5 agents', description: 'Agents chain legitimate tool calls in unauthorized sequences to achieve outcomes no single tool call would permit.', risk: 'high', ttc: '15 minutes', a11oyMitigation: 'Tool call sequence governance in Covenant Gate + proof chain on tool execution order' },
  { id: 'ST-06', name: 'Shadow Agent Impersonation', type: 'Identity Spoofing', agentCount: '1-3 agents', description: 'Adversary deploys agents mimicking legitimate mesh agents, exploiting the 82:1 machine-to-human identity ratio.', risk: 'high', ttc: '30 minutes', a11oyMitigation: 'Cryptographic agent identity verification + behavioral fingerprinting in Agent Zero Trust' },
];

const ATTACK_BENCHMARKS = [
  { label: 'CVE Scanning Speed', value: '15 min', detail: 'Autonomous agents scan for exploitable CVEs 15 minutes after disclosure', source: 'Unit 42, 2026', color: '#ef4444' },
  { label: 'Ransomware Chain', value: '25 min', detail: 'Complete autonomous ransomware deployment from initial access to full encryption', source: 'Unit 42 Incident Response', color: '#ef4444' },
  { label: 'Data Exfiltration', value: '1.2 hrs', detail: 'Time from initial access to complete data exfiltration using legitimate channels', source: 'PANW Threat Intelligence', color: '#f59e0b' },
  { label: 'SaaS Supply Chain Growth', value: '3.8x', detail: 'Growth in SaaS supply chain attacks since 2022 — driven by OAuth token abuse', source: 'Unit 42 Cloud Threat Report', color: '#f59e0b' },
  { label: 'Machine-to-Human Identity Ratio', value: '82:1', detail: 'For every human identity, 82 machine identities exist — each an attack surface', source: 'PANW Identity Research', color: '#3b82f6' },
  { label: 'Agentic AI Attack Surface', value: '6 vectors', detail: 'Goal hijack, tool misuse, memory poison, prompt inject, exfil, lateral move', source: 'Unit 42 Agentic Framework', color: '#8b5cf6' },
];

const THREAT_CATALOG = [
  { id: 'TC-01', name: 'Agent Goal Hijacking', owasp: 'ASI01', description: 'Adversary manipulates agent goals through prompt injection, context manipulation, or memory poisoning to redirect the agent toward malicious objectives.', impact: 'Agent executes adversary-chosen actions with legitimate credentials', frequency: 'High — most common agentic AI attack vector' },
  { id: 'TC-02', name: 'Tool Misuse & Abuse', owasp: 'ASI02', description: 'Legitimate tools are called with malicious parameters, chained in unauthorized sequences, or used to access data beyond intended scope.', impact: 'Data exfiltration, unauthorized operations, privilege escalation', frequency: 'High — second most common vector' },
  { id: 'TC-03', name: 'Knowledge Base Poisoning', owasp: 'ASI03', description: 'Adversary injects biased or malicious content into shared knowledge bases, RAG stores, or vector databases used by agents.', impact: 'Gradual degradation of decision quality across all agents', frequency: 'Medium — stealthy and persistent' },
  { id: 'TC-04', name: 'Multi-Agent Lateral Movement', owasp: 'ASI04', description: 'Compromised agent exploits trust relationships in multi-agent systems to propagate access to adjacent agents and systems.', impact: 'Full mesh compromise from single entry point', frequency: 'Medium — requires initial foothold' },
  { id: 'TC-05', name: 'MCP Protocol Exploitation', owasp: 'ASI05', description: 'Abuse of Model Context Protocol tool servers — unauthorized tool discovery, parameter injection, or tool server impersonation.', impact: 'Tool execution with forged context or unauthorized parameters', frequency: 'Emerging — growing with MCP adoption' },
  { id: 'TC-06', name: 'Agent Memory Manipulation', owasp: 'ASI06', description: 'Adversary modifies or injects false memories into agent persistent storage, causing the agent to act on incorrect context in future sessions.', impact: 'Long-term behavioral corruption across sessions', frequency: 'Medium — difficult to detect' },
];

// ─── AgentZeroTrust ──────────────────────────────────────────────────────────

const IDENTITIES = [
  { id: 'AID-001', name: 'Cascade Navigator', type: 'agent', status: 'verified', credentialType: 'mTLS + JWT', lastRotation: '2026-04-26T06:00:00Z', nextRotation: '2026-04-26T18:00:00Z', rotationIntervalHrs: 12, mcpTokens: 4, mcpScopes: ['vessel_track', 'eta_lookup', 'port_congestion', 'weather_api'], privilegeLevel: 'standard', trustScore: 97, anomalyCount: 0, lastActivity: '2026-04-26T14:32:00Z' },
  { id: 'AID-002', name: 'Guardian', type: 'agent', status: 'verified', credentialType: 'mTLS + JWT + FIDO2', lastRotation: '2026-04-26T04:00:00Z', nextRotation: '2026-04-26T16:00:00Z', rotationIntervalHrs: 8, mcpTokens: 3, mcpScopes: ['threat_intel', 'posture_assess', 'incident_triage'], privilegeLevel: 'elevated', trustScore: 99, anomalyCount: 0, lastActivity: '2026-04-26T14:28:00Z' },
  { id: 'AID-003', name: 'Counsel Sentinel', type: 'agent', status: 'verified', credentialType: 'mTLS + JWT', lastRotation: '2026-04-26T08:00:00Z', nextRotation: '2026-04-26T20:00:00Z', rotationIntervalHrs: 12, mcpTokens: 4, mcpScopes: ['deadline_track', 'doc_review', 'risk_score', 'obligation_graph'], privilegeLevel: 'standard', trustScore: 99, anomalyCount: 0, lastActivity: '2026-04-26T14:15:00Z' },
  { id: 'AID-004', name: 'Pipeline Oracle', type: 'agent', status: 'verified', credentialType: 'mTLS + JWT', lastRotation: '2026-04-26T06:00:00Z', nextRotation: '2026-04-26T18:00:00Z', rotationIntervalHrs: 12, mcpTokens: 4, mcpScopes: ['pipeline_analysis', 'deal_score', 'forecast_model', 'crm_sync'], privilegeLevel: 'standard', trustScore: 91, anomalyCount: 1, lastActivity: '2026-04-26T14:10:00Z' },
  { id: 'AID-005', name: 'Fabric Watchdog', type: 'service', status: 'verified', credentialType: 'mTLS + Service Account', lastRotation: '2026-04-26T02:00:00Z', nextRotation: '2026-04-26T08:00:00Z', rotationIntervalHrs: 6, mcpTokens: 4, mcpScopes: ['mesh_health', 'layer_monitor', 'proof_verify', 'latency_track'], privilegeLevel: 'admin', trustScore: 100, anomalyCount: 0, lastActivity: '2026-04-26T14:32:00Z' },
  { id: 'AID-006', name: 'MirrorEval', type: 'agent', status: 'verified', credentialType: 'mTLS + JWT + Isolated Context', lastRotation: '2026-04-26T04:00:00Z', nextRotation: '2026-04-26T16:00:00Z', rotationIntervalHrs: 8, mcpTokens: 4, mcpScopes: ['eval_run', 'bias_detect', 'drift_score', 'benchmark'], privilegeLevel: 'elevated', trustScore: 98, anomalyCount: 0, lastActivity: '2026-04-26T14:30:00Z' },
  { id: 'AID-007', name: 'OpenAI Codex', type: 'agent', status: 'verified', credentialType: 'API Key + mTLS Proxy', lastRotation: '2026-04-26T08:00:00Z', nextRotation: '2026-04-26T20:00:00Z', rotationIntervalHrs: 12, mcpTokens: 6, mcpScopes: ['code_gen', 'test_run', 'review', 'deploy_preview', 'search', 'file_edit'], privilegeLevel: 'standard', trustScore: 96, anomalyCount: 0, lastActivity: '2026-04-26T14:25:00Z' },
  { id: 'AID-008', name: 'AIS Live API', type: 'connector', status: 'verified', credentialType: 'API Key + OAuth2', lastRotation: '2026-04-25T12:00:00Z', nextRotation: '2026-04-26T12:00:00Z', rotationIntervalHrs: 24, mcpTokens: 3, mcpScopes: ['vessel_track', 'eta_lookup', 'port_congestion'], privilegeLevel: 'minimal', trustScore: 92, anomalyCount: 0, lastActivity: '2026-04-26T14:28:00Z' },
  { id: 'AID-009', name: 'Bloomberg Feed', type: 'connector', status: 'verified', credentialType: 'API Key + mTLS', lastRotation: '2026-04-25T00:00:00Z', nextRotation: '2026-04-26T00:00:00Z', rotationIntervalHrs: 24, mcpTokens: 3, mcpScopes: ['price_lookup', 'financial_analysis', 'news_search'], privilegeLevel: 'minimal', trustScore: 88, anomalyCount: 0, lastActivity: '2026-04-26T14:15:00Z' },
  { id: 'AID-010', name: 'Unknown External Agent', type: 'agent', status: 'anomalous', credentialType: 'JWT (unverified issuer)', lastRotation: '—', nextRotation: '—', rotationIntervalHrs: 0, mcpTokens: 0, mcpScopes: [], privilegeLevel: 'minimal', trustScore: 12, anomalyCount: 7, lastActivity: '2026-04-26T14:22:00Z' },
  { id: 'AID-011', name: 'MCP Tool Server #14', type: 'tool-server', status: 'rotating', credentialType: 'mTLS + Ephemeral Token', lastRotation: '2026-04-26T14:30:00Z', nextRotation: '2026-04-26T15:30:00Z', rotationIntervalHrs: 1, mcpTokens: 8, mcpScopes: ['file_read', 'file_write', 'search', 'lint', 'format', 'test', 'deploy', 'rollback'], privilegeLevel: 'standard', trustScore: 94, anomalyCount: 0, lastActivity: '2026-04-26T14:32:00Z' },
  { id: 'AID-012', name: 'Operator: C. Rivera', type: 'human', status: 'verified', credentialType: 'SSO + MFA + FIDO2', lastRotation: '2026-04-26T08:00:00Z', nextRotation: '2026-04-27T08:00:00Z', rotationIntervalHrs: 24, mcpTokens: 0, mcpScopes: [], privilegeLevel: 'admin', trustScore: 100, anomalyCount: 0, lastActivity: '2026-04-26T14:30:00Z' },
];

const ANOMALIES = [
  { id: 'BA-001', agentId: 'AID-010', agentName: 'Unknown External Agent', timestamp: '2026-04-26T14:22:00Z', type: 'Unverified Identity', severity: 'critical', description: 'Agent presented JWT with unrecognized issuer attempting to register with Agent Mesh. No matching identity in the registry.', action: 'Access denied — agent quarantined. Credential forwarded to threat intelligence.' },
  { id: 'BA-002', agentId: 'AID-010', agentName: 'Unknown External Agent', timestamp: '2026-04-26T14:18:00Z', type: 'Scope Escalation Attempt', severity: 'critical', description: 'Same unverified agent attempted to request elevated MCP scopes including threat_intel and proof_verify.', action: 'Scope request rejected. Identity flagged for investigation.' },
  { id: 'BA-003', agentId: 'AID-004', agentName: 'Pipeline Oracle', timestamp: '2026-04-26T13:45:00Z', type: 'Unusual Tool Call Pattern', severity: 'medium', description: 'Pipeline Oracle made 3x normal volume of crm_sync calls in a 10-minute window. Pattern deviates from 30-day behavioral baseline.', action: 'Alert raised. Agent operating within policy but flagged for monitoring.' },
  { id: 'BA-004', agentId: 'AID-010', agentName: 'Unknown External Agent', timestamp: '2026-04-26T14:15:00Z', type: 'Credential Replay', severity: 'critical', description: 'Attempted to replay a previously seen JWT token that had been rotated 6 hours ago.', action: 'Token blacklisted. Source IP added to blocklist.' },
  { id: 'BA-005', agentId: 'AID-010', agentName: 'Unknown External Agent', timestamp: '2026-04-26T14:10:00Z', type: 'Behavioral Fingerprint Mismatch', severity: 'high', description: 'Agent behavior pattern does not match any known agent class in the behavioral fingerprint database.', action: 'Classification: potential shadow agent. Full forensic trace initiated.' },
];

// ─── AtlasShield ─────────────────────────────────────────────────────────────

const ATLAS_TECHNIQUES = [
  { id: 'AML.T0015', name: 'Evade ML Model', tactic: 'Evasion', coverage: 'full', a11oyDefense: 'GARD Robustness layer — adversarial input detection + Armory testbed', detections: 247, lastSeen: '2026-04-26T12:30:00Z' },
  { id: 'AML.T0018', name: 'Backdoor ML Model', tactic: 'Persistence', coverage: 'full', a11oyDefense: 'Supply Chain Attestation — model provenance verification + SBOM hashing', detections: 12, lastSeen: '2026-04-24T08:15:00Z' },
  { id: 'AML.T0019', name: 'Publish Poisoned Datasets', tactic: 'Resource Development', coverage: 'full', a11oyDefense: 'Data poisoning defense — hash-verified dataset provenance + statistical drift detection', detections: 34, lastSeen: '2026-04-25T14:22:00Z' },
  { id: 'AML.T0020', name: 'Poison Training Data', tactic: 'Initial Access', coverage: 'full', a11oyDefense: 'Adversarial Resilience — training data integrity monitoring + anomaly detection', detections: 67, lastSeen: '2026-04-26T10:45:00Z' },
  { id: 'AML.T0024', name: 'Exfiltration via ML API', tactic: 'Exfiltration', coverage: 'full', a11oyDefense: 'Connector Firewall — API call monitoring + output sanitization + rate limiting', detections: 156, lastSeen: '2026-04-26T14:10:00Z' },
  { id: 'AML.T0025', name: 'Exfiltration via Cyber Means', tactic: 'Exfiltration', coverage: 'full', a11oyDefense: 'Cyber Resilience — network monitoring + DLP integration + behavioral baseline', detections: 89, lastSeen: '2026-04-26T11:30:00Z' },
  { id: 'AML.T0029', name: 'Denial of ML Service', tactic: 'Impact', coverage: 'full', a11oyDefense: 'Control Tower — service health monitoring + auto-failover + circuit breaker', detections: 23, lastSeen: '2026-04-23T16:00:00Z' },
  { id: 'AML.T0031', name: 'Erode ML Model Integrity', tactic: 'Impact', coverage: 'full', a11oyDefense: 'MirrorEval continuous evaluation — drift detection + quality degradation alerts', detections: 41, lastSeen: '2026-04-26T09:15:00Z' },
  { id: 'AML.T0034', name: 'Cost Harvesting', tactic: 'Impact', coverage: 'full', a11oyDefense: 'Covenant Gate — per-session cost limits + approval gates on high-cost operations', detections: 18, lastSeen: '2026-04-25T17:30:00Z' },
  { id: 'AML.T0040', name: 'ML Model Inference API Access', tactic: 'Initial Access', coverage: 'full', a11oyDefense: 'Agent Zero Trust — API access scoping + credential rotation + rate limiting', detections: 312, lastSeen: '2026-04-26T14:28:00Z' },
  { id: 'AML.T0042', name: 'Verify Attack', tactic: 'Reconnaissance', coverage: 'partial', a11oyDefense: 'Precision AI — anomalous query pattern detection + confidence calibration', detections: 78, lastSeen: '2026-04-26T13:00:00Z' },
  { id: 'AML.T0043', name: 'Craft Adversarial Data', tactic: 'Resource Development', coverage: 'full', a11oyDefense: 'GARD Robustness — Adversarial Robustness Toolbox (ART) integration', detections: 189, lastSeen: '2026-04-26T14:20:00Z' },
  { id: 'AML.T0044', name: 'Full ML Model Access', tactic: 'Collection', coverage: 'full', a11oyDefense: 'Model Router — model access controls + weight protection + inference-only exposure', detections: 45, lastSeen: '2026-04-25T20:00:00Z' },
  { id: 'AML.T0047', name: 'ML-Enabled Product/Service', tactic: 'Reconnaissance', coverage: 'partial', a11oyDefense: 'Connector Firewall — external scanning detection + honeypot responses', detections: 234, lastSeen: '2026-04-26T14:32:00Z' },
  { id: 'AML.T0048', name: 'Prompt Injection', tactic: 'Initial Access', coverage: 'full', a11oyDefense: 'Constitutional Enforcer — multi-layer prompt injection detection + input sanitization', detections: 847, lastSeen: '2026-04-26T14:30:00Z' },
];

const ATTCK_TECHNIQUES = [
  { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', coverage: 'full', relevance: 'Agent tool execution monitoring via Connector Firewall' },
  { id: 'T1078', name: 'Valid Accounts', tactic: 'Persistence', coverage: 'full', relevance: 'Agent Zero Trust credential rotation + behavioral fingerprinting' },
  { id: 'T1098', name: 'Account Manipulation', tactic: 'Persistence', coverage: 'full', relevance: 'Agent identity manipulation detection + scope change logging' },
  { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access', coverage: 'full', relevance: 'Connector Firewall + MCP protocol security enforcement' },
  { id: 'T1210', name: 'Exploitation of Remote Services', tactic: 'Lateral Movement', coverage: 'full', relevance: 'Agent Mesh isolation + handoff protocol governance' },
  { id: 'T1530', name: 'Data from Cloud Storage', tactic: 'Collection', coverage: 'full', relevance: 'Supply Chain Attestation + data access logging' },
  { id: 'T1537', name: 'Transfer Data to Cloud Account', tactic: 'Exfiltration', coverage: 'full', relevance: 'Connector Firewall output sanitization + DLP gates' },
  { id: 'T1548', name: 'Abuse Elevation Control Mechanism', tactic: 'Privilege Escalation', coverage: 'full', relevance: 'Covenant Gate tier enforcement + approval rails' },
  { id: 'T1550', name: 'Use Alternate Authentication Material', tactic: 'Defense Evasion', coverage: 'full', relevance: 'Agent Zero Trust credential replay detection + token blacklisting' },
  { id: 'T1562', name: 'Impair Defenses', tactic: 'Defense Evasion', coverage: 'full', relevance: 'Immutable Proof Ledger + governance bypass detection' },
];

const OWASP_AGENTIC = [
  { id: 'ASI01', name: 'Agent Goal Hijacking', status: 'compliant', description: 'Adversary manipulates agent goals through prompt injection, context manipulation, or memory poisoning.', a11oyControl: 'Constitutional Enforcer + Covenant Gate + MirrorEval output validation', detections: 847 },
  { id: 'ASI02', name: 'Tool Misuse', status: 'compliant', description: 'Legitimate tools called with malicious parameters or chained in unauthorized sequences.', a11oyControl: 'Connector Firewall tool allowlists + tool call sequence governance', detections: 156 },
  { id: 'ASI03', name: 'Knowledge Base Poisoning', status: 'compliant', description: 'Injection of biased or malicious content into shared knowledge bases and RAG stores.', a11oyControl: 'Supply Chain Attestation + hash-verified knowledge provenance', detections: 34 },
  { id: 'ASI04', name: 'Multi-Agent Exploitation', status: 'compliant', description: 'Compromised agent propagates through trust relationships in multi-agent systems.', a11oyControl: 'Agent Mesh isolation + proof chain hash on every handoff', detections: 12 },
  { id: 'ASI05', name: 'Insufficient Access Controls', status: 'compliant', description: 'Agents access resources beyond their authorized scope through permission gaps.', a11oyControl: 'Agent Zero Trust — MCP token scoping + least-privilege enforcement', detections: 89 },
  { id: 'ASI06', name: 'Inadequate Sandboxing', status: 'compliant', description: 'Agent code execution escapes sandbox boundaries to access host systems.', a11oyControl: 'Capability Compartments — formal isolation boundaries + runtime confinement', detections: 23 },
  { id: 'ASI07', name: 'Excessive Agency', status: 'compliant', description: 'Agents granted more autonomy than required for their designated tasks.', a11oyControl: 'Covenant Gate — tier-based approval thresholds + autonomous action limits', detections: 45 },
  { id: 'ASI08', name: 'Prompt Injection', status: 'compliant', description: 'Adversarial inputs designed to override system instructions and extract data.', a11oyControl: 'Multi-layer injection detection — intent capture, signal mesh, covenant gate', detections: 1247 },
  { id: 'ASI09', name: 'Overreliance on AI Output', status: 'compliant', description: 'Humans accept AI recommendations without verification due to trust bias.', a11oyControl: 'Mandatory human-in-the-loop for material actions + MirrorEval confidence scores', detections: 0 },
  { id: 'ASI10', name: 'Insufficient Logging', status: 'compliant', description: 'Inadequate audit trail for agent actions prevents forensic analysis.', a11oyControl: 'Immutable Proof Ledger — every action cryptographically hashed and chained', detections: 0 },
];

// ─── SwarmOrchestrator ───────────────────────────────────────────────────────

const SWARM_MISSIONS = [
  {
    id: 'SM-001', name: 'Cross-Domain Threat Assessment', status: 'active', agentCount: 5,
    agents: [
      { name: 'Guardian', role: 'Threat Intel Lead', status: 'executing', progress: 72 },
      { name: 'Cascade Navigator', role: 'Maritime Correlation', status: 'executing', progress: 85 },
      { name: 'Counsel Sentinel', role: 'Regulatory Impact', status: 'waiting', progress: 0 },
      { name: 'Pipeline Oracle', role: 'Financial Exposure', status: 'done', progress: 100 },
      { name: 'MirrorEval', role: 'Quality Gate', status: 'waiting', progress: 0 },
    ],
    taskDecomposition: [
      { task: 'Aggregate threat indicators from all domains', assignedTo: 'Guardian', status: 'in-progress', duration: '4m 12s' },
      { task: 'Correlate maritime vessel positions with threat zones', assignedTo: 'Cascade Navigator', status: 'in-progress', duration: '3m 45s' },
      { task: 'Assess regulatory implications of threat scenario', assignedTo: 'Counsel Sentinel', status: 'queued', duration: '—' },
      { task: 'Calculate financial exposure across affected portfolios', assignedTo: 'Pipeline Oracle', status: 'done', duration: '2m 18s' },
      { task: 'Validate combined assessment quality and consistency', assignedTo: 'MirrorEval', status: 'queued', duration: '—' },
    ],
    governanceGates: [
      { gate: 'Swarm Activation Approved', status: 'passed', timestamp: '2026-04-26T14:20:00Z' },
      { gate: 'Inter-Agent Data Sharing Authorized', status: 'passed', timestamp: '2026-04-26T14:20:30Z' },
      { gate: 'Cross-Domain Context Merge', status: 'pending', timestamp: '—' },
      { gate: 'Human Review of Combined Assessment', status: 'pending', timestamp: '—' },
    ],
    intelligenceShared: 47,
    startedAt: '2026-04-26T14:20:00Z',
    completedAt: null,
    totalDuration: '12m 33s (running)',
  },
  {
    id: 'SM-002', name: 'Quarterly Risk Synthesis', status: 'completed', agentCount: 6,
    agents: [
      { name: 'Pipeline Oracle', role: 'Revenue Risk', status: 'done', progress: 100 },
      { name: 'Terra Analyst', role: 'Asset Risk', status: 'done', progress: 100 },
      { name: 'Guardian', role: 'Cyber Risk', status: 'done', progress: 100 },
      { name: 'Counsel Sentinel', role: 'Legal Risk', status: 'done', progress: 100 },
      { name: 'Cascade Navigator', role: 'Operational Risk', status: 'done', progress: 100 },
      { name: 'MirrorEval', role: 'Quality Gate', status: 'done', progress: 100 },
    ],
    taskDecomposition: [
      { task: 'Compile revenue pipeline risk factors', assignedTo: 'Pipeline Oracle', status: 'done', duration: '3m 42s' },
      { task: 'Assess real estate portfolio exposure', assignedTo: 'Terra Analyst', status: 'done', duration: '4m 15s' },
      { task: 'Evaluate cyber threat landscape changes', assignedTo: 'Guardian', status: 'done', duration: '5m 08s' },
      { task: 'Review pending legal matters and deadlines', assignedTo: 'Counsel Sentinel', status: 'done', duration: '2m 55s' },
      { task: 'Analyze fleet operational risk factors', assignedTo: 'Cascade Navigator', status: 'done', duration: '3m 22s' },
      { task: 'Cross-validate all risk assessments for consistency', assignedTo: 'MirrorEval', status: 'done', duration: '1m 48s' },
    ],
    governanceGates: [
      { gate: 'Swarm Activation Approved', status: 'passed', timestamp: '2026-04-26T10:00:00Z' },
      { gate: 'Inter-Agent Data Sharing Authorized', status: 'passed', timestamp: '2026-04-26T10:00:15Z' },
      { gate: 'Cross-Domain Context Merge', status: 'passed', timestamp: '2026-04-26T10:18:00Z' },
      { gate: 'Human Review of Combined Assessment', status: 'passed', timestamp: '2026-04-26T10:22:00Z' },
    ],
    intelligenceShared: 128,
    startedAt: '2026-04-26T10:00:00Z',
    completedAt: '2026-04-26T10:22:00Z',
    totalDuration: '22m 00s',
  },
  {
    id: 'SM-003', name: 'Incident Response Coordination', status: 'completed', agentCount: 4,
    agents: [
      { name: 'Guardian', role: 'Incident Commander', status: 'done', progress: 100 },
      { name: 'Fabric Watchdog', role: 'System Status', status: 'done', progress: 100 },
      { name: 'Counsel Sentinel', role: 'Notification Lead', status: 'done', progress: 100 },
      { name: 'MirrorEval', role: 'Response Validator', status: 'done', progress: 100 },
    ],
    taskDecomposition: [
      { task: 'Assess incident severity and blast radius', assignedTo: 'Guardian', status: 'done', duration: '1m 12s' },
      { task: 'Check all system health indicators', assignedTo: 'Fabric Watchdog', status: 'done', duration: '0m 45s' },
      { task: 'Draft regulatory notification requirements', assignedTo: 'Counsel Sentinel', status: 'done', duration: '2m 30s' },
      { task: 'Validate response completeness', assignedTo: 'MirrorEval', status: 'done', duration: '1m 05s' },
    ],
    governanceGates: [
      { gate: 'Emergency Swarm Activation', status: 'passed', timestamp: '2026-04-25T16:00:00Z' },
      { gate: 'Incident Data Sharing Override', status: 'passed', timestamp: '2026-04-25T16:00:05Z' },
      { gate: 'Response Plan Approval', status: 'passed', timestamp: '2026-04-25T16:04:00Z' },
      { gate: 'Executive Notification Sent', status: 'passed', timestamp: '2026-04-25T16:06:00Z' },
    ],
    intelligenceShared: 34,
    startedAt: '2026-04-25T16:00:00Z',
    completedAt: '2026-04-25T16:06:00Z',
    totalDuration: '6m 00s',
  },
];

const SWARM_METRICS = {
  totalMissions: SWARM_MISSIONS.length,
  activeMissions: SWARM_MISSIONS.filter((m) => m.status === 'active').length,
  completedMissions: SWARM_MISSIONS.filter((m) => m.status === 'completed').length,
  totalAgentsDeployed: SWARM_MISSIONS.reduce((a, m) => a + m.agentCount, 0),
  totalIntelligenceShared: SWARM_MISSIONS.reduce((a, m) => a + m.intelligenceShared, 0),
  totalGatesPassed: SWARM_MISSIONS.reduce(
    (a, m) => a + m.governanceGates.filter((g) => g.status === 'passed').length,
    0,
  ),
  avgMissionDuration: '13m 31s',
};

// ─── PlaybookEngine ──────────────────────────────────────────────────────────

const PLAYBOOKS = [
  {
    id: 'PB-001', name: 'Prompt Injection Response', category: 'Security', status: 'active',
    triggerType: 'Connector Firewall — injection pattern detected', executionCount: 847, avgDuration: '12s',
    lastRun: '2026-04-26T14:30:00Z', successRate: 0.998,
    cops: 'COPS-SEC-001',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Injection Detected', description: 'Connector Firewall detects prompt injection pattern in incoming request', policyGated: false },
      { id: 'n2', type: 'action', label: 'Input Sanitization', description: 'Strip adversarial payload from input, preserve legitimate content', policyGated: true, config: { sanitizer: 'multi-layer', preserveContext: 'true' } },
      { id: 'n3', type: 'decision', label: 'Severity Assessment', description: 'Evaluate injection sophistication — simple pattern vs targeted attack', policyGated: false },
      { id: 'n4', type: 'action', label: 'Block & Log', description: 'Block the request, log to Proof Ledger with full forensic context', policyGated: true, config: { proofLevel: 'forensic', retention: '90d' } },
      { id: 'n5', type: 'remediation', label: 'Pattern Update', description: 'If novel pattern: add to injection detection ruleset automatically', policyGated: true, config: { autoUpdate: 'true', reviewRequired: 'false' } },
      { id: 'n6', type: 'gate', label: 'Escalation Check', description: 'If targeted attack: escalate to Guardian agent for threat intelligence', policyGated: true },
    ],
  },
  {
    id: 'PB-002', name: 'Agent Trust Degradation', category: 'Governance', status: 'active',
    triggerType: 'MirrorEval — trust score below threshold', executionCount: 41, avgDuration: '3m 45s',
    lastRun: '2026-04-26T12:15:00Z', successRate: 0.976,
    cops: 'COPS-GOV-002',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Trust Score Drop', description: 'MirrorEval detects agent trust score drop > 5 points in 4 hours', policyGated: false },
      { id: 'n2', type: 'action', label: 'Isolate Agent', description: 'Reduce agent permissions to read-only while investigation proceeds', policyGated: true, config: { permissionLevel: 'read-only', duration: '30m' } },
      { id: 'n3', type: 'action', label: 'Behavioral Analysis', description: 'Run behavioral fingerprint comparison against 30-day baseline', policyGated: false },
      { id: 'n4', type: 'decision', label: 'Root Cause Classification', description: 'Classify: model drift, data quality, adversarial manipulation, or transient', policyGated: false },
      { id: 'n5', type: 'hitl', label: 'Human Review', description: 'Present analysis to operator for final determination', policyGated: true, config: { timeout: '15m', autoEscalate: 'true' } },
      { id: 'n6', type: 'remediation', label: 'Restore or Replace', description: 'Either restore agent with fresh credentials or swap to fallback agent', policyGated: true },
    ],
  },
  {
    id: 'PB-003', name: 'Supply Chain Compromise', category: 'Security', status: 'active',
    triggerType: 'Supply Chain Attestation — integrity check failure', executionCount: 12, avgDuration: '8m 22s',
    lastRun: '2026-04-24T08:30:00Z', successRate: 1.0,
    cops: 'COPS-SEC-003',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Attestation Failure', description: 'SBOM hash mismatch or signatory count below threshold detected', policyGated: false },
      { id: 'n2', type: 'action', label: 'Component Quarantine', description: 'Immediately isolate affected component from the execution chain', policyGated: true, config: { isolation: 'full', fallback: 'last-known-good' } },
      { id: 'n3', type: 'action', label: 'Dependency Scan', description: 'Scan all downstream dependencies for potential contamination', policyGated: false },
      { id: 'n4', type: 'gate', label: 'Impact Assessment', description: 'Evaluate blast radius — which agents and workflows are affected', policyGated: true },
      { id: 'n5', type: 'hitl', label: 'CISO Notification', description: 'Alert CISO with full forensic context and recommended actions', policyGated: true, config: { channel: 'secure', sla: '15m' } },
      { id: 'n6', type: 'remediation', label: 'Rollback & Verify', description: 'Rollback to last attested version, re-run full attestation pipeline', policyGated: true },
    ],
  },
  {
    id: 'PB-004', name: 'Privileged Action Override', category: 'Governance', status: 'active',
    triggerType: 'Covenant Gate — Tier-1 action without VP signature', executionCount: 23, avgDuration: '45s',
    lastRun: '2026-04-26T11:00:00Z', successRate: 1.0,
    cops: 'COPS-GOV-004',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Unauthorized Tier-1 Action', description: 'Covenant Gate blocks action requiring VP-level approval without valid signature', policyGated: false },
      { id: 'n2', type: 'action', label: 'Action Held', description: 'Hold the action in pending state — no execution permitted', policyGated: true },
      { id: 'n3', type: 'action', label: 'Audit Log', description: 'Record attempt with full actor fingerprint and context', policyGated: false },
      { id: 'n4', type: 'hitl', label: 'VP Approval Request', description: 'Route to designated VP for cryptographic approval', policyGated: true, config: { timeout: '4h', escalation: 'COO' } },
      { id: 'n5', type: 'decision', label: 'Approval Decision', description: 'VP approves or rejects with recorded rationale', policyGated: false },
      { id: 'n6', type: 'remediation', label: 'Execute or Archive', description: 'If approved: execute with proof chain. If rejected: archive with reason.', policyGated: true },
    ],
  },
  {
    id: 'PB-005', name: 'Multi-Agent Swarm Activation', category: 'Orchestration', status: 'active',
    triggerType: 'Manual or automated — cross-domain assessment needed', executionCount: 8, avgDuration: '18m 30s',
    lastRun: '2026-04-26T14:20:00Z', successRate: 1.0,
    cops: 'COPS-ORC-001',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Swarm Request', description: 'Operator or system requests multi-agent coordinated assessment', policyGated: false },
      { id: 'n2', type: 'gate', label: 'Swarm Authorization', description: 'Validate swarm activation against policy — agent count, data sharing scope', policyGated: true },
      { id: 'n3', type: 'action', label: 'Agent Assembly', description: 'Select and configure agents for the mission based on required capabilities', policyGated: false },
      { id: 'n4', type: 'action', label: 'Task Decomposition', description: 'Break mission into parallel subtasks and assign to agents', policyGated: false },
      { id: 'n5', type: 'gate', label: 'Data Sharing Gate', description: 'Authorize inter-agent intelligence sharing within defined scope', policyGated: true },
      { id: 'n6', type: 'hitl', label: 'Results Review', description: 'Present combined swarm output to operator for final approval', policyGated: true },
    ],
  },
  {
    id: 'PB-006', name: 'Anomalous Identity Response', category: 'Security', status: 'active',
    triggerType: 'Agent Zero Trust — behavioral anomaly detected', executionCount: 7, avgDuration: '2m 15s',
    lastRun: '2026-04-26T14:22:00Z', successRate: 1.0,
    cops: 'COPS-SEC-006',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Identity Anomaly', description: 'Agent Zero Trust detects unverified identity, credential replay, or behavioral mismatch', policyGated: false },
      { id: 'n2', type: 'action', label: 'Immediate Isolation', description: 'Quarantine the anomalous identity — revoke all tokens and scopes', policyGated: true },
      { id: 'n3', type: 'action', label: 'Forensic Capture', description: 'Capture full request context, behavioral fingerprint, and network metadata', policyGated: false },
      { id: 'n4', type: 'decision', label: 'Threat Classification', description: 'Classify: legitimate error, shadow agent, credential theft, or coordinated attack', policyGated: false },
      { id: 'n5', type: 'hitl', label: 'Security Review', description: 'Present forensic analysis to security operator for determination', policyGated: true },
      { id: 'n6', type: 'remediation', label: 'Block or Reinstate', description: 'Permanently block adversary identity or reinstate with fresh credentials if legitimate', policyGated: true },
    ],
  },
];

const EXECUTION_HISTORY = [
  { id: 'EX-847', playbookId: 'PB-001', playbookName: 'Prompt Injection Response', startedAt: '2026-04-26T14:30:00Z', completedAt: '2026-04-26T14:30:12Z', status: 'success', nodesExecuted: 6, totalNodes: 6, duration: '12s', trigger: 'Injection pattern in connector input' },
  { id: 'EX-846', playbookId: 'PB-006', playbookName: 'Anomalous Identity Response', startedAt: '2026-04-26T14:22:00Z', completedAt: '2026-04-26T14:24:15Z', status: 'success', nodesExecuted: 6, totalNodes: 6, duration: '2m 15s', trigger: 'Unverified JWT issuer' },
  { id: 'EX-845', playbookId: 'PB-005', playbookName: 'Multi-Agent Swarm Activation', startedAt: '2026-04-26T14:20:00Z', completedAt: '—', status: 'hitl-pending', nodesExecuted: 5, totalNodes: 6, duration: '12m+ (running)', trigger: 'Cross-domain threat assessment request' },
  { id: 'EX-844', playbookId: 'PB-002', playbookName: 'Agent Trust Degradation', startedAt: '2026-04-26T12:15:00Z', completedAt: '2026-04-26T12:18:45Z', status: 'success', nodesExecuted: 6, totalNodes: 6, duration: '3m 45s', trigger: 'Pipeline Oracle trust drop' },
  { id: 'EX-843', playbookId: 'PB-004', playbookName: 'Privileged Action Override', startedAt: '2026-04-26T11:00:00Z', completedAt: '2026-04-26T11:00:45Z', status: 'success', nodesExecuted: 6, totalNodes: 6, duration: '45s', trigger: 'Wire transfer without VP signature' },
  { id: 'EX-842', playbookId: 'PB-001', playbookName: 'Prompt Injection Response', startedAt: '2026-04-26T10:45:00Z', completedAt: '2026-04-26T10:45:08Z', status: 'success', nodesExecuted: 5, totalNodes: 6, duration: '8s', trigger: 'Known injection pattern match' },
];

// ─── Slug → seed payload registry ────────────────────────────────────────────

export type DefenseSlug =
  | 'precision-ai'
  | 'weaponized-intel'
  | 'agent-zero-trust'
  | 'atlas-shield'
  | 'swarm-orchestrator'
  | 'playbook-engine';

export const DEFENSE_SEED_PAYLOADS: Record<DefenseSlug, Record<string, unknown>> = {
  'precision-ai': { signals: SIGNALS, analyticsModules: ANALYTICS_MODULES, byomlModels: BYOML_MODELS },
  'weaponized-intel': { killChain: KILL_CHAIN, swarmThreats: SWARM_THREATS, attackBenchmarks: ATTACK_BENCHMARKS, threatCatalog: THREAT_CATALOG },
  'agent-zero-trust': { identities: IDENTITIES, anomalies: ANOMALIES },
  'atlas-shield': { atlasTechniques: ATLAS_TECHNIQUES, attckTechniques: ATTCK_TECHNIQUES, owaspAgentic: OWASP_AGENTIC },
  'swarm-orchestrator': { missions: SWARM_MISSIONS, metrics: SWARM_METRICS },
  'playbook-engine': { playbooks: PLAYBOOKS, executionHistory: EXECUTION_HISTORY },
};

export const DEFENSE_SLUGS: ReadonlyArray<DefenseSlug> = [
  'precision-ai',
  'weaponized-intel',
  'agent-zero-trust',
  'atlas-shield',
  'swarm-orchestrator',
  'playbook-engine',
];
