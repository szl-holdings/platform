import { Send, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useCallback, useState } from 'react';

export type FeedbackSentiment = 'positive' | 'negative';

export interface FeedbackPayload {
  featureId: string;
  featureName: string;
  app: string;
  sentiment: FeedbackSentiment;
  comment?: string;
  context?: Record<string, unknown>;
}

export interface MicroFeedbackWidgetProps {
  featureId: string;
  featureName: string;
  app: string;
  context?: Record<string, unknown>;
  onSubmit?: (payload: FeedbackPayload) => Promise<void> | void;
  className?: string;
  compact?: boolean;
  prompt?: string;
}

const FEEDBACK_ENDPOINT = '/api/feedback';

async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    await fetch(`${baseUrl}${FEEDBACK_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, timestamp: Date.now() }),
    });
  } catch {
    // silent — telemetry best-effort
  }
}

type WidgetState = 'idle' | 'comment' | 'submitted';

export function MicroFeedbackWidget({
  featureId,
  featureName,
  app,
  context,
  onSubmit,
  compact = false,
  prompt = 'Was this useful?',
}: MicroFeedbackWidgetProps) {
  const [state, setState] = useState<WidgetState>('idle');
  const [sentiment, setSentiment] = useState<FeedbackSentiment | null>(null);
  const [comment, setComment] = useState('');
  const [dismissed, setDismissed] = useState(false);

  const handleVote = useCallback(
    async (s: FeedbackSentiment) => {
      setSentiment(s);
      if (s === 'positive') {
        const payload: FeedbackPayload = {
          featureId,
          featureName,
          app,
          sentiment: s,
          ...(context !== undefined ? { context } : {}),
        };
        await submitFeedback(payload);
        if (onSubmit) await onSubmit(payload);
        setState('submitted');
      } else {
        setState('comment');
      }
    },
    [featureId, featureName, app, context, onSubmit],
  );

  const handleSubmitComment = useCallback(async () => {
    if (!sentiment) return;
    const payload: FeedbackPayload = {
      featureId,
      featureName,
      app,
      sentiment,
      ...(comment.trim() ? { comment: comment.trim() } : {}),
      ...(context !== undefined ? { context } : {}),
    };
    await submitFeedback(payload);
    if (onSubmit) await onSubmit(payload);
    setState('submitted');
  }, [sentiment, comment, featureId, featureName, app, context, onSubmit]);

  if (dismissed) return null;

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: compact ? '0.375rem' : '0.5rem',
    padding: compact ? '0.25rem 0.625rem' : '0.375rem 0.875rem',
    borderRadius: '1rem',
    background: 'hsla(0,0%,100%,0.035)',
    border: '1px solid hsla(0,0%,100%,0.07)',
    fontSize: compact ? '10px' : '11px',
    fontFamily: 'system-ui, sans-serif',
  };

  if (state === 'submitted') {
    return (
      <div style={{ ...baseStyle, color: '#10b981', gap: '0.375rem' }}>
        <ThumbsUp size={compact ? 10 : 12} />
        <span style={{ fontWeight: 600 }}>Thanks for the signal</span>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            padding: '0 0 0 2px',
            lineHeight: 1,
            opacity: 0.6,
          }}
        >
          <X size={compact ? 10 : 11} />
        </button>
      </div>
    );
  }

  if (state === 'comment') {
    return (
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          gap: '0.375rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.75rem',
          background: 'hsla(0,0%,100%,0.04)',
          border: '1px solid hsla(0,0%,100%,0.08)',
          maxWidth: '320px',
        }}
      >
        <p style={{ fontSize: '10px', color: 'hsl(210,5%,52%)', margin: 0 }}>
          What could be better? (optional)
        </p>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
            placeholder="One line is enough…"
            autoFocus
            style={{
              flex: 1,
              background: 'hsla(0,0%,100%,0.06)',
              border: '1px solid hsla(0,0%,100%,0.08)',
              borderRadius: '0.375rem',
              padding: '4px 8px',
              fontSize: '11px',
              color: 'hsl(38,12%,88%)',
              outline: 'none',
              fontFamily: 'system-ui, sans-serif',
            }}
          />
          <button
            onClick={handleSubmitComment}
            style={{
              background: 'hsla(265,70%,60%,0.2)',
              border: '1px solid hsla(265,70%,60%,0.3)',
              borderRadius: '0.375rem',
              padding: '4px 8px',
              cursor: 'pointer',
              color: '#a78bfa',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Send size={11} />
          </button>
          <button
            onClick={handleSubmitComment}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(210,5%,44%)',
              fontSize: '10px',
              padding: '4px',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={baseStyle}>
      <span style={{ color: 'hsl(210,5%,52%)', fontWeight: 500 }}>{prompt}</span>
      <button
        onClick={() => handleVote('positive')}
        title="Helpful"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'hsl(210,5%,46%)',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '4px',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#10b981')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(210,5%,46%)')}
      >
        <ThumbsUp size={compact ? 11 : 13} />
      </button>
      <button
        onClick={() => handleVote('negative')}
        title="Not helpful"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'hsl(210,5%,46%)',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '4px',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(210,5%,46%)')}
      >
        <ThumbsDown size={compact ? 11 : 13} />
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'hsl(210,5%,34%)',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={compact ? 9 : 11} />
      </button>
    </div>
  );
}
