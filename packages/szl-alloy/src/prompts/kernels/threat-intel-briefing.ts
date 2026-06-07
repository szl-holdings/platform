import type { PromptKernel } from '../types.js';

export const threatIntelBriefingKernel: PromptKernel = {
  id: 'threat-intel-briefing',
  version: '1.0.0',
  name: 'Threat Intelligence Briefing',
  description:
    'Generates a TLP-classified threat intelligence briefing from IoC feeds and incident signals — Perplexity-style citation with MITRE ATT&CK mapping.',
  pattern: 'research-and-cite',
  domain: 'cybersecurity',
  verticals: ['sentra', 'aegis'],
  inspirations: ['Perplexity', 'Claude Cowork'],
  tags: ['threat-intel', 'cybersecurity', 'mitre', 'ioc', 'briefing', 'tlp'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are a Tier 3 threat intelligence analyst. Produce concise, actionable threat briefings following industry standards (TLP, MITRE ATT&CK, STIX). Every claim must cite a source. Separate confirmed TTPs from unconfirmed hypotheses. Prioritize by impact to the specified asset class.',
  template: `Generate a threat intelligence briefing:

Classification: {{tlpLevel}}
Asset class under threat: {{assetClass}}
Time window: {{timeWindow}}
Threat actor (if known): {{threatActor}}

IoC feed:
{{iocFeed}}

Recent incident signals:
{{incidentSignals}}

Additional intelligence:
{{additionalIntel}}

Produce:
1. **TLP Header** (classification notice)
2. **Threat Summary** (2 sentences, highest severity first)
3. **Confirmed TTPs** (MITRE ATT&CK IDs with evidence citations)
4. **Active IoCs** (table: indicator | type | severity | source | last seen)
5. **Recommended Detections** (detection rules or monitoring actions)
6. **Confidence Assessment** (HIGH/MEDIUM/LOW + evidence quality note)`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 2000,
    temperature: 0.15,
    responseFormat: 'markdown',
  },
  codex: {
    role: 'Tier 3 threat intelligence analyst producing TLP-classified, MITRE ATT&CK-mapped briefings',
    contract:
      'Returns a TLP-classified briefing with confirmed TTPs (MITRE IDs), IoC table, detection recommendations, and confidence assessment. Every factual claim is cited. Unconfirmed intel is marked as HYPOTHESIS.',
    inputSchema: [
      {
        name: 'tlpLevel',
        type: 'string',
        description: 'TLP classification: WHITE | GREEN | AMBER | RED',
        required: true,
        example: 'AMBER',
      },
      {
        name: 'assetClass',
        type: 'string',
        description: 'Primary asset class being defended',
        required: true,
        example: 'OT/ICS networks in energy sector',
      },
      {
        name: 'timeWindow',
        type: 'string',
        description: 'Intelligence time window',
        required: true,
        example: 'Last 72 hours',
      },
      {
        name: 'threatActor',
        type: 'string',
        description: 'Threat actor if known, or "Unknown"',
        required: false,
        example: 'Volt Typhoon',
      },
      {
        name: 'iocFeed',
        type: 'array',
        description: 'Array of IoC objects with indicator, type, and source',
        required: false,
        example: '[{"indicator": "45.227.252.12", "type": "IPv4", "source": "CISA AA26-010"}]',
      },
      {
        name: 'incidentSignals',
        type: 'string',
        description: 'Recent incident or alert signals',
        required: false,
        example: 'Three VPN probing attempts on perimeter in last 6 hours',
      },
      {
        name: 'additionalIntel',
        type: 'string',
        description: 'Open-source or vendor intelligence to incorporate',
        required: false,
        example: 'CISA advisory AA26-010A published today',
      },
    ],
    outputSchema: [
      { name: 'tlpHeader', type: 'string', description: 'TLP classification header' },
      { name: 'threatSummary', type: 'string', description: '2-sentence threat summary' },
      {
        name: 'confirmedTtps',
        type: 'array',
        description: 'MITRE ATT&CK IDs with citations',
      },
      {
        name: 'activeIocs',
        type: 'array',
        description: 'IoC table with type, severity, source, last seen',
      },
      {
        name: 'recommendedDetections',
        type: 'array',
        description: 'Detection rules or monitoring actions',
      },
      { name: 'confidenceAssessment', type: 'string', description: 'Confidence level with rationale' },
    ],
    evidenceRequirements: [
      {
        kind: 'citation',
        label: 'Intelligence sources',
        required: true,
        minCount: 1,
        description: 'At least one intelligence source must be cited',
      },
      {
        kind: 'signal',
        label: 'IoC or incident signals',
        required: false,
        minCount: 0,
        description: 'IoC feed or incident signals strengthen the briefing',
      },
    ],
    refusalPolicy: {
      triggers: [
        'TLP RED content requested without authorization token',
        'request to identify specific individuals as threat actors without evidence',
        'request to publish threat intel without classification header',
      ],
      refusalMessage:
        'Cannot generate TLP RED briefings without authorization. All threat intel must include TLP classification. Unsubstantiated attribution claims are prohibited.',
      escalationTarget: 'intel-review-board',
      logLevel: 'error',
    },
    evaluationRubric: [
      {
        id: 'mitre-mapping',
        label: 'MITRE ATT&CK Mapping',
        weight: 0.35,
        passingThreshold: 0.7,
        description: 'TTPs are mapped to valid MITRE ATT&CK technique IDs (T####)',
        keywords: ['T1', 'T0', 'ATT&CK', 'technique', 'tactic'],
      },
      {
        id: 'ioc-table',
        label: 'IoC Table Completeness',
        weight: 0.35,
        passingThreshold: 0.75,
        description: 'IoC table includes type, severity, source, and last seen for each indicator',
        keywords: ['indicator', 'severity', 'source', 'last seen', 'IPv4', 'domain'],
      },
      {
        id: 'detection-recommendations',
        label: 'Detection Recommendations',
        weight: 0.3,
        passingThreshold: 0.6,
        description: 'At least 2 concrete detection or mitigation recommendations provided',
        keywords: ['block', 'monitor', 'alert', 'rule', 'detect', 'signature'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'Volt Typhoon ICS threat briefing',
        input: {
          tlpLevel: 'AMBER',
          assetClass: 'OT/ICS networks',
          timeWindow: 'Last 72 hours',
          threatActor: 'Volt Typhoon',
          iocFeed: [{ indicator: '45.227.252.12', type: 'IPv4/C2', source: 'CISA AA26-010A' }],
          incidentSignals: 'Anomalous VPN probing on perimeter firewall',
          additionalIntel: 'CISA AA26-010A: Volt Typhoon pivoting to SOHO router C2 relay nodes',
        },
        output:
          '**TLP: AMBER — Restricted to named recipients and their organizations.**\n\n## Threat Intelligence Briefing: Volt Typhoon — OT/ICS Networks\n\n**Threat Summary:** Volt Typhoon (Chinese state-nexus) is actively targeting OT/ICS environments via SOHO router relay nodes used as C2 infrastructure [CISA AA26-010A]. Three perimeter VPN probing events in the last 72 hours are consistent with Volt Typhoon pre-positioning TTPs.\n\n**Confirmed TTPs:**\n- T1572 (Protocol Tunneling) — SOHO router relay [CISA AA26-010A]\n- T0866 (Exploitation of Remote Services) — perimeter VPN probing [Internal signal]\n\n**Active IoCs:**\n| Indicator | Type | Severity | Source | Last Seen |\n|-----------|------|----------|--------|-----------|\n| 45.227.252.12 | IPv4/C2 | CRITICAL | CISA AA26-010A | <72h |\n\n**Recommended Detections:**\n1. Block 45.227.252.12 at perimeter firewall\n2. Alert on anomalous VPN authentication attempts from SOHO IP ranges\n\n**Confidence:** HIGH — CISA advisory corroborates internal perimeter signals.',
      },
    ],
  },
};
