import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

type Protocol = 'MCP' | 'A2A' | 'ACP' | 'ANP';

const PROTOCOLS: { id: Protocol; label: string; provider: string; color: string; desc: string }[] = [
  { id: 'MCP', label: 'Model Context Protocol', provider: 'Anthropic (open)', color: '#c9b787', desc: 'Connect tools, resources, and prompts to any model. The universal tool adapter layer.' },
  { id: 'A2A', label: 'Agent-to-Agent', provider: 'Google (open)', color: '#4d8fcc', desc: 'Multi-agent coordination and task delegation. Enables agents to hire sub-agents.' },
  { id: 'ACP', label: 'Agent Communication Protocol', provider: 'IBM (open)', color: '#9b7cc8', desc: 'Enterprise agent interoperability. Structured message envelopes with audit trails.' },
  { id: 'ANP', label: 'Agent Notarization Protocol', provider: 'A11oy (native)', color: '#22c55e', desc: 'A11oy-native protocol for attested, proof-bound agent calls. Binds calls to Proof Chain.' },
];

const TOOL_DEMOS: Record<Protocol, { id: string; name: string; desc: string; params: { name: string; type: string; value: string }[] }[]> = {
  MCP: [
    { id: 'mcp-ais', name: 'ais_get_vessel_position', desc: 'Get real-time AIS position and status for a vessel.', params: [{ name: 'mmsi', type: 'string', value: '235001967' }, { name: 'fields', type: 'string[]', value: '["position","speed","status"]' }] },
    { id: 'mcp-port', name: 'port_get_congestion', desc: 'Get current congestion score for a port.', params: [{ name: 'port_code', type: 'string', value: 'MYTPP' }, { name: 'include_forecast', type: 'boolean', value: 'true' }] },
  ],
  A2A: [
    { id: 'a2a-delegate', name: 'delegate_task', desc: 'Delegate a research subtask to the Research Swarm agent.', params: [{ name: 'agent_id', type: 'string', value: 'research-swarm-v1' }, { name: 'task', type: 'string', value: 'Summarize Q1 maritime sanctions reports' }, { name: 'priority', type: 'string', value: 'high' }] },
    { id: 'a2a-status', name: 'get_delegation_status', desc: 'Check status of a delegated task.', params: [{ name: 'delegation_id', type: 'string', value: 'del-4421' }] },
  ],
  ACP: [
    { id: 'acp-send', name: 'send_structured_message', desc: 'Send a structured ACP message to another enterprise agent.', params: [{ name: 'recipient_agent', type: 'string', value: 'counsel-sentinel-v2' }, { name: 'envelope_type', type: 'string', value: 'task_request' }, { name: 'payload', type: 'object', value: '{"task": "review_contract", "priority": "urgent"}' }] },
  ],
  ANP: [
    { id: 'anp-attest', name: 'attest_agent_call', desc: 'Notarize an agent call and bind it to the active Proof Chain.', params: [{ name: 'workcell_id', type: 'string', value: 'wc-cascade-prod-1' }, { name: 'correlation_id', type: 'string', value: 'a11oy-wc-c1-prod:4421' }, { name: 'proof_chain_id', type: 'string', value: 'chain-001' }] },
  ],
};

const DEMO_RESPONSES: Record<Protocol, Record<string, unknown>> = {
  MCP: { ok: true, data: { mmsi: '235001967', vessel: 'MV Cascade', position: { lat: 1.28, lon: 103.67 }, speed: 0, status: 'at_anchor', timestamp: '2026-05-05T09:01:00Z' } },
  A2A: { ok: true, data: { delegation_id: 'del-4421', status: 'accepted', agent: 'research-swarm-v1', estimated_completion_ms: 4200 } },
  ACP: { ok: true, data: { message_id: 'acp-msg-8821', recipient: 'counsel-sentinel-v2', status: 'delivered', envelope_type: 'task_request', correlation_id: 'acp-8821-corr' } },
  ANP: { ok: true, data: { notarization_id: 'anp-4421', proof_chain_id: 'chain-001', attestation: 'Ed25519:spiffe://a11oy.szl/foundry', bound_at: '2026-05-05T09:01:00Z' } },
};

export function ProtocolBridge() {
  const [activeProto, setActiveProto] = useState<Protocol>('MCP');
  const [activeTool, setActiveTool] = useState<string>(TOOL_DEMOS.MCP[0].id);
  const [response, setResponse] = useState<unknown>(null);
  const [calling, setCalling] = useState(false);

  const tools = TOOL_DEMOS[activeProto];
  const tool = tools.find(t => t.id === activeTool) ?? tools[0];
  const proto = PROTOCOLS.find(p => p.id === activeProto)!;

  function callTool() {
    setCalling(true);
    setResponse(null);
    setTimeout(() => {
      setResponse(DEMO_RESPONSES[activeProto]);
      setCalling(false);
    }, 1000);
  }

  return (
    <Layout>
      <PageHeader
        label="PRIMITIVES / PROTOCOL BRIDGE"
        title="Universal Protocol Bridge"
        subtitle="Live call tester for MCP, A2A, ACP, and ANP. A single adapter layer connects any tool or agent protocol. Every call is attributed with a cross-protocol correlation ID."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="PROTOCOLS" value="4" sub="MCP/A2A/ACP/ANP" accent={GOLD} />
        <KpiCard label="LIVE ADAPTERS" value="12" sub="connected" accent={GOLD} />
        <KpiCard label="CALLS TODAY" value="24,800" sub="across all protocols" accent={GOLD} />
        <KpiCard label="CORRELATION IDs" value="Cross-protocol" sub="unified tracing" accent="#22c55e" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Protocol</div>
          <div className="space-y-2 mb-6">
            {PROTOCOLS.map(p => (
              <button key={p.id} type="button"
                onClick={() => { setActiveProto(p.id); setActiveTool(TOOL_DEMOS[p.id][0].id); setResponse(null); }}
                className="w-full p-3 rounded-lg border text-left transition-colors"
                style={{ backgroundColor: activeProto === p.id ? `${p.color}0e` : 'var(--color-a11oy-card)', borderColor: activeProto === p.id ? `${p.color}40` : 'var(--color-a11oy-border)', cursor: 'pointer' }}>
                <div className="font-mono text-sm mb-0.5" style={{ color: p.color }}>{p.id}</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.provider}</div>
              </button>
            ))}
          </div>

          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Tools</div>
          <div className="space-y-2">
            {tools.map(t => (
              <button key={t.id} type="button" onClick={() => { setActiveTool(t.id); setResponse(null); }}
                className="w-full p-3 rounded-lg border text-left transition-colors"
                style={{ backgroundColor: activeTool === t.id ? 'rgba(201,183,135,0.06)' : 'transparent', borderColor: activeTool === t.id ? 'rgba(201,183,135,0.25)' : 'var(--color-a11oy-border)', cursor: 'pointer' }}>
                <div className="text-xs font-mono" style={{ color: activeTool === t.id ? GOLD : 'var(--color-a11oy-text-sub)' }}>{t.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${proto.color}18`, color: proto.color }}>{activeProto}</span>
              <span className="text-sm font-mono" style={{ color: 'var(--color-a11oy-text)' }}>{tool.name}</span>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{tool.desc}</p>
            <div className="space-y-2 mb-4">
              {tool.params.map(p => (
                <div key={p.name} className="grid grid-cols-3 gap-2 text-xs items-center">
                  <div className="font-mono" style={{ color: GOLD }}>{p.name}</div>
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.type}</div>
                  <div className="font-mono px-2 py-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--color-a11oy-text-sub)' }}>{p.value}</div>
                </div>
              ))}
            </div>
            <button type="button" onClick={callTool} disabled={calling}
              className="w-full py-2 rounded text-xs font-mono transition-colors"
              style={{ background: calling ? 'rgba(94,94,94,0.12)' : `${proto.color}18`, color: calling ? '#5e5e5e' : proto.color, border: `1px solid ${calling ? 'var(--color-a11oy-border)' : `${proto.color}40`}`, cursor: calling ? 'not-allowed' : 'pointer' }}>
              {calling ? '↻ Calling…' : `▶ Call ${tool.name}`}
            </button>
          </Card>

          {response !== null && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-mono uppercase" style={{ color: '#22c55e' }}>✓ Response</div>
                <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Cross-protocol correlation ID: {activeProto.toLowerCase()}-{Date.now().toString(36)}</div>
              </div>
              <pre className="text-xs font-mono overflow-x-auto" style={{ color: GOLD, lineHeight: 1.7 }}>
                {JSON.stringify(response, null, 2)}
              </pre>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Protocol Bridge ported from PRAXIS (/nexus/bridge). ANP (Agent Notarization Protocol) is A11oy-native — not present in PRAXIS. MCP/A2A/ACP adapters normalized to A11oy correlation ID schema.
      </div>
    </Layout>
  );
}
