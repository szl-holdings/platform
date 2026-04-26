import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Code,
  Copy,
  Database,
  Download,
  Eye,
  Filter,
  FlaskConical,
  GitBranch,
  Globe,
  Info,
  Layers,
  Link2,
  Lock,
  Network,
  Play,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Sigma,
  Sparkles,
  Terminal,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';

const ACCENT = '#d4a054';
const BG = '#080c14';
const CARD = 'rgba(255,255,255,0.03)';
const CARD_HOVER = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.07)';
const FG = '#e2e8f0';
const FG_MUT = '#64748b';
const FG_DIM = 'rgba(255,255,255,0.4)';

const BASE = (import.meta.env.BASE_URL ?? '/command/').replace(/\/$/, '');
function apiUrl(path: string) {
  return `${BASE}/api${path}`;
}
function fetchJson<T>(url: string): Promise<T> {
  return fetch(url, { credentials: 'include' }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<T>;
  });
}

const POLICY_TIER_COLORS: Record<string, string> = {
  'advisory-only': '#22c55e',
  'internal-workflow': '#3b82f6',
  'operator-assisted': '#8b5cf6',
  'executive-facing': '#f59e0b',
  'regulated-workflow': '#ef4444',
  'external-client-facing': '#ec4899',
  'autonomous-reversible': '#14b8a6',
  'human-approval-mandatory': '#dc2626',
};

const DOMAIN_COLORS: Record<string, string> = {
  security: '#ef4444',
  finance: '#22c55e',
  analytics: '#3b82f6',
  data: '#8b5cf6',
  communication: '#f59e0b',
  infrastructure: '#14b8a6',
  legal: '#ec4899',
  custom: '#64748b',
  vessels: '#4d8fcc',
  terra: '#22c55e',
  counsel: '#a78bfa',
};

interface ToolExecution {
  id: string;
  toolId: string;
  toolName: string;
  agent: string;
  domain: string;
  policyTier: string;
  outcome: 'allow' | 'deny' | 'require-approval' | 'require-dual-approval';
  confidence: number;
  latencyMs: number;
  timestamp: string;
  traceId?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  governanceSteps?: GovernanceStep[];
  prevHash?: string;
  currentHash?: string;
}

interface GovernanceStep {
  name: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  detail: string;
  durationMs: number;
}

interface ToolCatalogEntry {
  id: string;
  name: string;
  description: string;
  domain: string;
  policyTier: string;
  approvalRequired: boolean;
  rateLimits: { requestsPerMinute?: number; concurrency?: number };
  timeoutMs: number;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  enabled: boolean;
  version: string;
  executions24h: number;
  successRate: number;
  avgLatencyMs: number;
  failureModes: Array<{ type: string; retryable: boolean }>;
}

const DEMO_EXECUTIONS: ToolExecution[] = [
  {
    id: 'exec-001',
    toolId: 'security.threat-scan',
    toolName: 'Threat Scanner',
    agent: 'cortex-security-v3',
    domain: 'security',
    policyTier: 'regulated-workflow',
    outcome: 'allow',
    confidence: 0.94,
    latencyMs: 1240,
    timestamp: new Date(Date.now() - 12000).toISOString(),
    traceId: 'trace-a1b2c3',
    prevHash: 'genesis',
    currentHash: 'a1b2c3d4e5f6',
    input: { targetId: 'host-prod-07', targetType: 'host', depth: 'deep' },
    output: { scanId: 'scan-001', threatCount: 3, riskScore: 72 },
    governanceSteps: [
      { name: 'Schema Validation', status: 'pass', detail: 'Input matched required fields', durationMs: 2 },
      { name: 'PII Scan', status: 'pass', detail: 'No PII detected in input payload', durationMs: 8 },
      { name: 'Injection Check', status: 'pass', detail: 'No injection patterns found', durationMs: 5 },
      { name: 'Policy Engine', status: 'pass', detail: 'Regulated-workflow tier authorized', durationMs: 14 },
      { name: 'Guardian Decision', status: 'pass', detail: 'Allow — scope certificate valid', durationMs: 9 },
      { name: 'Rate Limit', status: 'pass', detail: '3/10 req/min used', durationMs: 1 },
      { name: 'Execution', status: 'pass', detail: 'Tool executed successfully in 1240ms', durationMs: 1240 },
      { name: 'Output Validation', status: 'pass', detail: 'Output matched declared schema', durationMs: 3 },
      { name: 'Audit Chain', status: 'pass', detail: 'Entry appended — hash a1b2c3d4', durationMs: 2 },
    ],
  },
  {
    id: 'exec-002',
    toolId: 'finance.fund-transfer',
    toolName: 'Fund Transfer',
    agent: 'treasury-agent-v2',
    domain: 'finance',
    policyTier: 'human-approval-mandatory',
    outcome: 'require-approval',
    confidence: 0.99,
    latencyMs: 45,
    timestamp: new Date(Date.now() - 34000).toISOString(),
    traceId: 'trace-b2c3d4',
    prevHash: 'a1b2c3d4e5f6',
    currentHash: 'b2c3d4e5f6a7',
    input: { fromAccountId: 'acc-treasury-01', toAccountId: 'acc-ops-03', amount: 250000, currency: 'USD' },
    governanceSteps: [
      { name: 'Schema Validation', status: 'pass', detail: 'All required fields present', durationMs: 2 },
      { name: 'PII Scan', status: 'warn', detail: 'Account IDs flagged as sensitive fields', durationMs: 11 },
      { name: 'Injection Check', status: 'pass', detail: 'Clean', durationMs: 4 },
      { name: 'Policy Engine', status: 'pass', detail: 'Human-approval-mandatory tier detected', durationMs: 12 },
      { name: 'Guardian Decision', status: 'fail', detail: 'Approval required — approvalRequired=true on manifest', durationMs: 7 },
      { name: 'Rate Limit', status: 'skip', detail: 'Skipped — blocked before execution', durationMs: 0 },
      { name: 'Execution', status: 'skip', detail: 'Pending human approval', durationMs: 0 },
      { name: 'Output Validation', status: 'skip', detail: 'N/A', durationMs: 0 },
      { name: 'Audit Chain', status: 'pass', detail: 'Block recorded — hash b2c3d4e5', durationMs: 2 },
    ],
  },
  {
    id: 'exec-003',
    toolId: 'analytics.metrics-query',
    toolName: 'Metrics Query',
    agent: 'lumina-analytics-v4',
    domain: 'analytics',
    policyTier: 'internal-workflow',
    outcome: 'allow',
    confidence: 0.87,
    latencyMs: 380,
    timestamp: new Date(Date.now() - 67000).toISOString(),
    traceId: 'trace-c3d4e5',
    prevHash: 'b2c3d4e5f6a7',
    currentHash: 'c3d4e5f6a7b8',
    input: { metric: 'http_requests_total', labels: { agent: 'cortex-v3' }, step: '5m' },
    output: { dataPoints: 288, summary: { totalRequests: 14420, successRate: 0.993 } },
    governanceSteps: [
      { name: 'Schema Validation', status: 'pass', detail: 'Valid', durationMs: 1 },
      { name: 'PII Scan', status: 'pass', detail: 'No PII', durationMs: 6 },
      { name: 'Injection Check', status: 'pass', detail: 'Clean', durationMs: 4 },
      { name: 'Policy Engine', status: 'pass', detail: 'Internal-workflow tier authorized', durationMs: 9 },
      { name: 'Guardian Decision', status: 'pass', detail: 'Allow — low risk read operation', durationMs: 5 },
      { name: 'Rate Limit', status: 'pass', detail: '12/120 req/min', durationMs: 1 },
      { name: 'Execution', status: 'pass', detail: 'Completed in 380ms', durationMs: 380 },
      { name: 'Output Validation', status: 'pass', detail: 'Schema matched', durationMs: 2 },
      { name: 'Audit Chain', status: 'pass', detail: 'hash c3d4e5f6', durationMs: 1 },
    ],
  },
  {
    id: 'exec-004',
    toolId: 'security.alert-escalation',
    toolName: 'Alert Escalator',
    agent: 'cortex-security-v3',
    domain: 'security',
    policyTier: 'executive-facing',
    outcome: 'allow',
    confidence: 0.91,
    latencyMs: 220,
    timestamp: new Date(Date.now() - 120000).toISOString(),
    traceId: 'trace-d4e5f6',
    prevHash: 'c3d4e5f6a7b8',
    currentHash: 'd4e5f6a7b8c9',
    input: { alertId: 'alert-0042', severity: 'critical', reason: 'Privilege escalation detected' },
    output: { escalated: true, escalatedTo: 'ciso-oncall' },
    governanceSteps: [
      { name: 'Schema Validation', status: 'pass', detail: 'Valid', durationMs: 2 },
      { name: 'PII Scan', status: 'pass', detail: 'No PII', durationMs: 7 },
      { name: 'Injection Check', status: 'pass', detail: 'Clean', durationMs: 4 },
      { name: 'Policy Engine', status: 'pass', detail: 'Executive-facing tier — elevated audit', durationMs: 18 },
      { name: 'Guardian Decision', status: 'pass', detail: 'Allow — scope cert includes security.*', durationMs: 10 },
      { name: 'Rate Limit', status: 'pass', detail: '5/30 req/min', durationMs: 1 },
      { name: 'Execution', status: 'pass', detail: '220ms', durationMs: 220 },
      { name: 'Output Validation', status: 'pass', detail: 'Valid', durationMs: 2 },
      { name: 'Audit Chain', status: 'pass', detail: 'hash d4e5f6a7', durationMs: 2 },
    ],
  },
  {
    id: 'exec-005',
    toolId: 'communication.notification-send',
    toolName: 'Notification Send',
    agent: 'ops-automator-v1',
    domain: 'communication',
    policyTier: 'internal-workflow',
    outcome: 'deny',
    confidence: 0.78,
    latencyMs: 12,
    timestamp: new Date(Date.now() - 210000).toISOString(),
    traceId: 'trace-e5f6a7',
    prevHash: 'd4e5f6a7b8c9',
    currentHash: 'e5f6a7b8c9d0',
    input: { channel: 'email', recipients: ['exec@szlholdings.com'], body: 'URGENT: System breach' },
    governanceSteps: [
      { name: 'Schema Validation', status: 'pass', detail: 'Valid', durationMs: 2 },
      { name: 'PII Scan', status: 'fail', detail: 'Email address detected in recipients — blocked per PII policy', durationMs: 9 },
      { name: 'Injection Check', status: 'skip', detail: 'Skipped after PII block', durationMs: 0 },
      { name: 'Policy Engine', status: 'skip', detail: 'N/A', durationMs: 0 },
      { name: 'Guardian Decision', status: 'skip', detail: 'N/A', durationMs: 0 },
      { name: 'Rate Limit', status: 'skip', detail: 'N/A', durationMs: 0 },
      { name: 'Execution', status: 'skip', detail: 'Blocked', durationMs: 0 },
      { name: 'Output Validation', status: 'skip', detail: 'N/A', durationMs: 0 },
      { name: 'Audit Chain', status: 'pass', detail: 'Deny recorded — hash e5f6a7b8', durationMs: 2 },
    ],
  },
  {
    id: 'exec-006',
    toolId: 'finance.portfolio-snapshot',
    toolName: 'Portfolio Snapshot',
    agent: 'treasury-agent-v2',
    domain: 'finance',
    policyTier: 'executive-facing',
    outcome: 'allow',
    confidence: 0.96,
    latencyMs: 560,
    timestamp: new Date(Date.now() - 390000).toISOString(),
    traceId: 'trace-f6a7b8',
    prevHash: 'e5f6a7b8c9d0',
    currentHash: 'f6a7b8c9d0e1',
    input: { portfolioId: 'pf-main-2025', includeBreakdown: true },
    output: { nav: 142000000, accountCount: 8, allocation: [] },
    governanceSteps: [
      { name: 'Schema Validation', status: 'pass', detail: 'Valid', durationMs: 2 },
      { name: 'PII Scan', status: 'warn', detail: 'portfolioId marked sensitive', durationMs: 10 },
      { name: 'Injection Check', status: 'pass', detail: 'Clean', durationMs: 4 },
      { name: 'Policy Engine', status: 'pass', detail: 'Executive-facing — dual-audit logged', durationMs: 20 },
      { name: 'Guardian Decision', status: 'pass', detail: 'Authorized', durationMs: 8 },
      { name: 'Rate Limit', status: 'pass', detail: '8/60 req/min', durationMs: 1 },
      { name: 'Execution', status: 'pass', detail: '560ms', durationMs: 560 },
      { name: 'Output Validation', status: 'pass', detail: 'Valid', durationMs: 3 },
      { name: 'Audit Chain', status: 'pass', detail: 'hash f6a7b8c9', durationMs: 2 },
    ],
  },
];

const DEMO_CATALOG: ToolCatalogEntry[] = [
  {
    id: 'security.threat-scan',
    name: 'Threat Scanner',
    description: 'Initiate a threat scan against a target host, network segment, or workload. Returns threat indicators, severity levels, and recommended mitigations.',
    domain: 'security',
    policyTier: 'regulated-workflow',
    approvalRequired: false,
    rateLimits: { requestsPerMinute: 10, concurrency: 3 },
    timeoutMs: 60000,
    version: '1.0.0',
    enabled: true,
    executions24h: 847,
    successRate: 0.982,
    avgLatencyMs: 1240,
    failureModes: [{ type: 'timeout', retryable: true }, { type: 'unavailable', retryable: false }],
    inputSchema: {
      type: 'object',
      properties: {
        targetId: { type: 'string', description: 'ID of the target host, network, or workload' },
        targetType: { type: 'string', enum: ['host', 'network', 'workload', 'endpoint'] },
        depth: { type: 'string', enum: ['surface', 'deep', 'full'] },
      },
      required: ['targetId', 'targetType'],
    },
  },
  {
    id: 'finance.fund-transfer',
    name: 'Fund Transfer',
    description: 'Initiate a fund transfer between accounts. All transfers require explicit human approval before execution.',
    domain: 'finance',
    policyTier: 'human-approval-mandatory',
    approvalRequired: true,
    rateLimits: { requestsPerMinute: 5, concurrency: 1 },
    timeoutMs: 30000,
    version: '1.0.0',
    enabled: true,
    executions24h: 23,
    successRate: 1.0,
    avgLatencyMs: 45,
    failureModes: [{ type: 'error', retryable: false }],
    inputSchema: {
      type: 'object',
      properties: {
        fromAccountId: { type: 'string' },
        toAccountId: { type: 'string' },
        amount: { type: 'number', minimum: 0 },
        currency: { type: 'string' },
        reference: { type: 'string' },
        memo: { type: 'string' },
      },
      required: ['fromAccountId', 'toAccountId', 'amount'],
    },
  },
  {
    id: 'analytics.metrics-query',
    name: 'Metrics Query',
    description: 'Query time-series metrics from the platform observability store. Supports label filters and time ranges.',
    domain: 'analytics',
    policyTier: 'internal-workflow',
    approvalRequired: false,
    rateLimits: { requestsPerMinute: 120 },
    timeoutMs: 10000,
    version: '1.0.0',
    enabled: true,
    executions24h: 14420,
    successRate: 0.993,
    avgLatencyMs: 380,
    failureModes: [{ type: 'timeout', retryable: true }],
    inputSchema: {
      type: 'object',
      properties: {
        metric: { type: 'string' },
        labels: { type: 'object' },
        startTime: { type: 'string' },
        endTime: { type: 'string' },
        step: { type: 'string' },
      },
      required: ['metric'],
    },
  },
  {
    id: 'security.compliance-check',
    name: 'Compliance Checker',
    description: 'Run a compliance posture check against a specified framework and scope.',
    domain: 'security',
    policyTier: 'regulated-workflow',
    approvalRequired: false,
    rateLimits: { requestsPerMinute: 20 },
    timeoutMs: 30000,
    version: '1.0.0',
    enabled: true,
    executions24h: 312,
    successRate: 0.97,
    avgLatencyMs: 890,
    failureModes: [{ type: 'timeout', retryable: true }],
    inputSchema: {
      type: 'object',
      properties: {
        framework: { type: 'string', enum: ['SOC2', 'ISO27001', 'NIST', 'HIPAA', 'GDPR', 'PCI-DSS'] },
        scope: { type: 'string' },
        includeRemediation: { type: 'boolean' },
      },
      required: ['framework', 'scope'],
    },
  },
  {
    id: 'finance.budget-forecast',
    name: 'Budget Forecast',
    description: 'Generate a forward-looking budget forecast using historical spend and growth signals.',
    domain: 'finance',
    policyTier: 'internal-workflow',
    approvalRequired: false,
    rateLimits: { requestsPerMinute: 20 },
    timeoutMs: 20000,
    version: '1.0.0',
    enabled: true,
    executions24h: 156,
    successRate: 0.988,
    avgLatencyMs: 620,
    failureModes: [{ type: 'timeout', retryable: true }],
    inputSchema: {
      type: 'object',
      properties: {
        orgId: { type: 'string' },
        period: { type: 'string', enum: ['monthly', 'quarterly', 'annual'] },
        horizonMonths: { type: 'integer', minimum: 1, maximum: 36 },
      },
      required: ['orgId'],
    },
  },
  {
    id: 'operations.workflow-trigger',
    name: 'Workflow Trigger',
    description: 'Trigger a named workflow with a payload. Dry-run mode validates without executing.',
    domain: 'infrastructure',
    policyTier: 'operator-assisted',
    approvalRequired: false,
    rateLimits: { requestsPerMinute: 30, concurrency: 5 },
    timeoutMs: 120000,
    version: '1.0.0',
    enabled: true,
    executions24h: 2241,
    successRate: 0.978,
    avgLatencyMs: 210,
    failureModes: [{ type: 'timeout', retryable: false }, { type: 'error', retryable: true }],
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string' },
        payload: { type: 'object' },
        dryRun: { type: 'boolean' },
      },
      required: ['workflowId'],
    },
  },
  {
    id: 'security.incident-containment',
    name: 'Incident Containment',
    description: 'Apply a containment action to an active security incident. Irreversible actions require human approval.',
    domain: 'security',
    policyTier: 'human-approval-mandatory',
    approvalRequired: true,
    rateLimits: { requestsPerMinute: 5, concurrency: 1 },
    timeoutMs: 30000,
    version: '1.0.0',
    enabled: true,
    executions24h: 4,
    successRate: 1.0,
    avgLatencyMs: 95,
    failureModes: [{ type: 'error', retryable: false }],
    inputSchema: {
      type: 'object',
      properties: {
        incidentId: { type: 'string' },
        containmentAction: { type: 'string', enum: ['isolate-host', 'block-ip', 'revoke-credentials', 'disable-account'] },
        justification: { type: 'string' },
      },
      required: ['incidentId', 'containmentAction', 'justification'],
    },
  },
  {
    id: 'communication.notification-send',
    name: 'Notification Send',
    description: 'Send a notification across email, Slack, SMS, push, or webhook channels.',
    domain: 'communication',
    policyTier: 'internal-workflow',
    approvalRequired: false,
    rateLimits: { requestsPerMinute: 60 },
    timeoutMs: 15000,
    version: '1.0.0',
    enabled: true,
    executions24h: 5670,
    successRate: 0.994,
    avgLatencyMs: 145,
    failureModes: [{ type: 'error', retryable: true }, { type: 'timeout', retryable: true }],
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', enum: ['email', 'slack', 'sms', 'push', 'webhook'] },
        recipients: { type: 'array', items: { type: 'string' } },
        subject: { type: 'string' },
        body: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
      },
      required: ['channel', 'recipients', 'body'],
    },
  },
];

const TABS = [
  { id: 'observatory', label: 'Observatory', icon: Radio },
  { id: 'console', label: 'Console', icon: Terminal },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'counterfactual', label: 'Counterfactual', icon: GitBranch },
  { id: 'composer', label: 'Composer', icon: Network },
  { id: 'fusion', label: 'Fusion', icon: Sigma },
] as const;

type TabId = (typeof TABS)[number]['id'];

function formatTs(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
      color, background: `${color}18`, border: `1px solid ${color}35`,
    }}>
      {children}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const config: Record<string, { color: string; label: string }> = {
    'allow': { color: '#22c55e', label: 'ALLOW' },
    'deny': { color: '#ef4444', label: 'DENY' },
    'require-approval': { color: '#f59e0b', label: 'APPROVAL' },
    'require-dual-approval': { color: '#dc2626', label: 'DUAL-APPROVAL' },
  };
  const { color, label } = config[outcome] ?? { color: '#64748b', label: outcome.toUpperCase() };
  return <Badge color={color}>{label}</Badge>;
}

function MetricCard({ label, value, sub, color = ACCENT }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '12px 16px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 10, color: FG_MUT, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: FG_DIM }}>{sub}</div>}
    </div>
  );
}

function GovernanceStepViz({ steps }: { steps: GovernanceStep[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {steps.map((step, i) => {
        const colors = { pass: '#22c55e', fail: '#ef4444', warn: '#f59e0b', skip: '#475569' };
        const icons = {
          pass: <CheckCircle2 size={12} />,
          fail: <AlertTriangle size={12} />,
          warn: <AlertTriangle size={12} />,
          skip: <Circle size={12} />,
        };
        const c = colors[step.status];
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 10px',
            background: `${c}08`, border: `1px solid ${c}20`, borderRadius: 6,
          }}>
            <div style={{ color: c, marginTop: 1, flexShrink: 0 }}>{icons[step.status]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: c }}>{step.name}</span>
                <span style={{ fontSize: 10, color: FG_MUT, fontFamily: 'monospace' }}>
                  {step.durationMs > 0 ? `${step.durationMs}ms` : '—'}
                </span>
              </div>
              <div style={{ fontSize: 10, color: FG_DIM, marginTop: 1 }}>{step.detail}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type ForgeTelemetrySummary = {
  total: number;
  escalations: number;
  policyDenials: number;
  latencyP50Ms: number;
  successRate: number;
};

type ForgeExecRun = {
  id: string;
  agentId: string;
  status: string;
  policyOutcome?: string;
  latencyMs?: number;
  toolCalls?: number;
  startedAt: string;
  input?: unknown;
};

function mapRunToExecution(r: ForgeExecRun, idx: number): ToolExecution {
  const outcomeMap: Record<string, ToolExecution['outcome']> = {
    allow: 'allow',
    deny: 'deny',
    require_approval: 'require-approval',
    escalated: 'require-approval',
  };
  const outcome: ToolExecution['outcome'] =
    outcomeMap[r.policyOutcome ?? ''] ??
    (r.status === 'success' ? 'allow' : r.status === 'failure' ? 'deny' : 'require-approval');
  const domains = ['security', 'finance', 'analytics', 'communication', 'infrastructure'];
  return {
    id: r.id,
    toolId: `tool-${idx}`,
    toolName: r.agentId ? `Agent Run — ${r.agentId.slice(0, 12)}` : `Execution #${idx + 1}`,
    agent: r.agentId ?? 'unknown',
    domain: domains[idx % domains.length],
    policyTier: 'internal-workflow',
    outcome,
    confidence: r.status === 'success' ? 0.9 : 0.6,
    latencyMs: r.latencyMs ?? 0,
    timestamp: r.startedAt,
    input: (r.input as Record<string, unknown> | undefined) ?? {},
  };
}

function ObservatoryTab() {
  const [executions, setExecutions] = useState<ToolExecution[]>(DEMO_EXECUTIONS);
  const [summary, setSummary] = useState<ForgeTelemetrySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ticker, setTicker] = useState(0);

  async function loadData() {
    try {
      const [sumData, runData] = await Promise.all([
        fetchJson<{ data: ForgeTelemetrySummary }>(apiUrl('/forge/telemetry/summary')),
        fetchJson<{ data: ForgeExecRun[] }>(apiUrl('/forge/executions?limit=30')),
      ]);
      if (sumData?.data) setSummary(sumData.data);
      if (runData?.data && runData.data.length > 0) {
        setExecutions(runData.data.map(mapRunToExecution));
      }
    } catch {
      // API unavailable — demo data remains
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    const t = setInterval(() => {
      setTicker((x) => x + 1);
      void loadData();
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const uniqueAgents = Array.from(new Set(executions.map((e) => e.agent))).slice(0, 8);
  const uniqueTiers = Array.from(new Set(executions.map((e) => e.policyTier))).slice(0, 6);

  const filtered = executions.filter((e) => {
    if (domainFilter !== 'all' && e.domain !== domainFilter) return false;
    if (outcomeFilter !== 'all' && e.outcome !== outcomeFilter) return false;
    if (agentFilter !== 'all' && e.agent !== agentFilter) return false;
    if (tierFilter !== 'all' && e.policyTier !== tierFilter) return false;
    return true;
  });

  const blocked = summary ? summary.policyDenials : executions.filter((e) => e.outcome === 'deny').length;
  const gated = summary ? summary.escalations : executions.filter((e) => e.outcome.startsWith('require')).length;
  const total = summary ? summary.total : executions.length;
  const avgConf = summary
    ? Math.round(summary.successRate * 100)
    : Math.round((executions.reduce((s, e) => s + e.confidence, 0) / executions.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <MetricCard label="Total Executions" value={loading ? '…' : total} sub={summary ? 'platform lifetime' : 'last 30 min'} />
        <MetricCard label="Approval-Gated" value={loading ? '…' : gated} sub="pending human review" color="#f59e0b" />
        <MetricCard label="Blocked" value={loading ? '…' : blocked} sub="by guardrail chain" color="#ef4444" />
        <MetricCard label="Success Rate" value={loading ? '…' : `${avgConf}%`} sub={summary ? 'platform-wide' : 'across executions'} color="#22c55e" />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: FG_MUT, fontSize: 11 }}>
          <Filter size={12} /> Filters:
        </div>
        {['all', 'security', 'finance', 'analytics', 'communication', 'infrastructure'].map((d) => (
          <button key={d} onClick={() => setDomainFilter(d)} style={{
            padding: '3px 10px', borderRadius: 4, fontSize: 11, border: `1px solid ${domainFilter === d ? ACCENT : BORDER}`,
            background: domainFilter === d ? `${ACCENT}18` : 'transparent',
            color: domainFilter === d ? ACCENT : FG_MUT, cursor: 'pointer',
          }}>
            {d === 'all' ? 'All Domains' : d}
          </button>
        ))}
        <div style={{ width: 1, height: 14, background: BORDER, margin: '0 4px' }} />
        {['all', 'allow', 'deny', 'require-approval'].map((o) => (
          <button key={o} onClick={() => setOutcomeFilter(o)} style={{
            padding: '3px 10px', borderRadius: 4, fontSize: 11, border: `1px solid ${outcomeFilter === o ? ACCENT : BORDER}`,
            background: outcomeFilter === o ? `${ACCENT}18` : 'transparent',
            color: outcomeFilter === o ? ACCENT : FG_MUT, cursor: 'pointer',
          }}>
            {o === 'all' ? 'All Outcomes' : o.toUpperCase()}
          </button>
        ))}
        <div style={{ width: 1, height: 14, background: BORDER, margin: '0 4px' }} />
        <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} style={{ padding: '3px 8px', background: CARD, border: `1px solid ${agentFilter !== 'all' ? ACCENT : BORDER}`, borderRadius: 4, color: agentFilter !== 'all' ? ACCENT : FG_MUT, fontSize: 11, outline: 'none' }}>
          <option value="all">All Agents</option>
          {uniqueAgents.map((a) => <option key={a} value={a}>{a.length > 20 ? a.slice(0, 20) + '…' : a}</option>)}
        </select>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} style={{ padding: '3px 8px', background: CARD, border: `1px solid ${tierFilter !== 'all' ? ACCENT : BORDER}`, borderRadius: 4, color: tierFilter !== 'all' ? ACCENT : FG_MUT, fontSize: 11, outline: 'none' }}>
          <option value="all">All Policy Tiers</option>
          {uniqueTiers.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#22c55e' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
          Live Feed
        </div>
      </div>

      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '180px 120px 100px 140px 120px 80px 80px 70px',
          padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${BORDER}`,
          fontSize: 10, color: FG_MUT, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <div>Tool</div>
          <div>Agent</div>
          <div>Domain</div>
          <div>Policy Tier</div>
          <div>Outcome</div>
          <div>Confidence</div>
          <div>Latency</div>
          <div>Time</div>
        </div>

        {filtered.map((exec) => {
          const isExpanded = expanded === exec.id;
          const domColor = DOMAIN_COLORS[exec.domain] ?? '#64748b';
          const tierColor = POLICY_TIER_COLORS[exec.policyTier] ?? '#64748b';
          return (
            <div key={exec.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div
                onClick={() => setExpanded(isExpanded ? null : exec.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '180px 120px 100px 140px 120px 80px 80px 70px',
                  padding: '9px 12px', cursor: 'pointer',
                  background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ fontSize: 11, color: FG, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exec.toolName}
                </div>
                <div style={{ fontSize: 10, color: FG_MUT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exec.agent}
                </div>
                <div>
                  <Badge color={domColor}>{exec.domain}</Badge>
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <span style={{ fontSize: 10, color: tierColor, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    {exec.policyTier}
                  </span>
                </div>
                <div><OutcomeBadge outcome={exec.outcome} /></div>
                <div style={{ fontSize: 11, color: exec.confidence >= 0.9 ? '#22c55e' : exec.confidence >= 0.75 ? '#f59e0b' : '#ef4444', fontFamily: 'monospace' }}>
                  {(exec.confidence * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: FG_MUT, fontFamily: 'monospace' }}>
                  {formatDuration(exec.latencyMs)}
                </div>
                <div style={{ fontSize: 10, color: FG_DIM, fontFamily: 'monospace' }}>
                  {formatTs(exec.timestamp)}
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: FG_MUT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
                        Governance Pipeline
                      </div>
                      {exec.governanceSteps && <GovernanceStepViz steps={exec.governanceSteps} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: FG_MUT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'monospace' }}>Input</div>
                        <pre style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '8px 10px', overflow: 'auto', maxHeight: 120, margin: 0, border: `1px solid ${BORDER}` }}>
                          {JSON.stringify(exec.input, null, 2)}
                        </pre>
                      </div>
                      {exec.output != null && (
                        <div>
                          <div style={{ fontSize: 10, color: FG_MUT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'monospace' }}>Output</div>
                          <pre style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '8px 10px', overflow: 'auto', maxHeight: 100, margin: 0, border: `1px solid ${BORDER}` }}>
                            {JSON.stringify(exec.output, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, fontSize: 10, color: FG_DIM, fontFamily: 'monospace' }}>
                        <span>Trace: {exec.traceId}</span>
                        {exec.currentHash && <span>Hash: {exec.currentHash.slice(0, 8)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ToolManifest = {
  id: string;
  name: string;
  description?: string;
  domainTags?: string[];
  policyTier?: string;
  inputSchema?: unknown;
  timeoutMs?: number;
  rateLimits?: { requestsPerMinute?: number; concurrency?: number };
  failureModes?: { type: string; retryable?: boolean }[];
};

function manifestToEntry(m: ToolManifest): ToolCatalogEntry {
  return {
    id: m.id,
    name: m.name,
    description: m.description ?? '',
    domain: m.domainTags?.[0] ?? 'general',
    policyTier: m.policyTier ?? 'internal-workflow',
    approvalRequired: m.policyTier === 'human-approval-mandatory',
    rateLimits: m.rateLimits ?? {},
    timeoutMs: m.timeoutMs ?? 30000,
    version: '1.0.0',
    enabled: true,
    executions24h: 0,
    successRate: 1,
    avgLatencyMs: 0,
    failureModes: (m.failureModes ?? []).map((f) => ({ ...f, retryable: f.retryable ?? false })),
    inputSchema: (m.inputSchema ?? { type: 'object', properties: {}, required: [] as string[] }) as Record<string, unknown>,
  };
}

function ConsoleTab() {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [catalog, setCatalog] = useState<ToolCatalogEntry[]>(DEMO_CATALOG);
  const [selected, setSelected] = useState<ToolCatalogEntry | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<{ steps: GovernanceStep[]; outcome: string; output?: unknown } | null>(null);
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    fetchJson<{ data: { total: number; manifests: ToolManifest[] } }>(apiUrl('/tool-mesh/catalog/list'))
      .then((res) => {
        if (res?.data?.manifests && res.data.manifests.length > 0) {
          setCatalog(res.data.manifests.map(manifestToEntry));
        }
      })
      .catch(() => { /* API unavailable — demo catalog remains */ });
  }, []);

  const filtered = catalog.filter((t) => {
    if (domainFilter !== 'all' && t.domain !== domainFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleSelectTool(tool: ToolCatalogEntry) {
    setSelected(tool);
    setParams({});
    setExecResult(null);
    setActiveStep(-1);
  }

  async function handleExecute() {
    if (!selected) return;

    setExecuting(true);
    setExecResult(null);
    setActiveStep(0);

    const govSteps = selected.approvalRequired
      ? DEMO_EXECUTIONS[1].governanceSteps!
      : DEMO_EXECUTIONS[0].governanceSteps!;

    let apiOutput: unknown = undefined;
    let apiOutcome = selected.approvalRequired ? 'require-approval' : 'allow';

    try {
      const invocationCode = `
        const tool = registry.get(${JSON.stringify(selected.id)});
        const result = tool ? await tool.execute(${JSON.stringify(params)}) : { error: 'tool not found' };
        return result;
      `;
      const res = await fetch(apiUrl('/tool-mesh/code/execute'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: invocationCode, domain: selected.domain }),
      });
      if (res.ok) {
        const data = (await res.json()) as { data?: { success?: boolean; output?: unknown; violations?: unknown[] } };
        apiOutput = data?.data?.output ?? { status: 'executed', toolId: selected.id, executedAt: new Date().toISOString() };
        if (data?.data?.violations && (data.data.violations as unknown[]).length > 0) apiOutcome = 'deny';
      }
    } catch {
      // Gateway unreachable — show governance pipeline with demo outcome
    }

    for (let i = 0; i < govSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 200 + govSteps[i].durationMs * 0.3));
      setActiveStep(i + 1);
    }

    setExecResult({
      steps: govSteps,
      outcome: apiOutcome,
      output: apiOutcome === 'allow' || apiOutcome === 'require-approval'
        ? (apiOutput ?? { status: 'success', toolId: selected.id, executedAt: new Date().toISOString() })
        : undefined,
    });
    setExecuting(false);
  }

  const inputProps = selected?.inputSchema
    ? Object.entries((selected.inputSchema as { properties?: Record<string, { type?: string; enum?: string[] }> }).properties ?? {}).slice(0, 6)
    : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, minHeight: 500 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: FG_MUT }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            style={{
              width: '100%', padding: '7px 10px 7px 28px', background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 6, color: FG, fontSize: 11, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['all', 'security', 'finance', 'analytics', 'infrastructure', 'communication'].map((d) => (
            <button key={d} onClick={() => setDomainFilter(d)} style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 10, border: `1px solid ${domainFilter === d ? ACCENT : BORDER}`,
              background: domainFilter === d ? `${ACCENT}18` : 'transparent',
              color: domainFilter === d ? ACCENT : FG_MUT, cursor: 'pointer',
            }}>
              {d === 'all' ? 'All' : d}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((tool) => {
            const domColor = DOMAIN_COLORS[tool.domain] ?? '#64748b';
            const isSelected = selected?.id === tool.id;
            return (
              <div
                key={tool.id}
                onClick={() => handleSelectTool(tool)}
                style={{
                  padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                  background: isSelected ? `${ACCENT}12` : CARD,
                  border: `1px solid ${isSelected ? ACCENT + '40' : BORDER}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isSelected ? ACCENT : FG }}>{tool.name}</div>
                  {tool.approvalRequired && <Lock size={10} style={{ color: '#ef4444' }} />}
                </div>
                <div style={{ fontSize: 10, color: FG_MUT, marginBottom: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {tool.description}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Badge color={domColor}>{tool.domain}</Badge>
                  <span style={{ fontSize: 10, color: FG_DIM, fontFamily: 'monospace' }}>{tool.executions24h.toLocaleString()}/24h</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: FG_MUT, fontSize: 13 }}>
            Select a tool from the catalog to view its manifest and execute
          </div>
        ) : (
          <>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: FG, marginBottom: 4 }}>{selected.name}</div>
                  <div style={{ fontSize: 11, color: FG_MUT }}>{selected.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Badge color={DOMAIN_COLORS[selected.domain] ?? '#64748b'}>{selected.domain}</Badge>
                  {selected.approvalRequired && <Badge color="#ef4444"><Lock size={9} />Approval Required</Badge>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Policy Tier', value: selected.policyTier, color: POLICY_TIER_COLORS[selected.policyTier] },
                  { label: 'Executions/24h', value: selected.executions24h.toLocaleString(), color: ACCENT },
                  { label: 'Success Rate', value: `${(selected.successRate * 100).toFixed(1)}%`, color: '#22c55e' },
                  { label: 'Avg Latency', value: formatDuration(selected.avgLatencyMs), color: '#3b82f6' },
                ].map((m) => (
                  <div key={m.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: FG_MUT, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>{m.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: m.color, fontFamily: 'monospace', marginTop: 2 }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: FG_MUT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>Rate Limits</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selected.rateLimits.requestsPerMinute && <Badge color="#8b5cf6">{selected.rateLimits.requestsPerMinute} req/min</Badge>}
                    {selected.rateLimits.concurrency && <Badge color="#8b5cf6">max {selected.rateLimits.concurrency} concurrent</Badge>}
                    <Badge color="#64748b">timeout {formatDuration(selected.timeoutMs)}</Badge>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: FG_MUT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>Failure Modes</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selected.failureModes.map((fm, i) => (
                      <Badge key={i} color={fm.retryable ? '#22c55e' : '#ef4444'}>
                        {fm.type} — {fm.retryable ? 'retryable' : 'no retry'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: FG, marginBottom: 12 }}>Execute Tool</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                {inputProps.map(([key, schema]) => (
                  <div key={key}>
                    <div style={{ fontSize: 10, color: FG_MUT, marginBottom: 4, fontFamily: 'monospace' }}>
                      {key} <span style={{ color: FG_DIM }}>({(schema as {type?: string}).type ?? 'string'})</span>
                    </div>
                    {(schema as {enum?: string[]}).enum ? (
                      <select
                        value={params[key] ?? ''}
                        onChange={(e) => setParams({ ...params, [key]: e.target.value })}
                        style={{ width: '100%', padding: '5px 8px', background: '#0d1424', border: `1px solid ${BORDER}`, borderRadius: 5, color: FG, fontSize: 11, outline: 'none' }}
                      >
                        <option value="">Select…</option>
                        {((schema as {enum?: string[]}).enum ?? []).map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    ) : (
                      <input
                        value={params[key] ?? ''}
                        onChange={(e) => setParams({ ...params, [key]: e.target.value })}
                        placeholder={`Enter ${key}…`}
                        style={{ width: '100%', padding: '5px 8px', background: '#0d1424', border: `1px solid ${BORDER}`, borderRadius: 5, color: FG, fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleExecute}
                disabled={executing}
                style={{
                  padding: '8px 20px', borderRadius: 6, background: executing ? 'rgba(212,160,84,0.3)' : ACCENT,
                  color: '#000', fontWeight: 700, fontSize: 12, border: 'none', cursor: executing ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {executing ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={12} />}
                {executing ? 'Executing…' : 'Run with Governance Pipeline'}
              </button>
            </div>

            {(executing || execResult) && (
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: FG, marginBottom: 12 }}>Governance Pipeline</div>
                {(execResult?.steps ?? DEMO_EXECUTIONS[0].governanceSteps!).map((step, i) => {
                  const isPast = i < activeStep;
                  const isCurrent = i === activeStep - 1 && executing;
                  const colors = { pass: '#22c55e', fail: '#ef4444', warn: '#f59e0b', skip: '#475569' };
                  const c = isPast ? colors[step.status] : isCurrent ? ACCENT : '#334155';
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6,
                      background: isCurrent ? `${ACCENT}10` : isPast ? `${c}08` : 'transparent',
                      border: `1px solid ${isCurrent ? ACCENT + '40' : isPast ? c + '20' : 'transparent'}`,
                      marginBottom: 4, transition: 'all 0.3s',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isPast ? `${c}25` : isCurrent ? `${ACCENT}25` : 'rgba(255,255,255,0.05)',
                        flexShrink: 0,
                      }}>
                        {isCurrent ? <RefreshCw size={10} style={{ color: ACCENT, animation: 'spin 1s linear infinite' }} /> :
                          isPast ? <CheckCircle2 size={10} style={{ color: c }} /> :
                          <Circle size={10} style={{ color: '#334155' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: isCurrent ? ACCENT : isPast ? c : FG_MUT }}>{step.name}</div>
                        {isPast && <div style={{ fontSize: 10, color: FG_DIM }}>{step.detail}</div>}
                      </div>
                      {isPast && <span style={{ fontSize: 10, color: FG_MUT, fontFamily: 'monospace' }}>{step.durationMs > 0 ? `${step.durationMs}ms` : '—'}</span>}
                    </div>
                  );
                })}
                {execResult && (
                  <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 6, background: execResult.outcome === 'allow' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${execResult.outcome === 'allow' ? '#22c55e40' : '#f59e0b40'}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: execResult.outcome === 'allow' ? '#22c55e' : '#f59e0b', marginBottom: 4 }}>
                      {execResult.outcome === 'allow' ? '✓ Execution Completed' : '⚠ Approval Required'}
                    </div>
                    {execResult.output != null && (
                      <pre style={{ fontSize: 10, color: '#94a3b8', margin: 0, overflow: 'auto', maxHeight: 80 }}>
                        {JSON.stringify(execResult.output, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function HistoryTab() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [toolFilter, setToolFilter] = useState('all');
  const [executions, setExecutions] = useState<ToolExecution[]>(DEMO_EXECUTIONS);

  useEffect(() => {
    fetchJson<{ data: ForgeExecRun[] }>(apiUrl('/forge/executions?limit=100'))
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          setExecutions(res.data.map(mapRunToExecution));
        }
      })
      .catch(() => { /* API unavailable — demo data remains */ });
  }, []);

  const now = Date.now();
  const DATE_CUTOFFS: Record<string, number> = {
    '1h': now - 60 * 60 * 1000,
    '24h': now - 24 * 60 * 60 * 1000,
    '7d': now - 7 * 24 * 60 * 60 * 1000,
  };
  const filtered = executions.filter((e) => {
    if (toolFilter !== 'all' && e.toolId !== toolFilter) return false;
    if (dateFilter !== 'all') {
      const cutoff = DATE_CUTOFFS[dateFilter];
      if (cutoff && new Date(e.timestamp).getTime() < cutoff) return false;
    }
    return true;
  });

  function exportCsv() {
    const rows = [
      ['id', 'toolId', 'toolName', 'agent', 'domain', 'policyTier', 'outcome', 'confidence', 'latencyMs', 'timestamp', 'traceId', 'hash'],
      ...filtered.map((e) => [e.id, e.toolId, e.toolName, e.agent, e.domain, e.policyTier, e.outcome, e.confidence, e.latencyMs, e.timestamp, e.traceId ?? '', e.currentHash ?? '']),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'forge-execution-history.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={toolFilter} onChange={(e) => setToolFilter(e.target.value)} style={{ padding: '5px 10px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, color: FG, fontSize: 11, outline: 'none' }}>
          <option value="all">All Tools</option>
          {DEMO_CATALOG.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ padding: '5px 10px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, color: FG, fontSize: 11, outline: 'none' }}>
          <option value="all">All Time</option>
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 Days</option>
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, background: `${ACCENT}18`, border: `1px solid ${ACCENT}40`, color: ACCENT, fontSize: 11, cursor: 'pointer' }}>
            <Download size={11} /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 1, background: `${ACCENT}30` }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {filtered.map((exec, idx) => {
            const isExp = expanded === exec.id;
            const domColor = DOMAIN_COLORS[exec.domain] ?? '#64748b';
            const outcomeColor = exec.outcome === 'allow' ? '#22c55e' : exec.outcome === 'deny' ? '#ef4444' : '#f59e0b';
            return (
              <div key={exec.id} style={{ display: 'flex', gap: 16, marginLeft: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${outcomeColor}20`, border: `1.5px solid ${outcomeColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 14 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: outcomeColor }} />
                  </div>
                  {idx < filtered.length - 1 && <div style={{ flex: 1, width: 1, background: `${ACCENT}20`, minHeight: 8 }} />}
                </div>
                <div style={{ flex: 1, marginBottom: 8 }}>
                  <div
                    onClick={() => setExpanded(isExp ? null : exec.id)}
                    style={{ padding: '10px 14px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: FG }}>{exec.toolName}</span>
                        <span style={{ fontSize: 10, color: FG_MUT, marginLeft: 8 }}>by {exec.agent}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <OutcomeBadge outcome={exec.outcome} />
                        <span style={{ fontSize: 10, color: FG_DIM, fontFamily: 'monospace' }}>
                          {new Date(exec.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                        </span>
                        {isExp ? <ChevronDown size={12} style={{ color: FG_MUT }} /> : <ChevronRight size={12} style={{ color: FG_MUT }} />}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Badge color={domColor}>{exec.domain}</Badge>
                      <span style={{ fontSize: 10, color: FG_MUT, fontFamily: 'monospace' }}>{formatDuration(exec.latencyMs)}</span>
                      <span style={{ fontSize: 10, color: FG_MUT, fontFamily: 'monospace' }}>conf: {(exec.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {isExp && (
                    <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 9, color: FG_MUT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'monospace' }}>Trace ID</div>
                          <code style={{ fontSize: 11, color: '#94a3b8' }}>{exec.traceId}</code>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: FG_MUT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'monospace' }}>Current Hash</div>
                          <code style={{ fontSize: 11, color: '#94a3b8' }}>{exec.currentHash}</code>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: FG_MUT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'monospace' }}>Prev Hash</div>
                          <code style={{ fontSize: 11, color: '#94a3b8' }}>{exec.prevHash}</code>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 9, color: FG_MUT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'monospace' }}>Input Payload</div>
                          <pre style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '8px 10px', overflow: 'auto', maxHeight: 120, margin: 0, border: `1px solid ${BORDER}` }}>
                            {JSON.stringify(exec.input, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: FG_MUT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'monospace' }}>Governance Pipeline</div>
                          {exec.governanceSteps && <GovernanceStepViz steps={exec.governanceSteps} />}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CounterfactualTab() {
  const [selectedExec, setSelectedExec] = useState<ToolExecution | null>(null);
  const [modifiedInput, setModifiedInput] = useState('');
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<{ original: ToolExecution; modified: Partial<ToolExecution> } | null>(null);

  function handleSelect(exec: ToolExecution) {
    setSelectedExec(exec);
    setModifiedInput(JSON.stringify(exec.input, null, 2));
    setResult(null);
  }

  async function handleCompare() {
    if (!selectedExec) return;
    setComparing(true);
    await new Promise((r) => setTimeout(r, 1200));
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(modifiedInput); } catch { parsed = selectedExec.input ?? {}; }
    const changed = JSON.stringify(parsed) !== JSON.stringify(selectedExec.input);
    const modifiedOutcome = changed && selectedExec.outcome === 'allow' && selectedExec.domain === 'finance'
      ? 'require-approval'
      : selectedExec.outcome;
    const modifiedConf = changed ? Math.max(0.5, selectedExec.confidence - 0.08) : selectedExec.confidence;
    const modifiedSteps = selectedExec.governanceSteps?.map((s) => ({
      ...s,
      detail: changed && s.name === 'Policy Engine' ? `Re-evaluated with modified input — ${s.detail}` : s.detail,
    }));
    setResult({
      original: selectedExec,
      modified: {
        outcome: modifiedOutcome,
        confidence: modifiedConf,
        governanceSteps: modifiedSteps,
        latencyMs: selectedExec.latencyMs + (changed ? 45 : 0),
      },
    });
    setComparing(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}20`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: FG_MUT }}>
        <Sparkles size={12} style={{ display: 'inline', marginRight: 6, color: ACCENT }} />
        Select any past execution, modify its inputs or policy constraints, and re-execute to see what governance decisions would have differed.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, color: FG_MUT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'monospace' }}>Select Execution</div>
          {DEMO_EXECUTIONS.map((exec) => (
            <div
              key={exec.id}
              onClick={() => handleSelect(exec)}
              style={{
                padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                background: selectedExec?.id === exec.id ? `${ACCENT}12` : CARD,
                border: `1px solid ${selectedExec?.id === exec.id ? ACCENT + '40' : BORDER}`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: selectedExec?.id === exec.id ? ACCENT : FG }}>{exec.toolName}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                <OutcomeBadge outcome={exec.outcome} />
                <span style={{ fontSize: 10, color: FG_DIM, fontFamily: 'monospace' }}>{formatTs(exec.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selectedExec ? (
            <>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: FG, marginBottom: 10 }}>Modified Input (editable)</div>
                <textarea
                  value={modifiedInput}
                  onChange={(e) => setModifiedInput(e.target.value)}
                  rows={8}
                  style={{ width: '100%', background: '#0d1424', border: `1px solid ${BORDER}`, borderRadius: 6, color: '#94a3b8', fontSize: 11, padding: '8px 10px', fontFamily: 'monospace', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  onClick={handleCompare}
                  disabled={comparing}
                  style={{ marginTop: 10, padding: '7px 18px', borderRadius: 6, background: ACCENT, color: '#000', fontWeight: 700, fontSize: 11, border: 'none', cursor: comparing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {comparing ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <GitBranch size={11} />}
                  {comparing ? 'Re-evaluating…' : 'Compare Counterfactual'}
                </button>
              </div>

              {result && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Circle size={8} style={{ color: '#64748b' }} /> Original
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <OutcomeBadge outcome={result.original.outcome} />
                      <span style={{ fontSize: 11, color: '#22c55e', fontFamily: 'monospace' }}>
                        {(result.original.confidence * 100).toFixed(0)}% conf
                      </span>
                      <span style={{ fontSize: 11, color: FG_MUT, fontFamily: 'monospace' }}>
                        {formatDuration(result.original.latencyMs)}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: FG_MUT, marginBottom: 8 }}>Governance Steps:</div>
                    <GovernanceStepViz steps={result.original.governanceSteps ?? []} />
                  </div>
                  <div style={{ background: CARD, border: `1px solid ${ACCENT}30`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={8} style={{ color: ACCENT }} /> Counterfactual
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <OutcomeBadge outcome={result.modified.outcome ?? result.original.outcome} />
                      <span style={{ fontSize: 11, color: result.modified.confidence !== result.original.confidence ? ACCENT : '#22c55e', fontFamily: 'monospace' }}>
                        {((result.modified.confidence ?? result.original.confidence) * 100).toFixed(0)}% conf
                        {result.modified.confidence !== result.original.confidence && ' Δ'}
                      </span>
                      <span style={{ fontSize: 11, color: FG_MUT, fontFamily: 'monospace' }}>
                        {formatDuration(result.modified.latencyMs ?? result.original.latencyMs)}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: FG_MUT, marginBottom: 8 }}>Governance Steps:</div>
                    <GovernanceStepViz steps={result.modified.governanceSteps ?? []} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: FG_MUT, fontSize: 13 }}>
              Select an execution from the list to begin counterfactual analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ComposerNode {
  id: string;
  toolId: string;
  toolName: string;
  type: 'tool' | 'approval-gate' | 'branch';
  x: number;
  y: number;
  domain?: string;
}

interface ComposerConnection {
  from: string;
  to: string;
}

function ComposerTab() {
  const [nodes, setNodes] = useState<ComposerNode[]>([]);
  const [connections, setConnections] = useState<ComposerConnection[]>([]);
  const [composerName, setComposerName] = useState('');
  const [running, setRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<Record<string, 'pending' | 'running' | 'done' | 'blocked'>>({});
  const [templates, setTemplates] = useState<string[]>(['Threat → Escalate → Notify', 'Metrics → Forecast → Alert']);
  const [saved, setSaved] = useState(false);

  function addTool(tool: ToolCatalogEntry) {
    const newNode: ComposerNode = {
      id: `node-${Date.now()}`,
      toolId: tool.id,
      toolName: tool.name,
      type: 'tool',
      x: 40 + nodes.length * 170,
      y: 80,
      domain: tool.domain,
    };
    setNodes([...nodes, newNode]);
    if (nodes.length > 0) {
      setConnections([...connections, { from: nodes[nodes.length - 1].id, to: newNode.id }]);
    }
  }

  function addApprovalGate() {
    const newNode: ComposerNode = {
      id: `gate-${Date.now()}`, toolId: 'approval-gate', toolName: 'Approval Gate', type: 'approval-gate',
      x: 40 + nodes.length * 170, y: 80,
    };
    setNodes([...nodes, newNode]);
    if (nodes.length > 0) {
      setConnections([...connections, { from: nodes[nodes.length - 1].id, to: newNode.id }]);
    }
  }

  function removeNode(id: string) {
    setNodes(nodes.filter((n) => n.id !== id));
    setConnections(connections.filter((c) => c.from !== id && c.to !== id));
  }

  async function runComposition() {
    setRunning(true);
    const initial: Record<string, 'pending' | 'running' | 'done' | 'blocked'> = {};
    nodes.forEach((n) => { initial[n.id] = 'pending'; });
    setRunStatus(initial);

    for (const node of nodes) {
      setRunStatus((s) => ({ ...s, [node.id]: 'running' }));
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      const outcome = node.type === 'approval-gate' ? 'blocked' : 'done';
      setRunStatus((s) => ({ ...s, [node.id]: outcome }));
      if (outcome === 'blocked') break;
    }
    setRunning(false);
  }

  function saveTemplate() {
    if (!composerName) return;
    setTemplates([...templates, composerName]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const statusColors = { pending: '#475569', running: ACCENT, done: '#22c55e', blocked: '#f59e0b' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {DEMO_CATALOG.slice(0, 4).map((t) => (
            <button key={t.id} onClick={() => addTool(t)} style={{
              padding: '5px 10px', borderRadius: 5, background: `${DOMAIN_COLORS[t.domain] ?? '#64748b'}15`,
              border: `1px solid ${DOMAIN_COLORS[t.domain] ?? '#64748b'}30`,
              color: DOMAIN_COLORS[t.domain] ?? '#64748b', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Plus size={9} /> {t.name}
            </button>
          ))}
          <button onClick={addApprovalGate} style={{ padding: '5px 10px', borderRadius: 5, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Lock size={9} /> Approval Gate
          </button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={composerName} onChange={(e) => setComposerName(e.target.value)} placeholder="Template name…" style={{ padding: '5px 10px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 5, color: FG, fontSize: 11, outline: 'none' }} />
          <button onClick={saveTemplate} style={{ padding: '5px 12px', borderRadius: 5, background: saved ? 'rgba(34,197,94,0.15)' : `${ACCENT}15`, border: `1px solid ${saved ? '#22c55e40' : ACCENT + '30'}`, color: saved ? '#22c55e' : ACCENT, fontSize: 11, cursor: 'pointer' }}>
            {saved ? '✓ Saved' : 'Save Template'}
          </button>
        </div>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, minHeight: 200, position: 'relative', overflow: 'hidden', padding: 16 }}>
        {nodes.length === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: FG_MUT, fontSize: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <Network size={24} style={{ margin: '0 auto 8px', color: FG_DIM }} />
              <div>Add tools from the toolbar above to build a composition</div>
              <div style={{ fontSize: 10, marginTop: 4, color: FG_DIM }}>Governance is enforced at every step</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
            {nodes.map((node, idx) => {
              const st = runStatus[node.id];
              const stColor = st ? statusColors[st] : (node.type === 'approval-gate' ? '#f59e0b' : DOMAIN_COLORS[node.domain ?? 'custom'] ?? ACCENT);
              const conn = connections.find((c) => c.to === node.id);
              return (
                <div key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
                  {conn && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      <div style={{ width: 24, height: 1, background: `${ACCENT}40` }} />
                      <ArrowRight size={10} style={{ color: `${ACCENT}60`, flexShrink: 0 }} />
                    </div>
                  )}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 14px', borderRadius: 8,
                    background: node.type === 'approval-gate' ? 'rgba(245,158,11,0.08)' : `${stColor}10`,
                    border: `1.5px solid ${stColor}40`,
                    minWidth: 130, position: 'relative',
                    boxShadow: st === 'running' ? `0 0 12px ${ACCENT}40` : undefined,
                  }}>
                    <button
                      onClick={() => removeNode(node.id)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', cursor: 'pointer', color: FG_DIM, padding: 1 }}
                    >
                      <X size={9} />
                    </button>
                    {node.type === 'approval-gate'
                      ? <Lock size={16} style={{ color: '#f59e0b' }} />
                      : <Zap size={16} style={{ color: stColor }} />}
                    <div style={{ fontSize: 11, fontWeight: 600, color: stColor, textAlign: 'center' }}>{node.toolName}</div>
                    {st && <Badge color={stColor}>{st.toUpperCase()}</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={runComposition}
          disabled={nodes.length === 0 || running}
          style={{ padding: '8px 20px', borderRadius: 6, background: nodes.length === 0 || running ? 'rgba(212,160,84,0.2)' : ACCENT, color: '#000', fontWeight: 700, fontSize: 12, border: 'none', cursor: nodes.length === 0 || running ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {running ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={12} />}
          {running ? 'Running with Governance…' : 'Execute Composition'}
        </button>
        <span style={{ fontSize: 10, color: FG_DIM }}>
          {nodes.length} tool{nodes.length !== 1 ? 's' : ''} · {connections.length} connection{connections.length !== 1 ? 's' : ''}
        </span>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: FG_MUT }}>Saved Templates:</div>
        {templates.map((t) => (
          <button key={t} style={{ padding: '3px 10px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: FG_MUT, fontSize: 10, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function FusionTab() {
  const [entity, setEntity] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{ domain: string; signal: string; confidence: number; method: string; timestamp: string; hypothesis: string }[] | null>(null);

  const DEMO_RESULTS_BY_ENTITY: Record<string, typeof results> = {
    default: [
      { domain: 'security', signal: 'Threat scan flagged 3 indicators of compromise associated with entity', confidence: 0.94, method: 'Behavioral Analysis', timestamp: new Date(Date.now() - 12000).toISOString(), hypothesis: 'Lateral movement pattern consistent with APT-29 TTPs' },
      { domain: 'finance', signal: 'Portfolio activity shows $2.4M in unusual transfers correlated to entity', confidence: 0.81, method: 'Anomaly Detection', timestamp: new Date(Date.now() - 34000).toISOString(), hypothesis: 'May reflect authorized restructuring or potential wash trading' },
      { domain: 'analytics', signal: '847 API calls from entity in last 24h — 3.2σ above baseline', confidence: 0.97, method: 'Statistical Deviation', timestamp: new Date(Date.now() - 67000).toISOString(), hypothesis: 'Automated scraping or legitimate bulk operation' },
      { domain: 'legal', signal: 'No active litigation or compliance flags for entity in Counsel registry', confidence: 0.99, method: 'Registry Lookup', timestamp: new Date(Date.now() - 120000).toISOString(), hypothesis: 'Entity in good standing' },
      { domain: 'vessels', signal: 'No maritime activity linked to entity in Vessels registry', confidence: 0.88, method: 'Cross-Domain Lookup', timestamp: new Date(Date.now() - 210000).toISOString(), hypothesis: 'Entity not vessel-linked or data lag present' },
    ],
  };

  async function handleSearch() {
    if (!entity.trim()) return;
    setSearching(true);
    await new Promise((r) => setTimeout(r, 1400));
    setResults(DEMO_RESULTS_BY_ENTITY.default ?? []);
    setSearching(false);
  }

  const compositeConf = results ? Math.round((results.reduce((s, r) => s + r.confidence, 0) / results.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}20`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: FG_MUT }}>
        <Sigma size={12} style={{ display: 'inline', marginRight: 6, color: ACCENT }} />
        Enter any entity (vessel, person, company, property, IP address) to fuse intelligence from all domain tools and produce a unified confidence assessment with a timeline of signals.
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: FG_MUT }} />
          <input
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Entity name, ID, or identifier (e.g. TechVentures LLC, host-prod-07, 192.168.1.1)…"
            style={{ width: '100%', padding: '10px 14px 10px 36px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, color: FG, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !entity.trim()}
          style={{ padding: '10px 24px', borderRadius: 8, background: searching ? 'rgba(212,160,84,0.2)' : ACCENT, color: '#000', fontWeight: 700, fontSize: 12, border: 'none', cursor: searching ? 'not-allowed' : 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {searching ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sigma size={13} />}
          {searching ? 'Fusing…' : 'Fuse Intelligence'}
        </button>
      </div>

      {results && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <MetricCard label="Intelligence Signals" value={results.length} sub={`across ${new Set(results.map((r) => r.domain)).size} domains`} />
            <MetricCard label="Composite Confidence" value={`${compositeConf}%`} sub="weighted by source reliability" color="#22c55e" />
            <MetricCard label="Entity" value={entity.length > 20 ? entity.slice(0, 20) + '…' : entity} sub="cross-domain fusion" />
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 1, background: `${ACCENT}30` }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {results.map((sig, idx) => {
                const domColor = DOMAIN_COLORS[sig.domain] ?? '#64748b';
                return (
                  <div key={idx} style={{ display: 'flex', gap: 16, marginLeft: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${domColor}20`, border: `1.5px solid ${domColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 14 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: domColor }} />
                      </div>
                      {idx < results.length - 1 && <div style={{ flex: 1, width: 1, background: `${ACCENT}20`, minHeight: 8 }} />}
                    </div>
                    <div style={{ flex: 1, marginBottom: 10 }}>
                      <div style={{ padding: '12px 14px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Badge color={domColor}>{sig.domain}</Badge>
                            <span style={{ fontSize: 10, color: FG_MUT, fontFamily: 'monospace' }}>{sig.method}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: sig.confidence >= 0.9 ? '#22c55e' : sig.confidence >= 0.75 ? '#f59e0b' : '#ef4444' }}>
                              {(sig.confidence * 100).toFixed(0)}% confidence
                            </span>
                            <span style={{ fontSize: 10, color: FG_DIM, fontFamily: 'monospace' }}>{formatTs(sig.timestamp)}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: FG, marginBottom: 6 }}>{sig.signal}</div>
                        <div style={{ fontSize: 10, color: FG_MUT, display: 'flex', gap: 6, alignItems: 'center' }}>
                          <FlaskConical size={10} />
                          <span>Competing hypothesis: {sig.hypothesis}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: CARD, border: `1px solid ${ACCENT}30`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, marginBottom: 10 }}>Unified Intelligence Assessment</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
              {results.map((sig) => {
                const domColor = DOMAIN_COLORS[sig.domain] ?? '#64748b';
                const pct = (sig.confidence * 100).toFixed(0);
                return (
                  <div key={sig.domain} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: FG_MUT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontFamily: 'monospace' }}>{sig.domain}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: domColor, fontFamily: 'monospace' }}>{pct}%</div>
                    <div style={{ height: 3, borderRadius: 2, background: `${domColor}30`, marginTop: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: domColor, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: FG_MUT }}>
              Entity <strong style={{ color: FG }}>{entity}</strong> is active across {new Set(results.map((r) => r.domain)).size} intelligence domains.
              Composite confidence is <strong style={{ color: compositeConf >= 90 ? '#22c55e' : '#f59e0b' }}>{compositeConf}%</strong>. Security signals indicate elevated risk — recommend operator review of security domain findings before acting.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ForgePage() {
  const [tab, setTab] = useState<TabId>('observatory');

  return (
    <div style={{ background: BG, minHeight: '100%', padding: '20px 24px', fontFamily: 'system-ui, sans-serif', color: FG }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: FG, letterSpacing: '-0.02em' }}>FORGE</h1>
            <div style={{ fontSize: 11, color: FG_MUT }}>Governed Tool Intelligence Command Center</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#22c55e', fontFamily: 'monospace' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              Tool Mesh Active
            </div>
            <Badge color={ACCENT}>{DEMO_CATALOG.length} Tools Registered</Badge>
            <Badge color="#22c55e">MCP Gateway Online</Badge>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${BORDER}`, marginBottom: 20 }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: '8px 18px', border: 'none', borderBottom: tab === id ? `2px solid ${ACCENT}` : '2px solid transparent',
              background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              color: tab === id ? ACCENT : FG_MUT, fontSize: 12, fontWeight: tab === id ? 600 : 400,
              transition: 'all 0.15s', marginBottom: -1,
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'observatory' && <ObservatoryTab />}
        {tab === 'console' && <ConsoleTab />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'counterfactual' && <CounterfactualTab />}
        {tab === 'composer' && <ComposerTab />}
        {tab === 'fusion' && <FusionTab />}
      </div>
    </div>
  );
}

export default ForgePage;
