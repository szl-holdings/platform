// Agent Traffic Forensics — mitmproxy-style introspection for Sentra.
//
// Streams a windowed list of recent agent ↔ tool calls (mocked source) and
// lets the operator inspect request/response bodies plus the observed-vs-
// baseline meta projected via sentra-formula-observations.

import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  Clock,
  Cpu,
  Eye,
  GitCompare,
  RefreshCw,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface AgentTrafficFlow {
  flowId: string;
  timestamp: string;
  agent: { id: string; name: string; domain: string };
  tool: { id: string; name: string; transport: 'http' | 'mcp' | 'rpc' };
  request: {
    method: string;
    target: string;
    headers: Record<string, string>;
    body: unknown;
  };
  response: {
    status: number;
    latencyMs: number;
    headers: Record<string, string>;
    body: unknown;
  };
  observedVsBaseline: {
    parameter: string;
    observed: number;
    baseline: number;
    gap: number;
    oldValue: number;
    candidateValue: number;
    citation: string;
  };
}

interface FlowsResponse {
  flows: AgentTrafficFlow[];
  asOf: string;
  source: string;
  note: string;
}

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString();
  } catch {
    return iso;
  }
}

function gapBadgeTone(gap: number): string {
  if (gap >= 0.2) return 'text-[#f5f5f5] bg-[#f5f5f5]/10 border-[#f5f5f5]/30';
  if (gap >= 0.08) return 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/30';
  return 'text-[#8a8a8a] bg-[#8a8a8a]/10 border-[#8a8a8a]/30';
}

export default function AgentTrafficForensicsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery<FlowsResponse>({
    queryKey: ['sentra-agent-traffic-flows'],
    queryFn: async () => {
      const res = await apiFetch<{ data?: FlowsResponse } | FlowsResponse>(
        '/sentra/agent-traffic/flows',
      );
      // sendSuccess wraps payload under `data`.
      const payload = (res as { data?: FlowsResponse }).data ?? (res as FlowsResponse);
      return payload;
    },
    refetchInterval: 5000,
  });

  const flows = data?.flows ?? [];
  const selected = useMemo(
    () => flows.find((f) => f.flowId === selectedId) ?? flows[0] ?? null,
    [flows, selectedId],
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#c9b787] text-xs uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5" />
            Sentra · Agent Traffic Forensics
          </div>
          <h1 className="text-2xl font-light mt-1">Agent ↔ Tool Call Stream</h1>
          <p className="text-[#8a8a8a] text-sm mt-1 max-w-2xl">
            mitmproxy-style introspection of agentic traffic. Each flow carries
            an observed-vs-baseline meta field projected through the canonical
            risk-score formula (FORMULA_REGISTRY §5.2).
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 text-xs border border-[#2a2a2a] hover:border-[#c9b787]/40 rounded text-[#8a8a8a] hover:text-[#f5f5f5]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {data?.source === 'mock' && (
        <div className="mb-4 text-xs text-[#c9b787] bg-[#c9b787]/5 border border-[#c9b787]/20 rounded px-3 py-2">
          Mocked stream — {data.note}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Stream list */}
        <div className="col-span-12 lg:col-span-5 border border-[#1f1f1f] rounded-lg overflow-hidden">
          <div className="px-4 py-2 text-xs uppercase tracking-widest text-[#8a8a8a] border-b border-[#1f1f1f] flex justify-between">
            <span>Recent flows</span>
            <span>{flows.length}</span>
          </div>
          <ul className="divide-y divide-[#1f1f1f] max-h-[70vh] overflow-y-auto">
            {isLoading && (
              <li className="px-4 py-6 text-[#8a8a8a] text-sm">Loading…</li>
            )}
            {!isLoading && flows.length === 0 && (
              <li className="px-4 py-6 text-[#8a8a8a] text-sm">No traffic captured yet.</li>
            )}
            {flows.map((f) => {
              const active = (selected?.flowId ?? '') === f.flowId;
              return (
                <li key={f.flowId}>
                  <button
                    onClick={() => setSelectedId(f.flowId)}
                    className={`w-full text-left px-4 py-3 hover:bg-[#141414] ${active ? 'bg-[#141414]' : ''}`}
                  >
                    <div className="flex items-center justify-between text-xs text-[#8a8a8a]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {fmtTime(f.timestamp)}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded border text-[10px] ${gapBadgeTone(f.observedVsBaseline.gap)}`}
                      >
                        Δ {f.observedVsBaseline.gap.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm">
                      <span className="text-[#f5f5f5]">{f.agent.name}</span>
                      <ArrowRight className="w-3 h-3 text-[#8a8a8a]" />
                      <span className="text-[#c9b787]">{f.tool.name}</span>
                    </div>
                    <div className="text-xs text-[#8a8a8a] mt-1 flex items-center gap-2">
                      <span className="font-mono">{f.request.method}</span>
                      <span className="font-mono truncate">{f.request.target}</span>
                      <span className="ml-auto">{f.response.status} · {f.response.latencyMs}ms</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Detail panel */}
        <div className="col-span-12 lg:col-span-7 border border-[#1f1f1f] rounded-lg p-4">
          {!selected ? (
            <div className="text-[#8a8a8a] text-sm">Select a flow to inspect.</div>
          ) : (
            <FlowDetail flow={selected} />
          )}
        </div>
      </div>
    </div>
  );
}

function FlowDetail({ flow }: { flow: AgentTrafficFlow }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[#8a8a8a] flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" />
            Flow {flow.flowId}
          </div>
          <div className="mt-1 text-lg">
            {flow.agent.name}
            <span className="text-[#8a8a8a] px-2">→</span>
            <span className="text-[#c9b787]">{flow.tool.name}</span>
          </div>
          <div className="mt-1 text-xs text-[#8a8a8a] flex items-center gap-3">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{flow.tool.transport.toUpperCase()}</span>
            <span>{flow.response.status} · {flow.response.latencyMs}ms</span>
            <span>{fmtTime(flow.timestamp)}</span>
          </div>
        </div>
      </div>

      <ObservedVsBaseline obs={flow.observedVsBaseline} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <BodyPanel
          title={`Request · ${flow.request.method} ${flow.request.target}`}
          headers={flow.request.headers}
          body={flow.request.body}
        />
        <BodyPanel
          title={`Response · ${flow.response.status}`}
          headers={flow.response.headers}
          body={flow.response.body}
        />
      </div>
    </div>
  );
}

function ObservedVsBaseline({ obs }: { obs: AgentTrafficFlow['observedVsBaseline'] }) {
  return (
    <div className="mt-4 border border-[#1f1f1f] rounded p-3">
      <div className="text-xs uppercase tracking-widest text-[#8a8a8a] flex items-center gap-2 mb-2">
        <GitCompare className="w-3.5 h-3.5" />
        Observed vs Baseline · {obs.citation}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <Stat label="Observed" value={obs.observed.toFixed(3)} />
        <Stat label="Baseline" value={obs.baseline.toFixed(3)} />
        <Stat label="Gap" value={obs.gap.toFixed(3)} tone={gapBadgeTone(obs.gap)} />
        <Stat label={`Old ${obs.parameter}`} value={obs.oldValue.toLocaleString()} />
        <Stat label={`Candidate ${obs.parameter}`} value={obs.candidateValue.toLocaleString()} tone="text-[#c9b787]" />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[#8a8a8a]">{label}</div>
      <div className={`mt-0.5 font-mono ${tone ?? 'text-[#f5f5f5]'}`}>{value}</div>
    </div>
  );
}

function BodyPanel({
  title,
  headers,
  body,
}: {
  title: string;
  headers: Record<string, string>;
  body: unknown;
}) {
  return (
    <div className="border border-[#1f1f1f] rounded">
      <div className="px-3 py-2 text-xs text-[#8a8a8a] border-b border-[#1f1f1f]">
        {title}
      </div>
      <div className="p-3 text-xs">
        <div className="mb-2">
          {Object.entries(headers).map(([k, v]) => (
            <div key={k} className="font-mono text-[#8a8a8a]">
              <span className="text-[#c9b787]">{k}</span>: {v}
            </div>
          ))}
        </div>
        <pre className="font-mono text-[#f5f5f5] whitespace-pre-wrap break-all bg-[#0d0d0d] p-2 rounded border border-[#1f1f1f] overflow-x-auto">
{JSON.stringify(body, null, 2)}
        </pre>
      </div>
    </div>
  );
}
