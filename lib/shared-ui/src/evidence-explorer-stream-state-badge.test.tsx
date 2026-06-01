// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StreamStateBadge } from './evidence-explorer';

describe('StreamStateBadge', () => {
  it('shows Live state with pulsing dot when SSE is connected', () => {
    render(<StreamStateBadge connected={true} />);
    const badge = screen.getByTestId('stream-state-badge');
    expect(badge.getAttribute('data-state')).toBe('live');
    expect(badge.textContent).toContain('Live');
    const dot = badge.querySelector('span.rounded-full');
    expect(dot).not.toBeNull();
    expect(dot?.className).toContain('animate-pulse');
    expect(badge.getAttribute('title') ?? '').toMatch(/live stream connected/i);
    expect(badge.getAttribute('aria-label') ?? '').toMatch(/instantly via SSE/i);
  });

  it('shows Polling state with a non-pulsing muted dot when SSE is dropped', () => {
    render(<StreamStateBadge connected={false} />);
    const badge = screen.getByTestId('stream-state-badge');
    expect(badge.getAttribute('data-state')).toBe('polling');
    expect(badge.textContent).toContain('Polling');
    const dot = badge.querySelector('span.rounded-full');
    expect(dot).not.toBeNull();
    expect(dot?.className).not.toContain('animate-pulse');
    expect(badge.getAttribute('title') ?? '').toMatch(/falling back to periodic polling/i);
    expect(badge.getAttribute('aria-label') ?? '').toMatch(/disconnected/i);
  });
});
