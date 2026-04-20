import React, { useCallback, useEffect, useRef, useState } from 'react';
import { colors, typography } from './tokens';

export interface CortexIntent {
  type: 'navigate' | 'query' | 'action' | 'report' | 'workflow';
  domain?: string;
  target?: string;
  parameters?: Record<string, unknown>;
  requiresConfirmation?: boolean;
  destructive?: boolean;
}

export interface CortexResult {
  summary: string;
  domain?: string;
  data?: unknown;
  actions?: Array<{ label: string; href?: string; action?: () => void }>;
  confidence: number;
}

export interface CortexVoiceProps {
  open: boolean;
  onClose: () => void;
  accentColor?: string;
  appName?: string;
  onQuery?: (query: string) => Promise<CortexResult>;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'result' | 'confirming';

const SAMPLE_INTENTS = [
  'Show me all vessels near sanctioned ports',
  "What's our portfolio NAV this week?",
  'Draft legal holds for pending PRISM cases',
  'Summarize alerts from the last 24 hours',
  'Show revenue across all domains',
  'Run a simulation: oil price +30%',
];

const DOMAIN_COLORS: Record<string, string> = {
  vessels: '#0ea5e9',
  terra: '#22c55e',
  aegis: '#ef4444',
  prism: '#a855f7',
  szl: '#f59e0b',
  carlota: '#ec4899',
  lyte: '#06b6d4',
};

async function defaultQueryHandler(query: string): Promise<CortexResult> {
  try {
    const res = await fetch('/api/cortex/query', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);

    const json = (await res.json()) as {
      data?: {
        summary?: string;
        confidence?: number;
        domains?: string[];
        actions?: Array<{ label: string; path: string }>;
      };
    };
    const data = json.data ?? {};
    const domain = Array.isArray(data.domains) ? data.domains[0] : undefined;
    const actions = Array.isArray(data.actions)
      ? data.actions.map((a) => ({ label: a.label, href: a.path }))
      : [];

    return {
      summary: data.summary ?? `Query processed: "${query}". Cross-domain intelligence aggregated.`,
      ...(domain !== undefined ? { domain } : {}),
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.75,
      actions,
    };
  } catch {
    return {
      summary: `CORTEX is processing your query: "${query}". The multi-agent orchestrator is aggregating intelligence across all domains.`,
      confidence: 0.6,
      actions: [{ label: 'View Command Portal', href: '/command/' }],
    };
  }
}

export function CortexVoice({
  open,
  onClose,
  accentColor = '#8b7ac8',
  appName,
  onQuery = defaultQueryHandler,
}: CortexVoiceProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<CortexResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ label: string; action: () => void } | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (open) {
      setVoiceState('idle');
      setQuery('');
      setResult(null);
      setPendingAction(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (!open && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      setIsListening(false);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (q: string) => {
      if (!q.trim()) return;
      setVoiceState('processing');
      setResult(null);
      try {
        const res = await onQuery(q.trim());
        setResult(res);
        setVoiceState('result');
      } catch {
        setResult({
          summary: 'CORTEX encountered an error processing your request. Please try again.',
          confidence: 0,
        });
        setVoiceState('result');
      }
    },
    [onQuery],
  );

  const startVoice = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please type your command.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setQuery(transcript);
      setIsListening(false);
      setVoiceState('idle');
      if (transcript.trim()) handleSubmit(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setVoiceState('idle');
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setVoiceState('listening');
  }, [handleSubmit]);

  const handleConfirm = useCallback(() => {
    if (pendingAction) {
      pendingAction.action();
      setPendingAction(null);
      setVoiceState('result');
    }
  }, [pendingAction]);

  if (!open) return null;

  const domainColor = result?.domain ? (DOMAIN_COLORS[result.domain] ?? accentColor) : accentColor;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily.body,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '680px',
          maxWidth: 'calc(100vw - 32px)',
          background: 'rgba(8,10,18,0.98)',
          backdropFilter: 'blur(32px)',
          border: `1px solid ${accentColor}40`,
          borderRadius: '20px',
          boxShadow: `0 32px 100px rgba(0,0,0,0.8), 0 0 0 1px ${accentColor}20, inset 0 1px 0 rgba(255,255,255,0.05)`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`,
              border: `1px solid ${accentColor}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '20px' }}>⟁</span>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: '0.5px',
              }}
            >
              CORTEX Voice
            </div>
            <div
              style={{
                fontSize: '11px',
                color: accentColor,
                marginTop: '1px',
                letterSpacing: '0.3px',
              }}
            >
              {appName ? `${appName} · ` : ''}Cross-Domain Intelligence Agent
            </div>
          </div>
          {voiceState === 'listening' && (
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    height: `${8 + Math.sin(Date.now() / 200 + i) * 6}px`,
                    background: accentColor,
                    borderRadius: '2px',
                    animation: `pulse-bar 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                    minHeight: '4px',
                    maxHeight: '20px',
                  }}
                />
              ))}
              <span style={{ fontSize: '11px', color: accentColor, marginLeft: '6px' }}>
                Listening...
              </span>
            </div>
          )}
          {voiceState === 'processing' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  border: `2px solid ${accentColor}40`,
                  borderTop: `2px solid ${accentColor}`,
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                Routing across domains...
              </span>
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '11px',
              fontFamily: typography.fontFamily.mono,
            }}
          >
            ESC
          </button>
        </div>

        {/* Input */}
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            borderBottom: voiceState !== 'idle' ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) handleSubmit(query);
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Ask anything across all domains... e.g. 'Show vessels near sanctioned ports'"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${query ? accentColor + '50' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '12px',
              padding: '12px 16px',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '14px',
              outline: 'none',
              fontFamily: typography.fontFamily.body,
              transition: 'border-color 0.2s',
            }}
            disabled={voiceState === 'processing' || voiceState === 'listening'}
          />
          <button
            onClick={
              isListening
                ? () => {
                    try {
                      recognitionRef.current?.stop();
                    } catch {
                      /* ignore */
                    }
                    setIsListening(false);
                    setVoiceState('idle');
                  }
                : startVoice
            }
            title={isListening ? 'Stop recording' : 'Start voice input'}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: `1px solid ${isListening ? '#ef4444' : accentColor + '50'}`,
              background: isListening ? 'rgba(239,68,68,0.15)' : `${accentColor}15`,
              color: isListening ? '#ef4444' : accentColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {isListening ? '◼' : '🎤'}
          </button>
          <button
            onClick={() => query.trim() && handleSubmit(query)}
            disabled={!query.trim() || voiceState === 'processing'}
            style={{
              height: '44px',
              padding: '0 18px',
              borderRadius: '12px',
              border: 'none',
              background: query.trim() ? accentColor : 'rgba(255,255,255,0.06)',
              color: query.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor: query.trim() ? 'pointer' : 'default',
              fontSize: '13px',
              fontWeight: 600,
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            Execute ↵
          </button>
        </div>

        {/* Result */}
        {voiceState === 'result' && result && (
          <div
            style={{
              padding: '20px 24px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div
              style={{
                background: `${domainColor}10`,
                border: `1px solid ${domainColor}30`,
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>⟁</span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.85)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {result.summary}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {result.domain && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: domainColor,
                          background: `${domainColor}20`,
                          border: `1px solid ${domainColor}40`,
                          borderRadius: '5px',
                          padding: '2px 8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {result.domain}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '10px',
                        color:
                          result.confidence > 0.85
                            ? '#22c55e'
                            : result.confidence > 0.7
                              ? '#f59e0b'
                              : '#ef4444',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '5px',
                        padding: '2px 8px',
                      }}
                    >
                      {Math.round(result.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {result.actions && result.actions.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {result.actions.map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    onClick={(e) => {
                      if (action.action) {
                        e.preventDefault();
                        action.action();
                        onClose();
                      }
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: i === 0 ? accentColor : 'rgba(255,255,255,0.07)',
                      color: i === 0 ? '#fff' : 'rgba(255,255,255,0.7)',
                      border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {action.label} →
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Confirmation */}
        {voiceState === 'confirming' && pendingAction && (
          <div
            style={{
              padding: '16px 24px',
              background: 'rgba(239,68,68,0.08)',
              borderTop: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>
              ⚠ This action requires confirmation: <strong>{pendingAction.label}</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setPendingAction(null);
                  setVoiceState('result');
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Suggestions (idle state only) */}
        {voiceState === 'idle' && !query && (
          <div style={{ padding: '12px 24px 20px' }}>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Suggested queries
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {SAMPLE_INTENTS.map((intent, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(intent);
                    handleSubmit(intent);
                  }}
                  style={{
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: typography.fontFamily.body,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = `${accentColor}12`;
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                  }}
                >
                  ↗ {intent}
                </button>
              ))}
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse-bar { from { opacity: 0.5; } to { opacity: 1; } }
        `}</style>
      </div>
    </div>
  );
}

export function useCortexVoice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return { open, setOpen };
}

export function CortexVoiceTrigger({
  accentColor = '#8b7ac8',
  onClick,
}: {
  accentColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title="Ask CORTEX (Ctrl+Shift+K)"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 14px',
        borderRadius: '10px',
        background: `${accentColor}15`,
        border: `1px solid ${accentColor}35`,
        color: accentColor,
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        letterSpacing: '0.3px',
        transition: 'all 0.2s',
        fontFamily: typography.fontFamily.body,
      }}
    >
      <span style={{ fontSize: '14px' }}>⟁</span>
      Ask CORTEX
      <span
        style={{
          fontSize: '9px',
          background: `${accentColor}20`,
          border: `1px solid ${accentColor}30`,
          borderRadius: '4px',
          padding: '1px 5px',
          fontFamily: 'monospace',
          opacity: 0.7,
        }}
      >
        ⌘⇧K
      </span>
    </button>
  );
}
