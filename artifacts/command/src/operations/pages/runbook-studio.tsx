import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  GitBranch,
  Layers,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  Terminal,
  Trash2,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';

const BG = 'var(--gi-bg-base)';
const SURFACE = 'rgba(255,255,255,0.025)';
const SURFACE_HOVER = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.07)';
const BORDER_STRONG = 'rgba(255,255,255,0.12)';
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.52)',
  muted: 'rgba(255,255,255,0.28)',
  ghost: 'rgba(255,255,255,0.14)',
};
const GOLD = '#d4a054';
const GREEN = '#10b981';
const BLUE = '#3b82f6';
const PURPLE = '#8b5cf6';
const AMBER = '#f59e0b';
const RED = '#ef4444';

const API = '/api/mission-runbooks';

type StepType = 'tool_call' | 'approval' | 'human_task' | 'condition' | 'parallel';
type RunStatus = 'running' | 'paused' | 'pending_approval' | 'completed' | 'failed';
type TriggerType = 'manual' | 'alert_bus' | 'schedule';

interface RunbookStep {
  id: string;
  type: StepType;
  label: string;
  description: string;
  domain?: string;
  tool?: string;
  estimatedMs: number;
  requiresApproval?: boolean;
  approver?: string;
  condition?: string;
  outputs?: string[];
}

interface Runbook {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  version: string;
  description: string;
  owner: string;
  steps: RunbookStep[];
  triggers: Array<{ type: TriggerType; rule?: string }>;
  tags: string[];
  lastUpdated: number;
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  lastRun?: number;
}

interface RunbookRun {
  id: string;
  runbookId: string;
  runbookName: string;
  runbookVersion?: string;
  status: RunStatus;
  startedAt: number;
  completedAt?: number;
  owner: string;
  currentStep: number;
  totalSteps: number;
  triggeredBy: TriggerType;
  alertSource?: string;
  pendingApprover?: string;
}

async function fetchRunbookSnapshot(runbookId: string, version?: string): Promise<Runbook | null> {
  try {
    const qs = version ? `?version=${encodeURIComponent(version)}` : '';
    return await apiFetch<Runbook>(`${API}/${runbookId}/snapshot${qs}`);
  } catch {
    return null;
  }
}

interface StatRow {
  k: string;
  v: string;
  c?: string;
}

const STEP_META: Record<StepType, { color: string; icon: typeof Terminal; label: string }> = {
  tool_call: { color: BLUE, icon: Terminal, label: 'Tool Call' },
  approval: { color: PURPLE, icon: Shield, label: 'Approval Gate' },
  human_task: { color: AMBER, icon: Users, label: 'Human Task' },
  condition: { color: AMBER, icon: GitBranch, label: 'Condition' },
  parallel: { color: GREEN, icon: Zap, label: 'Parallel' },
};

const STATUS_META: Record<RunStatus, { color: string; label: string; icon: typeof Play }> = {
  running: { color: GREEN, label: 'Running', icon: Play },
  paused: { color: AMBER, label: 'Paused', icon: Pause },
  pending_approval: { color: PURPLE, label: 'Pending Approval', icon: Shield },
  completed: { color: TEXT.muted, label: 'Completed', icon: TrendingUp },
  failed: { color: RED, label: 'Failed', icon: AlertTriangle },
};

function fmt(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 60000) return `${Math.floor(d / 1000)}s ago`;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const CSRF_MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCsrf(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${CSRF_COOKIE}=`));
  return m ? decodeURIComponent(m.slice(CSRF_COOKIE.length + 1)) : null;
}

async function warmCsrf(base: string) {
  try { await fetch(`${base}/csrf-token`, { method: 'GET', credentials: 'include' }); } catch { /* best-effort */ }
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const method = (opts?.method ?? 'GET').toUpperCase();
  const needsCsrf = CSRF_MUTATING.has(method);
  let retried = false;

  const doFetch = async (): Promise<T> => {
    const csrf = needsCsrf ? readCsrf() : null;
    const res = await fetch(path, {
      credentials: 'include',
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(needsCsrf && csrf ? { [CSRF_HEADER]: csrf } : {}),
        ...(opts?.headers as Record<string, string> | undefined),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      if (res.status === 403 && !retried) {
        let body: { code?: string } | null = null;
        try { body = JSON.parse(text); } catch { /* ignore */ }
        if (body?.code === 'CSRF_TOKEN_MISSING' || body?.code === 'CSRF_TOKEN_MISMATCH') {
          retried = true;
          const urlPath = path.startsWith('http') ? (() => { try { return new URL(path).pathname; } catch { return path; } })() : path;
          const m = urlPath.match(/^(.*?\/api)(?:\/|$)/);
          await warmCsrf(m ? m[1] : '/api');
          return doFetch();
        }
      }
      throw new Error(`API error ${res.status}: ${text || res.statusText}`);
    }
    const json = await res.json();
    return (json.data ?? json) as T;
  };

  return doFetch();
}

function generateAuditPdf(run: RunbookRun, runbook: Runbook) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = margin;

  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text('Mission Runbook — Audit Record', margin, y);
  y += 28;

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`Runbook: ${run.runbookName}  |  Run ID: ${run.id}`, margin, y);
  y += 16;
  doc.text(`Version: ${run.runbookVersion ?? runbook.version}  |  Category: ${runbook.category}`, margin, y);
  y += 16;
  doc.text(`Owner: ${run.owner}  |  Triggered by: ${run.triggeredBy}`, margin, y);
  y += 16;
  doc.text(`Status: ${run.status}  |  Started: ${new Date(run.startedAt).toISOString()}`, margin, y);
  if (run.completedAt) {
    y += 16;
    doc.text(`Completed: ${new Date(run.completedAt).toISOString()}  |  Duration: ${fmt(run.completedAt - run.startedAt)}`, margin, y);
  }
  y += 24;

  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text('Execution Steps', margin, y);
  y += 18;

  doc.setFontSize(10);
  runbook.steps.forEach((step, i) => {
    if (y > 760) { doc.addPage(); y = margin; }
    const done = i < run.currentStep;
    doc.setTextColor(done ? 16 : 100, done ? 185 : 100, done ? 129 : 100);
    doc.text(`${i + 1}. [${done ? 'DONE' : i === run.currentStep ? 'ACTIVE' : 'PENDING'}] ${step.label}`, margin, y);
    y += 14;
    doc.setTextColor(100, 100, 100);
    doc.text(`   ${step.description}`, margin, y);
    y += 14;
    if (step.approver) {
      doc.text(`   Requires approval: ${step.approver}`, margin, y);
      y += 14;
    }
  });

  y += 16;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated by Unified Command · ${new Date().toISOString()}`, margin, y);

  doc.save(`audit-${run.id}-${Date.now()}.pdf`);
}

function StepRow({
  step,
  index,
  replayStep,
  replayActive,
  editable,
  onEdit,
  onDelete,
}: {
  step: RunbookStep;
  index: number;
  replayStep?: number;
  replayActive?: boolean;
  editable?: boolean;
  onEdit?: (index: number, field: keyof RunbookStep, value: string) => void;
  onDelete?: (index: number) => void;
}) {
  const meta = STEP_META[step.type];
  const Icon = meta.icon;
  const isDone = replayStep !== undefined && index < replayStep;
  const isActive = replayStep === index && replayActive;

  return (
    <div className="flex items-start gap-3 group">
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
          style={{
            background: isDone
              ? `${GREEN}18`
              : isActive
                ? `${meta.color}22`
                : `${meta.color}10`,
            border: `1px solid ${isDone ? GREEN : meta.color}30`,
          }}
        >
          {isDone ? (
            <TrendingUp className="w-3.5 h-3.5" style={{ color: GREEN }} />
          ) : isActive ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: meta.color }} />
          ) : (
            <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
          )}
        </div>
        <div
          className="w-px flex-1 mt-1"
          style={{ background: isDone ? `${GREEN}20` : BORDER, minHeight: 14 }}
        />
      </div>
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: meta.color }}>
            {meta.label}
          </span>
          {step.domain && (
            <span
              className="text-[8px] px-1.5 py-0.5 rounded font-mono"
              style={{ background: 'rgba(255,255,255,0.05)', color: TEXT.muted }}
            >
              {step.domain}
            </span>
          )}
          <span className="text-[9px] font-mono ml-auto shrink-0" style={{ color: TEXT.muted }}>
            ~{fmt(step.estimatedMs)}
          </span>
          {editable && onDelete && (
            <button onClick={() => onDelete(index)} style={{ color: TEXT.ghost }}>
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {editable && onEdit ? (
          <input
            className="w-full rounded px-2 py-1 text-[11px] font-semibold outline-none mb-0.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT.primary }}
            value={step.label}
            onChange={(e) => onEdit(index, 'label', e.target.value)}
            placeholder="Step label"
          />
        ) : (
          <div className="text-[11px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>
            {step.label}
          </div>
        )}
        {editable && onEdit ? (
          <input
            className="w-full rounded px-2 py-1 text-[10px] outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT.secondary }}
            value={step.description}
            onChange={(e) => onEdit(index, 'description', e.target.value)}
            placeholder="Step description"
          />
        ) : (
          <p className="text-[10px] leading-relaxed" style={{ color: TEXT.secondary }}>
            {step.description}
          </p>
        )}
        {step.condition && (
          <div
            className="mt-1.5 text-[9px] font-mono px-2 py-1 rounded"
            style={{ background: 'rgba(245,158,11,0.06)', color: AMBER, border: '1px solid rgba(245,158,11,0.15)' }}
          >
            if: {step.condition}
          </div>
        )}
        {step.approver && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[9px]" style={{ color: PURPLE }}>
            <Shield className="w-3 h-3" />
            Requires: {step.approver}
          </div>
        )}
        {step.outputs && step.outputs.length > 0 && (
          <div className="mt-1.5 flex gap-1 flex-wrap">
            {step.outputs.map((o) => (
              <span
                key={o}
                className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(59,130,246,0.08)', color: BLUE, border: '1px solid rgba(59,130,246,0.15)' }}
              >
                → {o}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RunRow({
  run,
  onSelect,
  selected,
}: {
  run: RunbookRun;
  onSelect: () => void;
  selected: boolean;
}) {
  const sm = STATUS_META[run.status];
  const StatusIcon = sm.icon;
  const pct = Math.round((run.currentStep / run.totalSteps) * 100);

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-3 rounded-lg transition-all"
      style={{
        background: selected ? `${GOLD}08` : SURFACE,
        border: `1px solid ${selected ? `${GOLD}30` : BORDER}`,
      }}
    >
      <div className="flex items-start gap-2 mb-2">
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${sm.color}15` }}
        >
          {run.status === 'running' ? (
            <RefreshCw className="w-3 h-3 animate-spin" style={{ color: sm.color }} />
          ) : (
            <StatusIcon className="w-3 h-3" style={{ color: sm.color }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold truncate" style={{ color: TEXT.primary }}>
            {run.runbookName}
          </div>
          <div className="text-[9px] font-mono mt-0.5" style={{ color: TEXT.muted }}>
            {run.id} · {run.owner}
          </div>
        </div>
        <span
          className="text-[8px] font-mono px-1.5 py-0.5 rounded shrink-0"
          style={{ background: `${sm.color}10`, color: sm.color }}
        >
          {sm.label}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="flex-1 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: run.status === 'failed' ? RED : run.status === 'completed' ? GREEN : GOLD,
            }}
          />
        </div>
        <span className="text-[9px] font-mono shrink-0" style={{ color: TEXT.muted }}>
          {run.currentStep}/{run.totalSteps}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[9px]" style={{ color: TEXT.muted }}>
        <span>{timeAgo(run.startedAt)}</span>
        {run.triggeredBy === 'alert_bus' && (
          <span style={{ color: AMBER }}>⚡ Alert Bus</span>
        )}
        {run.triggeredBy === 'schedule' && <span>🕐 Scheduled</span>}
        {run.pendingApprover && (
          <span style={{ color: PURPLE }}>Awaiting {run.pendingApprover}</span>
        )}
      </div>
    </button>
  );
}

function NewRunbookModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (rb: Runbook) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom');
  const [owner, setOwner] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [steps, setSteps] = useState<RunbookStep[]>([
    { id: 'ns1', type: 'human_task', label: 'Define Context', description: 'Operator provides mission context and parameters', estimatedMs: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const STEP_TYPES: StepType[] = ['tool_call', 'approval', 'human_task', 'condition', 'parallel'];

  function addStep() {
    setSteps((prev) => [
      ...prev,
      { id: `ns${Date.now()}`, type: 'tool_call', label: 'New Step', description: '', estimatedMs: 0 },
    ]);
  }

  function deleteStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  function editStepField(i: number, field: keyof RunbookStep, value: string) {
    setSteps((prev) =>
      prev.map((s, idx) =>
        idx === i ? { ...s, [field]: field === 'estimatedMs' ? Number(value) : value } : s,
      ),
    );
  }

  function editStepType(i: number, type: StepType) {
    setSteps((prev) =>
      prev.map((s, idx) =>
        idx === i
          ? {
              ...s,
              type,
              requiresApproval: type === 'approval',
              approver: type === 'approval' ? (s.approver ?? 'Approver') : undefined,
            }
          : s,
      ),
    );
  }

  async function handleSave() {
    if (!name.trim()) { setError('Runbook name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const rb = await apiFetch<Runbook>(API, {
        method: 'POST',
        body: JSON.stringify({ name, description, category, owner, version, steps, triggers: [{ type: 'manual' }], tags: [] }),
      });
      onCreated(rb);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-[560px] max-h-[80vh] flex flex-col rounded-xl overflow-hidden"
        style={{ background: '#0e1219', border: `1px solid ${BORDER_STRONG}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h3 className="text-sm font-bold" style={{ color: TEXT.primary }}>
            New Runbook
          </h3>
          <button onClick={onClose} style={{ color: TEXT.muted }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Name *', value: name, set: setName, placeholder: 'e.g. Incident Triage' },
              { label: 'Version', value: version, set: setVersion, placeholder: 'v1.0' },
              { label: 'Category', value: category, set: setCategory, placeholder: 'Compliance, Deals …' },
              { label: 'Owner', value: owner, set: setOwner, placeholder: 'Team or person' },
            ].map((f) => (
              <div key={f.label}>
                <div className="text-[9px] mb-1" style={{ color: TEXT.muted }}>
                  {f.label}
                </div>
                <input
                  className="w-full rounded px-2 py-1.5 text-[10px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT.primary }}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>

          <div>
            <div className="text-[9px] mb-1" style={{ color: TEXT.muted }}>Description</div>
            <textarea
              className="w-full rounded px-2 py-1.5 text-[10px] outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT.primary }}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this runbook do?"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] uppercase tracking-widest" style={{ color: TEXT.ghost }}>
                Steps · {steps.length}
              </div>
              <button
                onClick={addStep}
                className="flex items-center gap-1 text-[9px] px-2 py-1 rounded"
                style={{ background: `${BLUE}10`, border: `1px solid ${BLUE}25`, color: BLUE }}
              >
                <Plus className="w-2.5 h-2.5" />
                Add Step
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className="rounded-lg p-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-mono" style={{ color: TEXT.ghost }}>
                      #{i + 1}
                    </span>
                    <select
                      value={step.type}
                      onChange={(e) => editStepType(i, e.target.value as StepType)}
                      className="text-[9px] rounded px-1.5 py-1 outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, color: STEP_META[step.type].color }}
                    >
                      {STEP_TYPES.map((t) => (
                        <option key={t} value={t} style={{ color: STEP_META[t].color }}>
                          {STEP_META[t].label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteStep(i)}
                      className="ml-auto"
                      style={{ color: TEXT.ghost }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <input
                      className="w-full rounded px-2 py-1 text-[10px] outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT.primary }}
                      value={step.label}
                      onChange={(e) => editStepField(i, 'label', e.target.value)}
                      placeholder="Step label"
                    />
                    <input
                      className="w-full rounded px-2 py-1 text-[10px] outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT.secondary }}
                      value={step.description}
                      onChange={(e) => editStepField(i, 'description', e.target.value)}
                      placeholder="What this step does"
                    />
                    {step.type === 'approval' && (
                      <input
                        className="w-full rounded px-2 py-1 text-[10px] outline-none"
                        style={{ background: `${PURPLE}08`, border: `1px solid ${PURPLE}20`, color: PURPLE }}
                        value={step.approver ?? ''}
                        onChange={(e) => editStepField(i, 'approver', e.target.value)}
                        placeholder="Who must approve (e.g. CFO)"
                      />
                    )}
                    {step.type === 'tool_call' && (
                      <input
                        className="w-full rounded px-2 py-1 text-[10px] font-mono outline-none"
                        style={{ background: `${BLUE}06`, border: `1px solid ${BLUE}18`, color: BLUE }}
                        value={step.domain ?? ''}
                        onChange={(e) => editStepField(i, 'domain', e.target.value)}
                        placeholder="domain (e.g. counsel, aegis)"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div
              className="text-[10px] px-3 py-2 rounded"
              style={{ background: `${RED}10`, border: `1px solid ${RED}25`, color: RED }}
            >
              {error}
            </div>
          )}
        </div>

        <div className="p-4 flex gap-2 justify-end" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-[10px]"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT.secondary }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-[10px] font-semibold"
            style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}30`, color: GOLD, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {saving ? 'Saving…' : 'Create Runbook'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LibraryTab({
  runbooks,
  onRefreshRunbooks,
}: {
  runbooks: Runbook[];
  onRefreshRunbooks: () => void;
}) {
  const [selected, setSelected] = useState<Runbook | null>(runbooks[0] ?? null);
  const [triggerModal, setTriggerModal] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [triggerOwner, setTriggerOwner] = useState('');
  const [triggerReason, setTriggerReason] = useState('');
  const [triggerError, setTriggerError] = useState('');
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    if (!selected && runbooks.length > 0) setSelected(runbooks[0]);
  }, [runbooks]);

  const handleTrigger = async () => {
    if (!selected) return;
    setTriggering(true);
    setTriggerError('');
    try {
      await apiFetch(`${API}/runs`, {
        method: 'POST',
        body: JSON.stringify({ runbookId: selected.id, owner: triggerOwner || 'Manual', reason: triggerReason }),
      });
      setTriggerModal(false);
      setLaunched(true);
      setTriggerOwner('');
      setTriggerReason('');
      setTimeout(() => setLaunched(false), 4000);
    } catch (e) {
      setTriggerError(e instanceof Error ? e.message : 'Trigger failed');
    } finally {
      setTriggering(false);
    }
  };

  const handleExport = () => {
    if (!selected) return;
    const fakeRun: RunbookRun = {
      id: 'export-preview',
      runbookId: selected.id,
      runbookName: selected.name,
      status: 'completed',
      startedAt: selected.lastRun ?? Date.now(),
      completedAt: (selected.lastRun ?? Date.now()) + selected.avgDurationMs,
      owner: selected.owner,
      currentStep: selected.steps.length,
      totalSteps: selected.steps.length,
      triggeredBy: 'manual',
    };
    generateAuditPdf(fakeRun, selected);
  };

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: TEXT.muted }}>
        No runbooks available. Create one to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-4 h-full">
      <div className="space-y-2 overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <div className="text-[9px] uppercase tracking-widest px-1 mb-3" style={{ color: TEXT.ghost }}>
          Mission Library · {runbooks.length} runbooks
        </div>
        {runbooks.map((rb) => (
          <button
            key={rb.id}
            onClick={() => setSelected(rb)}
            className="w-full text-left p-3 rounded-lg transition-all"
            style={{
              background: selected.id === rb.id ? `${GOLD}08` : SURFACE,
              border: `1px solid ${selected.id === rb.id ? `${GOLD}30` : BORDER}`,
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-semibold leading-snug" style={{ color: TEXT.primary }}>
                {rb.name}
              </span>
              <span
                className="text-[8px] font-mono shrink-0 px-1.5 py-0.5 rounded"
                style={{ background: `${rb.categoryColor}12`, color: rb.categoryColor }}
              >
                {rb.version}
              </span>
            </div>
            <div className="text-[9px] mb-2" style={{ color: TEXT.muted }}>
              {rb.category} · {rb.steps.length} steps
            </div>
            <div className="flex items-center gap-2 text-[9px]" style={{ color: TEXT.muted }}>
              <span style={{ color: GREEN }}>{rb.successRate}%</span>
              <span>·</span>
              <span>{rb.totalRuns} runs</span>
              {rb.triggers.some((t) => t.type === 'alert_bus') && (
                <>
                  <span>·</span>
                  <span style={{ color: AMBER }}>⚡ Auto</span>
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      <div
        className="rounded-lg overflow-hidden flex flex-col"
        style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
      >
        <div className="p-4 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                style={{ background: `${selected.categoryColor}12`, color: selected.categoryColor }}
              >
                {selected.category}
              </span>
              <span
                className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                style={{ background: `${GOLD}10`, color: GOLD }}
              >
                {selected.version}
              </span>
              <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
                {selected.id}
              </span>
            </div>
            <h2 className="text-sm font-bold mb-1" style={{ color: TEXT.primary }}>
              {selected.name}
            </h2>
            <p className="text-[10px] leading-relaxed" style={{ color: TEXT.secondary }}>
              {selected.description}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {selected.tags.map((t) => (
                <span
                  key={t}
                  className="text-[8px] px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.04)', color: TEXT.muted }}
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px]"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT.secondary }}
            >
              <Download className="w-3 h-3" />
              Export PDF
            </button>
            <button
              onClick={() => setTriggerModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium"
              style={{ background: `${GREEN}10`, border: `1px solid ${GREEN}30`, color: GREEN }}
            >
              <Play className="w-3 h-3" />
              Trigger
            </button>
          </div>
        </div>

        {launched && (
          <div
            className="mx-4 mt-3 px-3 py-2 rounded text-[10px] flex items-center gap-2"
            style={{ background: `${GREEN}08`, border: `1px solid ${GREEN}20`, color: GREEN }}
          >
            <Play className="w-3 h-3" />
            Run launched — see Live Operations tab for status
          </div>
        )}

        <div className="flex-1 overflow-auto p-4" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          <div className="text-[9px] uppercase tracking-widest mb-3" style={{ color: TEXT.ghost }}>
            Execution Flow · {selected.steps.length} steps · ~{fmt(selected.steps.reduce((a, s) => a + s.estimatedMs, 0))} total
          </div>
          {selected.steps.map((step, i) => (
            <StepRow key={step.id} step={step} index={i} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div
          className="rounded-lg p-4"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <div className="text-[9px] uppercase tracking-widest mb-3" style={{ color: TEXT.ghost }}>
            Run Analytics
          </div>
          {(
            [
              { k: 'Total Runs', v: selected.totalRuns.toString() },
              { k: 'Success Rate', v: `${selected.successRate}%`, c: GREEN },
              { k: 'Avg Duration', v: fmt(selected.avgDurationMs) },
              { k: 'Owner', v: selected.owner },
              { k: 'Last Run', v: selected.lastRun ? timeAgo(selected.lastRun) : 'Never' },
            ] as StatRow[]
          ).map((r) => (
            <div key={r.k} className="flex justify-between text-[10px] mb-2">
              <span style={{ color: TEXT.muted }}>{r.k}</span>
              <span className="font-mono" style={{ color: r.c ?? TEXT.primary }}>
                {r.v}
              </span>
            </div>
          ))}
        </div>

        <div
          className="rounded-lg p-4"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <div className="text-[9px] uppercase tracking-widest mb-3" style={{ color: TEXT.ghost }}>
            Triggers
          </div>
          {selected.triggers.map((t, i) => (
            <div key={i} className="flex items-start gap-2 mb-2 text-[10px]">
              <div
                className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background:
                    t.type === 'alert_bus'
                      ? `${AMBER}15`
                      : t.type === 'schedule'
                        ? `${BLUE}15`
                        : `${GREEN}15`,
                }}
              >
                {t.type === 'alert_bus' ? (
                  <Zap className="w-2.5 h-2.5" style={{ color: AMBER }} />
                ) : t.type === 'schedule' ? (
                  <Clock className="w-2.5 h-2.5" style={{ color: BLUE }} />
                ) : (
                  <Play className="w-2.5 h-2.5" style={{ color: GREEN }} />
                )}
              </div>
              <div>
                <div style={{ color: TEXT.primary }} className="capitalize">
                  {t.type === 'alert_bus' ? 'Alert Bus' : t.type === 'schedule' ? 'Schedule' : 'Manual'}
                </div>
                {t.rule && (
                  <div className="text-[9px] font-mono mt-0.5" style={{ color: TEXT.muted }}>
                    {t.rule}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-lg p-4"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <div className="text-[9px] uppercase tracking-widest mb-3" style={{ color: TEXT.ghost }}>
            Step Breakdown
          </div>
          {(Object.keys(STEP_META) as StepType[]).map((t) => {
            const count = selected.steps.filter((s) => s.type === t).length;
            if (!count) return null;
            const m = STEP_META[t];
            return (
              <div key={t} className="flex items-center justify-between text-[9px] mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
                  <span style={{ color: TEXT.secondary }}>{m.label}</span>
                </div>
                <span className="font-mono" style={{ color: TEXT.muted }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {triggerModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setTriggerModal(false)}
        >
          <div
            className="w-80 rounded-xl p-5"
            style={{ background: '#0e1219', border: `1px solid ${BORDER_STRONG}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: TEXT.primary }}>
                Trigger Runbook
              </h3>
              <button onClick={() => setTriggerModal(false)} style={{ color: TEXT.muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[10px] mb-3" style={{ color: TEXT.secondary }}>
              <span className="font-semibold" style={{ color: TEXT.primary }}>
                {selected.name}
              </span>{' '}
              · {selected.version}
            </div>
            <div className="space-y-2 mb-4">
              <div>
                <div className="text-[9px] mb-1" style={{ color: TEXT.muted }}>Owner / Requestor</div>
                <input
                  className="w-full rounded px-2 py-1.5 text-[10px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT.primary }}
                  placeholder="Your name or team"
                  value={triggerOwner}
                  onChange={(e) => setTriggerOwner(e.target.value)}
                />
              </div>
              <div>
                <div className="text-[9px] mb-1" style={{ color: TEXT.muted }}>Reason / Ticket</div>
                <input
                  className="w-full rounded px-2 py-1.5 text-[10px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT.primary }}
                  placeholder="e.g. DEAL-4421 or incident context"
                  value={triggerReason}
                  onChange={(e) => setTriggerReason(e.target.value)}
                />
              </div>
            </div>
            {triggerError && (
              <div className="text-[9px] mb-3 px-2 py-1 rounded" style={{ background: `${RED}10`, color: RED }}>
                {triggerError}
              </div>
            )}
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="w-full py-2 rounded text-[10px] font-semibold flex items-center justify-center gap-2"
              style={{ background: `${GREEN}15`, border: `1px solid ${GREEN}30`, color: GREEN, opacity: triggering ? 0.6 : 1 }}
            >
              {triggering ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {triggering ? 'Launching…' : 'Launch Run'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OperationsTab({
  runbooks,
  runs,
  onReplay,
  onRefreshRuns,
}: {
  runbooks: Runbook[];
  runs: RunbookRun[];
  onReplay: (run: RunbookRun) => void;
  onRefreshRuns: () => void;
}) {
  const [selected, setSelected] = useState<RunbookRun | null>(
    runs.find((r) => r.status === 'running' || r.status === 'pending_approval') ?? null,
  );
  const [filter, setFilter] = useState<RunStatus | 'all'>('all');
  const [approving, setApproving] = useState(false);

  const inFlight = runs.filter(
    (r) => r.status === 'running' || r.status === 'paused' || r.status === 'pending_approval',
  );
  const pending = runs.filter((r) => r.status === 'pending_approval');
  const filtered = filter === 'all' ? runs : runs.filter((r) => r.status === filter);

  const selectedRunbookFallback = selected ? runbooks.find((rb) => rb.id === selected.runbookId) ?? null : null;
  const [versionedRunbook, setVersionedRunbook] = useState<Runbook | null>(null);
  const [snapshotUnavailable, setSnapshotUnavailable] = useState(false);

  useEffect(() => {
    if (!selected) { setVersionedRunbook(null); setSnapshotUnavailable(false); return; }
    if (selected.runbookVersion) {
      setSnapshotUnavailable(false);
      fetchRunbookSnapshot(selected.runbookId, selected.runbookVersion).then((snap) => {
        if (snap) { setVersionedRunbook(snap); }
        else { setVersionedRunbook(null); setSnapshotUnavailable(true); }
      });
    } else {
      setVersionedRunbook(selectedRunbookFallback);
      setSnapshotUnavailable(false);
    }
  }, [selected?.id, selected?.runbookVersion]);

  const selectedRunbook = versionedRunbook ?? (snapshotUnavailable ? null : selectedRunbookFallback);

  const handleApprove = async () => {
    if (!selected) return;
    setApproving(true);
    try {
      await apiFetch(`${API}/runs/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'approve' }),
      });
      onRefreshRuns();
    } catch (e) {
      console.error('Approve failed', e);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      <div className="space-y-3">
        {inFlight.length > 0 && (
          <div>
            <div
              className="text-[9px] uppercase tracking-widest px-1 mb-2 flex items-center gap-2"
              style={{ color: TEXT.ghost }}
            >
              In-Flight
              <span
                className="w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-mono"
                style={{ background: `${GREEN}15`, color: GREEN }}
              >
                {inFlight.length}
              </span>
            </div>
            {inFlight.map((r) => (
              <RunRow key={r.id} run={r} onSelect={() => setSelected(r)} selected={selected?.id === r.id} />
            ))}
          </div>
        )}

        {pending.length > 0 && (
          <div
            className="rounded-lg p-3"
            style={{ background: `${PURPLE}08`, border: `1px solid ${PURPLE}20` }}
          >
            <div
              className="text-[9px] uppercase tracking-widest mb-2 flex items-center gap-2"
              style={{ color: PURPLE }}
            >
              <Shield className="w-3 h-3" />
              Pending Approvals
            </div>
            {pending.map((r) => (
              <div key={r.id} className="text-[10px] mb-1" style={{ color: TEXT.secondary }}>
                <span style={{ color: TEXT.primary }}>{r.runbookName}</span>
                {r.pendingApprover && <span style={{ color: PURPLE }}> · {r.pendingApprover}</span>}
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="text-[9px] uppercase tracking-widest px-1" style={{ color: TEXT.ghost }}>
              History
            </div>
            <div className="flex gap-1 ml-auto">
              {(['all', 'completed', 'failed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="text-[8px] px-1.5 py-0.5 rounded"
                  style={{
                    background: filter === f ? `${GOLD}12` : 'transparent',
                    color: filter === f ? GOLD : TEXT.muted,
                    border: `1px solid ${filter === f ? `${GOLD}25` : 'transparent'}`,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filtered
              .filter((r) => r.status === 'completed' || r.status === 'failed')
              .map((r) => (
                <RunRow
                  key={r.id}
                  run={r}
                  onSelect={() => setSelected(r)}
                  selected={selected?.id === r.id}
                />
              ))}
          </div>
        </div>
      </div>

      <div>
        {selected && selectedRunbook ? (
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div
              className="p-4 flex items-start justify-between gap-3"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
                    {selected.id}
                  </span>
                  {(() => {
                    const sm = STATUS_META[selected.status];
                    return (
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1"
                        style={{ background: `${sm.color}10`, color: sm.color }}
                      >
                        {selected.status === 'running' && (
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        )}
                        {sm.label}
                      </span>
                    );
                  })()}
                  {selected.triggeredBy === 'alert_bus' && (
                    <span className="text-[8px]" style={{ color: AMBER }}>
                      ⚡ {selected.alertSource}
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold mb-0.5" style={{ color: TEXT.primary }}>
                  {selected.runbookName}
                </h2>
                <div className="text-[10px]" style={{ color: TEXT.muted }}>
                  Owner: {selected.owner} · Started {timeAgo(selected.startedAt)}
                  {selected.completedAt &&
                    ` · Completed in ${fmt(selected.completedAt - selected.startedAt)}`}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {(selected.status === 'completed' || selected.status === 'failed') && (
                  <>
                    <button
                      onClick={() => onReplay(selected)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px]"
                      style={{ background: `${BLUE}10`, border: `1px solid ${BLUE}25`, color: BLUE }}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Replay
                    </button>
                    <button
                      onClick={() => generateAuditPdf(selected, selectedRunbook)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px]"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${BORDER}`,
                        color: TEXT.secondary,
                      }}
                    >
                      <Download className="w-3 h-3" />
                      Audit PDF
                    </button>
                  </>
                )}
                {selected.status === 'pending_approval' && (
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-medium"
                    style={{
                      background: `${PURPLE}10`,
                      border: `1px solid ${PURPLE}25`,
                      color: PURPLE,
                      opacity: approving ? 0.6 : 1,
                    }}
                  >
                    {approving ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Shield className="w-3 h-3" />
                    )}
                    {approving ? 'Approving…' : `Approve — ${selected.pendingApprover}`}
                  </button>
                )}
              </div>
            </div>

            <div className="p-4">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((selected.currentStep / selected.totalSteps) * 100)}%`,
                      background:
                        selected.status === 'failed'
                          ? RED
                          : selected.status === 'completed'
                            ? GREEN
                            : GOLD,
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono shrink-0" style={{ color: TEXT.muted }}>
                  {selected.currentStep}/{selected.totalSteps} steps
                </span>
              </div>

              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 360px)' }}>
                {selectedRunbook.steps.map((step, i) => (
                  <StepRow
                    key={step.id}
                    step={step}
                    index={i}
                    replayStep={selected.currentStep}
                    replayActive={selected.status === 'running'}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : selected && snapshotUnavailable ? (
          <div
            className="rounded-lg h-full flex items-center justify-center"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, minHeight: 300 }}
          >
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: AMBER }} />
              <p className="text-[11px] font-medium mb-1" style={{ color: TEXT.primary }}>
                Snapshot Unavailable
              </p>
              <p className="text-[10px]" style={{ color: TEXT.muted }}>
                Runbook version {selected.runbookVersion} could not be resolved.
                <br />
                Replay and PDF export are disabled for this run.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg h-full flex items-center justify-center"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, minHeight: 300 }}
          >
            <div className="text-center">
              <Layers className="w-8 h-8 mx-auto mb-2" style={{ color: TEXT.ghost }} />
              <p className="text-[11px]" style={{ color: TEXT.muted }}>
                Select a run to inspect
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReplayTab({
  initialRun,
  runbooks,
  runs,
}: {
  initialRun: RunbookRun | null;
  runbooks: Runbook[];
  runs: RunbookRun[];
}) {
  const completedRuns = runs.filter((r) => r.status === 'completed' || r.status === 'failed');
  const [selectedRun, setSelectedRun] = useState<RunbookRun | null>(
    initialRun ?? completedRuns[0] ?? null,
  );
  const [replayStep, setReplayStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runbookFallback = selectedRun ? runbooks.find((rb) => rb.id === selectedRun.runbookId) ?? null : null;
  const [versionedRunbook, setVersionedRunbook] = useState<Runbook | null>(null);
  const [snapshotUnavailable, setSnapshotUnavailable] = useState(false);

  useEffect(() => {
    if (!selectedRun) { setVersionedRunbook(null); setSnapshotUnavailable(false); return; }
    if (selectedRun.runbookVersion) {
      setSnapshotUnavailable(false);
      fetchRunbookSnapshot(selectedRun.runbookId, selectedRun.runbookVersion).then((snap) => {
        if (snap) { setVersionedRunbook(snap); }
        else { setVersionedRunbook(null); setSnapshotUnavailable(true); }
      });
    } else {
      setVersionedRunbook(runbookFallback);
      setSnapshotUnavailable(false);
    }
  }, [selectedRun?.id, selectedRun?.runbookVersion]);

  const runbook = versionedRunbook ?? (snapshotUnavailable ? null : runbookFallback);
  const total = runbook?.steps.length ?? 0;

  const startReplay = () => {
    setReplayStep(0);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setReplayStep((s) => {
        if (s >= total) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 900 / speed);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speed, total]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
      <div className="space-y-2">
        <div className="text-[9px] uppercase tracking-widest px-1 mb-2" style={{ color: TEXT.ghost }}>
          Completed Runs
        </div>
        {completedRuns.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setSelectedRun(r);
              setReplayStep(0);
              setPlaying(false);
            }}
            className="w-full text-left p-3 rounded-lg transition-all"
            style={{
              background: selectedRun?.id === r.id ? `${BLUE}08` : SURFACE,
              border: `1px solid ${selectedRun?.id === r.id ? `${BLUE}30` : BORDER}`,
            }}
          >
            <div className="text-[10px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>
              {r.runbookName}
            </div>
            <div className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
              {r.id} · {timeAgo(r.startedAt)}
            </div>
            {r.completedAt && (
              <div className="text-[9px] mt-0.5" style={{ color: TEXT.muted }}>
                Duration: {fmt(r.completedAt - r.startedAt)}
              </div>
            )}
          </button>
        ))}
      </div>

      <div>
        {selectedRun && runbook ? (
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div
              className="p-4 flex items-center justify-between gap-3"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <div>
                <div className="text-[9px] font-mono mb-0.5" style={{ color: TEXT.muted }}>
                  {selectedRun.id} · Replay Mode{selectedRun.runbookVersion ? ` · v${selectedRun.runbookVersion}` : ''}
                </div>
                <h2 className="text-sm font-bold" style={{ color: TEXT.primary }}>
                  {selectedRun.runbookName}
                </h2>
                <div className="text-[10px] mt-0.5" style={{ color: TEXT.muted }}>
                  {selectedRun.owner} · {timeAgo(selectedRun.startedAt)}
                  {selectedRun.completedAt &&
                    ` · ${fmt(selectedRun.completedAt - selectedRun.startedAt)} total`}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="text-[9px] rounded px-1.5 py-1 outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${BORDER}`,
                    color: TEXT.secondary,
                  }}
                >
                  {[0.5, 1, 2, 4].map((s) => (
                    <option key={s} value={s}>
                      {s}× speed
                    </option>
                  ))}
                </select>
                <button
                  onClick={playing ? () => setPlaying(false) : startReplay}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium"
                  style={{ background: `${BLUE}10`, border: `1px solid ${BLUE}25`, color: BLUE }}
                >
                  {playing ? <Pause className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                  {playing ? 'Pause' : replayStep > 0 ? 'Restart' : 'Play Replay'}
                </button>
                <button
                  onClick={() => generateAuditPdf(selectedRun, runbook)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${BORDER}`,
                    color: TEXT.secondary,
                  }}
                >
                  <FileText className="w-3 h-3" />
                  Audit PDF
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex-1 h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${total > 0 ? Math.round((replayStep / total) * 100) : 0}%`,
                      background: replayStep >= total ? GREEN : BLUE,
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono shrink-0" style={{ color: TEXT.muted }}>
                  {replayStep}/{total}
                </span>
              </div>

              {replayStep >= total && (
                <div
                  className="mb-4 p-3 rounded text-[10px] flex items-center gap-2"
                  style={{ background: `${GREEN}08`, border: `1px solid ${GREEN}20`, color: GREEN }}
                >
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  Replay complete — all {total} steps executed successfully. Audit trail sealed.
                </div>
              )}

              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
                {runbook.steps.map((step, i) => (
                  <StepRow
                    key={step.id}
                    step={step}
                    index={i}
                    replayStep={replayStep}
                    replayActive={playing}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : selectedRun && snapshotUnavailable ? (
          <div
            className="rounded-lg h-full flex items-center justify-center"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, minHeight: 300 }}
          >
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: AMBER }} />
              <p className="text-[11px] font-medium mb-1" style={{ color: TEXT.primary }}>
                Snapshot Unavailable
              </p>
              <p className="text-[10px]" style={{ color: TEXT.muted }}>
                Runbook version {selectedRun.runbookVersion} could not be resolved.
                <br />
                Replay and PDF export are disabled for this run.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg h-full flex items-center justify-center"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, minHeight: 300 }}
          >
            <div className="text-center">
              <RotateCcw className="w-8 h-8 mx-auto mb-2" style={{ color: TEXT.ghost }} />
              <p className="text-[11px]" style={{ color: TEXT.muted }}>
                Select a completed run to replay
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type Tab = 'library' | 'operations' | 'replay';

export default function RunbookStudio() {
  const [tab, setTab] = useState<Tab>('library');
  const [replayRun, setReplayRun] = useState<RunbookRun | null>(null);
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [runs, setRuns] = useState<RunbookRun[]>([]);
  const [loadingRunbooks, setLoadingRunbooks] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  const fetchRunbooks = useCallback(async () => {
    try {
      const data = await apiFetch<Runbook[]>(API);
      setRunbooks(data);
    } catch (e) {
      console.error('Failed to fetch runbooks', e);
    } finally {
      setLoadingRunbooks(false);
    }
  }, []);

  const fetchRuns = useCallback(async () => {
    try {
      const data = await apiFetch<RunbookRun[]>(`${API}/runs/list`);
      setRuns(data);
    } catch (e) {
      console.error('Failed to fetch runs', e);
    }
  }, []);

  useEffect(() => {
    fetchRunbooks();
    fetchRuns();
  }, [fetchRunbooks, fetchRuns]);

  useEffect(() => {
    const id = setInterval(fetchRuns, 3000);
    return () => clearInterval(id);
  }, [fetchRuns]);

  const handleReplay = (run: RunbookRun) => {
    setReplayRun(run);
    setTab('replay');
  };

  const inFlight = runs.filter(
    (r) => r.status === 'running' || r.status === 'paused' || r.status === 'pending_approval',
  );
  const pending = runs.filter((r) => r.status === 'pending_approval');
  const thisMonth = runs.filter((r) => r.startedAt > Date.now() - 30 * 86400000);
  const successCount = runs.filter((r) => r.status === 'completed').length;
  const totalCompleted = runs.filter((r) => r.status === 'completed' || r.status === 'failed').length;
  const avgSuccessRate =
    totalCompleted > 0 ? Math.round((successCount / totalCompleted) * 1000) / 10 : 100;

  const STATS = [
    { label: 'Active Missions', value: String(inFlight.length), color: GREEN },
    { label: 'Pending Approvals', value: String(pending.length), color: PURPLE },
    { label: 'Total This Month', value: String(thisMonth.length), color: TEXT.primary },
    { label: 'Avg Success Rate', value: `${avgSuccessRate}%`, color: GOLD },
  ];

  const TABS: Array<{ id: Tab; label: string; icon: typeof BookOpen }> = [
    { id: 'library', label: 'Mission Library', icon: BookOpen },
    { id: 'operations', label: 'Live Operations', icon: Layers },
    { id: 'replay', label: 'Run Replay', icon: RotateCcw },
  ];

  return (
    <div className="h-full overflow-auto" style={{ background: BG }}>
      <div className="max-w-[1440px] mx-auto p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-base font-bold tracking-tight" style={{ color: TEXT.primary }}>
              Mission Runbooks
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: TEXT.muted }}>
              Cross-domain playbooks · live execution · governed approvals · audit replay
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium shrink-0"
            style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: GOLD }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Runbook
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-lg p-3"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: TEXT.ghost }}>
                {s.label}
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ background: SURFACE, border: `1px solid ${BORDER}`, width: 'fit-content' }}
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium transition-all"
                style={{
                  background: tab === t.id ? `${GOLD}12` : 'transparent',
                  color: tab === t.id ? GOLD : TEXT.secondary,
                  border: `1px solid ${tab === t.id ? `${GOLD}25` : 'transparent'}`,
                }}
              >
                <Icon className="w-3 h-3" />
                {t.label}
                {t.id === 'operations' && inFlight.length > 0 && (
                  <span
                    className="w-3.5 h-3.5 rounded-full text-[7px] flex items-center justify-center font-mono"
                    style={{ background: `${GREEN}25`, color: GREEN }}
                  >
                    {inFlight.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loadingRunbooks ? (
          <div className="flex items-center justify-center h-48" style={{ color: TEXT.muted }}>
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading runbooks…
          </div>
        ) : (
          <>
            {tab === 'library' && (
              <LibraryTab runbooks={runbooks} onRefreshRunbooks={fetchRunbooks} />
            )}
            {tab === 'operations' && (
              <OperationsTab
                runbooks={runbooks}
                runs={runs}
                onReplay={handleReplay}
                onRefreshRuns={fetchRuns}
              />
            )}
            {tab === 'replay' && (
              <ReplayTab initialRun={replayRun} runbooks={runbooks} runs={runs} />
            )}
          </>
        )}
      </div>

      {showNewModal && (
        <NewRunbookModal
          onClose={() => setShowNewModal(false)}
          onCreated={(rb) => {
            setRunbooks((prev) => [...prev, rb]);
          }}
        />
      )}
    </div>
  );
}
