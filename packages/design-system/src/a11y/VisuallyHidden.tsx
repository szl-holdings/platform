import * as React from 'react';

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  as?: 'span' | 'div' | 'p' | 'h2' | 'h3';
}

/**
 * VisuallyHidden — renders content that is accessible to screen readers but
 * invisible to sighted users. Use for supplementary labels, status announcements,
 * and off-screen descriptions.
 *
 * @example
 * <button>
 *   <IconClose aria-hidden="true" />
 *   <VisuallyHidden>Close dialog</VisuallyHidden>
 * </button>
 */
export function VisuallyHidden({ children, as: Tag = 'span', ...props }: VisuallyHiddenProps) {
  return (
    <Tag {...props} className={`gi-sr-only ${props.className ?? ''}`}>
      {children}
    </Tag>
  );
}
