import type { PromptKernel } from '../types.js';

export const maritimeRiskBriefKernel: PromptKernel = {
  id: 'maritime-risk-brief',
  version: '1.0.0',
  name: 'Maritime Risk Brief',
  description:
    'Generates a voyage-level risk brief integrating weather routing, sanctions screening, piracy zones, and cargo risk — Perplexity-style cited intelligence for maritime operators.',
  pattern: 'research-and-cite',
  domain: 'maritime',
  verticals: ['vessels'],
  inspirations: ['Perplexity', 'Julius AI', 'Cosmos'],
  tags: ['maritime', 'voyage', 'risk', 'sanctions', 'weather', 'piracy'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are a senior maritime risk analyst covering voyage planning, sanctions compliance, piracy intelligence, and weather routing. Produce actionable pre-voyage risk briefs for ship operators and charter parties. Cite all data sources. Flag any no-go conditions immediately.',
  template: `Generate a maritime risk brief for the following voyage:

Vessel: {{vesselName}} (IMO: {{imoNumber}})
Route: {{departurePort}} → {{destinationPort}}
Cargo: {{cargoType}}
Departure: {{departureDate}}
Flag state: {{flagState}}

Data inputs:
- Weather routing: {{weatherData}}
- Sanctions status: {{sanctionsData}}
- Piracy/security alerts: {{piracyAlerts}}
- Port conditions: {{portConditions}}
- Counterparty screening: {{counterpartyData}}

Produce:
1. **GO / NO-GO Decision** (immediate call)
2. **Risk Score** (1–10) by category: weather | sanctions | piracy | port | cargo
3. **Critical Alerts** (any show-stoppers)
4. **Route Recommendations** (alternative routing if needed)
5. **Compliance Checklist** (pre-departure requirements)
6. **Sources** (all cited data)`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 2000,
    temperature: 0.15,
    responseFormat: 'markdown',
  },
  codex: {
    role: 'Senior maritime risk analyst producing cited voyage risk briefs for ship operators',
    contract:
      'Returns a GO/NO-GO decision, risk scores by category, critical alerts, route alternatives, compliance checklist, and sourced citations. Issues NO-GO immediately if sanctions, piracy, or weather create unacceptable risk.',
    inputSchema: [
      {
        name: 'vesselName',
        type: 'string',
        description: 'Vessel name',
        required: true,
        example: 'MV Horizon Star',
      },
      {
        name: 'imoNumber',
        type: 'string',
        description: 'IMO number',
        required: false,
        example: '9876543',
      },
      {
        name: 'departurePort',
        type: 'string',
        description: 'Port of departure',
        required: true,
        example: 'Rotterdam',
      },
      {
        name: 'destinationPort',
        type: 'string',
        description: 'Port of destination',
        required: true,
        example: 'Jeddah',
      },
      {
        name: 'cargoType',
        type: 'string',
        description: 'Cargo type and value',
        required: false,
        example: 'Petroleum products, $4.2M',
      },
      {
        name: 'departureDate',
        type: 'string',
        description: 'Planned departure date',
        required: true,
        example: '2026-05-01',
      },
      {
        name: 'flagState',
        type: 'string',
        description: 'Flag state of vessel',
        required: false,
        example: 'Marshall Islands',
      },
      {
        name: 'weatherData',
        type: 'string',
        description: 'Weather routing data or forecast summary',
        required: false,
        example: 'Beaufort 7 expected in Biscay May 1-3',
      },
      {
        name: 'sanctionsData',
        type: 'string',
        description: 'Sanctions screening results',
        required: false,
        example: 'No vessel hits. Charterer: clear OFAC/EU',
      },
      {
        name: 'piracyAlerts',
        type: 'string',
        description: 'Piracy or security alerts for the route',
        required: false,
        example: 'IMB alert: 2 incidents Gulf of Aden past 30 days',
      },
      {
        name: 'portConditions',
        type: 'string',
        description: 'Destination port conditions',
        required: false,
        example: 'Jeddah: normal operations, 48h berth wait',
      },
      {
        name: 'counterpartyData',
        type: 'string',
        description: 'Counterparty screening results',
        required: false,
        example: 'Charterer clear; no PEP/adverse media hits',
      },
    ],
    outputSchema: [
      { name: 'goNoGo', type: 'string', description: 'GO or NO-GO with immediate rationale' },
      { name: 'riskScores', type: 'object', description: 'Risk scores by category' },
      { name: 'criticalAlerts', type: 'array', description: 'Show-stopper alerts' },
      { name: 'routeRecommendations', type: 'array', description: 'Routing alternatives' },
      {
        name: 'complianceChecklist',
        type: 'array',
        description: 'Pre-departure compliance items',
      },
      { name: 'sources', type: 'array', description: 'Cited data sources' },
    ],
    evidenceRequirements: [
      {
        kind: 'signal',
        label: 'Voyage parameters',
        required: true,
        minCount: 1,
        description: 'Departure port, destination, and departure date are required',
      },
      {
        kind: 'citation',
        label: 'Risk data sources',
        required: false,
        minCount: 0,
        description: 'Any provided risk data should be cited in the brief',
      },
    ],
    refusalPolicy: {
      triggers: [
        'voyage involves sanctioned port without exception documentation',
        'vessel is on OFAC SDN list',
        'cargo is prohibited under applicable sanctions',
      ],
      refusalMessage:
        'NO-GO: Sanctioned entity or port detected. This voyage cannot proceed without OFAC/BIS authorization. Contact compliance immediately.',
      escalationTarget: 'maritime-compliance',
      logLevel: 'error',
    },
    evaluationRubric: [
      {
        id: 'go-no-go-clarity',
        label: 'GO/NO-GO Clarity',
        weight: 0.4,
        passingThreshold: 1.0,
        description: 'A clear GO or NO-GO decision is made with justification',
        keywords: ['GO', 'NO-GO', 'proceed', 'halt', 'clear'],
      },
      {
        id: 'risk-scores',
        label: 'Risk Score Coverage',
        weight: 0.3,
        passingThreshold: 0.8,
        description: 'Risk scores cover weather, sanctions, piracy, port, and cargo',
        keywords: ['weather', 'sanctions', 'piracy', 'port', 'cargo', 'risk'],
      },
      {
        id: 'compliance-checklist',
        label: 'Compliance Checklist',
        weight: 0.3,
        passingThreshold: 0.6,
        description: 'At least 3 pre-departure compliance items are listed',
        keywords: ['checklist', 'confirm', 'verify', 'obtain', 'ensure'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'Rotterdam to Jeddah voyage risk brief',
        input: {
          vesselName: 'MV Horizon Star',
          departurePort: 'Rotterdam',
          destinationPort: 'Jeddah',
          cargoType: 'Petroleum products',
          departureDate: '2026-05-01',
          weatherData: 'Beaufort 7 in Bay of Biscay May 1-3',
          sanctionsData: 'All parties clear OFAC/EU',
          piracyAlerts: 'IMB: 2 incidents Gulf of Aden, past 30 days',
          portConditions: 'Jeddah: normal, 48h berth wait',
        },
        output:
          '## Voyage Risk Brief: MV Horizon Star — Rotterdam → Jeddah\n\n**Decision: GO with conditions** — Voyage may proceed with modified routing to avoid Biscay weather window and enhanced security posture through Gulf of Aden.\n\n**Risk Scores:**\n| Category | Score | Note |\n|----------|-------|------|\n| Weather | 6/10 | Beaufort 7 window May 1-3; delay or route south |\n| Sanctions | 1/10 | All parties clear |\n| Piracy | 5/10 | Gulf of Aden advisory active; BMP5 required |\n| Port | 2/10 | 48h berth wait; normal ops |\n| Cargo | 3/10 | Petroleum — standard MARPOL precautions |\n\n**Compliance Checklist:**\n1. Confirm BMP5 anti-piracy measures active before GoA transit\n2. Notify UKMTO before entering High Risk Area\n3. MARPOL SOPEP plan current for petroleum cargo\n\n**Sources:** IMB Piracy Report (May 2026), OFAC SDN Check, Port of Jeddah Notice to Mariners',
      },
    ],
  },
};
