import { useState, useRef, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout';

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
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
}

const MODELS = [
  { id: 'a1.1oy-sovereign', label: 'a1.1oy Sovereign', description: 'Governed multi-model orchestration', tier: 'flagship' },
  { id: 'a1.1oy-code', label: 'a1.1oy Code', description: 'Code generation & refactoring', tier: 'specialized' },
  { id: 'a1.1oy-reason', label: 'a1.1oy Reason', description: 'Deep reasoning with proof chains', tier: 'specialized' },
  { id: 'a1.1oy-fast', label: 'a1.1oy Fast', description: 'Low-latency operational queries', tier: 'fast' },
];

const SEED_THREADS: Thread[] = [
  { id: 't-1', title: 'Refactor approval chain for Vantex deal', lastMessage: 'The workcell WC-0491 has been...', timestamp: Date.now() - 480000, messageCount: 12 },
  { id: 't-2', title: 'Analyze Q2 revenue drift signals', lastMessage: 'Based on the signal mesh data...', timestamp: Date.now() - 3600000, messageCount: 8 },
  { id: 't-3', title: 'Deploy new covenant policy for maritime', lastMessage: 'Covenant COV-MARITIME-7 has been...', timestamp: Date.now() - 7200000, messageCount: 5 },
  { id: 't-4', title: 'MCP connector audit — GitHub integration', lastMessage: 'All 14 MCP endpoints validated...', timestamp: Date.now() - 86400000, messageCount: 23 },
  { id: 't-5', title: 'Build regression forecast for TENAX', lastMessage: 'The forecast model shows a 12%...', timestamp: Date.now() - 172800000, messageCount: 16 },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm-1',
    role: 'user',
    content: 'Analyze the approval chain bottleneck on workcell WC-0491. Why has the Vantex Acquisition been stalled for 47 days?',
    timestamp: Date.now() - 60000,
  },
  {
    id: 'm-2',
    role: 'assistant',
    content: `I've analyzed workcell **WC-0491** (Vantex Acquisition — Q2 Close) and identified a compound failure in the approval chain. Here's the breakdown:

**Root Cause: Ownership Void**
The primary approver (David Chen, VP Sales) departed 47 days ago. The approval chain has no fallback delegate configured, creating a permanent block.

**Cascading Effects:**
1. **3 automated escalation attempts** were blocked by covenant policy COV-APPROVAL-3 (requires human approval for deals > $1M)
2. **Revenue exposure: $4.2M** — the deal has been in "pending-human" state with no recorded handoff
3. **Workflow Health degraded** to 62% — this single stall is dragging the entire pipeline

**Proof Chain:** All findings are backed by proof packet \`PP-29847\` with full evidence trail.

**Recommended Actions:**
1. Assign interim approver via \`/action-rail/reassign\`
2. Invoke emergency covenant lift for time-critical deals
3. Configure fallback delegates for all approval chains`,
    timestamp: Date.now() - 55000,
    thinking: 'Querying the workcell execution graph for WC-0491... Found 47-day stall. Tracing approval chain — primary approver David Chen no longer in org directory since March 11. Checking covenant policies — COV-APPROVAL-3 blocks automated approval for deals exceeding $1M threshold. Cross-referencing with signal mesh — 3 escalation signals generated and auto-suppressed. Computing revenue impact from deal metadata.',
    tools: [
      { name: 'workcell.inspect', status: 'complete', duration: 120 },
      { name: 'signal_mesh.query', status: 'complete', duration: 89 },
      { name: 'covenant.check', status: 'complete', duration: 45 },
      { name: 'proof.create', status: 'complete', duration: 210 },
    ],
    artifacts: [
      {
        id: 'a-1',
        type: 'analysis',
        title: 'WC-0491 Approval Chain Analysis',
        content: `{
  "workcell": "WC-0491",
  "deal": "Vantex Acquisition — Q2 Close",
  "value": "$4.2M",
  "stall_duration_days": 47,
  "root_cause": "approval_chain_void",
  "departed_approver": "David Chen (VP Sales)",
  "departure_date": "2026-03-11",
  "blocked_escalations": 3,
  "covenant_block": "COV-APPROVAL-3",
  "workflow_health_impact": "-11pp",
  "recommended_actions": [
    "reassign_approver",
    "emergency_covenant_lift",
    "configure_fallback_delegates"
  ],
  "proof_packet": "PP-29847",
  "confidence": 0.91
}`,
      },
      {
        id: 'a-2',
        type: 'code',
        title: 'Reassign Approver Script',
        language: 'typescript',
        content: `import { ActionRail } from '@a11oy/fabric';
import { CovenantEngine } from '@a11oy/governance';

async function reassignApprover(workcellId: string) {
  const rail = new ActionRail();
  const covenant = new CovenantEngine();
  
  const lift = await covenant.requestLift({
    policy: 'COV-APPROVAL-3',
    reason: 'approver_departure_void',
    duration: '72h',
    requiredApproval: 'executive',
  });
  
  if (lift.status === 'approved') {
    await rail.reassign({
      workcellId,
      newApprover: 'interim-exec-pool',
      proofRequired: true,
      auditTrail: true,
    });
  }
  
  return { lift, reassignment: 'pending_executive_approval' };
}`,
      },
    ],
    proofId: 'PP-29847',
    model: 'a1.1oy-sovereign',
    tokens: { input: 847, output: 2341 },
  },
];

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
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
            backgroundColor: t.status === 'complete' ? 'rgba(34,197,94,0.06)' : 'rgba(201,183,135,0.06)',
            color: t.status === 'complete' ? 'rgba(34,197,94,0.7)' : 'rgba(201,183,135,0.7)',
          }}
        >
          {t.status === 'complete' && (
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
          )}
          {t.name}
          {t.duration && <span style={{ opacity: 0.5 }}>{t.duration}ms</span>}
        </span>
      ))}
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

          {msg.proofId && (
            <div className="mt-3 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span className="text-[11px] font-mono" style={{ color: 'rgba(34,197,94,0.5)' }}>Proof: {msg.proofId}</span>
            </div>
          )}

          {msg.tokens && (
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
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isStreaming, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Message = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const assistantMsg: Message = {
        id: `m-${Date.now()}`,
        role: 'assistant',
        content: `I've processed your request through the a1.1oy Fabric. Here's what I found:\n\n**Analysis Complete**\nYour query has been routed through the governed execution pipeline with full proof chain attached.\n\n1. All relevant signals have been cross-referenced against the active signal mesh\n2. Covenant policies have been validated — no violations detected\n3. MirrorEval score: **0.94** (above threshold)\n\nThe full evidence trail is available in the proof ledger. Would you like me to drill deeper into any specific aspect?`,
        timestamp: Date.now(),
        thinking: 'Processing query through a1.1oy Fabric... Routing to appropriate workcell template. Checking covenant compliance. Running MirrorEval assessment. Generating proof packet.',
        tools: [
          { name: 'fabric.query', status: 'complete', duration: 156 },
          { name: 'covenant.validate', status: 'complete', duration: 42 },
          { name: 'mirror_eval.score', status: 'complete', duration: 89 },
          { name: 'proof.create', status: 'complete', duration: 134 },
        ],
        proofId: `PP-${Math.floor(Math.random() * 90000) + 10000}`,
        model: selectedModel.id,
        tokens: { input: Math.floor(Math.random() * 500) + 200, output: Math.floor(Math.random() * 2000) + 800 },
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsStreaming(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const showEmpty = messages.length === 0;

  return (
    <Layout>
      <div className="flex h-[calc(100vh-48px)]" style={{ backgroundColor: '#0a0a0a' }}>
        {showThreads && (
          <div className="w-64 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#080808' }}>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Threads</span>
              <button
                onClick={() => { setMessages([]); setSelectedArtifact(null); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto px-2">
              {SEED_THREADS.map((t) => (
                <button
                  key={t.id}
                  className="w-full px-3 py-2.5 mb-0.5 rounded-lg text-left transition-colors hover:bg-white/[0.03]"
                >
                  <div className="text-[12px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{t.title}</div>
                  <div className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{t.lastMessage}</div>
                  <span className="text-[10px] mt-1 inline-block" style={{ color: 'rgba(255,255,255,0.15)' }}>{formatRelative(t.timestamp)}</span>
                </button>
              ))}
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
                onClick={() => { setMessages([]); setSelectedArtifact(null); if (timerRef.current) { clearTimeout(timerRef.current); setIsStreaming(false); } }}
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
                Connected
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
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
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.25)' }} title="Search knowledge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
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
                      <div className="pt-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[13px] font-semibold" style={{ color: '#c9b787' }}>a1.1oy</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.06)', color: 'rgba(201,183,135,0.4)' }}>
                            {selectedModel.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(201,183,135,0.6)', animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(201,183,135,0.6)', animationDelay: '200ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(201,183,135,0.6)', animationDelay: '400ms' }} />
                          </div>
                          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Thinking...</span>
                        </div>
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
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.25)' }} title="Search knowledge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
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
