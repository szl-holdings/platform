import { useState, useRef, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout';

interface ProvenanceEnvelope {
  model: string;
  modelLane: string;
  lane: string;
  provider: string;
  latencyMs: number;
  estimatedCostUsd: number;
  tokens: { input: number; output: number };
  trustScore: number;
  proofId: string | null;
  pceContractId: string | null;
  mirrorEvalId: string | null;
  conversationId: number | null;
}

interface MirrorEvalData {
  evalId: string;
  disposition: string;
  overallScore: number;
  scores: Array<{ dimension: string; score: number }>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  thinking?: string;
  artifacts?: Artifact[];
  tools?: ToolCall[];
  proofId?: string;
  model?: string;
  tokens?: { input: number; output: number };
  provenance?: ProvenanceEnvelope;
  mirrorEval?: MirrorEvalData;
  error?: string;
  errorType?: string;
}

interface Artifact {
  id: string;
  type: 'code' | 'document' | 'analysis' | 'workcell' | 'signal';
  title: string;
  language?: string;
  content: string;
}

interface ToolCall {
  name: string;
  status: 'running' | 'complete' | 'error';
  duration?: number;
}

interface Thread {
  id: number;
  title: string;
  createdAt: string;
}

const MODELS = [
  { id: 'a1.1oy-sovereign', label: 'a1.1oy Sovereign', description: 'Governed multi-model orchestration', tier: 'flagship' },
  { id: 'a1.1oy-code', label: 'a1.1oy Code', description: 'Code generation & refactoring', tier: 'specialized' },
  { id: 'a1.1oy-reason', label: 'a1.1oy Reason', description: 'Deep reasoning with proof chains', tier: 'specialized' },
  { id: 'a1.1oy-fast', label: 'a1.1oy Fast', description: 'Low-latency operational queries', tier: 'fast' },
];

const API_BASE = '/api/a11oy';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function SafeMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === '\n') return <br key={i} />;
        const boldMatch = part.match(/^\*\*(.*)\*\*$/);
        if (boldMatch) return <strong key={i} style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>{boldMatch[1]}</strong>;
        const codeMatch = part.match(/^`([^`]+)`$/);
        if (codeMatch) return <code key={i} className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(201,183,135,0.06)', color: 'rgba(201,183,135,0.85)' }}>{codeMatch[1]}</code>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function ThinkingBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs transition-colors"
        style={{ color: 'rgba(201,183,135,0.6)' }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d={expanded ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'} />
        </svg>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Reasoning
        </span>
      </button>
      {expanded && (
        <div className="mt-2 pl-4 text-xs leading-relaxed font-mono" style={{ color: 'rgba(255,255,255,0.4)', borderLeft: '2px solid rgba(201,183,135,0.15)' }}>
          {text}
        </div>
      )}
    </div>
  );
}

function ToolCallList({ tools }: { tools: ToolCall[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {tools.map((t, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono"
          style={{
            backgroundColor: t.status === 'complete' ? 'rgba(34,197,94,0.06)' : t.status === 'running' ? 'rgba(201,183,135,0.06)' : 'rgba(239,68,68,0.06)',
            color: t.status === 'complete' ? 'rgba(34,197,94,0.7)' : t.status === 'running' ? 'rgba(201,183,135,0.7)' : 'rgba(239,68,68,0.7)',
          }}
        >
          {t.status === 'complete' && (
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
          )}
          {t.status === 'running' && (
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'currentColor' }} />
          )}
          {t.name}
          {t.duration != null && <span style={{ opacity: 0.5 }}>{t.duration}ms</span>}
        </span>
      ))}
    </div>
  );
}

function ProvenanceFooter({ provenance, mirrorEval }: { provenance: ProvenanceEnvelope; mirrorEval?: MirrorEvalData }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-[11px] transition-colors"
        style={{ color: 'rgba(201,183,135,0.5)' }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d={expanded ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'} />
        </svg>
        <span className="font-mono">Provenance</span>
        <span style={{ opacity: 0.6 }}>{provenance.latencyMs}ms</span>
        {mirrorEval && (
          <span
            className="px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: mirrorEval.overallScore >= 0.7 ? 'rgba(34,197,94,0.08)' : 'rgba(234,179,8,0.08)',
              color: mirrorEval.overallScore >= 0.7 ? 'rgba(34,197,94,0.7)' : 'rgba(234,179,8,0.7)',
            }}
          >
            MirrorEval: {mirrorEval.overallScore.toFixed(2)}
          </span>
        )}
      </button>
      {expanded && (
        <div className="mt-2 pl-4 text-[11px] font-mono space-y-1" style={{ color: 'rgba(255,255,255,0.35)', borderLeft: '2px solid rgba(201,183,135,0.1)' }}>
          <div>Model: <span style={{ color: 'rgba(255,255,255,0.55)' }}>{provenance.model}</span></div>
          <div>Lane: <span style={{ color: 'rgba(255,255,255,0.55)' }}>{provenance.modelLane} ({provenance.lane})</span></div>
          <div>Provider: <span style={{ color: 'rgba(255,255,255,0.55)' }}>{provenance.provider}</span></div>
          <div>Latency: <span style={{ color: 'rgba(255,255,255,0.55)' }}>{provenance.latencyMs}ms</span></div>
          <div>Cost: <span style={{ color: 'rgba(255,255,255,0.55)' }}>${provenance.estimatedCostUsd.toFixed(6)}</span></div>
          <div>Tokens: <span style={{ color: 'rgba(255,255,255,0.55)' }}>{provenance.tokens.input} in / {provenance.tokens.output} out</span></div>
          <div>Trust: <span style={{ color: provenance.trustScore >= 0.7 ? 'rgba(34,197,94,0.7)' : 'rgba(234,179,8,0.7)' }}>{provenance.trustScore.toFixed(2)}</span></div>
          {provenance.proofId && <div>Proof: <span style={{ color: 'rgba(34,197,94,0.6)' }}>{provenance.proofId}</span></div>}
          {provenance.pceContractId && <div>PCE: <span style={{ color: 'rgba(255,255,255,0.55)' }}>{provenance.pceContractId}</span></div>}
          {mirrorEval && (
            <div className="mt-1 space-y-0.5">
              <div style={{ color: 'rgba(201,183,135,0.5)' }}>MirrorEval ({mirrorEval.disposition}):</div>
              {mirrorEval.scores.map((s, i) => (
                <div key={i} className="pl-2">
                  {s.dimension}: <span style={{ color: s.score >= 0.7 ? 'rgba(34,197,94,0.6)' : 'rgba(234,179,8,0.6)' }}>{s.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ErrorBanner({ error, errorType, onDismiss }: { error: string; errorType?: string; onDismiss: () => void }) {
  const labels: Record<string, string> = {
    rate_limit: 'Rate Limited',
    model_unavailable: 'Model Unavailable',
    policy_block: 'Policy Block',
    provider_unavailable: 'Provider Unavailable',
    server_busy: 'Server Busy',
    upstream_error: 'Upstream Error',
    internal_error: 'Internal Error',
  };
  const label = labels[errorType ?? ''] ?? 'Error';
  return (
    <div className="mx-auto max-w-3xl px-6 py-3">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.7)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-medium" style={{ color: 'rgba(239,68,68,0.8)' }}>{label}: </span>
          <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{error}</span>
        </div>
        <button onClick={onDismiss} className="p-1 rounded hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  );
}

function ArtifactPanel({ artifact, onClose }: { artifact: Artifact; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0c0c0c' }}>
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
            style={{
              backgroundColor: artifact.type === 'code' ? 'rgba(59,130,246,0.1)' : 'rgba(201,183,135,0.1)',
              color: artifact.type === 'code' ? 'rgba(59,130,246,0.8)' : 'rgba(201,183,135,0.8)',
            }}
          >
            {artifact.type}
          </span>
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{artifact.title}</span>
        </div>
        <button className="p-1.5 rounded-lg transition-colors hover:bg-white/5" onClick={onClose} style={{ color: 'rgba(255,255,255,0.3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="flex-1 overflow-auto p-5">
        <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {artifact.content}
        </pre>
      </div>
      {artifact.language && (
        <div className="px-5 py-2.5 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {artifact.language}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg, onArtifactClick }: { msg: Message; onArtifactClick: (a: Artifact) => void }) {
  const isUser = msg.role === 'user';

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="flex gap-4">
        {!isUser ? (
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'linear-gradient(135deg, rgba(201,183,135,0.2), rgba(201,183,135,0.05))' }}>
            <span className="text-sm font-semibold" style={{ color: '#c9b787' }}>a</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </div>
        )}
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[13px] font-semibold" style={{ color: isUser ? 'rgba(255,255,255,0.85)' : '#c9b787' }}>
              {isUser ? 'You' : 'a1.1oy'}
            </span>
            {msg.model && !isUser && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.06)', color: 'rgba(201,183,135,0.4)' }}>
                {msg.model}
              </span>
            )}
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.15)' }}>{formatTime(msg.timestamp)}</span>
          </div>

          {msg.thinking && <ThinkingBlock text={msg.thinking} />}
          {msg.tools && msg.tools.length > 0 && <ToolCallList tools={msg.tools} />}

          <div className="text-[14px] leading-[1.7] whitespace-pre-wrap" style={{ color: isUser ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.78)' }}>
            <SafeMarkdown text={msg.content} />
          </div>

          {msg.error && (
            <div className="mt-2 px-3 py-2 rounded-lg text-[12px]" style={{ backgroundColor: 'rgba(239,68,68,0.06)', color: 'rgba(239,68,68,0.7)' }}>
              {msg.error}
            </div>
          )}

          {msg.artifacts && msg.artifacts.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {msg.artifacts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onArtifactClick(a)}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.type === 'code' ? 'rgba(59,130,246,0.08)' : 'rgba(201,183,135,0.08)' }}>
                    {a.type === 'code' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9b787" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{a.title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {a.type}{a.language ? ` · ${a.language}` : ''}
                    </div>
                  </div>
                  <svg className="flex-shrink-0 transition-transform group-hover:translate-x-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              ))}
            </div>
          )}

          {!isUser && msg.provenance && (
            <ProvenanceFooter provenance={msg.provenance} mirrorEval={msg.mirrorEval} />
          )}

          {!msg.provenance && msg.proofId && (
            <div className="mt-3 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span className="text-[11px] font-mono" style={{ color: 'rgba(34,197,94,0.5)' }}>Proof: {msg.proofId}</span>
            </div>
          )}

          {!msg.provenance && msg.tokens && (
            <div className="mt-1 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.12)' }}>
              {msg.tokens.input} in · {msg.tokens.output} out
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  { text: 'Analyze signal mesh for anomalies', desc: 'Intelligence' },
  { text: 'Deploy a new workcell for deal review', desc: 'Execution' },
  { text: 'Run covenant compliance check', desc: 'Governance' },
  { text: 'Refactor the approval chain logic', desc: 'Code' },
];

export function Praxis() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingTools, setStreamingTools] = useState<ToolCall[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [chatError, setChatError] = useState<{ error: string; errorType?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isStreaming, streamingContent, scrollToBottom]);

  useEffect(() => {
    fetch(`${API_BASE}/conversations`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.data)) {
          setThreads(d.data.map((c: { id: number; title: string; createdAt: string }) => ({
            id: c.id,
            title: c.title,
            createdAt: c.createdAt,
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!showModelPicker) return;
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showModelPicker]);

  const loadConversation = useCallback(async (convId: number) => {
    try {
      const resp = await fetch(`${API_BASE}/conversations/${convId}/messages`);
      const data = await resp.json();
      if (data.ok && Array.isArray(data.data)) {
        setMessages(data.data.map((m: { id: number; role: string; content: string; createdAt: string }) => ({
          id: `db-${m.id}`,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.createdAt).getTime(),
        })));
        setConversationId(convId);
        setSelectedArtifact(null);
      }
    } catch { /* ignore */ }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const userContent = input.trim();

    const userMsg: Message = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: userContent,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingTools([]);
    setChatError(null);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const chatMessages = [...messages, userMsg]
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef.current = controller;

    let fullContent = '';
    let provenance: ProvenanceEnvelope | undefined;
    let mirrorEval: MirrorEvalData | undefined;
    let tools: ToolCall[] = [];

    try {
      const resp = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          model: selectedModel.id,
          conversationId,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        setChatError({ error: errBody.error ?? `HTTP ${resp.status}`, errorType: errBody.errorType });
        setIsStreaming(false);
        return;
      }

      if (!resp.body) {
        setChatError({ error: 'No response stream', errorType: 'internal_error' });
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line || !line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') continue;

          try {
            const ev = JSON.parse(payload);

            if (ev.type === 'content' && ev.content) {
              fullContent += ev.content;
              setStreamingContent((prev) => prev + ev.content);
            } else if (ev.type === 'governance' && ev.mirrorEval) {
              mirrorEval = ev.mirrorEval;
            } else if (ev.type === 'tools' && Array.isArray(ev.tools)) {
              tools = ev.tools;
              setStreamingTools(ev.tools);
            } else if (ev.type === 'provenance' && ev.provenance) {
              provenance = ev.provenance;
              if (ev.provenance.conversationId && !conversationId) {
                setConversationId(ev.provenance.conversationId);
              }
            } else if (ev.type === 'error') {
              setChatError({ error: ev.error, errorType: ev.errorType });
            } else if (ev.type === 'done') {
              // stream complete
            } else if (ev.content && !ev.type) {
              fullContent += ev.content;
              setStreamingContent((prev) => prev + ev.content);
            } else if (ev.done && !ev.type) {
              // legacy done
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // user cancelled
      } else {
        const msg = err instanceof Error ? err.message : 'Connection failed';
        setChatError({ error: msg, errorType: 'internal_error' });
      }
    }

    if (fullContent || provenance) {
      const assistantMsg: Message = {
        id: `m-${Date.now()}`,
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
        model: selectedModel.id,
        tools: tools.length > 0 ? tools : undefined,
        provenance,
        mirrorEval,
        proofId: provenance?.proofId ?? undefined,
        tokens: provenance?.tokens,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }

    setIsStreaming(false);
    setStreamingContent('');
    setStreamingTools([]);
    abortRef.current = null;

    if (provenance?.conversationId) {
      fetch(`${API_BASE}/conversations`)
        .then((r) => r.json())
        .then((d) => {
          if (d.ok && Array.isArray(d.data)) {
            setThreads(d.data.map((c: { id: number; title: string; createdAt: string }) => ({
              id: c.id, title: c.title, createdAt: c.createdAt,
            })));
          }
        })
        .catch(() => {});
    }
  }, [input, isStreaming, messages, selectedModel.id, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewConversation = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setSelectedArtifact(null);
    setConversationId(null);
    setIsStreaming(false);
    setStreamingContent('');
    setStreamingTools([]);
    setChatError(null);
  };

  const showEmpty = messages.length === 0 && !isStreaming;

  return (
    <Layout>
      <div className="flex h-[calc(100vh-48px)]" style={{ backgroundColor: '#0a0a0a' }}>
        {showThreads && (
          <div className="w-64 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#080808' }}>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Threads</span>
              <button
                onClick={handleNewConversation}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto px-2">
              {threads.length === 0 && (
                <div className="px-3 py-4 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No conversations yet</div>
              )}
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => loadConversation(t.id)}
                  className="w-full px-3 py-2.5 mb-0.5 rounded-lg text-left transition-colors hover:bg-white/[0.03]"
                  style={{ backgroundColor: conversationId === t.id ? 'rgba(201,183,135,0.05)' : 'transparent' }}
                >
                  <div className="text-[12px] font-medium truncate" style={{ color: conversationId === t.id ? '#c9b787' : 'rgba(255,255,255,0.65)' }}>{t.title}</div>
                  <span className="text-[10px] mt-1 inline-block" style={{ color: 'rgba(255,255,255,0.15)' }}>{formatRelative(t.createdAt)}</span>
                </button>
              ))}
            </div>
            <div style={{ margin: '0.5rem', padding: '0.875rem 1rem', borderTop: '2px solid #c9b787', background: 'rgba(201,183,135,0.04)', borderRadius: 6 }}>
              <p style={{ fontSize: '0.5625rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9b787', margin: '0 0 0.375rem' }}>Atelier</p>
              <p style={{ fontSize: '0.6875rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.45)', margin: '0 0 0.5rem' }}>
                Publish governed AI Spaces — constitution, connectors, proof.
              </p>
              <a href={`${(import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '')}/atelier`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6875rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 600, color: '#c9b787', textDecoration: 'none', letterSpacing: '0.05em' }}>
                Open Atelier →
              </a>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-4 h-12 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowThreads(!showThreads)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                style={{ color: showThreads ? '#c9b787' : 'rgba(255,255,255,0.3)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
              </button>
              <button
                onClick={handleNewConversation}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                title="New conversation"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>

            <div className="relative" ref={modelRef}>
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/[0.03]"
              >
                <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedModel.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {showModelPicker && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden" style={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m); setShowModelPicker(false); }}
                      className="w-full px-4 py-2.5 text-left transition-colors hover:bg-white/[0.04] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-[13px] font-medium" style={{ color: selectedModel.id === m.id ? '#c9b787' : 'rgba(255,255,255,0.7)' }}>{m.label}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.description}</div>
                      </div>
                      {selectedModel.id === m.id && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9b787" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center">
              <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: 'rgba(34,197,94,0.5)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.6)' }} />
                Live
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {chatError && !isStreaming && (
              <ErrorBanner error={chatError.error} errorType={chatError.errorType} onDismiss={() => setChatError(null)} />
            )}

            {showEmpty ? (
              <div className="flex flex-col items-center justify-center h-full px-6">
                <div className="flex flex-col items-center" style={{ marginTop: '-60px' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, rgba(201,183,135,0.15), rgba(201,183,135,0.03))' }}>
                    <span className="text-xl font-semibold" style={{ color: '#c9b787' }}>a</span>
                  </div>
                  <h1 className="text-2xl font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>
                    What can I help with?
                  </h1>
                  <p className="text-[14px] text-center max-w-sm mb-10" style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                    Governed AI. Every response carries a proof chain.
                  </p>

                  <div className="w-full max-w-2xl mb-8">
                    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything — analyze, build, deploy, govern..."
                        rows={1}
                        className="w-full px-5 pt-4 pb-2 bg-transparent text-[14px] resize-none focus:outline-none"
                        style={{ color: 'rgba(255,255,255,0.85)', minHeight: '52px', maxHeight: '200px' }}
                        onInput={(e) => {
                          const el = e.currentTarget;
                          el.style.height = 'auto';
                          el.style.height = Math.min(el.scrollHeight, 200) + 'px';
                        }}
                      />
                      <div className="flex items-center justify-between px-3 pb-3">
                        <div className="flex items-center gap-0.5">
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.25)' }} title="Attach">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                          </button>
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.25)' }} title="MCP Tools">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                          </button>
                        </div>
                        <button
                          onClick={handleSubmit}
                          disabled={!input.trim() || isStreaming}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: input.trim() ? '#c9b787' : 'rgba(255,255,255,0.05)',
                            color: input.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.15)',
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(s.text)}
                        className="px-4 py-2 rounded-full text-[13px] transition-all hover:bg-white/[0.04]"
                        style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
                      >
                        {s.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} onArtifactClick={setSelectedArtifact} />
                ))}
                {isStreaming && (
                  <div className="max-w-3xl mx-auto px-6 py-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(201,183,135,0.2), rgba(201,183,135,0.05))' }}>
                        <span className="text-sm font-semibold" style={{ color: '#c9b787' }}>a</span>
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[13px] font-semibold" style={{ color: '#c9b787' }}>a1.1oy</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.06)', color: 'rgba(201,183,135,0.4)' }}>
                            {selectedModel.id}
                          </span>
                        </div>
                        {streamingTools.length > 0 && <ToolCallList tools={streamingTools} />}
                        {streamingContent ? (
                          <div className="text-[14px] leading-[1.7] whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.78)' }}>
                            <SafeMarkdown text={streamingContent} />
                            <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse rounded-sm" style={{ backgroundColor: 'rgba(201,183,135,0.5)' }} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(201,183,135,0.6)', animationDelay: '0ms' }} />
                              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(201,183,135,0.6)', animationDelay: '200ms' }} />
                              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(201,183,135,0.6)', animationDelay: '400ms' }} />
                            </div>
                            <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Thinking...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {!showEmpty && (
            <div className="px-4 pb-5 pt-2">
              <div className="max-w-3xl mx-auto">
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Reply to a1.1oy..."
                    rows={1}
                    className="w-full px-5 pt-4 pb-2 bg-transparent text-[14px] resize-none focus:outline-none"
                    style={{ color: 'rgba(255,255,255,0.85)', minHeight: '52px', maxHeight: '200px' }}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = 'auto';
                      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
                    }}
                  />
                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="flex items-center gap-0.5">
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.25)' }} title="Attach">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                      </button>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.25)' }} title="MCP Tools">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {isStreaming && (
                        <button
                          onClick={() => { if (abortRef.current) abortRef.current.abort(); }}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors hover:bg-white/5"
                          style={{ color: 'rgba(239,68,68,0.7)', border: '1px solid rgba(239,68,68,0.2)' }}
                        >
                          Stop
                        </button>
                      )}
                      <button
                        onClick={handleSubmit}
                        disabled={!input.trim() || isStreaming}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{
                          backgroundColor: input.trim() ? '#c9b787' : 'rgba(255,255,255,0.05)',
                          color: input.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.15)',
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedArtifact && (
          <div className="w-[420px] flex-shrink-0" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
            <ArtifactPanel artifact={selectedArtifact} onClose={() => setSelectedArtifact(null)} />
          </div>
        )}
      </div>
    </Layout>
  );
}
