import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  Database,
  Download,
  GitBranch,
  Globe,
  History,
  Play,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

type ExecutionType = 'api_call' | 'database_query' | 'workflow_trigger' | 'script';
type ApprovalClass = 'auto' | 'review' | 'admin_only';

interface SchemaField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
}

interface ToolVersion {
  version: number;
  createdAt: string;
  changes: string;
}

interface CustomTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  executionType: ExecutionType;
  approvalClass: ApprovalClass;
  inputFields: SchemaField[];
  outputFields: SchemaField[];
  config: {
    httpMethod?: string;
    url?: string;
    headers?: string;
    bodyTemplate?: string;
    sqlQuery?: string;
    databaseId?: string;
    workflowId?: string;
    scriptBody?: string;
  };
  versions: ToolVersion[];
  isPublished: boolean;
}

const EXECUTION_TYPES: {
  id: ExecutionType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: 'api_call',
    label: 'API Call',
    icon: <Globe className="w-4 h-4" />,
    description: 'HTTP request to an external API endpoint',
  },
  {
    id: 'database_query',
    label: 'Database Query',
    icon: <Database className="w-4 h-4" />,
    description: 'SQL query against a connected database',
  },
  {
    id: 'workflow_trigger',
    label: 'Workflow Trigger',
    icon: <GitBranch className="w-4 h-4" />,
    description: 'Launch an existing Alloy workflow',
  },
  {
    id: 'script',
    label: 'Script',
    icon: <Code2 className="w-4 h-4" />,
    description: 'JavaScript/TypeScript function body',
  },
];

const APPROVAL_CLASSES: {
  id: ApprovalClass;
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: 'auto',
    label: 'Auto Execute',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    icon: <Zap className="w-3.5 h-3.5" />,
    description: 'Runs automatically without approval',
  },
  {
    id: 'review',
    label: 'Requires Review',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    icon: <Clock className="w-3.5 h-3.5" />,
    description: 'Routes to approval queue before execution',
  },
  {
    id: 'admin_only',
    label: 'Admin Only',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    icon: <Shield className="w-3.5 h-3.5" />,
    description: 'Restricted to admin-level users',
  },
];

const DEMO_TOOLS: CustomTool[] = [];

const defaultTool = (): Omit<CustomTool, 'id'> => ({
  name: '',
  slug: '',
  description: '',
  executionType: 'api_call',
  approvalClass: 'auto',
  inputFields: [],
  outputFields: [],
  config: {
    httpMethod: 'GET',
    url: '',
    headers: '{"Content-Type": "application/json"}',
    bodyTemplate: '',
  },
  versions: [],
  isPublished: false,
});

function SlugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '');
}

function SchemaFieldRow({
  field,
  onChange,
  onRemove,
}: {
  field: SchemaField;
  onChange: (f: SchemaField) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg border"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
    >
      <input
        value={field.key}
        onChange={(e) => onChange({ ...field, key: e.target.value })}
        placeholder="field_name"
        className="w-28 text-[11px] font-mono px-2 py-1 rounded outline-none"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.7)',
        }}
      />
      <select
        value={field.type}
        onChange={(e) => onChange({ ...field, type: e.target.value as SchemaField['type'] })}
        className="text-[10px] px-2 py-1 rounded outline-none"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        {['string', 'number', 'boolean', 'object', 'array'].map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input
        value={field.description}
        onChange={(e) => onChange({ ...field, description: e.target.value })}
        placeholder="Description"
        className="flex-1 text-[11px] px-2 py-1 rounded outline-none"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.6)',
        }}
      />
      <label
        className="flex items-center gap-1 text-[10px] cursor-pointer"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onChange({ ...field, required: e.target.checked })}
          className="w-3 h-3"
        />
        req
      </label>
      <button
        onClick={onRemove}
        className="p-1 rounded hover:bg-red-500/10 transition-colors"
        style={{ color: 'rgba(239,68,68,0.5)' }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function McpToolCreator() {
  const [tools, setTools] = useState<CustomTool[]>(DEMO_TOOLS);
  const [editing, setEditing] = useState<CustomTool | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; output: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const startNew = () => {
    setEditing({ id: `new-${Date.now()}`, ...defaultTool() });
    setIsNew(true);
    setTestResult(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    const newVersion: ToolVersion = {
      version: (editing.versions.at(-1)?.version ?? 0) + 1,
      createdAt: new Date().toISOString(),
      changes: isNew ? 'Initial version' : 'Updated via tool creator',
    };
    const updated = { ...editing, versions: [...editing.versions, newVersion], isPublished: true };
    setTools((prev) => {
      const idx = prev.findIndex((t) => t.id === updated.id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = updated;
        return n;
      }
      return [...prev, updated];
    });
    setEditing(updated);
    setIsNew(false);
    setSaving(false);
  };

  const handleTest = async () => {
    if (!editing) return;
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setTestResult({
      success: true,
      output: JSON.stringify(
        {
          result: 'Tool executed successfully',
          timestamp: new Date().toISOString(),
          sampleOutput: { status: 'ok', data: { id: '123', value: 'demo_result' } },
        },
        null,
        2,
      ),
    });
    setTesting(false);
  };

  const exportTool = (tool: CustomTool) => {
    const blob = new Blob([JSON.stringify(tool, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.slug}-mcp-tool.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateField = <K extends keyof CustomTool>(key: K, value: CustomTool[K]) => {
    if (!editing) return;
    const updated: Partial<CustomTool> = { [key]: value };
    if (key === 'name') {
      updated.slug = SlugifyName(value as string);
    }
    setEditing((e) => (e ? { ...e, ...updated } : e));
  };

  const approvalConfig = APPROVAL_CLASSES.find((a) => a.id === editing?.approvalClass);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="w-3.5 h-3.5" style={{ color: '#4B8BDB' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#4B8BDB' }}
            >
              Alloy · Custom MCP Tools
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">MCP Tool Creator</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Define custom MCP tools without code deploys. Published tools appear in the MCP tool
            palette.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label
            className="flex items-center gap-1.5 text-[10px] border px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <Upload className="w-3 h-3" /> Import
            <input
              type="file"
              className="hidden"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const tool = JSON.parse(ev.target?.result as string) as CustomTool;
                    setEditing({ ...tool, id: `imported-${Date.now()}` });
                    setIsNew(true);
                  } catch {}
                };
                reader.readAsText(file);
              }}
            />
          </label>
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: 'rgba(75,139,219,0.12)',
              color: '#4B8BDB',
              border: '1px solid rgba(75,139,219,0.2)',
            }}
          >
            <Plus className="w-3.5 h-3.5" /> New Tool
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Custom Tools ({tools.length})
          </div>
          {tools.map((tool) => {
            const ac = APPROVAL_CLASSES.find((a) => a.id === tool.approvalClass)!;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setEditing(tool);
                  setIsNew(false);
                  setTestResult(null);
                }}
                className="w-full text-left rounded-xl border p-3 transition-all hover:border-[rgba(75,139,219,0.15)]"
                style={{
                  borderColor:
                    editing?.id === tool.id ? 'rgba(75,139,219,0.25)' : 'rgba(255,255,255,0.06)',
                  background:
                    editing?.id === tool.id ? 'rgba(75,139,219,0.04)' : 'rgba(12,18,30,0.95)',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: editing?.id === tool.id ? '#4B8BDB' : '#fff' }}
                  >
                    {tool.name}
                  </span>
                  {tool.isPublished && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[9px] font-mono"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    {tool.executionType.replace('_', ' ')}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: ac.color, background: ac.bg }}
                  >
                    {ac.label}
                  </span>
                </div>
              </button>
            );
          })}
          {tools.length === 0 && (
            <div
              className="rounded-xl border p-6 text-center"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <Code2 className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgba(75,139,219,0.3)' }} />
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No tools yet
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!editing && (
            <div
              className="rounded-xl border h-64 flex items-center justify-center"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="text-center">
                <Code2 className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(75,139,219,0.2)' }} />
                <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Select a tool or create a new one
                </p>
                <button
                  onClick={startNew}
                  className="mt-3 text-[11px] font-semibold px-4 py-2 rounded-lg transition-colors"
                  style={{
                    background: 'rgba(75,139,219,0.1)',
                    color: '#4B8BDB',
                    border: '1px solid rgba(75,139,219,0.2)',
                  }}
                >
                  Create first tool
                </button>
              </div>
            </div>
          )}

          {editing && (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,18,30,0.95)' }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    {isNew ? 'New Tool' : editing.name}
                  </span>
                  {editing.isPublished && !isNew && (
                    <span
                      className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}
                    >
                      <CheckCircle className="w-2.5 h-2.5" /> Published
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editing.versions.length > 0 && (
                    <button
                      onClick={() => setShowVersions((v) => !v)}
                      className="flex items-center gap-1 text-[10px] border px-2 py-1 rounded-lg transition-colors hover:bg-white/5"
                      style={{
                        borderColor: 'rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      <History className="w-3 h-3" /> v{editing.versions.at(-1)?.version}
                    </button>
                  )}
                  {!isNew && (
                    <button
                      onClick={() => exportTool(editing)}
                      className="flex items-center gap-1 text-[10px] border px-2 py-1 rounded-lg transition-colors hover:bg-white/5"
                      style={{
                        borderColor: 'rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      <Download className="w-3 h-3" /> Export
                    </button>
                  )}
                  <button
                    onClick={handleTest}
                    disabled={testing}
                    className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-all"
                    style={{
                      borderColor: 'rgba(75,139,219,0.2)',
                      color: '#4B8BDB',
                      background: 'rgba(75,139,219,0.06)',
                    }}
                  >
                    {testing ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    {testing ? 'Testing...' : 'Try It'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editing.name}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                    style={{
                      background: '#4B8BDB',
                      color: '#fff',
                      opacity: saving || !editing.name ? 0.6 : 1,
                    }}
                  >
                    {saving ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    {saving ? 'Saving...' : 'Publish'}
                  </button>
                </div>
              </div>

              {showVersions && editing.versions.length > 0 && (
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
                >
                  <div
                    className="text-[9px] uppercase tracking-widest mb-2"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    Version History
                  </div>
                  <div className="space-y-1">
                    {[...editing.versions].reverse().map((v) => (
                      <div key={v.version} className="flex items-center gap-3 text-[10px]">
                        <span className="font-mono font-bold w-8" style={{ color: '#4B8BDB' }}>
                          v{v.version}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{v.changes}</span>
                        <span
                          className="ml-auto font-mono"
                          style={{ color: 'rgba(255,255,255,0.2)' }}
                        >
                          {new Date(v.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="text-[10px] font-medium mb-1 block"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      Tool Name *
                    </label>
                    <input
                      value={editing.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="My Custom Tool"
                      className="w-full text-[11px] px-2.5 py-1.5 rounded-lg outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-[10px] font-medium mb-1 block"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      Slug
                    </label>
                    <input
                      value={editing.slug}
                      readOnly
                      className="w-full text-[11px] font-mono px-2.5 py-1.5 rounded-lg outline-none"
                      style={{
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.3)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="text-[10px] font-medium mb-1 block"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    Description *
                  </label>
                  <textarea
                    value={editing.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="What does this tool do?"
                    rows={2}
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg outline-none resize-none"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="text-[10px] font-medium mb-2 block"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    Execution Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXECUTION_TYPES.map((et) => (
                      <button
                        key={et.id}
                        onClick={() => updateField('executionType', et.id)}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all"
                        style={{
                          borderColor:
                            editing.executionType === et.id
                              ? 'rgba(75,139,219,0.3)'
                              : 'rgba(255,255,255,0.06)',
                          background:
                            editing.executionType === et.id
                              ? 'rgba(75,139,219,0.06)'
                              : 'rgba(255,255,255,0.02)',
                          color:
                            editing.executionType === et.id ? '#4B8BDB' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {et.icon}
                        <div>
                          <div className="text-[10px] font-semibold">{et.label}</div>
                          <div
                            className="text-[9px] mt-0.5"
                            style={{
                              color:
                                editing.executionType === et.id
                                  ? 'rgba(75,139,219,0.6)'
                                  : 'rgba(255,255,255,0.25)',
                            }}
                          >
                            {et.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className="text-[10px] font-medium mb-2 block"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    Approval Class
                  </label>
                  <div className="flex gap-2">
                    {APPROVAL_CLASSES.map((ac) => (
                      <button
                        key={ac.id}
                        onClick={() => updateField('approvalClass', ac.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[10px] font-medium transition-all"
                        style={{
                          borderColor:
                            editing.approvalClass === ac.id ? ac.border : 'rgba(255,255,255,0.06)',
                          background:
                            editing.approvalClass === ac.id ? ac.bg : 'rgba(255,255,255,0.02)',
                          color:
                            editing.approvalClass === ac.id ? ac.color : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {ac.icon} {ac.label}
                      </button>
                    ))}
                  </div>
                </div>

                {editing.executionType === 'api_call' && (
                  <div className="space-y-2">
                    <label
                      className="text-[10px] font-medium"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      API Configuration
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={editing.config.httpMethod ?? 'GET'}
                        onChange={(e) =>
                          updateField('config', { ...editing.config, httpMethod: e.target.value })
                        }
                        className="text-[10px] px-2 py-1.5 rounded-lg outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.6)',
                        }}
                      >
                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <input
                        value={editing.config.url ?? ''}
                        onChange={(e) =>
                          updateField('config', { ...editing.config, url: e.target.value })
                        }
                        placeholder="https://api.example.com/endpoint/{{param}}"
                        className="flex-1 text-[11px] font-mono px-2.5 py-1.5 rounded-lg outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      />
                    </div>
                    <textarea
                      value={editing.config.headers ?? ''}
                      onChange={(e) =>
                        updateField('config', { ...editing.config, headers: e.target.value })
                      }
                      placeholder='{"Authorization": "Bearer {{API_KEY}}"}'
                      rows={2}
                      className="w-full text-[10px] font-mono px-2.5 py-1.5 rounded-lg outline-none resize-none"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    />
                  </div>
                )}

                {editing.executionType === 'database_query' && (
                  <div className="space-y-2">
                    <label
                      className="text-[10px] font-medium"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      SQL Query
                    </label>
                    <textarea
                      value={editing.config.sqlQuery ?? ''}
                      onChange={(e) =>
                        updateField('config', { ...editing.config, sqlQuery: e.target.value })
                      }
                      placeholder="SELECT * FROM customers WHERE id = $1"
                      rows={4}
                      className="w-full text-[11px] font-mono px-2.5 py-1.5 rounded-lg outline-none resize-none"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'rgba(75,139,219,0.8)',
                      }}
                    />
                  </div>
                )}

                {editing.executionType === 'workflow_trigger' && (
                  <div>
                    <label
                      className="text-[10px] font-medium mb-1 block"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      Workflow ID
                    </label>
                    <input
                      value={editing.config.workflowId ?? ''}
                      onChange={(e) =>
                        updateField('config', { ...editing.config, workflowId: e.target.value })
                      }
                      placeholder="workflow-uuid"
                      className="w-full text-[11px] font-mono px-2.5 py-1.5 rounded-lg outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    />
                  </div>
                )}

                {editing.executionType === 'script' && (
                  <div>
                    <label
                      className="text-[10px] font-medium mb-1 block"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      Script Body (receives `input`, must return output)
                    </label>
                    <textarea
                      value={editing.config.scriptBody ?? ''}
                      onChange={(e) =>
                        updateField('config', { ...editing.config, scriptBody: e.target.value })
                      }
                      placeholder={
                        '// input is the parsed parameters\nconst result = await fetch(`https://api.example.com/${input.id}`);\nreturn await result.json();'
                      }
                      rows={6}
                      className="w-full text-[11px] font-mono px-2.5 py-1.5 rounded-lg outline-none resize-none"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(75,139,219,0.1)',
                        color: 'rgba(75,139,219,0.8)',
                      }}
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="text-[10px] font-medium"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      Input Schema
                    </label>
                    <button
                      onClick={() =>
                        updateField('inputFields', [
                          ...editing.inputFields,
                          { key: '', type: 'string', description: '', required: false },
                        ])
                      }
                      className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border transition-colors hover:bg-white/5"
                      style={{ borderColor: 'rgba(75,139,219,0.2)', color: '#4B8BDB' }}
                    >
                      <Plus className="w-2.5 h-2.5" /> Add Field
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {editing.inputFields.map((f, i) => (
                      <SchemaFieldRow
                        key={i}
                        field={f}
                        onChange={(nf) =>
                          updateField(
                            'inputFields',
                            editing.inputFields.map((x, j) => (j === i ? nf : x)),
                          )
                        }
                        onRemove={() =>
                          updateField(
                            'inputFields',
                            editing.inputFields.filter((_, j) => j !== i),
                          )
                        }
                      />
                    ))}
                    {editing.inputFields.length === 0 && (
                      <div
                        className="text-[10px] text-center py-2"
                        style={{ color: 'rgba(255,255,255,0.2)' }}
                      >
                        No input fields defined
                      </div>
                    )}
                  </div>
                </div>

                {testResult && (
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={{
                      borderColor: testResult.success
                        ? 'rgba(16,185,129,0.2)'
                        : 'rgba(239,68,68,0.2)',
                      background: testResult.success
                        ? 'rgba(16,185,129,0.04)'
                        : 'rgba(239,68,68,0.04)',
                    }}
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-2 border-b"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      {testResult.success ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: testResult.success ? '#10b981' : '#ef4444' }}
                      >
                        Test {testResult.success ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    <pre
                      className="text-[10px] p-3 overflow-auto"
                      style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontFamily: 'monospace',
                        maxHeight: 200,
                      }}
                    >
                      {testResult.output}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
