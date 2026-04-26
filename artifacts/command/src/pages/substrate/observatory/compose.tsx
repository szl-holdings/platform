import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Layers,
  Plus,
  Save,
  Shield,
  Trash2,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';

const API = '/api/nexus-mcp';
const ACCENT = '#22d3ee';

interface WorkflowStep {
  id: string;
  toolName: string;
  toolSource: 'internal' | 'external';
  externalServerId?: string;
  inputMapping: Record<string, string>;
  conditions: Array<{ field: string; operator: string; value: unknown }>;
  requiresApproval: boolean;
  approvalRole?: string;
  timeoutMs: number;
}

interface ExternalServer {
  id: string;
  name: string;
  discoveredTools: Array<{ name: string; description: string; riskLevel: string }>;
  healthStatus: string;
}

interface GovernedWorkflow {
  id?: number;
  name: string;
  description: string;
  triggerType: string;
  steps: WorkflowStep[];
}

const INTERNAL_TOOLS = [
  { name: 'alloy_research', description: 'Multi-domain intelligence research', riskLevel: 'low' },
  { name: 'alloy_create_artifact', description: 'Generate structured artifacts', riskLevel: 'medium' },
  { name: 'alloy_launch_workflow', description: 'Launch a named workflow', riskLevel: 'high' },
  { name: 'alloy_approve_decision', description: 'Approve or reject a decision', riskLevel: 'high' },
  { name: 'alloy_skill_invoke', description: 'Invoke a registered skill', riskLevel: 'medium' },
  { name: 'connector_hub_execute', description: 'Execute a connector capability', riskLevel: 'medium' },
  { name: 'vessels_fleet_status', description: 'Query fleet positions', riskLevel: 'low' },
  { name: 'firestorm_threat_scan', description: 'Scan for cyber threats', riskLevel: 'medium' },
  { name: 'terra_property_search', description: 'Search real estate data', riskLevel: 'low' },
];

function newStep(): WorkflowStep {
  return {
    id: crypto.randomUUID(),
    toolName: '',
    toolSource: 'internal',
    inputMapping: {},
    conditions: [],
    requiresApproval: false,
    timeoutMs: 30000,
  };
}

function StepCard({
  step,
  index,
  totalSteps,
  externalServers,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  step: WorkflowStep;
  index: number;
  totalSteps: number;
  externalServers: ExternalServer[];
  onUpdate: (step: WorkflowStep) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const selectedServer = externalServers.find((s) => s.id === step.externalServerId);
  const availableTools =
    step.toolSource === 'internal'
      ? INTERNAL_TOOLS
      : selectedServer?.discoveredTools.map((t) => ({ name: t.name, description: t.description, riskLevel: t.riskLevel })) ?? [];

  const selectedTool = availableTools.find((t) => t.name === step.toolName);
  const isHighRisk = selectedTool?.riskLevel === 'high';

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: isHighRisk ? '#f59e0b40' : 'hsla(0,0%,100%,0.1)',
        background: 'hsl(214,12%,7%)',
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b"
        style={{ borderColor: 'hsla(0,0%,100%,0.08)', background: 'hsl(214,12%,9%)' }}
      >
        <span
          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0"
          style={{ background: `${ACCENT}20`, color: ACCENT }}
        >
          {index + 1}
        </span>
        <span className="text-xs font-semibold flex-1">
          {step.toolName || 'Select a tool'}
        </span>
        {isHighRisk && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" style={{ color: '#f59e0b' }} />
            <span className="text-[9px]" style={{ color: '#f59e0b' }}>High risk</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={index === 0} className="p-1 rounded hover:bg-white/5 disabled:opacity-30">
            <ChevronUp className="w-3 h-3" style={{ color: 'hsl(214,7%,45%)' }} />
          </button>
          <button onClick={onMoveDown} disabled={index === totalSteps - 1} className="p-1 rounded hover:bg-white/5 disabled:opacity-30">
            <ChevronDown className="w-3 h-3" style={{ color: 'hsl(214,7%,45%)' }} />
          </button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-white/5">
            <Trash2 className="w-3 h-3" style={{ color: '#ef4444' }} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,45%)' }}>
              Tool Source
            </label>
            <select
              value={step.toolSource}
              onChange={(e) => onUpdate({ ...step, toolSource: e.target.value as 'internal' | 'external', toolName: '', externalServerId: undefined })}
              className="w-full text-xs rounded-md px-2 py-1.5"
              style={{ background: 'hsl(214,12%,10%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
            >
              <option value="internal">Internal Tool</option>
              <option value="external">External MCP Server</option>
            </select>
          </div>

          {step.toolSource === 'external' && (
            <div>
              <label className="block text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,45%)' }}>
                External Server
              </label>
              <select
                value={step.externalServerId ?? ''}
                onChange={(e) => onUpdate({ ...step, externalServerId: e.target.value, toolName: '' })}
                className="w-full text-xs rounded-md px-2 py-1.5"
                style={{ background: 'hsl(214,12%,10%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
              >
                <option value="">Select server...</option>
                {externalServers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.healthStatus})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,45%)' }}>
            Tool
          </label>
          <select
            value={step.toolName}
            onChange={(e) => onUpdate({ ...step, toolName: e.target.value })}
            disabled={step.toolSource === 'external' && !step.externalServerId}
            className="w-full text-xs rounded-md px-2 py-1.5 disabled:opacity-50"
            style={{ background: 'hsl(214,12%,10%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
          >
            <option value="">Select tool...</option>
            {availableTools.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name} {t.riskLevel === 'high' ? '⚠' : ''}
              </option>
            ))}
          </select>
          {selectedTool && (
            <p className="text-[10px] mt-1" style={{ color: 'hsl(214,7%,45%)' }}>
              {selectedTool.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => onUpdate({ ...step, requiresApproval: !step.requiresApproval })}
              className="w-8 h-4 rounded-full transition-colors relative"
              style={{
                background: step.requiresApproval ? '#22c55e' : 'hsla(0,0%,100%,0.1)',
              }}
            >
              <div
                className="absolute top-0.5 w-3 h-3 rounded-full transition-transform"
                style={{
                  background: 'white',
                  left: '2px',
                  transform: step.requiresApproval ? 'translateX(16px)' : 'none',
                }}
              />
            </div>
            <span className="text-[10px]" style={{ color: 'hsl(214,7%,55%)' }}>
              Requires Approval
            </span>
          </label>

          {step.requiresApproval && (
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3" style={{ color: '#22c55e' }} />
              <select
                value={step.approvalRole ?? 'operator'}
                onChange={(e) => onUpdate({ ...step, approvalRole: e.target.value })}
                className="text-[10px] rounded px-1.5 py-0.5"
                style={{ background: 'hsl(214,12%,10%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
              >
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[9px]" style={{ color: 'hsl(214,7%,45%)' }}>Timeout:</span>
            <input
              type="number"
              value={step.timeoutMs / 1000}
              onChange={(e) => onUpdate({ ...step, timeoutMs: Number(e.target.value) * 1000 })}
              className="w-16 text-[10px] rounded px-1.5 py-0.5 text-right"
              style={{ background: 'hsl(214,12%,10%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
              min={1}
              max={300}
            />
            <span className="text-[9px]" style={{ color: 'hsl(214,7%,45%)' }}>s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkflowComposer() {
  const [, navigate] = useLocation();
  const [workflow, setWorkflow] = useState<GovernedWorkflow>({
    name: '',
    description: '',
    triggerType: 'manual',
    steps: [],
  });
  const [externalServers, setExternalServers] = useState<ExternalServer[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/servers`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { data: ExternalServer[] }) => setExternalServers(d.data ?? []))
      .catch(() => {});
  }, []);

  const addStep = () => {
    setWorkflow((w) => ({ ...w, steps: [...w.steps, newStep()] }));
  };

  const updateStep = (index: number, step: WorkflowStep) => {
    setWorkflow((w) => {
      const steps = [...w.steps];
      steps[index] = step;
      return { ...w, steps };
    });
  };

  const removeStep = (index: number) => {
    setWorkflow((w) => ({
      ...w,
      steps: w.steps.filter((_, i) => i !== index),
    }));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= workflow.steps.length) return;
    setWorkflow((w) => {
      const steps = [...w.steps];
      [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
      return { ...w, steps };
    });
  };

  const save = useCallback(async () => {
    if (!workflow.name.trim()) {
      setError('Workflow name is required');
      return;
    }
    if (workflow.steps.length === 0) {
      setError('Add at least one step');
      return;
    }
    const unnamedStep = workflow.steps.find((s) => !s.toolName);
    if (unnamedStep) {
      setError('All steps must have a tool selected');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const method = workflow.id ? 'PUT' : 'POST';
      const url = workflow.id ? `${API}/workflows/${workflow.id}` : `${API}/workflows`;
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });
      if (res.ok) {
        const d = await res.json() as { data: GovernedWorkflow };
        setWorkflow((w) => ({ ...w, id: d.data.id }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError('Failed to save workflow');
      }
    } catch {
      setError('Network error while saving');
    } finally {
      setSaving(false);
    }
  }, [workflow]);

  const highRiskSteps = workflow.steps.filter((s) => {
    const tool = INTERNAL_TOOLS.find((t) => t.name === s.toolName);
    return tool?.riskLevel === 'high' && !s.requiresApproval;
  });

  return (
    <div className="min-h-full" style={{ background: 'hsl(214,16%,4%)', color: 'hsl(38,8%,92%)' }}>
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
        style={{ background: 'hsl(214,16%,4%)', borderColor: 'hsla(0,0%,100%,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <Link href="/substrate/observatory">
            <a className="p-1 rounded hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" style={{ color: 'hsl(214,7%,45%)' }} />
            </a>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="text-sm font-semibold">Governed Workflow Composer</span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: 'hsl(214,7%,45%)' }}>
              Build multi-step tool chains with policy enforcement at each step
            </p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs transition-colors hover:opacity-80 disabled:opacity-50"
          style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`, color: ACCENT }}
        >
          {saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Workflow'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg border"
            style={{ borderColor: '#ef444440', background: '#ef444410', color: '#ef4444' }}
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        {highRiskSteps.length > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg border"
            style={{ borderColor: '#f59e0b40', background: '#f59e0b08', color: '#f59e0b' }}
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <p className="text-xs">
              {highRiskSteps.length} high-risk step{highRiskSteps.length > 1 ? 's' : ''} without approval gates. Consider enabling approval for{' '}
              {highRiskSteps.map((s) => s.toolName).join(', ')}.
            </p>
          </div>
        )}

        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: 'hsla(0,0%,100%,0.08)', background: 'hsl(214,12%,6%)' }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'hsla(0,0%,100%,0.08)' }}>
            <span className="text-xs font-semibold">Workflow Definition</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,45%)' }}>
                Name *
              </label>
              <input
                type="text"
                value={workflow.name}
                onChange={(e) => setWorkflow((w) => ({ ...w, name: e.target.value }))}
                placeholder="e.g. Daily Threat Intelligence Brief"
                className="w-full text-xs rounded-md px-3 py-2"
                style={{ background: 'hsl(214,12%,10%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,45%)' }}>
                Description
              </label>
              <textarea
                value={workflow.description}
                onChange={(e) => setWorkflow((w) => ({ ...w, description: e.target.value }))}
                placeholder="What does this workflow do?"
                rows={2}
                className="w-full text-xs rounded-md px-3 py-2 resize-none"
                style={{ background: 'hsl(214,12%,10%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,45%)' }}>
                Trigger
              </label>
              <select
                value={workflow.triggerType}
                onChange={(e) => setWorkflow((w) => ({ ...w, triggerType: e.target.value }))}
                className="text-xs rounded-md px-2 py-1.5"
                style={{ background: 'hsl(214,12%,10%)', border: '1px solid hsla(0,0%,100%,0.1)', color: 'hsl(38,8%,92%)' }}
              >
                <option value="manual">Manual</option>
                <option value="schedule">Scheduled</option>
                <option value="signal">Signal Event</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span className="text-xs font-semibold">Steps ({workflow.steps.length})</span>
            </div>
            <button
              onClick={addStep}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors hover:opacity-80"
              style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
            >
              <Plus className="w-3 h-3" />
              Add Step
            </button>
          </div>

          {workflow.steps.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed"
              style={{ borderColor: 'hsla(0,0%,100%,0.1)' }}
            >
              <Zap className="w-8 h-8 mb-3" style={{ color: 'hsl(214,7%,20%)' }} />
              <p className="text-xs" style={{ color: 'hsl(214,7%,35%)' }}>
                No steps yet — add your first tool call
              </p>
              <button
                onClick={addStep}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
                style={{ background: `${ACCENT}15`, color: ACCENT }}
              >
                <Plus className="w-3 h-3" />
                Add Step
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {workflow.steps.map((step, index) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={index}
                  totalSteps={workflow.steps.length}
                  externalServers={externalServers.filter((s) => s.healthStatus === 'healthy')}
                  onUpdate={(s) => updateStep(index, s)}
                  onRemove={() => removeStep(index)}
                  onMoveUp={() => moveStep(index, -1)}
                  onMoveDown={() => moveStep(index, 1)}
                />
              ))}
            </div>
          )}
        </div>

        {externalServers.length > 0 && (
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: 'hsla(0,0%,100%,0.08)', background: 'hsl(214,12%,6%)' }}
          >
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'hsla(0,0%,100%,0.08)' }}>
              <Globe className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
              <span className="text-xs font-semibold">Available External Servers</span>
            </div>
            <div className="divide-y" style={{ divideColor: 'hsla(0,0%,100%,0.06)' }}>
              {externalServers.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: s.healthStatus === 'healthy' ? '#22c55e' : '#ef4444' }}
                  />
                  <span className="text-xs font-mono">{s.name}</span>
                  <span className="text-[10px] ml-auto" style={{ color: 'hsl(214,7%,45%)' }}>
                    {s.discoveredTools.length} tools
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
