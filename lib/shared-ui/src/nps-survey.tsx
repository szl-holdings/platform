import { AnimatePresence, m } from 'framer-motion';
import { ChevronRight, Send, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { cn } from './utils';

export interface NpsSurveyProps {
  appName?: string;
  pageUrl?: string;
  userRole?: string;
  apiBaseUrl?: string;
  onSubmit?: (score: number, comment: string) => void;
  onDismiss?: () => void;
  onSnooze?: () => void;
  className?: string;
}

const _SCORE_LABELS: Record<number, string> = {
  0: 'Not at all likely',
  5: 'Neutral',
  10: 'Extremely likely',
};

function getScoreColor(score: number | null): string {
  if (score === null) return 'bg-muted text-muted-foreground border-border';
  if (score >= 9)
    return 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30';
  if (score >= 7) return 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30';
  return 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/30';
}

function getScoreRingColor(score: number | null): string {
  if (score === null) return '';
  if (score >= 9) return 'ring-2 ring-emerald-500/30';
  if (score >= 7) return 'ring-2 ring-amber-500/30';
  return 'ring-2 ring-red-500/30';
}

export function NpsSurvey({
  appName,
  pageUrl,
  userRole,
  apiBaseUrl = '',
  onSubmit,
  onDismiss,
  onSnooze,
  className,
}: NpsSurveyProps) {
  const [step, setStep] = useState<'score' | 'comment' | 'done'>('score');
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScoreSelect = (score: number) => {
    setSelectedScore(score);
  };

  const handleNext = () => {
    if (selectedScore === null) return;
    setStep('comment');
  };

  const handleSubmit = useCallback(async () => {
    if (selectedScore === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/feedback/nps`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: selectedScore,
          comment: comment.trim() || undefined,
          appName,
          pageUrl:
            pageUrl ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
          userRole,
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setStep('done');
      onSubmit?.(selectedScore, comment);
      setTimeout(() => {
        onDismiss?.();
      }, 2500);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedScore, comment, appName, pageUrl, userRole, apiBaseUrl, onSubmit, onDismiss]);

  const handleSnooze = useCallback(async () => {
    try {
      await fetch(`${apiBaseUrl}/api/feedback/dismiss`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snoozeDays: 7 }),
      });
    } catch {}
    onSnooze?.();
    onDismiss?.();
  }, [apiBaseUrl, onSnooze, onDismiss]);

  const handleDismiss = useCallback(async () => {
    try {
      await fetch(`${apiBaseUrl}/api/feedback/dismiss`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snoozeDays: 30 }),
      });
    } catch {}
    onDismiss?.();
  }, [apiBaseUrl, onDismiss]);

  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'relative bg-card border border-border rounded-2xl shadow-xl shadow-black/10 p-5 w-full max-w-md',
        className,
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Dismiss survey"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence mode="wait">
        {step === 'score' && (
          <m.div
            key="score"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div>
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                Quick Feedback
              </div>
              <h3 className="text-sm font-semibold text-foreground leading-snug pr-6">
                How likely are you to recommend this platform to a colleague?
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                0 = Not at all likely · 10 = Extremely likely
              </p>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 11 }, (_, i) => i).map((score) => (
                <button
                  key={score}
                  onClick={() => handleScoreSelect(score)}
                  className={cn(
                    'w-9 h-9 rounded-lg border text-xs font-bold transition-all duration-150',
                    selectedScore === score
                      ? getScoreColor(score)
                      : 'bg-background border-border text-foreground hover:border-primary/40 hover:bg-primary/5',
                  )}
                >
                  {score}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
              <span>Not likely</span>
              <span>Neutral</span>
              <span>Very likely</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleSnooze}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Ask me later
              </button>
              <button
                onClick={handleNext}
                disabled={selectedScore === null}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all',
                  selectedScore !== null
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed',
                )}
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </m.div>
        )}

        {step === 'comment' && (
          <m.div
            key="comment"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    'w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0',
                    getScoreColor(selectedScore),
                    getScoreRingColor(selectedScore),
                  )}
                >
                  {selectedScore}
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  {selectedScore !== null && selectedScore >= 9
                    ? 'Great to hear! What do you love most?'
                    : selectedScore !== null && selectedScore >= 7
                      ? 'Thanks! What could we improve?'
                      : 'We appreciate your honesty. What went wrong?'}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Optional — share any thoughts (max 500 chars)
              </p>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              placeholder="Your feedback helps us improve..."
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setStep('score')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {loading ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </m.div>
        )}

        {step === 'done' && (
          <m.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-4 text-center space-y-2"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <svg
                className="w-5 h-5 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Thank you for your feedback!</h3>
            <p className="text-xs text-muted-foreground">
              Your response helps us improve the platform for everyone.
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

export interface NpsSurveyOverlayProps extends NpsSurveyProps {
  visible: boolean;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export function NpsSurveyOverlay({
  visible,
  position = 'bottom-right',
  ...props
}: NpsSurveyOverlayProps) {
  const positionClass = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-6 left-6',
  }[position];

  return (
    <AnimatePresence>
      {visible && (
        <div className={cn('fixed z-50', positionClass)}>
          <NpsSurvey {...props} />
        </div>
      )}
    </AnimatePresence>
  );
}

export function useNpsSurvey({
  apiBaseUrl = '',
  appName,
  userRole,
  triggerDelayMs = 5000,
}: {
  apiBaseUrl?: string;
  appName?: string;
  userRole?: string;
  triggerDelayMs?: number;
} = {}) {
  const [visible, setVisible] = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (checked) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/feedback/nps-eligibility`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = (await res.json()) as { eligible: boolean };
          if (data.eligible) setVisible(true);
        }
      } catch {
        setVisible(true);
      }
      setChecked(true);
    }, triggerDelayMs);
    return () => clearTimeout(timer);
  }, [apiBaseUrl, triggerDelayMs, checked]);

  const dismiss = React.useCallback(() => setVisible(false), []);

  return { visible, dismiss, appName, userRole, apiBaseUrl };
}
