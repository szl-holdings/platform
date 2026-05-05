import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Play,
  RefreshCw,
  Search,
  Shield,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { MOCK_TOOLS } from './data';
import { ECOSYSTEM_ACCENT } from './layout';
import type { ToolEntry, ToolExecutionResult } from './types';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const apiUrl = (path: string) => `${BASE}/api${path}`;

function getCsrfToken(): string | undefined {
  const match = document.cookie.split(';').find((c) => c.trim().startsWith('csrf_token='));
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : undefined;
}

async function ensureCsrfCookie(): Promise<void> {
  if (!document.cookie.includes('csrf_token=')) {
    await fetch(apiUrl('/csrf-token'), { credentials: 'include' });
  }
}

function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  return fetch(url, { credentials: 'include', ...init }).then((r) =>
    r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
  );
}

const DOMAIN_COLORS: Record<string, string> = {
  substrate: '#22d3ee',
  core:      '#8b7ac8',
  counsel:   '#a78bfa',
  terra:     '#22c55e',
  aegis:     '#ef4444',
  vessels:   '#4d8fcc',
  observability: '#f59e0b',
};

function PolicyTierBadge({ tier }: { tier: string }) {
  const color =
    tier === 'critical'
      ? '#ef4444'
      : tier === 'operator-assisted'
        ? '#f59e0b'
        : '#22c55e';
  return (
    <span
      className="text-[8px] font-mono px-1.5 py-0.5 rounded"
      style={{ background: `${color}12`, color, border: `1px solid ${color}20` }}
    >
      {tier}
    </span>
  );
}

function DomainTag({ tag }: { tag: string }) {
  return (
    <span
      className="text-[8px] font-mono px-1 py-0.5 rounded"
      style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {tag}
    </span>
  );
}

type SchemaProperty = {
  type?: string;
  description?: string;
  enum?: string[];
  default?: unknown;
};

function SchemaForm({
  schema,
  values,
  onChange,
}: {
  schema: Record<string, unknown> | null;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  if (!schema) {
    return (
      <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
        No input schema available for this tool.
      </p>
    );
  }

  const properties = (schema.properties ?? {}) as Record<string, SchemaProperty>;
  const required = (schema.required ?? []) as string[];
  const entries = Object.entries(properties);

  if (entries.length === 0) {
    return (
      <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
        This tool takes no inputs.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([key, prop]) => {
        const isRequired = required.includes(key);
        const value = values[key];

        if (prop.enum && prop.enum.length > 0) {
          return (
            <div key={key}>
              <label className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-mono font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {key}
                </span>
                {isRequired && (
                  <span className="text-[8px]" style={{ color: '#ef4444' }}>*</span>
                )}
                {prop.description && (
                  <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    — {prop.description}
                  </span>
                )}
              </label>
              <select
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(key, e.target.value)}
                className="w-full px-2.5 py-1.5 rounded text-[9px] font-mono outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                <option value="">Select…</option>
                {prop.enum.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (prop.type === 'boolean') {
          return (
            <div key={key}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => onChange(key, e.target.checked)}
                  className="rounded"
                />
                <span className="text-[9px] font-mono font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {key}
                </span>
                {isRequired && (
                  <span className="text-[8px]" style={{ color: '#ef4444' }}>*</span>
                )}
              </label>
              {prop.description && (
                <p className="text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {prop.description}
                </p>
              )}
            </div>
          );
        }

        if (prop.type === 'object') {
          return (
            <div key={key}>
              <label className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-mono font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {key}
                </span>
                {isRequired && (
                  <span className="text-[8px]" style={{ color: '#ef4444' }}>*</span>
                )}
                <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  (JSON object)
                </span>
              </label>
              <textarea
                rows={3}
                value={typeof value === 'string' ? value : value != null ? JSON.stringify(value, null, 2) : ''}
                onChange={(e) => {
                  try {
                    onChange(key, JSON.parse(e.target.value));
                  } catch {
                    onChange(key, e.target.value);
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded text-[9px] font-mono outline-none resize-none"
                placeholder="{}"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.8)',
                }}
              />
            </div>
          );
        }

        return (
          <div key={key}>
            <label className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-mono font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {key}
              </span>
              {isRequired && (
                <span className="text-[8px]" style={{ color: '#ef4444' }}>*</span>
              )}
              {prop.description && (
                <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  — {prop.description}
                </span>
              )}
            </label>
            <input
              type={prop.type === 'number' ? 'number' : 'text'}
              value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
              onChange={(e) =>
                onChange(
                  key,
                  prop.type === 'number' ? Number(e.target.value) : e.target.value,
                )
              }
              className="w-full px-2.5 py-1.5 rounded text-[9px] font-mono outline-none"
              placeholder={prop.type === 'number' ? '0' : `Enter ${key}…`}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.8)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function ExecutionResultPanel({ result }: { result: ToolExecutionResult }) {
  const verdict = result.governanceVerdict;
  const allowed = verdict.decision === 'allowed';

  return (
    <div className="flex flex-col gap-3">
      {/* Verdict */}
      <div
        className="rounded-lg p-3"
        style={{
          background: allowed ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${allowed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          {allowed ? (
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
          ) : (
            <XCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
          )}
          <span
            className="text-[10px] font-bold"
            style={{ color: allowed ? '#22c55e' : '#ef4444' }}
          >
            {verdict.decision.toUpperCase()}
          </span>
          <PolicyTierBadge tier={verdict.policyTier} />
          {result.executionMs > 0 && (
            <span className="text-[8px] font-mono ml-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {result.executionMs}ms
            </span>
          )}
        </div>
        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {verdict.reason}
        </p>
        {verdict.proofChainId && (
          <div className="mt-1.5 flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" style={{ color: '#8b7ac8' }} />
            <code className="text-[8px] font-mono" style={{ color: '#8b7ac8' }}>
              proof: {verdict.proofChainId}
            </code>
          </div>
        )}
      </div>

      {/* Result JSON */}
      {result.result != null && (
        <div>
          <div className="text-[8px] uppercase tracking-wide mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Result
          </div>
          <pre
            className="text-[9px] font-mono rounded-lg p-3 overflow-auto max-h-48"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {JSON.stringify(result.result, null, 2)}
          </pre>
        </div>
      )}

      {result.message && (
        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {result.message}
        </p>
      )}
    </div>
  );
}

export function ToolInspectorPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [selectedTool, setSelectedTool] = useState<ToolEntry | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [executionResult, setExecutionResult] = useState<ToolExecutionResult | null>(null);

  const { data, isLoading, isError } = useQuery<{ tools: ToolEntry[] }>({
    queryKey: ['ecosystem', 'tools', searchQuery, domainFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (domainFilter !== 'all') params.set('domain', domainFilter);
      params.set('limit', '100');
      return fetchJson(apiUrl(`/ecosystem/tools?${params}`));
    },
    staleTime: 30_000,
    retry: 0,
  });

  const tools = data?.tools ?? (isError ? MOCK_TOOLS : []);
  const domains = Array.from(new Set(tools.map((t) => t.domain)));

  const executeMutation = useMutation<ToolExecutionResult, Error>({
    mutationFn: async () => {
      await ensureCsrfCookie();
      const csrfToken = getCsrfToken();
      return fetchJson(apiUrl(`/ecosystem/tools/${encodeURIComponent(selectedTool!.id)}/execute`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify(formValues),
      });
    },
    onSuccess: (result) => setExecutionResult(result),
  });

  // Reset form + result when tool changes
  useEffect(() => {
    setFormValues({});
    setExecutionResult(null);
  }, [selectedTool?.id]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: tool catalog */}
        <div
          className="w-64 shrink-0 flex flex-col border-r"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Search */}
          <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Search className="w-3 h-3 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools…"
                className="flex-1 text-[9px] font-mono outline-none bg-transparent"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              />
            </div>

            {/* Domain filter chips */}
            <div className="flex flex-wrap gap-1 mt-2">
              {(['all', ...domains]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDomainFilter(d)}
                  className="px-1.5 py-0.5 rounded text-[8px] font-mono transition-all"
                  style={{
                    background: domainFilter === d ? `${ECOSYSTEM_ACCENT}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${domainFilter === d ? ECOSYSTEM_ACCENT + '35' : 'rgba(255,255,255,0.07)'}`,
                    color: domainFilter === d ? ECOSYSTEM_ACCENT : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Tool list */}
          <div className="flex-1 overflow-y-auto py-1">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,162,39,0.25)', borderTopColor: ECOSYSTEM_ACCENT }} />
              </div>
            )}
            {tools.map((tool) => {
              const isActive = selectedTool?.id === tool.id;
              const color = DOMAIN_COLORS[tool.domain] ?? '#8b7ac8';
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool)}
                  className="w-full text-left px-3 py-2 flex items-start gap-2 transition-all"
                  style={{
                    background: isActive ? `${ECOSYSTEM_ACCENT}0e` : 'transparent',
                    borderLeft: `2px solid ${isActive ? ECOSYSTEM_ACCENT : 'transparent'}`,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                    style={{ background: color }}
                  />
                  <div className="min-w-0">
                    <div
                      className="text-[9px] font-mono font-medium truncate"
                      style={{ color: isActive ? ECOSYSTEM_ACCENT : 'rgba(255,255,255,0.75)' }}
                    >
                      {tool.name}
                    </div>
                    <div className="text-[8px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {tool.serverName}
                    </div>
                  </div>
                  {tool.approvalRequired && (
                    <Shield className="w-2.5 h-2.5 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: input form */}
        <div
          className="flex-1 flex flex-col border-r overflow-hidden"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {selectedTool ? (
            <>
              <div
                className="px-4 py-3 border-b shrink-0"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: DOMAIN_COLORS[selectedTool.domain] ?? '#8b7ac8' }}
                  />
                  <span className="text-[11px] font-bold font-mono" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {selectedTool.name}
                  </span>
                </div>
                <p className="text-[9px] mb-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {selectedTool.description}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <PolicyTierBadge tier={selectedTool.policyTier} />
                  {selectedTool.domainTags.map((tag) => (
                    <DomainTag key={tag} tag={tag} />
                  ))}
                  <span className="text-[8px] font-mono ml-auto" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {selectedTool.callsLast30d} calls / 30d
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-[9px] uppercase tracking-wide mb-3 font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Input Parameters
                </div>
                <SchemaForm
                  schema={selectedTool.inputSchema as Record<string, unknown> | null}
                  values={formValues}
                  onChange={(key, value) => setFormValues((prev) => ({ ...prev, [key]: value }))}
                />
              </div>

              <div
                className="px-4 py-3 border-t shrink-0"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <button
                  onClick={() => executeMutation.mutate()}
                  disabled={executeMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded text-[10px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                  style={{
                    background: selectedTool.approvalRequired
                      ? 'rgba(239,68,68,0.12)'
                      : `${ECOSYSTEM_ACCENT}18`,
                    border: `1px solid ${selectedTool.approvalRequired ? 'rgba(239,68,68,0.3)' : ECOSYSTEM_ACCENT + '35'}`,
                    color: selectedTool.approvalRequired ? '#ef4444' : ECOSYSTEM_ACCENT,
                  }}
                >
                  {executeMutation.isPending ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  {selectedTool.approvalRequired ? 'Execute (Approval Required)' : 'Execute with Governance'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <Zap className="w-10 h-10 mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Select a tool from the catalog to inspect its schema and run a governed test execution
              </p>
            </div>
          )}
        </div>

        {/* Right: result panel */}
        <div className="w-72 shrink-0 flex flex-col overflow-hidden">
          <div
            className="px-4 py-3 border-b shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <span className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Governance & Result
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {executeMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-5 h-5 border-2 rounded-full animate-spin mb-3" style={{ borderColor: 'rgba(201,162,39,0.25)', borderTopColor: ECOSYSTEM_ACCENT }} />
                <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Executing through governance…
                </p>
              </div>
            )}
            {!executeMutation.isPending && executionResult && (
              <ExecutionResultPanel result={executionResult} />
            )}
            {!executeMutation.isPending && !executionResult && (
              <div className="flex flex-col items-center justify-center py-12">
                <Shield className="w-8 h-8 mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p className="text-[9px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Policy verdict and execution result will appear here after running a tool
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
