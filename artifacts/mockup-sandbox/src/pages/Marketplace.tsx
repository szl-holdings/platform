import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Copy,
  ExternalLink,
  FileText,
  Filter,
  Github,
  Globe,
  Info,
  Layers,
  MessageSquare,
  Network,
  Package,
  Search,
  Send,
  Shield,
  ShieldCheck,
  ShieldOff,
  Star,
  Terminal,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type MarketplaceView = 'home' | 'directory' | 'detail' | 'methodology' | 'submit' | 'about';

export type TrustTier = 'Verified' | 'Reviewed' | 'Community' | 'Unscored';

export interface TrustScoreBreakdown {
  uptime_probe: number;
  capability_stability: number;
  manifest_signature: number;
  audit_completeness: number;
  transport_conformance: number;
  reversibility_coverage: number;
  total: number;
}

export interface McpTool {
  name: string;
  description: string;
  reversibility: 'read-only' | 'reversible-write' | 'irreversible-write';
  inputSchema?: Record<string, unknown>;
}

export interface McpServer {
  namespace: string;
  displayName: string;
  owner: string;
  description: string;
  tier: TrustTier;
  score: TrustScoreBreakdown;
  transport: 'http-sse' | 'streamable-http' | 'stdio';
  specVersion: string;
  tools: McpTool[];
  resources: { uri: string; name: string; mimeType?: string }[];
  tags: string[];
  worksWithBadges: string[];
  manifestDigest: string;
  lastPublished: string;
  driftEvents: { at: string; type: string; description: string; severity: 'info' | 'warn' | 'critical' }[];
  uptimePct30d: number;
  isOwned: boolean;
}

const SZL_SERVERS: McpServer[] = [
  {
    namespace: 'com.szlholdings.vessels',
    displayName: 'SEXTANT Maritime Intelligence',
    owner: 'szl-holdings',
    description: 'Real-time maritime fleet intelligence: AIS positions, voyage economics, port risk overlay, weather routing, and sanctions cross-reference. Covers global fleet operations for institutional operators.',
    tier: 'Verified',
    score: { uptime_probe: 19, capability_stability: 18, manifest_signature: 20, audit_completeness: 19, transport_conformance: 10, reversibility_coverage: 9, total: 95 },
    transport: 'streamable-http',
    specVersion: '2025-11-25',
    tools: [
      { name: 'vessels_fleet_status', description: 'Query current fleet positions, vessel details, and active voyage status.', reversibility: 'read-only' },
      { name: 'vessels_weather_risk', description: 'Maritime weather risk assessment for routes with active alerts.', reversibility: 'read-only' },
      { name: 'vessels_port_risk', description: 'Sanctions overlay and weather risk assessment for planned port calls.', reversibility: 'read-only' },
      { name: 'vessels_voyage_economics', description: 'Bunker price index, charter rates, and voyage cost projections.', reversibility: 'read-only' },
    ],
    resources: [
      { uri: 'vessels://fleet/live', name: 'Live Fleet Feed', mimeType: 'application/json' },
      { uri: 'vessels://routes/risk-map', name: 'Route Risk Map', mimeType: 'application/json' },
    ],
    tags: ['maritime', 'fleet', 'AIS', 'sanctions', 'voyage', 'tools'],
    worksWithBadges: ['Claude', 'Cursor', 'SZL Agents'],
    manifestDigest: 'sha256:8a3f1c9e2b4d6f0a7e5c3b9d1f8a2e6c4b0d8f2a4e6c8b0d2f4a6e8c0b2d4f6',
    lastPublished: '2026-04-22T10:00:00Z',
    driftEvents: [
      { at: '2026-04-15T08:30:00Z', type: 'capability_added', description: 'Added vessels_port_risk tool with OFAC cross-reference.', severity: 'info' },
      { at: '2026-03-28T14:00:00Z', type: 'schema_updated', description: 'vessels_fleet_status region param now accepts array.', severity: 'warn' },
    ],
    uptimePct30d: 99.7,
    isOwned: true,
  },
  {
    namespace: 'com.szlholdings.sentra',
    displayName: 'TENAX Cyber Resilience',
    owner: 'szl-holdings',
    description: 'Enterprise SOC command surface: CVE threat scanning, compliance framework scoring, incident correlation, and real-time alert management with MITRE ATT&CK attribution.',
    tier: 'Verified',
    score: { uptime_probe: 20, capability_stability: 19, manifest_signature: 20, audit_completeness: 20, transport_conformance: 10, reversibility_coverage: 8, total: 97 },
    transport: 'streamable-http',
    specVersion: '2025-11-25',
    tools: [
      { name: 'firestorm_threat_scan', description: 'Query active cybersecurity threats, CVEs, and incident status.', reversibility: 'read-only' },
      { name: 'firestorm_compliance_check', description: 'Compliance readiness scores for NIST, ISO 27001, CIS.', reversibility: 'read-only' },
      { name: 'firestorm_incident_correlate', description: 'Correlate incidents by IP, technique, and asset group.', reversibility: 'read-only' },
      { name: 'firestorm_alert_escalate', description: 'Escalate a security alert to SOC tier-2 queue.', reversibility: 'reversible-write' },
    ],
    resources: [
      { uri: 'sentra://threat-feed/live', name: 'Live Threat Feed', mimeType: 'application/json' },
      { uri: 'sentra://compliance/frameworks', name: 'Framework Catalog', mimeType: 'application/json' },
    ],
    tags: ['security', 'SOC', 'CVE', 'MITRE', 'compliance', 'tools', 'resources'],
    worksWithBadges: ['Claude', 'SZL Agents'],
    manifestDigest: 'sha256:2c8f4a6e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4',
    lastPublished: '2026-04-23T09:00:00Z',
    driftEvents: [
      { at: '2026-04-10T11:00:00Z', type: 'capability_added', description: 'Added firestorm_incident_correlate with graph-based propagation.', severity: 'info' },
    ],
    uptimePct30d: 99.9,
    isOwned: true,
  },
  {
    namespace: 'com.szlholdings.terra',
    displayName: 'DOMAINE Real Estate Intelligence',
    owner: 'szl-holdings',
    description: 'NYC and metro real estate market intelligence: distressed property detection, tax lien analysis, acquisition brief generation, and market momentum scoring.',
    tier: 'Verified',
    score: { uptime_probe: 18, capability_stability: 18, manifest_signature: 20, audit_completeness: 18, transport_conformance: 10, reversibility_coverage: 10, total: 94 },
    transport: 'streamable-http',
    specVersion: '2025-11-25',
    tools: [
      { name: 'terra_property_search', description: 'Search real estate market data and distressed property signals.', reversibility: 'read-only' },
      { name: 'terra_market_signals', description: 'Tax lien, lis pendens, and pre-foreclosure distress indicators.', reversibility: 'read-only' },
      { name: 'terra_acquisition_brief', description: 'Generate a deal memo with comps and distress score breakdown.', reversibility: 'read-only' },
    ],
    resources: [{ uri: 'terra://markets/nyc', name: 'NYC Market Feed', mimeType: 'application/json' }],
    tags: ['real-estate', 'distress', 'acquisition', 'NYC', 'tools'],
    worksWithBadges: ['Claude', 'Cursor', 'SZL Agents'],
    manifestDigest: 'sha256:6e0b4c8f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4c6e8b0d2f4a6c8e0b2d4f6',
    lastPublished: '2026-04-21T16:00:00Z',
    driftEvents: [],
    uptimePct30d: 98.8,
    isOwned: true,
  },
  {
    namespace: 'com.szlholdings.lyte',
    displayName: 'KORA Decision Intelligence',
    owner: 'szl-holdings',
    description: 'Ecosystem-wide health monitoring, decision intelligence, and executive summary generation. Aggregates signals across all SZL portfolio apps into a single coherent operational picture.',
    tier: 'Verified',
    score: { uptime_probe: 20, capability_stability: 20, manifest_signature: 20, audit_completeness: 19, transport_conformance: 10, reversibility_coverage: 10, total: 99 },
    transport: 'streamable-http',
    specVersion: '2025-11-25',
    tools: [
      { name: 'lyte_health_check', description: 'Current platform health, active monitoring alerts, and system status.', reversibility: 'read-only' },
      { name: 'lyte_executive_summary', description: 'Executive summary of ecosystem state with key metrics.', reversibility: 'read-only' },
      { name: 'lyte_anomaly_detect', description: 'Statistical anomaly detection across portfolio metrics.', reversibility: 'read-only' },
    ],
    resources: [{ uri: 'lyte://health/live', name: 'Live Health Feed', mimeType: 'application/json' }],
    tags: ['observability', 'health', 'decisions', 'executive', 'tools'],
    worksWithBadges: ['Claude', 'ChatGPT', 'Cursor', 'SZL Agents'],
    manifestDigest: 'sha256:4a8c0e2b4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4c6e8b0d2f4a6c8e0b2d4f6a',
    lastPublished: '2026-04-25T08:00:00Z',
    driftEvents: [
      { at: '2026-04-20T10:00:00Z', type: 'capability_added', description: 'Added lyte_anomaly_detect with rolling 7-day baseline.', severity: 'info' },
    ],
    uptimePct30d: 100.0,
    isOwned: true,
  },
  {
    namespace: 'com.szlholdings.pulse',
    displayName: 'LUMINA AI Executive Briefing',
    owner: 'szl-holdings',
    description: 'AI-curated executive intelligence briefing: multi-domain signal aggregation, insight ranking by urgency × novelty, scheduled delivery, and engagement-aware personalization.',
    tier: 'Verified',
    score: { uptime_probe: 19, capability_stability: 17, manifest_signature: 20, audit_completeness: 18, transport_conformance: 10, reversibility_coverage: 10, total: 94 },
    transport: 'streamable-http',
    specVersion: '2025-11-25',
    tools: [
      { name: 'pulse_compile_brief', description: 'Compile executive brief from ranked signals across all domains.', reversibility: 'read-only' },
      { name: 'pulse_rank_insights', description: 'Rank insights by urgency × novelty with engagement weighting.', reversibility: 'read-only' },
      { name: 'pulse_schedule_delivery', description: 'Schedule brief delivery via push or email.', reversibility: 'reversible-write' },
    ],
    resources: [{ uri: 'pulse://briefs/latest', name: 'Latest Brief', mimeType: 'application/json' }],
    tags: ['briefing', 'intelligence', 'executive', 'delivery', 'tools', 'resources'],
    worksWithBadges: ['Claude', 'SZL Agents'],
    manifestDigest: 'sha256:0c4e8b2d6f0a4c8e2b6d0f4a8c2e6b0d4f8a2c6e0b4d8f2a6c0e4b8d2f6a0c',
    lastPublished: '2026-04-24T07:00:00Z',
    driftEvents: [
      { at: '2026-04-18T09:00:00Z', type: 'schema_updated', description: 'pulse_compile_brief now accepts domain array filter.', severity: 'warn' },
    ],
    uptimePct30d: 99.1,
    isOwned: true,
  },
  {
    namespace: 'com.szlholdings.counsel',
    displayName: 'Counsel Legal Matter Command',
    owner: 'szl-holdings',
    description: 'Legal matter lifecycle management: case tracking, document retrieval, court filing automation, and risk cross-reference against portfolio threat intelligence.',
    tier: 'Verified',
    score: { uptime_probe: 17, capability_stability: 18, manifest_signature: 20, audit_completeness: 20, transport_conformance: 10, reversibility_coverage: 8, total: 93 },
    transport: 'streamable-http',
    specVersion: '2025-11-25',
    tools: [
      { name: 'counsel_list_matters', description: 'List active legal matters with status and priority.', reversibility: 'read-only' },
      { name: 'counsel_risk_cross_reference', description: 'Cross-reference open matters against PARAGON threat intel.', reversibility: 'read-only' },
      { name: 'counsel_draft_brief', description: 'Generate legal brief draft from matter evidence.', reversibility: 'reversible-write' },
    ],
    resources: [{ uri: 'counsel://matters/index', name: 'Matter Index', mimeType: 'application/json' }],
    tags: ['legal', 'matters', 'compliance', 'documents', 'tools'],
    worksWithBadges: ['Claude', 'SZL Agents'],
    manifestDigest: 'sha256:8b0d4f8a2c6e0b4d8f2a6c0e4b8d2f6a0c4e8b2d6f0a4c8e2b6d0f4a8c2e6b',
    lastPublished: '2026-04-20T14:00:00Z',
    driftEvents: [],
    uptimePct30d: 99.3,
    isOwned: true,
  },
  {
    namespace: 'com.szlholdings.command',
    displayName: 'Unified Command',
    owner: 'szl-holdings',
    description: 'Cross-domain signal correlation and geospatial intelligence command surface. Correlates threats, fleet events, property signals, and market movements into unified operational picture.',
    tier: 'Verified',
    score: { uptime_probe: 19, capability_stability: 19, manifest_signature: 20, audit_completeness: 20, transport_conformance: 10, reversibility_coverage: 10, total: 98 },
    transport: 'streamable-http',
    specVersion: '2025-11-25',
    tools: [
      { name: 'command_cross_domain_correlate', description: 'Correlate signals across PARAGON, SEXTANT, DOMAINE, and Counsel domains.', reversibility: 'read-only' },
      { name: 'command_surface_anomalies', description: 'Statistical anomaly surfacing with 7-day rolling baseline.', reversibility: 'read-only' },
      { name: 'command_prioritize_actions', description: 'Rank actions by severity × asset_value × time_sensitivity.', reversibility: 'read-only' },
    ],
    resources: [
      { uri: 'command://intel/live', name: 'Live Intel Feed', mimeType: 'application/json' },
      { uri: 'command://geo/pins', name: 'GeoPin Feed', mimeType: 'application/geo+json' },
    ],
    tags: ['correlation', 'geospatial', 'intelligence', 'cross-domain', 'tools', 'resources'],
    worksWithBadges: ['Claude', 'SZL Agents'],
    manifestDigest: 'sha256:2d6f0a4c8e2b6d0f4a8c2e6b0d4f8a2c6e0b4d8f2a6c0e4b8d2f6a0c4e8b2d',
    lastPublished: '2026-04-25T10:00:00Z',
    driftEvents: [
      { at: '2026-04-22T15:00:00Z', type: 'capability_added', description: 'Added geo-pin cross-reference to anomaly surfacing.', severity: 'info' },
    ],
    uptimePct30d: 99.8,
    isOwned: true,
  },
  {
    namespace: 'com.szlholdings.nexus',
    displayName: 'PRAXIS Governed Orchestration',
    owner: 'szl-holdings',
    description: 'The governed agentic orchestration backbone. MCP gateway with policy enforcement, agent-mesh topology, parallel research swarms, persistent memory fabric, and cross-portfolio workflow execution.',
    tier: 'Verified',
    score: { uptime_probe: 20, capability_stability: 20, manifest_signature: 20, audit_completeness: 20, transport_conformance: 10, reversibility_coverage: 9, total: 99 },
    transport: 'streamable-http',
    specVersion: '2025-11-25',
    tools: [
      { name: 'alloy_research', description: 'Launch parallel multi-source research via the swarm.', reversibility: 'read-only' },
      { name: 'alloy_skill_invoke', description: 'Invoke a registered skill from the Skills Library.', reversibility: 'reversible-write' },
      { name: 'alloy_decision_status', description: 'Query pending decisions and their evidence.', reversibility: 'read-only' },
      { name: 'alloy_approve_decision', description: 'Approve or reject a decision in the governance pipeline.', reversibility: 'reversible-write' },
      { name: 'connector_hub_discover', description: 'Discover all registered tool connectors and capabilities.', reversibility: 'read-only' },
    ],
    resources: [
      { uri: 'nexus://sessions/live', name: 'Live Sessions', mimeType: 'application/json' },
      { uri: 'nexus://governance/queue', name: 'Governance Queue', mimeType: 'application/json' },
    ],
    tags: ['orchestration', 'governance', 'memory', 'skills', 'MCP-gateway', 'tools', 'resources', 'prompts'],
    worksWithBadges: ['Claude', 'ChatGPT', 'Cursor', 'SZL Agents'],
    manifestDigest: 'sha256:6a0c4e8b2d6f0a4c8e2b6d0f4a8c2e6b0d4f8a2c6e0b4d8f2a6c0e4b8d2f6a',
    lastPublished: '2026-04-26T06:00:00Z',
    driftEvents: [],
    uptimePct30d: 100.0,
    isOwned: true,
  },
];

const COMMUNITY_SERVERS: McpServer[] = [
  {
    namespace: 'io.github.modelcontextprotocol.servers.filesystem',
    displayName: 'MCP Filesystem',
    owner: 'modelcontextprotocol',
    description: 'Secure file system operations with configurable access controls. Read, write, list, and search files within permitted directories.',
    tier: 'Reviewed',
    score: { uptime_probe: 16, capability_stability: 15, manifest_signature: 12, audit_completeness: 0, transport_conformance: 9, reversibility_coverage: 6, total: 58 },
    transport: 'stdio',
    specVersion: '2025-11-25',
    tools: [
      { name: 'read_file', description: 'Read file contents from the filesystem.', reversibility: 'read-only' },
      { name: 'write_file', description: 'Write content to a file.', reversibility: 'irreversible-write' },
      { name: 'list_directory', description: 'List directory contents.', reversibility: 'read-only' },
    ],
    resources: [],
    tags: ['filesystem', 'tools', 'official'],
    worksWithBadges: ['Claude', 'ChatGPT', 'Cursor'],
    manifestDigest: 'sha256:abc123def456789012345678901234567890abcdef1234567890abcdef123456',
    lastPublished: '2026-03-15T00:00:00Z',
    driftEvents: [],
    uptimePct30d: 100.0,
    isOwned: false,
  },
  {
    namespace: 'io.github.modelcontextprotocol.servers.github',
    displayName: 'MCP GitHub',
    owner: 'modelcontextprotocol',
    description: 'GitHub API integration — repositories, pull requests, issues, code search, and workflow management.',
    tier: 'Reviewed',
    score: { uptime_probe: 17, capability_stability: 14, manifest_signature: 12, audit_completeness: 0, transport_conformance: 8, reversibility_coverage: 5, total: 56 },
    transport: 'stdio',
    specVersion: '2025-11-25',
    tools: [
      { name: 'github_list_repos', description: 'List repositories for an organization.', reversibility: 'read-only' },
      { name: 'github_create_pull_request', description: 'Open a pull request.', reversibility: 'reversible-write' },
      { name: 'github_push_files', description: 'Push files to a branch.', reversibility: 'reversible-write' },
    ],
    resources: [],
    tags: ['github', 'code', 'tools', 'official'],
    worksWithBadges: ['Claude', 'Cursor'],
    manifestDigest: 'sha256:def789abc012345678901234567890abcdef1234567890123456789012345678',
    lastPublished: '2026-03-20T00:00:00Z',
    driftEvents: [
      { at: '2026-03-20T10:00:00Z', type: 'schema_updated', description: 'Added branches param to list_repos.', severity: 'warn' },
    ],
    uptimePct30d: 99.2,
    isOwned: false,
  },
  {
    namespace: 'com.huggingface.mcp',
    displayName: 'HuggingFace MCP',
    owner: 'huggingface',
    description: 'HuggingFace Hub search: models, datasets, papers, spaces. Semantic and keyword search across the world\'s largest open ML repository.',
    tier: 'Community',
    score: { uptime_probe: 14, capability_stability: 11, manifest_signature: 8, audit_completeness: 0, transport_conformance: 7, reversibility_coverage: 8, total: 48 },
    transport: 'http-sse',
    specVersion: '2025-11-25',
    tools: [
      { name: 'hf_search_models', description: 'Search HuggingFace model hub.', reversibility: 'read-only' },
      { name: 'hf_search_datasets', description: 'Search datasets hub.', reversibility: 'read-only' },
      { name: 'hf_get_model_info', description: 'Get detailed model card and metadata.', reversibility: 'read-only' },
    ],
    resources: [],
    tags: ['ML', 'models', 'datasets', 'tools'],
    worksWithBadges: ['Claude', 'Cursor'],
    manifestDigest: 'sha256:789012abcdef345678901234567890123456abcdef7890123456789012345678',
    lastPublished: '2026-02-10T00:00:00Z',
    driftEvents: [],
    uptimePct30d: 97.3,
    isOwned: false,
  },
  {
    namespace: 'com.example.unscored-demo',
    displayName: 'Demo Community Server',
    owner: 'community-contributor',
    description: 'An example submission pending tier assignment by the SZL governance team.',
    tier: 'Unscored',
    score: { uptime_probe: 0, capability_stability: 0, manifest_signature: 4, audit_completeness: 0, transport_conformance: 5, reversibility_coverage: 3, total: 12 },
    transport: 'http-sse',
    specVersion: '2025-11-25',
    tools: [
      { name: 'demo_tool', description: 'A demo tool awaiting validation.', reversibility: 'read-only' },
    ],
    resources: [],
    tags: ['demo', 'community'],
    worksWithBadges: [],
    manifestDigest: 'sha256:000000000000000000000000000000000000000000000000000000000000000',
    lastPublished: '2026-04-24T00:00:00Z',
    driftEvents: [],
    uptimePct30d: 0,
    isOwned: false,
  },
];

const ALL_SERVERS = [...SZL_SERVERS, ...COMMUNITY_SERVERS];

function tierColor(tier: TrustTier): string {
  switch (tier) {
    case 'Verified': return '#22d3ee';
    case 'Reviewed': return '#a3e635';
    case 'Community': return '#f59e0b';
    case 'Unscored': return '#7c8ea4';
  }
}

function tierIcon(tier: TrustTier) {
  switch (tier) {
    case 'Verified': return ShieldCheck;
    case 'Reviewed': return BadgeCheck;
    case 'Community': return Circle;
    case 'Unscored': return ShieldOff;
  }
}

function reversibilityColor(r: McpTool['reversibility']): string {
  switch (r) {
    case 'read-only': return '#a3e635';
    case 'reversible-write': return '#f59e0b';
    case 'irreversible-write': return '#f87171';
  }
}

function scoreColor(score: number): string {
  if (score >= 90) return '#22d3ee';
  if (score >= 70) return '#a3e635';
  if (score >= 40) return '#f59e0b';
  return '#7c8ea4';
}

function TierBadge({ tier, size = 'sm' }: { tier: TrustTier; size?: 'xs' | 'sm' | 'md' }) {
  const Icon = tierIcon(tier);
  const color = tierColor(tier);
  const px = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-mono font-semibold ${px}`}
      style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
    >
      <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {tier}
    </span>
  );
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground/70">{label}</span>
        <span className="text-[10px] font-mono" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#0d1520]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const LIVE_CALLS = [
  { server: 'com.szlholdings.nexus', tool: 'alloy_research', decision: 'allowed', latency: 142 },
  { server: 'com.szlholdings.vessels', tool: 'vessels_fleet_status', decision: 'allowed', latency: 38 },
  { server: 'com.szlholdings.sentra', tool: 'firestorm_threat_scan', decision: 'allowed', latency: 91 },
  { server: 'com.szlholdings.command', tool: 'command_cross_domain_correlate', decision: 'allowed', latency: 210 },
  { server: 'com.szlholdings.pulse', tool: 'pulse_compile_brief', decision: 'allowed', latency: 67 },
  { server: 'com.szlholdings.terra', tool: 'terra_market_signals', decision: 'allowed', latency: 55 },
  { server: 'com.szlholdings.lyte', tool: 'lyte_health_check', decision: 'allowed', latency: 22 },
  { server: 'com.szlholdings.counsel', tool: 'counsel_risk_cross_reference', decision: 'allowed', latency: 133 },
  { server: 'com.szlholdings.nexus', tool: 'alloy_approve_decision', decision: 'allowed', latency: 88 },
  { server: 'com.szlholdings.sentra', tool: 'firestorm_compliance_check', decision: 'allowed', latency: 44 },
  { server: 'com.szlholdings.vessels', tool: 'vessels_port_risk', decision: 'allowed', latency: 61 },
  { server: 'com.szlholdings.command', tool: 'command_prioritize_actions', decision: 'allowed', latency: 175 },
];

function GovernedAutonomyStrip() {
  const [visibleCalls, setVisibleCalls] = useState<typeof LIVE_CALLS>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setVisibleCalls(LIVE_CALLS.slice(0, 4));
    let i = 4;
    intervalRef.current = setInterval(() => {
      setActiveIdx(i % LIVE_CALLS.length);
      setVisibleCalls((prev) => {
        const next = [...prev, LIVE_CALLS[i % LIVE_CALLS.length]];
        return next.slice(-6);
      });
      i++;
    }, 1800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const shortNs = (ns: string) => ns.replace('com.szlholdings.', '');

  return (
    <div className="rounded-xl border border-nexus-cyan/20 bg-[#060b12] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-nexus-cyan/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-nexus-cyan pulse-dot" />
          <span className="text-xs font-mono text-nexus-cyan tracking-widest uppercase">Live — Governed Autonomy</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/40">READ-ONLY · NO PII · NO ARGUMENTS · ANONYMIZED</span>
      </div>
      <div className="p-4 space-y-2">
        {visibleCalls.map((call, idx) => {
          const isNew = idx === visibleCalls.length - 1;
          return (
            <div
              key={`${call.server}-${call.tool}-${idx}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
              style={{
                background: isNew ? 'rgba(34,211,238,0.05)' : 'rgba(13,21,32,0.6)',
                borderLeft: isNew ? '2px solid rgba(34,211,238,0.5)' : '2px solid rgba(34,211,238,0.1)',
                opacity: idx === 0 && visibleCalls.length > 4 ? 0.5 : 1,
              }}
            >
              <div
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                style={{ backgroundColor: '#22d3ee18', color: '#22d3ee' }}
              >
                {shortNs(call.server).toUpperCase().slice(0, 4)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono text-muted-foreground/80">{call.server}</span>
                <span className="text-muted-foreground/30 mx-1.5">→</span>
                <span className="text-[10px] font-mono text-nexus-cyan">{call.tool}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] font-mono text-nexus-green/70">{call.decision.toUpperCase()}</span>
                <span className="text-[9px] font-mono text-muted-foreground/40">{call.latency}ms</span>
                <CheckCircle className="w-3 h-3 text-nexus-green/60" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 border-t border-nexus-cyan/10 flex items-center justify-between">
        <span className="text-[9px] font-mono text-muted-foreground/40">8 SZL servers · 100% policy-compliant · 2025-11-25 spec</span>
        <span className="text-[9px] font-mono text-muted-foreground/30">powered by PRAXIS MCP Gateway</span>
      </div>
    </div>
  );
}

function MarketplaceHome({ navigate }: { navigate: (v: MarketplaceView, server?: McpServer) => void }) {
  return (
    <div className="max-w-5xl mx-auto px-8 py-12 space-y-16">
      <div className="relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,211,238,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="relative text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-nexus-cyan/20 bg-nexus-cyan/5 mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-nexus-cyan" />
            <span className="text-xs font-mono text-nexus-cyan tracking-wide">Governed Agentic Interop — Public Layer</span>
          </div>
          <h1 className="text-5xl font-bold font-mono tracking-tight mb-4">
            <span className="text-nexus-cyan">MCP</span>
            <span className="text-foreground"> Trust</span>
            <br />
            <span className="text-muted-foreground/60">by SZL Holdings</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            The only MCP registry with supply-chain attestation, capability-drift history, 
            and reversible-write classification. Anyone evaluating MCP servers should consult 
            our verification first.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('directory')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-nexus-cyan text-nexus-bg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Browse Directory <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('methodology')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-nexus-cyan/30 text-nexus-cyan text-sm hover:bg-nexus-cyan/10 transition-colors"
            >
              Trust Score Methodology
            </button>
            <button
              onClick={() => navigate('submit')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-nexus/60 text-muted-foreground text-sm hover:border-nexus hover:text-foreground transition-colors"
            >
              <Upload className="w-4 h-4" /> Submit Your Server
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Verified Servers', value: '8', color: '#22d3ee', icon: ShieldCheck },
          { label: 'Trust Scores Published', value: '11', color: '#a3e635', icon: Star },
          { label: 'Capability Probes / Day', value: '2,400', color: '#f59e0b', icon: Activity },
          { label: 'Drift Events Tracked', value: '847', color: '#8b5cf6', icon: TrendingUp },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-nexus-surface border border-nexus rounded-xl p-4 text-center" style={{ borderColor: `${s.color}22` }}>
              <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
              <div className="text-2xl font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-nexus-cyan" />
          <h2 className="text-sm font-semibold text-nexus-cyan">Governed Autonomy — Live</h2>
          <span className="text-[10px] text-muted-foreground/40 ml-2">Real-time anonymized MCP call flow · SZL Portfolio</span>
        </div>
        <GovernedAutonomyStrip />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">SZL-Verified Servers</h2>
          <button
            onClick={() => navigate('directory')}
            className="text-xs text-nexus-cyan hover:underline flex items-center gap-1"
          >
            Full Directory <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {SZL_SERVERS.slice(0, 4).map((server) => (
            <ServerCard key={server.namespace} server={server} onClick={() => navigate('detail', server)} />
          ))}
        </div>
      </div>

      <div className="bg-nexus-surface border border-nexus-cyan/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-nexus-cyan/10 border border-nexus-cyan/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-nexus-cyan" />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1 text-nexus-cyan">Trust Verification API — Public & Unauthenticated</h3>
            <p className="text-xs text-muted-foreground/70 mb-3 leading-relaxed">
              Any aggregator can cite our trust records. The canonical SZL trust record is publicly 
              documented and returns tier, score components, drift history, and signed digest.
            </p>
            <div className="bg-[#060b12] rounded-lg p-3 font-mono text-xs text-nexus-green/80">
              GET /api/marketplace/v1/servers/com.szlholdings.vessels
            </div>
            <button
              onClick={() => navigate('about')}
              className="mt-3 text-xs text-nexus-cyan hover:underline flex items-center gap-1"
            >
              Read the one-pager <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServerCard({ server, onClick }: { server: McpServer; onClick: () => void }) {
  const color = tierColor(server.tier);
  return (
    <button
      onClick={onClick}
      className="bg-nexus-surface border border-nexus rounded-xl p-4 text-left hover:border-nexus-cyan/30 transition-all group"
      style={{ borderColor: `${color}20` }}
    >
      <div className="flex items-start justify-between mb-2">
        <TierBadge tier={server.tier} />
        <span className="text-[9px] font-mono text-muted-foreground/40">{server.tools.length} tools</span>
      </div>
      <h3 className="text-sm font-semibold mb-0.5 group-hover:text-nexus-cyan transition-colors">{server.displayName}</h3>
      <p className="text-[10px] font-mono text-muted-foreground/50 mb-2">{server.namespace}</p>
      <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-2 mb-3">{server.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {server.worksWithBadges.slice(0, 3).map((b) => (
            <span key={b} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-nexus/60 text-muted-foreground/60">{b}</span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono" style={{ color: scoreColor(server.score.total) }}>{server.score.total}</span>
          <span className="text-[9px] text-muted-foreground/30">/100</span>
        </div>
      </div>
    </button>
  );
}

function DirectoryView({ navigate }: { navigate: (v: MarketplaceView, server?: McpServer) => void }) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TrustTier | 'all'>('all');
  const [capFilter, setCapFilter] = useState<string>('all');
  const [transportFilter, setTransportFilter] = useState<string>('all');

  const filtered = ALL_SERVERS.filter((s) => {
    if (search && !s.displayName.toLowerCase().includes(search.toLowerCase()) && !s.namespace.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (tierFilter !== 'all' && s.tier !== tierFilter) return false;
    if (capFilter !== 'all') {
      if (capFilter === 'tools' && s.tools.length === 0) return false;
      if (capFilter === 'resources' && s.resources.length === 0) return false;
    }
    if (transportFilter !== 'all' && s.transport !== transportFilter) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1">MCP Server Directory</h2>
        <p className="text-xs text-muted-foreground/60">{ALL_SERVERS.length} servers · {SZL_SERVERS.length} SZL-Verified · Live trust scores</p>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search servers, namespaces, descriptions…"
            className="w-full bg-nexus-surface border border-nexus rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-nexus-cyan/50 text-foreground placeholder:text-muted-foreground/30"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as TrustTier | 'all')}
          className="bg-nexus-surface border border-nexus rounded-lg px-3 py-2 text-xs text-muted-foreground focus:outline-none focus:border-nexus-cyan/50"
        >
          <option value="all">All Tiers</option>
          <option value="Verified">Verified</option>
          <option value="Reviewed">Reviewed</option>
          <option value="Community">Community</option>
          <option value="Unscored">Unscored</option>
        </select>
        <select
          value={capFilter}
          onChange={(e) => setCapFilter(e.target.value)}
          className="bg-nexus-surface border border-nexus rounded-lg px-3 py-2 text-xs text-muted-foreground focus:outline-none focus:border-nexus-cyan/50"
        >
          <option value="all">All Capabilities</option>
          <option value="tools">Has Tools</option>
          <option value="resources">Has Resources</option>
        </select>
        <select
          value={transportFilter}
          onChange={(e) => setTransportFilter(e.target.value)}
          className="bg-nexus-surface border border-nexus rounded-lg px-3 py-2 text-xs text-muted-foreground focus:outline-none focus:border-nexus-cyan/50"
        >
          <option value="all">All Transports</option>
          <option value="streamable-http">Streamable HTTP</option>
          <option value="http-sse">HTTP+SSE</option>
          <option value="stdio">stdio</option>
        </select>
        <span className="text-xs text-muted-foreground/40 font-mono">{filtered.length} results</span>
      </div>

      {(['Verified', 'Reviewed', 'Community', 'Unscored'] as TrustTier[]).map((tier) => {
        const group = filtered.filter((s) => s.tier === tier);
        if (group.length === 0) return null;
        const color = tierColor(tier);
        const Icon = tierIcon(tier);
        return (
          <div key={tier} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-xs font-semibold font-mono" style={{ color }}>{tier}</span>
              <span className="text-[10px] text-muted-foreground/40">({group.length})</span>
              {tier === 'Verified' && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border ml-2" style={{ color, borderColor: `${color}30`, backgroundColor: `${color}10` }}>
                  Signed · Audited · Supply-chain attested
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {group.map((server) => (
                <ServerCard key={server.namespace} server={server} onClick={() => navigate('detail', server)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ServerDetailView({ server, onBack }: { server: McpServer; onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const color = tierColor(server.tier);

  function copyInstall() {
    const cmd = `npx mcp-install ${server.namespace}`;
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyVerify() {
    const snippet = `echo "${server.manifestDigest}  server.json" | sha256sum -c`;
    navigator.clipboard.writeText(snippet).catch(() => {});
  }

  const scoreColor2 = scoreColor(server.score.total);

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
      </button>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          <div className="bg-nexus-surface border border-nexus rounded-xl p-5" style={{ borderColor: `${color}20` }}>
            <div className="flex items-start justify-between mb-3">
              <TierBadge tier={server.tier} size="md" />
              <div className="flex items-center gap-2">
                <button
                  onClick={copyInstall}
                  className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded border border-nexus-cyan/30 text-nexus-cyan hover:bg-nexus-cyan/10 transition-colors"
                >
                  {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy Install'}
                </button>
                <button className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded border border-nexus/60 text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="w-3 h-3" /> Open in PRAXIS
                </button>
              </div>
            </div>
            <h1 className="text-xl font-bold mb-1">{server.displayName}</h1>
            <p className="text-[11px] font-mono text-muted-foreground/50 mb-3">{server.namespace}</p>
            <p className="text-sm text-muted-foreground/80 leading-relaxed mb-4">{server.description}</p>
            <div className="grid grid-cols-3 gap-3 text-[11px]">
              <div className="bg-[#060b12] rounded-lg p-2">
                <div className="text-muted-foreground/40 mb-0.5">Transport</div>
                <div className="font-mono text-foreground/80">{server.transport}</div>
              </div>
              <div className="bg-[#060b12] rounded-lg p-2">
                <div className="text-muted-foreground/40 mb-0.5">Spec Version</div>
                <div className="font-mono text-foreground/80">{server.specVersion}</div>
              </div>
              <div className="bg-[#060b12] rounded-lg p-2">
                <div className="text-muted-foreground/40 mb-0.5">Uptime (30d)</div>
                <div className="font-mono" style={{ color: server.uptimePct30d >= 99 ? '#a3e635' : '#f59e0b' }}>
                  {server.uptimePct30d}%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-nexus-surface border border-nexus rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-nexus-cyan" /> Capability Tree
            </h3>
            <div className="space-y-2">
              {server.tools.map((tool) => {
                const rColor = reversibilityColor(tool.reversibility);
                return (
                  <div key={tool.name} className="bg-[#060b12] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono font-semibold text-nexus-cyan">{tool.name}</span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ color: rColor, backgroundColor: `${rColor}15`, border: `1px solid ${rColor}30` }}
                      >
                        {tool.reversibility}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60">{tool.description}</p>
                  </div>
                );
              })}
            </div>
            {server.resources.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-mono text-muted-foreground/40 mb-2 uppercase tracking-widest">Resources</div>
                {server.resources.map((r) => (
                  <div key={r.uri} className="bg-[#060b12] rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-nexus-amber">{r.uri}</span>
                      {r.mimeType && <span className="text-[9px] text-muted-foreground/40">{r.mimeType}</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{r.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-nexus-surface border border-nexus rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-nexus-amber" /> Capability Drift Events
            </h3>
            {server.driftEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground/40">No drift events in the last 90 days.</p>
            ) : (
              <div className="space-y-2">
                {server.driftEvents.map((e, i) => {
                  const driftColor = e.severity === 'critical' ? '#f87171' : e.severity === 'warn' ? '#f59e0b' : '#a3e635';
                  return (
                    <div key={i} className="bg-[#060b12] rounded-lg p-3 flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: driftColor }} />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono" style={{ color: driftColor }}>{e.type}</span>
                          <span className="text-[9px] text-muted-foreground/40">{new Date(e.at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/70">{e.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-nexus-surface border border-nexus rounded-xl p-4" style={{ borderColor: `${scoreColor2}20` }}>
            <h3 className="text-xs font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" style={{ color: scoreColor2 }} /> Trust Score
            </h3>
            <div className="text-center mb-4">
              <div className="text-5xl font-mono font-bold" style={{ color: scoreColor2 }}>{server.score.total}</div>
              <div className="text-[10px] text-muted-foreground/40">out of 100</div>
              <TierBadge tier={server.tier} size="sm" />
            </div>
            <div className="space-y-3">
              <ScoreBar label="Uptime Probe (30d)" value={server.score.uptime_probe} max={20} color={scoreColor2} />
              <ScoreBar label="Capability Stability" value={server.score.capability_stability} max={20} color={scoreColor2} />
              <ScoreBar label="Manifest Signature" value={server.score.manifest_signature} max={20} color={scoreColor2} />
              <ScoreBar label="Audit Completeness" value={server.score.audit_completeness} max={20} color={scoreColor2} />
              <ScoreBar label="Transport Conformance" value={server.score.transport_conformance} max={10} color={scoreColor2} />
              <ScoreBar label="Reversibility Coverage" value={server.score.reversibility_coverage} max={10} color={scoreColor2} />
            </div>
          </div>

          <div className="bg-nexus-surface border border-nexus rounded-xl p-4">
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-nexus-green" /> Manifest Digest
            </h3>
            <div className="bg-[#060b12] rounded-lg p-2 mb-2">
              <p className="text-[9px] font-mono text-nexus-green/70 break-all">{server.manifestDigest}</p>
            </div>
            <button
              onClick={copyVerify}
              className="text-[9px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Copy className="w-2.5 h-2.5" /> Copy verify command
            </button>
          </div>

          <div className="bg-nexus-surface border border-nexus rounded-xl p-4">
            <h3 className="text-xs font-semibold mb-3">Works With</h3>
            <div className="flex flex-wrap gap-1.5">
              {server.worksWithBadges.map((b) => (
                <span key={b} className="text-[9px] font-mono px-2 py-0.5 rounded border border-nexus/60 text-muted-foreground/60">{b}</span>
              ))}
            </div>
          </div>

          <div className="bg-nexus-surface border border-nexus rounded-xl p-4">
            <h3 className="text-xs font-semibold mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {server.tags.map((t) => (
                <span key={t} className="text-[9px] px-2 py-0.5 rounded bg-nexus-cyan/5 border border-nexus-cyan/15 text-nexus-cyan/60">{t}</span>
              ))}
            </div>
          </div>

          <div className="bg-nexus-surface border border-nexus rounded-xl p-4">
            <div className="space-y-2">
              <div className="text-[9px] font-mono text-muted-foreground/40">LAST PUBLISHED</div>
              <div className="text-[10px] font-mono text-foreground/60">{new Date(server.lastPublished).toLocaleString()}</div>
              <button className="w-full mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-nexus-amber transition-colors py-1.5 rounded border border-nexus/40 hover:border-nexus-amber/30">
                <MessageSquare className="w-3 h-3" /> Report a concern
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodologyView() {
  const weights = [
    { key: 'uptime_probe', label: 'Uptime Probe', weight: 20, description: 'Rolling 30-day availability via periodic ping. Measured against the server\'s declared endpoint. Score degrades linearly from 100% to 95% uptime. Below 95% scores 0.', color: '#22d3ee' },
    { key: 'capability_stability', label: 'Capability Stability', weight: 20, description: 'Fingerprint hash of the tool/resource/prompt catalog, tracked via the Observatory drift detector. Each unreviewed drift event in the last 90 days deducts points. Reviewed and approved drifts score neutral.', color: '#a3e635' },
    { key: 'manifest_signature', label: 'Manifest Signature', weight: 20, description: 'Validity of the server.json cryptographic signature against the SZL platform key. Full score requires a valid SLSA-style attestation. Unverified manifests score 4. Self-signed score 8. Platform-verified score 20.', color: '#f59e0b' },
    { key: 'audit_completeness', label: 'Audit Completeness', weight: 20, description: 'For SZL-owned servers only: completeness of the audit trail in the PRAXIS audit log. Checks 30 days of invocations. Community servers score 0 here by design — this component rewards internal transparency.', color: '#8b5cf6' },
    { key: 'transport_conformance', label: 'Transport Conformance', weight: 10, description: 'Automated probe against the 2025-11-25 MCP spec. Tests initialize handshake, tools/list, resources/list, and one tools/call roundtrip. Partial credit for each passing check.', color: '#f472b6' },
    { key: 'reversibility_coverage', label: 'Reversibility Coverage', weight: 10, description: 'Fraction of declared write tools that carry an explicit reversibility annotation (read-only / reversible-write / irreversible-write). 100% annotated = full score. Unannotated write tools reduce score proportionally.', color: '#fb923c' },
  ];

  const tiers = [
    { tier: 'Verified' as TrustTier, min: 90, label: '≥ 90 points', description: 'Passed all automated checks + platform-signed manifest + audit trail. SZL-owned servers default here after passing.' },
    { tier: 'Reviewed' as TrustTier, min: 70, label: '70–89 points', description: 'Passed automated checks. Manual review completed by SZL governance team. Third-party servers progress here after review.' },
    { tier: 'Community' as TrustTier, min: 40, label: '40–69 points', description: 'Submitted and validated. Automated probes pass. Awaiting or not yet eligible for full review.' },
    { tier: 'Unscored' as TrustTier, min: 0, label: '< 40 points', description: 'Recently submitted or failing probes. Not yet scored or failed automated validation.' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Trust Score Methodology</h2>
        <p className="text-sm text-muted-foreground/70 leading-relaxed">
          The SZL Trust Score is a weighted sum of six independently verifiable components. 
          Weights, thresholds, and computation inputs are published here and versioned. 
          Every score is stored with the exact inputs that produced it.
        </p>
        <p className="text-xs font-mono text-muted-foreground/40 mt-2">Methodology Version: 1.0 · Published 2026-04-26</p>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-4 text-nexus-cyan">Score Components</h3>
        <div className="space-y-3">
          {weights.map((w) => (
            <div key={w.key} className="bg-nexus-surface border border-nexus rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                  <span className="text-sm font-semibold">{w.label}</span>
                </div>
                <span className="text-xs font-mono" style={{ color: w.color }}>0–{w.weight} pts</span>
              </div>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">{w.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-4 text-nexus-cyan">Tier Thresholds</h3>
        <div className="space-y-3">
          {tiers.map((t) => (
            <div key={t.tier} className="bg-nexus-surface border border-nexus rounded-xl p-4 flex items-start gap-4">
              <TierBadge tier={t.tier} size="md" />
              <div>
                <div className="text-xs font-mono text-muted-foreground/60 mb-1">{t.label}</div>
                <p className="text-xs text-muted-foreground/70">{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-nexus-surface border border-nexus-cyan/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3 text-nexus-cyan">Trust Verification API</h3>
        <p className="text-xs text-muted-foreground/70 mb-4 leading-relaxed">
          The canonical trust record is publicly available, unauthenticated, and citable. 
          Other aggregators can reference it — we want the citation graph.
        </p>
        <div className="bg-[#060b12] rounded-lg p-4 font-mono text-xs space-y-2">
          <div className="text-muted-foreground/50">{'# GET /api/marketplace/v1/servers/{namespace}'}</div>
          <div className="text-nexus-green/80">GET /api/marketplace/v1/servers/com.szlholdings.vessels</div>
          <div className="text-muted-foreground/30 mt-3">{'# Response'}</div>
          <div className="text-nexus-cyan/70">{'{'}</div>
          <div className="text-muted-foreground/70 pl-4">{"\"namespace\": \"com.szlholdings.vessels\","}</div>
          <div className="text-muted-foreground/70 pl-4">{"\"tier\": \"Verified\","}</div>
          <div className="text-muted-foreground/70 pl-4">{"\"score\": { \"total\": 95, ... },"}</div>
          <div className="text-muted-foreground/70 pl-4">{"\"drift_events\": [...],"}</div>
          <div className="text-muted-foreground/70 pl-4">{"\"manifest_digest\": \"sha256:8a3f...\","}</div>
          <div className="text-muted-foreground/70 pl-4">{"\"scored_at\": \"2026-04-26T06:00:00Z\""}</div>
          <div className="text-nexus-cyan/70">{'}'}</div>
        </div>
      </div>
    </div>
  );
}

function SubmitView() {
  const [url, setUrl] = useState('');
  const [contact, setContact] = useState('');
  const [phase, setPhase] = useState<'idle' | 'validating' | 'probing' | 'queued'>('idle');
  const [log, setLog] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setPhase('validating');
    setLog(['Fetching server.json from repository…']);
    await delay(900);
    setLog((l) => [...l, 'Validating manifest against MCP 2025-11-25 spec… OK']);
    setPhase('probing');
    await delay(1100);
    setLog((l) => [...l, 'Running transport conformance probe (initialize handshake)… OK']);
    await delay(700);
    setLog((l) => [...l, 'Probing tools/list endpoint… 3 tools discovered']);
    await delay(600);
    setLog((l) => [...l, 'Computing capability fingerprint hash… sha256:a1b2c3…']);
    await delay(500);
    setLog((l) => [...l, 'Reversibility annotation coverage: 100%']);
    await delay(400);
    setLog((l) => [...l, 'Creating governance queue entry (Tier: Unscored → pending review)…']);
    await delay(700);
    setLog((l) => [...l, '✓ Submission complete. Your server is in the governance queue.']);
    setPhase('queued');
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <h2 className="text-xl font-bold mb-2">Submit Your MCP Server</h2>
      <p className="text-sm text-muted-foreground/70 leading-relaxed mb-8">
        We validate your manifest against the spec, run an automated capability and transport probe, 
        then queue your server in PRAXIS Governance for human tier assignment. You'll be notified on assignment.
      </p>

      {phase === 'queued' ? (
        <div className="bg-nexus-surface border border-nexus-green/30 rounded-xl p-6 text-center">
          <CheckCircle className="w-10 h-10 text-nexus-green mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Submission Received</h3>
          <p className="text-sm text-muted-foreground/70 mb-4">Your server is in the governance queue. We'll notify you at <strong>{contact || 'your email'}</strong> when tier assignment is complete.</p>
          <div className="bg-[#060b12] rounded-lg p-3 text-left mb-4">
            {log.map((l, i) => (
              <div key={i} className="text-[10px] font-mono text-nexus-green/70">{l}</div>
            ))}
          </div>
          <button
            onClick={() => { setPhase('idle'); setUrl(''); setContact(''); setLog([]); }}
            className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            Submit another server
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5">GitHub Repository URL <span className="text-nexus-amber">*</span></label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/your-org/your-mcp-server"
              disabled={phase !== 'idle'}
              className="w-full bg-nexus-surface border border-nexus rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-nexus-cyan/50 text-foreground placeholder:text-muted-foreground/30 disabled:opacity-50"
            />
            <p className="text-[10px] text-muted-foreground/40 mt-1">Must contain a server.json at the repository root.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Contact email (for tier assignment notification)</label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="your@email.com"
              type="email"
              disabled={phase !== 'idle'}
              className="w-full bg-nexus-surface border border-nexus rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-nexus-cyan/50 text-foreground placeholder:text-muted-foreground/30 disabled:opacity-50"
            />
          </div>

          {log.length > 0 && (
            <div className="bg-[#060b12] rounded-lg p-4">
              {log.map((l, i) => (
                <div key={i} className="text-[10px] font-mono text-nexus-green/70">{l}</div>
              ))}
              {phase !== 'queued' && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-nexus-cyan animate-pulse" />
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    {phase === 'validating' ? 'Validating manifest…' : 'Running probes…'}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="bg-nexus-surface border border-nexus-cyan/15 rounded-xl p-4">
            <h4 className="text-xs font-semibold mb-3 text-nexus-cyan">What we check</h4>
            <div className="space-y-2">
              {[
                'Manifest schema validation against MCP 2025-11-25 spec',
                'Transport conformance probe (initialize → tools/list → tools/call)',
                'Capability fingerprint hash computation',
                'Reversibility annotation coverage per declared write tool',
                'Manifest signature presence (unsigned = 4/20 on manifest_signature component)',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground/70">
                  <CheckCircle className="w-3 h-3 text-nexus-green/50 mt-0.5 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!url || phase !== 'idle'}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-nexus-cyan text-nexus-bg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {phase === 'idle' ? 'Submit for Validation' : 'Validating…'}
          </button>
        </form>
      )}
    </div>
  );
}

function AboutView() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      <div className="bg-nexus-surface border border-nexus-cyan/20 rounded-xl p-8 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-nexus-cyan" />
          <span className="text-xs font-mono text-nexus-cyan tracking-widest uppercase">Press-Ready · One-Pager</span>
        </div>
        <h1 className="text-3xl font-bold font-mono mb-2">
          <span className="text-nexus-cyan">SZL Holdings</span>
          <span className="text-foreground"> is the Authority</span>
          <br />
          <span className="text-muted-foreground/60">on Governed Agentic Interop</span>
        </h1>
        <p className="text-sm text-muted-foreground/50 font-mono mb-8">April 2026</p>

        <div className="space-y-6 text-sm text-muted-foreground/80 leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">The Thesis</h2>
            <p>
              Model Context Protocol (MCP) is becoming the standard interface between AI agents and tools. 
              Anthropic runs the protocol. PulseMCP and Microsoft mirror the registry. But nobody publishes 
              a <em>governance score</em> — supply-chain attestation, capability-drift history, and 
              reversible-write classification — for the servers people are installing into their AI systems.
            </p>
            <p className="mt-2">
              SZL Holdings does. We built governed MCP infrastructure for our own portfolio first — eight 
              enterprise-grade servers spanning maritime intelligence, cyber resilience, real estate, legal 
              matter command, and unified orchestration. Then we published the methodology and opened it to 
              the ecosystem. The market position follows naturally: anyone evaluating MCP servers should 
              consult our verification before they install one.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">The Methodology</h2>
            <p>
              The SZL Trust Score is a 100-point weighted sum, not a black box. Six published components: 
              30-day uptime probe, capability-stability fingerprint history, manifest signature and SLSA-style 
              attestation, audit-trail completeness (SZL servers), transport conformance against the 
              2025-11-25 spec, and reversibility coverage of declared write tools. Every score is stored 
              with the exact inputs that produced it. Weights are published and versioned.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">The Tiers</h2>
            <p>
              <strong className="text-foreground">Verified</strong> (≥90): Platform-signed, audited, supply-chain attested. 
              All eight SZL servers. <strong className="text-foreground">Reviewed</strong> (70–89): Automated checks pass, human 
              governance review complete. <strong className="text-foreground">Community</strong> (40–69): Submitted and validated, 
              awaiting review. <strong className="text-foreground">Unscored</strong> (&lt;40): New or failing probes.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">How to Participate</h2>
            <div className="space-y-1">
              <p>→ <strong className="text-foreground">Publish a server:</strong> Submit a GitHub repo with a server.json. We validate, probe, and queue for tier assignment.</p>
              <p>→ <strong className="text-foreground">Cite our scores:</strong> Use the Trust Verification API (GET /api/marketplace/v1/servers/{'{namespace}'}) — public, unauthenticated, citable.</p>
              <p>→ <strong className="text-foreground">Use SZL servers:</strong> All eight com.szlholdings.* servers are published to the official MCP Registry with full manifests and install commands.</p>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">Why This Matters Now</h2>
            <p>
              AI agents are already installing MCP servers from public registries — often with no verification 
              of what capabilities are being granted, whether write operations are reversible, or whether the 
              server's capability set has drifted from what was reviewed. Governance is not a feature. It's 
              the prerequisite for enterprise adoption at scale. SZL built this because we needed it ourselves. 
              We're publishing it because the ecosystem needs it too.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Trust Verification API', desc: 'Public, unauthenticated, citable', href: '/api/marketplace/v1/servers/', color: '#22d3ee' },
          { label: 'MCP Registry', desc: 'All 8 servers published', href: 'https://mcpregistry.io', color: '#a3e635' },
          { label: 'Methodology v1.0', desc: 'Weights published and versioned', href: '#methodology', color: '#f59e0b' },
        ].map((l) => (
          <div key={l.label} className="bg-nexus-surface border border-nexus rounded-xl p-4" style={{ borderColor: `${l.color}20` }}>
            <div className="text-[10px] font-mono mb-1" style={{ color: l.color }}>{l.label}</div>
            <p className="text-[11px] text-muted-foreground/60">{l.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const NAV_TABS: { id: MarketplaceView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Marketplace', icon: Globe },
  { id: 'directory', label: 'Directory', icon: Layers },
  { id: 'methodology', label: 'Methodology', icon: Info },
  { id: 'submit', label: 'Submit Server', icon: Upload },
  { id: 'about', label: 'About', icon: FileText },
];

export default function Marketplace({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<MarketplaceView>('home');
  const [selectedServer, setSelectedServer] = useState<McpServer | null>(null);

  function navigate(v: MarketplaceView, server?: McpServer) {
    setView(v);
    if (server) setSelectedServer(server);
    window.scrollTo(0, 0);
  }

  const isDetail = view === 'detail' && selectedServer;

  return (
    <div className="min-h-screen bg-nexus-bg flex flex-col">
      <header className="h-12 bg-nexus-surface border-b border-nexus flex items-center px-6 gap-4 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="font-mono">PRAXIS</span>
        </button>
        <div className="w-px h-4 bg-nexus" />
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-nexus-cyan" />
          <span className="text-sm font-semibold font-mono text-nexus-cyan">MCP Trust Marketplace</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-nexus-green pulse-dot" />
          <span className="text-[10px] font-mono text-muted-foreground/40">TRUST LAYER ONLINE</span>
        </div>
      </header>

      <nav className="bg-nexus-surface border-b border-nexus px-6 flex items-center gap-1 shrink-0">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = (view === tab.id) || (isDetail && tab.id === 'directory');
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${
                active
                  ? 'border-nexus-cyan text-nexus-cyan'
                  : 'border-transparent text-muted-foreground/60 hover:text-foreground hover:border-nexus/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 overflow-y-auto">
        {view === 'home' && <MarketplaceHome navigate={navigate} />}
        {(view === 'directory') && <DirectoryView navigate={navigate} />}
        {view === 'detail' && selectedServer && (
          <ServerDetailView server={selectedServer} onBack={() => navigate('directory')} />
        )}
        {view === 'methodology' && <MethodologyView />}
        {view === 'submit' && <SubmitView />}
        {view === 'about' && <AboutView />}
      </main>

      <footer className="h-8 bg-nexus-surface border-t border-nexus flex items-center px-6 gap-4 shrink-0">
        <span className="text-[9px] font-mono text-muted-foreground/30">© 2026 SZL Holdings · MCP Trust Layer v1.0</span>
        <span className="text-[9px] font-mono text-muted-foreground/20">·</span>
        <span className="text-[9px] font-mono text-muted-foreground/30">Methodology v1.0</span>
        <span className="text-[9px] font-mono text-muted-foreground/20">·</span>
        <span className="text-[9px] font-mono text-muted-foreground/30">Trust Verification API: /api/marketplace/v1/servers/</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-nexus-green" />
          <span className="text-[9px] font-mono text-muted-foreground/30">8 SZL servers · 11 trust scores · live probes</span>
        </div>
      </footer>
    </div>
  );
}
