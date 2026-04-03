import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import { buildApiUrl } from "@/constants/api";

const TOKEN_KEY = "lyte_session_token";
const API_KEY_KEY = "lyte_api_key";
const TOKEN_EXPIRY_KEY = "lyte_token_expiry";
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface AuthState {
  token: string | null;
  apiKey: string | null;
  isReady: boolean;
  isOffline: boolean;
}

interface AuthContextValue extends AuthState {
  setCredentials: (token: string | null, apiKey: string | null, expiresAt?: number) => Promise<void>;
  clearCredentials: () => Promise<void>;
  buildHeaders: () => Record<string, string>;
  buildWsAuthMessage: () => string | null;
  refreshTokenIfNeeded: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  apiKey: null,
  isReady: false,
  isOffline: false,
  setCredentials: async () => {},
  clearCredentials: async () => {},
  buildHeaders: () => ({ "Content-Type": "application/json" }),
  buildWsAuthMessage: () => null,
  refreshTokenIfNeeded: async () => {},
});

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureSet(key: string, value: string | null): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, value);
      }
    } catch {}
    return;
  }
  try {
    if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ token: null, apiKey: null, isReady: false, isOffline: false });
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  const scheduleRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const msUntilRefresh = expiresAt - Date.now() - REFRESH_BUFFER_MS;
    if (msUntilRefresh > 0) {
      refreshTimerRef.current = setTimeout(() => {
        refreshTokenIfNeeded();
      }, msUntilRefresh);
    }
  }, []);

  const refreshTokenIfNeeded = useCallback(async () => {
    if (isRefreshingRef.current) return;
    const expiryStr = await secureGet(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return;
    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry)) return;
    if (expiry - Date.now() > REFRESH_BUFFER_MS) return;

    const currentToken = await secureGet(TOKEN_KEY);
    const currentApiKey = await secureGet(API_KEY_KEY);
    if (!currentToken && !currentApiKey) return;

    isRefreshingRef.current = true;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (currentToken) headers["Authorization"] = `Bearer ${currentToken}`;
      if (currentApiKey) headers["X-API-Key"] = currentApiKey;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(buildApiUrl("/auth/refresh"), { method: "POST", headers, signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json() as { token?: string; expiresAt?: number };
        if (data.token) {
          const newExpiry = data.expiresAt ?? Date.now() + 3600_000;
          await Promise.all([
            secureSet(TOKEN_KEY, data.token),
            secureSet(TOKEN_EXPIRY_KEY, String(newExpiry)),
          ]);
          setAuth(prev => ({ ...prev, token: data.token!, isOffline: false }));
          scheduleRefresh(newExpiry);
        }
      }
    } catch {
      setAuth(prev => ({ ...prev, isOffline: true }));
    } finally {
      isRefreshingRef.current = false;
    }
  }, [scheduleRefresh]);

  useEffect(() => {
    const load = async () => {
      const [token, apiKey, expiryStr] = await Promise.all([
        secureGet(TOKEN_KEY),
        secureGet(API_KEY_KEY),
        secureGet(TOKEN_EXPIRY_KEY),
      ]);
      setAuth({ token, apiKey, isReady: true, isOffline: false });
      if (expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        if (!isNaN(expiry)) scheduleRefresh(expiry);
      }
    };
    load();
  }, [scheduleRefresh]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") refreshTokenIfNeeded();
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [refreshTokenIfNeeded]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const setCredentials = useCallback(async (token: string | null, apiKey: string | null, expiresAt?: number) => {
    const expiry = expiresAt ?? (token ? Date.now() + 3600_000 : null);
    await Promise.all([
      secureSet(TOKEN_KEY, token),
      secureSet(API_KEY_KEY, apiKey),
      secureSet(TOKEN_EXPIRY_KEY, expiry ? String(expiry) : null),
    ]);
    setAuth(prev => ({ ...prev, token, apiKey, isOffline: false }));
    if (expiry) scheduleRefresh(expiry);
  }, [scheduleRefresh]);

  const clearCredentials = useCallback(async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    await Promise.all([
      secureSet(TOKEN_KEY, null),
      secureSet(API_KEY_KEY, null),
      secureSet(TOKEN_EXPIRY_KEY, null),
    ]);
    setAuth(prev => ({ ...prev, token: null, apiKey: null, isOffline: false }));
  }, []);

  const buildHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth.token) headers["Authorization"] = `Bearer ${auth.token}`;
    if (auth.apiKey) headers["X-API-Key"] = auth.apiKey;
    return headers;
  }, [auth.token, auth.apiKey]);

  const buildWsAuthMessage = useCallback((): string | null => {
    if (!auth.token && !auth.apiKey) return null;
    return JSON.stringify({
      type: "auth",
      ...(auth.token ? { token: auth.token } : {}),
      ...(auth.apiKey ? { apiKey: auth.apiKey } : {}),
    });
  }, [auth.token, auth.apiKey]);

  return (
    <AuthContext.Provider
      value={{ ...auth, setCredentials, clearCredentials, buildHeaders, buildWsAuthMessage, refreshTokenIfNeeded }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
