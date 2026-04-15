/**
 * Dynamic In-Memory Simulation Engine
 *
 * Generates time-evolving, statistically realistic data for all domains:
 * Aegis, Vessels, Terra, Lyte, SZL Holdings — with cross-domain correlation.
 *
 * Statistical models:
 *   - Poisson arrivals for incidents/alerts
 *   - Geometric Brownian Motion for financial metrics
 *   - Markov chains for incident state transitions
 *   - Sinusoidal patterns for infrastructure load
 *   - Great-circle interpolation for vessel positions
 *   - Brownian motion for property distress scores
 */

import { EventEmitter } from "events";
import { logger } from "./logger.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScenarioPreset =
  | "normal_operations"
  | "active_incident"
  | "market_volatility"
  | "fleet_emergency"
  | "coordinated_apt"
  | "regulatory_audit";

export interface SimulationConfig {
  tickIntervalMs: number;
  timeAcceleration: number;
  scenario: ScenarioPreset;
  running: boolean;
}

export interface SimulationStats {
  tickCount: number;
  startedAt: string;
  uptime: number;
  scenario: ScenarioPreset;
  config: SimulationConfig;
  domainStats: Record<string, { entities: number; events: number }>;
}

// Aegis domain types
export interface SimulatedThreat {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "new" | "triage" | "containment" | "remediation" | "closed";
  attackTechnique: string;
  tactic: string;
  killChainPhase: number;
  confidence: number;
  affectedAssets: string[];
  detectedAt: string;
  lastUpdated: string;
  progressPct: number;
  correlatedVesselId?: string;
  correlatedLegalMatterId?: string;
}

export interface SimulatedAlert {
  id: string;
  source: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  status: "new" | "acknowledged" | "resolved";
  receivedAt: string;
  mitreId?: string;
}

// Vessels domain types
export interface SimulatedVessel {
  id: string;
  name: string;
  imo: string;
  mmsi: string;
  vesselType: "tanker" | "container" | "bulk" | "cargo";
  flag: string;
  status: "at_sea" | "in_port" | "anchored" | "ais_dark";
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  destination: string;
  eta: string;
  routeProgress: number;
  routeWaypoints: Array<{ lat: number; lon: number }>;
  activeException?: string;
  financialExposureUsd: number;
  lastUpdated: string;
}

export interface SimulatedVesselEvent {
  id: string;
  vesselId: string;
  vesselName: string;
  type: "eta_change" | "exception" | "route_deviation" | "maintenance_alert" | "ais_dark" | "position_update";
  severity: "critical" | "high" | "watch" | "info";
  title: string;
  description: string;
  timestamp: string;
  impactUsd?: number;
  crossDomainTriggered?: boolean;
}

// Terra domain types
export interface SimulatedProperty {
  id: string;
  address: string;
  borough: string;
  propertyType: string;
  distressScore: number;
  opportunityScore: number;
  estimatedValueUsd: number;
  daysInDistress: number;
  distressType: "pre-foreclosure" | "foreclosure" | "tax-lien" | "auction";
  marketCyclePhase: "recovery" | "expansion" | "hyper_supply" | "recession";
  lastUpdated: string;
}

// Lyte domain types
export interface SimulatedSignal {
  id: string;
  source: string;
  sourceType: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  status: "new" | "acknowledged" | "resolved";
  receivedAt: string;
  loadPct?: number;
  crossDomainTriggered?: boolean;
}

export interface SimulatedIncident {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "investigating" | "mitigating" | "resolved";
  assignee: string;
  createdAt: string;
  resolvedAt?: string;
  financialImpactUsd?: number;
}

// SZL Holdings domain types
export interface SimulatedPortfolioMetric {
  timestamp: string;
  nav: number;
  navChange: number;
  navChangePct: number;
  liquidityRatio: number;
  riskScore: number;
  exposureUsd: number;
}

export interface SimulatedHolding {
  id: string;
  name: string;
  sector: string;
  valueUsd: number;
  dailyChangePct: number;
  volatility: number;
  beta: number;
  lastUpdated: string;
}

// Cross-domain correlation event
export interface CorrelationEvent {
  id: string;
  type:
    | "vessel_ais_dark_to_security"
    | "vessel_ais_dark_to_financial"
    | "cyber_breach_to_legal"
    | "market_crash_to_fleet"
    | "fleet_emergency_to_financial";
  sourceDomain: string;
  targetDomain: string;
  sourceEntityId: string;
  payload: Record<string, unknown>;
  triggeredAt: string;
}

// ---------------------------------------------------------------------------
// Scenario Configurations
// ---------------------------------------------------------------------------

interface ScenarioParams {
  label: string;
  description: string;
  // Arrival rates (events per tick)
  threatArrivalRate: number;
  alertArrivalRate: number;
  vesselExceptionRate: number;
  infraSignalRate: number;
  // Severity distributions (weights: critical, high, medium, low)
  threatSeverityWeights: [number, number, number, number];
  alertSeverityWeights: [number, number, number, number];
  // Cross-domain trigger probabilities
  aisToSecurityProbability: number;
  aisToFinancialProbability: number;
  cyberToLegalProbability: number;
  // Financial parameters
  gbmDrift: number;
  gbmVolatility: number;
  marketCrashProbability: number;
  // Vessel parameters
  aisBlackoutProbability: number;
  routeDeviationProbability: number;
  // Infrastructure parameters
  cascadeFailureProbability: number;
  infraLoadBaseline: number;
  // Terra parameters
  distressScoreVolatility: number;
}

const SCENARIO_PARAMS: Record<ScenarioPreset, ScenarioParams> = {
  normal_operations: {
    label: "Normal Operations",
    description: "Baseline operations — calm environment with routine activity",
    threatArrivalRate: 0.05,
    alertArrivalRate: 0.2,
    vesselExceptionRate: 0.08,
    infraSignalRate: 0.15,
    threatSeverityWeights: [0.05, 0.15, 0.4, 0.4],
    alertSeverityWeights: [0.02, 0.1, 0.35, 0.35],
    aisToSecurityProbability: 0.1,
    aisToFinancialProbability: 0.15,
    cyberToLegalProbability: 0.2,
    gbmDrift: 0.0001,
    gbmVolatility: 0.008,
    marketCrashProbability: 0.001,
    aisBlackoutProbability: 0.005,
    routeDeviationProbability: 0.02,
    cascadeFailureProbability: 0.01,
    infraLoadBaseline: 0.55,
    distressScoreVolatility: 0.5,
  },
  active_incident: {
    label: "Active Incident Response",
    description: "Ongoing major incident — elevated signals, responders engaged",
    threatArrivalRate: 0.25,
    alertArrivalRate: 0.6,
    vesselExceptionRate: 0.12,
    infraSignalRate: 0.5,
    threatSeverityWeights: [0.25, 0.35, 0.25, 0.15],
    alertSeverityWeights: [0.2, 0.35, 0.3, 0.15],
    aisToSecurityProbability: 0.25,
    aisToFinancialProbability: 0.3,
    cyberToLegalProbability: 0.4,
    gbmDrift: -0.0002,
    gbmVolatility: 0.018,
    marketCrashProbability: 0.005,
    aisBlackoutProbability: 0.02,
    routeDeviationProbability: 0.08,
    cascadeFailureProbability: 0.06,
    infraLoadBaseline: 0.82,
    distressScoreVolatility: 1.2,
  },
  market_volatility: {
    label: "Market Volatility",
    description: "High market stress — financial metrics diverge, portfolio pressure",
    threatArrivalRate: 0.08,
    alertArrivalRate: 0.25,
    vesselExceptionRate: 0.15,
    infraSignalRate: 0.2,
    threatSeverityWeights: [0.08, 0.2, 0.35, 0.37],
    alertSeverityWeights: [0.05, 0.15, 0.4, 0.4],
    aisToSecurityProbability: 0.12,
    aisToFinancialProbability: 0.45,
    cyberToLegalProbability: 0.15,
    gbmDrift: -0.0008,
    gbmVolatility: 0.035,
    marketCrashProbability: 0.02,
    aisBlackoutProbability: 0.01,
    routeDeviationProbability: 0.05,
    cascadeFailureProbability: 0.02,
    infraLoadBaseline: 0.65,
    distressScoreVolatility: 2.5,
  },
  fleet_emergency: {
    label: "Fleet Emergency",
    description: "Maritime crisis — multiple vessels with critical exceptions",
    threatArrivalRate: 0.15,
    alertArrivalRate: 0.3,
    vesselExceptionRate: 0.45,
    infraSignalRate: 0.2,
    threatSeverityWeights: [0.15, 0.3, 0.35, 0.2],
    alertSeverityWeights: [0.1, 0.25, 0.4, 0.25],
    aisToSecurityProbability: 0.55,
    aisToFinancialProbability: 0.65,
    cyberToLegalProbability: 0.25,
    gbmDrift: -0.0004,
    gbmVolatility: 0.022,
    marketCrashProbability: 0.008,
    aisBlackoutProbability: 0.12,
    routeDeviationProbability: 0.25,
    cascadeFailureProbability: 0.03,
    infraLoadBaseline: 0.7,
    distressScoreVolatility: 1.5,
  },
  coordinated_apt: {
    label: "Coordinated APT Campaign",
    description: "Active nation-state threat — multi-stage intrusion across all systems",
    threatArrivalRate: 0.5,
    alertArrivalRate: 0.9,
    vesselExceptionRate: 0.1,
    infraSignalRate: 0.7,
    threatSeverityWeights: [0.45, 0.35, 0.15, 0.05],
    alertSeverityWeights: [0.35, 0.4, 0.2, 0.05],
    aisToSecurityProbability: 0.6,
    aisToFinancialProbability: 0.2,
    cyberToLegalProbability: 0.8,
    gbmDrift: -0.0003,
    gbmVolatility: 0.025,
    marketCrashProbability: 0.01,
    aisBlackoutProbability: 0.08,
    routeDeviationProbability: 0.06,
    cascadeFailureProbability: 0.15,
    infraLoadBaseline: 0.88,
    distressScoreVolatility: 1.0,
  },
  regulatory_audit: {
    label: "Regulatory Audit",
    description: "Compliance audit underway — heightened monitoring, documentation required",
    threatArrivalRate: 0.04,
    alertArrivalRate: 0.12,
    vesselExceptionRate: 0.06,
    infraSignalRate: 0.1,
    threatSeverityWeights: [0.03, 0.1, 0.35, 0.52],
    alertSeverityWeights: [0.02, 0.08, 0.3, 0.6],
    aisToSecurityProbability: 0.08,
    aisToFinancialProbability: 0.1,
    cyberToLegalProbability: 0.6,
    gbmDrift: 0.00005,
    gbmVolatility: 0.006,
    marketCrashProbability: 0.0005,
    aisBlackoutProbability: 0.003,
    routeDeviationProbability: 0.015,
    cascadeFailureProbability: 0.005,
    infraLoadBaseline: 0.5,
    distressScoreVolatility: 0.4,
  },
};

// ---------------------------------------------------------------------------
// MITRE ATT&CK Kill Chain Data
// ---------------------------------------------------------------------------

const MITRE_KILL_CHAIN: Array<{
  phase: number;
  label: string;
  tactics: string[];
  techniques: string[];
}> = [
  { phase: 1, label: "Reconnaissance", tactics: ["TA0043"], techniques: ["T1589", "T1590", "T1591", "T1592"] },
  { phase: 2, label: "Initial Access", tactics: ["TA0001"], techniques: ["T1566.001", "T1190", "T1133", "T1078"] },
  { phase: 3, label: "Execution", tactics: ["TA0002"], techniques: ["T1059.001", "T1204.002", "T1569.002"] },
  { phase: 4, label: "Persistence", tactics: ["TA0003"], techniques: ["T1053.005", "T1547.001", "T1098"] },
  { phase: 5, label: "Privilege Escalation", tactics: ["TA0004"], techniques: ["T1055", "T1068", "T1134"] },
  { phase: 6, label: "Defense Evasion", tactics: ["TA0005"], techniques: ["T1070.004", "T1036", "T1562.001"] },
  { phase: 7, label: "Credential Access", tactics: ["TA0006"], techniques: ["T1003.001", "T1110", "T1555"] },
  { phase: 8, label: "Lateral Movement", tactics: ["TA0008"], techniques: ["T1021.002", "T1550.002", "T1080"] },
  { phase: 9, label: "Collection", tactics: ["TA0009"], techniques: ["T1213", "T1005", "T1039"] },
  { phase: 10, label: "Exfiltration", tactics: ["TA0010"], techniques: ["T1567.002", "T1041", "T1048"] },
];

const SHIPPING_ROUTES: Array<{
  name: string;
  waypoints: Array<{ lat: number; lon: number }>;
  typicalVesselTypes: string[];
}> = [
  {
    name: "Trans-Pacific",
    waypoints: [
      { lat: 33.7, lon: -118.2 }, { lat: 24.0, lon: -150.0 }, { lat: 13.0, lon: 145.0 },
      { lat: 22.3, lon: 114.2 }, { lat: 35.4, lon: 139.6 },
    ],
    typicalVesselTypes: ["container", "tanker"],
  },
  {
    name: "Asia-Europe via Suez",
    waypoints: [
      { lat: 22.3, lon: 114.2 }, { lat: 1.3, lon: 103.8 }, { lat: 12.5, lon: 44.0 },
      { lat: 30.0, lon: 32.5 }, { lat: 37.0, lon: 23.0 }, { lat: 36.1, lon: -5.3 },
      { lat: 51.9, lon: 4.5 },
    ],
    typicalVesselTypes: ["container", "bulk", "tanker"],
  },
  {
    name: "Persian Gulf Crude",
    waypoints: [
      { lat: 26.5, lon: 50.2 }, { lat: 25.0, lon: 57.0 }, { lat: 14.5, lon: 50.0 },
      { lat: 12.5, lon: 44.0 },
    ],
    typicalVesselTypes: ["tanker"],
  },
  {
    name: "Trans-Atlantic",
    waypoints: [
      { lat: 40.7, lon: -74.0 }, { lat: 43.0, lon: -45.0 }, { lat: 50.0, lon: -10.0 },
      { lat: 51.9, lon: 4.5 },
    ],
    typicalVesselTypes: ["container", "cargo"],
  },
  {
    name: "Cape of Good Hope",
    waypoints: [
      { lat: 1.3, lon: 103.8 }, { lat: -20.0, lon: 70.0 }, { lat: -34.5, lon: 18.5 },
      { lat: -15.0, lon: -30.0 }, { lat: 51.9, lon: 4.5 },
    ],
    typicalVesselTypes: ["tanker", "bulk"],
  },
  {
    name: "North Sea",
    waypoints: [
      { lat: 57.7, lon: 1.8 }, { lat: 53.5, lon: 8.5 }, { lat: 57.1, lon: 10.2 },
      { lat: 59.9, lon: 10.7 },
    ],
    typicalVesselTypes: ["tanker", "cargo"],
  },
];

const VESSEL_NAMES = [
  "MV ATLAS PIONEER", "MT PACIFIC GLORY", "MV NORDIC STAR", "MT OCEAN FORTUNE",
  "MV SILVER HORIZON", "MT GOLDEN GATE", "MV TITAN VOYAGER", "MT BLUE ODYSSEY",
  "MV SEA MERCURY", "MT CORAL KING", "MV ARCTIC BRIDGE", "MT EMERALD WAVE",
  "MV STORM RUNNER", "MT IRON GIANT", "MV JADE NAVIGATOR", "MT SAPPHIRE COAST",
];

const VESSEL_FLAGS = ["PA", "LR", "MH", "BS", "MT", "CY", "SG", "GR", "NO", "UK"];
const VESSEL_TYPES: Array<"tanker" | "container" | "bulk" | "cargo"> = [
  "tanker", "tanker", "tanker", "container", "container", "bulk", "bulk", "cargo",
];
const DESTINATIONS = [
  "Rotterdam", "Singapore", "Shanghai", "Houston", "Yokohama", "Dubai", "Mumbai",
  "Piraeus", "Antwerp", "Busan", "Ningbo", "Port Said", "Hamburg",
];

const INFRA_SOURCES = [
  { source: "AWS CloudWatch", sourceType: "monitoring" },
  { source: "Datadog APM", sourceType: "monitoring" },
  { source: "PagerDuty", sourceType: "alerting" },
  { source: "Grafana", sourceType: "monitoring" },
  { source: "Sentry", sourceType: "error_tracking" },
  { source: "AWS GuardDuty", sourceType: "security" },
  { source: "CloudFlare", sourceType: "cdn" },
  { source: "Prometheus", sourceType: "monitoring" },
  { source: "Splunk SIEM", sourceType: "siem" },
  { source: "GitHub Actions", sourceType: "ci_cd" },
];

const INFRA_SIGNAL_TEMPLATES = [
  "RDS replication lag {value}s — prod-db-01 write IOPS at {load}%",
  "API Gateway p99 latency {value}ms (SLO: 500ms) — {load}% error rate",
  "EKS cluster prod-k8s-01 node group at {load}% capacity",
  "Redis cluster memory utilization {load}% — eviction policy active",
  "Lambda cold starts increased {value}% — order-processor degraded",
  "Stripe webhook queue depth {value} — checkout pipeline pressure",
  "Kafka consumer lag {value}k messages — order-events partition 3",
  "NAT Gateway spend anomaly ${value}/hr — above 30-day baseline",
  "Deploy pipeline timeout after {value}m — Docker build OOM killed",
  "SLO burn rate {value}x — availability budget {load}% consumed",
];

const SECURITY_ALERT_TEMPLATES = [
  "Credential stuffing from CIDR {ip} — {value} failed auth attempts",
  "C2 beacon traffic to {ip} — APT29 IOC match {value}% confidence",
  "Lateral movement via SMB — WORKSTATION-{value} to DC-PROD-0{n}",
  "LSASS memory dump on WORKSTATION-{value} — credential harvest attempt",
  "Data exfiltration pattern — {value}GB transferred to unknown S3 bucket",
  "Brute force on VPN gateway — {value} failed logins, {n} accounts locked",
  "Suspicious IAM role assumption — prod-worker-node-role from {ip}",
  "AIS-dark vessel correlation — maritime cyber indicator elevated",
  "Phishing lure detected — {value} employees targeted via spearphish",
  "Privilege escalation attempt on prod-api-gateway-{n}",
];

const BOROUGH_LIST = [
  "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island",
];

const PROPERTY_TYPES = ["multifamily", "office", "retail", "industrial", "mixed-use"];
const DISTRESS_TYPES: Array<"pre-foreclosure" | "foreclosure" | "tax-lien" | "auction"> = [
  "pre-foreclosure", "pre-foreclosure", "foreclosure", "tax-lien", "auction",
];
const MARKET_PHASES: Array<"recovery" | "expansion" | "hyper_supply" | "recession"> = [
  "recovery", "expansion", "expansion", "hyper_supply", "recession",
];

const HOLDINGS = [
  { id: "h-001", name: "SZL Maritime Portfolio", sector: "Maritime", beta: 1.2, baseValue: 420000000 },
  { id: "h-002", name: "Terra Real Estate Fund", sector: "Real Estate", beta: 0.8, baseValue: 285000000 },
  { id: "h-003", name: "Aegis Security Ventures", sector: "Cybersecurity", beta: 1.4, baseValue: 145000000 },
  { id: "h-004", name: "Lyte Technology Holdings", sector: "Infrastructure", beta: 1.6, baseValue: 98000000 },
  { id: "h-005", name: "Global Trade Finance", sector: "Finance", beta: 0.95, baseValue: 310000000 },
  { id: "h-006", name: "Energy Commodities Pool", sector: "Energy", beta: 1.1, baseValue: 175000000 },
];

const ANALYSTS = ["J. Chen", "M. Rodriguez", "S. Park", "K. Wilson", "A. Thompson", "R. Davis"];

// ---------------------------------------------------------------------------
// Utility: Statistical Primitives
// ---------------------------------------------------------------------------

function seededRand(seed: number, offset: number): number {
  const x = Math.sin(seed * 9301 + offset * 49297 + 233) * 46656;
  return x - Math.floor(x);
}

function poissonSample(lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function geometricBrownianMotionStep(
  currentValue: number,
  drift: number,
  volatility: number,
  dtSeconds: number,
): number {
  const dt = dtSeconds / (365 * 24 * 3600);
  const z = gaussianRandom();
  const logReturn = (drift - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * z;
  return currentValue * Math.exp(logReturn);
}

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function brownianMotionStep(current: number, volatility: number, min: number, max: number): number {
  const step = gaussianRandom() * volatility;
  return Math.min(max, Math.max(min, current + step));
}

function sinusoidalLoad(baseLoad: number, tickCount: number, period: number, amplitude: number): number {
  const phase = (tickCount % period) / period;
  const sinVal = Math.sin(2 * Math.PI * phase);
  return Math.min(1.0, Math.max(0.0, baseLoad + amplitude * sinVal));
}

function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function interpolateGreatCircle(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  t: number,
): { lat: number; lon: number } {
  const lat1 = (from.lat * Math.PI) / 180;
  const lon1 = (from.lon * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const lon2 = (to.lon * Math.PI) / 180;

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2,
      ),
    );

  if (d < 0.0001) return from;

  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);
  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);
  const lat = (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI;
  const lon = (Math.atan2(y, x) * 180) / Math.PI;
  return { lat, lon };
}

function randomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// Markov chain for incident state transitions
const THREAT_STATE_TRANSITIONS: Record<string, Array<{ next: string; probability: number }>> = {
  new: [
    { next: "triage", probability: 0.6 },
    { next: "new", probability: 0.4 },
  ],
  triage: [
    { next: "containment", probability: 0.4 },
    { next: "triage", probability: 0.5 },
    { next: "closed", probability: 0.1 },
  ],
  containment: [
    { next: "remediation", probability: 0.5 },
    { next: "containment", probability: 0.45 },
    { next: "triage", probability: 0.05 },
  ],
  remediation: [
    { next: "closed", probability: 0.55 },
    { next: "remediation", probability: 0.45 },
  ],
  closed: [{ next: "closed", probability: 1.0 }],
};

function markovTransition(currentState: string, transitions: Record<string, Array<{ next: string; probability: number }>>): string {
  const options = transitions[currentState];
  if (!options) return currentState;
  const r = Math.random();
  let cumulative = 0;
  for (const opt of options) {
    cumulative += opt.probability;
    if (r <= cumulative) return opt.next;
  }
  return currentState;
}

// ---------------------------------------------------------------------------
// Simulation Engine Core
// ---------------------------------------------------------------------------

class SimulationEngine extends EventEmitter {
  private config: SimulationConfig = {
    tickIntervalMs: 5000,
    timeAcceleration: 1,
    scenario: "normal_operations",
    running: false,
  };

  private tickCount = 0;
  private startedAt: Date = new Date();
  private timer: ReturnType<typeof setInterval> | null = null;

  // Entity pools
  threats: Map<string, SimulatedThreat> = new Map();
  alerts: SimulatedAlert[] = [];
  vessels: Map<string, SimulatedVessel> = new Map();
  vesselEvents: SimulatedVesselEvent[] = [];
  properties: Map<string, SimulatedProperty> = new Map();
  lyteSignals: SimulatedSignal[] = [];
  lyteIncidents: Map<string, SimulatedIncident> = new Map();
  holdings: Map<string, SimulatedHolding> = new Map();
  portfolioHistory: SimulatedPortfolioMetric[] = [];
  correlationEvents: CorrelationEvent[] = [];

  // Domain event counters
  private domainStats = {
    aegis: { entities: 0, events: 0 },
    vessels: { entities: 0, events: 0 },
    terra: { entities: 0, events: 0 },
    lyte: { entities: 0, events: 0 },
    szl: { entities: 0, events: 0 },
  };

  constructor() {
    super();
    this.initializeEntities();
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  private initializeEntities(): void {
    this.initVessels();
    this.initThreats();
    this.initProperties();
    this.initHoldings();
    this.initLyteSignals();
  }

  private initVessels(): void {
    VESSEL_NAMES.forEach((name, i) => {
      const routeIdx = i % SHIPPING_ROUTES.length;
      const route = SHIPPING_ROUTES[routeIdx];
      const progress = seededRand(i, 1) * 0.8;
      const waypointIdx = Math.floor(progress * (route.waypoints.length - 1));
      const localT = (progress * (route.waypoints.length - 1)) - waypointIdx;
      const wpFrom = route.waypoints[Math.min(waypointIdx, route.waypoints.length - 2)];
      const wpTo = route.waypoints[Math.min(waypointIdx + 1, route.waypoints.length - 1)];
      const pos = interpolateGreatCircle(wpFrom, wpTo, localT);

      const vtype = VESSEL_TYPES[i % VESSEL_TYPES.length];
      const destIdx = Math.floor(seededRand(i, 3) * DESTINATIONS.length);

      this.vessels.set(`vessel-${i + 1}`, {
        id: `vessel-${i + 1}`,
        name,
        imo: `IMO${9000000 + i * 127 + 3}`,
        mmsi: `${210000000 + i * 8931 + 7}`,
        vesselType: vtype,
        flag: VESSEL_FLAGS[i % VESSEL_FLAGS.length],
        status: seededRand(i, 99) < 0.7 ? "at_sea" : "in_port",
        latitude: pos.lat + (seededRand(i, 50) - 0.5) * 0.1,
        longitude: pos.lon + (seededRand(i, 51) - 0.5) * 0.1,
        heading: Math.floor(seededRand(i, 52) * 360),
        speed: 8 + seededRand(i, 53) * 10,
        destination: DESTINATIONS[destIdx],
        eta: new Date(Date.now() + (3 + seededRand(i, 60) * 14) * 86400000).toISOString(),
        routeProgress: progress,
        routeWaypoints: route.waypoints,
        financialExposureUsd: 5000000 + seededRand(i, 70) * 20000000,
        lastUpdated: new Date().toISOString(),
      });
    });
    this.domainStats.vessels.entities = this.vessels.size;
  }

  private initThreats(): void {
    const scenarioThreats = [
      { title: "Lateral movement detected on DC-PROD-03", severity: "critical" as const, phase: 8 },
      { title: "C2 beacon traffic to known APT29 infrastructure", severity: "critical" as const, phase: 10 },
      { title: "Ransomware precursor — shadow copy deletion", severity: "critical" as const, phase: 6 },
      { title: "Credential dump via Mimikatz on WORKSTATION-089", severity: "high" as const, phase: 7 },
      { title: "Brute force on VPN gateway — 847 failed logins", severity: "high" as const, phase: 2 },
      { title: "Data exfiltration: 2.3GB to external S3 bucket", severity: "critical" as const, phase: 10 },
    ];

    scenarioThreats.forEach((t, i) => {
      const chain = MITRE_KILL_CHAIN[t.phase - 1] ?? MITRE_KILL_CHAIN[0];
      const id = `threat-${i + 1}`;
      this.threats.set(id, {
        id,
        title: t.title,
        severity: t.severity,
        status: "containment",
        attackTechnique: chain.techniques[i % chain.techniques.length],
        tactic: chain.tactics[0],
        killChainPhase: t.phase,
        confidence: 80 + Math.floor(seededRand(i, 10) * 20),
        affectedAssets: [`WORKSTATION-${100 + i}`, `prod-api-gateway-0${i % 3 + 1}`],
        detectedAt: new Date(Date.now() - (1 + i) * 3600000).toISOString(),
        lastUpdated: new Date().toISOString(),
        progressPct: 30 + seededRand(i, 11) * 60,
      });
    });
    this.domainStats.aegis.entities = this.threats.size;
  }

  private initProperties(): void {
    for (let i = 0; i < 12; i++) {
      const id = `dp-sim-${String(i + 1).padStart(3, "0")}`;
      const borough = BOROUGH_LIST[i % BOROUGH_LIST.length];
      const ptype = PROPERTY_TYPES[i % PROPERTY_TYPES.length];
      const dType = DISTRESS_TYPES[i % DISTRESS_TYPES.length];
      const mPhase = MARKET_PHASES[i % MARKET_PHASES.length];

      this.properties.set(id, {
        id,
        address: `${100 + i * 47} ${["Broadway", "Park Ave", "Atlantic Ave", "Fulton St", "Jamaica Ave"][i % 5]}`,
        borough,
        propertyType: ptype,
        distressScore: 45 + seededRand(i, 20) * 50,
        opportunityScore: 55 + seededRand(i, 21) * 40,
        estimatedValueUsd: 1000000 + seededRand(i, 22) * 8000000,
        daysInDistress: 30 + Math.floor(seededRand(i, 23) * 300),
        distressType: dType,
        marketCyclePhase: mPhase,
        lastUpdated: new Date().toISOString(),
      });
    }
    this.domainStats.terra.entities = this.properties.size;
  }

  private initHoldings(): void {
    HOLDINGS.forEach((h) => {
      this.holdings.set(h.id, {
        id: h.id,
        name: h.name,
        sector: h.sector,
        valueUsd: h.baseValue * (0.95 + Math.random() * 0.1),
        dailyChangePct: (Math.random() - 0.48) * 3,
        volatility: 0.08 + Math.random() * 0.15,
        beta: h.beta,
        lastUpdated: new Date().toISOString(),
      });
    });

    const nav = Array.from(this.holdings.values()).reduce((sum, h) => sum + h.valueUsd, 0);
    this.portfolioHistory.push({
      timestamp: new Date().toISOString(),
      nav,
      navChange: 0,
      navChangePct: 0,
      liquidityRatio: 0.18,
      riskScore: 6.2,
      exposureUsd: nav * 0.65,
    });
    this.domainStats.szl.entities = this.holdings.size;
  }

  private initLyteSignals(): void {
    const initialSignals = [
      { source: "AWS CloudWatch", severity: "critical" as const, title: "RDS Primary (prod-db-01) replication lag 142s — payment pipeline at risk" },
      { source: "PagerDuty", severity: "critical" as const, title: "P1 Escalation: Stripe webhook queue depth 14.2k — checkout returning 500" },
      { source: "Datadog APM", severity: "high" as const, title: "API Gateway p99 latency 7.8s (SLO: 500ms) — 3 upstream services degraded" },
      { source: "Sentry", severity: "high" as const, title: "TypeError at auth-service v3.14.2 — 2.8k events/hr, SSO impacted" },
    ];

    initialSignals.forEach((s, i) => {
      const id = generateId("sig");
      this.lyteSignals.unshift({
        id,
        source: s.source,
        sourceType: "monitoring",
        severity: s.severity,
        title: s.title,
        status: i < 2 ? "new" : "acknowledged",
        receivedAt: new Date(Date.now() - (i + 1) * 300000).toISOString(),
      });
    });
    this.domainStats.lyte.entities = this.lyteSignals.length;
  }

  // ---------------------------------------------------------------------------
  // Simulation Loop
  // ---------------------------------------------------------------------------

  start(): void {
    if (this.config.running) return;
    this.config.running = true;
    this.startedAt = new Date();
    this.timer = setInterval(() => this.tick(), this.config.tickIntervalMs);
    logger.info({ scenario: this.config.scenario }, "[simulation] Engine started");
  }

  stop(): void {
    if (!this.config.running) return;
    this.config.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    logger.info("[simulation] Engine stopped");
  }

  setScenario(scenario: ScenarioPreset): void {
    this.config.scenario = scenario;
    logger.info({ scenario }, "[simulation] Scenario changed");
    this.emit("scenarioChanged", scenario);
  }

  setTimeAcceleration(multiplier: number): void {
    this.config.timeAcceleration = Math.max(1, Math.min(100, multiplier));
  }

  private tick(): void {
    this.tickCount++;
    const params = SCENARIO_PARAMS[this.config.scenario];
    const effectiveDt = this.config.tickIntervalMs * this.config.timeAcceleration;

    this.tickVessels(params, effectiveDt);
    this.tickAegis(params, effectiveDt);
    this.tickLyte(params, effectiveDt);
    this.tickTerra(params, effectiveDt);
    this.tickSzlHoldings(params, effectiveDt);

    this.emit("tick", {
      tickCount: this.tickCount,
      scenario: this.config.scenario,
      timestamp: new Date().toISOString(),
    });
  }

  // ---------------------------------------------------------------------------
  // Domain: Vessels
  // ---------------------------------------------------------------------------

  private tickVessels(params: ScenarioParams, dtMs: number): void {
    const dtHours = dtMs / 3600000;

    this.vessels.forEach((vessel) => {
      if (vessel.status === "in_port") return;

      const routeLen = vessel.routeWaypoints.length;
      if (routeLen < 2) return;

      const progressIncrement = (dtHours / (vessel.routeWaypoints.length * 48)) * (0.8 + Math.random() * 0.4);
      const weatherPerturbation = (Math.random() - 0.5) * 0.002 * params.routeDeviationProbability;
      vessel.routeProgress = Math.min(1.0, vessel.routeProgress + progressIncrement + weatherPerturbation);

      const waypointF = vessel.routeProgress * (routeLen - 1);
      const wpIdx = Math.min(Math.floor(waypointF), routeLen - 2);
      const localT = waypointF - wpIdx;
      const wpFrom = vessel.routeWaypoints[wpIdx];
      const wpTo = vessel.routeWaypoints[wpIdx + 1];

      if (wpFrom && wpTo) {
        const pos = interpolateGreatCircle(wpFrom, wpTo, localT);
        const noise = (Math.random() - 0.5) * 0.05;
        vessel.latitude = pos.lat + noise;
        vessel.longitude = pos.lon + noise;

        const dLat = wpTo.lat - wpFrom.lat;
        const dLon = wpTo.lon - wpFrom.lon;
        vessel.heading = Math.round(((Math.atan2(dLon, dLat) * 180) / Math.PI + 360) % 360);
      }

      vessel.speed = (8 + Math.random() * 8) * (params.infraLoadBaseline < 0.7 ? 1 : 0.85);

      const nowMs = Date.now();
      const remainingProgress = 1.0 - vessel.routeProgress;
      const etaHours = (remainingProgress * vessel.routeWaypoints.length * 48) / vessel.speed;
      vessel.eta = new Date(nowMs + etaHours * 3600000).toISOString();

      if (vessel.routeProgress >= 1.0) {
        vessel.routeProgress = 0;
        vessel.destination = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
        vessel.activeException = undefined;
      }

      // AIS blackout
      if (vessel.status !== "ais_dark" && Math.random() < params.aisBlackoutProbability) {
        vessel.status = "ais_dark";
        vessel.activeException = "AIS-dark";
        this.onAisBlackout(vessel, params);
      } else if (vessel.status === "ais_dark" && Math.random() < 0.15) {
        vessel.status = "at_sea";
        vessel.activeException = undefined;
      }

      vessel.lastUpdated = new Date().toISOString();
    });

    // Possibly generate vessel exception event
    if (Math.random() < params.vesselExceptionRate * 0.1) {
      this.generateVesselExceptionEvent(params);
    }

    // Trim old events
    if (this.vesselEvents.length > 100) {
      this.vesselEvents = this.vesselEvents.slice(-80);
    }
  }

  private onAisBlackout(vessel: SimulatedVessel, params: ScenarioParams): void {
    const event: SimulatedVesselEvent = {
      id: generateId("vev"),
      vesselId: vessel.id,
      vesselName: vessel.name,
      type: "ais_dark",
      severity: "critical",
      title: `${vessel.name} — AIS Signal Lost`,
      description: `Vessel ${vessel.name} AIS transponder dark. Last position: ${vessel.latitude.toFixed(4)}, ${vessel.longitude.toFixed(4)}.`,
      timestamp: new Date().toISOString(),
      impactUsd: vessel.financialExposureUsd,
      crossDomainTriggered: false,
    };
    this.vesselEvents.unshift(event);
    this.domainStats.vessels.events++;

    if (Math.random() < params.aisToSecurityProbability) {
      this.triggerVesselToSecurity(vessel, event);
    }
    if (Math.random() < params.aisToFinancialProbability) {
      this.triggerVesselToFinancial(vessel, event);
    }
  }

  private generateVesselExceptionEvent(params: ScenarioParams): void {
    const vessels = Array.from(this.vessels.values());
    if (vessels.length === 0) return;
    const vessel = vessels[Math.floor(Math.random() * vessels.length)];
    const exTypes: SimulatedVesselEvent["type"][] = ["eta_change", "route_deviation", "maintenance_alert", "position_update"];
    const exType = exTypes[Math.floor(Math.random() * exTypes.length)];
    const severities: SimulatedVesselEvent["severity"][] = ["high", "watch", "info", "info"];
    const sev = weightedRandom(severities, [0.2, 0.3, 0.3, 0.2]);

    const hours = Math.floor(Math.random() * 48);
    const event: SimulatedVesselEvent = {
      id: generateId("vev"),
      vesselId: vessel.id,
      vesselName: vessel.name,
      type: exType,
      severity: sev,
      title: exType === "eta_change"
        ? `${vessel.name} — ETA revised +${hours}h`
        : exType === "route_deviation"
        ? `${vessel.name} — Route deviation detected`
        : exType === "maintenance_alert"
        ? `${vessel.name} — Predictive maintenance alert`
        : `${vessel.name} — Position update`,
      description: `Simulation-generated ${exType} event for ${vessel.name}. Speed: ${vessel.speed.toFixed(1)}kt.`,
      timestamp: new Date().toISOString(),
      impactUsd: sev === "high" ? Math.floor(Math.random() * 500000) : undefined,
    };
    this.vesselEvents.unshift(event);
    this.domainStats.vessels.events++;
  }

  // ---------------------------------------------------------------------------
  // Domain: Aegis (Threats)
  // ---------------------------------------------------------------------------

  private tickAegis(params: ScenarioParams, _dtMs: number): void {
    const newThreatCount = poissonSample(params.threatArrivalRate);

    for (let i = 0; i < newThreatCount; i++) {
      this.generateNewThreat(params);
    }

    const newAlertCount = poissonSample(params.alertArrivalRate);
    for (let i = 0; i < newAlertCount; i++) {
      this.generateNewAlert(params);
    }

    this.threats.forEach((threat) => {
      if (threat.status === "closed") return;

      const newStatus = markovTransition(threat.status, THREAT_STATE_TRANSITIONS) as SimulatedThreat["status"];
      if (newStatus !== threat.status) {
        threat.status = newStatus;
        threat.lastUpdated = new Date().toISOString();
        this.domainStats.aegis.events++;

        if (newStatus === "closed" && Math.random() < params.cyberToLegalProbability) {
          this.triggerCyberToLegal(threat);
        }
      }

      if (threat.status !== "closed") {
        threat.killChainPhase = Math.min(10, threat.killChainPhase + (Math.random() < 0.08 ? 1 : 0));
        const chain = MITRE_KILL_CHAIN[threat.killChainPhase - 1];
        if (chain) {
          threat.tactic = chain.tactics[0];
          threat.attackTechnique = chain.techniques[Math.floor(Math.random() * chain.techniques.length)];
        }
        threat.progressPct = Math.min(100, threat.progressPct + (Math.random() - 0.3) * 3);
        threat.confidence = Math.min(100, Math.max(60, threat.confidence + (Math.random() - 0.5) * 2));
      }
    });

    // Cull old closed threats (keep pool manageable)
    const closed = Array.from(this.threats.entries()).filter(([, t]) => t.status === "closed");
    if (closed.length > 10) {
      const toRemove = closed.slice(0, closed.length - 10);
      toRemove.forEach(([id]) => this.threats.delete(id));
    }

    // Trim alerts
    if (this.alerts.length > 150) {
      this.alerts = this.alerts.slice(0, 100);
    }

    this.domainStats.aegis.entities = this.threats.size;
  }

  private generateNewThreat(params: ScenarioParams): void {
    const severities: SimulatedThreat["severity"][] = ["critical", "high", "medium", "low"];
    const severity = weightedRandom(severities, params.threatSeverityWeights);
    const phaseIdx = Math.floor(Math.random() * MITRE_KILL_CHAIN.length);
    const chain = MITRE_KILL_CHAIN[phaseIdx];
    const id = generateId("thr");

    this.threats.set(id, {
      id,
      title: SECURITY_ALERT_TEMPLATES[Math.floor(Math.random() * SECURITY_ALERT_TEMPLATES.length)]
        .replace("{ip}", randomIP())
        .replace("{value}", String(Math.floor(Math.random() * 1000)))
        .replace("{n}", String(Math.floor(Math.random() * 5) + 1)),
      severity,
      status: "new",
      attackTechnique: chain.techniques[Math.floor(Math.random() * chain.techniques.length)],
      tactic: chain.tactics[0],
      killChainPhase: phaseIdx + 1,
      confidence: 60 + Math.floor(Math.random() * 40),
      affectedAssets: [`prod-asset-${Math.floor(Math.random() * 50)}`],
      detectedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      progressPct: 5 + Math.random() * 25,
    });
    this.domainStats.aegis.events++;
  }

  private generateNewAlert(params: ScenarioParams): void {
    const severities: SimulatedAlert["severity"][] = ["critical", "high", "medium", "low", "info"];
    const severity = weightedRandom(severities, [...params.alertSeverityWeights, 0.18]);
    const src = INFRA_SOURCES[Math.floor(Math.random() * INFRA_SOURCES.length)];
    const id = generateId("alt");

    this.alerts.unshift({
      id,
      source: src.source,
      severity,
      title: SECURITY_ALERT_TEMPLATES[Math.floor(Math.random() * SECURITY_ALERT_TEMPLATES.length)]
        .replace("{ip}", randomIP())
        .replace("{value}", String(Math.floor(Math.random() * 1000)))
        .replace("{n}", String(Math.floor(Math.random() * 5) + 1)),
      status: "new",
      receivedAt: new Date().toISOString(),
    });
    this.domainStats.aegis.events++;
  }

  // ---------------------------------------------------------------------------
  // Domain: Lyte (Infrastructure)
  // ---------------------------------------------------------------------------

  private tickLyte(params: ScenarioParams, _dtMs: number): void {
    const newSignalCount = poissonSample(params.infraSignalRate);

    for (let i = 0; i < newSignalCount; i++) {
      this.generateLyteSignal(params);
    }

    const loadPct = sinusoidalLoad(params.infraLoadBaseline, this.tickCount, 288, 0.15);

    // Update signal statuses (age them out)
    const now = Date.now();
    this.lyteSignals = this.lyteSignals.map((sig) => {
      const ageMs = now - new Date(sig.receivedAt).getTime();
      if (sig.status === "new" && ageMs > 300000 && Math.random() < 0.08) {
        return { ...sig, status: "acknowledged" as const };
      }
      if (sig.status === "acknowledged" && ageMs > 1800000 && Math.random() < 0.06) {
        return { ...sig, status: "resolved" as const };
      }
      return { ...sig, loadPct };
    });

    // Trim
    if (this.lyteSignals.length > 200) {
      this.lyteSignals = this.lyteSignals.slice(0, 150);
    }

    // Cascade failure
    if (Math.random() < params.cascadeFailureProbability) {
      const critCount = this.lyteSignals.filter((s) => s.severity === "critical" && s.status === "new").length;
      if (critCount >= 2) {
        this.generateCascadeIncident(params);
      }
    }

    this.domainStats.lyte.entities = this.lyteSignals.length;
  }

  private generateLyteSignal(params: ScenarioParams): void {
    const severities: SimulatedSignal["severity"][] = ["critical", "high", "medium", "low", "info"];
    const weights: number[] = [...params.alertSeverityWeights, 0.18];
    const severity = weightedRandom(severities, weights);
    const src = INFRA_SOURCES[Math.floor(Math.random() * INFRA_SOURCES.length)];
    const template = INFRA_SIGNAL_TEMPLATES[Math.floor(Math.random() * INFRA_SIGNAL_TEMPLATES.length)];
    const id = generateId("sig");

    const loadPct = Math.round(sinusoidalLoad(params.infraLoadBaseline, this.tickCount, 288, 0.15) * 100);

    this.lyteSignals.unshift({
      id,
      source: src.source,
      sourceType: src.sourceType,
      severity,
      title: template
        .replace("{value}", String(Math.floor(Math.random() * 1000)))
        .replace("{load}", String(loadPct))
        .replace("{n}", String(Math.floor(Math.random() * 5) + 1)),
      status: "new",
      receivedAt: new Date().toISOString(),
      loadPct,
    });
    this.domainStats.lyte.events++;
  }

  private generateCascadeIncident(params: ScenarioParams): void {
    const id = generateId("inc");
    const assignee = ANALYSTS[Math.floor(Math.random() * ANALYSTS.length)];
    const incident: SimulatedIncident = {
      id,
      title: `Cascade Failure — ${Math.floor(Math.random() * 3) + 2} services degraded`,
      severity: "critical",
      status: "investigating",
      assignee,
      createdAt: new Date().toISOString(),
      financialImpactUsd: Math.floor(10000 + Math.random() * 90000),
    };
    this.lyteIncidents.set(id, incident);

    const lyteSig: SimulatedSignal = {
      id: generateId("sig"),
      source: "Lyte AIOps",
      sourceType: "aiops",
      severity: "critical",
      title: `Cascade incident auto-detected — ${Array.from(this.lyteIncidents.size > 5 ? [id] : [id]).length} active`,
      status: "new",
      receivedAt: new Date().toISOString(),
      crossDomainTriggered: true,
    };
    this.lyteSignals.unshift(lyteSig);
    this.domainStats.lyte.events++;
  }

  // ---------------------------------------------------------------------------
  // Domain: Terra (Properties)
  // ---------------------------------------------------------------------------

  private tickTerra(params: ScenarioParams, dtMs: number): void {
    const dtDays = dtMs / (1000 * 86400);
    const marketPhase = MARKET_PHASES[this.tickCount % MARKET_PHASES.length];

    this.properties.forEach((prop) => {
      prop.daysInDistress += dtDays;

      const distressStep = brownianMotionStep(
        prop.distressScore,
        params.distressScoreVolatility,
        0,
        100,
      );
      prop.distressScore = distressStep;

      // Opportunity score inversely correlates with distress extremes
      const distressDelta = Math.abs(prop.distressScore - 50);
      prop.opportunityScore = brownianMotionStep(
        Math.min(95, Math.max(30, 80 - distressDelta * 0.3 + Math.random() * 10)),
        params.distressScoreVolatility * 0.5,
        20,
        99,
      );

      const marketMultiplier =
        marketPhase === "expansion" ? 1.002 :
        marketPhase === "recession" ? 0.999 :
        1.0;
      prop.estimatedValueUsd *= marketMultiplier;
      prop.marketCyclePhase = marketPhase;
      prop.lastUpdated = new Date().toISOString();
    });

    this.domainStats.terra.entities = this.properties.size;
  }

  // ---------------------------------------------------------------------------
  // Domain: SZL Holdings (Portfolio)
  // ---------------------------------------------------------------------------

  private tickSzlHoldings(params: ScenarioParams, dtMs: number): void {
    const prevNav = this.portfolioHistory.length > 0
      ? this.portfolioHistory[this.portfolioHistory.length - 1].nav
      : Array.from(this.holdings.values()).reduce((s, h) => s + h.valueUsd, 0);

    this.holdings.forEach((holding) => {
      const updatedValue = geometricBrownianMotionStep(
        holding.valueUsd,
        params.gbmDrift * holding.beta,
        params.gbmVolatility * holding.beta,
        dtMs / 1000,
      );

      const dailyChangePct = ((updatedValue - holding.valueUsd) / holding.valueUsd) * 100;
      holding.valueUsd = updatedValue;
      holding.dailyChangePct = dailyChangePct;
      holding.lastUpdated = new Date().toISOString();
    });

    // Market crash shock
    if (Math.random() < params.marketCrashProbability) {
      this.holdings.forEach((holding) => {
        holding.valueUsd *= 0.94 + Math.random() * 0.04;
      });
    }

    const nav = Array.from(this.holdings.values()).reduce((s, h) => s + h.valueUsd, 0);
    const navChange = nav - prevNav;
    const navChangePct = prevNav > 0 ? (navChange / prevNav) * 100 : 0;

    const loadFactor = sinusoidalLoad(params.infraLoadBaseline, this.tickCount, 144, 0.1);
    const riskScore = Math.min(10, Math.max(1, 5 + (params.gbmVolatility - 0.01) * 200 + loadFactor * 2));

    this.portfolioHistory.push({
      timestamp: new Date().toISOString(),
      nav,
      navChange,
      navChangePct,
      liquidityRatio: 0.12 + Math.random() * 0.12,
      riskScore,
      exposureUsd: nav * (0.55 + Math.random() * 0.15),
    });

    if (this.portfolioHistory.length > 288) {
      this.portfolioHistory = this.portfolioHistory.slice(-200);
    }

    this.domainStats.szl.entities = this.holdings.size;
    this.domainStats.szl.events++;
  }

  // ---------------------------------------------------------------------------
  // Cross-Domain Correlation Engine
  // ---------------------------------------------------------------------------

  private triggerVesselToSecurity(vessel: SimulatedVessel, vesselEvent: SimulatedVesselEvent): void {
    const correlationId = generateId("corr");
    const correlationEvent: CorrelationEvent = {
      id: correlationId,
      type: "vessel_ais_dark_to_security",
      sourceDomain: "vessels",
      targetDomain: "aegis",
      sourceEntityId: vessel.id,
      payload: {
        vesselName: vessel.name,
        vesselId: vessel.id,
        imo: vessel.imo,
        lastLat: vessel.latitude,
        lastLon: vessel.longitude,
        financialExposure: vessel.financialExposureUsd,
      },
      triggeredAt: new Date().toISOString(),
    };
    this.correlationEvents.unshift(correlationEvent);

    const threat: SimulatedThreat = {
      id: generateId("thr"),
      title: `Maritime Security Alert — ${vessel.name} AIS-dark — Vessel cyber-physical threat`,
      severity: "high",
      status: "triage",
      attackTechnique: "T1562.007",
      tactic: "TA0005",
      killChainPhase: 3,
      confidence: 72 + Math.floor(Math.random() * 22),
      affectedAssets: [vessel.name, vessel.imo],
      detectedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      progressPct: 15,
      correlatedVesselId: vessel.id,
    };
    this.threats.set(threat.id, threat);

    this.alerts.unshift({
      id: generateId("alt"),
      source: "Vessels Maritime AI",
      severity: "critical",
      title: `[CROSS-DOMAIN] ${vessel.name} AIS-dark — maritime cyber indicator — corr:${correlationId}`,
      status: "new",
      receivedAt: new Date().toISOString(),
    });

    vesselEvent.crossDomainTriggered = true;
    this.domainStats.aegis.events++;

    logger.debug({ correlationId, vesselId: vessel.id }, "[simulation] AIS-dark → Security alert");
  }

  private triggerVesselToFinancial(vessel: SimulatedVessel, _vesselEvent: SimulatedVesselEvent): void {
    const correlationId = generateId("corr");
    const correlationEvent: CorrelationEvent = {
      id: correlationId,
      type: "vessel_ais_dark_to_financial",
      sourceDomain: "vessels",
      targetDomain: "szl",
      sourceEntityId: vessel.id,
      payload: {
        vesselName: vessel.name,
        exposureUsd: vessel.financialExposureUsd,
      },
      triggeredAt: new Date().toISOString(),
    };
    this.correlationEvents.unshift(correlationEvent);

    const maritimeHolding = this.holdings.get("h-001");
    if (maritimeHolding) {
      const shockFactor = 0.97 + Math.random() * 0.02;
      maritimeHolding.valueUsd *= shockFactor;
      maritimeHolding.dailyChangePct = ((shockFactor - 1) * 100);
      maritimeHolding.lastUpdated = new Date().toISOString();
    }

    this.domainStats.szl.events++;
    logger.debug({ correlationId, vesselId: vessel.id }, "[simulation] AIS-dark → Financial exposure");
  }

  private triggerCyberToLegal(threat: SimulatedThreat): void {
    const correlationId = generateId("corr");
    const correlationEvent: CorrelationEvent = {
      id: correlationId,
      type: "cyber_breach_to_legal",
      sourceDomain: "aegis",
      targetDomain: "prism",
      sourceEntityId: threat.id,
      payload: {
        threatTitle: threat.title,
        severity: threat.severity,
        technique: threat.attackTechnique,
        kilChainPhase: threat.killChainPhase,
      },
      triggeredAt: new Date().toISOString(),
    };
    this.correlationEvents.unshift(correlationEvent);

    const lyteSig: SimulatedSignal = {
      id: generateId("sig"),
      source: "PRISM Counsel",
      sourceType: "legal",
      severity: "high",
      title: `[CROSS-DOMAIN] Legal matter auto-filed — cyber incident ${threat.id} — corr:${correlationId}`,
      status: "new",
      receivedAt: new Date().toISOString(),
      crossDomainTriggered: true,
    };
    this.lyteSignals.unshift(lyteSig);
    threat.correlatedLegalMatterId = correlationId;

    this.domainStats.lyte.events++;
    logger.debug({ correlationId, threatId: threat.id }, "[simulation] Cyber breach → Legal matter");
  }

  // ---------------------------------------------------------------------------
  // Public Data Access (for routes/seed files)
  // ---------------------------------------------------------------------------

  getStats(): SimulationStats {
    return {
      tickCount: this.tickCount,
      startedAt: this.startedAt.toISOString(),
      uptime: Date.now() - this.startedAt.getTime(),
      scenario: this.config.scenario,
      config: { ...this.config },
      domainStats: { ...this.domainStats },
    };
  }

  getVessels(): SimulatedVessel[] {
    return Array.from(this.vessels.values());
  }

  getVesselEvents(limit = 50): SimulatedVesselEvent[] {
    return this.vesselEvents.slice(0, limit);
  }

  getThreats(): SimulatedThreat[] {
    return Array.from(this.threats.values());
  }

  getAlerts(limit = 100): SimulatedAlert[] {
    return this.alerts.slice(0, limit);
  }

  getLyteSignals(limit = 50): SimulatedSignal[] {
    return this.lyteSignals.slice(0, limit);
  }

  getLyteIncidents(): SimulatedIncident[] {
    return Array.from(this.lyteIncidents.values());
  }

  getProperties(): SimulatedProperty[] {
    return Array.from(this.properties.values());
  }

  getHoldings(): SimulatedHolding[] {
    return Array.from(this.holdings.values());
  }

  getPortfolioHistory(points = 100): SimulatedPortfolioMetric[] {
    return this.portfolioHistory.slice(-points);
  }

  getCorrelationEvents(limit = 30): CorrelationEvent[] {
    return this.correlationEvents.slice(0, limit);
  }

  getScenarios(): Array<{ id: ScenarioPreset; label: string; description: string; active: boolean }> {
    return (Object.keys(SCENARIO_PARAMS) as ScenarioPreset[]).map((key) => ({
      id: key,
      label: SCENARIO_PARAMS[key].label,
      description: SCENARIO_PARAMS[key].description,
      active: key === this.config.scenario,
    }));
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const simulationEngine = new SimulationEngine();

const DEMO_MODE = process.env["DEMO_MODE"] === "true" || process.env["DEMO_MODE"] === "1";

if (DEMO_MODE) {
  simulationEngine.start();
  logger.info("[simulation] Auto-started in DEMO_MODE");
}

export default simulationEngine;
