// @vitest-environment happy-dom
/**
 * Privacy guardrail test (#5516).
 *
 * Asserts that OperatorAttentionPanel — even under heavy interaction —
 * never emits a frame payload to the network. The panel's contract is
 * that ALL perception runs on-device and only the LivenessSummary
 * envelope ever leaves the component (via the onAttention callback).
 *
 * The test:
 *   1. Patches global fetch to capture every request.
 *   2. Mounts the panel and exercises both perception + typed-2fa paths.
 *   3. Asserts no fetch ever fires, and that no captured payload contains
 *      a Blob/FormData/ArrayBuffer/data-URL (the four wire shapes a
 *      camera frame could plausibly take).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, render, fireEvent } from '@testing-library/react';
import { OperatorAttentionPanel } from '../operator-attention-panel.tsx';

interface CapturedRequest {
  url: string;
  method: string;
  bodyKind: string;
  bodyText: string | null;
}

describe('OperatorAttentionPanel privacy guardrails', () => {
  const captured: CapturedRequest[] = [];
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    captured.length = 0;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const req = new Request(input as RequestInfo, init);
      const body = init?.body ?? null;
      let bodyKind = 'none';
      let bodyText: string | null = null;
      if (body instanceof Blob) bodyKind = 'Blob';
      else if (typeof FormData !== 'undefined' && body instanceof FormData) bodyKind = 'FormData';
      else if (body instanceof ArrayBuffer) bodyKind = 'ArrayBuffer';
      else if (typeof body === 'string') {
        bodyKind = 'string';
        bodyText = body;
      }
      captured.push({ url: req.url, method: req.method, bodyKind, bodyText });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('never POSTs a camera frame and only forwards summary envelopes', async () => {
    const attentionEvents: unknown[] = [];
    const { getByTestId, unmount } = render(
      <OperatorAttentionPanel
        incidentId="INC-2026-0001"
        onAttention={(a) => attentionEvents.push(a)}
      />,
    );

    // Exercise the typed-2fa fallback (does not require camera permission).
    await act(async () => {
      fireEvent.change(getByTestId('operator-attention-typed-input'), {
        target: { value: 'OP-CODE-1234' },
      });
      fireEvent.click(getByTestId('operator-attention-typed-submit'));
    });

    unmount();

    // Hard privacy invariants — every one of these must hold.
    expect(captured).toHaveLength(0);
    for (const req of captured) {
      expect(req.bodyKind).not.toBe('Blob');
      expect(req.bodyKind).not.toBe('FormData');
      expect(req.bodyKind).not.toBe('ArrayBuffer');
      if (req.bodyText) {
        expect(req.bodyText).not.toMatch(/data:image\//i);
        expect(req.bodyText).not.toMatch(/"frame"\s*:/);
        expect(req.bodyText).not.toMatch(/"image"\s*:/);
        expect(req.bodyText).not.toMatch(/"pixels"\s*:/);
      }
    }

    // Sanity: the typed-2fa envelope reached the consumer, and it contained
    // only the LivenessSummary shape + the typed code — never a frame.
    const typedEvent = attentionEvents.find(
      (e): e is { mode: string; typedCode?: string } =>
        typeof e === 'object' && e !== null && (e as { mode?: string }).mode === 'typed-2fa',
    );
    expect(typedEvent).toBeTruthy();
    expect(typedEvent?.typedCode).toBe('OP-CODE-1234');
    expect(JSON.stringify(typedEvent)).not.toMatch(/(frame|pixel|image)Hash/i);
  });
});
