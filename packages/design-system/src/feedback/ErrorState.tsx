
import { color, semanticColors } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface ErrorStateProps {
  title?: string;
  message: string;
  code?: string;
  traceId?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  code,
  traceId,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-12 px-6 text-center',
        className,
      )}
    >
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: '40px',
          height: '40px',
          background: semanticColors.error.bg,
          color: semanticColors.error.text,
          fontSize: '20px',
        }}
      >
        !
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-sm" style={{ color: color.text.primary }}>
          {title}
        </h3>
        <p className="text-sm" style={{ color: color.text.secondary, maxWidth: '360px' }}>
          {message}
        </p>
        {code && (
          <span className="text-xs font-mono" style={{ color: color.text.muted }}>
            Code: {code}
          </span>
        )}
        {traceId && (
          <span className="text-xs font-mono" style={{ color: color.text.muted }}>
            Trace: {traceId}
          </span>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 rounded-md text-sm font-medium transition-colors"
          style={{
            height: '34px',
            background: color.bg.overlay,
            border: `1px solid ${color.border.default}`,
            color: color.text.primary,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
