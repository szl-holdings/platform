import * as React from 'react';

export interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}

/**
 * LiveRegion — an aria-live container for dynamic content announcements.
 * Use "polite" for non-urgent updates (toasts, status changes) and
 * "assertive" for urgent error messages or critical alerts.
 *
 * WCAG: SC 4.1.3 Status Messages (AA), SC 1.3.5 (AAA)
 */
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  className,
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className={`gi-sr-only ${className ?? ''}`}
      role={politeness === 'assertive' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
