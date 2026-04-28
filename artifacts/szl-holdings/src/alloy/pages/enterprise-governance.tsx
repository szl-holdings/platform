import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  DollarSign,
  Plus,
  Shield,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface Policy {
  id: number;
  orgId: number | null;
  name: string;
  description: string | null;
  policyType: string;
  scope: string;
  rules: unknown[];
  isActive: boolean;
  priority: number;
  complianceFramework: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ModelRoute {
  id: number;
  name: string;
  modelProvider: string;
  modelId: string;
  taskCategories: string[];
  maxCostPerCall: string | null;
  isAllowed: boolean;
  isDefault: boolean;
  priority: number;
  environment: string;
  isActive: boolean;
}

interface Budget {
  id: number;
  name: string;
  budgetType: string;
  limitAmount: string;
  currentSpend: string;
  warnThreshold: string;
  hardStopThreshold: string;
  alertSent80: boolean;
  alertSent100: boolean;
  isActive: boolean;
  periodStart: string;
}

interface Incident {
  id: number;
  severity: string;
  incidentType: string;
  title: string;
  description: string | null;
  agentId: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface AnalyticsData {
  agentRuns: { total_runs: string; completed: string; failed: string; avg_duration_ms: string };
  skillInvocations: { total: string; completed: string; failed: string; avg_duration_ms: string };
  policyViolations: Array<{ severity: string; count: string }>;
  approvalLatency: { avg_seconds: string; total_approvals: string };
  activePolicies: Array<{ policy_type: string; count: string }>;
}

interface CostSummary {
  summary: {
    total_cost: string;
    total_events: string;
    total_tokens_in: string;
    total_tokens_out: string;
  };
  byEventType: Array<{ event_type: string; count: string; cost: string }>;
  byModel: Array<{ model_provider: string; model_id: string; count: string; cost: string }>;
  activeBudgets: Budget[];
}

type TabKey = 'overview' | 'policies' | 'model-routing' | 'cost-controls' | 'incidents';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/30',
  high: 'text-[#c8953c] bg-[#c8953c]/10 border-[#c8953c]/30',
  medium: 'text-[#d4a054] bg-[#d4a054]/10 border-[#d4a054]/30',
  low: 'text-[#4a90b8] bg-[#4a90b8]/10 border-[#4a90b8]/30',
  info: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
};

const POLICY_TYPE_LABELS: Record<string, string> = {
  approval_matrix: 'Approval Matrix',
  model_routing: 'Model Routing',
  cost_ceiling: 'Cost Ceiling',
  agent_permission: 'Agent Permission',
  data_access: 'Data Access',
  compliance_template: 'Compliance Template',
};

function Chip({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${className}`}
    >
      {label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-[#d4a054]',
}: {
  icon: typeof Shield;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function OverviewTab() {
  const { data: analytics } = useStandardQuery({
    queryKey: ['governance-analytics'],
    queryFn: () =>
      apiFetch<{ data: AnalyticsData }>('/governance/analytics').then((r) => (r as any)?.data ?? r),
    retry: 1,
  });

  const { data: costData } = useStandardQuery({
    queryKey: ['governance-cost-summary'],
    queryFn: () =>
      apiFetch<{ data: CostSummary }>('/governance/cost-summary').then(
        (r) => (r as any)?.data ?? r,
      ),
    retry: 1,
  });

  const a = analytics as AnalyticsData | undefined;
  const c = costData as CostSummary | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Zap}
          label="Agent Runs (30d)"
          value={a?.agentRuns?.total_runs ?? '0'}
          sub={`${a?.agentRuns?.completed ?? 0} completed`}
        />
        <StatCard
          icon={Cpu}
          label="Skill Invocations"
          value={a?.skillInvocations?.total ?? '0'}
          sub={`Avg ${Math.round(Number(a?.skillInvocations?.avg_duration_ms ?? 0))}ms`}
          color="text-[#8b7ac8]"
        />
        <StatCard
          icon={Clock}
          label="Avg Approval Time"
          value={`${Math.round(Number(a?.approvalLatency?.avg_seconds ?? 0))}s`}
          sub={`${a?.approvalLatency?.total_approvals ?? 0} total`}
          color="text-[#4a90b8]"
        />
        <StatCard
          icon={DollarSign}
          label="Total Cost (30d)"
          value={`$${Number(c?.summary?.total_cost ?? 0).toFixed(2)}`}
          sub={`${c?.summary?.total_events ?? 0} events`}
          color="text-[#c8953c]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#d4a054]" />
            Active Policies
          </h3>
          {(a?.activePolicies?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500">
              No active policies configured. Create policies to enforce governance controls.
            </p>
          ) : (
            <div className="space-y-2">
              {a?.activePolicies?.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <span className="text-sm text-gray-300">
                    {POLICY_TYPE_LABELS[p.policy_type] ?? p.policy_type}
                  </span>
                  <span className="text-sm font-medium text-[#d4a054]">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#c45a4a]" />
            Policy Violations (30d)
          </h3>
          {(a?.policyViolations?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500">
              No policy violations recorded. Incidents will appear here when governance rules are
              triggered.
            </p>
          ) : (
            <div className="space-y-2">
              {a?.policyViolations?.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <Chip
                    label={v.severity}
                    className={SEVERITY_COLORS[v.severity] ?? SEVERITY_COLORS.info}
                  />
                  <span className="text-sm font-medium text-gray-300">{v.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#c8953c]" />
          Cost by Event Type
        </h3>
        {(c?.byEventType?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-500">
            No cost events recorded yet. Cost tracking starts when agents execute skills and model
            calls.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="py-2 pr-4">Event Type</th>
                  <th className="py-2 pr-4 text-right">Count</th>
                  <th className="py-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {c?.byEventType?.map((e, i) => (
                  <tr key={i} className="border-b border-gray-800/50 last:border-0">
                    <td className="py-2 pr-4 text-gray-300">{e.event_type}</td>
                    <td className="py-2 pr-4 text-right text-gray-400">{e.count}</td>
                    <td className="py-2 text-right text-[#c8953c]">${Number(e.cost).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PoliciesTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    description: '',
    policyType: 'approval_matrix',
    scope: 'tenant',
    priority: 100,
  });

  const { data } = useStandardQuery({
    queryKey: ['governance-policies'],
    queryFn: () =>
      apiFetch<{ data: Policy[] }>('/governance/policies?isActive=all').then(
        (r) => (r as any)?.data ?? r ?? [],
      ),
    retry: 1,
  });

  const createMutation = useStandardMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch('/governance/policies', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['governance-policies'] });
      setShowCreate(false);
      setNewPolicy({
        name: '',
        description: '',
        policyType: 'approval_matrix',
        scope: 'tenant',
        priority: 100,
      });
    },
  });

  const toggleMutation = useStandardMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiFetch(`/governance/policies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-policies'] }),
  });

  const policies = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Define approval matrices, model restrictions, and compliance templates per tenant.
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/30 rounded text-sm hover:bg-[#d4a054]/20 transition"
        >
          <Plus className="w-3.5 h-3.5" /> New Policy
        </button>
      </div>

      {showCreate && (
        <div className="bg-[#0d1117] border border-[#d4a054]/30 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={newPolicy.name}
              onChange={(e) => setNewPolicy((p) => ({ ...p, name: e.target.value }))}
              placeholder="Policy name"
              className="bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#d4a054]/50 focus:outline-none"
            />
            <select
              value={newPolicy.policyType}
              onChange={(e) => setNewPolicy((p) => ({ ...p, policyType: e.target.value }))}
              className="bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#d4a054]/50 focus:outline-none"
            >
              {Object.entries(POLICY_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <input
            value={newPolicy.description}
            onChange={(e) => setNewPolicy((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description"
            className="w-full bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#d4a054]/50 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newPolicy.scope}
              onChange={(e) => setNewPolicy((p) => ({ ...p, scope: e.target.value }))}
              className="bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#d4a054]/50 focus:outline-none"
            >
              <option value="global">Global</option>
              <option value="tenant">Tenant</option>
              <option value="team">Team</option>
              <option value="user">User</option>
            </select>
            <input
              type="number"
              value={newPolicy.priority}
              onChange={(e) => setNewPolicy((p) => ({ ...p, priority: Number(e.target.value) }))}
              placeholder="Priority"
              className="bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#d4a054]/50 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate(newPolicy)}
              disabled={!newPolicy.name}
              className="px-4 py-1.5 bg-[#d4a054] text-[var(--gi-bg-base)] rounded text-sm font-medium hover:bg-[#d4a054]/90 transition disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {policies.length === 0 ? (
        <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-8 text-center">
          <Shield className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-1">No governance policies configured</p>
          <p className="text-xs text-gray-600">
            Create policies to define approval matrices, model routing rules, and compliance
            controls for your organization.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => (
            <div
              key={p.id}
              className="bg-[#0d1117] border border-gray-800 rounded-lg p-4 flex items-center justify-between hover:border-gray-700 transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-200">{p.name}</span>
                  <Chip
                    label={POLICY_TYPE_LABELS[p.policyType] ?? p.policyType}
                    className="text-[#8b7ac8] bg-[#8b7ac8]/10 border-[#8b7ac8]/30"
                  />
                  <Chip
                    label={p.scope}
                    className="text-gray-400 bg-gray-400/10 border-gray-400/30"
                  />
                  {p.complianceFramework && (
                    <Chip
                      label={p.complianceFramework}
                      className="text-[#4a90b8] bg-[#4a90b8]/10 border-[#4a90b8]/30"
                    />
                  )}
                </div>
                {p.description && <p className="text-xs text-gray-500 truncate">{p.description}</p>}
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-xs text-gray-500">Priority: {p.priority}</span>
                <button
                  onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                  className={`px-2 py-1 text-xs rounded border transition ${p.isActive ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' : 'text-gray-500 bg-gray-500/10 border-gray-500/30'}`}
                >
                  {p.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModelRoutingTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: '',
    modelProvider: '',
    modelId: '',
    maxCostPerCall: '',
    environment: 'production',
  });

  const { data } = useStandardQuery({
    queryKey: ['governance-model-routing'],
    queryFn: () =>
      apiFetch<{ data: ModelRoute[] }>('/governance/model-routing').then(
        (r) => (r as any)?.data ?? r ?? [],
      ),
    retry: 1,
  });

  const createMutation = useStandardMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch('/governance/model-routing', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['governance-model-routing'] });
      setShowCreate(false);
    },
  });

  const toggleMutation = useStandardMutation({
    mutationFn: ({ id, isAllowed }: { id: number; isAllowed: boolean }) =>
      apiFetch(`/governance/model-routing/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAllowed }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-model-routing'] }),
  });

  const routes = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Control which AI models are allowed per environment with cost ceilings per call.
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8b7ac8]/10 text-[#8b7ac8] border border-[#8b7ac8]/30 rounded text-sm hover:bg-[#8b7ac8]/20 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Model Route
        </button>
      </div>

      {showCreate && (
        <div className="bg-[#0d1117] border border-[#8b7ac8]/30 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input
              value={newRoute.name}
              onChange={(e) => setNewRoute((p) => ({ ...p, name: e.target.value }))}
              placeholder="Route name"
              className="bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#8b7ac8]/50 focus:outline-none"
            />
            <input
              value={newRoute.modelProvider}
              onChange={(e) => setNewRoute((p) => ({ ...p, modelProvider: e.target.value }))}
              placeholder="Provider (openai, anthropic...)"
              className="bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#8b7ac8]/50 focus:outline-none"
            />
            <input
              value={newRoute.modelId}
              onChange={(e) => setNewRoute((p) => ({ ...p, modelId: e.target.value }))}
              placeholder="Model ID (gpt-4o, claude-3...)"
              className="bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#8b7ac8]/50 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={newRoute.maxCostPerCall}
              onChange={(e) => setNewRoute((p) => ({ ...p, maxCostPerCall: e.target.value }))}
              placeholder="Max cost per call ($)"
              className="bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#8b7ac8]/50 focus:outline-none"
            />
            <select
              value={newRoute.environment}
              onChange={(e) => setNewRoute((p) => ({ ...p, environment: e.target.value }))}
              className="bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#8b7ac8]/50 focus:outline-none"
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate(newRoute)}
              disabled={!newRoute.name || !newRoute.modelProvider || !newRoute.modelId}
              className="px-4 py-1.5 bg-[#8b7ac8] text-white rounded text-sm font-medium hover:bg-[#8b7ac8]/90 transition disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {routes.length === 0 ? (
        <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-8 text-center">
          <Cpu className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-1">No model routing policies</p>
          <p className="text-xs text-gray-600">
            Define which AI models are allowed per environment and set cost ceilings to control
            spending.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Provider</th>
                <th className="py-2 pr-4">Model</th>
                <th className="py-2 pr-4">Max Cost</th>
                <th className="py-2 pr-4">Env</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-800/50 last:border-0 hover:bg-gray-900/30"
                >
                  <td className="py-2.5 pr-4 text-gray-200">{r.name}</td>
                  <td className="py-2.5 pr-4 text-gray-400">{r.modelProvider}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-[#8b7ac8]">{r.modelId}</td>
                  <td className="py-2.5 pr-4 text-gray-400">
                    {r.maxCostPerCall ? `$${r.maxCostPerCall}` : '—'}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Chip
                      label={r.environment}
                      className="text-[#4a90b8] bg-[#4a90b8]/10 border-[#4a90b8]/30"
                    />
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => toggleMutation.mutate({ id: r.id, isAllowed: !r.isAllowed })}
                      className={`px-2 py-0.5 text-xs rounded border transition ${r.isAllowed ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' : 'text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/30'}`}
                    >
                      {r.isAllowed ? 'Allowed' : 'Blocked'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CostControlsTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newBudget, setNewBudget] = useState({ name: '', budgetType: 'monthly', limitAmount: '' });

  const { data: costData } = useStandardQuery({
    queryKey: ['governance-cost-summary'],
    queryFn: () =>
      apiFetch<{ data: CostSummary }>('/governance/cost-summary').then(
        (r) => (r as any)?.data ?? r,
      ),
    retry: 1,
  });

  const createMutation = useStandardMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch('/governance/budgets', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['governance-cost-summary'] });
      setShowCreate(false);
    },
  });

  const c = costData as CostSummary | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Cost (30d)"
          value={`$${Number(c?.summary?.total_cost ?? 0).toFixed(2)}`}
          color="text-[#c8953c]"
        />
        <StatCard
          icon={Activity}
          label="Total Events"
          value={c?.summary?.total_events ?? '0'}
          color="text-[#4a90b8]"
        />
        <StatCard
          icon={Zap}
          label="Tokens In"
          value={Number(c?.summary?.total_tokens_in ?? 0).toLocaleString()}
          color="text-[#8b7ac8]"
        />
        <StatCard
          icon={Zap}
          label="Tokens Out"
          value={Number(c?.summary?.total_tokens_out ?? 0).toLocaleString()}
          color="text-[#d4a054]"
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Budget Controls
        </h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c8953c]/10 text-[#c8953c] border border-[#c8953c]/30 rounded text-sm hover:bg-[#c8953c]/20 transition"
        >
          <Plus className="w-3.5 h-3.5" /> New Budget
        </button>
      </div>

      {showCreate && (
        <div className="bg-[#0d1117] border border-[#c8953c]/30 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input
              value={newBudget.name}
              onChange={(e) => setNewBudget((p) => ({ ...p, name: e.target.value }))}
              placeholder="Budget name"
              className="bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#c8953c]/50 focus:outline-none"
            />
            <select
              value={newBudget.budgetType}
              onChange={(e) => setNewBudget((p) => ({ ...p, budgetType: e.target.value }))}
              className="bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#c8953c]/50 focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="per_workflow">Per Workflow</option>
            </select>
            <input
              value={newBudget.limitAmount}
              onChange={(e) => setNewBudget((p) => ({ ...p, limitAmount: e.target.value }))}
              placeholder="Limit ($)"
              className="bg-[var(--gi-bg-base)] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-[#c8953c]/50 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate(newBudget)}
              disabled={!newBudget.name || !newBudget.limitAmount}
              className="px-4 py-1.5 bg-[#c8953c] text-[var(--gi-bg-base)] rounded text-sm font-medium hover:bg-[#c8953c]/90 transition disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {(c?.activeBudgets?.length ?? 0) === 0 ? (
        <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-8 text-center">
          <DollarSign className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-1">No budgets configured</p>
          <p className="text-xs text-gray-600">
            Create budgets with monthly limits and automatic alerting at 80% and 100% thresholds.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {c?.activeBudgets?.map((b) => {
            const spent = Number(b.currentSpend);
            const limit = Number(b.limitAmount);
            const pct = limit > 0 ? (spent / limit) * 100 : 0;
            const barColor =
              pct >= 100 ? 'bg-[#c45a4a]' : pct >= 80 ? 'bg-[#c8953c]' : 'bg-[#4a90b8]';
            return (
              <div key={b.id} className="bg-[#0d1117] border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">{b.name}</span>
                    <Chip
                      label={b.budgetType}
                      className="text-gray-400 bg-gray-400/10 border-gray-400/30"
                    />
                  </div>
                  <span className="text-sm text-gray-400">
                    ${spent.toFixed(2)} / ${limit.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`${barColor} h-2 rounded-full transition-all`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600">{pct.toFixed(1)}% used</span>
                  <div className="flex gap-2">
                    {b.alertSent80 && (
                      <Chip label="80% Alert Sent" className={SEVERITY_COLORS.medium} />
                    )}
                    {b.alertSent100 && (
                      <Chip label="Hard Stop" className={SEVERITY_COLORS.critical} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(c?.byModel?.length ?? 0) > 0 && (
        <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#8b7ac8]" /> Cost by Model
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="py-2 pr-4">Provider</th>
                <th className="py-2 pr-4">Model</th>
                <th className="py-2 pr-4 text-right">Calls</th>
                <th className="py-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {c?.byModel?.map((m, i) => (
                <tr key={i} className="border-b border-gray-800/50 last:border-0">
                  <td className="py-2 pr-4 text-gray-400">{m.model_provider}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-[#8b7ac8]">{m.model_id}</td>
                  <td className="py-2 pr-4 text-right text-gray-400">{m.count}</td>
                  <td className="py-2 text-right text-[#c8953c]">${Number(m.cost).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function IncidentsTab() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data } = useStandardQuery({
    queryKey: ['governance-incidents'],
    queryFn: () =>
      apiFetch<{ data: Incident[] }>('/governance/incidents').then(
        (r) => (r as any)?.data ?? r ?? [],
      ),
    retry: 1,
    refetchInterval: 30000,
  });

  const resolveMutation = useStandardMutation({
    mutationFn: ({ id, resolution }: { id: number; resolution: string }) =>
      apiFetch(`/governance/incidents/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolution }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-incidents'] }),
  });

  const incidents = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Governance incidents — policy violations, budget overruns, unauthorized access attempts, and
        agent errors.
      </p>
      {incidents.length === 0 ? (
        <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-1">No incidents recorded</p>
          <p className="text-xs text-gray-600">
            Governance incidents appear here when policies are violated, budgets are exceeded, or
            agents produce errors.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-[#0d1117] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition"
            >
              <button
                onClick={() => setExpandedId(expandedId === inc.id ? null : inc.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <Chip
                    label={inc.severity}
                    className={SEVERITY_COLORS[inc.severity] ?? SEVERITY_COLORS.info}
                  />
                  <span className="text-sm text-gray-200">{inc.title}</span>
                  <Chip
                    label={inc.incidentType.replace(/_/g, ' ')}
                    className="text-gray-400 bg-gray-400/10 border-gray-400/30"
                  />
                </div>
                <div className="flex items-center gap-3">
                  {inc.resolvedAt ? (
                    <Chip
                      label="Resolved"
                      className="text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                    />
                  ) : (
                    <Chip label="Open" className={SEVERITY_COLORS.high} />
                  )}
                  {expandedId === inc.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </button>
              {expandedId === inc.id && (
                <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-2">
                  {inc.description && <p className="text-sm text-gray-400">{inc.description}</p>}
                  {inc.agentId && <p className="text-xs text-gray-500">Agent: {inc.agentId}</p>}
                  <p className="text-xs text-gray-600">
                    {new Date(inc.createdAt).toLocaleString()}
                  </p>
                  {!inc.resolvedAt && (
                    <button
                      onClick={() =>
                        resolveMutation.mutate({ id: inc.id, resolution: 'Resolved by operator' })
                      }
                      className="mt-2 px-3 py-1.5 bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 rounded text-xs hover:bg-emerald-400/20 transition"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {inc.resolution && (
                    <p className="text-xs text-gray-400 mt-1">Resolution: {inc.resolution}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TABS: { key: TabKey; label: string; icon: typeof Shield }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'policies', label: 'Policies', icon: Shield },
  { key: 'model-routing', label: 'Model Routing', icon: Cpu },
  { key: 'cost-controls', label: 'Cost Controls', icon: DollarSign },
  { key: 'incidents', label: 'Incidents', icon: AlertTriangle },
];

export default function EnterpriseGovernancePage() {
  const [tab, setTab] = useState<TabKey>('overview');

  return (
    <div className="min-h-screen bg-[var(--gi-bg-base)] text-gray-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6 text-[#d4a054]" />
            <h1 className="text-xl font-semibold text-gray-100">Enterprise Governance</h1>
            <Chip
              label="Functional Alpha"
              className="text-[#d4a054] bg-[#d4a054]/10 border-[#d4a054]/30"
            />
          </div>
          <p className="text-sm text-gray-500 ml-9">
            Approval matrices, model routing, cost controls, and compliance policies
          </p>
        </div>

        <div className="flex items-center gap-1 border-b border-gray-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition ${tab === t.key ? 'text-[#d4a054] border-[#d4a054]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab />}
        {tab === 'policies' && <PoliciesTab />}
        {tab === 'model-routing' && <ModelRoutingTab />}
        {tab === 'cost-controls' && <CostControlsTab />}
        {tab === 'incidents' && <IncidentsTab />}
      </div>
    </div>
  );
}
