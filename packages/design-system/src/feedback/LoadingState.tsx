
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
  className?: string;
}

export function LoadingState({
  message,
  size = 'md',
  inline = false,
  className,
}: LoadingStateProps) {
  const spinnerSize = { sm: 16, md: 24, lg: 36 }[size];

  if (inline) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Spinner size={spinnerSize} />
        {message && (
          <span className="text-sm" style={{ color: color.text.secondary }}>
            {message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <Spinner size={spinnerSize} />
      {message && (
        <span className="text-sm" style={{ color: color.text.secondary }}>
          {message}
        </span>
      )}
    </div>
  );
}

function Spinner({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'spin 0.75s linear infinite' }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke={color.border.subtle} strokeWidth="3" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color.accent.blue}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
