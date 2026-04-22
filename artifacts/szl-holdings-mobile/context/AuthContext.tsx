import { setMobileUserTimeZone } from '@szl-holdings/mobile-shared/utils';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { identifyUser, resetUser } from '@/lib/analytics';
import { clearSentryUser, setSentryUser } from '@/lib/sentry';

WebBrowser.maybeCompleteAuthSession();

export const AUTH_TOKEN_KEY = 'cortex_auth_token';
export const AUTH_REFRESH_TOKEN_KEY = 'cortex_refresh_token';
export const AUTH_TOKEN_EXPIRES_AT_KEY = 'cortex_token_expires_at';
export const AUTH_REFRESH_EXPIRES_AT_KEY = 'cortex_refresh_token_expires_at';
const ISSUER_URL = process.env.EXPO_PUBLIC_ISSUER_URL ?? 'https://replit.com/oidc';
const REFRESH_LEAD_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Session-revocation signaling
// ---------------------------------------------------------------------------
// The API server returns `code: SESSION_REVOKED` when an admin revokes a
// session (or bumps the user's session version) and `code: REFRESH_TOKEN_REPLAY`
// when a refresh-token replay is detected. We surface a friendly explanation
// on the sign-in screen instead of silently bouncing the user.

export interface SessionRevocationInfo {
  code: 'SESSION_REVOKED' | 'REFRESH_TOKEN_REPLAY' | string;
  message: string;
  at: string;
  /** Pathname (within the expo-router shell) the user was on when the
   * session was force-revoked. The auth screen reads this to deep-link the
   * user back to the same screen after a successful sign-in. */
  returnTo?: string | null;
}

const REVOCATION_LISTENERS = new Set<(info: SessionRevocationInfo | null) => void>();
let _latestRevocation: SessionRevocationInfo | null = null;

// Last known in-app pathname tracked by the AppShell. Updated on every
// expo-router navigation via `setLastKnownAppPath`.
let _lastKnownAppPath: string | null = null;
// Pending return path captured at the moment of revocation, consumed by the
// auth screen after the user successfully signs back in. Kept separate from
// `_latestRevocation` so it survives `clearSessionRevocation()` (which fires
// at the start of `login()`) and is only cleared on consumption.
let _pendingReturnPath: string | null = null;

const RETURN_PATH_BLOCKLIST = new Set(['/auth', '/+not-found']);

function isUsableReturnPath(path: string | null | undefined): path is string {
  if (typeof path !== 'string' || path.length === 0) return false;
  if (!path.startsWith('/')) return false;
  if (RETURN_PATH_BLOCKLIST.has(path)) return false;
  return true;
}

/** Called from the AppShell whenever the active expo-router pathname changes. */
export function setLastKnownAppPath(path: string | null | undefined): void {
  if (isUsableReturnPath(path)) {
    _lastKnownAppPath = path;
  }
}

/** Read (and clear) the path the user should be deep-linked back to after sign-in. */
export function consumePendingReturnPath(): string | null {
  const v = _pendingReturnPath;
  _pendingReturnPath = null;
  return v;
}

/** Visible mostly for tests — stash a return path without going through revocation. */
export function setPendingReturnPath(path: string | null): void {
  _pendingReturnPath = isUsableReturnPath(path) ? path : null;
}

function defaultRevocationMessage(code: string): string {
  if (code === 'REFRESH_TOKEN_REPLAY') {
    return 'Your session was ended for security reasons — please sign in again.';
  }
  return 'An administrator updated your access — please sign in again.';
}

/** Called by apiClient when an API response carries a revocation code. */
export function recordSessionRevocation(input: { code: string; message?: string }): void {
  // Snapshot the page the user was on so the auth screen can deep-link the
  // user back to it after a successful sign-in. Done before listeners fire
  // because listeners typically wipe the auth state and route to /auth.
  if (isUsableReturnPath(_lastKnownAppPath)) {
    _pendingReturnPath = _lastKnownAppPath;
  }
  const info: SessionRevocationInfo = {
    code: input.code,
    message: input.message?.trim() || defaultRevocationMessage(input.code),
    at: new Date().toISOString(),
    returnTo: _pendingReturnPath,
  };
  _latestRevocation = info;
  REVOCATION_LISTENERS.forEach((listener) => {
    try {
      listener(info);
    } catch {
      /* ignore listener failures */
    }
  });
}

export function clearSessionRevocation(): void {
  _latestRevocation = null;
  REVOCATION_LISTENERS.forEach((listener) => {
    try {
      listener(null);
    } catch {
      /* ignore */
    }
  });
}

export function getSessionRevocation(): SessionRevocationInfo | null {
  return _latestRevocation;
}

function subscribeSessionRevocation(
  listener: (info: SessionRevocationInfo | null) => void,
): () => void {
  REVOCATION_LISTENERS.add(listener);
  return () => {
    REVOCATION_LISTENERS.delete(listener);
  };
}

const REVOCATION_CODES = new Set(['SESSION_REVOKED', 'REFRESH_TOKEN_REPLAY']);

function pickRevocationCodeFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const code = (body as Record<string, unknown>)['code'];
  return typeof code === 'string' && REVOCATION_CODES.has(code) ? code : null;
}

function pickServerMessageFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const error = record['error'];
  if (typeof error === 'string' && error.trim()) return error;
  const message = record['message'];
  if (typeof message === 'string' && message.trim()) return message;
  return null;
}

export interface AuthUser {
  id: string;
  displayName: string | null;
  username?: string | null;
  email: string | null;
  avatarUrl: string | null;
  roles: string[];
}

interface StoredTokens {
  token: string;
  refreshToken: string | null;
  expiresAt: string | null;
  refreshTokenExpiresAt: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  buildHeaders: (extra?: Record<string, string>) => Record<string, string>;
  buildWsAuthMessage: () => { type: string; token: string };
  signals?: unknown[];
  sessionRevocation: SessionRevocationInfo | null;
  dismissSessionRevocation: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isReady: false,
  login: async () => {},
  logout: async () => {},
  signOut: async () => {},
  buildHeaders: (extra) => ({ 'Content-Type': 'application/json', ...extra }),
  buildWsAuthMessage: () => ({ type: 'auth', token: '' }),
  signals: [],
  sessionRevocation: null,
  dismissSessionRevocation: () => {},
});

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return '';
}

function getClientId(): string {
  return process.env.EXPO_PUBLIC_REPL_ID ?? '';
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

async function secureDel(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
}

async function readStoredTokens(): Promise<StoredTokens | null> {
  const token = await secureGet(AUTH_TOKEN_KEY);
  if (!token) return null;
  const [refreshToken, expiresAt, refreshTokenExpiresAt] = await Promise.all([
    secureGet(AUTH_REFRESH_TOKEN_KEY),
    secureGet(AUTH_TOKEN_EXPIRES_AT_KEY),
    secureGet(AUTH_REFRESH_EXPIRES_AT_KEY),
  ]);
  return { token, refreshToken, expiresAt, refreshTokenExpiresAt };
}

async function persistTokens(tokens: StoredTokens): Promise<void> {
  await secureSet(AUTH_TOKEN_KEY, tokens.token);
  if (tokens.refreshToken) await secureSet(AUTH_REFRESH_TOKEN_KEY, tokens.refreshToken);
  else await secureDel(AUTH_REFRESH_TOKEN_KEY);
  if (tokens.expiresAt) await secureSet(AUTH_TOKEN_EXPIRES_AT_KEY, tokens.expiresAt);
  else await secureDel(AUTH_TOKEN_EXPIRES_AT_KEY);
  if (tokens.refreshTokenExpiresAt)
    await secureSet(AUTH_REFRESH_EXPIRES_AT_KEY, tokens.refreshTokenExpiresAt);
  else await secureDel(AUTH_REFRESH_EXPIRES_AT_KEY);
}

async function clearStoredTokens(): Promise<void> {
  await Promise.all([
    secureDel(AUTH_TOKEN_KEY),
    secureDel(AUTH_REFRESH_TOKEN_KEY),
    secureDel(AUTH_TOKEN_EXPIRES_AT_KEY),
    secureDel(AUTH_REFRESH_EXPIRES_AT_KEY),
  ]);
}

function tokenIsNearExpiry(expiresAt: string | null, now = Date.now()): boolean {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return false;
  return t - now <= REFRESH_LEAD_MS;
}

const DEMO_MODE =
  process.env.EXPO_PUBLIC_DEMO_MODE === '1' || process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

const DEMO_USER: AuthUser = {
  id: 'demo-compliance-officer',
  displayName: 'Avery Chen',
  username: 'avery.chen',
  email: 'avery.chen@szlholdings.example',
  avatarUrl: null,
  roles: ['compliance_officer', 'approver', 'operator'],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEMO_MODE ? DEMO_USER : null);
  const [accessToken, setAccessToken] = useState<string | null>(
    DEMO_MODE ? 'demo-access-token' : null,
  );
  const [isLoading, setIsLoading] = useState(!DEMO_MODE);
  const [sessionRevocation, setSessionRevocation] = useState<SessionRevocationInfo | null>(() =>
    getSessionRevocation(),
  );

  const tokensRef = useRef<StoredTokens | null>(null);
  const refreshInFlightRef = useRef<Promise<StoredTokens | null> | null>(null);

  const wipeAuth = useCallback(async () => {
    tokensRef.current = null;
    await clearStoredTokens();
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    return subscribeSessionRevocation((info) => {
      setSessionRevocation(info);
      if (info) {
        // Drop any locally cached identity so the auth screen renders.
        wipeAuth().catch(() => {});
        setIsLoading(false);
      }
    });
  }, [wipeAuth]);

  const discovery = AuthSession.useAutoDiscovery(ISSUER_URL);
  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: getClientId(),
      scopes: ['openid', 'email', 'profile', 'offline_access'],
      redirectUri,
      prompt: AuthSession.Prompt.Login,
    },
    discovery,
  );

  /**
   * Rotate the refresh token. Concurrent callers share the in-flight
   * request. Returns the new tokens, or null if the user must re-login.
   */
  const refreshTokens = useCallback(async (): Promise<StoredTokens | null> => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;
    const current = tokensRef.current;
    if (!current?.refreshToken) {
      await wipeAuth();
      return null;
    }
    refreshInFlightRef.current = (async () => {
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: current.refreshToken }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (json?.code === 'REFRESH_TOKEN_REPLAY') {
            console.warn('[Auth] Refresh token replay detected; forcing re-login');
            recordSessionRevocation({
              code: 'REFRESH_TOKEN_REPLAY',
              message: pickServerMessageFromBody(json) ?? undefined,
            });
            await wipeAuth();
            return null;
          }
          if (res.status === 401) {
            await wipeAuth();
            return null;
          }
          throw new Error(json?.message ?? json?.error ?? `Refresh failed (${res.status})`);
        }
        const data = json?.data ?? json;
        if (!data?.token || !data?.refreshToken) {
          throw new Error('Malformed refresh response');
        }
        const next: StoredTokens = {
          token: data.token,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt ?? null,
          refreshTokenExpiresAt: data.refreshTokenExpiresAt ?? null,
        };
        tokensRef.current = next;
        await persistTokens(next);
        setAccessToken(next.token);
        return next;
      } finally {
        refreshInFlightRef.current = null;
      }
    })();
    return refreshInFlightRef.current;
  }, [wipeAuth]);

  const fetchUser = useCallback(async () => {
    if (DEMO_MODE) {
      setUser(DEMO_USER);
      setAccessToken('demo-access-token');
      setIsLoading(false);
      return;
    }
    try {
      let stored = tokensRef.current ?? (await readStoredTokens());
      if (!stored) {
        setAccessToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      tokensRef.current = stored;

      // Pre-emptively rotate if we're inside the lead window.
      if (tokenIsNearExpiry(stored.expiresAt)) {
        const refreshed = await refreshTokens().catch(() => null);
        if (refreshed) stored = refreshed;
      }

      const apiBase = getApiBaseUrl();
      let res = await fetch(`${apiBase}/api/auth/me`, {
        headers: { Authorization: `Bearer ${stored.token}` },
      });

      if (res.status === 401) {
        // Before trying refresh, clone the response to check for revocation codes in the original failure.
        const body = await res
          .clone()
          .json()
          .catch(() => null);
        const code = pickRevocationCodeFromBody(body);

        if (stored.refreshToken && !code) {
          const refreshed = await refreshTokens().catch(() => null);
          if (refreshed) {
            const retry = await fetch(`${apiBase}/api/auth/me`, {
              headers: { Authorization: `Bearer ${refreshed.token}` },
            });
            if (retry.ok) {
              const json = await retry.json();
              const data = json.data ?? json;
              if (data?.id) {
                setAccessToken(refreshed.token);
                setUser({
                  id: String(data.id),
                  displayName: data.displayName ?? null,
                  email: data.email ?? null,
                  avatarUrl: data.avatarUrl ?? null,
                  roles: Array.isArray(data.roles) ? data.roles : [],
                });
                setIsLoading(false);
                return;
              }
            }
            res = retry; // use the retry response for further checks if it's not ok
          }
        }

        // If we're still here, it means refresh failed or was skipped.
        // If we didn't check for revocation code yet (because we tried refresh), check now.
        const finalBody =
          res === (await res.clone())
            ? body
            : await res
                .clone()
                .json()
                .catch(() => null);
        const finalCode = pickRevocationCodeFromBody(finalBody) || code;

        if (finalCode) {
          recordSessionRevocation({
            code: finalCode,
            message: pickServerMessageFromBody(finalBody || body) ?? undefined,
          });
        }

        await wipeAuth();
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        await wipeAuth();
        setIsLoading(false);
        return;
      }

      setAccessToken(stored.token);

      const json = await res.json();
      const data = json.data ?? json;
      if (data?.id) {
        setUser({
          id: String(data.id),
          displayName: data.displayName ?? null,
          email: data.email ?? null,
          avatarUrl: data.avatarUrl ?? null,
          roles: Array.isArray(data.roles) ? data.roles : [],
        });
      } else {
        await wipeAuth();
      }
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshTokens, wipeAuth]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Refresh on app foreground — silently extends the session so users
  // who background the app for hours don't get bounced back to login.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state !== 'active') return;
      const stored = tokensRef.current;
      if (!stored?.refreshToken) return;
      if (tokenIsNearExpiry(stored.expiresAt)) {
        refreshTokens().catch((err) => {
          console.warn('[Auth] Foreground refresh failed:', err);
        });
      }
    });
    return () => sub.remove();
  }, [refreshTokens]);

  useEffect(() => {
    if (user) {
      identifyUser({
        id: user.id,
        email: user.email ?? undefined,
        name: user.displayName ?? undefined,
      });
      setSentryUser({
        userId: user.id,
        email: user.email ?? undefined,
        username: user.displayName ?? undefined,
      });
    } else {
      resetUser();
      clearSentryUser();
    }
  }, [user]);

  // Sync the saved IANA time zone preference from the server so the shared
  // mobile formatters (`@szl-holdings/mobile-shared/utils`) render visible
  // timestamps in the user's chosen zone instead of the device default.
  useEffect(() => {
    if (!user || !accessToken) {
      setMobileUserTimeZone(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/preferences`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok || cancelled) return;
        const json = await res.json().catch(() => null);
        const prefs = json?.data ?? json;
        const zone = prefs?.time_zone;
        setMobileUserTimeZone(typeof zone === 'string' ? zone : null);
      } catch (err) {
        if (!cancelled) {
          console.warn('[Auth] Failed to load user preferences:', err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, accessToken]);

  useEffect(() => {
    if (!response || response.type !== 'success' || !request) return;
    (async () => {
      try {
        setIsLoading(true);
        const { code, state } = response.params;
        const apiBase = getApiBaseUrl();
        const tokenResp = await fetch(`${apiBase}/api/mobile-auth/token-exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            redirect_uri: redirectUri,
            code_verifier: request.codeVerifier,
            state: state ?? '',
          }),
        });
        if (!tokenResp.ok) {
          setIsLoading(false);
          return;
        }
        const tokenData = await tokenResp.json();
        const accessToken = tokenData.access_token ?? tokenData.token ?? tokenData.accessToken;
        if (!accessToken) {
          setIsLoading(false);
          return;
        }
        const stored: StoredTokens = {
          token: accessToken,
          refreshToken: tokenData.refreshToken ?? tokenData.refresh_token ?? null,
          expiresAt: tokenData.expiresAt ?? null,
          refreshTokenExpiresAt: tokenData.refreshTokenExpiresAt ?? null,
        };
        tokensRef.current = stored;
        await persistTokens(stored);
        setAccessToken(stored.token);
        await fetchUser();
      } catch (err) {
        console.error('[Auth] Token exchange error:', err);
        setIsLoading(false);
      }
    })();
  }, [response, request, redirectUri, fetchUser]);

  const login = useCallback(async () => {
    // A successful sign-in attempt invalidates any previous revocation notice.
    clearSessionRevocation();
    try {
      await promptAsync();
    } catch (err) {
      console.error('[Auth] Login error:', err);
    }
  }, [promptAsync]);

  const dismissSessionRevocation = useCallback(() => {
    clearSessionRevocation();
  }, []);

  const logout = useCallback(async () => {
    try {
      const stored = tokensRef.current ?? (await readStoredTokens());
      if (stored?.token) {
        const apiBase = getApiBaseUrl();
        await fetch(`${apiBase}/api/mobile-auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${stored.token}` },
        });
      }
    } catch {
    } finally {
      await wipeAuth();
    }
  }, [wipeAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isReady: !isLoading,
        login,
        logout,
        signOut: logout,
        buildHeaders: (extra?: Record<string, string>) => {
          const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
          if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
          return headers;
        },
        buildWsAuthMessage: () => {
          return { type: 'auth', token: accessToken ?? '' };
        },
        signals: [],
        sessionRevocation,
        dismissSessionRevocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
