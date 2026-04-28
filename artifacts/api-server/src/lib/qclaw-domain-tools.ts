import type { McpTool } from '@szl-holdings/mcp-client';

export interface QClawToolSchema extends McpTool {
  domainPackage: string;
  clawBenchCategory: string;
}

export const QCLAW_DOMAIN_TOOLS: QClawToolSchema[] = [
  // ─── Sentra (Cyber Resilience) ───────────────────────────────────────────
  {
    name: 'sentra_threat_scan',
    description: 'Run an active threat scan against a host, IP range, or domain. Returns CVE matches, open ports, and risk score.',
    domainPackage: 'sentra',
    clawBenchCategory: 'security',
    approvalClass: 'review',
    domain: ['aegis', 'szl-holdings'],
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'IP address, CIDR range, or FQDN to scan' },
        scanDepth: {
          type: 'string',
          enum: ['surface', 'standard', 'deep'],
          description: 'Scan intensity level',
          default: 'standard',
        },
        includeVulnerabilities: {
          type: 'boolean',
          description: 'Include CVE vulnerability matching in results',
          default: true,
        },
      },
      required: ['target'],
    },
  },
  {
    name: 'sentra_compliance_check',
    description: 'Evaluate an asset or configuration against compliance frameworks (SOC 2, ISO 27001, NIST CSF, CIS Benchmarks).',
    domainPackage: 'sentra',
    clawBenchCategory: 'compliance',
    approvalClass: 'auto',
    domain: ['aegis', 'szl-holdings'],
    inputSchema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', description: 'Asset identifier or configuration reference' },
        frameworks: {
          type: 'array',
          items: { type: 'string', enum: ['SOC2', 'ISO27001', 'NIST_CSF', 'CIS', 'PCI_DSS'] },
          description: 'Compliance frameworks to evaluate against',
        },
        includeRemediation: {
          type: 'boolean',
          description: 'Include remediation guidance in response',
          default: true,
        },
      },
      required: ['assetId', 'frameworks'],
    },
  },
  {
    name: 'sentra_containment',
    description: 'Initiate containment action for a detected threat: isolate host, block IP, or quarantine process.',
    domainPackage: 'sentra',
    clawBenchCategory: 'incident_response',
    approvalClass: 'admin_only',
    domain: ['aegis'],
    inputSchema: {
      type: 'object',
      properties: {
        targetId: { type: 'string', description: 'Host ID, IP address, or process PID to contain' },
        action: {
          type: 'string',
          enum: ['isolate_host', 'block_ip', 'quarantine_process', 'revoke_credentials'],
          description: 'Containment action to execute',
        },
        justification: { type: 'string', description: 'Human-readable justification for the action' },
        durationMinutes: {
          type: 'number',
          description: 'Duration of containment in minutes (0 = permanent until manual release)',
          default: 60,
        },
      },
      required: ['targetId', 'action', 'justification'],
    },
  },

  // ─── Vessels (Maritime Intelligence) ──────────────────────────────────────
  {
    name: 'vessels_fleet_status',
    description: 'Retrieve current fleet status including positions, speeds, headings, and port ETA for monitored vessels.',
    domainPackage: 'vessels',
    clawBenchCategory: 'maritime',
    approvalClass: 'auto',
    domain: ['vessels', 'szl-holdings'],
    inputSchema: {
      type: 'object',
      properties: {
        vesselIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of MMSI or IMO vessel identifiers (empty = all monitored fleet)',
        },
        includeWeather: {
          type: 'boolean',
          description: 'Include current weather conditions at vessel positions',
          default: false,
        },
        includeEta: {
          type: 'boolean',
          description: 'Include port ETA calculations',
          default: true,
        },
      },
      required: [],
    },
  },
  {
    name: 'vessels_ais_lookup',
    description: 'Query real-time AIS position data for a specific vessel by MMSI, IMO number, or vessel name.',
    domainPackage: 'vessels',
    clawBenchCategory: 'maritime',
    approvalClass: 'auto',
    domain: ['vessels'],
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'MMSI number, IMO number, or vessel name' },
        queryType: {
          type: 'string',
          enum: ['mmsi', 'imo', 'name'],
          description: 'Type of identifier provided',
        },
        historyHours: {
          type: 'number',
          description: 'Hours of position history to retrieve (max 72)',
          default: 6,
        },
      },
      required: ['query', 'queryType'],
    },
  },
  {
    name: 'vessels_weather_risk',
    description: 'Assess weather-related risk for a vessel route or position including wave height, wind, visibility, and storm proximity.',
    domainPackage: 'vessels',
    clawBenchCategory: 'maritime',
    approvalClass: 'auto',
    domain: ['vessels'],
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Current or planned position latitude' },
        longitude: { type: 'number', description: 'Current or planned position longitude' },
        forecastHours: {
          type: 'number',
          description: 'Weather forecast horizon in hours',
          default: 24,
        },
        vesselType: {
          type: 'string',
          enum: ['tanker', 'bulk_carrier', 'container', 'general_cargo', 'passenger'],
          description: 'Vessel type for risk calibration',
        },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'vessels_sanctions_check',
    description: 'Screen a vessel, owner, or operator against OFAC, UN, EU, and IMO sanctions lists.',
    domainPackage: 'vessels',
    clawBenchCategory: 'compliance',
    approvalClass: 'auto',
    domain: ['vessels', 'counsel'],
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Vessel name, MMSI, IMO, company name, or person name to screen' },
        lists: {
          type: 'array',
          items: { type: 'string', enum: ['OFAC', 'UN', 'EU', 'IMO', 'HMT'] },
          description: 'Sanctions lists to check (empty = all)',
        },
        fuzzyMatch: {
          type: 'boolean',
          description: 'Enable fuzzy name matching for near-matches',
          default: true,
        },
      },
      required: ['query'],
    },
  },

  // ─── Terra (Real Estate Intelligence) ─────────────────────────────────────
  {
    name: 'terra_property_search',
    description: 'Search for properties by location, asset class, price range, or distress signal indicators.',
    domainPackage: 'terra',
    clawBenchCategory: 'real_estate',
    approvalClass: 'auto',
    domain: ['terra', 'szl-holdings'],
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Address, neighborhood, borough, or zip code' },
        assetClass: {
          type: 'string',
          enum: ['residential', 'commercial', 'industrial', 'mixed_use', 'land'],
          description: 'Property asset class filter',
        },
        maxPriceUsd: { type: 'number', description: 'Maximum price filter in USD' },
        minCapRate: { type: 'number', description: 'Minimum cap rate filter (decimal, e.g. 0.05)' },
        distressOnly: {
          type: 'boolean',
          description: 'Filter to distressed properties only (lis pendens, pre-foreclosure, etc.)',
          default: false,
        },
        limit: { type: 'number', description: 'Maximum number of results', default: 20 },
      },
      required: ['query'],
    },
  },
  {
    name: 'terra_distress_signal',
    description: 'Detect distress signals for a property or portfolio: lis pendens, pre-foreclosure, tax liens, delinquency.',
    domainPackage: 'terra',
    clawBenchCategory: 'real_estate',
    approvalClass: 'auto',
    domain: ['terra'],
    inputSchema: {
      type: 'object',
      properties: {
        propertyIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of property identifiers (BBL, APN, or address)',
        },
        signalTypes: {
          type: 'array',
          items: { type: 'string', enum: ['lis_pendens', 'tax_lien', 'foreclosure', 'delinquency', 'vacancy'] },
          description: 'Types of distress signals to detect (empty = all)',
        },
      },
      required: ['propertyIds'],
    },
  },
  {
    name: 'terra_ownership_trace',
    description: 'Trace property ownership chain, related entities, and beneficial ownership through LLC structures.',
    domainPackage: 'terra',
    clawBenchCategory: 'real_estate',
    approvalClass: 'review',
    domain: ['terra', 'counsel'],
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string', description: 'Property identifier (BBL, APN, or full address)' },
        depth: {
          type: 'number',
          description: 'Ownership chain depth to trace (1 = direct owner, 3+ = beneficial owner)',
          default: 2,
        },
        includeRelatedEntities: {
          type: 'boolean',
          description: 'Include related entities (parent companies, subsidiaries, affiliates)',
          default: true,
        },
      },
      required: ['propertyId'],
    },
  },

  // ─── Counsel (Legal Matter Command) ────────────────────────────────────────
  {
    name: 'counsel_case_lookup',
    description: 'Look up a legal matter by case number, client name, or matter type. Returns status, key dates, and assigned counsel.',
    domainPackage: 'counsel',
    clawBenchCategory: 'legal',
    approvalClass: 'auto',
    domain: ['counsel', 'szl-holdings'],
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Case number, client name, matter title, or docket reference' },
        status: {
          type: 'string',
          enum: ['active', 'closed', 'pending', 'all'],
          description: 'Matter status filter',
          default: 'all',
        },
        matterType: {
          type: 'string',
          enum: ['litigation', 'corporate', 'real_estate', 'regulatory', 'employment', 'ip'],
          description: 'Matter type filter',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'counsel_legal_review',
    description: 'Request an AI-assisted legal review of a contract, clause, or regulatory question. Returns risk flags and recommendations.',
    domainPackage: 'counsel',
    clawBenchCategory: 'legal',
    approvalClass: 'review',
    domain: ['counsel'],
    inputSchema: {
      type: 'object',
      properties: {
        documentText: { type: 'string', description: 'Contract text or legal document excerpt to review' },
        reviewType: {
          type: 'string',
          enum: ['contract_risk', 'regulatory_compliance', 'clause_analysis', 'jurisdiction_check'],
          description: 'Type of legal review to perform',
        },
        jurisdiction: { type: 'string', description: 'Applicable jurisdiction (e.g., "New York", "Federal", "EU")' },
        urgency: {
          type: 'string',
          enum: ['routine', 'expedited', 'emergency'],
          description: 'Review urgency level',
          default: 'routine',
        },
      },
      required: ['documentText', 'reviewType'],
    },
  },
  {
    name: 'counsel_matter_status',
    description: 'Get the current status and timeline of an active legal matter including upcoming deadlines and milestones.',
    domainPackage: 'counsel',
    clawBenchCategory: 'legal',
    approvalClass: 'auto',
    domain: ['counsel'],
    inputSchema: {
      type: 'object',
      properties: {
        matterId: { type: 'string', description: 'Legal matter or case identifier' },
        includeBilling: {
          type: 'boolean',
          description: 'Include billing summary in response',
          default: false,
        },
        includeDeadlines: {
          type: 'boolean',
          description: 'Include upcoming deadline calendar',
          default: true,
        },
      },
      required: ['matterId'],
    },
  },

  // ─── Aegis (Intel Briefing) ────────────────────────────────────────────────
  {
    name: 'aegis_intel_briefing',
    description: 'Generate an intelligence briefing on a geopolitical situation, threat actor, or regional risk scenario.',
    domainPackage: 'aegis',
    clawBenchCategory: 'intelligence',
    approvalClass: 'auto',
    domain: ['aegis', 'szl-holdings'],
    inputSchema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Briefing subject: country, threat actor, region, or topic' },
        focusAreas: {
          type: 'array',
          items: { type: 'string', enum: ['geopolitical', 'cyber', 'maritime', 'financial', 'physical'] },
          description: 'Intelligence focus areas to include',
        },
        classificationLevel: {
          type: 'string',
          enum: ['open_source', 'business_sensitive', 'restricted'],
          description: 'Maximum source classification to use',
          default: 'business_sensitive',
        },
        timeframeHours: {
          type: 'number',
          description: 'Intelligence lookback window in hours',
          default: 24,
        },
      },
      required: ['subject'],
    },
  },
  {
    name: 'aegis_exposure_analysis',
    description: 'Analyze SZL portfolio exposure to a specific threat, region, or risk factor across all domains.',
    domainPackage: 'aegis',
    clawBenchCategory: 'intelligence',
    approvalClass: 'review',
    domain: ['aegis', 'szl-holdings'],
    inputSchema: {
      type: 'object',
      properties: {
        threatVector: { type: 'string', description: 'Threat vector or risk factor to analyze exposure for' },
        domains: {
          type: 'array',
          items: { type: 'string', enum: ['vessels', 'terra', 'counsel', 'sentra', 'lyte', 'all'] },
          description: 'Domains to assess for exposure',
          default: ['all'],
        },
        includeHedging: {
          type: 'boolean',
          description: 'Include hedging and mitigation recommendations',
          default: true,
        },
      },
      required: ['threatVector'],
    },
  },

  // ─── Lyte (Decision Intelligence) ─────────────────────────────────────────
  {
    name: 'lyte_health_check',
    description: 'Retrieve current platform health metrics, SLA status, and operational KPIs across the SZL system.',
    domainPackage: 'lyte',
    clawBenchCategory: 'operations',
    approvalClass: 'auto',
    domain: ['lyte', 'szl-holdings'],
    inputSchema: {
      type: 'object',
      properties: {
        domains: {
          type: 'array',
          items: { type: 'string', enum: ['sentra', 'vessels', 'terra', 'counsel', 'aegis', 'all'] },
          description: 'Domains to retrieve health for',
          default: ['all'],
        },
        includeAiMetrics: {
          type: 'boolean',
          description: 'Include AI inference and governance metrics',
          default: true,
        },
      },
      required: [],
    },
  },
  {
    name: 'lyte_executive_summary',
    description: 'Generate an executive summary of platform performance, key decisions made, and alerts requiring attention.',
    domainPackage: 'lyte',
    clawBenchCategory: 'operations',
    approvalClass: 'auto',
    domain: ['lyte', 'szl-holdings'],
    inputSchema: {
      type: 'object',
      properties: {
        windowHours: {
          type: 'number',
          description: 'Summary window in hours',
          default: 24,
        },
        audience: {
          type: 'string',
          enum: ['ceo', 'cto', 'ciso', 'board', 'operations'],
          description: 'Target audience for tone and depth calibration',
          default: 'ceo',
        },
        includeForecasts: {
          type: 'boolean',
          description: 'Include 7-day forward-looking signals',
          default: true,
        },
      },
      required: [],
    },
  },
  {
    name: 'lyte_alert_triage',
    description: 'Triage and prioritize a queue of cross-domain alerts, grouping related events and ranking by severity.',
    domainPackage: 'lyte',
    clawBenchCategory: 'operations',
    approvalClass: 'auto',
    domain: ['lyte'],
    inputSchema: {
      type: 'object',
      properties: {
        alertIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Alert identifiers to triage (empty = all active alerts)',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum alerts to return after triage',
          default: 25,
        },
        groupRelated: {
          type: 'boolean',
          description: 'Group related alerts into incident clusters',
          default: true,
        },
      },
      required: [],
    },
  },
];

export const QCLAW_TOOL_REGISTRY = new Map<string, QClawToolSchema>(
  QCLAW_DOMAIN_TOOLS.map((tool) => [tool.name, tool]),
);

export function getQClawToolsForDomain(domain: string): QClawToolSchema[] {
  return QCLAW_DOMAIN_TOOLS.filter((t) => t.domainPackage === domain);
}

export function getQClawToolSchema(toolName: string): QClawToolSchema | undefined {
  return QCLAW_TOOL_REGISTRY.get(toolName);
}

export function getAllQClawToolNames(): string[] {
  return QCLAW_DOMAIN_TOOLS.map((t) => t.name);
}
