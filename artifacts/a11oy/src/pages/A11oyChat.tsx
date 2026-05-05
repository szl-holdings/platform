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
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

const BASE_URL = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const API_PATH = '/api/a11oy/chat';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  streaming?: boolean;
  errored?: boolean;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
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
      <pre
        key={key++}
        style={{
          margin: '0.75rem 0',
          padding: '0.85rem 1rem',
          backgroundColor: 'rgba(0,0,0,0.4)',
          border: `1px solid ${T.border}`,
          borderRadius: 6,
          overflow: 'auto',
          fontSize: '0.78rem',
          lineHeight: 1.55,
          fontFamily: T.mono,
          color: '#e8e8e8',
        }}
      >
        {lang ? (
          <div style={{ fontSize: '0.6rem', color: T.muted, marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{lang}</div>
        ) : null}
        <code>{code}</code>
      </pre>,
    );
    remaining = remaining.slice(m.index + m[0].length);
  }
  return <>{parts}</>;
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
        <code
          key={k++}
          style={{
            fontFamily: T.mono,
            fontSize: '0.85em',
            padding: '0.1em 0.35em',
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 3,
            color: T.accent,
          }}
        >
          {inline[1]}
        </code>,
      );
      rest = rest.slice(inline.index + inline[0].length);
    }
    out.push(
      <span key={i}>
        {segments}
        {i < lines.length - 1 ? <br /> : null}
      </span>,
    );
  });
  return <>{out}</>;
}

const SUGGESTIONS = [
  'Explain the six platform primitives in plain English.',
  'What does the Proof Chain primitive actually guarantee?',
  'Write a TypeScript function that validates a Covenant Policy decision.',
  'How does A11oy differ from a normal AI orchestration framework?',
  'Summarize the Lutar Invariant for a non-technical procurement officer.',
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isError = message.errored;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 6 }}>
      <div
        style={{
          fontSize: '0.6rem',
          fontFamily: T.mono,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: isUser ? T.user : T.accent,
          opacity: 0.85,
        }}
      >
        {isUser ? 'You' : 'A11oy'}
      </div>
      <div
        style={{
          maxWidth: '85%',
          padding: '0.85rem 1.1rem',
          backgroundColor: isUser ? 'rgba(127,179,255,0.08)' : T.surface,
          border: `1px solid ${isError ? '#ef4444' : isUser ? 'rgba(127,179,255,0.25)' : T.border}`,
          borderRadius: 8,
          color: isError ? '#fca5a5' : T.text,
          fontSize: '0.92rem',
          lineHeight: 1.65,
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        }}
      >
        {renderMarkdown(message.content || (message.streaming ? '\u2009' : ''))}
        {message.streaming ? (
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 14,
              marginLeft: 4,
              verticalAlign: 'text-bottom',
              backgroundColor: T.accent,
              opacity: 0.7,
              animation: 'a11oy-blink 1s steps(2, start) infinite',
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function ChatBody() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch(`${API_PATH.replace(/\/chat$/, '')}/health`)
      .then((r) => r.json())
      .then((j) => setHealthy(Boolean(j?.configured)))
      .catch(() => setHealthy(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      const userMsg: Message = { id: makeId(), role: 'user', content: trimmed };
      const asstId = makeId();
      const asstMsg: Message = { id: asstId, role: 'assistant', content: '', streaming: true };
      const history = [...messages, userMsg];
      setMessages([...history, asstMsg]);
      setInput('');
      setBusy(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch(API_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          const err = await res.text().catch(() => '');
          setMessages((curr) =>
            curr.map((m) =>
              m.id === asstId
                ? { ...m, content: `Request failed (${res.status}). ${err.slice(0, 200)}`, streaming: false, errored: true }
                : m,
            ),
          );
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
              if (ev.content) {
                acc += ev.content;
                setMessages((curr) => curr.map((m) => (m.id === asstId ? { ...m, content: acc } : m)));
              } else if (ev.error) {
                setMessages((curr) =>
                  curr.map((m) =>
                    m.id === asstId
                      ? { ...m, content: acc + (acc ? '\n\n' : '') + `[stream error: ${ev.error}]`, errored: true, streaming: false }
                      : m,
                  ),
                );
              } else if (ev.done) {
                setMessages((curr) => curr.map((m) => (m.id === asstId ? { ...m, streaming: false } : m)));
              }
            } catch {
              /* ignore */
            }
          }
        }

        setMessages((curr) => curr.map((m) => (m.id === asstId ? { ...m, streaming: false } : m)));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('aborted')) {
          setMessages((curr) => curr.map((m) => (m.id === asstId ? { ...m, streaming: false } : m)));
        } else {
          setMessages((curr) =>
            curr.map((m) => (m.id === asstId ? { ...m, content: `Network error: ${msg}`, streaming: false, errored: true } : m)),
          );
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', backgroundColor: T.bg, color: T.text }}>
      <style>{`@keyframes a11oy-blink { 0%,49%{opacity:0.85} 50%,100%{opacity:0.15} }`}</style>

      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: '0.6rem', fontFamily: T.mono, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, marginBottom: 4 }}>
            A11oy Orchestration Layer
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 300, letterSpacing: '-0.01em' }}>Chat</div>
          <div style={{ fontSize: '0.75rem', color: T.dim, marginTop: 4 }}>
            Real streaming. Backed by claude-sonnet-4-6 via the Replit AI Integrations Anthropic proxy.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontFamily: T.mono, color: T.dim }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: healthy === null ? '#888' : healthy ? '#10b981' : '#ef4444',
              }}
            />
            {healthy === null ? 'CHECKING' : healthy ? 'LIVE' : 'NO PROVIDER'}
          </div>
          <button
            type="button"
            onClick={reset}
            disabled={messages.length === 0 && !busy}
            style={{
              fontFamily: T.mono,
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.5rem 0.85rem',
              backgroundColor: 'transparent',
              border: `1px solid ${T.border}`,
              color: T.dim,
              borderRadius: 4,
              cursor: messages.length === 0 && !busy ? 'not-allowed' : 'pointer',
              opacity: messages.length === 0 && !busy ? 0.4 : 1,
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 200, color: T.accent, marginBottom: 8, letterSpacing: '-0.02em' }}>A11oy</div>
            <div style={{ fontSize: '0.95rem', color: T.dim, marginBottom: 32, maxWidth: 540, lineHeight: 1.65 }}>
              Ask anything. Claude-class reasoning, code generation, document analysis. Conversation memory persists for this session.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 540 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    void send(s);
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 6,
                    color: T.text,
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = T.surfaceStrong;
                    e.currentTarget.style.borderColor = T.borderStrong;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = T.surface;
                    e.currentTarget.style.borderColor = T.border;
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      <form
        onSubmit={onSubmit}
        style={{
          padding: '1rem 1.5rem 1.5rem',
          borderTop: `1px solid ${T.border}`,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={2}
          placeholder={busy ? 'A11oy is responding…' : 'Message A11oy. Shift+Enter for newline.'}
          disabled={busy}
          style={{
            flex: 1,
            resize: 'vertical',
            minHeight: 56,
            maxHeight: 220,
            padding: '0.75rem 0.95rem',
            backgroundColor: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            color: T.text,
            fontSize: '0.92rem',
            lineHeight: 1.55,
            fontFamily: 'inherit',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = T.borderStrong;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = T.border;
          }}
        />
        {busy ? (
          <button
            type="button"
            onClick={stop}
            style={{
              padding: '0.75rem 1.1rem',
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#fca5a5',
              borderRadius: 6,
              fontFamily: T.mono,
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              padding: '0.75rem 1.4rem',
              backgroundColor: input.trim() ? T.accent : 'rgba(201,183,135,0.2)',
              border: `1px solid ${input.trim() ? T.accent : 'rgba(201,183,135,0.3)'}`,
              color: input.trim() ? '#0a0a0a' : T.muted,
              borderRadius: 6,
              fontFamily: T.mono,
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: input.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}

export function A11oyChat() {
  return <ChatBody />;
}

export default A11oyChat;
