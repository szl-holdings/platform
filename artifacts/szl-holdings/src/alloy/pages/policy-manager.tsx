import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { color } from '@szl-holdings/design-system';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { DataStateBadge } from '@szl-holdings/shared-ui/data-state-badge';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Lock,
  Plus,
  Settings2,
  Shield,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Policy {
  id: number;
  name: string;
  slug: string;
  orgId: number | null;
  kind:
    | 'approval_matrix'
    | 'model_routing'
    | 'cost_control'
    | 'agent_permission'
    | 'compliance_template';
  status: 'active' | 'draft' | 'archived';
  rules: Record<string, unknown>;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

const DEMO_POLICIES: Policy[] = [
  {
    id: 1,
    name: 'Browser Form Submission Approval',
    slug: 'browser-form-approval',
    orgId: 1,
    kind: 'approval_matrix',
    status: 'active',
    description: 'Requires manager approval before any agent-initiated browser form submission.',
    rules: {
      trigger: 'browser_form_submit',
      requiredApprovalLevel: 'manager',
      expiresAfterHours: 24,
      escalationAfterHours: 4,
    },
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 2,
    name: 'Artifact Publishing Compliance Review',
    slug: 'artifact-publish-compliance',
    orgId: 1,
    kind: 'approval_matrix',
    status: 'active',
    description:
      'All artifacts must pass compliance review before publishing to external channels.',
    rules: {
      trigger: 'artifact_publish',
      requiredApprovalLevel: 'compliance',
      checkPII: true,
      checkFinancialData: true,
    },
    createdAt: new Date(Date.now() - 120 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 3,
    name: 'Claude for Analysis — $0.50 Ceiling',
    slug: 'model-routing-claude-analysis',
    orgId: 1,
    kind: 'model_routing',
    status: 'active',
    description:
      'Route analysis tasks to Claude with a $0.50 per-invocation cost ceiling. GPT fallback for general ops. Gemini blocked in production.',
    rules: {
      allowedModels: ['claude-sonnet-4-6', 'gpt-5.2'],
      blockedModels: ['gemini-3.1-pro-preview'],
      costCeilingPerCall: 0.5,
      taskRouting: { analysis: 'claude-sonnet-4-6', general: 'gpt-5.2' },
      environment: 'production',
    },
    createdAt: new Date(Date.now() - 168 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: 4,
    name: 'Monthly Budget Control — $500',
    slug: 'monthly-budget-500',
    orgId: 1,
    kind: 'cost_control',
    status: 'active',
    description: 'Per-tenant monthly budget cap of $500. Alert at 80%, hard stop at 100%.',
    rules: {
      monthlyBudgetUsd: 500,
      alertThresholdPct: 80,
      hardStopPct: 100,
      trackBy: ['agent_run', 'skill_invocation', 'model_call'],
      notifyRoles: ['admin', 'ops'],
    },
    createdAt: new Date(Date.now() - 240 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 5,
    name: 'SOC 2 Compliance Template',
    slug: 'soc2-template',
    orgId: null,
    kind: 'compliance_template',
    status: 'active',
    description:
      'Pre-built governance template for SOC 2 Type II compliance frameworks. One-click apply to any tenant.',
    rules: {
      framework: 'SOC2-TypeII',
      controls: ['CC6.1', 'CC6.2', 'CC6.3', 'CC7.1', 'CC8.1'],
      requiredApprovals: ['artifact_publish', 'workflow_delete', 'user_provision'],
      auditRetentionDays: 365,
      incidentLoggingRequired: true,
    },
    createdAt: new Date(Date.now() - 720 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 120 * 3600000).toISOString(),
  },
  {
    id: 6,
    name: 'HIPAA Data Handling Template',
    slug: 'hipaa-template',
    orgId: null,
    kind: 'compliance_template',
    status: 'draft',
    description: 'Governance template for HIPAA-adjacent workflows handling PHI-adjacent data.',
    rules: {
      framework: 'HIPAA',
      dataClassification: ['PHI', 'PII'],
      encryptionRequired: true,
      accessLoggingRequired: true,
      minimumApprovalLevel: 'admin',
    },
    createdAt: new Date(Date.now() - 480 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 240 * 3600000).toISOString(),
  },
  {
    id: 7,
    name: 'Admin-Only Agent Access',
    slug: 'admin-agent-access',
    orgId: 1,
    kind: 'agent_permission',
    status: 'active',
    description: 'Restricts access to Sentinel and Zeus infrastructure agents to admin role only.',
    rules: {
      restrictedAgents: ['sentinel', 'zeus'],
      allowedRoles: ['admin', 'super_admin'],
      denyRoles: ['viewer', 'analyst', 'exec'],
      logAllAccess: true,
    },
    createdAt: new Date(Date.now() - 336 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

interface GovernanceIncident {
  id: number;
  policyId: number;
  policyName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'policy_violation' | 'unexpected_result' | 'user_override' | 'cost_threshold';
  description: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

const _DEMO_INCIDENTS: GovernanceIncident[] = [
  {
    id: 1,
    policyId: 1,
    policyName: 'Browser Form Submission Approval',
    severity: 'high',
    type: 'policy_violation',
    description:
      'Agent attempted browser form submission without queuing for manager approval. Request blocked by policy middleware.',
    resolution: 'Approval request created automatically. Manager approved within 2h.',
    resolvedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 2,
    policyId: 4,
    policyName: 'Monthly Budget Control — $500',
    severity: 'medium',
    type: 'cost_threshold',
    description:
      'Tenant #1 reached 80% of monthly budget ($400/$500). Alert sent to admin and ops roles.',
    resolution: 'Monitoring. No action required yet.',
    resolvedAt: null,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 3,
    policyId: 7,
    policyName: 'Admin-Only Agent Access',
    severity: 'low',
    type: 'user_override',
    description:
      'User with analyst role attempted to invoke Sentinel agent. Access denied, incident logged.',
    resolution: 'Expected behavior — role escalation not granted.',
    resolvedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

const KIND_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  approval_matrix: {
    label: 'Approval Matrix',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.06)',
    border: 'rgba(139,92,246,0.2)',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  model_routing: {
    label: 'Model Routing',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.06)',
    border: 'rgba(14,165,233,0.2)',
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  cost_control: {
    label: 'Cost Control',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  agent_permission: {
    label: 'Agent Permission',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.2)',
    icon: <Lock className="w-3.5 h-3.5" />,
  },
  compliance_template: {
    label: 'Compliance Template',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.2)',
    icon: <Shield className="w-3.5 h-3.5" />,
  },
};

const STATUS_COLORS: Record<string, string> = {
  active: color.accent.green,
  draft: color.accent.slate,
  archived: color.text.muted,
};

const SEVERITY_COLORS: Record<string, string> = {
  low: color.accent.slate,
  medium: color.accent.amber,
  high: color.accent.amber,
  critical: color.accent.red,
};

function formatRelative(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function PolicyCard({ policy, onView }: { policy: Policy; onView: (p: Policy) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = KIND_CONFIG[policy.kind] ?? KIND_CONFIG.approval_matrix;
  const statusColor = STATUS_COLORS[policy.status] ?? '#6b7280';

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div
          className="mt-0.5 p-1.5 rounded-lg shrink-0"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
        >
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-white">{policy.name}</span>
            <span
              className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-bold shrink-0"
              style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}
            >
              {cfg.label}
            </span>
            <span
              className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-semibold shrink-0"
              style={{ color: statusColor, background: `${statusColor}15` }}
            >
              {policy.status}
            </span>
          </div>
          {policy.description && (
            <p className="text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {policy.description}
            </p>
          )}
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Updated {formatRelative(policy.updatedAt)} ·{' '}
            {policy.orgId ? `Tenant #${policy.orgId}` : 'Global template'}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(policy);
            }}
            className="p-1.5 rounded-lg border transition-all hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
          >
            <Eye className="w-3 h-3" />
          </button>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
          )}
        </div>
      </div>

      {expanded && (
        <div
          className="px-4 pb-4 border-t space-y-3"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="pt-3" />
          <div
            className="text-[10px] font-mono rounded-lg p-3"
            style={{
              background: 'rgba(0,0,0,0.4)',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(policy.rules, null, 2)}
            </pre>
          </div>
          <div className="flex gap-2">
            {policy.kind === 'compliance_template' && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{
                  borderColor: 'rgba(16,185,129,0.3)',
                  background: 'rgba(16,185,129,0.08)',
                  color: '#10b981',
                }}
              >
                <Copy className="w-3 h-3" />
                Apply to Tenant
              </button>
            )}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              <Settings2 className="w-3 h-3" />
              Edit Policy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function IncidentRow({ incident }: { incident: GovernanceIncident }) {
  const sevColor = SEVERITY_COLORS[incident.severity] ?? '#6b7280';
  const typeLabels: Record<string, string> = {
    policy_violation: 'Policy Violation',
    unexpected_result: 'Unexpected Result',
    user_override: 'User Override',
    cost_threshold: 'Cost Threshold',
  };

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl border"
      style={{
        borderColor: incident.resolvedAt ? 'rgba(255,255,255,0.06)' : `${sevColor}25`,
        background: incident.resolvedAt ? 'rgba(255,255,255,0.01)' : `${sevColor}08`,
      }}
    >
      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: sevColor }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-semibold text-white">
            {typeLabels[incident.type] ?? incident.type}
          </span>
          <span
            className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold"
            style={{ color: sevColor, background: `${sevColor}15` }}
          >
            {incident.severity}
          </span>
          {incident.resolvedAt && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
              style={{ color: '#10b981', background: 'rgba(16,185,129,0.12)' }}
            >
              Resolved
            </span>
          )}
        </div>
        <p className="text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {incident.description}
        </p>
        {incident.resolution && (
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Resolution: {incident.resolution}
          </p>
        )}
        <div className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {incident.policyName} · {formatRelative(incident.createdAt)}
        </div>
      </div>
    </div>
  );
}

function NewPolicyDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<Policy['kind']>('approval_matrix');
  const [orgId, setOrgId] = useState('1');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useStandardMutation({
    mutationFn: async () => {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const defaultRules: Record<Policy['kind'], Record<string, unknown>> = {
        approval_matrix: {
          trigger: 'agent_run',
          requiredApprovalLevel: 'manager',
          expiresAfterHours: 24,
        },
        model_routing: { allowedModels: [], blockedModels: [], costCeilingPerCall: 1.0 },
        cost_control: { monthlyBudgetUsd: 500, hardStopPct: 100 },
        agent_permission: { restrictedAgents: [], allowedRoles: ['admin'] },
        compliance_template: { checkPII: true, checkFinancialData: true },
      };
      await apiFetch('/alloy/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          kind,
          status: 'draft',
          orgId: parseInt(orgId, 10) || null,
          description: description || null,
          rules: defaultRules[kind],
        }),
      });
    },
    onSuccess: () => {
      onCreated();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 space-y-4"
        style={{ background: '#0d1117', borderColor: 'rgba(139,92,246,0.2)' }}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white">New Policy</div>
          <button
            onClick={onClose}
            className="text-[11px]"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label
              className="text-[10px] font-medium mb-1 block"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Policy Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Budget Control — $500/mo"
              className="w-full px-3 py-2 rounded-lg text-xs bg-transparent border text-white outline-none"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            />
          </div>
          <div>
            <label
              className="text-[10px] font-medium mb-1 block"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Policy Type *
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as Policy['kind'])}
              className="w-full px-3 py-2 rounded-lg text-xs border text-white outline-none"
              style={{ background: '#0d1117', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              {Object.entries(KIND_CONFIG).map(([k, cfg]) => (
                <option key={k} value={k}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="text-[10px] font-medium mb-1 block"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Org ID
            </label>
            <input
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="Tenant org ID (leave blank for global)"
              className="w-full px-3 py-2 rounded-lg text-xs bg-transparent border text-white outline-none"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            />
          </div>
          <div>
            <label
              className="text-[10px] font-medium mb-1 block"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional description"
              className="w-full px-3 py-2 rounded-lg text-xs bg-transparent border text-white outline-none resize-none"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            />
          </div>
        </div>
        {error && (
          <div
            className="text-[10px] px-3 py-2 rounded-lg border"
            style={{
              color: '#ef4444',
              borderColor: 'rgba(239,68,68,0.2)',
              background: 'rgba(239,68,68,0.04)',
            }}
          >
            {error}
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs border"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name || mutation.isPending}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
            style={{ background: '#8b5cf6', color: '#fff' }}
          >
            {mutation.isPending ? 'Creating…' : 'Create as Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PolicyManager() {
  const [tab, setTab] = useState<'policies' | 'incidents'>('policies');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [_selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showNewPolicy, setShowNewPolicy] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: apiPolicies,
    isLoading,
    isError,
  } = useStandardQuery({
    queryKey: ['alloyPolicies'],
    queryFn: async () => {
      try {
        const resp = await apiFetch<Policy[]>('/alloy/policies');
        if (Array.isArray(resp) && resp.length > 0) return resp;
        return null;
      } catch {
        return null;
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  const { data: apiIncidents } = useStandardQuery({
    queryKey: ['alloyIncidents'],
    queryFn: async () => {
      try {
        const resp = await apiFetch<GovernanceIncident[]>('/alloy/governance/incidents');
        if (Array.isArray(resp)) return resp;
        return null;
      } catch {
        return null;
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  const isDemo = !apiPolicies || apiPolicies.length === 0;
  const policies = isDemo ? DEMO_POLICIES : apiPolicies;
  const incidents = apiIncidents ?? [];
  const incidentsAreDemo = !apiIncidents;

  const filtered = useMemo(() => {
    return policies.filter((p) => kindFilter === 'all' || p.kind === kindFilter);
  }, [policies, kindFilter]);

  const openIncidentCount = incidents.filter((i) => !i.resolvedAt).length;

  const policyStats = useMemo(
    () => ({
      total: policies.length,
      active: policies.filter((p) => p.status === 'active').length,
      templates: policies.filter((p) => p.kind === 'compliance_template').length,
      incidents: openIncidentCount,
    }),
    [policies, openIncidentCount],
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5 p-1">
      {showNewPolicy && (
        <NewPolicyDialog
          onClose={() => setShowNewPolicy(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['alloyPolicies'] })}
        />
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#8b5cf6' }}
            >
              Counsel · Policy Manager
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Policy Manager</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Approval matrices, model routing rules, cost controls, and compliance templates — per
            tenant.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDemo && <DataStateBadge state="demo" />}
          {!isDemo && <DataStateBadge state="live" />}
          <button
            onClick={() => setShowNewPolicy(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border"
            style={{
              borderColor: 'rgba(139,92,246,0.3)',
              background: 'rgba(139,92,246,0.08)',
              color: '#8b5cf6',
            }}
          >
            <Plus className="w-3 h-3" />
            New Policy
          </button>
        </div>
      </div>

      {isDemo && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-medium border"
          style={{
            background: 'rgba(75,139,219,0.04)',
            borderColor: 'rgba(75,139,219,0.1)',
            color: 'rgba(75,139,219,0.6)',
          }}
        >
          <Shield className="w-3 h-3 shrink-0" />
          Demo Mode — Illustrative policies shown. Connect the Counsel API for live tenant policy
          data.
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active Policies', value: policyStats.active, color: '#10b981' },
          { label: 'Total Policies', value: policyStats.total, color: '#4B8BDB' },
          { label: 'Compliance Templates', value: policyStats.templates, color: '#8b5cf6' },
          {
            label: 'Open Incidents',
            value: policyStats.incidents,
            color: policyStats.incidents > 0 ? '#f59e0b' : '#6b7280',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div
              className="text-[10px] font-medium mb-2"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {c.label}
            </div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {(['policies', 'incidents'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize"
            style={{
              borderColor: tab === t ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)',
              background: tab === t ? 'rgba(139,92,246,0.08)' : 'transparent',
              color: tab === t ? '#8b5cf6' : 'rgba(255,255,255,0.4)',
            }}
          >
            {t === 'incidents'
              ? `Incidents${openIncidentCount > 0 ? ` (${openIncidentCount})` : ''}`
              : 'Policies'}
          </button>
        ))}
      </div>

      {tab === 'policies' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setKindFilter('all')}
              className="px-2 py-1 rounded text-[10px] border transition-all"
              style={{
                borderColor:
                  kindFilter === 'all' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)',
                background: kindFilter === 'all' ? 'rgba(139,92,246,0.08)' : 'transparent',
                color: kindFilter === 'all' ? '#8b5cf6' : 'rgba(255,255,255,0.35)',
              }}
            >
              All
            </button>
            {Object.entries(KIND_CONFIG).map(([k, cfg]) => (
              <button
                key={k}
                onClick={() => setKindFilter(kindFilter === k ? 'all' : k)}
                className="px-2 py-1 rounded text-[10px] border transition-all"
                style={{
                  borderColor: kindFilter === k ? cfg.border : 'rgba(255,255,255,0.06)',
                  background: kindFilter === k ? cfg.bg : 'transparent',
                  color: kindFilter === k ? cfg.color : 'rgba(255,255,255,0.35)',
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((p) => (
              <PolicyCard key={p.id} policy={p} onView={setSelectedPolicy} />
            ))}
          </div>
        </div>
      )}

      {tab === 'incidents' && (
        <div className="space-y-2">
          {incidentsAreDemo && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-medium border"
              style={{
                background: 'rgba(75,139,219,0.04)',
                borderColor: 'rgba(75,139,219,0.1)',
                color: 'rgba(75,139,219,0.6)',
              }}
            >
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Demo Mode — Illustrative incidents shown. Live incidents populate as governance
              enforce runs execute.
            </div>
          )}
          {incidents.length === 0 && !incidentsAreDemo && (
            <div
              className="text-center py-12 text-[11px]"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              No incidents recorded yet. Incidents appear when governance policies block or flag
              agent actions.
            </div>
          )}
          {incidents.map((i) => (
            <IncidentRow key={i.id} incident={i} />
          ))}
        </div>
      )}
    </div>
  );
}
