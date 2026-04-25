import {
  parseNotificationsResponse,
  isNotificationChannelMessage,
  parseWsMessage,
  shouldRefetchForMessage,
  buildWsUrl,
  buildSubscribePayload,
  startNotificationEffect,
  POLL_INTERVAL_MS,
  RECONNECT_DELAY_MS,
  type NotificationEffectRefs,
} from '../useNotificationCount';

jest.mock('@/lib/apiClient', () => ({
  apiFetch: jest.fn(),
  getApiBase: jest.fn(),
  getCachedAuthToken: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: { id: 42 } })),
}));

const { apiFetch, getApiBase, getCachedAuthToken } =
  jest.requireMock('@/lib/apiClient') as {
    apiFetch: jest.Mock;
    getApiBase: jest.Mock;
    getCachedAuthToken: jest.Mock;
  };

class MockWebSocket {
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  send = jest.fn();
  close = jest.fn();
  constructor(url: string) {
    this.url = url;
  }
}

(globalThis as any).WebSocket = MockWebSocket;

function flushPromises(): Promise<void> {
  return new Promise((resolve) => process.nextTick(resolve));
}

function makeRefs(
  overrides?: Partial<NotificationEffectRefs>,
): NotificationEffectRefs {
  return {
    setUnreadCount: jest.fn(),
    userIdRef: { current: 42 },
    wsRef: { current: null },
    deadRef: { current: false },
    reconnectTimerRef: { current: null },
    ...overrides,
  };
}

describe('parseNotificationsResponse', () => {
  it('counts unread items from a plain array', () => {
    const data = [
      { isRead: false },
      { isRead: true },
      { isRead: false },
    ];
    expect(parseNotificationsResponse(data)).toBe(2);
  });

  it('handles a { data: [...] } envelope', () => {
    const data = {
      data: [{ isRead: false }, { isRead: false }, { isRead: true }],
    };
    expect(parseNotificationsResponse(data)).toBe(2);
  });

  it('returns 0 when all notifications are read', () => {
    expect(
      parseNotificationsResponse([{ isRead: true }, { isRead: true }]),
    ).toBe(0);
  });

  it('returns 0 for an empty array', () => {
    expect(parseNotificationsResponse([])).toBe(0);
  });

  it('returns 0 when the envelope has no data field', () => {
    expect(parseNotificationsResponse({})).toBe(0);
  });
});

describe('parseWsMessage', () => {
  it('parses valid JSON into a message object', () => {
    const raw = JSON.stringify({ type: 'message', channel: 'notifications' });
    expect(parseWsMessage(raw)).toEqual({ type: 'message', channel: 'notifications' });
  });

  it('returns null for invalid JSON', () => {
    expect(parseWsMessage('not json')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseWsMessage('')).toBeNull();
  });
});

describe('isNotificationChannelMessage', () => {
  it('returns true for a notifications channel message', () => {
    const raw = JSON.stringify({
      type: 'message',
      channel: 'notifications',
      event: 'new_notification',
    });
    expect(isNotificationChannelMessage(raw)).toBe(true);
  });

  it('returns true for a notifications_read event on the notifications channel', () => {
    const raw = JSON.stringify({
      type: 'message',
      channel: 'notifications',
      event: 'notifications_read',
    });
    expect(isNotificationChannelMessage(raw)).toBe(true);
  });

  it('returns false when channel is not notifications', () => {
    const raw = JSON.stringify({
      type: 'message',
      channel: 'alerts',
      event: 'new_alert',
    });
    expect(isNotificationChannelMessage(raw)).toBe(false);
  });

  it('returns false when type is not message', () => {
    const raw = JSON.stringify({
      type: 'subscribe_ack',
      channel: 'notifications',
    });
    expect(isNotificationChannelMessage(raw)).toBe(false);
  });

  it('returns false for invalid JSON', () => {
    expect(isNotificationChannelMessage('not json')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isNotificationChannelMessage('')).toBe(false);
  });
});

describe('shouldRefetchForMessage — user-scoped filtering', () => {
  it('returns true for new_notification regardless of userId', () => {
    expect(
      shouldRefetchForMessage(
        { type: 'message', channel: 'notifications', event: 'new_notification' },
        42,
      ),
    ).toBe(true);
  });

  it('returns true for notifications_read when userId matches (number)', () => {
    expect(
      shouldRefetchForMessage(
        { type: 'message', channel: 'notifications', event: 'notifications_read', data: { userId: 42 } },
        42,
      ),
    ).toBe(true);
  });

  it('returns true for notifications_read when userId matches (string vs number coercion)', () => {
    expect(
      shouldRefetchForMessage(
        { type: 'message', channel: 'notifications', event: 'notifications_read', data: { userId: '42' } },
        42,
      ),
    ).toBe(true);
  });

  it('returns false for notifications_read when userId does not match', () => {
    expect(
      shouldRefetchForMessage(
        { type: 'message', channel: 'notifications', event: 'notifications_read', data: { userId: 99 } },
        42,
      ),
    ).toBe(false);
  });

  it('returns false for notifications_read when currentUserId is undefined', () => {
    expect(
      shouldRefetchForMessage(
        { type: 'message', channel: 'notifications', event: 'notifications_read', data: { userId: 42 } },
        undefined,
      ),
    ).toBe(false);
  });

  it('returns false for non-notification channels', () => {
    expect(
      shouldRefetchForMessage(
        { type: 'message', channel: 'alerts', event: 'new_alert' },
        42,
      ),
    ).toBe(false);
  });

  it('returns false when type is not message', () => {
    expect(
      shouldRefetchForMessage(
        { type: 'subscribe_ack', channel: 'notifications' },
        42,
      ),
    ).toBe(false);
  });

  it('returns true for notification channel messages without a specific event', () => {
    expect(
      shouldRefetchForMessage(
        { type: 'message', channel: 'notifications' },
        42,
      ),
    ).toBe(true);
  });
});

describe('buildWsUrl', () => {
  it('converts https base to wss', () => {
    expect(buildWsUrl('https://api.example.com')).toBe(
      'wss://api.example.com/api/ws',
    );
  });

  it('converts http base to ws', () => {
    expect(buildWsUrl('http://localhost:3000')).toBe(
      'ws://localhost:3000/api/ws',
    );
  });
});

describe('buildSubscribePayload', () => {
  it('includes token when provided', () => {
    expect(buildSubscribePayload('abc123')).toEqual({
      type: 'subscribe',
      channel: 'notifications',
      token: 'abc123',
    });
  });

  it('omits token when null', () => {
    const payload = buildSubscribePayload(null);
    expect(payload).toEqual({ type: 'subscribe', channel: 'notifications' });
    expect(payload).not.toHaveProperty('token');
  });
});

describe('startNotificationEffect — lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
    apiFetch.mockReset();
    getApiBase.mockReset();
    getCachedAuthToken.mockReset();
    getApiBase.mockReturnValue('https://api.example.com');
    getCachedAuthToken.mockReturnValue('tok_123');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls apiFetch on mount (initial fetch)', async () => {
    apiFetch.mockResolvedValue([{ isRead: false }, { isRead: true }]);
    const refs = makeRefs();

    startNotificationEffect(refs);
    await flushPromises();

    expect(apiFetch).toHaveBeenCalledWith('/api/notifications?limit=50');
  });

  it('sets unread count from the initial fetch response', async () => {
    apiFetch.mockResolvedValue([
      { isRead: false },
      { isRead: false },
      { isRead: true },
    ]);
    const refs = makeRefs();

    startNotificationEffect(refs);
    await flushPromises();

    expect(refs.setUnreadCount).toHaveBeenCalledWith(2);
  });

  it('handles { data: [...] } envelope in initial fetch', async () => {
    apiFetch.mockResolvedValue({
      data: [{ isRead: false }],
    });
    const refs = makeRefs();

    startNotificationEffect(refs);
    await flushPromises();

    expect(refs.setUnreadCount).toHaveBeenCalledWith(1);
  });

  it('opens a WebSocket connection on mount', () => {
    apiFetch.mockResolvedValue([]);
    const refs = makeRefs();

    startNotificationEffect(refs);

    expect(refs.wsRef.current).toBeInstanceOf(MockWebSocket);
    expect((refs.wsRef.current as unknown as MockWebSocket).url).toBe(
      'wss://api.example.com/api/ws',
    );
  });

  it('sends a subscribe message with token on WS open', () => {
    apiFetch.mockResolvedValue([]);
    const refs = makeRefs();

    startNotificationEffect(refs);

    const ws = refs.wsRef.current as unknown as MockWebSocket;
    ws.onopen!();

    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'subscribe',
        channel: 'notifications',
        token: 'tok_123',
      }),
    );
  });

  it('re-fetches when receiving a new_notification WS message', async () => {
    apiFetch.mockResolvedValue([]);
    const refs = makeRefs();

    startNotificationEffect(refs);
    await flushPromises();

    apiFetch.mockResolvedValue([{ isRead: false }]);
    const ws = refs.wsRef.current as unknown as MockWebSocket;
    ws.onmessage!({
      data: JSON.stringify({
        type: 'message',
        channel: 'notifications',
        event: 'new_notification',
      }),
    });
    await flushPromises();

    expect(apiFetch).toHaveBeenCalledTimes(2);
    expect(refs.setUnreadCount).toHaveBeenLastCalledWith(1);
  });

  it('re-fetches when receiving a notifications_read WS message for the current user', async () => {
    apiFetch
      .mockResolvedValueOnce([{ isRead: false }, { isRead: false }])
      .mockResolvedValueOnce([{ isRead: true }, { isRead: false }]);
    const refs = makeRefs({ userIdRef: { current: 42 } });

    startNotificationEffect(refs);
    await flushPromises();

    expect(refs.setUnreadCount).toHaveBeenCalledWith(2);

    const ws = refs.wsRef.current as unknown as MockWebSocket;
    ws.onmessage!({
      data: JSON.stringify({
        type: 'message',
        channel: 'notifications',
        event: 'notifications_read',
        data: { userId: 42 },
      }),
    });
    await flushPromises();

    expect(refs.setUnreadCount).toHaveBeenLastCalledWith(1);
  });

  it('ignores notifications_read WS messages for a different user', async () => {
    apiFetch.mockResolvedValue([]);
    const refs = makeRefs({ userIdRef: { current: 42 } });

    startNotificationEffect(refs);
    await flushPromises();

    const callsBefore = apiFetch.mock.calls.length;

    const ws = refs.wsRef.current as unknown as MockWebSocket;
    ws.onmessage!({
      data: JSON.stringify({
        type: 'message',
        channel: 'notifications',
        event: 'notifications_read',
        data: { userId: 99 },
      }),
    });
    await flushPromises();

    expect(apiFetch).toHaveBeenCalledTimes(callsBefore);
  });

  it('ignores WS messages on non-notification channels', async () => {
    apiFetch.mockResolvedValue([]);
    const refs = makeRefs();

    startNotificationEffect(refs);
    await flushPromises();

    const callsBefore = apiFetch.mock.calls.length;

    const ws = refs.wsRef.current as unknown as MockWebSocket;
    ws.onmessage!({
      data: JSON.stringify({
        type: 'message',
        channel: 'alerts',
        event: 'new_alert',
      }),
    });
    await flushPromises();

    expect(apiFetch).toHaveBeenCalledTimes(callsBefore);
  });

  it('ignores WS messages with invalid JSON', async () => {
    apiFetch.mockResolvedValue([]);
    const refs = makeRefs();

    startNotificationEffect(refs);
    await flushPromises();

    const callsBefore = apiFetch.mock.calls.length;

    const ws = refs.wsRef.current as unknown as MockWebSocket;
    ws.onmessage!({ data: 'not valid json' });
    await flushPromises();

    expect(apiFetch).toHaveBeenCalledTimes(callsBefore);
  });

  it('does not set state if apiFetch throws', async () => {
    apiFetch.mockRejectedValue(new Error('network error'));
    const refs = makeRefs();

    startNotificationEffect(refs);
    await flushPromises();

    expect(refs.setUnreadCount).not.toHaveBeenCalled();
  });

  it('polls on the configured interval', async () => {
    apiFetch.mockResolvedValue([]);
    const refs = makeRefs();

    startNotificationEffect(refs);
    await flushPromises();

    const callsAfterMount = apiFetch.mock.calls.length;

    jest.advanceTimersByTime(POLL_INTERVAL_MS);
    await flushPromises();

    expect(apiFetch).toHaveBeenCalledTimes(callsAfterMount + 1);
  });

  it('reconnects after WS closes (with delay)', () => {
    apiFetch.mockResolvedValue([]);
    const refs = makeRefs();

    startNotificationEffect(refs);

    const firstWs = refs.wsRef.current as unknown as MockWebSocket;
    refs.wsRef.current = null;
    firstWs.onclose!();

    expect(refs.wsRef.current).toBeNull();

    jest.advanceTimersByTime(RECONNECT_DELAY_MS);

    expect(refs.wsRef.current).toBeInstanceOf(MockWebSocket);
    expect(refs.wsRef.current).not.toBe(firstWs);
  });

  it('does not reconnect when dead flag is set', () => {
    apiFetch.mockResolvedValue([]);
    const refs = makeRefs();

    startNotificationEffect(refs);

    refs.deadRef.current = true;
    const ws = refs.wsRef.current as unknown as MockWebSocket;
    refs.wsRef.current = null;
    ws.onclose!();

    jest.advanceTimersByTime(RECONNECT_DELAY_MS * 2);

    expect(refs.wsRef.current).toBeNull();
  });

  it('does not open WS when getApiBase returns empty', () => {
    getApiBase.mockReturnValue('');
    apiFetch.mockResolvedValue([]);
    const refs = makeRefs();

    startNotificationEffect(refs);

    expect(refs.wsRef.current).toBeNull();
  });
});

describe('startNotificationEffect — cleanup on unmount', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
    apiFetch.mockReset().mockResolvedValue([]);
    getApiBase.mockReset().mockReturnValue('https://api.example.com');
    getCachedAuthToken.mockReset().mockReturnValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('closes the WebSocket on cleanup', () => {
    const refs = makeRefs();
    const cleanup = startNotificationEffect(refs);
    const ws = refs.wsRef.current as unknown as MockWebSocket;

    cleanup();

    expect(ws.close).toHaveBeenCalled();
  });

  it('sets the dead flag to prevent reconnection', () => {
    const refs = makeRefs();
    const cleanup = startNotificationEffect(refs);

    cleanup();

    expect(refs.deadRef.current).toBe(true);
  });

  it('clears the poll interval so no further fetches occur', async () => {
    const refs = makeRefs();
    const cleanup = startNotificationEffect(refs);
    await flushPromises();

    const callsAfterMount = apiFetch.mock.calls.length;

    cleanup();

    jest.advanceTimersByTime(POLL_INTERVAL_MS * 3);
    await flushPromises();

    expect(apiFetch).toHaveBeenCalledTimes(callsAfterMount);
  });

  it('clears a pending reconnect timer', () => {
    const refs = makeRefs();
    const cleanup = startNotificationEffect(refs);

    const ws = refs.wsRef.current as unknown as MockWebSocket;
    refs.wsRef.current = null;
    ws.onclose!();

    expect(refs.reconnectTimerRef.current).not.toBeNull();

    cleanup();

    jest.advanceTimersByTime(RECONNECT_DELAY_MS * 2);

    expect(refs.deadRef.current).toBe(true);
  });

  it('does not update state after cleanup (mounted guard)', async () => {
    let resolveApiFetch: (v: unknown) => void;
    apiFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveApiFetch = resolve;
        }),
    );
    const refs = makeRefs();
    const cleanup = startNotificationEffect(refs);

    cleanup();

    resolveApiFetch!([{ isRead: false }, { isRead: false }, { isRead: false }]);
    await flushPromises();

    expect(refs.setUnreadCount).not.toHaveBeenCalled();
  });
});
