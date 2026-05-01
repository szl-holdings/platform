import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Info,
  Loader2,
  Play,
  RefreshCw,
  Settings,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  tags?: { name: string }[];
  nodes?: { type: string; name: string }[];
  updatedAt?: string;
  createdAt?: string;
}

interface N8nExecution {
  id: string;
  workflowId: string;
  workflowData?: { name: string };
  status: 'success' | 'error' | 'running' | 'waiting' | 'canceled';
  startedAt: string;
  stoppedAt?: string;
  mode: string;
}

interface N8nListResponse<T> {
  data: T[];
  nextCursor?: string;
}

interface N8nHealthResponse {
  configured: boolean;
  reachable?: boolean;
  error?: string;
}

interface N8nNotConfiguredResponse {
  configured: false;
  message: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? json.error ?? `HTTP ${res.status}`);
  return json as T;
}

function statusBadge(status: N8nExecution['status']) {
  const map: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    success: { label: 'Success', color: '#22c55e', icon: CheckCircle2 },
    error: { label: 'Error', color: '#ef4444', icon: XCircle },
    running: { label: 'Running', color: '#3b82f6', icon: Loader2 },
    waiting: { label: 'Waiting', color: '#eab308', icon: Clock },
    canceled: { label: 'Canceled', color: '#6b7280', icon: XCircle },
  };
  const s = map[status] ?? map['waiting'];
  const Icon = s.icon;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 600,
        color: s.color,
        background: `${s.color}18`,
        border: `1px solid ${s.color}33`,
        borderRadius: '4px',
        padding: '2px 8px',
      }}
    >
      <Icon size={11} className={status === 'running' ? 'animate-spin' : undefined} />
      {s.label}
    </span>
  );
}

function formatDuration(start: string, stop?: string): string {
  const from = new Date(start).getTime();
  const to = stop ? new Date(stop).getTime() : Date.now();
  const ms = to - from;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function NotConfiguredState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '80px 40px',
        textAlign: 'center',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(139,122,200,0.12)',
          border: '1px solid rgba(139,122,200,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Workflow size={28} color="#8b7ac8" />
      </div>
      <div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
          Connect n8n to enable Automations
        </div>
        <div style={{ fontSize: '13px', color: '#718096', lineHeight: '1.6' }}>
          The Automations surface bridges Command to 400+ integrations via n8n. Configure your
          instance to start triggering workflows directly from any insight or alert.
        </div>
      </div>
      <div
        style={{
          background: 'rgba(15,20,30,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '16px 20px',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#8b7ac8',
            marginBottom: '10px',
            letterSpacing: '0.08em',
          }}
        >
          SETUP
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { step: '1', text: 'Start or connect your n8n instance' },
            { step: '2', text: 'Set N8N_INSTANCE_URL secret (e.g. https://your-n8n.io)' },
            { step: '3', text: 'Set N8N_API_KEY secret from n8n → Settings → API' },
            { step: '4', text: 'Restart the API server' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(139,122,200,0.2)',
                  border: '1px solid rgba(139,122,200,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#8b7ac8',
                  flexShrink: 0,
                }}
              >
                {step}
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
      <a
        href="/command/README.md"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: '#8b7ac8',
          textDecoration: 'none',
        }}
      >
        <ExternalLink size={12} />
        View full setup documentation
      </a>
    </div>
  );
}

interface RunFormProps {
  workflow: N8nWorkflow;
  onClose: () => void;
  onRun: (payload: Record<string, string>) => void;
  isRunning: boolean;
  initialValues?: Record<string, string>;
}

function RunForm({ workflow, onClose, onRun, isRunning, initialValues }: RunFormProps) {
  const [fields, setFields] = useState<{ key: string; value: string }[]>(
    initialValues
      ? Object.entries(initialValues).map(([key, value]) => ({ key, value }))
      : [{ key: '', value: '' }],
  );

  function addField() {
    setFields((f) => [...f, { key: '', value: '' }]);
  }

  function updateField(idx: number, part: 'key' | 'value', val: string) {
    setFields((f) => f.map((row, i) => (i === idx ? { ...row, [part]: val } : row)));
  }

  function removeField(idx: number) {
    setFields((f) => f.filter((_, i) => i !== idx));
  }

  function handleRun() {
    const payload: Record<string, string> = {};
    for (const { key, value } of fields) {
      if (key.trim()) payload[key.trim()] = value;
    }
    onRun(payload);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0f1520',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '14px',
          padding: '24px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>
              {workflow.name}
            </div>
            <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
              Trigger with optional input data
            </div>
          </div>
          <div
            style={{
              background: workflow.active ? '#22c55e18' : '#6b728018',
              border: `1px solid ${workflow.active ? '#22c55e33' : '#6b728033'}`,
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 700,
              color: workflow.active ? '#22c55e' : '#6b7280',
            }}
          >
            {workflow.active ? 'ACTIVE' : 'INACTIVE'}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#8b7ac8',
              marginBottom: '8px',
              letterSpacing: '0.06em',
            }}
          >
            INPUT DATA (optional)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {fields.map((row, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  placeholder="key"
                  value={row.key}
                  onChange={(e) => updateField(idx, 'key', e.target.value)}
                  style={{
                    flex: '1',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    outline: 'none',
                  }}
                />
                <input
                  placeholder="value"
                  value={row.value}
                  onChange={(e) => updateField(idx, 'value', e.target.value)}
                  style={{
                    flex: '2',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => removeField(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px',
                  }}
                >
                  <XCircle size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addField}
            style={{
              marginTop: '8px',
              background: 'none',
              border: '1px dashed rgba(139,122,200,0.3)',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '11px',
              color: '#8b7ac8',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            + Add field
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            style={{
              background: isRunning ? 'rgba(139,122,200,0.3)' : '#8b7ac8',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#fff',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {isRunning ? 'Running...' : 'Run Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);
  const [showRunForm, setShowRunForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const healthQ = useQuery({
    queryKey: ['n8n-health'],
    queryFn: () => apiFetch<N8nHealthResponse | N8nNotConfiguredResponse>('/n8n/health'),
    retry: 1,
    staleTime: 30_000,
  });

  const workflowsQ = useQuery({
    queryKey: ['n8n-workflows'],
    queryFn: () => apiFetch<N8nListResponse<N8nWorkflow>>('/n8n/workflows'),
    enabled: healthQ.data != null && (healthQ.data as N8nHealthResponse).configured !== false,
    staleTime: 60_000,
  });

  const executionsQ = useQuery({
    queryKey: ['n8n-executions', expandedId],
    queryFn: () =>
      apiFetch<N8nListResponse<N8nExecution>>(
        `/n8n/executions?limit=10${expandedId ? `&workflowId=${expandedId}` : ''}`,
      ),
    enabled:
      healthQ.data != null &&
      (healthQ.data as N8nHealthResponse).configured !== false &&
      expandedId !== null,
    staleTime: 10_000,
  });

  const runMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, string> }) =>
      apiFetch(`/n8n/workflows/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify({ data: payload }),
      }),
    onSuccess: () => {
      setShowRunForm(false);
      setSelectedWorkflow(null);
      queryClient.invalidateQueries({ queryKey: ['n8n-executions'] });
    },
  });

  const notConfigured =
    healthQ.data && (healthQ.data as N8nNotConfiguredResponse).configured === false;
  const unreachable =
    healthQ.data &&
    (healthQ.data as N8nHealthResponse).configured === true &&
    (healthQ.data as N8nHealthResponse).reachable === false;

  const workflows: N8nWorkflow[] = (workflowsQ.data as N8nListResponse<N8nWorkflow>)?.data ?? [];
  const executions: N8nExecution[] =
    (executionsQ.data as N8nListResponse<N8nExecution>)?.data ?? [];

  const accentColor = '#8b7ac8';

  return (
    <div style={{ background: '#080c14', minHeight: '100%', padding: '24px', color: '#e2e8f0' }}>
      {showRunForm && selectedWorkflow && (
        <RunForm
          workflow={selectedWorkflow}
          onClose={() => {
            setShowRunForm(false);
            setSelectedWorkflow(null);
          }}
          onRun={(payload) => runMutation.mutate({ id: selectedWorkflow.id, payload })}
          isRunning={runMutation.isPending}
        />
      )}

      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Workflow size={20} color={accentColor} />
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Automations</h1>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: accentColor,
                  background: `${accentColor}18`,
                  border: `1px solid ${accentColor}30`,
                  borderRadius: '4px',
                  padding: '2px 7px',
                }}
              >
                n8n BRIDGE
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#718096', margin: '4px 0 0' }}>
              400+ integrations via your connected n8n instance
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!notConfigured && (
              <button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['n8n-health'] });
                  queryClient.invalidateQueries({ queryKey: ['n8n-workflows'] });
                  queryClient.invalidateQueries({ queryKey: ['n8n-executions'] });
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#94a3b8',
                }}
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            )}
          </div>
        </div>

        {healthQ.isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#718096',
              padding: '40px 0',
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: '13px' }}>Checking n8n connection…</span>
          </div>
        )}

        {healthQ.isError && !healthQ.isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} color="#ef4444" style={{ marginTop: '1px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>
                Could not reach the Automations bridge
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {(healthQ.error as Error)?.message ?? 'Network error — is the API server running?'}
              </div>
            </div>
          </div>
        )}

        {notConfigured && <NotConfiguredState />}

        {unreachable && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} color="#ef4444" style={{ marginTop: '1px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>
                n8n instance unreachable
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                N8N_INSTANCE_URL and N8N_API_KEY are set but the instance did not respond. Verify
                your n8n instance is running and the URL is correct.
              </div>
            </div>
          </div>
        )}

        {runMutation.isError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#ef4444',
            }}
          >
            <XCircle size={14} />
            {(runMutation.error as Error)?.message ?? 'Failed to execute workflow'}
          </div>
        )}

        {runMutation.isSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#22c55e',
            }}
          >
            <CheckCircle2 size={14} />
            Workflow execution triggered. Check the run history below.
          </div>
        )}

        {!notConfigured && !healthQ.isLoading && !healthQ.isError && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  background: 'rgba(15,20,30,0.8)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${accentColor}18`,
                    border: `1px solid ${accentColor}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Workflow size={16} color={accentColor} />
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>
                    {workflowsQ.isLoading ? '—' : workflows.length}
                  </div>
                  <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
                    Workflows
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(15,20,30,0.8)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Activity size={16} color="#22c55e" />
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>
                    {workflowsQ.isLoading ? '—' : workflows.filter((w) => w.active).length}
                  </div>
                  <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>Active</div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(15,20,30,0.8)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Zap size={14} color={accentColor} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Available Workflows</span>
              </div>

              {workflowsQ.isLoading && (
                <div
                  style={{
                    padding: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#718096',
                  }}
                >
                  <Loader2 size={14} className="animate-spin" />
                  <span style={{ fontSize: '13px' }}>Loading workflows from n8n…</span>
                </div>
              )}

              {!workflowsQ.isLoading && workflows.length === 0 && (
                <div
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#718096',
                    fontSize: '13px',
                  }}
                >
                  No workflows found. Create workflows in your n8n instance to see them here.
                </div>
              )}

              {workflows.map((wf, idx) => (
                <div
                  key={wf.id}
                  style={{
                    borderBottom:
                      idx < workflows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedId(expandedId === wf.id ? null : wf.id)}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: wf.active ? '#22c55e' : '#374151',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                        {wf.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
                        ID: {wf.id}
                        {wf.updatedAt && ` · Updated ${timeAgo(wf.updatedAt)}`}
                      </div>
                    </div>
                    {wf.tags?.map((t) => (
                      <span
                        key={t.name}
                        style={{
                          fontSize: '10px',
                          color: '#8b7ac8',
                          background: 'rgba(139,122,200,0.12)',
                          border: '1px solid rgba(139,122,200,0.2)',
                          borderRadius: '4px',
                          padding: '1px 7px',
                        }}
                      >
                        {t.name}
                      </span>
                    ))}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorkflow(wf);
                        setShowRunForm(true);
                      }}
                      style={{
                        background: accentColor,
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0,
                      }}
                    >
                      <Play size={10} />
                      Run
                    </button>
                    {expandedId === wf.id ? (
                      <ChevronDown size={14} color="#718096" />
                    ) : (
                      <ChevronRight size={14} color="#718096" />
                    )}
                  </div>

                  {expandedId === wf.id && (
                    <div
                      style={{
                        padding: '0 20px 16px 40px',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        background: 'rgba(0,0,0,0.2)',
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 0 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#8b7ac8',
                          letterSpacing: '0.08em',
                        }}
                      >
                        RUN HISTORY
                      </div>
                      {executionsQ.isLoading && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#718096',
                            fontSize: '12px',
                            padding: '8px 0',
                          }}
                        >
                          <Loader2 size={12} className="animate-spin" />
                          Loading executions…
                        </div>
                      )}
                      {!executionsQ.isLoading && executions.length === 0 && (
                        <div style={{ fontSize: '12px', color: '#718096', padding: '8px 0' }}>
                          No executions yet for this workflow.
                        </div>
                      )}
                      {executions.map((ex) => (
                        <div
                          key={ex.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '6px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          {statusBadge(ex.status)}
                          <span style={{ fontSize: '11px', color: '#718096' }}>
                            {timeAgo(ex.startedAt)}
                          </span>
                          <span style={{ fontSize: '11px', color: '#4b5563' }}>
                            {formatDuration(ex.startedAt, ex.stoppedAt)}
                          </span>
                          <span style={{ fontSize: '11px', color: '#374151' }}>#{ex.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                background: 'rgba(15,20,30,0.8)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Clock size={14} color="#718096" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Recent Executions</span>
                <button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['n8n-executions-recent'] });
                  }}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#8b7ac8',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={10} />
                  Refresh
                </button>
              </div>
              <RecentExecutions
                onRefresh={() =>
                  queryClient.invalidateQueries({ queryKey: ['n8n-executions-recent'] })
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RecentExecutions({ onRefresh }: { onRefresh: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['n8n-executions-recent'],
    queryFn: () => apiFetch<N8nListResponse<N8nExecution>>('/n8n/executions?limit=20'),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const executions: N8nExecution[] = data?.data ?? [];

  if (isLoading) {
    return (
      <div
        style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#718096',
        }}
      >
        <Loader2 size={14} className="animate-spin" />
        <span style={{ fontSize: '12px' }}>Loading recent executions…</span>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#718096', fontSize: '12px' }}>
        No executions found. Run a workflow to see history here.
      </div>
    );
  }

  return (
    <div>
      {executions.map((ex, idx) => (
        <div
          key={ex.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 20px',
            borderBottom: idx < executions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}
        >
          {statusBadge(ex.status)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#cbd5e1',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {ex.workflowData?.name ?? `Workflow ${ex.workflowId}`}
            </div>
            <div style={{ fontSize: '11px', color: '#4b5563' }}>
              {timeAgo(ex.startedAt)} · {ex.mode}
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#718096', flexShrink: 0 }}>
            {formatDuration(ex.startedAt, ex.stoppedAt)}
          </div>
        </div>
      ))}
    </div>
  );
}
