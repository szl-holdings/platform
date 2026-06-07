import { m } from 'framer-motion';
import { MessageSquare, Send, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { cn } from './utils';

export interface ContextualFeedbackProps {
  label?: string;
  appName?: string;
  pageUrl?: string;
  userRole?: string;
  apiBaseUrl?: string;
  onSubmit?: (sentiment: 'positive' | 'negative' | 'neutral', comment: string) => void;
  className?: string;
  compact?: boolean;
}

type Sentiment = 'positive' | 'negative' | 'neutral';

export function ContextualFeedback({
  label = 'Was this helpful?',
  appName,
  pageUrl,
  userRole,
  apiBaseUrl = '',
  onSubmit,
  className,
  compact = false,
}: ContextualFeedbackProps) {
  const [phase, setPhase] = useState<'idle' | 'comment' | 'done'>('idle');
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSentiment = useCallback((s: Sentiment) => {
    setSentiment(s);
    setPhase('comment');
  }, []);

  const handleSubmit = useCallback(
    async (skipComment = false) => {
      if (!sentiment) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBaseUrl}/api/feedback/contextual`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sentiment,
            comment: skipComment ? undefined : comment.trim() || undefined,
            appName,
            pageUrl:
              pageUrl ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
            userRole,
          }),
        });
        if (!res.ok) throw new Error('Submission failed');
        setPhase('done');
        onSubmit?.(sentiment, skipComment ? '' : comment);
      } catch {
        setError('Something went wrong.');
      } finally {
        setLoading(false);
      }
    },
    [sentiment, comment, appName, pageUrl, userRole, apiBaseUrl, onSubmit],
  );

  if (phase === 'done') {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'inline-flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2',
          className,
        )}
      >
        <svg
          className="w-3.5 h-3.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Thank you for your feedback!
      </m.div>
    );
  }

  if (phase === 'comment') {
    return (
      <m.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(
          'bg-card border border-border rounded-xl p-3 space-y-2.5 w-full max-w-sm',
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center',
                sentiment === 'positive'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-red-500/10 text-red-600',
              )}
            >
              {sentiment === 'positive' ? (
                <ThumbsUp className="w-3.5 h-3.5" />
              ) : (
                <ThumbsDown className="w-3.5 h-3.5" />
              )}
            </span>
            <span className="text-xs font-medium text-foreground">
              {sentiment === 'positive' ? 'What did you like?' : 'What could be better?'}
            </span>
          </div>
          <button
            onClick={() => setPhase('idle')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 300))}
          placeholder="Optional — tell us more..."
          rows={2}
          className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
        />

        {error && <p className="text-[11px] text-red-500">{error}</p>}

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => handleSubmit(true)}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all"
          >
            {loading ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            Send
          </button>
        </div>
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('inline-flex items-center gap-2', compact ? 'gap-1.5' : 'gap-2', className)}
    >
      {!compact && <span className="text-xs text-muted-foreground">{label}</span>}
      <button
        onClick={() => handleSentiment('positive')}
        title="Helpful"
        className={cn(
          'flex items-center justify-center rounded-lg border transition-all',
          compact ? 'w-7 h-7' : 'w-8 h-8',
          'border-border bg-background text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/8 hover:text-emerald-600',
        )}
        aria-label="Thumbs up — helpful"
      >
        <ThumbsUp className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>
      <button
        onClick={() => handleSentiment('negative')}
        title="Not helpful"
        className={cn(
          'flex items-center justify-center rounded-lg border transition-all',
          compact ? 'w-7 h-7' : 'w-8 h-8',
          'border-border bg-background text-muted-foreground hover:border-red-500/40 hover:bg-red-500/8 hover:text-red-600',
        )}
        aria-label="Thumbs down — not helpful"
      >
        <ThumbsDown className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>
      {!compact && (
        <button
          onClick={() => {
            setSentiment('neutral');
            setPhase('comment');
          }}
          title="Leave a comment"
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
          aria-label="Leave a comment"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      )}
    </m.div>
  );
}

export interface ContextualFeedbackBarProps {
  message?: string;
  appName?: string;
  pageUrl?: string;
  userRole?: string;
  apiBaseUrl?: string;
  onSubmit?: (sentiment: 'positive' | 'negative' | 'neutral', comment: string) => void;
  className?: string;
}

export function ContextualFeedbackBar({
  message = 'Was this page helpful?',
  className,
  ...props
}: ContextualFeedbackBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 bg-muted/30 border border-border/60 rounded-xl',
        className,
      )}
    >
      <span className="text-xs text-muted-foreground flex-1">{message}</span>
      <ContextualFeedback compact {...props} />
    </div>
  );
}
