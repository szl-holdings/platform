import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react';

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  surfaceStrong: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
  user: '#7fb3ff',
  good: '#10b981',
  warn: '#f59e0b',
  bad: '#ef4444',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

const BASE_URL = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const API_BASE = '/api/a11oy';

type ChatMode = 'sovereign' | 'code' | 'reason' | 'fast' | 'research' | 'governance';
type ChatProvider = 'anthropic' | 'kimi' | 'openai' | 'huggingface';

interface Recommendation {
  mode: ChatMode;
  modelId: string;
  provider: ChatProvider;
  rationale: string;
  confidence: number;
  overrideApplied?: boolean;
  alternatives?: Array<{ mode: ChatMode; modelId: string; reason: string }>;
  availableTools?: string[];
}

interface MirrorEvalData {
  evalId: string;
  disposition: string;
  overallScore: number;
  scores: Array<{ dimension: string; score: number }>;
}

interface Provenance {
  model: string;
  modelLane: string;
  mode: string;
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
  systemPromptVersion: string;
  enqueuedForReview: boolean;
}

interface ToolCall {
  name: string;
  status: 'running' | 'complete' | 'error';
  duration?: number;
}

interface AmiData {
  gate: 'BLOCK' | 'WATCH' | 'ASSIST' | 'OPERATE' | 'AUTONOMOUS';
  score: number;
  permissions: string[];
  rationale: string;
  formula: string;
  components: Record<string, number>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  streaming?: boolean;
  errored?: boolean;
  recommendation?: Recommendation;
  mirrorEval?: MirrorEvalData;
  ami?: AmiData;
  provenance?: Provenance;
  tools?: ToolCall[];
}

const AMI_GATE_COLORS: Record<AmiData['gate'], string> = {
  BLOCK: '#ef4444',
  WATCH: '#f59e0b',
  ASSIST: '#c9b787',
  OPERATE: '#22c55e',
  AUTONOMOUS: '#3b82f6',
};

const MODE_LABELS: Record<ChatMode, string> = {
  sovereign: 'Sovereign',
  code: 'Code',
  reason: 'Reason',
  fast: 'Fast',
  research: 'Research',
  governance: 'Governance',
};

function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function providerLabel(p: string): string {
  return ({ anthropic: 'Claude', kimi: 'Kimi', openai: 'OpenAI', huggingface: 'HF' } as Record<string, string>)[p] ?? p;
}

function renderInline(text: string): JSX.Element {
  const out: JSX.Element[] = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const segments: JSX.Element[] = [];
    let rest = line;
    let k = 0;
    while (rest.length) {
      const inline = rest.match(/`([^`]+)`/);
      if (!inline || inline.index === undefined) {
        segments.push(<span key={k++}>{rest}</span>);
        break;
      }
      if (inline.index > 0) segments.push(<span key={k++}>{rest.slice(0, inline.index)}</span>);
      segments.push(
        <code key={k++} style={{ fontFamily: T.mono, fontSize: '0.85em', padding: '0.1em 0.35em', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, color: T.accent }}>
          {inline[1]}
        </code>,
      );
      rest = rest.slice(inline.index + inline[0].length);
    }
    out.push(<span key={i}>{segments}{i < lines.length - 1 ? <br /> : null}</span>);
  });
  return <>{out}</>;
}

function renderMarkdown(text: string): JSX.Element {
  const parts: JSX.Element[] = [];
  let remaining = text;
  let key = 0;
  const codeFence = /```(\w+)?\n([\s\S]*?)```/;
  while (remaining.length > 0) {
    const m = remaining.match(codeFence);
    if (!m || m.index === undefined) {
      parts.push(<span key={key++}>{renderInline(remaining)}</span>);
      break;
    }
    if (m.index > 0) parts.push(<span key={key++}>{renderInline(remaining.slice(0, m.index))}</span>);
    const lang = m[1] || '';
    const code = m[2] || '';
    parts.push(
      <pre key={key++} style={{ margin: '0.75rem 0', padding: '0.85rem 1rem', backgroundColor: 'rgba(0,0,0,0.4)', border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto', fontSize: '0.78rem', lineHeight: 1.55, fontFamily: T.mono, color: '#e8e8e8' }}>
        {lang ? <div style={{ fontSize: '0.6rem', color: T.muted, marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{lang}</div> : null}
        <code>{code}</code>
      </pre>,
    );
    remaining = remaining.slice(m.index + m[0].length);
  }
  return <>{parts}</>;
}

const SUGGESTIONS: Array<{ text: string; mode: ChatMode }> = [
  { text: 'Explain the six platform primitives in plain English.', mode: 'reason' },
  { text: 'Refactor a TypeScript covenant validator to be pure.', mode: 'code' },
  { text: 'What does the Proof Chain primitive guarantee?', mode: 'governance' },
  { text: 'Search HuggingFace for the top RAG embedding models.', mode: 'research' },
  { text: 'Is this conversation persisted?', mode: 'fast' },
];

function RecommendationChip({ rec, onOverride }: { rec: Recommendation; onOverride: (mode: ChatMode) => void }) {
  const [open, setOpen] = useState(false);
  const color = rec.overrideApplied ? T.user : T.accent;
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px',
          background: 'rgba(201,183,135,0.06)', border: `1px solid ${T.border}`,
          borderRadius: 999, fontSize: '0.7rem', fontFamily: T.mono, color, cursor: 'pointer',
        }}
        aria-label="recommendation chip"
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        <span>{MODE_LABELS[rec.mode]} · {providerLabel(rec.provider)}</span>
        {rec.overrideApplied ? <span style={{ color: T.user }}>· override</span> : null}
        <span style={{ color: T.muted }}>· {(rec.confidence * 100).toFixed(0)}%</span>
      </button>
      <div style={{ marginTop: 4, fontSize: '0.7rem', color: T.dim, fontStyle: 'italic' }}>{rec.rationale}</div>
      {open && rec.alternatives && rec.alternatives.length > 0 ? (
        <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {rec.alternatives.map((a) => (
            <button
              key={a.mode}
              type="button"
              onClick={() => { onOverride(a.mode); setOpen(false); }}
              style={{
                padding: '2px 8px', fontSize: '0.65rem', fontFamily: T.mono,
                background: 'transparent', border: `1px solid ${T.border}`,
                color: T.dim, borderRadius: 999, cursor: 'pointer',
              }}
              aria-label={`override to ${a.mode}`}
            >
              → {MODE_LABELS[a.mode]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ToolList({ tools }: { tools: ToolCall[] }) {
  return (
    <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {tools.map((t, i) => (
        <span key={i} style={{
          fontSize: '0.65rem', fontFamily: T.mono, padding: '2px 7px', borderRadius: 999,
          background: t.status === 'complete' ? 'rgba(16,185,129,0.08)' : t.status === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(201,183,135,0.06)',
          color: t.status === 'complete' ? T.good : t.status === 'error' ? T.bad : T.accent,
        }}>
          {t.name}{t.duration != null ? ` · ${t.duration}ms` : ''}
        </span>
      ))}
    </div>
  );
}

function AmiBadge({ ami }: { ami: AmiData }) {
  const color = AMI_GATE_COLORS[ami.gate];
  return (
    <span
      title={`${ami.rationale}\n\n${ami.formula}\n\npermissions: ${ami.permissions.join(', ')}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '2px 7px', borderRadius: 999,
        border: `1px solid ${color}`, color,
        fontSize: '0.6rem', fontFamily: T.mono, letterSpacing: '0.1em',
      }}
    >
      AMI {ami.score.toFixed(2)} · {ami.gate}
    </span>
  );
}

function ProvenanceFooter({ p, mev, ami }: { p: Provenance; mev?: MirrorEvalData; ami?: AmiData }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.65rem', fontFamily: T.mono, color: T.muted, flexWrap: 'wrap' }}
      >
        <span>{open ? '▾' : '▸'} provenance</span>
        <span>{p.latencyMs}ms</span>
        {mev ? (
          <span style={{ color: mev.overallScore >= 0.7 ? T.good : T.warn }}>
            mirror {mev.overallScore.toFixed(2)}
          </span>
        ) : null}
        {ami ? <AmiBadge ami={ami} /> : null}
        {p.enqueuedForReview ? <span style={{ color: T.warn }}>· queued for review</span> : null}
      </button>
      {open ? (
        <div style={{ marginTop: 6, paddingLeft: 10, borderLeft: `2px solid ${T.border}`, fontSize: '0.65rem', fontFamily: T.mono, color: T.dim, lineHeight: 1.7 }}>
          <div>mode: <span style={{ color: T.text }}>{p.mode}</span> · model: <span style={{ color: T.text }}>{p.model}</span> · lane: <span style={{ color: T.text }}>{p.lane}</span></div>
          <div>provider: <span style={{ color: T.text }}>{p.provider}</span> · prompt: <span style={{ color: T.text }}>{p.systemPromptVersion}</span></div>
          <div>tokens: <span style={{ color: T.text }}>{p.tokens.input} in / {p.tokens.output} out</span> · cost: <span style={{ color: T.text }}>${p.estimatedCostUsd.toFixed(6)}</span></div>
          <div>trust: <span style={{ color: p.trustScore >= 0.7 ? T.good : T.warn }}>{p.trustScore.toFixed(2)}</span></div>
          {p.proofId ? <div>proof: <span style={{ color: T.good }}>{p.proofId}</span></div> : null}
          {p.pceContractId ? <div>pce: <span style={{ color: T.text }}>{p.pceContractId}</span></div> : null}
          {ami ? (
            <div style={{ marginTop: 4, paddingTop: 4, borderTop: `1px dashed ${T.border}` }}>
              <div>ami gate: <span style={{ color: AMI_GATE_COLORS[ami.gate] }}>{ami.gate}</span> · score: <span style={{ color: T.text }}>{ami.score.toFixed(4)}</span></div>
              <div style={{ color: T.muted, fontSize: '0.6rem' }}>{ami.rationale}</div>
              <div style={{ color: T.muted, fontSize: '0.58rem', marginTop: 3 }}>permissions: {ami.permissions.join(' · ')}</div>
              {typeof ami.components?.A_adversarial_resistance === 'number' ? (
                (() => {
                  const A = ami.components.A_adversarial_resistance as number;
                  const color = A >= 0.95 ? T.good : A >= 0.5 ? T.warn : '#ef4444';
                  return (
                    <div style={{ marginTop: 4, paddingTop: 3, borderTop: `1px dotted ${T.border}`, fontSize: '0.58rem' }}>
                      antivenom A = <span style={{ color }}>{A.toFixed(2)}</span>
                      <span style={{ color: T.muted }}> · {A >= 0.95 ? 'no adversarial pattern' : A <= 0.15 ? 'critical match → forced BLOCK' : 'partial resistance lift'}</span>
                    </div>
                  );
                })()
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MessageBubble({ message, onOverride }: { message: Message; onOverride: (mode: ChatMode) => void }) {
  const isUser = message.role === 'user';
  const isError = message.errored;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 6 }}>
      <div style={{ fontSize: '0.6rem', fontFamily: T.mono, letterSpacing: '0.18em', textTransform: 'uppercase', color: isUser ? T.user : T.accent, opacity: 0.85 }}>
        {isUser ? 'You' : 'A11oy'}
      </div>
      <div style={{ maxWidth: '85%', padding: '0.85rem 1.1rem', backgroundColor: isUser ? 'rgba(127,179,255,0.08)' : T.surface, border: `1px solid ${isError ? '#ef4444' : isUser ? 'rgba(127,179,255,0.25)' : T.border}`, borderRadius: 8, color: isError ? '#fca5a5' : T.text, fontSize: '0.92rem', lineHeight: 1.65, wordBreak: 'break-word' }}>
        {!isUser && message.recommendation ? <RecommendationChip rec={message.recommendation} onOverride={onOverride} /> : null}
        {!isUser && message.tools && message.tools.length > 0 ? <ToolList tools={message.tools} /> : null}
        {renderMarkdown(message.content || (message.streaming ? '\u2009' : ''))}
        {message.streaming ? <span style={{ display: 'inline-block', width: 8, height: 14, marginLeft: 4, verticalAlign: 'text-bottom', backgroundColor: T.accent, opacity: 0.7, animation: 'a11oy-blink 1s steps(2, start) infinite' }} /> : null}
        {!isUser && message.provenance ? <ProvenanceFooter p={message.provenance} mev={message.mirrorEval} ami={message.ami} /> : null}
      </div>
    </div>
  );
}

function ChatBody() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [forcedMode, setForcedMode] = useState<ChatMode | null>(null);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((j) => setHealthy(Boolean(j?.configured)))
      .catch(() => setHealthy(false));
    fetch(`${API_BASE}/improvements`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && Array.isArray(j.data)) {
          setPendingReviewCount(j.data.filter((e: { status: string }) => e.status === 'pending').length);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(
    async (text: string, modeOverride?: ChatMode, opts?: { skipAppendUser?: boolean; baseHistory?: Message[] }) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      const asstId = makeId();
      const asstMsg: Message = { id: asstId, role: 'assistant', content: '', streaming: true };
      // Caller may pass an explicit baseHistory (used by override-and-resend
      // after trimming the trailing assistant turn) to avoid stale closure
      // state. For normal sends we append the new user turn; for resends
      // (skipAppendUser) we keep the existing user turn intact.
      const base = opts?.baseHistory ?? messages;
      const history = opts?.skipAppendUser
        ? [...base]
        : [...base, { id: makeId(), role: 'user' as const, content: trimmed }];
      setMessages([...history, asstMsg]);
      setInput('');
      setBusy(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            forcedMode: modeOverride ?? forcedMode ?? undefined,
          }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          const err = await res.text().catch(() => '');
          setMessages((curr) => curr.map((m) => m.id === asstId ? { ...m, content: `Request failed (${res.status}). ${err.slice(0, 200)}`, streaming: false, errored: true } : m));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let acc = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl;
          while ((nl = buf.indexOf('\n')) !== -1) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            try {
              const ev = JSON.parse(payload);
              if (ev.type === 'recommendation' && ev.recommendation) {
                setMessages((curr) => curr.map((m) => m.id === asstId ? { ...m, recommendation: ev.recommendation } : m));
              } else if (ev.type === 'governance') {
                setMessages((curr) => curr.map((m) => m.id === asstId
                  ? { ...m, mirrorEval: ev.mirrorEval ?? m.mirrorEval, ami: ev.ami ?? m.ami }
                  : m));
              } else if (ev.type === 'tools' && Array.isArray(ev.tools)) {
                setMessages((curr) => curr.map((m) => m.id === asstId ? { ...m, tools: [...(m.tools ?? []), ...ev.tools] } : m));
              } else if (ev.type === 'provenance' && ev.provenance) {
                setMessages((curr) => curr.map((m) => m.id === asstId ? { ...m, provenance: ev.provenance } : m));
                if (ev.provenance.enqueuedForReview) setPendingReviewCount((n) => n + 1);
              } else if (ev.type === 'content' && ev.content) {
                acc += ev.content;
                setMessages((curr) => curr.map((m) => m.id === asstId ? { ...m, content: acc } : m));
              } else if (ev.type === 'error' || ev.error) {
                setMessages((curr) => curr.map((m) => m.id === asstId ? { ...m, content: acc + (acc ? '\n\n' : '') + `[stream error: ${ev.error}]`, errored: true, streaming: false } : m));
              } else if (ev.type === 'done' || ev.done) {
                setMessages((curr) => curr.map((m) => m.id === asstId ? { ...m, streaming: false } : m));
              } else if (ev.content) {
                // legacy fallback
                acc += ev.content;
                setMessages((curr) => curr.map((m) => m.id === asstId ? { ...m, content: acc } : m));
              }
            } catch { /* ignore */ }
          }
        }

        setMessages((curr) => curr.map((m) => m.id === asstId ? { ...m, streaming: false } : m));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('aborted')) {
          setMessages((curr) => curr.map((m) => m.id === asstId ? { ...m, streaming: false } : m));
        } else {
          setMessages((curr) => curr.map((m) => m.id === asstId ? { ...m, content: `Network error: ${msg}`, streaming: false, errored: true } : m));
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages, forcedMode],
  );

  const onSubmit = (e: FormEvent) => { e.preventDefault(); void send(input); };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); } };
  const stop = () => { abortRef.current?.abort(); };
  const reset = () => { abortRef.current?.abort(); setMessages([]); setBusy(false); };

  const overrideAndResend = (mode: ChatMode) => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    setForcedMode(mode);
    // Compute the trimmed history locally and pass it explicitly to send so
    // we do not rely on the closure-captured messages array (which may not
    // reflect the just-applied setMessages trim).
    const lastAsstIdx = messages.map((m) => m.role).lastIndexOf('assistant');
    const trimmed = lastAsstIdx === -1 ? messages : messages.slice(0, lastAsstIdx);
    setMessages(trimmed);
    setTimeout(() => { void send(lastUser.content, mode, { skipAppendUser: true, baseHistory: trimmed }); }, 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', backgroundColor: T.bg, color: T.text }}>
      <style>{`@keyframes a11oy-blink { 0%,49%{opacity:0.85} 50%,100%{opacity:0.15} }`}</style>

      <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.6rem', fontFamily: T.mono, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, marginBottom: 4 }}>
            A11oy Unified Chat
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 300, letterSpacing: '-0.01em' }}>One agentic surface · per-turn mode + model</div>
          <div style={{ fontSize: '0.75rem', color: T.dim, marginTop: 4 }}>
            Replaces Praxis and Console-chat. Each turn picks Sovereign / Code / Reason / Fast / Research / Governance and explains why. Override anytime.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a
            href={`${BASE_URL}/chat/improvements`}
            style={{ fontFamily: T.mono, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.45rem 0.8rem', border: `1px solid ${pendingReviewCount > 0 ? T.warn : T.border}`, color: pendingReviewCount > 0 ? T.warn : T.dim, borderRadius: 4, textDecoration: 'none' }}
          >
            Improvements{pendingReviewCount > 0 ? ` · ${pendingReviewCount}` : ''}
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontFamily: T.mono, color: T.dim }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: healthy === null ? '#888' : healthy ? T.good : T.bad }} />
            {healthy === null ? 'CHECKING' : healthy ? 'LIVE' : 'NO PROVIDER'}
          </div>
          <button type="button" onClick={reset} disabled={messages.length === 0 && !busy} style={{ fontFamily: T.mono, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.5rem 0.85rem', backgroundColor: 'transparent', border: `1px solid ${T.border}`, color: T.dim, borderRadius: 4, cursor: messages.length === 0 && !busy ? 'not-allowed' : 'pointer', opacity: messages.length === 0 && !busy ? 0.4 : 1 }}>Reset</button>
        </div>
      </div>

      {/* Forced mode chip strip */}
      <div style={{ padding: '0.6rem 1.5rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', fontFamily: T.mono }}>
        <span style={{ color: T.muted, marginRight: 6 }}>MODE:</span>
        <button
          type="button"
          onClick={() => setForcedMode(null)}
          style={{ padding: '3px 9px', borderRadius: 999, background: forcedMode === null ? 'rgba(201,183,135,0.15)' : 'transparent', border: `1px solid ${forcedMode === null ? T.accent : T.border}`, color: forcedMode === null ? T.accent : T.dim, cursor: 'pointer' }}
        >
          auto
        </button>
        {(Object.keys(MODE_LABELS) as ChatMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setForcedMode(m)}
            style={{ padding: '3px 9px', borderRadius: 999, background: forcedMode === m ? 'rgba(127,179,255,0.15)' : 'transparent', border: `1px solid ${forcedMode === m ? T.user : T.border}`, color: forcedMode === m ? T.user : T.dim, cursor: 'pointer' }}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 200, color: T.accent, marginBottom: 8, letterSpacing: '-0.02em' }}>A11oy</div>
            <div style={{ fontSize: '0.95rem', color: T.dim, marginBottom: 32, maxWidth: 540, lineHeight: 1.65 }}>
              One chat. Per turn it picks the best mode and model and tells you why. Click any pill below to start.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 540 }}>
              {SUGGESTIONS.map((s) => (
                <button key={s.text} type="button" onClick={() => { void send(s.text); }} style={{ padding: '0.75rem 1rem', backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontSize: '0.85rem', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>{s.text}</span>
                  <span style={{ fontSize: '0.65rem', fontFamily: T.mono, color: T.muted }}>{MODE_LABELS[s.mode]}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} onOverride={overrideAndResend} />)
        )}
      </div>

      <form onSubmit={onSubmit} style={{ padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} rows={2} placeholder={busy ? 'A11oy is responding…' : 'Message A11oy. Shift+Enter for newline.'} disabled={busy} style={{ flex: 1, resize: 'vertical', minHeight: 56, maxHeight: 220, padding: '0.75rem 0.95rem', backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontSize: '0.92rem', lineHeight: 1.55, fontFamily: 'inherit', outline: 'none' }} />
        {busy ? (
          <button type="button" onClick={stop} style={{ padding: '0.75rem 1.1rem', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', borderRadius: 6, fontFamily: T.mono, fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>Stop</button>
        ) : (
          <button type="submit" disabled={!input.trim()} style={{ padding: '0.75rem 1.4rem', backgroundColor: input.trim() ? T.accent : 'rgba(201,183,135,0.2)', border: `1px solid ${input.trim() ? T.accent : 'rgba(201,183,135,0.3)'}`, color: input.trim() ? '#0a0a0a' : T.muted, borderRadius: 6, fontFamily: T.mono, fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, cursor: input.trim() ? 'pointer' : 'not-allowed' }}>Send</button>
        )}
      </form>
    </div>
  );
}

export function A11oyChat() {
  return <ChatBody />;
}

export default A11oyChat;
