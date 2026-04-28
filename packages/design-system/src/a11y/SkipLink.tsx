import * as React from 'react';

export interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

/**
 * SkipLink — renders a visually-hidden "Skip to main content" anchor that
 * becomes visible on keyboard focus. Satisfies WCAG 2.4.1 (Bypass Blocks, A)
 * and is a prerequisite for 2.4 Navigable success criteria.
 *
 * Usage: render as the first child of <body> / top of the React tree.
 *
 * @example
 * <SkipLink href="#main-content">Skip to main content</SkipLink>
 */
export function SkipLink({ href = '#main-content', children = 'Skip to main content' }: SkipLinkProps) {
  return (
    <a href={href} className="gi-skip-link">
      {children}
    </a>
  );
}
