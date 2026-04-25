/**
 * Mobile test: when the AuthContext exposes a `sessionRevocation` value, the
 * sign-in screen must render the "Session ended" notice with the server's
 * message instead of silently dropping the user back to the login button.
 *
 * The component is invoked as a plain function (no React renderer) so we get a
 * raw JSX tree to traverse.  Every hook the component calls must therefore be
 * replaced with a simple non-hook implementation via jest.mock.
 */
import { isValidElement, type ReactElement } from 'react';

jest.mock('react', () => {
  const actual: typeof import('react') = jest.requireActual('react');
  return {
    ...actual,
    useState: (init: unknown) => [init, jest.fn()],
    useRef: (init: unknown) => ({ current: init }),
    useCallback: (fn: unknown) => fn,
  };
});

jest.mock('@/context/BiometricSignInContext', () => ({
  useBiometricSignIn: () => ({
    status: { isEnrolled: false, enrolledAt: null, deviceId: null, platform: null },
    isAvailable: false,
    checkEnrollment: jest.fn(),
    enroll: jest.fn(),
    signIn: jest.fn(),
    revoke: jest.fn(),
    revokeLocal: jest.fn(),
    performStepUp: jest.fn(),
  }),
}));

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    background: '#000',
    cream: '#f5f3e8',
    creamDim: '#bbb',
    gold: '#c9a84c',
    goldBorder: 'rgba(201,168,76,0.35)',
    mutedForeground: '#888',
  }),
}));

const dismissMock = jest.fn();
let mockSessionRevocation: { code: string; message: string; at: string } | null = null;

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isReady: true,
    login: jest.fn(),
    logout: jest.fn(),
    signOut: jest.fn(),
    buildHeaders: (extra?: Record<string, string>) => ({
      'Content-Type': 'application/json',
      ...extra,
    }),
    buildWsAuthMessage: () => ({ type: 'auth', token: '' }),
    sessionRevocation: mockSessionRevocation,
    dismissSessionRevocation: dismissMock,
  }),
}));

import AuthScreen from '../app/auth';

type AnyElement = ReactElement<{ children?: unknown; [k: string]: unknown }>;

function flattenChildren(children: unknown): AnyElement[] {
  const out: AnyElement[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (isValidElement(node)) {
      out.push(node as AnyElement);
      walk((node.props as { children?: unknown })?.children);
    }
  };
  walk(children);
  return out;
}

function collectText(node: unknown): string[] {
  const texts: string[] = [];
  const walk = (n: unknown) => {
    if (n == null || typeof n === 'boolean') return;
    if (typeof n === 'string' || typeof n === 'number') {
      texts.push(String(n));
      return;
    }
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    if (isValidElement(n)) {
      walk((n.props as { children?: unknown })?.children);
    }
  };
  walk(node);
  return texts;
}

function renderAuthScreen(): AnyElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tree = (AuthScreen as unknown as () => AnyElement)();
  return tree;
}

describe('AuthScreen — session revocation notice', () => {
  beforeEach(() => {
    dismissMock.mockClear();
    mockSessionRevocation = null;
  });

  it('does NOT render a "Session ended" notice when sessionRevocation is null', () => {
    mockSessionRevocation = null;
    const tree = renderAuthScreen();
    const allText = collectText(tree).join(' | ');
    expect(allText).toMatch(/Sign In/i); // baseline: the screen rendered
    expect(allText).not.toMatch(/Session ended/i);
  });

  it('renders the "Session ended" notice with the server-supplied message', () => {
    mockSessionRevocation = {
      code: 'SESSION_REVOKED',
      message: 'An administrator updated your access — please sign in again.',
      at: '2030-01-01T00:00:00Z',
    };

    const tree = renderAuthScreen();
    const elements = flattenChildren(tree);

    // 1. An accessibilityRole="alert" container is mounted.
    const alertNode = elements.find(
      (el) => (el.props as { accessibilityRole?: string }).accessibilityRole === 'alert',
    );
    expect(alertNode).toBeDefined();

    // 2. The label "Session ended" appears inside that alert.
    const alertText = collectText(alertNode).join(' | ');
    expect(alertText).toMatch(/Session ended/i);

    // 3. The exact server message is rendered for the user.
    expect(alertText).toContain(
      'An administrator updated your access — please sign in again.',
    );

    // 4. A dismiss control is wired to the context callback.
    const dismiss = elements.find(
      (el) =>
        (el.props as { accessibilityRole?: string }).accessibilityRole === 'button' &&
        collectText(el).join(' ').toLowerCase().includes('dismiss'),
    );
    expect(dismiss).toBeDefined();
    const onPress = (dismiss?.props as { onPress?: () => void }).onPress;
    expect(typeof onPress).toBe('function');
    onPress?.();
    expect(dismissMock).toHaveBeenCalledTimes(1);
  });

  it('renders the REFRESH_TOKEN_REPLAY message when that code is set', () => {
    mockSessionRevocation = {
      code: 'REFRESH_TOKEN_REPLAY',
      message: 'Your session was ended for security reasons — please sign in again.',
      at: '2030-01-01T00:00:00Z',
    };
    const tree = renderAuthScreen();
    const allText = collectText(tree).join(' | ');
    expect(allText).toMatch(/Session ended/i);
    expect(allText).toContain('Your session was ended for security reasons');
  });
});
